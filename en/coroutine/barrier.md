# Coroutine Barrier

`Swoole` provides a more convenient tool for managing coroutine concurrency: the coroutine barrier `Swoole\Coroutine\Barrier`. Compared with the [wait group](/en/coroutine/waitGroup.html), it is simpler to use — you only need to bring the barrier object into the child coroutine function by passing it as a parameter or via the closure `use` syntax.

## Methods

### make

Creates a coroutine barrier.

```php
public static function make(): self
```

### wait

The main coroutine waits for child coroutines to complete their tasks.

```php
public static function wait(Barrier &$barrier, float $timeout = -1): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `&$barrier` | The coroutine barrier created via `make` | Required |
| `$timeout` | Timeout | `-1`, never times out |

## Examples

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
        // $barrier must be imported with use
        Coroutine::create(function () use ($barrier, &$count) {
            System::sleep(0.5);
            $count++;
        });
    }

    Barrier::wait($barrier);
    assert($count == $N);
});
```