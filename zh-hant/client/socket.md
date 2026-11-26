# Socket協程客戶端

- `Swoole\Coroutine\Socket` 是 `Swoole` 提供的協程版底層 `Socket` 客戶端/服務器類，用於在協程環境中直接操作 `TCP`、`UDP` 和
  `Unix Socket` 等傳輸層協議。

## 方法

### __construct

構造方法。構造 `Swoole\Coroutine\Socket` 對象。

```php
public function __construct(int $domain, int $type, int $protocol = IPPROTO_IP)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$domain` | 協議域【可使用 `AF_INET`、`AF_INET6`、`AF_UNIX`】 | 必填 |
| `$type` | 類型【可使用 `SOCK_STREAM`、`SOCK_DGRAM`、`SOCK_RAW`】 | 必填 |
| `$protocol` | 協議【可使用 `IPPROTO_TCP`、`IPPROTO_UDP`、`IPPROTO_STCP`、`IPPROTO_TIPC`，`0`】 | `IPPROTO_IP` |

### bind

綁定地址和端口。

```php
public function bind(string $address, int $port = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$address` | 綁定的地址【如 `0.0.0.0`、`127.0.0.1`】 | 必填 |
| `$port` | 綁定的端口【默認爲 `0`，系統會隨機綁定一個可用端口，可使用 [getsockname](/zh-hant/client/socket.html#getsockname) 方法得到系統分配的 `port`】 | `0` |

**返回值**：綁定成功返回 `true`；綁定失敗返回 `false`，請檢查 `errCode` 屬性獲取失敗原因。

### listen

開始監聽。

```php
public function listen(int $backlog = 512): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$backlog` | 監聽隊列的長度【系統底層使用 `epoll` 實現了異步 `IO`，不存在阻塞，因此 `backlog` 的重要程度並不高】 | `512` |

**返回值**：監聽成功返回 `true`；監聽失敗返回 `false`，請檢查 `errCode` 屬性獲取失敗原因。

> [!WARNING]
> 如果應用中存在阻塞或耗時邏輯，`accept` 接受連接不及時，新創建的連接就會堆積在 `backlog` 監聽隊列中，如超出 `backlog` 長度，服務就會拒絕新的連接進入

### accept

接受客戶端發起的連接

```php
public function accept(float $timeout = 0): Socket|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時【設置超時參數後，底層會設置定時器，在規定的時間沒有客戶端連接到來，`accept` 方法將返回 `false`】；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：超時或 `accept` 系統調用報錯時返回 `false`，可使用 `errCode` 屬性獲取錯誤碼，其中超時錯誤碼爲 `ETIMEDOUT`；成功返回客戶端連接的 `socket`，類型同樣爲 `Swoole\Coroutine\Socket` 對象。可對其執行 `send`、`recv`、`close` 等操作

### connect

連接到目標服務器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 目標服務器的地址【如 `127.0.0.1`、`192.168.1.100`、`/tmp/php-fpm.sock`、`www.baidu.com` 等，可以傳入 `IP` 地址、`Unix Socket` 路徑或域名。若爲域名，底層會自動進行異步的 `DNS` 解析，不會引起阻塞】 | 必填 |
| `$port` | 目標服務器端口【`Socket` 的 `domain` 爲 `AF_INET`、`AF_INET6` 時必須設置端口】 | `0` |
| `$timeout` | 設置超時時間【底層會設置定時器，在規定的時間內未能建立連接，`connect` 將返回 `false`】；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：超時或 `connect` 系統調用報錯時返回 `false`，可使用 `errCode` 屬性獲取錯誤碼，其中超時錯誤碼爲 `ETIMEDOUT`；成功返回 `true`。

### checkLiveness

通過系統調用檢查連接是否存活 (在異常斷開時無效, 僅能偵測到對端正常 close 下的連接斷開)

```php
public function checkLiveness(): bool
```

**返回值**：連接存活時返回 `true`, 否則返回 `false`。

### getBoundCid

如果該 `Socket` 已被某個協程綁定，返回綁定它的協程 ID。

```php
public function getBoundCid(int $event): int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event` | 讀寫事件；其它值：[`SWOOLE_EVENT_READ`](/zh-hant/event.html#常量) 表示讀事件，`SWOOLE_EVENT_WRITE` 表示寫事件 | 必填 |

**返回值**：成功返回當前綁定的協程 ID，沒有綁定任何協程返回 `0`。

### peek

預覽內核接收緩衝區中的數據，而不會從緩衝區中移除這些數據。

```php
public function peek(int $length = 65536): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 指定用於拷貝預覽到的數據的內存大小 (注意：這裏會分配內存, 過大的長度可能會導致內存耗盡)；值單位：字節 | `65536` |

**返回值**：預覽成功返回數據；預覽失敗返回 `false`，並設置 `errCode` 屬性

> [!TIP]
> 這意味着後續再調用 `recv()` 時，依然可以讀到這些被 `peek` 過的內容。

### recv

用於從對端讀取數據的核心方法。

```php
public function recv(int $length = 65536, float $timeout = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 指定用於接收數據的內存大小 (注意：這裏會分配內存, 過大的長度可能會導致內存耗盡)；值單位：字節 | `65536` |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回實際數據；接收失敗返回 `false`，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`

> [!TIP]
> 與 `peek()` 不同，`recv()` 會從內核接收緩衝區中移除已讀取的數據。

### send

向對端發送數據。

```php
public function send(string $data, float $timeout = 0): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要發送的數據內容【可以爲文本或二進制數據】 | 必填 |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：發送成功返回寫入的字節數，**請注意實際寫入的數據可能小於 `$data` 參數的長度**，應用層代碼需要對比返回值與 `strlen($data)` 是否相等來判斷是否發送完成；發送失敗返回 `false`，並設置 `errCode` 屬性。

**注意**

- `send` 方法會立即執行 `send` 系統調用發送數據，當 `send` 系統調用返回錯誤 `EAGAIN` 時，底層將自動監聽可寫事件，並掛起當前協程，等待可寫事件觸發時，重新執行 `send` 系統調用發送數據，並喚醒該協程。
- 如果 `send` 過快，`recv` 過慢最終會導致操作系統緩衝區寫滿，當前協程掛起在 send 方法，可以適當調大緩衝區，[/proc/sys/net/core/wmem_max和SO_SNDBUF](https://stackoverflow.com/questions/21856517/whats-the-practical-limit-on-the-size-of-single-packet-transmitted-over-domain)

### readVector

分段接收數據，它會一次性嘗試讀取數據來填充你指定的多個緩衝區，但讀取的總字節數取決於內核緩衝區中當前立即可用的數據量。**盡力而爲，讀多少是多少**。

```php
public function readVector(array $io_vector, float $timeout = 0): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$io_vector` | 期望接收到的分段數據大小；值單位：字節 | 必填 |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回的分段數據；接收失敗返回空數組，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`。

> [!TIP]
> `readVector` 方法會立即執行 `readv` 系統調用讀取數據，當 `readv` 系統調用返回錯誤 `EAGAIN` 時，底層將自動監聽可讀事件，並掛起當前協程，等待可讀事件觸發時，重新執行 `readv` 系統調用讀取數據，並喚醒該協程。

### readVectorAll

分段接收數據。它會持續讀取，直到將所有請求的緩衝區都完全填滿，或者發生連接關閉、超時等錯誤。**確保完整，不讀夠不罷休**。

```php
public function readVectorAll(array $io_vector, float $timeout = 0): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$io_vector` | 期望接收到的分段數據大小；值單位：字節 | 必填 |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回的分段數據；接收失敗返回空數組，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`。

> [!WARNING]
> `readVectorAll` 方法會立即執行多次 `readv` 系統調用讀取數據，當 `readv` 系統調用返回錯誤 `EAGAIN` 時，底層將自動監聽可讀事件，並掛起當前協程，等待可讀事件觸發時，重新執行 `readv` 系統調用讀取數據, 直到數據讀取完成或遇到錯誤, 喚醒對應協程。

### writeVector

分段發送數據。它會一次性嘗試將你提供的多個數據塊寫入 `Socket` 發送緩衝區，但實際寫入的總字節數取決於內核發送緩衝區當前剩餘的空間大小。**一次性寫入，能寫多少寫多少**。

```php
public function writeVector(array $io_vector, float $timeout = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$io_vector` | 期望發送的分段數據；值單位：字節 | 必填 |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：發送成功返回寫入的字節數，**請注意實際寫入的數據可能小於 `$io_vector` 參數的總長度**，應用層代碼需要對比返回值與 `$io_vector` 參數的總長度是否相等來判斷是否發送完成；發送失敗返回 `false`，並設置 `errCode` 屬性。

> [!TIP]
> `writeVector` 方法會立即執行 `writev` 系統調用發送數據，當 `writev` 系統調用返回錯誤 `EAGAIN` 時，底層將自動監聽可寫事件，並掛起當前協程，等待可寫事件觸發時，重新執行 `writev` 系統調用發送數據，並喚醒該協程。

### writeVectorAll

向對端發送數據。它會持續寫入，直到將所有指定的數據塊全部寫入發送緩衝區，或者發生連接關閉、超時等錯誤。**持續寫入，不寫完不罷休**。

```php
public function writeVectorAll(array $io_vector, float $timeout = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$io_vector` | 期望發送的分段數據；值單位：字節 | 必填 |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：`writeVectorAll` 會保證數據全部發送成功，但是 `writeVectorAll` 期間對端有可能將連接斷開，此時可能發送成功了部分數據，返回值會返回這個成功數據的長度，應用層代碼需要對比返回值與 `$io_vector` 參數的總長度是否相等來判斷是否發送完成，根據業務需求是否需要續傳；發送失敗返回 `false`，並設置 `errCode` 屬性。

### sendFile

發送文件給服務端。

```php
public function sendFile(string $file, int $offset = 0, int $length = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$file` | 文件路徑 | 必填 |
| `$offset` | 文件偏移量 | `0`，從頭開始發送 |
| `$length` | 發送的數據大小 | `0`，表示全部發送 |

**返回值**：發送成功返回 `true`，發送失敗返回 `false`，並設置 `errCode` 屬性。

### recvAll

接收數據。與 `recv` 不同的是, `recvAll` 會盡可能完整地接收響應長度的數據, 直到接收完成或遇到錯誤失敗。

```php
public function recvAll(int $length = 65536, float $timeout = 0): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 期望接收到的數據大小 (注意：這裏會分配內存, 過大的長度可能會導致內存耗盡)；值單位：字節 | `65536` |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回實際數據, 並且返回的字符串長度和參數長度一致；接收失敗返回 `false`，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`。

### sendAll

向對端發送數據。

```php
public function sendAll(string $data, float $timeout = 0): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要發送的數據內容【可以爲文本或二進制數據】 | 必填 |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：`sendAll` 會保證數據全部發送成功，但是 `sendAll` 期間對端有可能將連接斷開，此時可能發送成功了部分數據，返回值會返回這個成功數據的長度，應用層代碼需要對比返回值與 `strlen($data)` 是否相等來判斷是否發送完成，根據業務需求是否需要續傳；發送失敗返回 `false`，並設置 `errCode` 屬性。

### recvPacket

對於已通過 `setProtocol` 方法設置協議的 Socket 對象, 可調用此方法接收一個完整的協議數據包。

```php
public function recvPacket(float $timeout = 0): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回一個完整協議數據包；接收失敗返回 `false`，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`。

### recvLine

用於解決 [socket_read](https://www.php.net/manual/en/function.socket-read.php) 的兼容性問題。

```php
public function recvLine(int $length = 65536, float $timeout = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 指定用於接收數據的內存大小 (注意：這裏會分配內存, 過大的長度可能會導致內存耗盡)；值單位：字節 | `65536` |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回實際數據；接收失敗返回 `false`，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`

### recvWithBuffer

用於解決使用 `recv(1)` 逐字節接收時產生大量系統調用問題。

```php
public function recvWithBuffer(int $length = 65536, float $timeout = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 指定用於接收數據的內存大小 (注意：這裏會分配內存, 過大的長度可能會導致內存耗盡)；值單位：字節 | `65536` |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：接收成功返回實際數據；接收失敗返回 `false`，並設置 `errCode` 屬性；接收超時，錯誤碼爲 `ETIMEDOUT`

### recvfrom

是專門爲 `UDP` 協議設計的接收數據方法。

```php
public function recvfrom(mixed &$peername, float $timeout = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `&$peername` | 對端地址和端口，引用類型。【函數成功返回時會設置爲數組，包括 `address` 和 `port` 兩個元素】 | 必填 |
| `$timeout` | 設置超時時間【在規定的時間內未返回數據，`recvfrom` 方法會返回 `false`】；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | 參考客戶端超時規則 |

**返回值**：成功接收數據，返回數據內容，並設置 `$peername` 爲數組；失敗返回 `false`，並設置 `errCode` 屬性，不修改 `$peername` 的內容

### sendto

專爲 `UDP` 協議設計的方法，用於向指定的目標地址和端口發送數據。

```php
public function sendto(string $address, int $port, string $data): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$address` | 目標主機的 `IP` 地址或 `unixSocket` 路徑【`sendto` 不支持域名，使用 `AF_INET` 或 `AF_INET6` 時，必須傳入合法的 `IP` 地址，否則發送會返回失敗】 | 必填 |
| `$port` | 目標主機的端口【發送廣播時可以爲 `0`】 | 必填 |
| `$data` | 發送的數據【可以爲文本或二進制內容，請注意 `SOCK_DGRAM` 發送包的最大長度爲 `64K`】 | 必填 |

**返回值**：發送成功返回發送的字節數；發送失敗返回 `false`，並設置 `errCode` 屬性。

> [!TIP]
> 此方法沒有協程調度，底層會立即調用 `sendto` 向目標主機發送數據。此方法不會監聽可寫，`sendto` 可能會因爲緩存區已滿而返回
> `false`，需要自行處理，或者使用 `send` 方法。

### setOption

直接對底層的 `socket` 句柄進行配置，本質上，是對操作系統底層的 `setsockopt` 函數的封裝。

```php
public function setOption(int $level, int $opt_name, mixed $opt_value): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$level` | 指定選項所在的協議級別 | 必填 |
| `$opt_name` | 具體要修改哪個參數，比如 `SO_REUSEADDR` | 必填 |
| `$opt_value` | 選項的值 【可以是 `int`、`bool`、`string`、`array`。根據 `level` 和 `optname` 決定。】 | 必填 |

**返回值**：操作成功返回 `true`，發送失敗返回 `false`，並設置 `errCode` 屬性。

### getOption

讀取底層 `socket` 句柄上各種配置參數的當前值。

```php
public function getOption(int $level, int $opt_name): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$level` | 指定選項所在的協議級別 | 必填 |
| `$opt_name` | 可用的套接字選項與 [socket_get_option()](https://www.php.net/manual/zh/function.socket-get-option.php) 函數的套接字選項相同 | 必填 |

**返回值**：返回對應屬性的值。

### setProtocol

使 `socket` 獲得協議處理能力。

```php
public function setProtocol(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 協議配置信息 | 必填 |

**返回值**：操作成功返回 `true`，發送失敗返回 `false`，並設置 `errCode` 屬性。

| 參數                                                                     | 說明                                                                                      |
|------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| open_ssl                                                               | 開啓ssl連接                                                                                 |
| [ssl_cert_file](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)    | 設置SSL隧道加密                                                                               |
| [ssl_key_file](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)     | 設置SSL隧道加密                                                                               |
| [open_eof_check](/zh-hant/server/setting.html#open-eof-check)               | 此選項用於檢測客戶端發來的數據：僅當數據包`結尾`匹配指定分隔符`（如 \r\n）`時，底層纔會停止接收數據；否則，數據將被持續拼接，直到超出緩存區限制或接收超時纔會中止。  |
| [open_eof_split](/zh-hant/server/setting.html#open-eof-split)               | 底層逐字節掃描數據流，每次遇到指定分隔符`（如 \r\n）`就自動切分並交付一個完整數據包給[worker進程](/zh-hant/server/process_thread.html#worker)。 |
| [open_http2_protocol](/zh-hant/server/setting.html#open-http2-protocol)     | 啓用`http2`協議報文解析。                                                                        |
| [open_mqtt_protocol](/zh-hant/server/setting.html#open-mqtt-protocol)       | 啓用`mqtt`協議報文解析。                                                                         |
| open_fastcgi_protocol                                                  | 是否開啓 `fastcgi` 協議解析                                                                     |
| [open_length_check](/zh-hant/server/setting.html#open-length-check)         | 啓用數據包長度檢測協議解析功能。                                                                        |
| [package_eof](/zh-hant/server/setting.html#package-eof)                     | 設置數據包指定分隔符                                                                              |
| [package_length_type](/zh-hant/server/setting.html#package-length-type)     | 指定長度字段的類型（如 'N' 表示 4 字節無符號長整型）。與 `PHP` 的 `pack` 函數一樣。告訴服務器：長度字段佔幾個字節，以及這些字節的排列順序（字節序）。  |
| [package_length_offset](/zh-hant/server/setting.html#package-length-offset) | 定位長度字段位置的核心參數。它告訴服務器：“長度字段這個值，存放在整個數據包的第幾個字節”                                           |
| [package_body_offset](/zh-hant/server/setting.html#package-body-offset-package-body-start)     | 爲包體數據起始位置的偏移量。告訴服務器：真正的業務數據（包體）從數據包的第幾個字節開始。                                            |
| [package_length_func](/zh-hant/server/setting.html#package-length-func)     | 自定義一個 `PHP` 函數來告訴 `Swoole`一個完整數據包究竟有多長。                                                 |
| [package_max_length](/zh-hant/server/setting.html#package-max-length)       | 設置能接收的最大數據包尺寸，單位爲字節。默認值：`2M` 即 `2 * 1024 * 1024`，最小值爲`64K`。                             |

### sslHandshake

其核心作用是爲一個已經建立好的普通 `TCP` 連接，在運行時動態地啓用 `SSL/TLS` 加密。

```php
public function sslHandshake(): bool
```

**返回值**：操作成功返回 `true`，發送失敗返回 `false`，並設置 `errCode` 屬性。

### shutdown

優雅地關閉 `socket` 的讀寫能力。它允許你獨立地關閉發送通道或接收通道，而不是像 `close()` 那樣直接徹底銷燬整個連接

```php
public function shutdown(int $how = SHUT_RDWR): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$how` | 如何關閉連接；其它值：`SHUT_WR` 只關閉寫端，`SHUT_RD` 只關閉讀端。 | `SHUT_RDWR` 同時關閉讀寫 |

**返回值**：操作成功返回 `true`，發送失敗返回 `false`，並設置 `errCode` 屬性。

### close

關閉 `Socket`。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，發送失敗返回 `false`，並設置 `errCode` 屬性。

### cancel

取消監聽指定事件的協程。以讀事件爲例：若此 `Socket` 的讀操作已導致協程 A 掛起，調用本方法將立即喚醒協程 A，並取消其未完成的讀操作。

```php
public function cancel(int $event = SWOOLE_EVENT_READ): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event` | 讀寫事件；其它值：`SWOOLE_EVENT_WRITE` 寫事件 | `SWOOLE_EVENT_READ` 讀事件 |

**返回值**：操作成功返回 `true`，發送失敗返回 `false`。

### getsockname

方法用於獲取本地的 IP 地址和端口。

```php
public function getsockname(): false|array
```

**返回值**：調用成功返回，包含 `address` 和 `port` 的數組；調用失敗返回 `false`，並設置 `errCode` 屬性

### getpeername

用於獲取連接的對端（即遠程端）的 IP 地址和端口。

```php
public function getpeername(): false|array
```

**返回值**：調用成功返回，包含 `address` 和 `port` 的數組；調用失敗返回 `false`，並設置 `errCode` 屬性

### isClosed

`Socket` 是否已關閉。

```php
public function isClosed(): bool
```

**返回值**：已經關閉返回 `true`，否則返回 `false`。

### import

將 `resource` 資源轉化成 `Swoole\Coroutine\Socket` 對象。

```php
public static function import($stream): Swoole\Coroutine\Socket | false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$stream` | PHP 的 resource 資源 | 必填 |

**返回值**：操作成功返回 `Swoole\Coroutine\Socket` 對象，發送失敗返回 `false`。

### export

將 `Swoole\Coroutine\Socket` 導出爲 `PHP` 的 `stream` 資源。

```php
public function export(): resource|false
```

**返回值**：成功返回 `stream` 資源，失敗返回 `false`。`Socket` 已關閉、`dup` 失敗或創建 `stream` 失敗時返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3.0` 可用。底層通過 `dup()` 複製文件描述符後創建獨立的 `stream` 資源，`Socket` 對象本身不受影響，仍可繼續協程 `I/O`。兩個描述符相互獨立，需要各自關閉。

**示例**

```php
<?php
use Swoole\Coroutine\Socket;
use function Swoole\Coroutine\run;

run(function () {
    $socket = new Socket(AF_INET, SOCK_STREAM, 0);
    $socket->connect('127.0.0.1', 9501);
    $socket->send("hello");

    $stream = $socket->export();
    var_dump(fread($stream, 5));
    fclose($stream);
    $socket->close();
});
```
