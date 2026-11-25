# Swoole\Coroutine\CanceledException

`Swoole\Coroutine\CanceledException` is the exception thrown inside a coroutine when it is canceled. Introduced in `v6.1.0`, it extends `\Exception`. It turns coroutine cancellation from a "silent termination" into a "catchable exception", so the canceled side can clean up resources and write exception logs in a `catch` block.

The exception has two sources:

- Calling [Swoole\Coroutine::cancel()](/en/coroutine/coroutine_api.html#cancel) with `$throw_exception` set to `true` throws this exception into the target coroutine; the third argument `$reason` can attach a cancellation reason.
- With [http2_cancel_on_stream_reset](/en/server/setting.html#http2-cancel-on-stream-reset) enabled, when the client resets an `HTTP/2` stream with an `RST_STREAM` frame, this exception is thrown into that stream's request coroutine.

## Methods

### getReason

Gets the reason why the coroutine was canceled. Available since `v6.3.0`.

```php
public function getReason(): mixed
```

**Return value**: The value passed as the third argument `$reason` of `Coroutine::cancel()`, which can be of any type; `null` if not provided. In the `HTTP/2` stream reset scenario it is an associative array containing `session_id`, `stream_id`, `code`, and `message`, see [http2_cancel_on_stream_reset](/en/server/setting.html#http2-cancel-on-stream-reset).

## Example

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\CanceledException;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    $cid = go(function () {
        try {
            Coroutine::sleep(10);
        } catch (CanceledException $e) {
            var_dump($e->getReason());
        }
    });

    Coroutine::sleep(0.1);
    Coroutine::cancel($cid, true, ['type' => 'timeout', 'message' => 'task timeout']);
});
```

> [!WARNING]
> **Notes**
>
> - The canceled coroutine must catch this exception, otherwise a `Fatal Error` occurs and the process exits.
> - The class is `final` and cannot be extended.