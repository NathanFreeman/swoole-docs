# Swoole\Server\TaskResult

`Swoole\Server\TaskResult` 是 `Swoole` 服务器在**面向对象事件模式**下传递的异步任务结果对象。把 [event_object](/zh/server/setting.html#event-object) 设置为 `true` 之后，[finish](/zh/server/events.html#finish) 事件的第二个参数不再是分散的 `$taskId` 和 `$data`，而是这一个封装好的对象，任务 `ID`、执行该任务的 `task` 进程以及结果数据都在同一个对象上。

## 属性

### task_id

该任务的 `ID`，该属性是一个 `int` 类型的整数，与 [finish](/zh/server/events.html#finish) 事件原本的 `$taskId` 参数对应。

```php
public int $task_id
```

### task_worker_id

该执行结果来自哪个 `task` 进程，该属性是一个 `int` 类型的整数。

```php
public int $task_worker_id
```

### dispatch_time

该任务数据的到达时间，该属性是一个 `double` 类型。

```php
public float $dispatch_time
```

### data

任务处理的结果内容，该属性是一个 `string` 类型的字符串。

```php
public string $data
```

> [!IMPORTANT]
> `task_id` 与 `task_worker_id` 组合起来才是全局唯一的：不同的 `worker` 进程投递的任务 `ID` 可能会相同。

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
    // 开启面向对象事件模式
    'event_object' => true,
]);

$server->on('request', function (Request $request, Response $response) use ($server) {
    $server->task('Hello Swoole');
    $response->end('ok');
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    // 通过 return 将结果交给 worker 进程
    return strtoupper($data);
});

$server->on('finish', function (Server $server, TaskResult $result) {
    printf("task_id=%d task_worker_id=%d data=%s\n", $result->task_id, $result->task_worker_id, $result->data);
});

$server->start();
```
