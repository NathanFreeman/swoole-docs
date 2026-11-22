# 鎖

- `Swoole` 提供了便捷的鎖機制以保障數據同步，全面支持 `進程鎖`、`線程鎖` 和 `協程鎖` 三種類型，這三種鎖都可跨進程/線程使用，區別在於控制粒度不同。

> [!IMPORTANT]
> 在協程中使用 `進程鎖` 或 `線程鎖` 時，一旦鎖未獲取到，會阻塞整個進程（或線程），導致當前協程以及同一進程內的所有其他協程都無法繼續執行，因爲操作系統級別的鎖會讓當前執行單元進入睡眠狀態，不會主動讓出CPU。
> 而 `協程鎖` 在加鎖失敗時，會主動讓出當前協程的CPU控制權，將執行機會交給調度器去運行其他就緒的協程，從而不會阻塞進程或線程，實現高效的併發控制。

## 命名空間

- `Swoole\Lock`：進程鎖，用於跨進程數據同步。
- `Swoole\Thread\Lock`：線程鎖，用於跨線程數據同步。
- `Swoole\Coroutine\Lock`：協程鎖，用於不同進程/線程間的多協程數據同步。

> [!NOTE]
> 線程鎖要求 `PHP` 爲 `ZTS` 版本，且編譯 `Swoole` 時開啓了 `--enable-swoole-thread` 選項，否則 `Swoole\Thread\Lock` 類不存在。

## 方法

### __construct

創建一個鎖。

**進程鎖和線程鎖的構造函數簽名**

```php
public function __construct(int $type = SWOOLE_MUTEX)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$type` | 鎖的類型；其它值：`SWOOLE_RWLOCK`【讀寫鎖】，`SWOOLE_SPINLOCK`【自旋鎖】 | `SWOOLE_MUTEX`【互斥鎖】 |

**協程鎖的構造函數簽名**

```php
public function __construct(bool $shared = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$shared` | 是否在進程/線程間共享；其它值：`true` | `false` |

### lock

加鎖操作。

**進程鎖和線程鎖的 lock 函數簽名**

```php
public function lock(int $operation = LOCK_EX, float $timeout = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$operation` | 鎖定類型；其它值：`LOCK_SH`【取得共享鎖定（讀取的程序）】 | `LOCK_EX`【取得獨佔鎖定（寫入的程序）】 |
| `$timeout` | 超時時間 | `-1`【永不超時】 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**協程鎖的 lock 簽名**

```php
public function lock(int $operation = LOCK_EX): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$operation` | 鎖定類型；其它值：`LOCK_SH`【取得共享鎖定（讀取的程序）】 | `LOCK_EX`【取得獨佔鎖定（寫入的程序）】 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

### unlock

解鎖操作。

```php
public function unlock(): bool
```

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

## 示例

- 進程間使用進程鎖

```php
<?php
use Swoole\Process;
use Swoole\Lock;
use Swoole\Table;

$lock = new Lock(SWOOLE_MUTEX); // 必須要在創建進程之前創建鎖
for($i = 0; $i < 10; $i++) {
    $process = new Process(function($process) use ($lock, $i) {
        $lock->lock(LOCK_EX);
        echo "進程 $i 獲取到鎖，睡眠1秒後解鎖" . PHP_EOL;
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

- 線程間使用線程鎖

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
    echo "線程$index啓動" . PHP_EOL;
    sleep(1);
    $lock->unlock();
}
```

- 協程間使用協程鎖

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
            echo "協程 $i 獲得鎖，睡眠1s" . PHP_EOL;
            sleep(1);
            $lock->unlock();
            $waitGroup->done();
        });
    }
    
    echo "協程鎖加鎖不會阻塞進程" . PHP_EOL;
    $waitGroup->wait();
});
```

- 異步服務器使用鎖

```php
<?php
use Swoole\Coroutine\Lock;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$lock = new Lock(true);  // true表示多進程共享這個鎖
$server = new Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => swoole_cpu_num(),
    'enable_coroutine' => true
]);

$server->on('request', function(Request $request, Response $response) use ($lock) {
    $lock->lock();
    // 一些需要保證原子性的操作
    $lock->unlock();
    $response->end();
});

$server->start();
```

## 注意

- 加鎖和解鎖必須在同一個 `進程/線程/協程` 中完成，否則會導致競態條件被破壞。
- 爲了確保 `鎖` 能在多個 `進程`，`線程` 或者 `協程` 之間共享，必須在創建這些 `進程`，`線程` 或 `協程` 之前完成鎖的實例化。
- 請勿在 [receive](/zh-hant/server/events.html#receive) 等事件中創建鎖，否則內存會持續增長，造成內存泄漏。

## 死鎖

- 在協程環境中，使用 `進程鎖` 或 `線程鎖` 時，應避免在 `lock()` 與 `unlock()` 之間調用任何可能觸發協程切換的 API。否則，當前協程被掛起後鎖未釋放，其他協程將永遠無法獲取該鎖，從而導致 `100%` 死鎖。

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
        // 協程1獲取鎖後，進入睡眠並主動讓出CPU。此時協程2開始執行，嘗試獲取同一把鎖，但由於鎖仍被協程1持有，協程2在獲取鎖時會被阻塞。
        // 這種阻塞會導致整個操作系統線程被掛起，即使協程1隨後睡眠結束、具備恢復運行的條件，也因爲進程已被阻塞而無法繼續執行協程1。
        // 最終，系統因鎖競爭與協程調度機制的不當配合，陷入了無法恢復的死鎖狀態。
        go(function() use($lock, $waitGroup) {
            $waitGroup->add();
            $lock->lock();
            sleep(1); // 發生協程切換
            $lock->unlock();
            $waitGroup->done();
        });
    }
    $waitGroup->wait();
});
```

## io_uring vs 指數退避

- 在編譯時若啓用 [`--enable-iouring`](/zh-hant/start/install.html#通用功能選項) 選項，且系統滿足 Linux 內核版本高於 6.8（支持 `io_uring futex` 特性）、[`liburing`](/zh-hant/start/install.html#安裝-liburing) 版本高於 2.8 時，Swoole 的協程鎖將基於 `io_uring futex` 實現同步機制。此時，協程以高效排隊方式等待鎖喚醒，可顯著提升性能。
- 若未啓用 `io_uring futex`，協程鎖將退化爲基於指數退避的睡眠機制：每次獲取鎖失敗後，等待時間按 `2^n` 毫秒遞增（`n` 爲失敗次數）。該方式雖避免了忙等待，但會引入額外的 CPU 調度開銷與延遲。
- 此外，指數退避機制公平性較差，存在部分協程長時間無法獲得鎖的風險。因此，在條件允許時，優先啓用 `io_uring futex` 是更可靠的選擇。
