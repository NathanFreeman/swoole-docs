# MQTT (IoT) Server

To use an MQTT (IoT) server, instantiate a [`Swoole\Server`](/en/server/tcp_udp.html) object and enable MQTT protocol parsing via the [`open_mqtt_protocol`](/en/server/setting.html#open-mqtt-protocol) configuration option. Once enabled, every piece of data received is a complete MQTT packet, with no extra handling of packet coalescing needed.

Combined with [simps/mqtt](https://github.com/simps/mqtt), you can build a complete IoT solution.

## Examples

### Zero-Dependency Broker

Below is an MQTT 3.1.1 Broker that depends on no third-party libraries. It handles six packet types — `CONNECT`, `SUBSCRIBE`, `UNSUBSCRIBE`, `PUBLISH`, `PINGREQ`, and `DISCONNECT` — supports `+` / `#` wildcard subscriptions and QoS 0/1 forwarding, and listens on the default MQTT port `1883`. Packets are handled in the [`receive`](/en/server/events.html#receive) event, and the subscription table is cleaned up by the [`close`](/en/server/events.html#close) event when a connection drops.

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

// Parse the variable-length encoded remaining length; returns [remaining length, start offset of the variable part]
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

// Read an MQTT string (2-byte big-endian length + content); returns [string, number of bytes consumed]
function mqttReadString(string $data, int $offset): array
{
    $length = unpack('n', substr($data, $offset, 2))[1];

    return [substr($data, $offset + 2, $length), $length + 2];
}

function mqttWriteString(string $value): string
{
    return pack('n', strlen($value)) . $value;
}

// Assemble a complete packet: fixed header + remaining length + variable part
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

// Topic filter matching, supporting the single-level wildcard + and the multi-level wildcard #
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

$subscriptions = []; // fd => [topic filter => granted QoS]
$messageIds = [];    // fd => allocated downstream packet identifiers

$server = new Server('127.0.0.1', 1883, SWOOLE_BASE);
$server->set([
    'open_mqtt_protocol' => true, // Enable MQTT protocol parsing
    'worker_num' => 1,            // The subscription table is an in-process array, so only a single worker is allowed
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
            [, $used] = mqttReadString($body, $pos); // Protocol name, always MQTT
            $pos += $used;
            $level = ord($body[$pos]);               // Protocol level; 4 means MQTT 3.1.1
            $pos += 4;                               // Protocol level 1 + connect flags 1 + keep alive 2
            [$clientId] = mqttReadString($body, $pos);

            $code = $level === 4 ? 0x00 : 0x01;      // 0x00 accepted, 0x01 unsupported protocol version
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
                $granted = min($qos, 1);             // This example only implements QoS 0 and 1
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
                // With QoS > 0, a 2-byte packet identifier follows the topic name
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
                        // The Broker allocates downstream packet identifiers independently for each subscriber
                        $messageIds[$targetFd] = ($messageIds[$targetFd] ?? 0) + 1;
                        $out .= pack('n', $messageIds[$targetFd]);
                    }
                    $server->send($targetFd, mqttPacket(MQTT_PUBLISH, $outQos << 1, $out . $payload));
                    break; // Deliver only once when a subscriber matches multiple filters
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

**Verification**

After installing the mosquitto client, open two terminals to subscribe and publish respectively:

```shell
mosquitto_sub -h 127.0.0.1 -t 'room/+/temperature' -q 1 -v
```

```shell
mosquitto_pub -h 127.0.0.1 -t 'room/1/temperature' -q 1 -m '26.5'
```

The subscriber prints `room/1/temperature 26.5`, and the server prints three log lines: `CONNECT`, `SUBSCRIBE`, and `PUBLISH`.

> [!NOTE]
> This example only demonstrates packet parsing and does not reply with `CONNACK`, so real clients cannot complete the connection. For a ready-to-use Broker, refer to the zero-dependency example above.

## Notes

> [!IMPORTANT]
> Subscription relationships are state shared across connections. The example uses `SWOOLE_BASE` with `worker_num => 1` to keep all connections in the same process, so the subscription table can be stored directly in a PHP array; for multiple workers, the subscription table must be placed in shared memory such as [`Swoole\Table`](/en/table.html), or you must switch to single-process multi-thread mode.

> [!NOTE]
> The example does not implement QoS 2, will messages, retained messages, or username/password authentication; a QoS 2 `SUBSCRIBE` request is downgraded and granted as QoS 1. For production, use [simps/mqtt](https://github.com/simps/mqtt).