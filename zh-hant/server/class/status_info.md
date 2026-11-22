# Swoole\Server\StatusInfo

`Swoole\Server\StatusInfo` 是 `Swoole` 服務器在**面向對象事件模式**下傳遞的進程狀態對象。把 [event_object](/zh-hant/server/setting.html#event-object) 設置爲 `true` 之後，[workerError](/zh-hant/server/events.html#workererror) 事件的第二個參數不再是分散的 `$workerId`、`$pid`、`$exitCode`、`$signal`，而是這一個封裝好的對象，細節可查閱 [面向對象風格](/zh-hant/server/events.html#面向對象風格)。

> [!WARNING]
> `Swoole\Server\StatusInfo` 對象只能通過 [workerError](/zh-hant/server/events.html#workererror) 事件的回調參數由框架自動創建並傳入，不能直接實例化。單獨 `new Swoole\Server\StatusInfo()` 沒有任何實際意義，這種對象無法正常工作。

```php
<?php
$info = new StatusInfo(); // ❌ 無效，無法使用
```

## 屬性

### worker_id

當前 `worker` 進程的進程序號，該屬性是一個 `int` 類型的整數。

```php
public int $worker_id
```

### worker_pid

當前 `worker` 進程的系統 `PID`，該屬性是一個 `int` 類型的整數。

```php
public int $worker_pid
```

### status

進程狀態 `status`，該屬性是一個 `int` 類型的整數。

```php
public int $status
```

### exit_code

進程退出狀態碼 `exit_code`，該屬性是一個 `int` 類型的整數，範圍是 `0-255`。

```php
public int $exit_code
```

### signal

進程退出的信號 `signal`，該屬性是一個 `int` 類型的整數。

```php
public int $signal
```

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\StatusInfo;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// 開啓面向對象事件模式
$server->set([
    'event_object' => true,
]);

$server->on('workerError', function (Server $server, StatusInfo $info) {
    printf("worker_id=%d worker_pid=%d status=%d exit_code=%d signal=%d\n", $info->worker_id, $info->worker_pid, $info->status, $info->exit_code, $info->signal);
});

$server->on('receive', function (Server $server, Event $event) {
    echo $event->data . PHP_EOL;
});

$server->start();
```
