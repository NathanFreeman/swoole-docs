# 协程栅栏

`Swoole` 提供了一个更便捷的协程并发管理工具：协程栅栏 `Swoole\Coroutine\Barrier`。相比[等待组](/zh/coroutine/waitGroup.html)，它的使用更简单——只需把栅栏对象通过参数传递或闭包 `use` 语法引入子协程函数即可。

## 方法

### make

创建一个协程栅栏。

```php
public static function make(): self
```

### wait

主协程等待子协程完成任务。

```php
public static function wait(Barrier &$barrier, float $timeout = -1): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `&$barrier` | 通过 `make` 创建的协程栅栏 | 必填 |
| `$timeout` | 超时时间 | `-1`，永不超时 |

## 示例

```php
<?php
use Swoole\Coroutine\Barrier;
use Swoole\Coroutine\System;
use function Swoole\Coroutine\run;
use Swoole\Coroutine;

run(function () {
    $barrier = Barrier::make();

    $count = 0;
    $N = 4;

    foreach (range(1, $N) as $i) {
        // 必须使用 use 引用 $barrier
        Coroutine::create(function () use ($barrier, &$count) {
            System::sleep(0.5);
            $count++;
        });
    }

    Barrier::wait($barrier);
    assert($count == $N);
});
```
