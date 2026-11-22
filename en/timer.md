# Timer

- Millisecond-precision timers. The underlying implementation is based on `epoll_wait` and `setitimer`, using a `min-heap` data structure, which supports adding a large number of timers.
- In synchronous IO processes, it is implemented with `setitimer` and signals, such as the [`Manager`](/en/server/process_thread.html#manager) and [`TaskWorker`](/en/server/process_thread.html#task) processes.
- In asynchronous IO processes, it is implemented with the timeout of `epoll_wait`/`kevent`/`poll`/`select`.

## Methods

### tick

Sets a periodic timer that keeps firing within the specified time interval. It runs forever unless cleared manually.

```php
public static function tick(int $msec, callable $callback, ...$params): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$msec` | Time interval, in milliseconds | Required |
| `$callback` | The **callback function** executed after the timeout; must be callable | Required |
| `...$params` | Data passed to the callback function [this parameter is also optional] | None |

**Return value**: Returns the timer id on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole'); 
```

### after

Sets a one-time timer that invokes the callback function after the specified time and is automatically destroyed after execution.

```php
public static function after(int $msec, callable $callback, ...$params): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$msec` | Time interval, in milliseconds | Required |
| `$callback` | The **callback function** executed after the timeout; must be callable | Required |
| `...$params` | Data passed to the callback function [this parameter is also optional] | None |

**Return value**: Returns the timer id on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Timer;
Timer::after(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole'); 
```

### clear

Deletes the specified timer by its `ID`.

```php
public static function clear(int $timerId): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timerId` | Timer id | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
    Timer::clear($timerId);
}, 'Swoole'); 
```

### clearAll

Clears all timers.

```php
public static function clearAll(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Timer;
Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
    Timer::clearAll();
}, 'Swoole'); 
```

> [!WARNING]
> Available in Swoole version >= `v4.4.0`

### exists

Checks whether the timer with the specified `ID` exists.

```php
public static function exists(int $timerId): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timerId` | Timer id | Required |

**Return value**: Returns `true` if it exists, `false` if it does not exist.

**Example**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::exists($timerId));
```

### info

Returns detailed information about the timer with the specified `ID`.

```php
public static function info(int $timerId): ?array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timerId` | Timer id | Required |

**Return value**: Returns an `array` on success; otherwise indicates failure.

**Example**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::info($timerId));
```

| Column             | Meaning         |
|:---------------|:-----------|
| exec_msec      | Delayed execution time (milliseconds) |
| exec_count     | Number of executions       |
| interval       | Periodic execution interval (milliseconds) |
| round          | Polling round       |
| removed        | Whether removed      |

### stats

Gets a status snapshot of the entire timer system, rather than querying the status of a single timer.

```php
public static function stats(): array
```

**Return value**: Returns a status snapshot array of the timer system.

**Example**

```php
<?php
use Swoole\Timer;
$timerId = Timer::tick(1000, function(int $timerId, string $param) {
    echo 'Hello' . $param . PHP_EOL;
}, 'Swoole');

var_dump(Timer::stats());
```

| Column             | Meaning    |
|:---------------|:------|
| initialized      | Whether initialized |
| num     | Number of timers |
| round       | Polling round  |

> [!WARNING]
> Available in Swoole version >= `v4.4.0`

### list

Returns a timer iterator that can be used to traverse the `ID`s of all timers.

```php
public static function list(): Swoole\Timer\Iterator
```

**Return value**: Returns an iterator that can only be traversed with `foreach`.

**Example**

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

### Callback Function

The callback function signature of `Swoole\Timer::tick()` and `Swoole\Timer::after()`.

```php
function(int $timerId, ...$params) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timerId` | Timer id | Required |
| `...$params` | The third parameter of `Swoole\Timer::tick()` and `Swoole\Timer::after()`. | None |

## Others

### Performance

The underlying layer uses a min-heap data structure to implement timers. Adding and deleting timers are all memory operations, so performance is very high.

> [!NOTE]
> In the official benchmark script [timer.php](https://github.com/swoole/benchmark/blob/master/timer.php), adding or deleting `100,000` timers with random intervals takes about `0.08s`.

> [!TIP]
> Timers are memory operations with no `IO` cost

### Zero-Millisecond Timers

The underlying layer does not support timers with a time parameter of `0`. This differs from programming languages such as `Node.js`. In `Swoole`, you can use [Swoole\Event::defer](/en/event.html#defer) to achieve similar functionality.

**Example**

```php
<?php
Swoole\Event::defer(function () {
  echo "hello\n";
});
```

> [!WARNING]
> The code above has exactly the same effect as `setTimeout(func, 0)` in `JS`.

### Aliases

In addition to object-oriented style naming, function-style aliases are also provided.

| Object-oriented                     | Function-style                  |
|:-------------------------|:-----------------------|
| Swoole\Timer::tick()     | swoole_timer_tick()    |
| Swoole\Timer::after()     | swoole_timer_after()      |
| Swoole\Timer::exists()     | swoole_timer_exists()     |
| Swoole\Timer::info()     | swoole_timer_info()       |
| Swoole\Timer::stats()     | swoole_timer_stats()      |
| Swoole\Timer::list()     | swoole_timer_list()       |
| Swoole\Timer::clear()    | swoole_timer_clear()      |
| Swoole\Timer::clearAll() | swoole_timer_clear_all()  |

## Notes

> [!TIP]
> By default, timers automatically create a coroutine when executing the callback function.
>
> The execution time of a timer callback does not affect the next timer execution time. Example: a `10ms` `tick` timer set at `0.002s` executes its callback for the first time at `0.012s`. If the callback takes `5ms`, the next timer still fires at `0.022s`, not `0.027s`.
>
> However, if the timer callback takes too long, even covering the next scheduled execution time, the underlying layer performs time correction, discards the expired tick, and calls back at the next time. In the example above, if the callback at `0.012s` takes `15ms`, a timer callback should have occurred at `0.022s`. In fact this timer does not return until `0.027s`, by which time the tick has long expired. The underlying layer will trigger the timer callback again at `0.032s`.

> [!WARNING]
> Timers are only valid within the current process space.
>
> Timers are implemented purely asynchronously. Do not use blocking functions in timer callbacks, otherwise timer execution times will become disordered.
>
> Timers may have a certain amount of error during execution.