# 其他

## 异常处理

在协程编程中可直接使用 `try/catch` 处理异常，但必须在协程内捕获，不得跨协程捕获异常。如果没有捕获异常，会导致整个进程退出。

**错误示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine;

try {
    run(function () {
        Coroutine::create(function () {
            throw new \RuntimeException(__FILE__, __LINE__);
        });
    });
} catch (\Throwable $e) {
    echo $e;
}
```

**正确示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine;

run(function () {
    Coroutine::create(function () {
        try {
            throw new \RuntimeException(__FILE__, __LINE__);
        } catch (\Throwable $e) {
            echo $e;
        }
    });
});
```

## 退出协程

由于 [exit](https://www.php.net/manual/en/function.exit.php) 会导致整个进程直接退出，`Swoole` 在底层替换了 `exit` 的实现逻辑：在协程中执行 `exit` 会抛出一个 [Swoole\ExitException](/zh/server/class/exit_exception.html) 异常。可以在需要的位置捕获该异常，实现与原生 PHP 一样的退出逻辑。

**示例**

```php
<?php
use Swoole\ExitException;
use function Swoole\Coroutine\run;

run(function () {
    try {
        exit(1);
    } catch (ExitException $e) {
        var_dump($e->getMessage());
        var_dump($e->getStatus() === 1);
        var_dump($e->getFlags() === SWOOLE_EXIT_IN_COROUTINE);
    }
});
```

## 禁止共享连接

与同步阻塞程序不同，协程是并发处理请求的，同一时间可能会有很多个请求在并行处理。一旦共用客户端连接，就会导致不同协程之间发生数据错乱。

**错误示例**

```php
<?php
use Redis;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

run(function () {
    $redis = new Redis();
    $redis->connect('127.0.0.1');

    go(function () use ($redis) {
        $redis->set('a', 'Hello');
    });

    go(function () use ($redis) {
        $redis->set('b', 'World');
    });
});
```

## 保存协程上下文

多个协程是并发执行的，因此不能使用类静态变量 / 全局变量保存协程上下文内容。使用局部变量是安全的，因为局部变量的值会自动保存在协程栈中，其他协程访问不到。

可以使用一个 `Context` 类来管理协程上下文：在 `Context` 类中，使用 [getCid](/zh/coroutine/coroutine_api.html#getcid) 获取协程 `ID`，隔离不同协程之间的全局变量，并在协程退出时清理上下文数据。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine;

class Context
{
    public static $pool = [];

    public static function put(string $key, $value)
    {
        self::$pool[Coroutine::getCid()][$key] = $value;
    }

    public static function get(string $key)
    {
        return self::$pool[Coroutine::getCid()][$key] ?? null;
    }

    public static function delete()
    {
        unset(self::$pool[Coroutine::getCid()]);
    }
}

$server = new Server('127.0.0.1', 9501);
$server->on('request', function (Request $request, Response $response) {
    if ($request->server['request_uri'] == '/a') {
        Context::put('name', 'a');
        Coroutine::sleep(1.0);
        echo Context::get('name');
        $response->end(Context::get('name'));
        // 退出协程时清理
        Context::delete();
    } else {
        Context::put('name', 'b');
        $response->end();
        // 退出协程时清理
        Context::delete();
    }
});

$server->start();
```

## 禁止在协程中创建进程

由于在协程中创建进程会导致新进程携带其他协程的上下文，因此底层禁止在协程中使用创建进程的函数。

可以使用 [exec](/zh/coroutine/system_api.html#exec)、协程化的 [`shell_exec`](/zh/coroutine/hook.html) 和协程化的 [`proc_open`](/zh/coroutine/hook.html#swoole-hook-proc) 实现父子进程交互通信。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_ALL);
run(function () {
    $descriptorspec = array(
        0 => array("pipe", "r"),
        1 => array("pipe", "w"),
        2 => array("file", "/tmp/error-output.txt", "a")
    );

    $process = proc_open('php ' . __DIR__ . '/read_stdin.php', $descriptorspec, $pipes);

    $n = 10;
    while ($n--) {
        fwrite($pipes[0], "hello #$n \n");
        echo fread($pipes[1], 8192);
    }

    fclose($pipes[0]);
    proc_close($process);
});
```

**read_stdin.php**

```php
<?php
while (true) {
    $line = fgets(STDIN);
    if ($line) {
        echo $line;
    } else {
        break;
    }
}
```

## 魔术方法中不得产生协程切换

在 `__get` / `__set` 等魔术方法里不得产生协程切换。

**原因**：PHP 为防止魔术方法递归调用做了特殊设计——如果类定义了 `__get()` 方法，实例化并分配属性内存（`properties_table`）时会额外分配一个类型为 `HashTable` 的 `zval`。每次调用 `__get($var)` 时，会把 `$var` 的名称存入这个哈希表，用它来判断当前属性是否已经在 `__get()` 之中：如果是，就不再调用 `__get()`；否则把 `$var` 作为 key 插入哈希表并设置标记（`*guard |= IN_ISSET`），调用完 `__get()` 后再清除标记（`*guard &= ~IN_ISSET`）。

> [!NOTE]
> 这个哈希表并非 `__get()` 专用，其他魔术方法也会用到，因此其值类型为 `zend_long`，不同的魔术方法占用不同的 bit 位。它也不会为所有对象都额外分配：对象创建时根据 `zend_class_entry.ce_flags` 是否包含 `ZEND_ACC_USE_GUARDS` 决定是否分配，类编译时若发现定义了 `__get()`、`__set()`、`__unset()`、`__isset()` 方法，就会打上这个掩码。

一旦在魔术方法中发生协程切换，协程切换出去后下次调用就会被判断为循环调用。此问题由 PHP 的**语言特性**所致，与 PHP 开发组沟通后仍暂时无解。

> [!WARNING]
> 即使魔术方法中没有可以导致协程切换的代码，在设置打开协程抢占式调度后，依然可能导致魔术方法被强行切换协程。

**延伸阅读**：[PHP7 内核剖析 · zend_object](https://github.com/pangudashu/php7-internal/blob/40645cfe087b373c80738881911ae3b178818f11/3/zend_object.md)
