# Swoole\Server\Packet

`Swoole\Server\Packet` is the `UDP` packet object passed by the `Swoole` server in **object-oriented event mode**. After setting [event_object](/en/server/setting.html#event-object) to `true`, the second parameter of the [packet](/en/server/events.html#packet) event is no longer the two separate parameters `$data` and `$clientInfo`, but this single encapsulated object; the data content and source address can be read directly from its properties.

## Properties

### server_socket

The server-side file descriptor `fd`. This property is an `int`.

```php
public int $server_socket
```

### server_port

The server-side listening port `server_port`. This property is an `int`.

```php
public int $server_port
```

### dispatch_time

The arrival time of the request data. This property is a `double`.

```php
public float $dispatch_time
```

### address

The client address `address`. This property is a `string`.

```php
public string $address
```

### port

The client port `port`. This property is an `int`.

```php
public int $port
```

### data

The data `data` sent by the client. This property is a `string`.

```php
public string $data
```

> [!IMPORTANT]
> A [UDP server](/en/server/tcp_udp.html) must set the `packet` event. The properties of `Packet` correspond one-to-one with the fields of the `$clientInfo` array when `event_object` is disabled; see the `$clientInfo` description in the [packet](/en/server/events.html#packet) event.

## Examples

```php
<?php
use Swoole\Server;
use Swoole\Server\Packet;

$server = new Server('127.0.0.1', 9502, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);
// Enable object-oriented event mode
$server->set([
    'event_object' => true,
]);

$server->on('packet', function (Server $server, Packet $packet) {
    printf("%s:%d -> %s\n", $packet->address, $packet->port, $packet->data);
    // Use sendto to send data back to the client
    $server->sendto($packet->address, $packet->port, 'Hello Swoole', $packet->server_socket);
});

$server->start();
```