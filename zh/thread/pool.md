# 线程池

线程池`Swoole\Thread\Pool`，可维持多个工作线程的运行，自动创建、重启、关闭子线程。

> [!NOTE]
> 需要 `Swoole` 版本 >= `v6.0`，且已开启多线程支持，详见[创建线程](/zh/thread/create.html#使用条件)。

## 方法

### __construct

构造方法。

```php
public function __construct(string $workerThreadClass, int $num)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$workerThreadClass` | 工作线程运行的类，须继承 [Runnable](#runnable) | 必填 |
| `$num` | 工作线程的数量 | 必填 |

**示例**

```php
<?php
use Swoole\Thread\Pool;

// 指定工作线程类与线程数量，调用 start() 后才会真正创建线程
$pool = new Pool(TestThread::class, 4);
```

### withArguments

设置工作线程的参数，在工作线程类的 [`run()`](#run) 方法中可获取到此参数。

```php
public function withArguments(mixed ...$args): static
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$args` | 传递给工作线程的参数，可变参数，[`run()`](#run) 中按顺序接收 | 无 |

**返回值**：返回线程池对象自身，可链式调用。

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Pool;

// 并发容器 Map 可跨线程共享
$map = new Thread\Map();

$pool = new Pool(TestThread::class, 2);
// run($uuid, $map) 中依次接收这两个参数
$pool->withArguments(uniqid(), $map);
```

### withAutoloader

加载 `autoload` 文件。

```php
public function withAutoloader(string $autoloader): static
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$autoloader` | `autoload` 的 `PHP` 文件路径 | 必填 |

**返回值**：返回线程池对象自身，可链式调用。

> [!TIP]
> 若使用了 `Composer`，底层可自动推断并在工作线程中加载 `vendor/autoload.php`，不需要手动指定。

**示例**

```php
<?php
use Swoole\Thread\Pool;

$pool = new Pool(TestThread::class, 2);
// 子线程不会继承父线程已加载的文件与 autoload 函数，需重新指定
$pool->withAutoloader(__DIR__ . '/vendor/autoload.php');
```

### withClassDefinitionFile

设置工作线程类的定义文件。

```php
public function withClassDefinitionFile(string $classFile): static
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$classFile` | 定义工作线程类的 `PHP` 文件路径 | 必填 |

**返回值**：返回线程池对象自身，可链式调用。

> [!WARNING]
> 此文件必须只包含 `namespace`、`use`、`class` 定义代码，不得包含可执行的代码片段。

工作线程类必须继承 [`Swoole\Thread\Runnable`](#runnable) 基类，并实现 [`run()`](#run) 方法。若工作线程类在 `autoload` 路径中，可不设置。

**示例**

```php
<?php
use Swoole\Thread\Pool;

$pool = new Pool(TestThread::class, 2);
// TestThread.php 中只有 TestThread 类的定义
$pool->withClassDefinitionFile(__DIR__ . '/TestThread.php');
```

### start

启动所有工作线程。

```php
public function start(): void
```

**示例**

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

工作线程类 `TestThread.php` 的定义见 [Runnable::run](#run)。

### shutdown

关闭线程池。

```php
public function shutdown(): void
```

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Pool;

$map = new Thread\Map();

$pool = (new Pool(TestThread::class, 4))
    ->withClassDefinitionFile(__DIR__ . '/TestThread.php')
    ->withArguments(uniqid(), $map);

$pool->start();

// 关闭线程池，回收所有工作线程
$pool->shutdown();
```

## Runnable

工作线程类必须继承此类。

### run

必须重写此方法，接收线程池对象使用 [`withArguments()`](#witharguments) 方法传入的参数。

```php
public function run(array $args): void
```

> [!WARNING]
> 此方法存在 `run(array $args)` 与 `run($uuid, $map)` 两种签名写法，尚未统一，请以实际使用的扩展版本为准。

**示例**

```php
<?php
use Swoole\Thread\Runnable;

class TestThread extends Runnable
{
    public function run($uuid, $map): void
    {
        // $uuid、$map 由 withArguments() 传入
        $map->incr('thread', 1);

        for ($i = 0; $i < 5; $i++) {
            usleep(10000);
            $map->incr('sleep');
        }
    }
}
```

### shutdown

在工作线程内调用此方法，关闭整个线程池。

```php
public function shutdown(): void
```

**示例**

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

        // 4 个线程各循环 5 次，累计满 20 次后由最后完成的线程关闭整个线程池
        if ($map['sleep'] >= 20) {
            $this->shutdown();
        }
    }
}
```

### id

当前线程的编号，范围是 `0 ~ (线程总数 - 1)`。线程重启时新的继任线程与旧的线程序号是一致的。

```php
public int $id
```

**示例**

```php
<?php
use Swoole\Thread\Runnable;

class TestThread extends Runnable
{
    public function run($uuid, $map): void
    {
        // 4 个工作线程分别输出 thread #0 ~ thread #3
        echo "thread #{$this->id} is running, uuid: {$uuid}\n";
    }
}
```
