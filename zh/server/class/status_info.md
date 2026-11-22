# Swoole\Server\StatusInfo

`Swoole\Server\StatusInfo` 是 `Swoole` 服务器在**面向对象事件模式**下传递的进程状态对象。把 [event_object](/zh/server/setting.html#event-object) 设置为 `true` 之后，[workerError](/zh/server/events.html#workererror) 事件的第二个参数不再是分散的 `$workerId`、`$pid`、`$exitCode`、`$signal`，而是这一个封装好的对象，细节可查阅 [面向对象风格](/zh/server/events.html#面向对象风格)。

> [!WARNING]
> `Swoole\Server\StatusInfo` 对象只能通过 [workerError](/zh/server/events.html#workererror) 事件的回调参数由框架自动创建并传入，不能直接实例化。单独 `new Swoole\Server\StatusInfo()` 没有任何实际意义，这种对象无法正常工作。

```php
<?php
$info = new StatusInfo(); // ❌ 无效，无法使用
```

## 属性

### worker_id

当前 `worker` 进程的进程序号，该属性是一个 `int` 类型的整数。

```php
public int $worker_id
```

### worker_pid

当前 `worker` 进程的系统 `PID`，该属性是一个 `int` 类型的整数。

```php
public int $worker_pid
```

### status

进程状态 `status`，该属性是一个 `int` 类型的整数。

```php
public int $status
```

### exit_code

进程退出状态码 `exit_code`，该属性是一个 `int` 类型的整数，范围是 `0-255`。

```php
public int $exit_code
```

### signal

进程退出的信号 `signal`，该属性是一个 `int` 类型的整数。

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
// 开启面向对象事件模式
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
