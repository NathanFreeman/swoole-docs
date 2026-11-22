# MQTT (物联网) 服务器

要想使用 MQTT（物联网）服务器，可以实例化 [`Swoole\Server`](/zh/server/tcp_udp.html) 对象，并通过配置项 [`open_mqtt_protocol`](/zh/server/setting.html#open-mqtt-protocol) 开启 MQTT 协议解析。启用后，每次收到的数据都将是一个完整的 MQTT 数据包，无需额外处理粘包问题。

配合 [simps/mqtt](https://github.com/simps/mqtt) 可以实现一套完整物联网（IOT）解决方案。

## 示例

### 零依赖 Broker

下面是一个不依赖任何第三方库的 MQTT 3.1.1 Broker，处理 `CONNECT`、`SUBSCRIBE`、`UNSUBSCRIBE`、`PUBLISH`、`PINGREQ`、`DISCONNECT` 六种报文，支持 `+` / `#` 通配符订阅和 QoS 0/1 转发，监听 MQTT 默认端口 `1883`。报文在 [`receive`](/zh/server/events.html#receive) 事件中处理，连接断开时由 [`close`](/zh/server/events.html#close) 事件清理订阅表。

```php
<?php
use Swoole\Server;

const MQTT_CONNECT = 1;
const MQTT_CONNACK = 2;
const MQTT_PUBLISH = 3;
const MQTT_PUBACK = 4;
const MQTT_SUBSCRIBE = 8;
const MQTT_SUBACK = 9;
const MQTT_UNSUBSCRIBE = 10;
const MQTT_UNSUBACK = 11;
const MQTT_PINGREQ = 12;
const MQTT_PINGRESP = 13;
const MQTT_DISCONNECT = 14;

// 解析变长编码的剩余长度，返回 [剩余长度, 可变部分的起始偏移量]
function mqttRemainingLength(string $data): array
{
    $value = 0;
    $multiplier = 1;
    $offset = 1;
    do {
        $byte = ord($data[$offset]);
        $value += ($byte & 0x7F) * $multiplier;
        $multiplier *= 128;
        $offset++;
    } while (($byte & 0x80) !== 0);

    return [$value, $offset];
}

// 读取 MQTT 字符串（2 字节大端长度 + 内容），返回 [字符串, 消耗的字节数]
function mqttReadString(string $data, int $offset): array
{
    $length = unpack('n', substr($data, $offset, 2))[1];

    return [substr($data, $offset + 2, $length), $length + 2];
}

function mqttWriteString(string $value): string
{
    return pack('n', strlen($value)) . $value;
}

// 组装完整报文：固定包头 + 剩余长度 + 可变部分
function mqttPacket(int $type, int $flags, string $body): string
{
    $length = strlen($body);
    $header = '';
    do {
        $byte = $length % 128;
        $length = intdiv($length, 128);
        $header .= chr($length > 0 ? $byte | 0x80 : $byte);
    } while ($length > 0);

    return chr(($type << 4) | $flags) . $header . $body;
}

// 主题过滤器匹配，支持单级通配符 + 和多级通配符 #
function mqttTopicMatch(string $filter, string $topic): bool
{
    $filters = explode('/', $filter);
    $topics = explode('/', $topic);

    foreach ($filters as $i => $level) {
        if ($level === '#') {
            return true;
        }
        if (!isset($topics[$i]) || ($level !== '+' && $level !== $topics[$i])) {
            return false;
        }
    }

    return count($filters) === count($topics);
}

$subscriptions = []; // fd => [主题过滤器 => 授予的 QoS]
$messageIds = [];    // fd => 已分配的下行报文标识符

$server = new Server('127.0.0.1', 1883, SWOOLE_BASE);
$server->set([
    'open_mqtt_protocol' => true, // 启用 MQTT 协议解析
    'worker_num' => 1,            // 订阅表是进程内数组，只能单 worker
]);

$server->on('connect', function (Server $server, int $fd) {
    echo "client {$fd} connected\n";
});

$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) use (&$subscriptions, &$messageIds) {
    $type = (ord($data[0]) & 0xF0) >> 4;
    $flags = ord($data[0]) & 0x0F;
    [$length, $offset] = mqttRemainingLength($data);
    $body = substr($data, $offset, $length);

    switch ($type) {
        case MQTT_CONNECT:
            $pos = 0;
            [, $used] = mqttReadString($body, $pos); // 协议名，固定为 MQTT
            $pos += $used;
            $level = ord($body[$pos]);               // 协议级别，4 表示 MQTT 3.1.1
            $pos += 4;                               // 协议级别 1 + 连接标志 1 + keep alive 2
            [$clientId] = mqttReadString($body, $pos);

            $code = $level === 4 ? 0x00 : 0x01;      // 0x00 接受，0x01 协议版本不支持
            $server->send($fd, mqttPacket(MQTT_CONNACK, 0, chr(0) . chr($code)));
            if ($code !== 0x00) {
                $server->close($fd);
                break;
            }
            echo "client {$fd} CONNECT clientId={$clientId}\n";
            break;

        case MQTT_SUBSCRIBE:
            $messageId = unpack('n', substr($body, 0, 2))[1];
            $pos = 2;
            $codes = '';
            while ($pos < strlen($body)) {
                [$filter, $used] = mqttReadString($body, $pos);
                $pos += $used;
                $qos = ord($body[$pos]);
                $pos += 1;
                $granted = min($qos, 1);             // 本示例只实现 QoS 0 和 1
                $subscriptions[$fd][$filter] = $granted;
                $codes .= chr($granted);
                echo "client {$fd} SUBSCRIBE {$filter} qos={$granted}\n";
            }
            $server->send($fd, mqttPacket(MQTT_SUBACK, 0, pack('n', $messageId) . $codes));
            break;

        case MQTT_UNSUBSCRIBE:
            $messageId = unpack('n', substr($body, 0, 2))[1];
            $pos = 2;
            while ($pos < strlen($body)) {
                [$filter, $used] = mqttReadString($body, $pos);
                $pos += $used;
                unset($subscriptions[$fd][$filter]);
            }
            $server->send($fd, mqttPacket(MQTT_UNSUBACK, 0, pack('n', $messageId)));
            break;

        case MQTT_PUBLISH:
            $qos = ($flags & 0x06) >> 1;
            [$topic, $used] = mqttReadString($body, 0);
            $pos = $used;
            if ($qos > 0) {
                // QoS > 0 时主题名后面还有 2 字节报文标识符
                $messageId = unpack('n', substr($body, $pos, 2))[1];
                $pos += 2;
                $server->send($fd, mqttPacket(MQTT_PUBACK, 0, pack('n', $messageId)));
            }
            $payload = substr($body, $pos);
            echo "client {$fd} PUBLISH {$topic}: {$payload}\n";

            foreach ($subscriptions as $targetFd => $filters) {
                if (!$server->exists($targetFd)) {
                    continue;
                }
                foreach ($filters as $filter => $grantedQos) {
                    if (!mqttTopicMatch($filter, $topic)) {
                        continue;
                    }
                    $outQos = min($qos, $grantedQos);
                    $out = mqttWriteString($topic);
                    if ($outQos > 0) {
                        // 下行报文标识符由 Broker 为每个订阅者独立分配
                        $messageIds[$targetFd] = ($messageIds[$targetFd] ?? 0) + 1;
                        $out .= pack('n', $messageIds[$targetFd]);
                    }
                    $server->send($targetFd, mqttPacket(MQTT_PUBLISH, $outQos << 1, $out . $payload));
                    break; // 一个订阅者命中多个过滤器时只投递一次
                }
            }
            break;

        case MQTT_PINGREQ:
            $server->send($fd, mqttPacket(MQTT_PINGRESP, 0, ''));
            break;

        case MQTT_DISCONNECT:
            $server->close($fd);
            break;
    }
});

$server->on('close', function (Server $server, int $fd) use (&$subscriptions, &$messageIds) {
    unset($subscriptions[$fd], $messageIds[$fd]);
    echo "client {$fd} closed\n";
});

$server->start();
```

**验证**

安装 mosquitto 客户端后，开两个终端分别订阅和发布：

```shell
mosquitto_sub -h 127.0.0.1 -t 'room/+/temperature' -q 1 -v
```

```shell
mosquitto_pub -h 127.0.0.1 -t 'room/1/temperature' -q 1 -m '26.5'
```

订阅端会打印 `room/1/temperature 26.5`，服务端会打印 `CONNECT`、`SUBSCRIBE`、`PUBLISH` 三条日志。

## 注意事项

> [!IMPORTANT]
> 订阅关系是跨连接共享的状态。示例用 `SWOOLE_BASE` 加 `worker_num => 1` 把所有连接放在同一个进程内，才能直接用 PHP 数组保存订阅表；若要多 worker，订阅表必须放进 [`Swoole\Table`](/zh/table.html) 这类共享内存，或改用单进程多线程模式。

> [!NOTE]
> 示例未实现 QoS 2、遗嘱消息、保留消息和用户名密码认证，`SUBSCRIBE` 请求的 QoS 2 会被降级为 QoS 1 授予。生产环境请使用 [simps/mqtt](https://github.com/simps/mqtt)。