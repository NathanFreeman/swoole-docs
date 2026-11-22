# Swoole\Server\Event

`Swoole\Server\Event` is the event object passed by the `Swoole` server in **object-oriented event mode**. After setting [event_object](/en/server/setting.html#event-object) to `true`, the second parameter of the [connect](/en/server/events.html#connect), [receive](/en/server/events.html#receive), and [close](/en/server/events.html#close) events is no longer the separate `$reactor_id`, `$fd`, `$data`, but this single encapsulated object. For details, see [Object-Oriented Style](/en/server/events.html#object-oriented-style).

## Properties

### reactor_id

The `ID` of the `Reactor` thread where the event occurred. This property is an `int`.

```php
public int $reactor_id
```

### fd

The file descriptor `fd` of the connection. This property is an `int`.

```php
public int $fd
```

### dispatch_time

The arrival time of the request data. This property is a `double`. It is non-zero only in the `receive` event.

```php
public float $dispatch_time
```

### data

The data sent by the client. This property is a `string`. It is non-null only in the `receive` event.

```php
public string $data
```

> [!IMPORTANT]
> The `connect` and `close` events carry no business data; in these cases `dispatch_time` is `0` and `data` is `null`, and you only need to read `reactor_id` and `fd`.

## Examples

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// Enable object-oriented event mode
$server->set([
    'event_object' => true,
]);

$server->on('receive', function (Server $server, Event $event) {
    printf("reactor_id=%d fd=%d dispatch_time=%f data=%s\n", $event->reactor_id, $event->fd, $event->dispatch_time, $event->data);
    $server->send($event->fd, 'Hello Swoole');
});

$server->on('close', function (Server $server, Event $event) {
    printf("close fd=%d\n", $event->fd);
});

$server->start();
```