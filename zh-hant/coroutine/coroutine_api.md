# 協程方法

## 命名空間

`Swoole\Coroutine`

## 方法

### create

創建一個新的協程，並立即執行。

```php
public static function create(callable $function, mixed ...$param): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$function` | 協程執行的函數 | 必填 |
| `...$param` | 傳遞給協程執行函數的參數 | 無 |

**返回值**：創建成功返回協程的 `ID`，創建失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    Coroutine::create(function ($second) {
        sleep($second);
    }, 1);
});
```

> [!NOTE]
> 受底層調度策略影響，父協程會優先讓子協程執行。只有當子協程主動掛起時，執行權纔會返回給父協程，父協程才能繼續向下執行。
> 可以在 `create` 方法中嵌套執行 `create` 方法。

> [!TIP]
> `go` 是該方法的別名，通過 `use function Swoole\Coroutine\go` 引入後即可直接調用 `go()` 函數創建協程，參數說明和 `create` 方法一致。在 `php.ini` 中設置 `swoole.use_shortname=On` 時，會額外註冊全局的 `go()` 函數，無需引入即可直接調用。
> 全局函數 `swoole_coroutine_create()` 也是該方法的別名，參數完全一致。

### defer

用於資源的釋放，會在協程關閉之前（即協程函數執行完畢時）進行調用。

```php
public static function defer(callable $callback): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$callback` | 協程關閉前執行的函數 | 必填 |

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    Coroutine::defer(function () {
        // 一些資源釋放
    });
    Coroutine::create(function ($second) {
        sleep($second);
    }, 1);
});
```

> [!NOTE]
> 就算拋出了異常，通過 `defer` 註冊的函數也會被執行。
> 它的調用順序是逆序的（先進後出），即先註冊 `defer` 的後執行。逆序符合資源釋放的正確邏輯：後申請的資源可能是基於先申請的資源的，如果先釋放先申請的資源，後申請的資源可能就難以釋放。

> [!TIP]
> 全局函數 `swoole_coroutine_defer()` 是該方法的別名，參數完全一致。在 `php.ini` 中設置 `swoole.use_shortname=On` 時，還會註冊全局的 `defer()` 函數。

### exists

判斷指定的協程 `ID` 對應的協程是否存在。

```php
public static function exists(int $cid): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 協程 ID | 必填 |

**返回值**：`true` 表示協程存在，`false` 表示協程不存在。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    go(function () {
        go(function () {
            sleep(0.001);
            var_dump(Coroutine::exists(Coroutine::getPcid())); // 1: true
        });
        go(function () {
            sleep(0.003);
            var_dump(Coroutine::exists(Coroutine::getPcid())); // 3: false
        });
        sleep(0.002);
        var_dump(Coroutine::exists(Coroutine::getPcid())); // 2: false
    });
});
```

### yield

手動讓出當前協程的執行權。

```php
public static function yield(): bool
```

**返回值**：`true` 表示操作成功，`false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    $cid = go(function () {
        echo "co 1 start\n";
        Coroutine::yield();
        echo "co 1 end\n";
    });

    go(function () use ($cid) {
        echo "co 2 start\n";
        sleep(0.5);
        Coroutine::resume($cid);
        echo "co 2 end\n";
    });
});
```

> [!TIP]
> 該方法有一個 `suspend` 的別名。

### resume

手動恢復某個協程，使其繼續運行。

```php
public static function resume(int $cid): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 要恢復的協程 `ID` | 必填 |

**返回值**：`true` 表示操作成功，`false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    $cid = go(function () {
        echo "co 1 start\n";
        Coroutine::yield();
        echo "co 1 end\n";
    });

    go(function () use ($cid) {
        echo "co 2 start\n";
        sleep(0.5);
        Coroutine::resume($cid);
        echo "co 2 end\n";
    });
});
```

### cancel

用於取消某個協程，但不能對當前協程發起取消操作。

```php
public static function cancel(int $cid, bool $throw_exception = false, mixed $reason = null): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 協程的 `CID` | 必填 |
| `$throw_exception` | 取消協程，並在被取消的協程內拋出一個 `Swoole\Coroutine\CanceledException` 異常。`v6.1.0` 版本之後可用 | `false` |
| `$reason` | 取消原因，可以是任意類型（如數組、對象、字符串）。被取消的協程捕獲異常後可通過 `Swoole\Coroutine\CanceledException::getReason()` 獲取該值，爲資源清理與異常日誌提供完整的上下文信息。僅在 `$throw_exception` 爲 `true` 時有效。`v6.3.0` 版本之後可用 | `null` |

**返回值**：成功時返回 `true`，失敗將會返回 `false`。取消失敗可以調用 `swoole_last_error()` 查看錯誤信息。

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\CanceledException;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    $cid = go(function () {
        try {
            while (true) {
                sleep(0.1);
                echo "co 2 running\n";
            }
            var_dump('end');
        } catch (CanceledException $e) {
            var_dump($e->getReason());
        }
    });

    sleep(0.3);
    Coroutine::cancel($cid, true, ['type' => 'timeout', 'message' => '任務超時']);
    sleep(0.2);
    echo "co 1 end\n";
});
```

> [!WARNING]
> - 被取消的協程必須捕獲 `Swoole\Coroutine\CanceledException` 異常，否則將產生 `Fatal Error`，導致進程退出。
> - 當協程正在讀寫文件時，是不可取消的，`cancel()` 會返回失敗，錯誤碼爲 `SWOOLE_ERROR_CO_CANNOT_CANCEL`。
> - 當設置 `$throw_exception` 爲 `true` 時，該 `cancel` 將一直返回 `true`。
> - 當 `$throw_exception` 爲 `false` 時，`$reason` 必須爲 `null`，否則會拋出 `ValueError`。

### isCanceled

用於判斷當前操作是否是被手動取消的。

```php
public static function isCanceled(): bool
```

**返回值**：手動取消正常結束返回 `true`，否則返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\Channel;
use Swoole\Coroutine\System;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    $chan = new Channel(1);
    $cid = Coroutine::getCid();
    go(function () use ($cid) {
        sleep(0.002);
        assert(Coroutine::cancel($cid) === true);
    });

    assert($chan->push("hello world [1]", 100) === true);
    assert(Coroutine::isCanceled() === false);
    assert($chan->errCode === SWOOLE_CHANNEL_OK);

    assert($chan->push("hello world [2]", 100) === false);
    assert(Coroutine::isCanceled() === true);
    assert($chan->errCode === SWOOLE_CHANNEL_CANCELED);

    echo "Done\n";
});
```

### getCid

獲取當前協程 `ID`，它是一個進程內唯一的正整數。

```php
public static function getCid(): int
```

**返回值**：成功時返回當前協程 `ID`；如果當前不在協程環境中，則返回 `-1`。

> [!TIP]
> 該方法有一個 `getuid` 的別名。

### getPcid

獲取當前協程的父 `ID`。

```php
public static function getPcid(int $cid = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 協程 `CID`。可傳入某個協程的 `ID` 以獲取它的父 `ID`，缺省表示當前協程 | `0` |

**返回值**：成功時返回當前協程的父 `ID`，否則返回 `false`。

### join

併發執行多個獨立任務，並等待它們全部完成。

```php
public static function join(array $cid_array, float $timeout = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid_array` | 協程 ID（cid）數組，即通過 `go()` 或 [`Swoole\Coroutine::create()`](#create) 創建協程時返回的 ID | 必填 |
| `$timeout` | 總的超時時間，超時後會立即返回。但正在運行的協程會繼續執行完畢，而不會中止 | `-1` |

**返回值**：成功時返回 `true`，失敗將會返回 `false`。等待失敗可以調用 `swoole_last_error()` 查看錯誤信息。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

run(function () {
    $result = [];
    $cid1 = go(function () use (&$result) {
        $result['baidu'] = strlen(file_get_contents('https://www.baidu.com/'));
    });

    $cid2 = go(function () use (&$result) {
        $result['google'] = strlen(file_get_contents('https://www.google.com/'));
    });
    $status = Coroutine::join([$cid1, $cid2], 1);
    var_dump($result, $status, swoole_strerror(swoole_last_error(), 9));
});
```

> [!TIP]
> `join` 方法本身只負責等待，不直接返回子協程的執行結果。

> [!WARNING]
> 千萬不能在等待的協程內部再次調用 `join` 方法，否則會導致死鎖。

### getContext

用於獲取當前協程的上下文對象，實現協程內的數據共享，同時保證不同協程間數據隔離。

```php
public static function getContext(int $cid = 0): \Swoole\Coroutine\Context|null
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 協程 `CID`，可選參數 | `0`，默認獲取當前協程 `CID` |

**返回值**：成功時返回 `Swoole\Coroutine\Context` 對象，協程不存在將會返回 `null`。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

function processRequest() {
    $ctx = Coroutine::getContext();
    echo "處理用戶: " . $ctx['user_id'] . "\n";
}

run(function () {
    // 獲取當前協程的上下文對象
    $context = Coroutine::getContext();

    // 像數組一樣存儲數據
    $context['user_id'] = 12345;
    $context['request_id'] = uniqid();

    // 在另一個函數中無需傳參，直接獲取上下文
    processRequest();
});
```

> [!NOTE]
> - 新創建的協程默認擁有全新的空上下文，不會自動複製父協程的數據。如無其它協程或全局變量引用，協程退出後上下文自動清理。
> - `Swoole\Coroutine\Context` 繼承 `ArrayObject`，可以使用數組方式訪問。
> - 相比用 PHP 數組實現上下文，沒有哈希計算開銷（在協程數量巨大時有一定好處）。

### getBackTrace

獲取協程函數調用棧。

```php
public static function getBackTrace(int $cid = 0, int $options = DEBUG_BACKTRACE_PROVIDE_OBJECT, int $limit = 0): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 協程的 `CID` | 當前協程 `CID` |
| `$options` | 設置選項。`DEBUG_BACKTRACE_PROVIDE_OBJECT` 是否填充 `object` 的索引；`DEBUG_BACKTRACE_IGNORE_ARGS` 是否忽略 args 的索引（包括所有 function/method 的參數），能夠節省內存開銷 | `DEBUG_BACKTRACE_PROVIDE_OBJECT` |
| `$limit` | 限制返回堆棧幀的數量 | `0` |

**返回值**：指定的協程不存在將返回 `false`；成功返回數組，格式與 [debug_backtrace](https://www.php.net/manual/zh/function.debug-backtrace.php) 函數返回值相同。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

function test1() {
    test2();
}

function test2() {
    while(true) {
        Co::sleep(10);
        echo __FUNCTION__." \n";
    }
}

run(function () {
    $cid = go(function () {
        test1();
    });

    go(function () use ($cid) {
        while(true) {
            echo "BackTrace[$cid]:\n-----------------------------------------------\n";
            //返回數組，需要自行格式化輸出
            var_dump(Co::getBackTrace($cid))."\n";
            Co::sleep(3);
        }
    });
});
```

### printBackTrace

打印協程函數調用棧。

```php
public static function printBackTrace(int $cid = 0, int $options = 0, int $limit = 0): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 協程的 `CID` | 當前協程 `CID` |
| `$options` | 設置選項。`DEBUG_BACKTRACE_PROVIDE_OBJECT` 是否填充 `object` 的索引；`DEBUG_BACKTRACE_IGNORE_ARGS` 是否忽略 args 的索引（包括所有 function/method 的參數），能夠節省內存開銷 | `0` |
| `$limit` | 限制返回堆棧幀的數量 | `0` |

> [!TIP]
> 和 [`getBackTrace`](#getbacktrace) 不同的是，`printBackTrace` 會自動打印函數調用棧信息。

### getElapsed

獲取指定協程運行的時間，以便於分析統計或找出殭屍協程。

```php
public static function getElapsed(int $cid = 0): int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 可選參數，協程的 `CID` | 當前協程 `CID` |

**返回值**：協程已運行的時間，整型，單位爲微秒。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    $cid = go(function () {
        sleep(4);
    });

    Coroutine::getElapsed($cid);
});
```

### getStackUsage

獲取指定協程的內存使用量，單位爲字節。

```php
public static function getStackUsage(int $cid = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cid` | 可選參數，協程的 `CID` | 當前協程 `CID` |

**返回值**：成功返回內存使用量；指定的協程不存在，將返回 `false`。

### set

設置協程運行相關配置。

```php
public static function set(array $options): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$options` | 協程運行相關配置 | 必填 |

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

Coroutine::set([
    'hook_flags' => SWOOLE_HOOK_ALL
]);

run(function () {
    sleep(1);
});
```

### getOptions

獲取協程運行相關配置。

```php
public static function getOptions(): ?array
```

### stats

獲取當前協程狀態。

```php
public static function stats(): array
```

**返回值**：成功時返回一個包含協程狀態的數組。

| key | 作用 |
|:---|:---|
| `event_num` | 當前 reactor 事件數量 |
| `signal_listener_num` | 當前監聽信號的數量 |
| `aio_task_num` | 異步 IO 任務數量（這裏的 aio 指文件 IO 或 dns，不包含其它網絡 IO，下同） |
| `aio_worker_num` | 異步 IO 工作線程數量 |
| `c_stack_size` | 每個協程的 C 棧大小 |
| `coroutine_num` | 當前運行的協程數量 |
| `coroutine_peak_num` | 當前運行的協程數量的峯值 |
| `coroutine_last_cid` | 最後創建協程的 id |

### list

遍歷當前進程內的所有協程。

```php
public static function list(): \Swoole\Coroutine\Iterator
```

**返回值**：返回 `Swoole\Coroutine\Iterator` 迭代器，裏面包含當前進程創建的所有協程 id，可使用 `foreach` 遍歷，不能使用數組下標形式訪問。

> [!TIP]
> 該方法有一個 `listCoroutines` 的別名。

**示例**

```php
<?php
use Swoole\Coroutine;
$coroutines = Coroutine::list();
foreach ($coroutines as $cid) {
    var_dump(Coroutine::getBackTrace($cid));
}
```

### enableScheduler

打開協程搶佔式調度。

```php
public static function enableScheduler(): bool
```

**返回值**：成功時返回 `true`，失敗返回 `false`。

> [!TIP]
> `Swoole` 默認使用協作式調度，這意味着每個協程需要主動讓出（如遇到 `sleep()` 或 `網絡 IO`）時，纔會觸發調度切換。如果某個協程執行了一個死循環或非常耗時的 `CPU` 計算且從不主動讓出，它會一直霸佔 `CPU`，導致其他協程永遠無法獲得執行機會。搶佔式調度器正是爲了解決這個問題而設計的。開啓後，`Swoole` 會強制在協程執行一定時間後主動切斷其執行，並將 `CPU` 調度給其他協程。

### disableScheduler

臨時關閉協程搶佔式調度。

```php
public static function disableScheduler(): bool
```

**返回值**：成功時返回 `true`，失敗返回 `false`。

### getExecuteTime

可獲取協程實際執行時間（不包含協程切換狀態的時間）。

```php
public static function getExecuteTime(): int
```

**返回值**：返回協程實際執行毫秒數。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use Swoole\Coroutine\TimeoutException;

run(function () {
    // 假設這裏沒有協程切換，純 CPU 邏輯花費了 3 秒
    do_something();
    // 讓出協程
    sleep(1);
    echo Coroutine::getExecuteTime(); // 返回約 3000 毫秒
});
```

> [!IMPORTANT]
> 需要編譯 `swoole` 的時候開啓 `--enable-swoole-coro-time` 纔可以使用這個函數。

### setTimeLimit

設置協程運行超時時間。

```php
public static function setTimeLimit(float $timeout): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 協程超時時間 | 必填 |

**返回值**：成功時返回 `true`，失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;
use Swoole\Coroutine\TimeoutException;

run(function () {
    try {
        Coroutine::setTimeLimit(1.5);
        sleep(3);
    } catch (TimeoutException $e) {
        echo "timeout";
    }
});
```

> [!IMPORTANT]
> `Swoole 6.2` 以上可用，協程執行時間大於超時時間會拋出 `Swoole\Coroutine\TimeoutException` 異常。

## 函數

### batch

併發執行多個協程，並且通過數組，返回這些協程方法的返回值。

```php
function batch(array $tasks, float $timeout = -1): array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$tasks` | 傳入方法回調的數組，如果指定了 `key`，則返回值也會被該 `key` 指向 | 必填 |
| `$timeout` | 總的超時時間，超時後會立即返回。但正在運行的協程會繼續執行完畢，而不會中止 | `-1` |

**返回值**：返回一個數組，裏面包含回調的返回值。如果 `$tasks` 參數中指定了 `key`，則返回值也會被該 `key` 指向。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\batch;

Coroutine::set(['hook_flags' => SWOOLE_HOOK_ALL]);

$start_time = microtime(true);
run(function () {
    $use = microtime(true);
    $results = batch([
        'file_put_contents' => function () {
            return file_put_contents(__DIR__ . '/greeter.txt', "Hello,Swoole.");
        },
        'gethostbyname' => function () {
            return gethostbyname('localhost');
        },
        'file_get_contents' => function () {
            return file_get_contents(__DIR__ . '/greeter.txt');
        },
        'sleep' => function () {
            sleep(1);
            return true; // 返回NULL 因爲超過了設置的超時時間0.1秒，超時後會立即返回。但正在運行的協程會繼續執行完畢，而不會中止。
        },
        'usleep' => function () {
            usleep(1000);
            return true;
        },
    ], 0.1);
    $use = microtime(true) - $use;
    echo "Use {$use}s, Result:\n";
    var_dump($results);
});
$end_time =  microtime(true) - $start_time;
echo "Use {$end_time}s, Done\n";
```

### parallel

併發執行多個相同回調函數的協程。

```php
function parallel(int $n, callable $fn): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$n` | 設置最大的協程數爲 `$n` | 必填 |
| `$fn` | 對應需要執行的回調函數 | 必填 |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\System;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\parallel;

$start_time = microtime(true);
run(function () {
    $use = microtime(true);
    $results = [];
    parallel(2, function () use (&$results) {
        sleep(0.2);
        $results[] = System::gethostbyname('localhost');
    });
    $use = microtime(true) - $use;
    echo "Use {$use}s, Result:\n";
    var_dump($results);
});
$end_time =  microtime(true) - $start_time;
echo "Use {$end_time}s, Done\n";
```

### map

類似於 [array_map](https://www.php.net/manual/zh/function.array-map.php)，爲數組的每個元素應用回調函數，回調函數通過協程執行。

```php
function map(array $list, callable $fn, float $timeout = -1): array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$list` | 運行 `$fn` 函數的數組 | 必填 |
| `$fn` | `$list` 數組中的每個元素需要執行的回調函數 | 必填 |
| `$timeout` | 總的超時時間，超時後會立即返回。但正在運行的協程會繼續執行完畢，而不會中止 | `-1` |

**返回值**：成功後返回一個數組，裏面包含了各個回調函數的執行結果。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\map;
use function Swoole\Coroutine\run;

function fatorial(int $n): int
{
    return array_product(range($n, 1));
}

run(function () {
    $results = map([2, 3, 4], 'fatorial'); 
    print_r($results);
});
```

### deadlock_check

協程死鎖檢測，發現死鎖時會輸出相關堆棧信息。

```php
function deadlock_check(): void
```

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\deadlock_check;

function test1()
{
    $f = function () {
        Coroutine::yield();
    };
    $f();
}

function test2()
{
    Coroutine::yield();
}

Co\run(function () {
    go(function () {
        test1();
    });
    go(function () {
        test2();
    });
    sleep(0.1);
    deadlock_check();
}); 
```

