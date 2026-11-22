# Swoole\Server\Task

`Swoole\Server\Task` 是 `Swoole` 服務器在**面向對象模式**下傳遞給 `task` 事件的任務對象。把 [task_use_object / task_object](/zh-hant/server/setting.html#task-use-object-task-object) 設置爲 `true` 之後，[task](/zh-hant/server/events.html#task) 事件的回調參數不再是分散的 `$taskId`、`$workerId`、`$data`，而是這一個封裝好的對象：任務數據、任務 `ID`、投遞方進程和標誌位都在上面，細節可查閱 [面向對象風格](/zh-hant/server/events.html#面向對象風格)。

> [!NOTE]
> `task` 事件的參數對象由 [task_use_object / task_object](/zh-hant/server/setting.html#task-use-object-task-object) 控制；它與影響多個事件類型的 [event_object](/zh-hant/server/setting.html#event-object) 是兩項不同的設置，作用範圍也不同。

> [!WARNING]
> `Swoole\Server\Task` 對象只能通過 [task](/zh-hant/server/events.html#task) 事件的回調參數由框架自動創建並傳入，不能直接實例化。單獨 `new Swoole\Server\Task()` 沒有任何實際意義，這種對象無法正常工作。

```php
<?php
$task = new Task(); // ❌ 無效，無法使用
```

## 屬性

### data

`worker` 進程傳遞給 `task` 進程的數據 `data`，該屬性是一個 `string` 類型的字符串。

```php
public string $data
```

### dispatch_time

該數據到達 `task` 進程的時間 `dispatch_time`，該屬性是一個 `double` 類型。

```php
public float $dispatch_time
```

### id

當前 `task` 任務的 `ID`，該屬性是一個 `int` 類型的整數。

```php
public int $id
```

### worker_id

該數據來自哪一個 `worker` 進程，該屬性是一個 `int` 類型的整數。

```php
public int $worker_id
```

### flags

該異步任務的標誌位信息 `flags`，該屬性是一個 `int` 類型的整數。

```php
public int $flags
```

> [!NOTE]
> `flags` 返回的結果是以下幾種類型：
>
> - `SWOOLE_TASK_NOREPLY | SWOOLE_TASK_NONBLOCK` 表示這不是 `worker` 進程發送給 `task` 進程的，此時如果在 `task` 事件中調用 [`Swoole\Server::finish()`](/zh-hant/server/methods.html#finish) 的話，將會有一個警告發出。
> - `SWOOLE_TASK_CALLBACK | SWOOLE_TASK_NONBLOCK` 表示 `Swoole\Server::task()` 中最後一個回調函數不是 `null`，`finish` 事件將不會執行，而只會執行這個回調函數。
> - `SWOOLE_TASK_COROUTINE | SWOOLE_TASK_NONBLOCK` 表示將會通過協程的形式處理任務。
> - `SWOOLE_TASK_NONBLOCK` 默認值，當以上三種情況都沒有的時候。

## 示例

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Server\Task;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'task_worker_num' => 2,
    // 開啓 task 事件的面向對象模式
    'task_use_object' => true,
]);

$server->on('request', function (Request $request, Response $response) use ($server) {
    $server->task('Hello Swoole!!!!');
    $response->end('ok');
});

$server->on('task', function (Server $server, Task $task) {
    printf("id=%d worker_id=%d dispatch_time=%f flags=%d data=%s\n", $task->id, $task->worker_id, $task->dispatch_time, $task->flags, $task->data);
});

$server->start();
```

## 方法

### finish

用於在 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 中通知 `worker` 進程，投遞的任務已完成。此函數可以傳遞結果數據給 `worker` 進程。

```php
public function finish(mixed $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 任務處理的結果內容 | 必填 |

> [!NOTE]
> - `finish` 方法可以連續多次調用，`worker` 進程會多次觸發 [finish](/zh-hant/server/events.html#finish) 事件。
> - 在 [task](/zh-hant/server/events.html#task) 回調函數中調用過 `finish` 方法後，`return` 數據依然會觸發 [finish](/zh-hant/server/events.html#finish) 事件。
> - `Swoole\Server\Task->finish` 是可選的。如果 `worker` 進程不關心任務執行的結果，不需要調用此函數。
> - 在 [task](/zh-hant/server/events.html#task) 回調函數中 `return` 字符串，等同於調用 `finish`。

> [!WARNING]
> 使用 `Swoole\Server\Task->finish` 函數必須爲 `Server` 設置 [finish](/zh-hant/server/events.html#finish) 回調函數。此函數只可用於 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 的 [task](/zh-hant/server/events.html#task) 回調中。

**示例**

```php
<?php
use Swoole\Server;
use Swoole\Server\Task;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'task_worker_num' => 2,
    'task_use_object' => true,
]);

$server->on('task', function (Server $server, Task $task) {
    $task->finish(['result' => true]);
});

$server->start();
```

### pack

將給定的數據序列化。

```php
public function pack(mixed $data): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 任務處理的結果內容 | 必填 |

**返回值**：調用成功返回序列化後的結果。

### unpack

將給定的數據反序列化。

```php
public function unpack(string $data): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 需要反序列化的數據 | 必填 |

**返回值**：調用成功返回反序列化後的結果。

**示例**

```php
<?php
use Swoole\Server;
use Swoole\Server\Task;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'task_worker_num' => 2,
    'task_use_object' => true,
]);

$server->on('task', function (Server $server, Task $task) {
    // 先序列化，再反序列化還原爲原始數據後返回給 worker 進程
    $packed = $task->pack(['result' => true]);
    $task->finish($task->unpack($packed));
});

$server->start();
```
