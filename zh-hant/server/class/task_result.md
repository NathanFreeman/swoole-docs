# Swoole\Server\TaskResult

`Swoole\Server\TaskResult` 是 `Swoole` 服務器在**面向對象事件模式**下傳遞的異步任務結果對象。把 [event_object](/zh-hant/server/setting.html#event-object) 設置爲 `true` 之後，[finish](/zh-hant/server/events.html#finish) 事件的第二個參數不再是分散的 `$taskId` 和 `$data`，而是這一個封裝好的對象，任務 `ID`、執行該任務的 `task` 進程以及結果數據都在同一個對象上。

## 屬性

### task_id

該任務的 `ID`，該屬性是一個 `int` 類型的整數，與 [finish](/zh-hant/server/events.html#finish) 事件原本的 `$taskId` 參數對應。

```php
public int $task_id
```

### task_worker_id

該執行結果來自哪個 `task` 進程，該屬性是一個 `int` 類型的整數。

```php
public int $task_worker_id
```

### dispatch_time

該任務數據的到達時間，該屬性是一個 `double` 類型。

```php
public float $dispatch_time
```

### data

任務處理的結果內容，該屬性是一個 `string` 類型的字符串。

```php
public string $data
```

> [!IMPORTANT]
> `task_id` 與 `task_worker_id` 組合起來纔是全局唯一的：不同的 `worker` 進程投遞的任務 `ID` 可能會相同。

## 示例

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Server\TaskResult;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'task_worker_num' => 2,
    // 開啓面向對象事件模式
    'event_object' => true,
]);

$server->on('request', function (Request $request, Response $response) use ($server) {
    $server->task('Hello Swoole');
    $response->end('ok');
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    // 通過 return 將結果交給 worker 進程
    return strtoupper($data);
});

$server->on('finish', function (Server $server, TaskResult $result) {
    printf("task_id=%d task_worker_id=%d data=%s\n", $result->task_id, $result->task_worker_id, $result->data);
});

$server->start();
```
