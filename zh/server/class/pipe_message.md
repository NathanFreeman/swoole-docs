# Swoole\Server\PipeMessage

`Swoole\Server\PipeMessage` 是 `Swoole` 服务器在**面向对象事件模式**下传递的管道消息对象。进程之间通过 [sendMessage](/zh/server/methods.html#sendmessage) 发送消息，接收方会在 [pipeMessage](/zh/server/events.html#pipemessage) 事件中拿到这个对象；把 [event_object](/zh/server/setting.html#event-object) 设置为 `true` 之后，该事件的第二个参数不再是 `$source_worker_id` 和 `$data` 两个分散的参数，而是这一个封装好的对象。

## 属性

### source_worker_id

数据来源方的 `worker` 进程 `ID`，该属性是一个 `int` 类型的整数。

```php
public int $source_worker_id
```

### dispatch_time

该管道消息的到达时间，该属性是一个 `double` 类型。

```php
public float $dispatch_time
```

### data

该管道消息携带的数据，该属性是一个 `string` 类型的字符串。

```php
public string $data
```

> [!TIP]
> `source_worker_id` 表示消息来自哪个进程；如需回应对端，可在 `pipeMessage` 回调中再次调用 [sendMessage](/zh/server/methods.html#sendmessage)，把数据发回来源进程或指定的 `worker`、`task` 进程。

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\PipeMessage;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// 开启面向对象事件模式
$server->set([
    'event_object' => true,
]);

$server->on('pipeMessage', function (Server $server, PipeMessage $message) {
    printf("from worker %d: %s\n", $message->source_worker_id, $message->data);
});

$server->on('receive', function (Server $server, Event $event) {
    // 将收到的数据作为管道消息发给 worker 进程 1
    $server->sendMessage($event->data, 1);
    $server->send($event->fd, 'Hello Swoole');
});

$server->start();
```
