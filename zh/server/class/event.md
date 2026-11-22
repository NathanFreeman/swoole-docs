# Swoole\Server\Event

`Swoole\Server\Event` 是 `Swoole` 服务器在**面向对象事件模式**下传递的事件对象。把 [event_object](/zh/server/setting.html#event-object) 设置为 `true` 之后，[connect](/zh/server/events.html#connect)、[receive](/zh/server/events.html#receive)、[close](/zh/server/events.html#close) 事件的第二个参数不再是分散的 `$reactor_id`、`$fd`、`$data`，而是这一个封装好的对象，细节可查阅 [面向对象风格](/zh/server/events.html#面向对象风格)。

## 属性

### reactor_id

该事件所在的 `Reactor` 线程 `ID`，该属性是一个 `int` 类型的整数。

```php
public int $reactor_id
```

### fd

该连接的文件描述符 `fd`，该属性是一个 `int` 类型的整数。

```php
public int $fd
```

### dispatch_time

该请求数据的到达时间，该属性是一个 `double` 类型。只有在 `receive` 事件里该属性才不为 `0`。

```php
public float $dispatch_time
```

### data

该客户端发送的数据，该属性是一个 `string` 类型的字符串。只有在 `receive` 事件里该属性不为 `null`。

```php
public string $data
```

> [!IMPORTANT]
> `connect` 与 `close` 事件不携带业务数据，此时 `dispatch_time` 为 `0`、`data` 为 `null`，只需读取 `reactor_id` 和 `fd`。

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// 开启面向对象事件模式
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
