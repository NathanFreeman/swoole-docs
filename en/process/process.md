# Creating Processes

`Swoole\Process` is the process management module of `Swoole`, used as a replacement for `PHP`'s `pcntl` extension.

> [!WARNING]
> This module is a low-level wrapper around operating system process management; users should have experience with `Linux` multi-process programming.

> [!IMPORTANT]
> Creating processes inside coroutines is forbidden; `start()` must not be called in a coroutine. To manage external programs in a coroutine environment, use [`runtime hook`](/en/coroutine/hook.html) + `proc_open`; see [Do Not Create Processes in Coroutines](/en/coroutine/others.html#do-not-create-processes-in-coroutines).

## Properties

### id

The current process `id`.

```php
public int $id
```

### pid

The `pid` of the current process.

```php
public int $pid
```

### pipe

The file descriptor of the `unixSocket`.

```php
public int $pipe
```

### msgQueueId

The `id` of the message queue.

```php
public int $msgQueueId
```

### msgQueueKey

The `key` of the message queue.

```php
public ?int $msgQueueKey
```

## Methods

### __construct

Constructor. It only creates the object and stores the child process callback; it does not `fork` a process. The child process is actually created only after calling [start](#start).

```php
public function __construct(callable $function, bool $redirect_stdin_stdout = false, int $pipe_type = Swoole\Process::PIPE_TYPE_DGRAM, bool $enable_coroutine = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$function` | Callback function executed after the child process starts. The underlying layer stores it in the object's `callback` property, which is `private` and cannot be accessed externally | Required |
| `$redirect_stdin_stdout` | Redirect the child process's standard input and output. When enabled, the child process's output is written to the parent process's pipe instead of the screen, and keyboard input is read from the pipe instead, with blocking reads by default. See [exec](#exec) | `false` |
| `$pipe_type` | The `unixSocket` type. This parameter is ignored when `$redirect_stdin_stdout` is enabled and is forced to `Swoole\Process::PIPE_TYPE_STREAM`.<br>Set it to `Swoole\Process::PIPE_TYPE_NONE` when no inter-process communication is needed inside the child process | `Swoole\Process::PIPE_TYPE_DGRAM` |
| `$enable_coroutine` | Enable coroutines in `$function`; once enabled, coroutine `API`s can be used directly | `false` |

**`$pipe_type` values**

| Value | Description |
|:---|:---|
| `Swoole\Process::PIPE_TYPE_NONE` | Do not create a `unixSocket` for communication |
| `Swoole\Process::PIPE_TYPE_STREAM` | Create a `unixSocket` of type `SOCK_STREAM` |
| `Swoole\Process::PIPE_TYPE_DGRAM` | Create a `unixSocket` of type `SOCK_DGRAM` |

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo 'child pid: ' . getmypid() . PHP_EOL;
}, false, Process::PIPE_TYPE_STREAM, false);

$process->start();

Process::wait();
```

### set

Set parameters.

```php
public function set(array $settings): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Configuration array. `enable_coroutine` controls whether coroutines are enabled, equivalent to the 4th parameter of the constructor | Required |

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    Swoole\Coroutine::sleep(1);
    echo "child exit\n";
});

// Must be called before start()
$process->set(['enable_coroutine' => true]);
$process->start();

Process::wait();
```

### start

Performs the `fork` system call to create a child process; takes a few hundred microseconds on `Linux`.

```php
public function start(): int|false
```

**Return value**: Returns the child process's `PID` on success, or `false` on failure. Use `swoole_errno` and `swoole_strerror` to get the error code and error message.

- The child process inherits the parent process's memory and file handles.
- On startup, the `EventLoop`, [signal](#signal), and [Timer](/en/timer.html) inherited from the parent process are cleared.

> [!WARNING]
> The child process reuses the parent process's memory and resources. A `redis` connection already created in the parent process remains the same object in the child process; parent and child operate on the same connection.

**Example**

```php
<?php
$redis = new Redis;
$redis->connect('127.0.0.1', 6379);

function callback_function() {
    swoole_timer_after(1000, function () {
        echo "hello world\n";
    });
    global $redis;//the same connection
};

swoole_timer_tick(1000, function () {
    echo "parent timer\n";
});//not inherited

Swoole\Process::signal(SIGCHLD, function ($sig) {
    while ($ret = Swoole\Process::wait(false)) {
        // create a new child process
        $p = new Swoole\Process('callback_function');
        $p->start();
    }
});

// create a new child process
$p = new Swoole\Process('callback_function');

$p->start();
```

### name

Change the process name; an alias of `swoole_set_process_name`.

```php
public function name(string $name): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The new process name | Required |

> [!WARNING]
> After `exec`, the process name is reset by the new program. Call `name` in the child process callback function after `start`.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->name('my-worker');
    // The new process name can now be seen with ps aux | grep my-worker
    sleep(5);
});

$process->start();

Process::wait();
```

### exec

Execute an external program; a wrapper around the `exec` system call. On success, the current process's code segment is replaced by the new program, while the parent-child process relationship remains unchanged.

```php
public function exec(string $execfile, array $args)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$execfile` | Absolute path of the executable file, e.g. `/usr/bin/python` | Required |
| `$args` | Argument list, with each argument as a separate array element. `array('test.py', 123)` is equivalent to `python test.py 123` | Required |

> [!WARNING]
> `$execfile` must be an absolute path, otherwise a file-not-found error is reported. `exec` differs from `shell_exec`: the whole command cannot be written as a single string.
>
> The parent process and the new process communicate via standard input/output, so redirection must be enabled; without `redirect_stdin_stdout = true`, the two cannot communicate after `exec`.

**Example**

Running `Swoole\Server` in a child process; `exec()` must be called after `start()`:

```php
<?php
$process = new Swoole\Process('callback_function', true);

$pid = $process->start();

function callback_function(Swoole\Process $worker)
{
    $worker->exec('/usr/local/bin/php', array(__DIR__ . '/swoole_server.php'));
    // $worker->exec('/usr/local/bin/php' . __DIR__ . '/swoole_server.php'); // Not allowed to write the command and all arguments together like this
}

Swoole\Process::wait();
```

To execute a `shell` command, go through `/bin/sh` with its `-c` argument:

```php
<?php
$worker->exec('/bin/sh', array('-c', "cp -rf /data/test/* /tmp/test/"));
```

### exit

Exit the child process.

```php
public function exit(int $status = 0)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$status` | Exit status code. `0` means normal termination, performing cleanup (`PHP`'s `shutdown_function`, object destructor `__destruct`, other extensions' `RSHUTDOWN` functions); non-`0` means abnormal exit, terminating the process immediately and skipping cleanup | `0` |

The parent process obtains the child process's exit event and status code via [Process::wait](#wait).

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    register_shutdown_function(function () {
        echo "cleanup\n";
    });
    // Passing 0 runs the cleanup function above; passing non-0 skips it
    $child->exit(0);
});

$process->start();

$status = Process::wait();
echo "exit code: {$status['code']}\n";
```

### kill

Send a signal to the specified process.

```php
public static function kill(int $pid, int $signo = SIGTERM): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$pid` | The `pid` of the target process | Required |
| `$signo` | Signal number. Passing `0` only checks whether the process exists without sending a signal | `SIGTERM` |

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function () {
    sleep(10);
});
$process->start();

// signo = 0: only check whether the process exists, no signal is sent
var_dump(Process::kill($process->pid, 0));

Process::kill($process->pid, SIGTERM);

$status = Process::wait();
echo "killed by signal: {$status['signal']}\n";
```

### wait

Reap exited child processes.

```php
public static function wait(bool $blocking = true): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$blocking` | Whether to wait in blocking mode | `true` |

**Return value**: Returns an array on success, containing the child process's `PID`, exit status code, and terminating signal; returns `false` on failure.

> [!WARNING]
> After each child process exits, the parent process must call `wait()` once to reap it; otherwise the child becomes a zombie process, occupying system process resources.
>
> When the parent process cannot wait in blocking mode, register a `SIGCHLD` signal handler and reap in the callback. A single `SIGCHLD` may correspond to multiple child exits, so call `wait()` in a non-blocking loop until it returns `false`.

> [!NOTE]
> For Swoole versions >= `v4.5.0`, the coroutine version of `wait()` is recommended; see [Swoole\Coroutine\System::wait()](/en/coroutine/system_api.html#wait).

**Example**

Blocking mode, waiting for a single child process to exit:

```php
<?php
use Swoole\Process;

$process = new Process(function () {
    sleep(1);
});
$process->start();

// Block until the child process exits
$ret = Process::wait(true);
echo "PID={$ret['pid']}, code={$ret['code']}, signal={$ret['signal']}\n";
```

Non-blocking mode, reaping multiple child processes with `SIGCHLD`:

```php
<?php
use Swoole\Process;
use Swoole\Event;

$workerNum = 3;
$reaped = 0;

Process::signal(SIGCHLD, function ($sig) use (&$reaped, $workerNum) {
    // Must be false; a single SIGCHLD may correspond to multiple child exits
    while ($ret = Process::wait(false)) {
        echo "PID={$ret['pid']}, code={$ret['code']}, signal={$ret['signal']}\n";
        $reaped++;
    }
    // All reaped; removing the signal listener lets the event loop exit
    if ($reaped >= $workerNum) {
        Process::signal(SIGCHLD, null);
    }
});

for ($n = 1; $n <= $workerNum; $n++) {
    $process = new Process(function () use ($n) {
        sleep($n);
    });
    $process->start();
}

Event::wait();
```

### daemon

Turn the current process into a daemon.

```php
public static function daemon(bool $nochdir = true, bool $noclose = true): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$nochdir` | Whether to keep the current working directory. `true` means do not switch to the root directory | `true` |
| `$noclose` | Whether to close the standard input/output file descriptors. `true` means do not close them | `true` |

> [!NOTE]
> The `PID` changes after becoming a daemon; use `getmypid()` to get the current `PID`.

**Example**

Default parameters, keeping the working directory and standard output:

```php
<?php
use Swoole\Process;

echo 'before daemon: ' . getmypid() . PHP_EOL;

// Defaults: nochdir = true, noclose = true
Process::daemon();

// PID has changed; standard output is not closed, printing still works
echo 'after daemon: ' . getmypid() . PHP_EOL;
echo 'cwd: ' . getcwd() . PHP_EOL;
```

`daemon(false, false)`: switch to the root directory and close standard output, running persistently in the background:

```php
<?php
use Swoole\Process;
use Swoole\Timer;
use Swoole\Event;

// nochdir = false: switch to the root directory
// noclose = false: close standard input/output; subsequent echo no longer appears in the terminal
Process::daemon(false, false);

$log = fopen('/tmp/daemon.log', 'a');
fwrite($log, 'pid: ' . getmypid() . ', cwd: ' . getcwd() . PHP_EOL);

Timer::tick(1000, function () use ($log) {
    fwrite($log, 'tick ' . time() . PHP_EOL);
});

// After 10 seconds, clear all timers; the process exits once the event loop has no events
Timer::after(10000, function () use ($log) {
    Timer::clearAll();
    fclose($log);
});

Event::wait();
```

## unixSocket Pipe Communication

### write

Write messages between parent and child processes over the `unixSocket`.

```php
public function write(string $data): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to write | Required |

**Return value**: Returns the number of bytes written on success, or `false` on failure.

**Example**

Parent writes, child reads:

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->read();
});
$process->start();

$process->write("hello child\n");

Process::wait();
```

### read

Read messages between parent and child processes over the `unixSocket`.

```php
public function read(int $size = 8192): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$size` | Read length in bytes | `8192` |

**Return value**: Returns the data read on success, or `false` on failure.

**Example**

Child writes, parent reads:

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->write("hello parent\n");
});
$process->start();

// Blocking read by default, up to 8192 bytes per call
echo $process->read();

Process::wait();
```

### setBlocking

Set whether the socket is blocking.

```php
public function setBlocking(bool $blocking): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$blocking` | `true` for blocking, `false` for non-blocking | Required |

> [!NOTE]
> Newly created process sockets are blocking by default; reads and writes during `unixSocket` communication block the process.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
    $child->write("hello parent\n");
});
$process->start();

// Non-blocking: returns false immediately when the pipe has no data
$process->setBlocking(false);
var_dump($process->read());

// Read again after restoring blocking mode
$process->setBlocking(true);
echo $process->read();

Process::wait();
```

### setTimeout

Set the read/write timeout of the pipe (`unixSocket`).

```php
public function setTimeout(float $seconds): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$seconds` | Timeout in seconds | Required |

**Return value**: Returns `true` on success, or `false` on failure.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
    $child->write("hello parent\n");
});
$process->start();

// The child writes only after 1 second; a 0.5-second timeout gets no data
$process->setTimeout(0.5);
var_dump($process->read());

// With the timeout relaxed to 2 seconds, the read succeeds
$process->setTimeout(2);
echo $process->read();

Process::wait();
```

### exportSocket

Export the `unixSocket` as a `Swoole\Coroutine\Socket` object and use its methods for inter-process communication; see [Socket Client](/en/client/socket.html) for usage.

```php
public function exportSocket(): Swoole\Coroutine\Socket|false
```

**Return value**: Returns a `Coroutine\Socket` object on success; returns `false` if the process did not create a `unixSocket`.

> [!NOTE]
> Multiple calls return the same object. The exported `socket` is a new `fd`; closing it does not affect the process's original pipe.

> [!IMPORTANT]
> `Coroutine\Socket` can only be used inside a [coroutine container](/en/coroutine/container.html), so the constructor's `$enable_coroutine` must be `true`; on the parent process side, create the container yourself with `Coroutine\run()`.

**Example**

Parent-child communication:

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

$proc1 = new Process(function (Process $proc) {
    $socket = $proc->exportSocket();
    echo $socket->recv();
    $socket->send("hello master\n");
    echo "proc1 stop\n";
}, false, 1, true);

$proc1->start();

// The parent process creates a coroutine container
run(function () use ($proc1) {
    $socket = $proc1->exportSocket();
    $socket->send("hello pro1\n");
    var_dump($socket->recv());
});
Process::wait(true);
```

The `SOCK_DGRAM` type requires no handling of `TCP` packet boundaries:

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

// For IPC, even a SOCK_DGRAM socket does not need the sendto / recvfrom pair; send / recv are enough.
$proc1 = new Process(function (Process $proc) {
    $socket = $proc->exportSocket();
    while (1) {
        var_dump($socket->send("hello master\n"));
    }
    echo "proc1 stop\n";
}, false, 2, 1); // Passing 2 as the constructor's pipe type means SOCK_DGRAM

$proc1->start();

run(function () use ($proc1) {
    $socket = $proc1->exportSocket();
    Swoole\Coroutine::sleep(5);
    var_dump(strlen($socket->recv())); // A single recv receives exactly one "hello master\n" string, never multiple
});

Process::wait(true);
```

> [!WARNING]
> The `SOCK_STREAM` type requires handling `TCP` packet boundaries; see the `setProtocol()` method in [Socket Client](/en/client/socket.html).

### close

Close the created `unixSocket` pipe communication.

```php
public function close(int $which = 0): bool
```
| Parameter | Description | Default |
|:---|:---|:---|
| `$which` | Specify which end of the Unix Socket to close (the socket is full-duplex):<br>`0` means both read and write ends, `Swoole\Process::PIPE_WRITE` means the write end, `Swoole\Process::PIPE_READ` means the read end | `0` |

> [!NOTE]
> In some cases the `Process` object cannot be released, and continuously creating processes leads to connection leaks; call this method to close the `unixSocket` and release resources.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->write("hello parent\n");
});
$process->start();

echo $process->read();

// 0 closes both ends; you can also pass Process::PIPE_WRITE / Process::PIPE_READ to close only one end
$process->close(0);

Process::wait();
```

## Message Queue Communication

### useQueue

Use a message queue for inter-process communication.

```php
public function useQueue(int $key = 0, int $mode = SWOOLE_MSGQUEUE_BALANCE, int $capacity = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the message queue. When a value `<= 0` is passed, the underlying layer uses `ftok` to generate the `key` from the filename of the currently executing file | `0` |
| `$mode` | Communication mode.<br>`SWOOLE_MSGQUEUE_BALANCE`: `pop()` takes the first message in the queue, and `push()` attaches no type. All processes compete equally; whoever calls `pop()` first takes the head message. This is competitive consumption/load balancing, suitable for multiple processes handling the same batch of tasks;<br>`SWOOLE_MSGQUEUE_ORIENT`: `push()` attaches `process id + 1` as the type, and `pop()` only takes messages of that type. Messages are delivered precisely to the specified process. This is directed delivery, suitable for point-to-point communication | `SWOOLE_MSGQUEUE_BALANCE` |
| `$capacity` | Maximum total bytes of data the queue can store (corresponds to the system's `msg_qbytes`) | `-1` |

> [!WARNING]
> `pop()` blocks when the queue is empty, and `push()` blocks when the queue is full. For non-blocking behavior, `$mode` must be `SWOOLE_MSGQUEUE_BALANCE | Swoole\Process::IPC_NOWAIT` or `SWOOLE_MSGQUEUE_ORIENT | Swoole\Process::IPC_NOWAIT`.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

// Must be called before start() so the child process shares the same queue
$process->useQueue();
$process->start();

$process->push("hello queue\n");

Process::wait();
$process->freeQueue();
```

### statQueue

Get the message queue status.

```php
public function statQueue(): array|false
```

**Return value**: Returns an array on success, where `queue_num` is the total number of messages in the queue and `queue_bytes` is the total number of message bytes; returns `false` on failure.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
});

$process->useQueue();
$process->start();

$process->push('hello');
$process->push('swoole');

// queue_num is the message count; queue_bytes is the total message bytes
var_dump($process->statQueue());

Process::wait();
$process->freeQueue();
```

### freeQueue

Destroy the message queue.

```php
public function freeQueue(): bool
```

**Return value**: Returns `true` on success, or `false` on failure.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

$process->useQueue();
$process->start();

$process->push("hello queue\n");
Process::wait();

// The queue is maintained by the kernel and persists after the process exits; it must be destroyed explicitly
var_dump($process->freeQueue());
```

### pop

Read data from the message queue.

```php
public function pop(int $size = 65536): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$size` | Maximum amount of data per read, in bytes | `65536` |

**Return value**: Returns a `string` on success, or `false` on failure.

- `SWOOLE_MSGQUEUE_BALANCE`: returns the first message in the queue.
- `SWOOLE_MSGQUEUE_ORIENT`: returns the first message whose type is `process id + 1`.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // BALANCE mode takes messages in enqueue order
    var_dump($child->pop());
    var_dump($child->pop());
});

$process->useQueue();
$process->start();

$process->push('first');
$process->push('second');

Process::wait();
$process->freeQueue();
```

### push

Write data to the message queue.

```php
public function push(string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to write | Required |

**Return value**: Returns `true` on success, or `false` on failure.

- `SWOOLE_MSGQUEUE_BALANCE`: data is enqueued directly.
- `SWOOLE_MSGQUEUE_ORIENT`: data is tagged with the type `process id + 1`.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

$process->useQueue();
$process->start();

var_dump($process->push("hello queue\n"));

Process::wait();
$process->freeQueue();
```

## Signals and High-Resolution Timers

### signal

Register an async signal listener, implemented with `signalfd` and the `EventLoop`.

```php
public static function signal(int $signo, ?callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$signo` | Signal number | Required |
| `$callback` | Signal callback function; pass `null` to remove the listener | Required |

- The callback will not run in a blocking program; use `pcntl_signal` from the `pcntl` extension instead.
- Setting the same signal again overwrites the existing callback.
- In multi-thread mode only the main thread can execute this method; calling it in a worker thread returns `true` immediately but the listener does not take effect. See [Unavailable Features](/en/thread/create.html#unavailable-features) for details.

> [!WARNING]
> Some signals cannot be listened for in [`Swoole\Server`](/en/server/tcp_udp.html), such as `SIGTERM` and `SIGALRM`.

**Example**

```php
<?php
Swoole\Process::signal(SIGTERM, function ($signo) {
    echo "shutdown.";
});
```

> [!WARNING]
> In `v4.4.0`, if the `EventLoop` contains only signal listener events and no other events (such as `Timer`), the process exits immediately.

```php
<?php
Swoole\Process::signal(SIGTERM, function ($signo) {
    echo "shutdown.";
});
Swoole\Event::wait();
```

This program never enters the `EventLoop`; [`Swoole\Event::wait()`](/en/event.html#wait) returns immediately and the process exits.

### alarm

High-resolution timer, wrapping the `setitimer` system call with microsecond precision. It triggers a signal on expiry and must be used with [Process::signal](#signal) or `pcntl_signal`.

```php
public static function alarm(int $time, int $type = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$time` | Timer interval in microseconds; a negative value clears the timer | Required |
| `$type` | Timer type; see the table below for values | `0` |

| Timer type | Description |
|:---|:---|
| `0` | Real (wall-clock) time, triggers the `SIGALRM` signal |
| `1` | User-mode `CPU` time, triggers the `SIGVTALRM` signal |
| `2` | User-mode + kernel-mode time, triggers the `SIGPROF` signal |

**Return value**: Returns `true` on success, or `false` on failure. Use `swoole_errno` to get the error code.

> [!WARNING]
> `alarm` cannot be used together with [Timer](/en/timer.html).

**Example**

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

run(function () {
    Process::signal(SIGALRM, function () {
        static $i = 0;
        echo "#{$i}\talarm\n";
        $i++;
        if ($i > 20) {
            Process::alarm(-1);
            Process::kill(getmypid());
        }
    });

    // 100ms
    Process::alarm(100 * 1000);

    while (true) {
        sleep(0.5);
    }
});
```

## CPU Affinity and Priority

### setAffinity

Set `CPU` affinity, binding the process to specified `CPU` cores and leaving the remaining cores to more important programs.

```php
public static function setAffinity(array $cpus): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cpus` | List of `CPU` cores to bind to; `array(0, 2, 3)` binds to `CPU0/CPU2/CPU3` | Required |

> [!WARNING]
> - The number of elements must not exceed the number of `CPU` cores, and a `CPU-ID` must not exceed the number of `CPU` cores - `1`
> - The operating system must support `CPU` binding
> - `swoole_cpu_num()` returns the number of `CPU` cores on the current server

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // CPU-ID must not exceed swoole_cpu_num() - 1
    var_dump(Process::setAffinity([0, 1]));
});

$process->start();

Process::wait();
```

### getAffinity

Get the process's `CPU` affinity.

```php
public static function getAffinity(): array
```

**Return value**: Returns an array of `CPU` core `ID`s; e.g. `[0, 1, 3, 4]` means the process can be scheduled to run on cores `0/1/3/4`.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    Process::setAffinity([0, 1]);
    var_dump(Process::getAffinity());
});

$process->start();

Process::wait();
```

### setPriority

Make the specified process (or process group, or user's processes) scheduled by the kernel with higher or lower priority when competing for CPU resources.

```php
public function setPriority(int $which, int $priority): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$which` | Scope of the priority; see the table below for values | Required |
| `$priority` | Priority, in the range `[-20, 19]`; the smaller the value, the higher the priority | Required |

| Constant | Description |
|:---|:---|
| `Swoole\Process::PRIO_PROCESS` | The target is a single process. This is the most commonly used default type. |
| `Swoole\Process::PRIO_PGRP` | The target is a process group. Setting or getting affects the relevant processes in that group. |
| `Swoole\Process::PRIO_USER` | The target is all processes owned by the specified user. |

**Return value**: Returns `true` on success, or `false` on failure. Use `swoole_errno` and `swoole_strerror` to get the error code and error message.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // Lowering priority (increasing the value) requires no privileges; raising it requires the appropriate permissions
    var_dump($child->setPriority(Process::PRIO_PROCESS, 10));
});

$process->start();

Process::wait();
```

### getPriority

Get the process's priority.

```php
public function getPriority(int $which): int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$which` | Scope of the priority; same values as [setPriority](#setpriority) | Required |

**Return value**: Returns the current priority.

**Example**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->setPriority(Process::PRIO_PROCESS, 10);
    var_dump($child->getPriority(Process::PRIO_PROCESS));
});

$process->start();

Process::wait();
```