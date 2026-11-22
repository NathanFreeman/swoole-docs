# Lock

- `Swoole` provides convenient lock mechanisms to ensure data synchronization, fully supporting three types: `process locks`, `thread locks`, and `coroutine locks`. All three types of locks can be used across processes/threads; they differ in control granularity.

> [!IMPORTANT]
> When using a `process lock` or `thread lock` in a coroutine, if the lock is not acquired, the entire process (or thread) is blocked, so the current coroutine and all other coroutines in the same process cannot continue executing, because operating-system-level locks put the current execution unit to sleep and do not voluntarily yield the CPU.
> In contrast, when a `coroutine lock` fails to acquire the lock, it voluntarily yields the current coroutine's CPU control and hands the execution opportunity to the scheduler to run other ready coroutines, so it does not block the process or thread, achieving efficient concurrency control.

## Namespace

- `Swoole\Lock`: process lock, used for cross-process data synchronization.
- `Swoole\Thread\Lock`: thread lock, used for cross-thread data synchronization.
- `Swoole\Coroutine\Lock`: coroutine lock, used for multi-coroutine data synchronization across different processes/threads.

> [!NOTE]
> Thread locks require `PHP` in `ZTS` mode and `Swoole` compiled with the `--enable-swoole-thread` option; otherwise the `Swoole\Thread\Lock` class does not exist.

## Methods

### __construct

Creates a lock.

**Constructor signature of process locks and thread locks**

```php
public function __construct(int $type = SWOOLE_MUTEX)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$type` | Lock type; other values: `SWOOLE_RWLOCK` [read-write lock], `SWOOLE_SPINLOCK` [spinlock] | `SWOOLE_MUTEX` [mutex] |

**Constructor signature of coroutine locks**

```php
public function __construct(bool $shared = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$shared` | Whether to share across processes/threads; other values: `true` | `false` |

### lock

Locking operation.

**lock function signature of process locks and thread locks**

```php
public function lock(int $operation = LOCK_EX, float $timeout = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$operation` | Lock operation type; other values: `LOCK_SH` [acquire a shared lock (reading programs)] | `LOCK_EX` [acquire an exclusive lock (writing programs)] |
| `$timeout` | Timeout | `-1` [never times out] |

**Return value**: Returns `true` on success, `false` on failure.

**lock signature of coroutine locks**

```php
public function lock(int $operation = LOCK_EX): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$operation` | Lock operation type; other values: `LOCK_SH` [acquire a shared lock (reading programs)] | `LOCK_EX` [acquire an exclusive lock (writing programs)] |

**Return value**: Returns `true` on success, `false` on failure.

### unlock

Unlocking operation.

```php
public function unlock(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

## Examples

- Using a process lock between processes

```php
<?php
use Swoole\Process;
use Swoole\Lock;
use Swoole\Table;

$lock = new Lock(SWOOLE_MUTEX); // The lock must be created before creating processes
for($i = 0; $i < 10; $i++) {
    $process = new Process(function($process) use ($lock, $i) {
        $lock->lock(LOCK_EX);
        echo "Process $i acquired the lock; unlocking after sleeping 1 second" . PHP_EOL;
        file_put_contents('/tmp/lock.log', (string) $i, FILE_APPEND);
        sleep(1);
        $lock->unlock();
    });
    $process->start();
}

for($i = 0; $i < 10; $i++) {
    Process::wait();
}
```

- Using a thread lock between threads

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Lock;

$count = 10;
$args = Thread::getArguments();
if (!$args) {
    $threads = [];
    $lock = new Lock();
    for($i = 0; $i < $count; $i++) {
        $threads[] = new Thread(__FILE__, $lock, $i);
    }
    
    for($i = 0; $i < $count; $i++) {
        $threads[$i]->join();
    }
} else {
    $lock = $args[0];
    $index = $args[1];
    $lock->lock();
    echo "Thread $index started" . PHP_EOL;
    sleep(1);
    $lock->unlock();
}
```

- Using a coroutine lock between coroutines

```php
<?php
use Swoole\Coroutine\Lock;
use Swoole\Coroutine\WaitGroup;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

$lock = new Lock(true);
$waitGroup = new WaitGroup();
run(function() use ($lock, $waitGroup) {
    for($i = 0; $i < 10; $i++) {
        go(function() use ($i, $lock, $waitGroup) {
            $waitGroup->add();
            $lock->lock(LOCK_EX);
            echo "Coroutine $i acquired the lock; sleeping 1s" . PHP_EOL;
            sleep(1);
            $lock->unlock();
            $waitGroup->done();
        });
    }
    
    echo "Locking a coroutine lock does not block the process" . PHP_EOL;
    $waitGroup->wait();
});
```

- Using a lock in an async server

```php
<?php
use Swoole\Coroutine\Lock;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$lock = new Lock(true);  // true means multiple processes share this lock
$server = new Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => swoole_cpu_num(),
    'enable_coroutine' => true
]);

$server->on('request', function(Request $request, Response $response) use ($lock) {
    $lock->lock();
    // Some operations that must be atomic
    $lock->unlock();
    $response->end();
});

$server->start();
```

## Notes

- Locking and unlocking must be done in the same `process/thread/coroutine`, otherwise race-condition protection will be broken.
- To ensure a `lock` can be shared among multiple `processes`, `threads`, or `coroutines`, the lock must be instantiated before creating those `processes`, `threads`, or `coroutines`.
- Do not create locks in events such as [receive](/en/server/events.html#receive), otherwise memory will keep growing, causing a memory leak.

## Deadlock

- In a coroutine environment, when using a `process lock` or `thread lock`, avoid calling any API that may trigger a coroutine switch between `lock()` and `unlock()`. Otherwise, after the current coroutine is suspended without releasing the lock, other coroutines will never be able to acquire that lock, resulting in a `100%` deadlock.

```php
<?php
use Swoole\Lock;
use Swoole\Coroutine\WaitGroup;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

$lock = new Lock();
$waitGroup = new WaitGroup();
run(function() use($lock, $waitGroup) {
    $n = 2;
    while($n--) {
        // After coroutine 1 acquires the lock, it goes to sleep and voluntarily yields the CPU. At this point coroutine 2 starts executing and tries to acquire the same lock, but since the lock is still held by coroutine 1, coroutine 2 blocks when acquiring the lock.
        // This blocking causes the entire operating system thread to be suspended. Even if coroutine 1 later finishes sleeping and is ready to resume, it cannot continue executing because the process is already blocked.
        // Ultimately, due to the improper interplay between lock contention and the coroutine scheduling mechanism, the system falls into an unrecoverable deadlock state.
        go(function() use($lock, $waitGroup) {
            $waitGroup->add();
            $lock->lock();
            sleep(1); // A coroutine switch occurs
            $lock->unlock();
            $waitGroup->done();
        });
    }
    $waitGroup->wait();
});
```

## io_uring vs Exponential Backoff

- If the [`--enable-iouring`](/en/start/install.html#general-feature-options) option is enabled at compile time, and the system meets the requirements of a Linux kernel version higher than 6.8 (supporting the `io_uring futex` feature) and a [`liburing`](/en/start/install.html#installing-liburing) version higher than 2.8, Swoole's coroutine lock will implement its synchronization mechanism based on `io_uring futex`. In this case, coroutines wait for lock wake-up in an efficient queued manner, which can significantly improve performance.
- If `io_uring futex` is not enabled, the coroutine lock degrades to a sleep mechanism based on exponential backoff: after each failed lock acquisition, the wait time increases by `2^n` milliseconds (`n` is the number of failures). Although this approach avoids busy waiting, it introduces additional CPU scheduling overhead and latency.
- In addition, the exponential backoff mechanism has poor fairness, and there is a risk that some coroutines may be unable to acquire the lock for a long time. Therefore, when conditions permit, enabling `io_uring futex` first is the more reliable choice.