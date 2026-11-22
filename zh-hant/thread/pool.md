# 線程池

線程池`Swoole\Thread\Pool`，可維持多個工作線程的運行，自動創建、重啓、關閉子線程。

> [!NOTE]
> 需要 `Swoole` 版本 >= `v6.0`，且已開啓多線程支持，詳見[創建線程](/zh-hant/thread/create.html#使用條件)。

## 方法

### __construct

構造方法。

```php
public function __construct(string $workerThreadClass, int $num)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$workerThreadClass` | 工作線程運行的類，須繼承 [Runnable](#runnable) | 必填 |
| `$num` | 工作線程的數量 | 必填 |

**示例**

```php
<?php
use Swoole\Thread\Pool;

// 指定工作線程類與線程數量，調用 start() 後纔會真正創建線程
$pool = new Pool(TestThread::class, 4);
```

### withArguments

設置工作線程的參數，在工作線程類的 [`run()`](#run) 方法中可獲取到此參數。

```php
public function withArguments(mixed ...$args): static
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$args` | 傳遞給工作線程的參數，可變參數，[`run()`](#run) 中按順序接收 | 無 |

**返回值**：返回線程池對象自身，可鏈式調用。

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Pool;

// 併發容器 Map 可跨線程共享
$map = new Thread\Map();

$pool = new Pool(TestThread::class, 2);
// run($uuid, $map) 中依次接收這兩個參數
$pool->withArguments(uniqid(), $map);
```

### withAutoloader

加載 `autoload` 文件。

```php
public function withAutoloader(string $autoloader): static
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$autoloader` | `autoload` 的 `PHP` 文件路徑 | 必填 |

**返回值**：返回線程池對象自身，可鏈式調用。

> [!TIP]
> 若使用了 `Composer`，底層可自動推斷並在工作線程中加載 `vendor/autoload.php`，不需要手動指定。

**示例**

```php
<?php
use Swoole\Thread\Pool;

$pool = new Pool(TestThread::class, 2);
// 子線程不會繼承父線程已加載的文件與 autoload 函數，需重新指定
$pool->withAutoloader(__DIR__ . '/vendor/autoload.php');
```

### withClassDefinitionFile

設置工作線程類的定義文件。

```php
public function withClassDefinitionFile(string $classFile): static
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$classFile` | 定義工作線程類的 `PHP` 文件路徑 | 必填 |

**返回值**：返回線程池對象自身，可鏈式調用。

> [!WARNING]
> 此文件必須只包含 `namespace`、`use`、`class` 定義代碼，不得包含可執行的代碼片段。

工作線程類必須繼承 [`Swoole\Thread\Runnable`](#runnable) 基類，並實現 [`run()`](#run) 方法。若工作線程類在 `autoload` 路徑中，可不設置。

**示例**

```php
<?php
use Swoole\Thread\Pool;

$pool = new Pool(TestThread::class, 2);
// TestThread.php 中只有 TestThread 類的定義
$pool->withClassDefinitionFile(__DIR__ . '/TestThread.php');
```

### start

啓動所有工作線程。

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

工作線程類 `TestThread.php` 的定義見 [Runnable::run](#run)。

### shutdown

關閉線程池。

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

// 關閉線程池，回收所有工作線程
$pool->shutdown();
```

## Runnable

工作線程類必須繼承此類。

### run

必須重寫此方法，接收線程池對象使用 [`withArguments()`](#witharguments) 方法傳入的參數。

```php
public function run(array $args): void
```

> [!WARNING]
> 此方法存在 `run(array $args)` 與 `run($uuid, $map)` 兩種簽名寫法，尚未統一，請以實際使用的擴展版本爲準。

**示例**

```php
<?php
use Swoole\Thread\Runnable;

class TestThread extends Runnable
{
    public function run($uuid, $map): void
    {
        // $uuid、$map 由 withArguments() 傳入
        $map->incr('thread', 1);

        for ($i = 0; $i < 5; $i++) {
            usleep(10000);
            $map->incr('sleep');
        }
    }
}
```

### shutdown

在工作線程內調用此方法，關閉整個線程池。

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

        // 4 個線程各循環 5 次，累計滿 20 次後由最後完成的線程關閉整個線程池
        if ($map['sleep'] >= 20) {
            $this->shutdown();
        }
    }
}
```

### id

當前線程的編號，範圍是 `0 ~ (線程總數 - 1)`。線程重啓時新的繼任線程與舊的線程序號是一致的。

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
        // 4 個工作線程分別輸出 thread #0 ~ thread #3
        echo "thread #{$this->id} is running, uuid: {$uuid}\n";
    }
}
```
