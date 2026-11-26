# Coroutine Methods

## Namespace

`Swoole\Coroutine`

## Methods

### create

Creates a new coroutine and executes it immediately.

```php
public static function create(callable $function, mixed ...$param): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$function` | The function the coroutine executes | Required |
| `...$param` | Parameters passed to the coroutine function | None |

**Return value**: Returns the coroutine `ID` on success, or `false` on failure.

**Example**

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
> Due to the underlying scheduling strategy, the parent coroutine lets the child coroutine run first. Execution returns to the parent coroutine only when the child coroutine suspends voluntarily, allowing the parent coroutine to continue.
> You can nest `create` calls inside the `create` method.

> [!TIP]
> `go` is an alias of this method. Import it with `use function Swoole\Coroutine\go` to call the `go()` function directly to create coroutines; its parameters are the same as those of the `create` method. When `swoole.use_shortname=On` is set in `php.ini`, a global `go()` function is additionally registered, which can be called directly without importing.
> The global function `swoole_coroutine_create()` is also an alias of this method, with identical parameters.

### defer

Used to release resources. It is called before the coroutine closes (that is, when the coroutine function finishes executing).

```php
public static function defer(callable $callback): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$callback` | The function to execute before the coroutine closes | Required |

**Example**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    Coroutine::defer(function () {
        // Release some resources
    });
    Coroutine::create(function ($second) {
        sleep($second);
    }, 1);
});
```

> [!NOTE]
> Functions registered with `defer` are executed even if an exception is thrown.
> They are called in reverse order (last in, first out): a `defer` registered earlier runs later. Reverse order matches the correct logic for releasing resources: resources acquired later may depend on resources acquired earlier, so releasing the earlier resources first could make the later ones difficult to release.

> [!TIP]
> The global function `swoole_coroutine_defer()` is an alias of this method, with identical parameters. When `swoole.use_shortname=On` is set in `php.ini`, a global `defer()` function is additionally registered.

### exists

Checks whether the coroutine with the specified `ID` exists.

```php
public static function exists(int $cid): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | Coroutine ID | Required |

**Return value**: `true` indicates the coroutine exists; `false` indicates it does not.

**Example**

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

Manually yields the execution of the current coroutine.

```php
public static function yield(): bool
```

**Return value**: `true` indicates the operation succeeded; `false` indicates it failed.

**Example**

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
> This method has an alias `suspend`.

### resume

Manually resumes a coroutine so that it continues running.

```php
public static function resume(int $cid): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | The `ID` of the coroutine to resume | Required |

**Return value**: `true` indicates the operation succeeded; `false` indicates it failed.

**Example**

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

Cancels a coroutine. You cannot cancel the current coroutine itself.

```php
public static function cancel(int $cid, bool $throw_exception = false, mixed $reason = null): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | The `CID` of the coroutine | Required |
| `$throw_exception` | Cancels the coroutine and throws a `Swoole\Coroutine\CanceledException` exception inside the canceled coroutine. Available since `v6.1.0` | `false` |
| `$reason` | The cancellation reason, which can be of any type (such as an array, object, or string). After catching the exception, the canceled coroutine can retrieve this value via `Swoole\Coroutine\CanceledException::getReason()`, providing complete context for resource cleanup and exception logs. Only effective when `$throw_exception` is `true`. Available since `v6.3.0` | `null` |

**Return value**: Returns `true` on success and `false` on failure. If cancellation fails, you can call `swoole_last_error()` to view the error information.

**Example**

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
    Coroutine::cancel($cid, true, ['type' => 'timeout', 'message' => 'task timeout']);
    sleep(0.2);
    echo "co 1 end\n";
});
```

> [!WARNING]
> - The canceled coroutine must catch the `Swoole\Coroutine\CanceledException` exception; otherwise a `Fatal Error` occurs and the process exits.
> - A coroutine cannot be canceled while it is reading or writing a file; `cancel()` returns failure with the error code `SWOOLE_ERROR_CO_CANNOT_CANCEL`.
> - When `$throw_exception` is set to `true`, `cancel` always returns `true`.
> - When `$throw_exception` is `false`, `$reason` must be `null`, otherwise a `ValueError` is thrown.

### isCanceled

Checks whether the current operation was canceled manually.

```php
public static function isCanceled(): bool
```

**Return value**: Returns `true` if the operation ended normally due to manual cancellation; otherwise returns `false`.

**Example**

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

Gets the current coroutine `ID`, a positive integer unique within the process.

```php
public static function getCid(): int
```

**Return value**: Returns the current coroutine `ID` on success; returns `-1` if not currently in a coroutine environment.

> [!TIP]
> This method has an alias `getuid`.

### getPcid

Gets the parent `ID` of the current coroutine.

```php
public static function getPcid(int $cid = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | Coroutine `CID`. Pass a coroutine's `ID` to get its parent `ID`; omitted means the current coroutine | `0` |

**Return value**: Returns the parent `ID` of the current coroutine on success; otherwise returns `false`.

### join

Runs multiple independent tasks concurrently and waits for all of them to complete.

```php
public static function join(array $cid_array, float $timeout = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid_array` | Array of coroutine IDs (cid), i.e. the IDs returned when creating coroutines with `go()` or [`Swoole\Coroutine::create()`](#create) | Required |
| `$timeout` | Total timeout. Returns immediately after the timeout, but running coroutines continue to completion and are not aborted | `-1` |

**Return value**: Returns `true` on success and `false` on failure. If waiting fails, you can call `swoole_last_error()` to view the error information.

**Example**

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
> The `join` method itself only waits; it does not directly return the execution results of the child coroutines.

> [!WARNING]
> Never call the `join` method again inside a coroutine being waited on; doing so causes a deadlock.

### getContext

Gets the context object of the current coroutine, enabling data sharing within a coroutine while keeping data isolated between different coroutines.

```php
public static function getContext(int $cid = 0): \Swoole\Coroutine\Context|null
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | Coroutine `CID`, optional parameter | `0`, defaults to the current coroutine `CID` |

**Return value**: Returns a `Swoole\Coroutine\Context` object on success; returns `null` if the coroutine does not exist.

**Example**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

function processRequest() {
    $ctx = Coroutine::getContext();
    echo "Processing user: " . $ctx['user_id'] . "\n";
}

run(function () {
    // Get the context object of the current coroutine
    $context = Coroutine::getContext();

    // Store data like an array
    $context['user_id'] = 12345;
    $context['request_id'] = uniqid();

    // Get the context directly in another function without passing parameters
    processRequest();
});
```

> [!NOTE]
> - A newly created coroutine has a brand-new empty context by default; it does not automatically copy the parent coroutine's data. If no other coroutine or global variable references it, the context is cleaned up automatically when the coroutine exits.
> - `Swoole\Coroutine\Context` extends `ArrayObject` and can be accessed like an array.
> - Compared with implementing a context using a PHP array, there is no hash computation overhead (which helps when the number of coroutines is huge).

### getBackTrace

Gets the function call stack of a coroutine.

```php
public static function getBackTrace(int $cid = 0, int $options = DEBUG_BACKTRACE_PROVIDE_OBJECT, int $limit = 0): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | The `CID` of the coroutine | Current coroutine `CID` |
| `$options` | Setting options. `DEBUG_BACKTRACE_PROVIDE_OBJECT` controls whether to populate the `object` index; `DEBUG_BACKTRACE_IGNORE_ARGS` controls whether to ignore the args index (including all function/method arguments), which saves memory | `DEBUG_BACKTRACE_PROVIDE_OBJECT` |
| `$limit` | Limits the number of stack frames returned | `0` |

**Return value**: Returns `false` if the specified coroutine does not exist; on success returns an array in the same format as the return value of the [debug_backtrace](https://www.php.net/manual/zh/function.debug-backtrace.php) function.

**Example**

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
            // Returns an array; format the output yourself
            var_dump(Co::getBackTrace($cid))."\n";
            Co::sleep(3);
        }
    });
});
```

### printBackTrace

Prints the function call stack of a coroutine.

```php
public static function printBackTrace(int $cid = 0, int $options = 0, int $limit = 0): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | The `CID` of the coroutine | Current coroutine `CID` |
| `$options` | Setting options. `DEBUG_BACKTRACE_PROVIDE_OBJECT` controls whether to populate the `object` index; `DEBUG_BACKTRACE_IGNORE_ARGS` controls whether to ignore the args index (including all function/method arguments), which saves memory | `0` |
| `$limit` | Limits the number of stack frames returned | `0` |

> [!TIP]
> Unlike [`getBackTrace`](#getbacktrace), `printBackTrace` automatically prints the function call stack information.

### getElapsed

Gets how long the specified coroutine has been running, useful for analysis and statistics or for finding zombie coroutines.

```php
public static function getElapsed(int $cid = 0): int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | Optional parameter, the `CID` of the coroutine | Current coroutine `CID` |

**Return value**: The time the coroutine has been running, an integer in microseconds.

**Example**

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

Gets the memory usage of the specified coroutine, in bytes.

```php
public static function getStackUsage(int $cid = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cid` | Optional parameter, the `CID` of the coroutine | Current coroutine `CID` |

**Return value**: Returns the memory usage on success; returns `false` if the specified coroutine does not exist.

### set

Sets coroutine runtime configuration.

```php
public static function set(array $options): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$options` | Coroutine runtime configuration | Required |

**Example**

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

Gets coroutine runtime configuration.

```php
public static function getOptions(): ?array
```

### stats

Gets the current coroutine status.

```php
public static function stats(): array
```

**Return value**: Returns an array containing the coroutine status on success.

| Key | Description |
|:---|:---|
| `event_num` | Number of current reactor events |
| `signal_listener_num` | Number of signals currently being listened for |
| `aio_task_num` | Number of async IO tasks (aio here refers to file IO or DNS, not other network IO; same below) |
| `aio_worker_num` | Number of async IO worker threads |
| `c_stack_size` | C stack size of each coroutine |
| `coroutine_num` | Number of currently running coroutines |
| `coroutine_peak_num` | Peak number of running coroutines |
| `coroutine_last_cid` | ID of the last created coroutine |

### list

Iterates over all coroutines in the current process.

```php
public static function list(): \Swoole\Coroutine\Iterator
```

**Return value**: Returns a `Swoole\Coroutine\Iterator` iterator containing the IDs of all coroutines created in the current process. It can be traversed with `foreach` but cannot be accessed with array subscripts.

> [!TIP]
> This method has an alias `listCoroutines`.

**Example**

```php
<?php
use Swoole\Coroutine;
$coroutines = Coroutine::list();
foreach ($coroutines as $cid) {
    var_dump(Coroutine::getBackTrace($cid));
}
```

### enableScheduler

Enables preemptive coroutine scheduling.

```php
public static function enableScheduler(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

> [!TIP]
> `Swoole` uses cooperative scheduling by default, which means a scheduling switch is triggered only when each coroutine yields voluntarily (for example, on `sleep()` or `network IO`). If a coroutine runs an infinite loop or a very time-consuming `CPU` computation and never yields, it monopolizes the `CPU`, and other coroutines never get a chance to run. The preemptive scheduler is designed to solve this problem. Once enabled, `Swoole` forcibly interrupts a coroutine after it has executed for a certain time and schedules the `CPU` to other coroutines.

### disableScheduler

Temporarily disables preemptive coroutine scheduling.

```php
public static function disableScheduler(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

### getExecuteTime

Gets the actual execution time of a coroutine (excluding time spent in coroutine switching states).

```php
public static function getExecuteTime(): int
```

**Return value**: Returns the actual execution time of the coroutine in milliseconds.

**Example**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use Swoole\Coroutine\TimeoutException;

run(function () {
    // Assume no coroutine switching here; pure CPU logic takes 3 seconds
    do_something();
    // Yield the coroutine
    sleep(1);
    echo Coroutine::getExecuteTime(); // Returns about 3000 milliseconds
});
```

> [!IMPORTANT]
> This function is available only when `swoole` is compiled with `--enable-swoole-coro-time` enabled.

### setTimeLimit

Sets the coroutine execution timeout.

```php
public static function setTimeLimit(float $timeout): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Coroutine timeout | Required |

**Return value**: Returns `true` on success and `false` on failure.

**Example**

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
> Available in `Swoole 6.2` and later. If the coroutine execution time exceeds the timeout, a `Swoole\Coroutine\TimeoutException` exception is thrown.

## Functions

### batch

Runs multiple coroutines concurrently and returns their return values as an array.

```php
function batch(array $tasks, float $timeout = -1): array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$tasks` | Array of method callbacks. If keys are specified, the return values are also keyed by them | Required |
| `$timeout` | Total timeout. Returns immediately after the timeout, but running coroutines continue to completion and are not aborted | `-1` |

**Return value**: Returns an array containing the callbacks' return values. If keys are specified in the `$tasks` parameter, the return values are also keyed by them.

**Example**

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
            return true; // Returns NULL because the set timeout of 0.1 seconds is exceeded; it returns immediately after the timeout, but running coroutines continue to completion and are not aborted.
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

Runs multiple coroutines concurrently with the same callback function.

```php
function parallel(int $n, callable $fn): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$n` | Sets the maximum number of coroutines to `$n` | Required |
| `$fn` | The callback function to execute | Required |

**Example**

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

Similar to [array_map](https://www.php.net/manual/zh/function.array-map.php): applies a callback function to each element of an array, with the callbacks executed in coroutines.

```php
function map(array $list, callable $fn, float $timeout = -1): array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$list` | The array on which to run the `$fn` function | Required |
| `$fn` | The callback function to execute for each element of the `$list` array | Required |
| `$timeout` | Total timeout. Returns immediately after the timeout, but running coroutines continue to completion and are not aborted | `-1` |

**Return value**: On success returns an array containing the execution results of each callback function.

**Example**

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

Coroutine deadlock detection. Outputs relevant stack information when a deadlock is found.

```php
function deadlock_check(): void
```

**Example**

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