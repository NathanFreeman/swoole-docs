# 通用連接池

Swoole 從 `v4.4.13` 版本開始提供內置協程連接池。協程是併發處理請求的，[多個協程共用一個客戶端連接會導致數據錯亂](/zh-hant/coroutine/others.html#禁止共享連接)，而每個請求都新建連接開銷又太大。連接池複用一批連接，協程用時借出、用完歸還。

內置連接池分兩層：

- `Swoole\ConnectionPool`：通用連接池，基於 [通道](/zh-hant/coroutine/channel.html) 自動調度，支持傳入任意構造器，即本頁介紹的內容。
- `Swoole\Database`：在通用連接池之上封裝的連接池，帶自動斷線重連，見 [數據庫連接池](/zh-hant/pool/database.html)（PDO、Mysqli）和 [Redis 連接池](/zh-hant/pool/redis.html)。

## ConnectionPool

### __construct

創建一個連接池。

```php
public function __construct(callable $constructor, int $size = self::DEFAULT_SIZE, ?string $proxy = null)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$constructor` | 構造器，每次被調用時須返回一個**新的**連接對象 | 必填 |
| `$size` | 連接池容量，即最多同時存在多少個連接 | `64`（`ConnectionPool::DEFAULT_SIZE`） |
| `$proxy` | 代理類名，傳入後連接對象會被包裝成該類的實例 | `null`，不包裝 |

> [!NOTE]
> 連接池不會預先創建連接，第一次 [`get`](#get) 時才按需創建，直到達到 `$size`。想提前建滿可以調用 [`fill`](#fill)。

### get

從連接池中獲取一個連接。

```php
public function get(float $timeout = -1)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 等待連接的超時時間，單位爲秒，支持浮點型（`1.5` 表示 `1s` + `500ms`）；`0` 或負數表示不限時 | `-1`，永不超時 |

**返回值**：返回一個連接對象；超時、等待期間連接池被關閉、或當前協程被 [cancel](/zh-hant/coroutine/coroutine_api.html#cancel) 取消時返回 `false`。連接池已關閉時調用會拋出 `RuntimeException`。

> [!NOTE]
> 池中沒有空閒連接且數量未達 `$size` 時，`get` 會先創建一個新連接；已達 `$size` 則掛起當前協程，等待其他協程 [`put`](#put) 歸還。

### put

把連接歸還給連接池。

```php
public function put(mixed $connection): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$connection` | 要歸還的連接對象；傳 `null` 表示當前借出的連接已損壞 | 必填 |

> [!IMPORTANT]
> 借出的連接必須歸還。`get` 之後沒有 `put`，這個連接會一直被計數佔用；累計達到 `$size` 次後，`get` 將再也拿不到連接。用 [`withConnection`](#withconnection) 可以自動歸還。

> [!NOTE]
> 傳 `null` 時底層會把連接計數減一併立即新建一個連接補位，用於丟棄已損壞、不可重用的連接。

### withConnection

借出一個連接交給回調使用，回調結束（正常返回或拋出異常）後自動歸還。

```php
public function withConnection(callable $callback, float $timeout = -1): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$callback` | 回調，接收借出的連接對象作爲唯一參數 | 必填 |
| `$timeout` | 等待連接的超時時間，單位爲秒；`0` 或負數表示不限時 | `-1`，永不超時 |

**返回值**：返回 `$callback` 的返回值。拿不到連接時拋出 `RuntimeException`。

> [!WARNING]
> 回調內不得自行調用 `put`，也不得在回調返回後繼續使用該連接、或綁定在它上面的對象（如 Statement、生成器、另一個協程）——連接此時已屬於其他協程。

> [!TIP]
> 回調內再調用同一個池的 `withConnection` 需要第二個空閒連接，否則會一直等待，請給內層調用設置 `$timeout`。

### fill

提前創建連接，把連接池填充到 `$size` 個。

```php
public function fill(): void
```

連接池已關閉時調用無效果。

### close

關閉連接池。

```php
public function close(): void
```

關閉時會喚醒所有正在 [`get`](#get) 中等待的協程，它們會得到 `false`。關閉後再調用 `get` 會拋出 `RuntimeException`，`put` 和 `fill` 則直接返回。

## 注意事項

> [!IMPORTANT]
> 若連接對象出現異常不可重用，需要調用 `$pool->put(null)` 歸還一個空連接，底層會丟棄它並新建補位，以保證連接池的數量平衡。

> [!NOTE]
> 連接池對象本身可以跨協程共享，這正是它的用途；但從中借出的連接同一時刻只能被一個協程使用，用完必須歸還。