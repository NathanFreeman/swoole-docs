# Swoole\ExitException

`Swoole\ExitException` is a safety mechanism designed by `Swoole` to prevent process crashes caused by abusing `exit` in long-running memory-resident services. Simply put, it turns `exit`, which would originally terminate the entire process, into an exception that can be caught within a coroutine.

## Methods

### getStatus

Gets the status code or message passed when calling the `exit()` function.

```php
public function getStatus(): mixed
```

**Return value**: Whatever is passed to `exit()` is what it returns.

### getFlags

Determines the specific context in which the `exit()` operation occurred, helping developers understand where this exit exception was thrown from.

```php
public function getFlags(): int
```

**Return value**: `SWOOLE_EXIT_IN_COROUTINE`, exited within a coroutine; `SWOOLE_EXIT_IN_SERVER`, exited within an async server.

## Examples

```php
<?php
use Swoole\ExitException;
use function Swoole\Coroutine\run;
run(function () {
    try {
        exit(255);
    } catch (ExitException $e) {
        var_dump($e->getMessage());
        var_dump($e->getStatus() === 255);
        var_dump($e->getFlags() === SWOOLE_EXIT_IN_COROUTINE);
    }
});
```