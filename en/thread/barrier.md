# Synchronization Barrier

The thread synchronization barrier `Swoole\Thread\Barrier` allows multiple threads to synchronize at a specific point, ensuring that all threads have completed their own tasks before a certain critical point (the barrier). Only when all participating threads have reached this barrier can they continue executing the subsequent code.

For example, if you create `4` threads and want them to start their tasks together once all are ready — like the referee's starting gun in a race, where everyone starts running simultaneously after the signal — this can be implemented with `Thread\Barrier`.

> [!NOTE]
> Requires `Swoole` version >= `v6.0` with multi-threading support enabled; see [Creating Threads](/en/thread/create.html#requirements).

## Methods

### __construct

Constructor.

```php
public function __construct(int $count)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$count` | The number of threads participating in the synchronization; must be greater than `1` | Required |

> [!WARNING]
> The number of threads executing `wait()` must match the configured count; otherwise all threads will block.

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Barrier;

const N = 4;
$args = Thread::getArguments();

if (empty($args)) {
    // Main thread: create a barrier with a count of 4 and start 4 child threads
    $barrier = new Barrier(N);
    $n = N;
    $threads = [];
    while ($n--) {
        $threads[] = new Thread(__FILE__, $barrier, $n);
    }
    // The main thread must wait for child threads to finish before exiting; otherwise a fatal error is triggered
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // Child thread
    $barrier = $args[0];
    $n = $args[1];
    // Wait until all threads are ready
    $barrier->wait();
    echo "thread $n is running\n";
}
```

### wait

Blocks and waits for the other threads. Once all threads are in the `wait` state, all waiting threads are woken up simultaneously and continue executing.

```php
public function wait(): void
```

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Barrier;

$args = Thread::getArguments();

if (empty($args)) {
    // Main thread: count is 2; the two child threads execute wait()
    $barrier = new Barrier(2);
    $threads = [
        new Thread(__FILE__, $barrier, 0),
        new Thread(__FILE__, $barrier, 1),
    ];
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // Child thread
    $barrier = $args[0];
    $id = $args[1];

    // Thread number 1 takes longer, so thread number 0 keeps blocking on wait()
    if ($id == 1) {
        sleep(1);
    }
    $barrier->wait();

    // Both threads are woken up simultaneously and print at almost the same moment
    echo "thread {$id} is running\n";
}
```