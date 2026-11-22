# 锁

- `Swoole` 提供了便捷的锁机制以保障数据同步，全面支持 `进程锁`、`线程锁` 和 `协程锁` 三种类型，这三种锁都可跨进程/线程使用，区别在于控制粒度不同。

> [!IMPORTANT]
> 在协程中使用 `进程锁` 或 `线程锁` 时，一旦锁未获取到，会阻塞整个进程（或线程），导致当前协程以及同一进程内的所有其他协程都无法继续执行，因为操作系统级别的锁会让当前执行单元进入睡眠状态，不会主动让出CPU。
> 而 `协程锁` 在加锁失败时，会主动让出当前协程的CPU控制权，将执行机会交给调度器去运行其他就绪的协程，从而不会阻塞进程或线程，实现高效的并发控制。

## 命名空间

- `Swoole\Lock`：进程锁，用于跨进程数据同步。
- `Swoole\Thread\Lock`：线程锁，用于跨线程数据同步。
- `Swoole\Coroutine\Lock`：协程锁，用于不同进程/线程间的多协程数据同步。

> [!NOTE]
> 线程锁要求 `PHP` 为 `ZTS` 版本，且编译 `Swoole` 时开启了 `--enable-swoole-thread` 选项，否则 `Swoole\Thread\Lock` 类不存在。

## 方法

### __construct

创建一个锁。

**进程锁和线程锁的构造函数签名**

```php
public function __construct(int $type = SWOOLE_MUTEX)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$type` | 锁的类型；其它值：`SWOOLE_RWLOCK`【读写锁】，`SWOOLE_SPINLOCK`【自旋锁】 | `SWOOLE_MUTEX`【互斥锁】 |

**协程锁的构造函数签名**

```php
public function __construct(bool $shared = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$shared` | 是否在进程/线程间共享；其它值：`true` | `false` |

### lock

加锁操作。

**进程锁和线程锁的 lock 函数签名**

```php
public function lock(int $operation = LOCK_EX, float $timeout = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$operation` | 锁定类型；其它值：`LOCK_SH`【取得共享锁定（读取的程序）】 | `LOCK_EX`【取得独占锁定（写入的程序）】 |
| `$timeout` | 超时时间 | `-1`【永不超时】 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**协程锁的 lock 签名**

```php
public function lock(int $operation = LOCK_EX): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$operation` | 锁定类型；其它值：`LOCK_SH`【取得共享锁定（读取的程序）】 | `LOCK_EX`【取得独占锁定（写入的程序）】 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

### unlock

解锁操作。

```php
public function unlock(): bool
```

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

## 示例

- 进程间使用进程锁

```php
<?php
use Swoole\Process;
use Swoole\Lock;
use Swoole\Table;

$lock = new Lock(SWOOLE_MUTEX); // 必须要在创建进程之前创建锁
for($i = 0; $i < 10; $i++) {
    $process = new Process(function($process) use ($lock, $i) {
        $lock->lock(LOCK_EX);
        echo "进程 $i 获取到锁，睡眠1秒后解锁" . PHP_EOL;
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

- 线程间使用线程锁

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
    echo "线程$index启动" . PHP_EOL;
    sleep(1);
    $lock->unlock();
}
```

- 协程间使用协程锁

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
            echo "协程 $i 获得锁，睡眠1s" . PHP_EOL;
            sleep(1);
            $lock->unlock();
            $waitGroup->done();
        });
    }
    
    echo "协程锁加锁不会阻塞进程" . PHP_EOL;
    $waitGroup->wait();
});
```

- 异步服务器使用锁

```php
<?php
use Swoole\Coroutine\Lock;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$lock = new Lock(true);  // true表示多进程共享这个锁
$server = new Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => swoole_cpu_num(),
    'enable_coroutine' => true
]);

$server->on('request', function(Request $request, Response $response) use ($lock) {
    $lock->lock();
    // 一些需要保证原子性的操作
    $lock->unlock();
    $response->end();
});

$server->start();
```

## 注意

- 加锁和解锁必须在同一个 `进程/线程/协程` 中完成，否则会导致竞态条件被破坏。
- 为了确保 `锁` 能在多个 `进程`，`线程` 或者 `协程` 之间共享，必须在创建这些 `进程`，`线程` 或 `协程` 之前完成锁的实例化。
- 请勿在 [receive](/zh/server/events.html#receive) 等事件中创建锁，否则内存会持续增长，造成内存泄漏。

## 死锁

- 在协程环境中，使用 `进程锁` 或 `线程锁` 时，应避免在 `lock()` 与 `unlock()` 之间调用任何可能触发协程切换的 API。否则，当前协程被挂起后锁未释放，其他协程将永远无法获取该锁，从而导致 `100%` 死锁。

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
        // 协程1获取锁后，进入睡眠并主动让出CPU。此时协程2开始执行，尝试获取同一把锁，但由于锁仍被协程1持有，协程2在获取锁时会被阻塞。
        // 这种阻塞会导致整个操作系统线程被挂起，即使协程1随后睡眠结束、具备恢复运行的条件，也因为进程已被阻塞而无法继续执行协程1。
        // 最终，系统因锁竞争与协程调度机制的不当配合，陷入了无法恢复的死锁状态。
        go(function() use($lock, $waitGroup) {
            $waitGroup->add();
            $lock->lock();
            sleep(1); // 发生协程切换
            $lock->unlock();
            $waitGroup->done();
        });
    }
    $waitGroup->wait();
});
```

## io_uring vs 指数退避

- 在编译时若启用 [`--enable-iouring`](/zh/start/install.html#通用功能选项) 选项，且系统满足 Linux 内核版本高于 6.8（支持 `io_uring futex` 特性）、[`liburing`](/zh/start/install.html#安装-liburing) 版本高于 2.8 时，Swoole 的协程锁将基于 `io_uring futex` 实现同步机制。此时，协程以高效排队方式等待锁唤醒，可显著提升性能。
- 若未启用 `io_uring futex`，协程锁将退化为基于指数退避的睡眠机制：每次获取锁失败后，等待时间按 `2^n` 毫秒递增（`n` 为失败次数）。该方式虽避免了忙等待，但会引入额外的 CPU 调度开销与延迟。
- 此外，指数退避机制公平性较差，存在部分协程长时间无法获得锁的风险。因此，在条件允许时，优先启用 `io_uring futex` 是更可靠的选择。
