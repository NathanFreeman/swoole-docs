# Swoole\Coroutine\Server\Connection

當 [TCP/UDP 協程服務器](/zh-hant/server/coroutine/tcp_udp.html) 接收請求並觸發回調函數時，會傳入一個 `Swoole\Coroutine\Server\Connection` 對象。您可以通過該對象來處理當前請求並獲取其相關信息。

## 方法

### recv

接收數據，如果設置了協議處理，將每次返回完整的包。

```php
public function recv(float $timeout = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時時間，單位爲秒，支持浮點型，如 `1.5` 表示 `1s`+`500ms` | `0` |

**返回值**：接收成功返回一個完整協議數據包；接收失敗返回 `false`，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`。

### send

發送數據。

```php
public function send(string $data): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要發送的數據內容，可以爲文本或二進制數據 | 必填 |

**返回值**：`send` 會保證數據全部發送成功，但是 `send` 期間對端有可能將連接斷開，此時可能發送成功了部分數據，返回值會返回這個成功數據的長度，應用層代碼需要對比返回值與 `strlen($data)` 是否相等來判斷是否發送完成，根據業務需求是否需要續傳。發送失敗返回 `false`。

### close

關閉連接

```php
public function close(): bool
```

### exportSocket

得到當前連接的 [`Socket`](/zh-hant/client/socket.html) 對象。可調用更多底層的方法。

```php
public function exportSocket(): Swoole\Coroutine\Socket
```