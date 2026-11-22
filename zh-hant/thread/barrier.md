# 同步屏障

線程同步屏障`Swoole\Thread\Barrier`，允許多個線程在特定的點上進行同步，確保所有線程在某個臨界點（障礙）之前都完成了自己的任務。只有當所有參與的線程都到達這個障礙時，它們才能繼續執行後續的代碼。

例如創建了 `4` 個線程，希望這些線程全部就緒後一起執行任務，就像跑步比賽中裁判的發令槍，在發出信號之後同時起跑，這就可以用`Thread\Barrier`實現。

> [!NOTE]
> 需要 `Swoole` 版本 >= `v6.0`，且已開啓多線程支持，詳見[創建線程](/zh-hant/thread/create.html#使用條件)。

## 方法

### __construct

構造方法。

```php
public function __construct(int $count)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$count` | 參與同步的線程數量，必須大於 `1` | 必填 |

> [!WARNING]
> 執行 `wait()` 操作的線程數量必須與設置的計數一致，否則所有線程均會阻塞。

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Barrier;

const N = 4;
$args = Thread::getArguments();

if (empty($args)) {
    // 主線程：創建計數爲 4 的屏障，並啓動 4 個子線程
    $barrier = new Barrier(N);
    $n = N;
    $threads = [];
    while ($n--) {
        $threads[] = new Thread(__FILE__, $barrier, $n);
    }
    // 主線程退出前必須等待子線程結束，否則會觸發致命錯誤
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // 子線程
    $barrier = $args[0];
    $n = $args[1];
    // 等待所有線程就緒
    $barrier->wait();
    echo "thread $n is running\n";
}
```

### wait

阻塞等待其他線程，直到所有線程均處於 `wait` 狀態時，會同時喚醒所有等待的線程，繼續向下執行。

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
    // 主線程：計數爲 2，由兩個子線程執行 wait()
    $barrier = new Barrier(2);
    $threads = [
        new Thread(__FILE__, $barrier, 0),
        new Thread(__FILE__, $barrier, 1),
    ];
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // 子線程
    $barrier = $args[0];
    $id = $args[1];

    // 編號 1 的線程耗時更長，編號 0 的線程會一直阻塞在 wait() 上
    if ($id == 1) {
        sleep(1);
    }
    $barrier->wait();

    // 兩個線程被同時喚醒，幾乎在同一時刻輸出
    echo "thread {$id} is running\n";
}
```
