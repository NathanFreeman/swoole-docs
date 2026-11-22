# Others

## Exception Handling

In coroutine programming you can use `try/catch` directly to handle exceptions, but they must be caught within the coroutine; exceptions must not be caught across coroutines. An uncaught exception causes the entire process to exit.

**Incorrect example**

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

**Correct example**

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

## Exiting a Coroutine

Since [exit](https://www.php.net/manual/en/function.exit.php) causes the entire process to exit immediately, `Swoole` replaces the implementation of `exit` under the hood: executing `exit` inside a coroutine throws a [Swoole\ExitException](/en/server/class/exit_exception.html) exception. You can catch this exception wherever needed to implement exit logic identical to native PHP.

**Example**

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

## Do Not Share Connections

Unlike synchronous blocking programs, coroutines handle requests concurrently — many requests may be processed in parallel at the same time. Sharing a client connection causes data corruption between different coroutines.

**Incorrect example**

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

## Preserving Coroutine Context

Multiple coroutines execute concurrently, so class static variables / global variables cannot be used to store coroutine context. Local variables are safe, because their values are automatically stored on the coroutine stack and cannot be accessed by other coroutines.

You can use a `Context` class to manage coroutine context: inside the `Context` class, use [getCid](/en/coroutine/coroutine_api.html#getcid) to obtain the coroutine `ID`, isolate global variables between different coroutines, and clean up the context data when the coroutine exits.

**Example**

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
        // Clean up when the coroutine exits
        Context::delete();
    } else {
        Context::put('name', 'b');
        $response->end();
        // Clean up when the coroutine exits
        Context::delete();
    }
});

$server->start();
```

## Do Not Create Processes in Coroutines

Creating a process inside a coroutine causes the new process to carry the context of other coroutines, so the underlying layer forbids using process-creation functions inside coroutines.

You can use [exec](/en/coroutine/system_api.html#exec), the hooked [`shell_exec`](/en/coroutine/hook.html), and the hooked [`proc_open`](/en/coroutine/hook.html#swoole-hook-proc) to implement interactive communication between parent and child processes.

**Example**

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

## No Coroutine Switching in Magic Methods

Coroutine switching must not occur inside magic methods such as `__get` / `__set`.

**Reason**: PHP has a special design to prevent recursive calls of magic methods — if a class defines a `__get()` method, an extra `zval` of type `HashTable` is allocated when the instance is created and its property memory (`properties_table`) is allocated. On each call to `__get($var)`, the name of `$var` is stored in this hash table and used to determine whether the current property is already inside `__get()`: if so, `__get()` is not called again; otherwise `$var` is inserted into the hash table as a key and a flag is set (`*guard |= IN_ISSET`), and the flag is cleared after `__get()` returns (`*guard &= ~IN_ISSET`).

> [!NOTE]
> This hash table is not exclusive to `__get()`; other magic methods use it too, so its value type is `zend_long`, with different magic methods occupying different bits. It is also not allocated for every object: when an object is created, allocation depends on whether `zend_class_entry.ce_flags` contains `ZEND_ACC_USE_GUARDS`; during class compilation, this mask is applied if `__get()`, `__set()`, `__unset()`, or `__isset()` methods are found to be defined.

Once a coroutine switch occurs inside a magic method, after the coroutine switches out, the next call will be judged as a recursive call. This problem stems from a PHP **language feature**, and after communicating with the PHP development team there is still no solution for now.

> [!WARNING]
> Even if a magic method contains no code that could cause a coroutine switch, enabling coroutine preemptive scheduling can still forcibly switch coroutines inside magic methods.

**Further reading**: [PHP7 Internals · zend_object](https://github.com/pangudashu/php7-internal/blob/40645cfe087b373c80738881911ae3b178818f11/3/zend_object.md)