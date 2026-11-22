# Swoole\Server\Task

`Swoole\Server\Task` is the task object passed to the `task` event by the `Swoole` server in **object-oriented mode**. After setting [task_use_object / task_object](/en/server/setting.html#task-use-object-task-object) to `true`, the callback parameters of the [task](/en/server/events.html#task) event are no longer the separate `$taskId`, `$workerId`, `$data`, but this single encapsulated object: the task data, task `ID`, dispatching process, and flags are all on it. For details, see [Object-Oriented Style](/en/server/events.html#object-oriented-style).

> [!NOTE]
> The parameter object of the `task` event is controlled by [task_use_object / task_object](/en/server/setting.html#task-use-object-task-object); it is a different setting from [event_object](/en/server/setting.html#event-object), which affects multiple event types, and their scopes differ as well.

> [!WARNING]
> A `Swoole\Server\Task` object can only be created and passed in automatically by the framework via the callback parameter of the [task](/en/server/events.html#task) event; it cannot be instantiated directly. Calling `new Swoole\Server\Task()` on its own has no practical meaning, and such an object cannot work properly.

```php
<?php
$task = new Task(); // ❌ Invalid, unusable
```

## Properties

### data

The data `data` passed from the `worker` process to the `task` process. This property is a `string`.

```php
public string $data
```

### dispatch_time

The time `dispatch_time` when the data arrived at the `task` process. This property is a `double`.

```php
public float $dispatch_time
```

### id

The `ID` of the current `task`. This property is an `int`.

```php
public int $id
```

### worker_id

Which `worker` process the data came from. This property is an `int`.

```php
public int $worker_id
```

### flags

The flag information `flags` of the async task. This property is an `int`.

```php
public int $flags
```

> [!NOTE]
> `flags` returns one of the following types:
>
> - `SWOOLE_TASK_NOREPLY | SWOOLE_TASK_NONBLOCK` means this was not sent from a `worker` process to a `task` process; in this case, calling [`Swoole\Server::finish()`](/en/server/methods.html#finish) in the `task` event will emit a warning.
> - `SWOOLE_TASK_CALLBACK | SWOOLE_TASK_NONBLOCK` means the last callback parameter of `Swoole\Server::task()` is not `null`; the `finish` event will not be executed, and only this callback will run.
> - `SWOOLE_TASK_COROUTINE | SWOOLE_TASK_NONBLOCK` means the task will be handled in coroutine form.
> - `SWOOLE_TASK_NONBLOCK` is the default value, when none of the above three cases applies.

## Examples

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Server\Task;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'task_worker_num' => 2,
    // Enable object-oriented mode for the task event
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

## Methods

### finish

Used in a [task process](/en/server/process_thread.html#processes-threads) to notify the `worker` process that the dispatched task has completed. This function can pass result data to the `worker` process.

```php
public function finish(mixed $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The result content of the task processing | Required |

> [!NOTE]
> - The `finish` method can be called multiple times in a row; the `worker` process will trigger the [finish](/en/server/events.html#finish) event multiple times.
> - After calling the `finish` method in the [task](/en/server/events.html#task) callback, `return`ing data will still trigger the [finish](/en/server/events.html#finish) event.
> - `Swoole\Server\Task->finish` is optional. If the `worker` process does not care about the task result, this function does not need to be called.
> - `return`ing a string in the [task](/en/server/events.html#task) callback is equivalent to calling `finish`.

> [!WARNING]
> To use the `Swoole\Server\Task->finish` function, a [finish](/en/server/events.html#finish) callback must be set on the `Server`. This function can only be used in the [task](/en/server/events.html#task) callback of a [task process](/en/server/process_thread.html#processes-threads).

**Example**

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

Serializes the given data.

```php
public function pack(mixed $data): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The result content of the task processing | Required |

**Return value**: Returns the serialized result on success.

### unpack

Unserializes the given data.

```php
public function unpack(string $data): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to unserialize | Required |

**Return value**: Returns the unserialized result on success.

**Example**

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
    // Serialize first, then unserialize back to the original data and return it to the worker process
    $packed = $task->pack(['result' => true]);
    $task->finish($task->unpack($packed));
});

$server->start();
```