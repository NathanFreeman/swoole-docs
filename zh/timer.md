# 定时器

- 毫秒精度的定时器。底层基于 `epoll_wait` 和 `setitimer` 实现，数据结构使用 `最小堆`，可支持添加大量定时器。
- 在同步 IO 进程中使用 `setitimer` 和信号实现，如 [`Manager`](/zh/server/process_thread.html#manager) 和 [`TaskWorker`](/zh/server/process_thread.html#task) 进程。
- 在异步 IO 进程中使用 `epoll_wait`/`kevent`/`poll`/`select` 超时时间实现。

## 方法

### tick

设置一个周期性定时器，在指定时间范围内持续触发，除非手动清除，否则将永久运行。

```php
public static function tick(int $msec, callable $callback, ...$params): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$msec` | 时间间隔，单位为毫秒 | 必填 |
| `$callback` | 超时后所执行的**回调函数**，必须是可以调用的 | 必填 |
| `...$params` | 给回调函数传递数据【此参数也为可选参数】 | 无 |

**返回值**：返回定时器 id 表示操作成功，返回 `false` 表示失败。

**示例**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole'); 
```

### after

设置一个一次性定时器，用于在指定时间后回调函数，执行完毕后自动销毁。

```php
public static function after(int $msec, callable $callback, ...$params): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$msec` | 时间间隔，单位为毫秒 | 必填 |
| `$callback` | 超时后所执行的**回调函数**，必须是可以调用的 | 必填 |
| `...$params` | 给回调函数传递数据【此参数也为可选参数】 | 无 |

**返回值**：返回定时器 id 表示操作成功，返回 `false` 表示失败。

**示例**

```php
<?php
use Swoole\Timer;
Timer::after(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole'); 
```

### clear

根据定时器 `ID` 来删除指定的定时器。

```php
public static function clear(int $timerId): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timerId` | 定时器 id | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失败。

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

清除所有定时器。

```php
public static function clearAll(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失败。

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

检查指定 `ID` 的定时器是否存在。

```php
public static function exists(int $timerId): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timerId` | 定时器 id | 必填 |

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

返回指定 `ID` 的定时器的详细信息。

```php
public static function info(int $timerId): ?array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timerId` | 定时器 id | 必填 |

**返回值**：返回 `array` 表示操作成功，否则表示失败。

**示例**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::info($timerId));
```

| 列名             | 含义         |
|:---------------|:-----------|
| exec_msec      | 延迟执行时间（毫秒） |
| exec_count     | 执行次数       |
| interval       | 周期执行间隔（毫秒） |
| round          | 轮询轮次       |
| removed        | 是否被移除      |

### stats

获取整个定时任务系统的状态快照，而非查询某一个定时器的状态。

```php
public static function stats(): array
```

**返回值**：返回定时任务系统的状态快照数组。

**示例**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::stats());
```

| 列名             | 含义    |
|:---------------|:------|
| initialized      | 是否初始化 |
| num     | 定时器个数 |
| round       | 轮询轮次  |

> [!WARNING]
> Swoole 版本 >= `v4.4.0` 可用

### list

返回定时器迭代器，可用于遍历所有定时器的 `ID`。

```php
public static function list(): Swoole\Timer\Iterator
```

**返回值**：返回一个只能用 `foreach` 遍历的迭代器。

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

### 回调函数

`Swoole\Timer::tick()` 和 `Swoole\Timer::after()` 的回调函数签名。

```php
function(int $timerId, ...$params) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timerId` | 定时器 id | 必填 |
| `...$params` | `Swoole\Timer::tick()` 和 `Swoole\Timer::after()` 的第三个参数。 | 无 |

## 其他

### 性能

底层使用最小堆数据结构实现定时器，定时器的添加和删除，全部为内存操作，因此性能是非常高的。

> [!NOTE]
> 官方的基准测试脚本 [timer.php](https://github.com/swoole/benchmark/blob/master/timer.php) 中，添加或删除 `10` 万个随机时间的定时器耗时为 `0.08s` 左右。

> [!TIP]
> 定时器是内存操作，无 `IO` 消耗

### 零毫秒定时器

底层不支持时间参数为 `0` 的定时器。这与 `Node.js` 等编程语言不同。在 `Swoole` 里可以使用 [Swoole\Event::defer](/zh/event.html#defer) 实现类似的功能。

**示例**

```php
<?php
Swoole\Event::defer(function () {
  echo "hello\n";
});
```

> [!WARNING]
> 上述代码与 `JS` 中的 `setTimeout(func, 0)` 效果是完全一致的。

### 别名

除面向对象风格的命名外，同时提供函数式风格的别名。

| 面向对象                     | 函数式风格                  |
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
> 默认定时器在执行回调函数时会自动创建协程。
>
> 定时器回调函数的执行时间不影响下一次定时器执行的时间。实例：在 `0.002s` 设置了 `10ms` 的 `tick` 定时器，第一次会在 `0.012s` 执行回调函数，如果回调函数执行了 `5ms`，下一次定时器仍然会在 `0.022s` 时触发，而不是 `0.027s`。
>
> 但如果定时器回调函数的执行时间过长，甚至覆盖了下一次定时器执行的时间。底层会进行时间校正，丢弃已过期的行为，在下一时间回调。如上面例子中 `0.012s` 时的回调函数执行了 `15ms`，本该在 `0.022s` 产生一次定时回调。实际上本次定时器在 `0.027s` 才返回，这时定时早已过期。底层会在 `0.032s` 时再次触发定时器回调。

> [!WARNING]
> 定时器仅在当前进程空间内有效。
>
> 定时器是纯异步实现的，不能在定时器的回调函数中使用阻塞函数，否则定时器的执行时间会发生错乱。
>
> 定时器在执行的过程中可能存在一定误差。
