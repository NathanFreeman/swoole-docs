# Swoole\Server\TaskResult

`Swoole\Server\TaskResult` is the async task result object passed by the `Swoole` server in **object-oriented event mode**. After setting [event_object](/en/server/setting.html#event-object) to `true`, the second parameter of the [finish](/en/server/events.html#finish) event is no longer the separate `$taskId` and `$data`, but this single encapsulated object; the task `ID`, the `task` process that executed it, and the result data are all on the same object.

## Properties

### task_id

The `ID` of the task. This property is an `int`, corresponding to the original `$taskId` parameter of the [finish](/en/server/events.html#finish) event.

```php
public int $task_id
```

### task_worker_id

Which `task` process the execution result came from. This property is an `int`.

```php
public int $task_worker_id
```

### dispatch_time

The arrival time of the task data. This property is a `double`.

```php
public float $dispatch_time
```

### data

The result content of the task processing. This property is a `string`.

```php
public string $data
```

> [!IMPORTANT]
> Only the combination of `task_id` and `task_worker_id` is globally unique: tasks dispatched by different `worker` processes may have the same `ID`.

## Examples

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Server\TaskResult;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'task_worker_num' => 2,
    // Enable object-oriented event mode
    'event_object' => true,
]);

$server->on('request', function (Request $request, Response $response) use ($server) {
    $server->task('Hello Swoole');
    $response->end('ok');
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    // Hand the result to the worker process via return
    return strtoupper($data);
});

$server->on('finish', function (Server $server, TaskResult $result) {
    printf("task_id=%d task_worker_id=%d data=%s\n", $result->task_id, $result->task_worker_id, $result->data);
});

$server->start();
```