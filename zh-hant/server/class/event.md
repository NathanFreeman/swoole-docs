# Swoole\Server\Event

`Swoole\Server\Event` 是 `Swoole` 服務器在**面向對象事件模式**下傳遞的事件對象。把 [event_object](/zh-hant/server/setting.html#event-object) 設置爲 `true` 之後，[connect](/zh-hant/server/events.html#connect)、[receive](/zh-hant/server/events.html#receive)、[close](/zh-hant/server/events.html#close) 事件的第二個參數不再是分散的 `$reactor_id`、`$fd`、`$data`，而是這一個封裝好的對象，細節可查閱 [面向對象風格](/zh-hant/server/events.html#面向對象風格)。

## 屬性

### reactor_id

該事件所在的 `Reactor` 線程 `ID`，該屬性是一個 `int` 類型的整數。

```php
public int $reactor_id
```

### fd

該連接的文件描述符 `fd`，該屬性是一個 `int` 類型的整數。

```php
public int $fd
```

### dispatch_time

該請求數據的到達時間，該屬性是一個 `double` 類型。只有在 `receive` 事件裏該屬性纔不爲 `0`。

```php
public float $dispatch_time
```

### data

該客戶端發送的數據，該屬性是一個 `string` 類型的字符串。只有在 `receive` 事件裏該屬性不爲 `null`。

```php
public string $data
```

> [!IMPORTANT]
> `connect` 與 `close` 事件不攜帶業務數據，此時 `dispatch_time` 爲 `0`、`data` 爲 `null`，只需讀取 `reactor_id` 和 `fd`。

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// 開啓面向對象事件模式
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
