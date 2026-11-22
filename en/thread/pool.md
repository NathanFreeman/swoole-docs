# Thread Pool

The thread pool `Swoole\Thread\Pool` keeps multiple worker threads running, automatically creating, restarting, and shutting down child threads.

> [!NOTE]
> Requires `Swoole` version >= `v6.0` with multi-threading support enabled; see [Creating Threads](/en/thread/create.html#requirements).

## Methods

### __construct

Constructor.

```php
public function __construct(string $workerThreadClass, int $num)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$workerThreadClass` | The class run by worker threads; must extend [Runnable](#runnable) | Required |
| `$num` | The number of worker threads | Required |

**Example**

```php
<?php
use Swoole\Thread\Pool;

// Specify the worker thread class and thread count; threads are actually created only after start() is called
$pool = new Pool(TestThread::class, 4);
```

### withArguments

Sets the arguments for worker threads. These arguments can be retrieved in the worker thread class's [`run()`](#run) method.

```php
public function withArguments(mixed ...$args): static
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$args` | Arguments passed to worker threads; variadic, received in order in [`run()`](#run) | None |

**Return value**: Returns the thread pool object itself, allowing chained calls.

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Pool;

// The concurrent container Map can be shared across threads
$map = new Thread\Map();

$pool = new Pool(TestThread::class, 2);
// run($uuid, $map) receives these two arguments in order
$pool->withArguments(uniqid(), $map);
```

### withAutoloader

Loads the `autoload` file.

```php
public function withAutoloader(string $autoloader): static
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$autoloader` | Path to the `autoload` `PHP` file | Required |

**Return value**: Returns the thread pool object itself, allowing chained calls.

> [!TIP]
> If you use `Composer`, the underlying layer can automatically infer and load `vendor/autoload.php` in worker threads; no manual specification is needed.

**Example**

```php
<?php
use Swoole\Thread\Pool;

$pool = new Pool(TestThread::class, 2);
// Child threads do not inherit the files and autoload functions loaded by the parent thread; specify them again
$pool->withAutoloader(__DIR__ . '/vendor/autoload.php');
```

### withClassDefinitionFile

Sets the definition file of the worker thread class.

```php
public function withClassDefinitionFile(string $classFile): static
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$classFile` | Path to the `PHP` file defining the worker thread class | Required |

**Return value**: Returns the thread pool object itself, allowing chained calls.

> [!WARNING]
> This file must contain only `namespace`, `use`, and `class` definition code; it must not contain executable code snippets.

The worker thread class must extend the [`Swoole\Thread\Runnable`](#runnable) base class and implement the [`run()`](#run) method. If the worker thread class is in the `autoload` path, this can be omitted.

**Example**

```php
<?php
use Swoole\Thread\Pool;

$pool = new Pool(TestThread::class, 2);
// TestThread.php contains only the definition of the TestThread class
$pool->withClassDefinitionFile(__DIR__ . '/TestThread.php');
```

### start

Starts all worker threads.

```php
public function start(): void
```

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Pool;

$map = new Thread\Map();

(new Pool(TestThread::class, 4))
    ->withAutoloader(__DIR__ . '/vendor/autoload.php')
    ->withClassDefinitionFile(__DIR__ . '/TestThread.php')
    ->withArguments(uniqid(), $map)
    ->start();
```

See [Runnable::run](#run) for the definition of the worker thread class `TestThread.php`.

### shutdown

Shuts down the thread pool.

```php
public function shutdown(): void
```

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Pool;

$map = new Thread\Map();

$pool = (new Pool(TestThread::class, 4))
    ->withClassDefinitionFile(__DIR__ . '/TestThread.php')
    ->withArguments(uniqid(), $map);

$pool->start();

// Shut down the thread pool and reclaim all worker threads
$pool->shutdown();
```

## Runnable

Worker thread classes must extend this class.

### run

This method must be overridden. It receives the arguments passed by the thread pool object via the [`withArguments()`](#witharguments) method.

```php
public function run(array $args): void
```

> [!WARNING]
> This method has two signature forms, `run(array $args)` and `run($uuid, $map)`, which have not yet been unified; refer to the extension version you are actually using.

**Example**

```php
<?php
use Swoole\Thread\Runnable;

class TestThread extends Runnable
{
    public function run($uuid, $map): void
    {
        // $uuid and $map are passed in by withArguments()
        $map->incr('thread', 1);

        for ($i = 0; $i < 5; $i++) {
            usleep(10000);
            $map->incr('sleep');
        }
    }
}
```

### shutdown

Call this method inside a worker thread to shut down the entire thread pool.

```php
public function shutdown(): void
```

**Example**

```php
<?php
use Swoole\Thread\Runnable;

class TestThread extends Runnable
{
    public function run($uuid, $map): void
    {
        $map->incr('thread', 1);

        for ($i = 0; $i < 5; $i++) {
            usleep(10000);
            $map->incr('sleep');
        }

        // Each of the 4 threads loops 5 times; once the total reaches 20, the last thread to finish shuts down the entire pool
        if ($map['sleep'] >= 20) {
            $this->shutdown();
        }
    }
}
```

### id

The number of the current thread, in the range `0 ~ (total threads - 1)`. When a thread restarts, the new successor thread keeps the same number as the old thread.

```php
public int $id
```

**Example**

```php
<?php
use Swoole\Thread\Runnable;

class TestThread extends Runnable
{
    public function run($uuid, $map): void
    {
        // The 4 worker threads output thread #0 ~ thread #3 respectively
        echo "thread #{$this->id} is running, uuid: {$uuid}\n";
    }
}
```