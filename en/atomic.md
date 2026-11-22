# Lock-Free Counter
* `Swoole` provides an **atomic counting** operation class at the underlying level. It uses `gcc/clang` `CPU atomic instructions` to implement lock-free integer increment and decrement operations, and supports cross-process counting based on shared memory without locking. This mechanism is commonly used for synchronization in `multi-process / multi-thread` environments.
* In multi-process mode, only the `Swoole\Atomic` class (32-bit unsigned integer) can be used. If your application needs to handle negative values or a larger integer range, use the `64`-bit signed `Swoole\Atomic\Long` class.
* [In multi-thread mode](/en/thread/create.html), only the `Swoole\Thread\Atomic` class (32-bit unsigned integer) can be used. If your application needs to handle negative values or a larger integer range, use the `64`-bit signed `Swoole\Thread\Atomic\Long` class.
* `Swoole\Atomic`, `Swoole\Atomic\Long`, `Swoole\Thread\Atomic`, and `Swoole\Thread\Atomic\Long` have completely identical interfaces; only their namespaces differ.

## __construct
- Constructor. Creates an atomic counter object.

```php
Swoole\Atomic::__construct(int $value = 0)
```

* **Parameters**
    * **`int $value`**
        * **Description**: Specifies the initial value of the atomic counter
        * **Default**: `0`
        * **Other values**: None


* **Example**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(1);
```

> [!IMPORTANT]
> Only `32`-bit unsigned integers can be operated on, supporting up to `4.2` billion; negative numbers are not supported.

## add
- Increments the counter.

```php
Swoole\Atomic->add(int $value = 1): int
```

* **Parameters**
    * **`int $add_value`**
        * **Description**: The value to add [must be a positive integer]
        * **Default**: `1`
        * **Other values**: None

* **Return value**
    * Returns the resulting value after the operation succeeds.

* **Example**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(1);
$atomic->add(100);
```

> [!WARNING]
> If the sum with the original value exceeds `4.2` billion, it will overflow and the high-order bits will be discarded.

## sub
- Decrements the counter.

```php
Swoole\Atomic->sub(int $value = 1): int
```

* **Parameters**
    * **`int $value`**
        * **Description**: The value to subtract [must be a positive integer]
        * **Default**: `1`
        * **Other values**: None

* **Return value**
    * Returns the resulting value after the operation succeeds

* **Example**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->sub(50);
```

> [!WARNING]
> If the result of subtracting from the original value is less than `0`, it will overflow and the high-order bits will be discarded.


## get
- Gets the current counter value.

```php
Swoole\Atomic->get(): int
```

* **Return value**
    * Returns the current value.

* **Example**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
var_dump($atomic->get());
```

## set
- Sets the current value to the specified number.

```php
Swoole\Atomic->set(int $value): void
```

* **Parameters**
    * **`int $value`**
        * **Description**: Specifies the target value to set
        * **Default**: None
        * **Other values**: None

* **Example**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->set(1000);
var_dump($atomic->get());
```

## cmpset
- If the current value equals the parameter `$cmpValue`, sets the current value to the parameter `$setValue`.

```php
Swoole\Atomic->cmpset(int $cmpValue, int $setValue): bool
```

* **Parameters**
    * **`int $cmpValue`**
        * **Description**: The value to compare against; must be an integer less than `4.2` billion.
        * **Default**: None
        * **Other values**: None

    * **`int $setValue`**
        * **Description**: The value to set; must be an integer less than `4.2` billion.
        * **Default**: None
        * **Other values**: None

* **Return value**
    * If the current value equals `$cmpValue`, sets it to `$setValue` and returns `true`; otherwise returns `false`.

* **Example**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->cmpset(100, 1000);
var_dump($atomic->get());
```

## wait
- When the atomic counter value is `0`, the process enters a waiting state. This method is used together with [`Swoole\Atomic->wakeup()`](#wakeup) and is commonly used for multi-process synchronization.

```php
Swoole\Atomic->wait(float $timeout = 1.0): bool
```

* **Parameters**
    * **`float $timeout`**
        * **Description**: Specifies the timeout. Setting it to `-1` means never time out; it keeps waiting until another process wakes it up. Unit: seconds; floating-point values are supported, e.g., `1.5` means `1s` + `500ms`.
        * **Default**: `1`
        * **Other values**: None

* **Return value**
    * Returns `false` on timeout; you can use the `swoole_errno` function to get the error code `EAGAIN`.
    * Returns `true` on success, indicating that another process successfully woke up the current process via `Swoole\Atomic->wakeup()`.

> [!INFO]
> The process calling `Swoole\Atomic->wait()` **first checks whether the atomic counter is `1`, and if so attempts to set the atomic counter to `0`**. If setting fails, the process goes to sleep and waits to be woken up by another process. After being woken up, it **tries again to set it to `0`**, until it succeeds.

> [!WARNING]
> `Swoole\Atomic\Long` and `Swoole\Thread\Atomic\Long` do not have the `wait` method.

> [!DANGER]
> `Swoole\Atomic->wakeup()` blocks the entire process rather than the coroutine, so do not use `Swoole\Atomic->wakeup()` in a coroutine environment to avoid suspending the process.

## wakeup
- Wakes up other processes that are sleeping. This method is used together with [`Swoole\Atomic->wait()`](#wait) and is commonly used for multi-process synchronization.

```php
Swoole\Atomic->wakeup(int $count = 1): bool
```

* **Parameters**
    * **`int $count`**
        * **Description**: The number of processes to wake up
        * **Default**: None
        * **Other values**: None
* **Return value**
    * Returns `true` on success, `false` on failure.

> [!INFO]
> The process calling `Swoole\Atomic->wakeup()` **first checks whether the atomic counter is `0`, and if so attempts to set the atomic counter to `1`**; on success it randomly wakes up `$count` sleeping processes.

> [!WARNING]
> `Swoole\Atomic\Long` and `Swoole\Thread\Atomic\Long` do not have the `wakeup` method.

## Notification and Atomic Lock
* Combining `Swoole\Atomic->wait()` and `Swoole\Atomic->wakeup()` can implement inter-process/thread waiting, notification, and locking with only `4` bytes of memory.
* The initial atomic counter value passed to the constructor must be `1`, otherwise it will not work properly.

```php
<?php
use Swoole\Atomic;
use Swoole\Process;

$atomic = new Atomic(1); // Must be 1, otherwise it will not work properly

for ($i = 0; $i < 10; $i++) {
    $process = new Process(function ($process) use ($atomic, $i) {
        usleep(mt_rand(200000, 800000)); // Shuffle the process execution order
        $atomic->wait(); // 10 processes try to set the value to 0 at the same time, but only one process succeeds
        echo "Process $i operated successfully; about to wake up one sleeping process before exiting" . PHP_EOL;
        usleep(mt_rand(200000, 800000)); // Simulate an atomic operation
        $atomic->wakeup(); // The successful process sets the value to 1 and wakes up one sleeping process
    });
    $process->start();
}

for ($n = 10; $n--;) {
    Process::wait(true);
}
```

> [!NOTE]
> Under the hood, `Swoole\Atomic->wait()` and `Swoole\Atomic->wakeup()` are implemented based on the `Linux Futex` feature. On platforms that do not support `Futex`, the underlying layer simulates them with a `usleep(1000)` loop.

## Notes
* Do not instantiate atomic counters inside [event callbacks](/en/server/events.html), otherwise memory will keep growing, causing a memory leak.

```php
<?php
use Swoole\Atomic;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
    $atomic = new Atomic(0); // [!code error]
    $atomic->add(1);
    $response->end('Hello World');
});

$http->start();
```

* When using atomic counters in `multi-process` or `multi-thread` environments, be sure to instantiate the counter object before creating any `child processes` or `child threads`.

```php
<?php
use Swoole\Atomic;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$atomic = new Atomic(0);

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) use ($atomic) {
    $atomic->add(1);
    $response->end('Hello World');
});

$http->start();
```