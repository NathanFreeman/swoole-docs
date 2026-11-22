# Swoole\Server\PipeMessage

`Swoole\Server\PipeMessage` 是 `Swoole` 服務器在**面向對象事件模式**下傳遞的管道消息對象。進程之間通過 [sendMessage](/zh-hant/server/methods.html#sendmessage) 發送消息，接收方會在 [pipeMessage](/zh-hant/server/events.html#pipemessage) 事件中拿到這個對象；把 [event_object](/zh-hant/server/setting.html#event-object) 設置爲 `true` 之後，該事件的第二個參數不再是 `$source_worker_id` 和 `$data` 兩個分散的參數，而是這一個封裝好的對象。

## 屬性

### source_worker_id

數據來源方的 `worker` 進程 `ID`，該屬性是一個 `int` 類型的整數。

```php
public int $source_worker_id
```

### dispatch_time

該管道消息的到達時間，該屬性是一個 `double` 類型。

```php
public float $dispatch_time
```

### data

該管道消息攜帶的數據，該屬性是一個 `string` 類型的字符串。

```php
public string $data
```

> [!TIP]
> `source_worker_id` 表示消息來自哪個進程；如需回應對端，可在 `pipeMessage` 回調中再次調用 [sendMessage](/zh-hant/server/methods.html#sendmessage)，把數據發回來源進程或指定的 `worker`、`task` 進程。

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\PipeMessage;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// 開啓面向對象事件模式
$server->set([
    'event_object' => true,
]);

$server->on('pipeMessage', function (Server $server, PipeMessage $message) {
    printf("from worker %d: %s\n", $message->source_worker_id, $message->data);
});

$server->on('receive', function (Server $server, Event $event) {
    // 將收到的數據作爲管道消息發給 worker 進程 1
    $server->sendMessage($event->data, 1);
    $server->send($event->fd, 'Hello Swoole');
});

$server->start();
```
