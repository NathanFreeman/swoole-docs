# Swoole\Coroutine\CanceledException

`Swoole\Coroutine\CanceledException` 是协程被取消时在被取消协程内抛出的异常，`v6.1.0` 版本引入，继承自 `\Exception`。它使协程取消从「静默终止」变为「可捕获的异常」，被取消的一方可以在 `catch` 块中完成资源清理并记录异常日志。

该异常有两个来源：

- 调用 [Swoole\Coroutine::cancel()](/zh/coroutine/coroutine_api.html#cancel) 并将 `$throw_exception` 设为 `true` 时，向目标协程抛出此异常，可通过第三个参数 `$reason` 附带取消原因。
- 开启 [http2_cancel_on_stream_reset](/zh/server/setting.html#http2-cancel-on-stream-reset) 后，客户端发送 `RST_STREAM` 帧重置 `HTTP/2` 流时，向该流的请求协程抛出此异常。

## 方法

### getReason

获取协程被取消的原因，`v6.3.0` 版本之后可用。

```php
public function getReason(): mixed
```

**返回值**：即 `Coroutine::cancel()` 第三个参数 `$reason` 传入的值，可以是任意类型，未传入时为 `null`。`HTTP/2` 流重置场景下为包含 `session_id`、`stream_id`、`code`、`message` 的关联数组，参见 [http2_cancel_on_stream_reset](/zh/server/setting.html#http2-cancel-on-stream-reset)。

## 示例

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
    Coroutine::cancel($cid, true, ['type' => 'timeout', 'message' => '任务超时']);
});
```

> [!WARNING]
> **注意**
>
> - 被取消的协程必须捕获该异常，否则将产生 `Fatal Error`，导致进程退出。
> - 该类为 `final`，不可继承。