# 協程柵欄

`Swoole` 提供了一個更便捷的協程併發管理工具：協程柵欄 `Swoole\Coroutine\Barrier`。相比[等待組](/zh-hant/coroutine/waitGroup.html)，它的使用更簡單——只需把柵欄對象通過參數傳遞或閉包 `use` 語法引入子協程函數即可。

## 方法

### make

創建一個協程柵欄。

```php
public static function make(): self
```

### wait

主協程等待子協程完成任務。

```php
public static function wait(Barrier &$barrier, float $timeout = -1): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `&$barrier` | 通過 `make` 創建的協程柵欄 | 必填 |
| `$timeout` | 超時時間 | `-1`，永不超時 |

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
        // 必須使用 use 引用 $barrier
        Coroutine::create(function () use ($barrier, &$count) {
            System::sleep(0.5);
            $count++;
        });
    }

    Barrier::wait($barrier);
    assert($count == $N);
});
```
