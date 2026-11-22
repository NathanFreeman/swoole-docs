# 同步屏障

线程同步屏障`Swoole\Thread\Barrier`，允许多个线程在特定的点上进行同步，确保所有线程在某个临界点（障碍）之前都完成了自己的任务。只有当所有参与的线程都到达这个障碍时，它们才能继续执行后续的代码。

例如创建了 `4` 个线程，希望这些线程全部就绪后一起执行任务，就像跑步比赛中裁判的发令枪，在发出信号之后同时起跑，这就可以用`Thread\Barrier`实现。

> [!NOTE]
> 需要 `Swoole` 版本 >= `v6.0`，且已开启多线程支持，详见[创建线程](/zh/thread/create.html#使用条件)。

## 方法

### __construct

构造方法。

```php
public function __construct(int $count)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$count` | 参与同步的线程数量，必须大于 `1` | 必填 |

> [!WARNING]
> 执行 `wait()` 操作的线程数量必须与设置的计数一致，否则所有线程均会阻塞。

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Barrier;

const N = 4;
$args = Thread::getArguments();

if (empty($args)) {
    // 主线程：创建计数为 4 的屏障，并启动 4 个子线程
    $barrier = new Barrier(N);
    $n = N;
    $threads = [];
    while ($n--) {
        $threads[] = new Thread(__FILE__, $barrier, $n);
    }
    // 主线程退出前必须等待子线程结束，否则会触发致命错误
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // 子线程
    $barrier = $args[0];
    $n = $args[1];
    // 等待所有线程就绪
    $barrier->wait();
    echo "thread $n is running\n";
}
```

### wait

阻塞等待其他线程，直到所有线程均处于 `wait` 状态时，会同时唤醒所有等待的线程，继续向下执行。

```php
public function wait(): void
```

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Barrier;

$args = Thread::getArguments();

if (empty($args)) {
    // 主线程：计数为 2，由两个子线程执行 wait()
    $barrier = new Barrier(2);
    $threads = [
        new Thread(__FILE__, $barrier, 0),
        new Thread(__FILE__, $barrier, 1),
    ];
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // 子线程
    $barrier = $args[0];
    $id = $args[1];

    // 编号 1 的线程耗时更长，编号 0 的线程会一直阻塞在 wait() 上
    if ($id == 1) {
        sleep(1);
    }
    $barrier->wait();

    // 两个线程被同时唤醒，几乎在同一时刻输出
    echo "thread {$id} is running\n";
}
```
