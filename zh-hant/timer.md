# 定時器

- 毫秒精度的定時器。底層基於 `epoll_wait` 和 `setitimer` 實現，數據結構使用 `最小堆`，可支持添加大量定時器。
- 在同步 IO 進程中使用 `setitimer` 和信號實現，如 [`Manager`](/zh-hant/server/process_thread.html#manager) 和 [`TaskWorker`](/zh-hant/server/process_thread.html#task) 進程。
- 在異步 IO 進程中使用 `epoll_wait`/`kevent`/`poll`/`select` 超時時間實現。

## 方法

### tick

設置一個週期性定時器，在指定時間範圍內持續觸發，除非手動清除，否則將永久運行。

```php
public static function tick(int $msec, callable $callback, ...$params): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$msec` | 時間間隔，單位爲毫秒 | 必填 |
| `$callback` | 超時後所執行的**回調函數**，必須是可以調用的 | 必填 |
| `...$params` | 給回調函數傳遞數據【此參數也爲可選參數】 | 無 |

**返回值**：返回定時器 id 表示操作成功，返回 `false` 表示失敗。

**示例**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole'); 
```

### after

設置一個一次性定時器，用於在指定時間後回調函數，執行完畢後自動銷燬。

```php
public static function after(int $msec, callable $callback, ...$params): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$msec` | 時間間隔，單位爲毫秒 | 必填 |
| `$callback` | 超時後所執行的**回調函數**，必須是可以調用的 | 必填 |
| `...$params` | 給回調函數傳遞數據【此參數也爲可選參數】 | 無 |

**返回值**：返回定時器 id 表示操作成功，返回 `false` 表示失敗。

**示例**

```php
<?php
use Swoole\Timer;
Timer::after(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole'); 
```

### clear

根據定時器 `ID` 來刪除指定的定時器。

```php
public static function clear(int $timerId): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timerId` | 定時器 id | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失敗。

**示例**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
    Timer::clear($timerId);
}, 'Swoole'); 
```

### clearAll

清除所有定時器。

```php
public static function clearAll(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失敗。

**示例**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
    Timer::clearAll();
}, 'Swoole'); 
```

> [!WARNING]
> Swoole 版本 >= `v4.4.0` 可用

### exists

檢查指定 `ID` 的定時器是否存在。

```php
public static function exists(int $timerId): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timerId` | 定時器 id | 必填 |

**返回值**：返回 `true` 表示存在，返回 `false` 表示不存在。

**示例**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::exists($timerId));
```

### info

返回指定 `ID` 的定時器的詳細信息。

```php
public static function info(int $timerId): ?array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timerId` | 定時器 id | 必填 |

**返回值**：返回 `array` 表示操作成功，否則表示失敗。

**示例**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::info($timerId));
```

| 列名             | 含義         |
|:---------------|:-----------|
| exec_msec      | 延遲執行時間（毫秒） |
| exec_count     | 執行次數       |
| interval       | 週期執行間隔（毫秒） |
| round          | 輪詢輪次       |
| removed        | 是否被移除      |

### stats

獲取整個定時任務系統的狀態快照，而非查詢某一個定時器的狀態。

```php
public static function stats(): array
```

**返回值**：返回定時任務系統的狀態快照數組。

**示例**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::stats());
```

| 列名             | 含義    |
|:---------------|:------|
| initialized      | 是否初始化 |
| num     | 定時器個數 |
| round       | 輪詢輪次  |

> [!WARNING]
> Swoole 版本 >= `v4.4.0` 可用

### list

返回定時器迭代器，可用於遍歷所有定時器的 `ID`。

```php
public static function list(): Swoole\Timer\Iterator
```

**返回值**：返回一個只能用 `foreach` 遍歷的迭代器。

**示例**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

$timerIds = Timer::list();

foreach($timerIds as $timerId) {
    var_dump(Timer::info($timerId));
}
```

### 回調函數

`Swoole\Timer::tick()` 和 `Swoole\Timer::after()` 的回調函數簽名。

```php
function(int $timerId, ...$params) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timerId` | 定時器 id | 必填 |
| `...$params` | `Swoole\Timer::tick()` 和 `Swoole\Timer::after()` 的第三個參數。 | 無 |

## 其他

### 性能

底層使用最小堆數據結構實現定時器，定時器的添加和刪除，全部爲內存操作，因此性能是非常高的。

> [!NOTE]
> 官方的基準測試腳本 [timer.php](https://github.com/swoole/benchmark/blob/master/timer.php) 中，添加或刪除 `10` 萬個隨機時間的定時器耗時爲 `0.08s` 左右。

> [!TIP]
> 定時器是內存操作，無 `IO` 消耗

### 零毫秒定時器

底層不支持時間參數爲 `0` 的定時器。這與 `Node.js` 等編程語言不同。在 `Swoole` 裏可以使用 [Swoole\Event::defer](/zh-hant/event.html#defer) 實現類似的功能。

**示例**

```php
<?php
Swoole\Event::defer(function () {
  echo "hello\n";
});
```

> [!WARNING]
> 上述代碼與 `JS` 中的 `setTimeout(func, 0)` 效果是完全一致的。

### 別名

除面向對象風格的命名外，同時提供函數式風格的別名。

| 面向對象                     | 函數式風格                  |
|:-------------------------|:-----------------------|
| Swoole\Timer::tick()     | swoole_timer_tick()    |
| Swoole\Timer::after()     | swoole_timer_after()      |
| Swoole\Timer::exists()     | swoole_timer_exists()     |
| Swoole\Timer::info()     | swoole_timer_info()       |
| Swoole\Timer::stats()     | swoole_timer_stats()      |
| Swoole\Timer::list()     | swoole_timer_list()       |
| Swoole\Timer::clear()    | swoole_timer_clear()      |
| Swoole\Timer::clearAll() | swoole_timer_clear_all()  |

## 注意

> [!TIP]
> 默認定時器在執行回調函數時會自動創建協程。
>
> 定時器回調函數的執行時間不影響下一次定時器執行的時間。實例：在 `0.002s` 設置了 `10ms` 的 `tick` 定時器，第一次會在 `0.012s` 執行回調函數，如果回調函數執行了 `5ms`，下一次定時器仍然會在 `0.022s` 時觸發，而不是 `0.027s`。
>
> 但如果定時器回調函數的執行時間過長，甚至覆蓋了下一次定時器執行的時間。底層會進行時間校正，丟棄已過期的行爲，在下一時間回調。如上面例子中 `0.012s` 時的回調函數執行了 `15ms`，本該在 `0.022s` 產生一次定時回調。實際上本次定時器在 `0.027s` 才返回，這時定時早已過期。底層會在 `0.032s` 時再次觸發定時器回調。

> [!WARNING]
> 定時器僅在當前進程空間內有效。
>
> 定時器是純異步實現的，不能在定時器的回調函數中使用阻塞函數，否則定時器的執行時間會發生錯亂。
>
> 定時器在執行的過程中可能存在一定誤差。
