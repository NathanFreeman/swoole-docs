# Swoole\Server\Task

`Swoole\Server\Task` 是 `Swoole` 服务器在**面向对象模式**下传递给 `task` 事件的任务对象。把 [task_use_object / task_object](/zh/server/setting.html#task-use-object-task-object) 设置为 `true` 之后，[task](/zh/server/events.html#task) 事件的回调参数不再是分散的 `$taskId`、`$workerId`、`$data`，而是这一个封装好的对象：任务数据、任务 `ID`、投递方进程和标志位都在上面，细节可查阅 [面向对象风格](/zh/server/events.html#面向对象风格)。

> [!NOTE]
> `task` 事件的参数对象由 [task_use_object / task_object](/zh/server/setting.html#task-use-object-task-object) 控制；它与影响多个事件类型的 [event_object](/zh/server/setting.html#event-object) 是两项不同的设置，作用范围也不同。

> [!WARNING]
> `Swoole\Server\Task` 对象只能通过 [task](/zh/server/events.html#task) 事件的回调参数由框架自动创建并传入，不能直接实例化。单独 `new Swoole\Server\Task()` 没有任何实际意义，这种对象无法正常工作。

```php
<?php
$task = new Task(); // ❌ 无效，无法使用
```

## 属性

### data

`worker` 进程传递给 `task` 进程的数据 `data`，该属性是一个 `string` 类型的字符串。

```php
public string $data
```

### dispatch_time

该数据到达 `task` 进程的时间 `dispatch_time`，该属性是一个 `double` 类型。

```php
public float $dispatch_time
```

### id

当前 `task` 任务的 `ID`，该属性是一个 `int` 类型的整数。

```php
public int $id
```

### worker_id

该数据来自哪一个 `worker` 进程，该属性是一个 `int` 类型的整数。

```php
public int $worker_id
```

### flags

该异步任务的标志位信息 `flags`，该属性是一个 `int` 类型的整数。

```php
public int $flags
```

> [!NOTE]
> `flags` 返回的结果是以下几种类型：
>
> - `SWOOLE_TASK_NOREPLY | SWOOLE_TASK_NONBLOCK` 表示这不是 `worker` 进程发送给 `task` 进程的，此时如果在 `task` 事件中调用 [`Swoole\Server::finish()`](/zh/server/methods.html#finish) 的话，将会有一个警告发出。
> - `SWOOLE_TASK_CALLBACK | SWOOLE_TASK_NONBLOCK` 表示 `Swoole\Server::finish()` 中最后一个回调函数不是 `null`，`finish` 事件将不会执行，而只会执行这个回调函数。
> - `SWOOLE_TASK_COROUTINE | SWOOLE_TASK_NONBLOCK` 表示将会通过协程的形式处理任务。
> - `SWOOLE_TASK_NONBLOCK` 默认值，当以上三种情况都没有的时候。

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
    // 开启 task 事件的面向对象模式
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

用于在 [task 进程](/zh/server/process_thread.html#进程-线程) 中通知 `worker` 进程，投递的任务已完成。此函数可以传递结果数据给 `worker` 进程。

```php
public function finish(mixed $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 任务处理的结果内容 | 必填 |

> [!NOTE]
> - `finish` 方法可以连续多次调用，`worker` 进程会多次触发 [finish](/zh/server/events.html#finish) 事件。
> - 在 [task](/zh/server/events.html#task) 回调函数中调用过 `finish` 方法后，`return` 数据依然会触发 [finish](/zh/server/events.html#finish) 事件。
> - `Swoole\Server\Task->finish` 是可选的。如果 `worker` 进程不关心任务执行的结果，不需要调用此函数。
> - 在 [task](/zh/server/events.html#task) 回调函数中 `return` 字符串，等同于调用 `finish`。

> [!WARNING]
> 使用 `Swoole\Server\Task->finish` 函数必须为 `Server` 设置 [finish](/zh/server/events.html#finish) 回调函数。此函数只可用于 [task 进程](/zh/server/process_thread.html#进程-线程) 的 [task](/zh/server/events.html#task) 回调中。

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

将给定的数据序列化。

```php
public function pack(mixed $data): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 任务处理的结果内容 | 必填 |

**返回值**：调用成功返回序列化后的结果。

### unpack

将给定的数据反序列化。

```php
public function unpack(string $data): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 需要反序列化的数据 | 必填 |

**返回值**：调用成功返回反序列化后的结果。

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
    // 先序列化，再反序列化还原为原始数据后返回给 worker 进程
    $packed = $task->pack(['result' => true]);
    $task->finish($task->unpack($packed));
});

$server->start();
```
