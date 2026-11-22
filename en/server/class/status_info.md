# Swoole\Server\StatusInfo

`Swoole\Server\StatusInfo` is the process status object passed by the `Swoole` server in **object-oriented event mode**. After setting [event_object](/en/server/setting.html#event-object) to `true`, the second parameter of the [workerError](/en/server/events.html#workererror) event is no longer the separate `$workerId`, `$pid`, `$exitCode`, `$signal`, but this single encapsulated object. For details, see [Object-Oriented Style](/en/server/events.html#object-oriented-style).

> [!WARNING]
> A `Swoole\Server\StatusInfo` object can only be created and passed in automatically by the framework via the callback parameter of the [workerError](/en/server/events.html#workererror) event; it cannot be instantiated directly. Calling `new Swoole\Server\StatusInfo()` on its own has no practical meaning, and such an object cannot work properly.

```php
<?php
$info = new StatusInfo(); // ❌ Invalid, unusable
```

## Properties

### worker_id

The process number of the current `worker` process. This property is an `int`.

```php
public int $worker_id
```

### worker_pid

The system `PID` of the current `worker` process. This property is an `int`.

```php
public int $worker_pid
```

### status

The process status `status`. This property is an `int`.

```php
public int $status
```

### exit_code

The process exit code `exit_code`. This property is an `int`, ranging from `0-255`.

```php
public int $exit_code
```

### signal

The signal `signal` that caused the process to exit. This property is an `int`.

```php
public int $signal
```

## Examples

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\StatusInfo;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// Enable object-oriented event mode
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