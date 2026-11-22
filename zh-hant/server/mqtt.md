# MQTT (物聯網) 服務器

要想使用 MQTT（物聯網）服務器，可以實例化 [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 對象，並通過配置項 [`open_mqtt_protocol`](/zh-hant/server/setting.html#open-mqtt-protocol) 開啓 MQTT 協議解析。啓用後，每次收到的數據都將是一個完整的 MQTT 數據包，無需額外處理粘包問題。

配合 [simps/mqtt](https://github.com/simps/mqtt) 可以實現一套完整物聯網（IOT）解決方案。

## 示例

### 零依賴 Broker

下面是一個不依賴任何第三方庫的 MQTT 3.1.1 Broker，處理 `CONNECT`、`SUBSCRIBE`、`UNSUBSCRIBE`、`PUBLISH`、`PINGREQ`、`DISCONNECT` 六種報文，支持 `+` / `#` 通配符訂閱和 QoS 0/1 轉發，監聽 MQTT 默認端口 `1883`。報文在 [`receive`](/zh-hant/server/events.html#receive) 事件中處理，連接斷開時由 [`close`](/zh-hant/server/events.html#close) 事件清理訂閱表。

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

// 解析變長編碼的剩餘長度，返回 [剩餘長度, 可變部分的起始偏移量]
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

// 讀取 MQTT 字符串（2 字節大端長度 + 內容），返回 [字符串, 消耗的字節數]
function mqttReadString(string $data, int $offset): array
{
    $length = unpack('n', substr($data, $offset, 2))[1];

    return [substr($data, $offset + 2, $length), $length + 2];
}

function mqttWriteString(string $value): string
{
    return pack('n', strlen($value)) . $value;
}

// 組裝完整報文：固定包頭 + 剩餘長度 + 可變部分
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

// 主題過濾器匹配，支持單級通配符 + 和多級通配符 #
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

$subscriptions = []; // fd => [主題過濾器 => 授予的 QoS]
$messageIds = [];    // fd => 已分配的下行報文標識符

$server = new Server('127.0.0.1', 1883, SWOOLE_BASE);
$server->set([
    'open_mqtt_protocol' => true, // 啓用 MQTT 協議解析
    'worker_num' => 1,            // 訂閱表是進程內數組，只能單 worker
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
            [, $used] = mqttReadString($body, $pos); // 協議名，固定爲 MQTT
            $pos += $used;
            $level = ord($body[$pos]);               // 協議級別，4 表示 MQTT 3.1.1
            $pos += 4;                               // 協議級別 1 + 連接標誌 1 + keep alive 2
            [$clientId] = mqttReadString($body, $pos);

            $code = $level === 4 ? 0x00 : 0x01;      // 0x00 接受，0x01 協議版本不支持
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
                $granted = min($qos, 1);             // 本示例只實現 QoS 0 和 1
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
                // QoS > 0 時主題名後面還有 2 字節報文標識符
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
                        // 下行報文標識符由 Broker 爲每個訂閱者獨立分配
                        $messageIds[$targetFd] = ($messageIds[$targetFd] ?? 0) + 1;
                        $out .= pack('n', $messageIds[$targetFd]);
                    }
                    $server->send($targetFd, mqttPacket(MQTT_PUBLISH, $outQos << 1, $out . $payload));
                    break; // 一個訂閱者命中多個過濾器時只投遞一次
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

**驗證**

安裝 mosquitto 客戶端後，開兩個終端分別訂閱和發佈：

```shell
mosquitto_sub -h 127.0.0.1 -t 'room/+/temperature' -q 1 -v
```

```shell
mosquitto_pub -h 127.0.0.1 -t 'room/1/temperature' -q 1 -m '26.5'
```

訂閱端會打印 `room/1/temperature 26.5`，服務端會打印 `CONNECT`、`SUBSCRIBE`、`PUBLISH` 三條日誌。

## 注意事項

> [!IMPORTANT]
> 訂閱關係是跨連接共享的狀態。示例用 `SWOOLE_BASE` 加 `worker_num => 1` 把所有連接放在同一個進程內，才能直接用 PHP 數組保存訂閱表；若要多 worker，訂閱表必須放進 [`Swoole\Table`](/zh-hant/table.html) 這類共享內存，或改用單進程多線程模式。

> [!NOTE]
> 示例未實現 QoS 2、遺囑消息、保留消息和用戶名密碼認證，`SUBSCRIBE` 請求的 QoS 2 會被降級爲 QoS 1 授予。生產環境請使用 [simps/mqtt](https://github.com/simps/mqtt)。