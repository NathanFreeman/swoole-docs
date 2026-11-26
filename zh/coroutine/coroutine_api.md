# 协程方法

## 命名空间

`Swoole\Coroutine`

## 方法

### create

创建一个新的协程，并立即执行。

```php
public static function create(callable $function, mixed ...$param): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$function` | 协程执行的函数 | 必填 |
| `...$param` | 传递给协程执行函数的参数 | 无 |

**返回值**：创建成功返回协程的 `ID`，创建失败返回 `false`。

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
> 受底层调度策略影响，父协程会优先让子协程执行。只有当子协程主动挂起时，执行权才会返回给父协程，父协程才能继续向下执行。
> 可以在 `create` 方法中嵌套执行 `create` 方法。

> [!TIP]
> `go` 是该方法的别名，通过 `use function Swoole\Coroutine\go` 引入后即可直接调用 `go()` 函数创建协程，参数说明和 `create` 方法一致。在 `php.ini` 中设置 `swoole.use_shortname=On` 时，会额外注册全局的 `go()` 函数，无需引入即可直接调用。
> 全局函数 `swoole_coroutine_create()` 也是该方法的别名，参数完全一致。

### defer

用于资源的释放，会在协程关闭之前（即协程函数执行完毕时）进行调用。

```php
public static function defer(callable $callback): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$callback` | 协程关闭前执行的函数 | 必填 |

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    Coroutine::defer(function () {
        // 一些资源释放
    });
    Coroutine::create(function ($second) {
        sleep($second);
    }, 1);
});
```

> [!NOTE]
> 就算抛出了异常，通过 `defer` 注册的函数也会被执行。
> 它的调用顺序是逆序的（先进后出），即先注册 `defer` 的后执行。逆序符合资源释放的正确逻辑：后申请的资源可能是基于先申请的资源的，如果先释放先申请的资源，后申请的资源可能就难以释放。

> [!TIP]
> 全局函数 `swoole_coroutine_defer()` 是该方法的别名，参数完全一致。在 `php.ini` 中设置 `swoole.use_shortname=On` 时，还会注册全局的 `defer()` 函数。

### exists

判断指定的协程 `ID` 对应的协程是否存在。

```php
public static function exists(int $cid): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 协程 ID | 必填 |

**返回值**：`true` 表示协程存在，`false` 表示协程不存在。

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

手动让出当前协程的执行权。

```php
public static function yield(): bool
```

**返回值**：`true` 表示操作成功，`false` 表示操作失败。

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
> 该方法有一个 `suspend` 的别名。

### resume

手动恢复某个协程，使其继续运行。

```php
public static function resume(int $cid): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 要恢复的协程 `ID` | 必填 |

**返回值**：`true` 表示操作成功，`false` 表示操作失败。

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

用于取消某个协程，但不能对当前协程发起取消操作。

```php
public static function cancel(int $cid, bool $throw_exception = false, mixed $reason = null): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 协程的 `CID` | 必填 |
| `$throw_exception` | 取消协程，并在被取消的协程内抛出一个 `Swoole\Coroutine\CanceledException` 异常。`v6.1.0` 版本之后可用 | `false` |
| `$reason` | 取消原因，可以是任意类型（如数组、对象、字符串）。被取消的协程捕获异常后可通过 `Swoole\Coroutine\CanceledException::getReason()` 获取该值，为资源清理与异常日志提供完整的上下文信息。仅在 `$throw_exception` 为 `true` 时有效。`v6.3.0` 版本之后可用 | `null` |

**返回值**：成功时返回 `true`，失败将会返回 `false`。取消失败可以调用 `swoole_last_error()` 查看错误信息。

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
    Coroutine::cancel($cid, true, ['type' => 'timeout', 'message' => '任务超时']);
    sleep(0.2);
    echo "co 1 end\n";
});
```

> [!WARNING]
> - 被取消的协程必须捕获 `Swoole\Coroutine\CanceledException` 异常，否则将产生 `Fatal Error`，导致进程退出。
> - 当协程正在读写文件时，是不可取消的，`cancel()` 会返回失败，错误码为 `SWOOLE_ERROR_CO_CANNOT_CANCEL`。
> - 当设置 `$throw_exception` 为 `true` 时，该 `cancel` 将一直返回 `true`。
> - 当 `$throw_exception` 为 `false` 时，`$reason` 必须为 `null`，否则会抛出 `ValueError`。

### isCanceled

用于判断当前操作是否是被手动取消的。

```php
public static function isCanceled(): bool
```

**返回值**：手动取消正常结束返回 `true`，否则返回 `false`。

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

获取当前协程 `ID`，它是一个进程内唯一的正整数。

```php
public static function getCid(): int
```

**返回值**：成功时返回当前协程 `ID`；如果当前不在协程环境中，则返回 `-1`。

> [!TIP]
> 该方法有一个 `getuid` 的别名。

### getPcid

获取当前协程的父 `ID`。

```php
public static function getPcid(int $cid = 0): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 协程 `CID`。可传入某个协程的 `ID` 以获取它的父 `ID`，缺省表示当前协程 | `0` |

**返回值**：成功时返回当前协程的父 `ID`，否则返回 `false`。

### join

并发执行多个独立任务，并等待它们全部完成。

```php
public static function join(array $cid_array, float $timeout = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid_array` | 协程 ID（cid）数组，即通过 `go()` 或 [`Swoole\Coroutine::create()`](#create) 创建协程时返回的 ID | 必填 |
| `$timeout` | 总的超时时间，超时后会立即返回。但正在运行的协程会继续执行完毕，而不会中止 | `-1` |

**返回值**：成功时返回 `true`，失败将会返回 `false`。等待失败可以调用 `swoole_last_error()` 查看错误信息。

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
> `join` 方法本身只负责等待，不直接返回子协程的执行结果。

> [!WARNING]
> 千万不能在等待的协程内部再次调用 `join` 方法，否则会导致死锁。

### getContext

用于获取当前协程的上下文对象，实现协程内的数据共享，同时保证不同协程间数据隔离。

```php
public static function getContext(int $cid = 0): \Swoole\Coroutine\Context|null
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 协程 `CID`，可选参数 | `0`，默认获取当前协程 `CID` |

**返回值**：成功时返回 `Swoole\Coroutine\Context` 对象，协程不存在将会返回 `null`。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

function processRequest() {
    $ctx = Coroutine::getContext();
    echo "处理用户: " . $ctx['user_id'] . "\n";
}

run(function () {
    // 获取当前协程的上下文对象
    $context = Coroutine::getContext();

    // 像数组一样存储数据
    $context['user_id'] = 12345;
    $context['request_id'] = uniqid();

    // 在另一个函数中无需传参，直接获取上下文
    processRequest();
});
```

> [!NOTE]
> - 新创建的协程默认拥有全新的空上下文，不会自动复制父协程的数据。如无其它协程或全局变量引用，协程退出后上下文自动清理。
> - `Swoole\Coroutine\Context` 继承 `ArrayObject`，可以使用数组方式访问。
> - 相比用 PHP 数组实现上下文，没有哈希计算开销（在协程数量巨大时有一定好处）。

### getBackTrace

获取协程函数调用栈。

```php
public static function getBackTrace(int $cid = 0, int $options = DEBUG_BACKTRACE_PROVIDE_OBJECT, int $limit = 0): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 协程的 `CID` | 当前协程 `CID` |
| `$options` | 设置选项。`DEBUG_BACKTRACE_PROVIDE_OBJECT` 是否填充 `object` 的索引；`DEBUG_BACKTRACE_IGNORE_ARGS` 是否忽略 args 的索引（包括所有 function/method 的参数），能够节省内存开销 | `DEBUG_BACKTRACE_PROVIDE_OBJECT` |
| `$limit` | 限制返回堆栈帧的数量 | `0` |

**返回值**：指定的协程不存在将返回 `false`；成功返回数组，格式与 [debug_backtrace](https://www.php.net/manual/zh/function.debug-backtrace.php) 函数返回值相同。

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
            //返回数组，需要自行格式化输出
            var_dump(Co::getBackTrace($cid))."\n";
            Co::sleep(3);
        }
    });
});
```

### printBackTrace

打印协程函数调用栈。

```php
public static function printBackTrace(int $cid = 0, int $options = 0, int $limit = 0): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 协程的 `CID` | 当前协程 `CID` |
| `$options` | 设置选项。`DEBUG_BACKTRACE_PROVIDE_OBJECT` 是否填充 `object` 的索引；`DEBUG_BACKTRACE_IGNORE_ARGS` 是否忽略 args 的索引（包括所有 function/method 的参数），能够节省内存开销 | `0` |
| `$limit` | 限制返回堆栈帧的数量 | `0` |

> [!TIP]
> 和 [`getBackTrace`](#getbacktrace) 不同的是，`printBackTrace` 会自动打印函数调用栈信息。

### getElapsed

获取指定协程运行的时间，以便于分析统计或找出僵尸协程。

```php
public static function getElapsed(int $cid = 0): int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 可选参数，协程的 `CID` | 当前协程 `CID` |

**返回值**：协程已运行的时间，整型，单位为微秒。

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

获取指定协程的内存使用量，单位为字节。

```php
public static function getStackUsage(int $cid = 0): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cid` | 可选参数，协程的 `CID` | 当前协程 `CID` |

**返回值**：成功返回内存使用量；指定的协程不存在，将返回 `false`。

### set

设置协程运行相关配置。

```php
public static function set(array $options): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$options` | 协程运行相关配置 | 必填 |

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

获取协程运行相关配置。

```php
public static function getOptions(): ?array
```

### stats

获取当前协程状态。

```php
public static function stats(): array
```

**返回值**：成功时返回一个包含协程状态的数组。

| key | 作用 |
|:---|:---|
| `event_num` | 当前 reactor 事件数量 |
| `signal_listener_num` | 当前监听信号的数量 |
| `aio_task_num` | 异步 IO 任务数量（这里的 aio 指文件 IO 或 dns，不包含其它网络 IO，下同） |
| `aio_worker_num` | 异步 IO 工作线程数量 |
| `c_stack_size` | 每个协程的 C 栈大小 |
| `coroutine_num` | 当前运行的协程数量 |
| `coroutine_peak_num` | 当前运行的协程数量的峰值 |
| `coroutine_last_cid` | 最后创建协程的 id |

### list

遍历当前进程内的所有协程。

```php
public static function list(): \Swoole\Coroutine\Iterator
```

**返回值**：返回 `Swoole\Coroutine\Iterator` 迭代器，里面包含当前进程创建的所有协程 id，可使用 `foreach` 遍历，不能使用数组下标形式访问。

> [!TIP]
> 该方法有一个 `listCoroutines` 的别名。

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

打开协程抢占式调度。

```php
public static function enableScheduler(): bool
```

**返回值**：成功时返回 `true`，失败返回 `false`。

> [!TIP]
> `Swoole` 默认使用协作式调度，这意味着每个协程需要主动让出（如遇到 `sleep()` 或 `网络 IO`）时，才会触发调度切换。如果某个协程执行了一个死循环或非常耗时的 `CPU` 计算且从不主动让出，它会一直霸占 `CPU`，导致其他协程永远无法获得执行机会。抢占式调度器正是为了解决这个问题而设计的。开启后，`Swoole` 会强制在协程执行一定时间后主动切断其执行，并将 `CPU` 调度给其他协程。

### disableScheduler

临时关闭协程抢占式调度。

```php
public static function disableScheduler(): bool
```

**返回值**：成功时返回 `true`，失败返回 `false`。

### getExecuteTime

可获取协程实际执行时间（不包含协程切换状态的时间）。

```php
public static function getExecuteTime(): int
```

**返回值**：返回协程实际执行毫秒数。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;
use Swoole\Coroutine\TimeoutException;

run(function () {
    // 假设这里没有协程切换，纯 CPU 逻辑花费了 3 秒
    do_something();
    // 让出协程
    sleep(1);
    echo Coroutine::getExecuteTime(); // 返回约 3000 毫秒
});
```

> [!IMPORTANT]
> 需要编译 `swoole` 的时候开启 `--enable-swoole-coro-time` 才可以使用这个函数。

### setTimeLimit

设置协程运行超时时间。

```php
public static function setTimeLimit(float $timeout): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 协程超时时间 | 必填 |

**返回值**：成功时返回 `true`，失败返回 `false`。

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
> `Swoole 6.2` 以上可用，协程执行时间大于超时时间会抛出 `Swoole\Coroutine\TimeoutException` 异常。

## 函数

### batch

并发执行多个协程，并且通过数组，返回这些协程方法的返回值。

```php
function batch(array $tasks, float $timeout = -1): array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$tasks` | 传入方法回调的数组，如果指定了 `key`，则返回值也会被该 `key` 指向 | 必填 |
| `$timeout` | 总的超时时间，超时后会立即返回。但正在运行的协程会继续执行完毕，而不会中止 | `-1` |

**返回值**：返回一个数组，里面包含回调的返回值。如果 `$tasks` 参数中指定了 `key`，则返回值也会被该 `key` 指向。

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
            return true; // 返回NULL 因为超过了设置的超时时间0.1秒，超时后会立即返回。但正在运行的协程会继续执行完毕，而不会中止。
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

并发执行多个相同回调函数的协程。

```php
function parallel(int $n, callable $fn): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$n` | 设置最大的协程数为 `$n` | 必填 |
| `$fn` | 对应需要执行的回调函数 | 必填 |

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

类似于 [array_map](https://www.php.net/manual/zh/function.array-map.php)，为数组的每个元素应用回调函数，回调函数通过协程执行。

```php
function map(array $list, callable $fn, float $timeout = -1): array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$list` | 运行 `$fn` 函数的数组 | 必填 |
| `$fn` | `$list` 数组中的每个元素需要执行的回调函数 | 必填 |
| `$timeout` | 总的超时时间，超时后会立即返回。但正在运行的协程会继续执行完毕，而不会中止 | `-1` |

**返回值**：成功后返回一个数组，里面包含了各个回调函数的执行结果。

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

协程死锁检测，发现死锁时会输出相关堆栈信息。

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

