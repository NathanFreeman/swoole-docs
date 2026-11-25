# Swoole\Coroutine\CanceledException

`Swoole\Coroutine\CanceledException` 是協程被取消時在被取消協程內拋出的異常，`v6.1.0` 版本引入，繼承自 `\Exception`。它使協程取消從「靜默終止」變爲「可捕獲的異常」，被取消的一方可以在 `catch` 塊中完成資源清理並記錄異常日誌。

該異常有兩個來源：

- 調用 [Swoole\Coroutine::cancel()](/zh-hant/coroutine/coroutine_api.html#cancel) 並將 `$throw_exception` 設爲 `true` 時，向目標協程拋出此異常，可通過第三個參數 `$reason` 附帶取消原因。
- 開啓 [http2_cancel_on_stream_reset](/zh-hant/server/setting.html#http2-cancel-on-stream-reset) 後，客戶端發送 `RST_STREAM` 幀重置 `HTTP/2` 流時，向該流的請求協程拋出此異常。

## 方法

### getReason

獲取協程被取消的原因，`v6.3.0` 版本之後可用。

```php
public function getReason(): mixed
```

**返回值**：即 `Coroutine::cancel()` 第三個參數 `$reason` 傳入的值，可以是任意類型，未傳入時爲 `null`。`HTTP/2` 流重置場景下爲包含 `session_id`、`stream_id`、`code`、`message` 的關聯數組，參見 [http2_cancel_on_stream_reset](/zh-hant/server/setting.html#http2-cancel-on-stream-reset)。

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
    Coroutine::cancel($cid, true, ['type' => 'timeout', 'message' => '任務超時']);
});
```

> [!WARNING]
> **注意**
>
> - 被取消的協程必須捕獲該異常，否則將產生 `Fatal Error`，導致進程退出。
> - 該類爲 `final`，不可繼承。