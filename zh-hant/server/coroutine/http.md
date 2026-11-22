# HTTP 協程服務器

- `Swoole\Coroutine\Http\Server` 是 `Swoole` 基於協程實現的輕量級高性能 `HTTP` 服務器。它最大的特點是：**允許開發者以同步順序的代碼風格，獲得非阻塞 I/O 的高併發性能**。底層通過協程的自動掛起與恢復，在等待 I/O 時讓出 CPU，從而在**單進程內即可支撐海量連接**。

## 方法

### __construct

創建一個 `HTTP` 協程服務器。

```php
public function __construct(string $host, int $port = 0, bool $ssl = false, bool $reuse_port = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 監聽的 IP 地址 | 必填 |
| `$port` | 監聽端口，取值 `0~65535` | `0`（隨機監聽一個空閒端口） |
| `$ssl` | 是否啓用 `SSL/TLS` 隧道加密，可填 `true` | `false` |
| `$reuse_port` | 是否啓用端口複用特性，開啓後多個服務可以共用一個端口，可填 `true` | `false` |

### set

設置 `HTTP` 協程服務器運行配置。

```php
public function set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | `HTTP` 協程服務器運行配置 | 必填 |

**返回值**：執行成功返回 `true`，操作失敗返回 `false`。

### handle

註冊回調函數以處理參數 `$pattern` 所指示路徑下的 HTTP 請求。

```php
public function handle(string $pattern, callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$pattern` | 設置 `URL` 路徑【如 `/index.html`，注意這裏不能傳入 `http://domain`】 | 必填 |
| `$callback` | 回調函數 | 必填 |

**`$callback` 函數簽名**

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$request` | `HTTP` 請求對象，保存了 `HTTP` 客戶端請求的相關信息，包括 `GET`、`POST`、`COOKIE`、`Header` 等 | 必填 |
| `$response` | `HTTP` 響應對象，通過調用此對象的函數，實現 `HTTP` 響應發送 | 必填 |

> [!WARNING]
> - 必須要在 [start](/zh-hant/server/coroutine/http.html#start) 執行前，設置好回調函數。
> - 服務器建立連接後，會自動創建協程執行 `$callback` 處理 `HTTP` 請求。
> - 如果是長鏈接 `KeepAlive`，子協程會循環繼續接受新的請求，而不退出。否則會停止接受請求，並且退出和關閉連接。
> - `$pattern` 設置相同路徑時，新的設置會覆蓋舊的設置。未設置 `/` 根路徑處理函數並且請求的路徑沒有找到任何匹配的 `$pattern`，Swoole 將返回 `404` 錯誤。
> - `$pattern` 使用字符串匹配的方法，不支持通配符和正則，不區分大小寫，匹配算法是前綴匹配，例如：url 是 `/test111` 會匹配到 `/test` 這個規則，匹配到即跳出匹配忽略後面的配置；推薦設置 `/` 根路徑處理函數。

### start

啓動 `HTTP` 協程服務器。

```php
public function start(): bool
```

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

### shutdown

關閉 `HTTP` 協程服務器。

```php
public function shutdown(): void
```

## 示例

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Process;
use Swoole\Process\Pool;
use function Swoole\Coroutine\run;

$pool = new Pool(5);
$pool->set(['enable_coroutine' => true]); // 必須開啓協程
$pool->on('workerStart', function (Pool $pool, $workerId) {
    // $reuse_port 必須設置成true，否則無法實現多進程監聽同一個端口
    $server = new Server('127.0.0.1', 9502, false, true);
    $server->handle('/', function (Request $request, Response $response) {
        $response->end("<h1>Index</h1>");
    });
    $server->handle('/test', function (Request $request, Response $response) {
        $response->end("<h1>Test</h1>");
    });
    $server->handle('/stop', function (Request $request, Response $response) use ($server) {
        $response->end("<h1>Stop</h1>");
        $server->shutdown(); // 協程服務器退出後，子進程也會退出，會被主進程重新拉起
    });
    $server->start();
});

$pool->start();
```

## 注意

- `Swoole\Coroutine\Http\Server` 默認是**單進程**運行，無法充分利用多核 CPU。如需在多核環境下部署，建議配合 [`Swoole\Process\Pool`](/zh-hant/process/pool.html) 實現多進程管理。
- `Swoole\Coroutine\Http\Server` 自帶對 `HTTP2` 的支持，不需要像 [HTTP2 服務器](/zh-hant/server/http.html) 那樣手動指定 [open_http2_protocol](/zh-hant/server/setting.html#open-http2-protocol)。