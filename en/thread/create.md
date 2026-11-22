# Creating Threads

Since version `6.0`, `Swoole` provides multi-threading support through `Swoole\Thread`, allowing you to use the thread `API` instead of multiple processes. Compared with multi-processing, `Thread` provides richer concurrent data containers, making it more convenient for developing game servers and communication servers.

## Requirements

- `PHP` must be built in `ZTS` mode; add `--enable-zts` when compiling `PHP`
- Add the `--enable-swoole-thread` compile option when compiling `Swoole`

### Checking Thread Support

```shell
php -v
PHP 8.1.23 (cli) (built: Mar 20 2024 19:48:19) (ZTS)
Copyright (c) The PHP Group
Zend Engine v4.1.23, Copyright (c) Zend Technologies
```

`(ZTS)` indicates that thread safety is enabled.

```shell
php --ri swoole

swoole
Swoole => enabled
thread => enabled
```

`thread => enabled` indicates that multi-threading support is enabled.

## Notes

### Resource Isolation

`Swoole` threads are similar to `Node.js Worker Thread`: a brand-new `ZendVM` environment is created in each child thread. A child thread does not inherit any resources from the parent thread, so the following items are cleared in the child thread and must be recreated or reconfigured.

- Loaded `PHP` files; they must be loaded again with `include/require`
- The `autoload` function must be registered again
- Classes, functions, and constants are cleared; reload the `PHP` files to recreate them
- Global variables such as `$GLOBALS`, `$_GET/$_POST`, etc. are reset
- Static class properties and static variables in functions are reset to their initial values
- Some `php.ini` options, such as `error_reporting()`, must be set again in the child thread

### Unavailable Features

In multi-threading mode, the following features can only be used in the main thread; they are not supported in child threads:

- `swoole_async_set()` for modifying thread parameters
- [`Swoole\Runtime::enableCoroutine()`](/en/coroutine/hook.html#enablecoroutine) and [`Swoole\Runtime::setHookFlags()`](/en/coroutine/hook.html#sethookflags)
- Only the main thread can register signal listeners. [`Process::signal`](/en/process/process.html#signal) returns `true` directly when called in a worker thread, but the listener does not take effect; [`Coroutine\System::waitSignal()`](/en/coroutine/system_api.html#waitsignal) cannot be used in child threads
- Only the main thread can create async servers; [`Server`](/en/server/tcp_udp.html), [`Http\Server`](/en/server/http.html), [`WebSocket\Server`](/en/server/websocket.html), etc. cannot be used in child threads

In addition, once the `Runtime Hook` is enabled in multi-threading mode, it cannot be disabled.

### Fatal Errors

If active child threads still exist when the main thread exits, a fatal error is thrown with exit status code `200` and the following message:

```shell
Fatal Error: 2 active threads are running, cannot exit safely.
```

## Examples

### Creating Multiple Threads

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();
$c = 4;

// The main thread has no thread arguments, so $args is null
if (empty($args)) {
    // Main thread
    $threads = [];
    for ($i = 0; $i < $c; $i++) {
        $threads[] = new Thread(__FILE__, $i);
    }
    for ($i = 0; $i < $c; $i++) {
        $threads[$i]->join();
    }
} else {
    // Child thread
    echo "Thread #" . $args[0] . "\n";
    // In this example the loop exits after 5 iterations so that join() in the main thread can return; in real applications this can be a long-running loop
    for ($i = 0; $i < 5; $i++) {
        sleep(1);
        file_get_contents('https://www.baidu.com/');
    }
}
```

### Threads + Server (Async Style)

- All worker processes run as threads, including `Worker`, `Task Worker`, and `User Process`
- A new [`SWOOLE_THREAD`](/en/server/process_thread.html#swoole-thread) working mode is added; when enabled, threads are used instead of processes
- Two configuration options, [`bootstrap`](/en/server/setting.html#bootstrap) and [`init_arguments`](/en/server/setting.html#init-arguments), are added for setting the entry script file of worker threads and thread-shared data
- The [`Server`](/en/server/tcp_udp.html) must be created in the main thread; new `Thread` instances can be created in callback functions to perform other tasks
- The process object of [`Server::addProcess()`](/en/server/methods.html#addprocess) does not support standard input/output redirection

```php
<?php
use Swoole\Process;
use Swoole\Thread;
use Swoole\Http\Server;

$http = new Server("0.0.0.0", 9503, SWOOLE_THREAD);
$http->set([
    'worker_num' => 2,
    'task_worker_num' => 3,
    'bootstrap' => __FILE__,
    // Share data between threads via init_arguments
    'init_arguments' => function () use ($http) {
        $map = new Swoole\Thread\Map();
        return [$map];
    }
]);

$http->on('Request', function ($req, $resp) use ($http) {
    $resp->end('hello world');
});

$http->on('pipeMessage', function ($http, $srcWorkerId, $msg) {
    echo "[worker#" . $http->getWorkerId() . "]\treceived pipe message[$msg] from " . $srcWorkerId . "\n";
});

$http->addProcess(new Process(function () {
    echo "user process, id=" . Thread::getId();
    sleep(2000);
}));

$http->on('Task', function ($server, $taskId, $srcWorkerId, $data) {
    var_dump($taskId, $srcWorkerId, $data);
    return ['result' => uniqid()];
});

$http->on('Finish', function ($server, $taskId, $data) {
    var_dump($taskId, $data);
});

$http->on('WorkerStart', function ($serv, $wid) {
    // Retrieve the shared data passed via init_arguments in the configuration through Swoole\Thread::getArguments()
    var_dump(Thread::getArguments(), $wid);
});

$http->on('WorkerStop', function ($serv, $wid) {
    var_dump('stop: T' . Thread::getId());
});

$http->start();
```

## Properties

### id

Gets the `ID` of the child thread through this object property. The property is of type `int`.

```php
public int $id
```

> [!NOTE]
> This property is only for use in the parent thread. A child thread cannot obtain the `$thread` object; use the [getId](#getid) static method to get the thread's `ID`.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__, 1);
    var_dump($thread->id);
    $thread->join();
}
```

## Methods

### __construct

Thread constructor.

```php
public function __construct(string $script_file, mixed ...$args)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$script_file` | The file to execute after the thread starts | Required |
| `$args` | Shared data passed from the main thread to the child thread; retrieve it in the child thread with [getArguments](#getarguments); variadic | None |

> [!WARNING]
> If thread creation fails, a `Swoole\Exception` is thrown, which can be caught with `try catch`.

**Example**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    // Main thread: create a child thread and pass shared data
    $thread = new Thread(__FILE__, 'child thread');
    $thread->join();
} else {
    // Child thread
    var_dump($args);
}
```

### join

The main thread waits for the child thread to exit. If the child thread is still running, `join()` blocks until the child thread exits.

```php
public function join(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    // Main thread
    $thread = new Thread(__FILE__);
    // Block and wait for the child thread to exit
    var_dump($thread->join());
} else {
    // Child thread
    sleep(1);
    echo "child thread is finished\n";
}
```

### joinable

Checks whether the child thread can be `join()`ed. This method returns `false` in two cases:

1. The thread has executed `detach()`, so `join()` can no longer be used to wait for it to exit
2. The thread has exited and `join()` has been executed to reclaim it

```php
public function joinable(): bool
```

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    var_dump($thread->joinable());

    $thread->join();
    // The thread has exited and been reclaimed by join(); it is no longer joinable
    var_dump($thread->joinable());
}
```

### getExitStatus

Gets the exit status code of the child thread.

```php
public function getExitStatus(): int
```

**Return value**: Returns the exit status code of the child thread.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    $thread->join();
    var_dump($thread->getExitStatus());
}
```

### isAlive

Checks whether the thread is alive. This function can always be called, regardless of whether the thread has executed `detach()` or `join()`.

```php
public function isAlive(): bool
```

**Return value**: Returns `true` if the thread is alive, `false` if the thread has exited.

> [!NOTE]
> This method does not block.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    var_dump($thread->isAlive());

    $thread->join();
    var_dump($thread->isAlive());
} else {
    sleep(1);
}
```

### detach

Detaches the child thread from the main thread's control, so `join()` is no longer needed to wait for the thread to exit.

```php
public function detach(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

> [!WARNING]
> The main thread must wait for all child threads to finish before exiting; otherwise a [fatal error](#fatal-errors) is triggered.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    // After detaching, join() is no longer needed
    var_dump($thread->detach());

    // After detach(), isAlive() can still be called to wait for the thread to finish
    while ($thread->isAlive()) {
        sleep(1);
    }
} else {
    sleep(3);
}
```

### getArguments

Static method that gets the shared data passed by the main thread when calling `new Swoole\Thread()`. Call it in the child thread.

```php
public static function getArguments(): ?array
```

**Return value**: In a child thread, returns the shared data passed by the parent thread; the main thread has no thread arguments and returns `null`.

> [!NOTE]
> The main thread never has any thread arguments. You can distinguish the parent thread from child threads by checking whether the thread arguments are empty, letting them execute different logic.

**Example**

```php
<?php
use Swoole\Thread;

// In the main thread, $args is empty; in a child thread, $args is not empty
$args = Thread::getArguments();

if (empty($args)) {
    // Main thread, pass thread arguments
    $thread = new Thread(__FILE__, 'child thread');
    echo "main thread\n";
    $thread->join();
} else {
    // Child thread, outputs ['child thread']
    var_dump($args);
}
```

### getId

Static method that gets the `ID` of the current thread.

```php
public static function getId(): int
```

**Return value**: Returns an integer of type `int`, representing the `id` of the current thread.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    echo "main thread id: " . Thread::getId() . "\n";
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    echo "child thread id: " . Thread::getId() . "\n";
}
```

### getInfo

Static method that gets information about the current multi-threading environment.

```php
public static function getInfo(): array
```

**Return value**: Returns an array with the following information:

- `is_main_thread`: whether the current thread is the main thread
- `is_shutdown`: whether the thread has shut down
- `thread_num`: the number of currently active threads

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    var_dump(Thread::getInfo());
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    var_dump(Thread::getInfo());
}
```

### activeCount

Static method that gets the number of currently active threads.

```php
public static function activeCount(): int
```

**Return value**: Returns an integer of type `int`, representing the number of currently active threads. The return value of this method is always an integer greater than or equal to `1`.

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $threads = [new Thread(__FILE__), new Thread(__FILE__)];

    var_dump(Thread::activeCount());

    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    sleep(1);
}
```

### yield

Static method that yields the current thread's execution time slice. After the call, the current thread is suspended while the operating system scheduler gives other threads priority; the current thread is assigned a new time slice in the next scheduling cycle.

```php
public static function yield(): void
```

**Example**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    for ($i = 0; $i < 100; $i++) {
        // Yield the time slice so the scheduler gives other threads priority
        Thread::yield();
    }
}
```

### getPriority

Static method that gets the scheduling information of the current thread.

```php
public static function getPriority(): array
```

**Return value**: Returns an array with the following information:

- `policy`: the thread scheduling policy
- `priority`: the thread's scheduling priority

**Example**

```php
<?php
use Swoole\Thread;

var_dump(Thread::getPriority());
```

### setPriority

Static method that sets the scheduling priority and policy of the current thread.

```php
public static function setPriority(int $priority, int $policy = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$priority` | Sets the thread scheduling priority | Required |
| `$policy` | Sets the thread scheduling policy; other values are the [`Thread::SCHED_*`](#constants) constants | `-1`, meaning the scheduling policy is not changed |

**Return value**: Returns `true` on success; returns `false` on failure, use `swoole_last_error()` to get the error message.

> [!WARNING]
> Only the `root` user can adjust this; calls from non-`root` users are rejected.

> [!NOTE]
> `SCHED_BATCH`, `SCHED_ISO`, `SCHED_IDLE`, and `SCHED_DEADLINE` are only available on `Linux`.
>
> Threads with the `SCHED_FIFO` or `SCHED_RR` policy are generally real-time threads. They have higher priority than ordinary threads and can obtain more `CPU` time slices.

**Example**

```php
<?php
use Swoole\Thread;

// Adjust only the priority, not the scheduling policy; requires root privileges
var_dump(Thread::setPriority(10));

// Also specify the scheduling policy
var_dump(Thread::setPriority(10, Thread::SCHED_RR));
```

### getAffinity

Static method that gets the current thread's `CPU` affinity.

```php
public static function getAffinity(): array
```

**Return value**: Returns an array whose elements are `CPU` core numbers. For example, `[0, 1, 3, 4]` means this thread will be scheduled to run on `CPU` cores `0/1/3/4`.

**Example**

```php
<?php
use Swoole\Thread;

var_dump(Thread::getAffinity());
```

### setAffinity

Static method that sets the current thread's `CPU` affinity.

```php
public static function setAffinity(array $cpu_set): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cpu_set` | List of `CPU` cores, for example `[0, 1, 3, 4]` | Required |

**Return value**: Returns `true` on success; returns `false` on failure, use `swoole_last_error()` to get the error message.

**Example**

```php
<?php
use Swoole\Thread;

// Bind the current thread to CPU cores 0 and 1
var_dump(Thread::setAffinity([0, 1]));
var_dump(Thread::getAffinity());
```

### setName

Static method that sets the name of the current thread, providing a friendlier display when inspecting and debugging with tools such as `ps` and `gdb`.

```php
public static function setName(string $name): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | Thread name | Required |

**Return value**: Returns `true` on success; returns `false` on failure, use `swoole_last_error()` to get the error message.

**Example**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    // Main thread
    Thread::setName('Master Thread');

    $threads = [];
    for ($i = 0; $i < 4; $i++) {
        $threads[] = new Thread(__FILE__, $i);
    }
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // Child thread
    Thread::setName('Worker Thread ' . $args[0]);
    sleep(60);
}
```

After setting the names, use `ps` to view the thread names:

```shell
$ ps aux|grep -v grep|grep pool.php
swoole   2226813  0.1  0.1 423860 49024 pts/6    Sl+  17:38   0:00 php pool.php

$ ps -T -p 2226813
    PID    SPID TTY          TIME CMD
2226813 2226813 pts/6    00:00:00 Master Thread
2226813 2226814 pts/6    00:00:00 Worker Thread 0
2226813 2226815 pts/6    00:00:00 Worker Thread 1
2226813 2226816 pts/6    00:00:00 Worker Thread 2
2226813 2226817 pts/6    00:00:00 Worker Thread 3
```

### getNativeId

Gets the system `ID` of the thread. Returns an integer, similar to a process `PID`.

```php
public static function getNativeId(): int
```

**Return value**: Returns the system `ID` of the thread.

On `Linux`, this function invokes the `gettid()` system call to get the operating system thread `ID`, which is a short integer. After the thread is destroyed, this `ID` may be reused by the operating system.

This `ID` can be used for debugging with `gdb` and `strace`, for example `gdb -p $tid`. You can also read `/proc/{PID}/task/{ThreadNativeId}` to get the thread's execution information.

**Example**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

// The main thread has no thread arguments, so $args is null; use this to distinguish the main thread from child threads
if (empty($args)) {
    echo "main thread native id: " . Thread::getNativeId() . "\n";
    $thread = new Thread(__FILE__, 1);
    $thread->join();
} else {
    echo "child thread native id: " . Thread::getNativeId() . "\n";
}
```

## Constants

| Constant | Description |
|:---|:---|
| `Thread::HARDWARE_CONCURRENCY` | The number of hardware-concurrent threads, usually the number of `CPU` cores |
| `Thread::API_NAME` | The thread `API` name, for example `POSIX Threads` |
| `Thread::SCHED_OTHER` | The default time-sharing scheduling policy, non-real-time. The fair scheduler allocates `CPU` time according to the `nice` value (`-20 ~ 19`); suitable for the vast majority of ordinary tasks |
| `Thread::SCHED_FIFO` | Real-time policy, first-in-first-out, priority range `1 ~ 99`. The thread keeps running until it blocks voluntarily, yields the `CPU`, or is preempted by a higher-priority real-time thread; threads of the same priority do not rotate |
| `Thread::SCHED_RR` | Real-time policy, round-robin time slicing, priority range `1 ~ 99`. Basically the same as `SCHED_FIFO`, but threads of the same priority take turns running by time slice |
| `Thread::SCHED_BATCH` | Non-real-time policy for batch tasks that occupy the `CPU` for long periods. The scheduler treats them as non-interactive tasks and gives no preference in wake-up preemption; priority is likewise determined by the `nice` value |
| `Thread::SCHED_ISO` | Isochronous policy that lets unprivileged users achieve near-real-time low latency while capping their `CPU` usage. The mainline kernel only reserves the policy number without implementing it; only `-ck` / `MuQSS` patched kernels support it |
| `Thread::SCHED_IDLE` | Non-real-time policy with priority even lower than ordinary tasks with a `nice` value of `19`; runs only when the `CPU` is idle and is not affected by the `nice` value |
| `Thread::SCHED_DEADLINE` | Real-time policy with higher priority than `SCHED_FIFO` / `SCHED_RR`. Scheduled by earliest deadline first (`EDF`), guaranteeing the thread a specified runtime budget within each period; the budget, deadline, and period must be set via `sched_setattr()` — the priority parameter alone cannot fully configure it |

> [!WARNING]
> `SCHED_FIFO`, `SCHED_RR`, and `SCHED_DEADLINE` are real-time policies: as long as such a thread is runnable, it preempts ordinary threads. If a real-time thread contains an infinite loop or a long computation without blocking, other threads and even system services on the same `CPU` core may never get scheduled.

**Example**

```php
<?php
use Swoole\Thread;

var_dump(Thread::HARDWARE_CONCURRENCY, Thread::API_NAME);
```

## Data Types

The data types that can be passed and shared between threads are listed here.

### Scalar Types

Variables of type `null`, `bool`, `int`, and `float` occupy less than `16 Bytes` of memory and are passed by value.

### Strings

Strings are **memory-copied** when stored into `ArrayList`, `Queue`, or `Map`.

### Socket Resources

**Supported types**

- [`Co\Socket`](/en/client/socket.html)
- `PHP Stream`
- `PHP Socket(ext-sockets)`, requires the `--enable-sockets` compile option

**Unsupported types**

- [`Swoole\Client`](/en/client/sync.html)
- [`Swoole\Server`](/en/server/tcp_udp.html)
- [`Swoole\Coroutine\Client`](/en/client/tcp_udp.html)
- [`Swoole\Coroutine\Http\Client`](/en/client/http_websocket.html)
- `pdo` connections
- `redis` connections
- Other special `Socket` resource types

**Resource duplication**

- On write, a `dup(fd)` operation is performed, separating the new resource from the original one so they do not affect each other; calling `close` on the original resource does not affect the new one
- On read, a `dup(fd)` operation is performed and a new `Socket` resource is constructed inside the reading child thread's `VM`
- On delete, a `close(fd)` operation is performed to release the file handle

This means a `Socket` resource can have `3` references, namely:

- The thread where the `Socket` resource was originally created
- The `ArrayList`, `Queue`, or `Map` container
- The child thread that reads from the `ArrayList`, `Queue`, or `Map` container

The `Socket` resource is actually released only when no thread or container holds it and the reference count drops to `0`. While the reference count is not `0`, even executing a `close` operation will not close the connection and will not affect the `Socket` resources held by other threads or data containers.

To ignore the reference count and close the `Socket` directly, use a `shutdown()` method, for example:

- `stream_socket_shutdown()`
- [`Socket::shutdown()`](/en/client/socket.html#shutdown)
- `socket_shutdown()`

> [!WARNING]
> The `shutdown` operation affects the `Socket` resource held by all threads; after it is executed, the resource is no longer usable and `read/write` operations cannot be performed.

### Arrays

The array type is determined with `array_is_list()`: numerically indexed arrays are converted to `ArrayList`, and associative arrays are converted to `Map`.

- The entire array is traversed and its elements are inserted into the `ArrayList` or `Map`
- Multi-dimensional arrays are supported; they are traversed recursively and converted into nested `ArrayList` or `Map` structures

**Example**

```php
<?php
use Swoole\Thread\Map;

$array = [
    'a' => random_int(1, 999999999999999999),
    'b' => random_bytes(128),
    'c' => uniqid(),
    'd' => time(),
    'e' => [
        'key' => 'value',
        'hello' => 'world',
    ],
];

$map = new Map($array);

// $map['e'] is a new Map object containing two elements, key and hello, with values 'value' and 'world'
var_dump($map['e']);
```

### Objects

**Thread resource objects**

Thread resource objects such as `Thread\Lock`, `Thread\Atomic`, `Thread\ArrayList`, and `Thread\Map` can be stored directly into `ArrayList`, `Queue`, or `Map`. This operation only stores a reference to the object in the container; the object is not copied.

Writing an object into an `ArrayList` or `Map` merely increments the thread resource's reference count by one, without copying. When the object's reference count reaches `0`, it is released.

**Example**

```php
<?php
use Swoole\Thread;

$map = new Thread\Map();
$lock = new Thread\Lock(); // Reference count is now 1
$map['lock'] = $lock; // Reference count is now 2
unset($map['lock']); // Reference count is now 1
unset($lock); // Reference count is now 0; the Lock object is released
```

Supported list:

- [`Thread\Lock`](/en/lock.html#namespace)
- [`Thread\Atomic`](/en/atomic.html)
- [`Thread\Atomic\Long`](/en/atomic.html)
- [`Thread\Barrier`](/en/thread/barrier.html)
- [`Thread\ArrayList`](/en/thread/container.html#arraylist)
- [`Thread\Map`](/en/thread/container.html#map)
- [`Thread\Queue`](/en/thread/container.html#queue)

> [!WARNING]
> Note that `Thread` thread objects cannot be serialized or passed; they are only usable in the parent thread.

**Ordinary PHP objects**

They are automatically serialized on write and unserialized on read. Note that if an object contains non-serializable types, an exception is thrown.