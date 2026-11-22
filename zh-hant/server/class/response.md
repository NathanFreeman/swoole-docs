# Swoole\Http\Response

- `Swoole\Http\Response` 是 Swoole 中用於 **HTTP 服務端** 的對象，主要負責向客戶端發送 HTTP 響應。
- 你可以把它理解爲：當 `Swoole` 服務器收到請求後，會自動創建一個 `Response` 對象，你用這個對象的方法來控制返回給瀏覽器的內容（狀態碼、Header、Body 等）。

## 屬性

### fd

當前連接的文件描述符。

```php
public int $fd
```

### socket

使用 [create 方法](/zh-hant/server/class/response.html#create) 創建新的 `Response` 對象時候，如果第一個參數傳入的是 [`Swoole\Coroutine\Socket`](/zh-hant/client/socket.html) 對象時，會用這個屬性保存這個對象。

```php
public Swoole\Coroutine\Socket $socket
```

### header

`HTTP` 響應頭數組。

```php
public array $header
```

> [!TIP]
> 設置響應頭有兩種等效方式：一是調用 [header 方法](/zh-hant/server/class/response.html#header-1)，二是直接給 `header` 屬性賦值。

### cookie

`HTTP` 響應 `cookie` 數組。

```php
public array $cookie
```

> [!TIP]
> 設置 `cookie` 有兩種等效方式：一是調用 [cookie 方法](/zh-hant/server/class/response.html#cookie-1) 或者 [rawcookie](/zh-hant/server/class/response.html#rawcookie)，二是直接給 `cookie` 屬性賦值。

### trailer

保存 `HTTP` 響應的主體 `（Body）` 之後追加額外的頭信息 `（Trailer Header）`。

```php
public array $trailer
```

> [!TIP]
> 設置 `$trailer` 有兩種等效方式：一是調用 [trailer 方法](/zh-hant/server/class/response.html#trailer-1)，二是直接給 `trailer` 屬性賦值。

## 方法

### write

將 `HTTP` 響應內容分塊發送給客戶端，支持流式傳輸，適用於大文件下發或實時數據推送等場景。

```php
public function write(string $content): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$content` | 要發送的數據內容，最大長度不得超過 `2M`，受 `buffer_output_size` 配置項控制 | 必填 |

**返回值**：調用成功，返回 `true`，調用失敗或連接上下文不存在，返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->write('Hello ');
    $response->write('World!');
    $response->end(); // 結束傳輸
});
$server->start();
```

> [!WARNING]
> - 使用 `write` 分段發送數據後，[end](/zh-hant/server/class/response.html#end) 方法將不接受任何參數，調用 `end` 只是會發送一個長度爲 `0` 的 `Chunk` 表示數據傳輸完畢。
> - 如果通過 [header 方法](/zh-hant/server/class/response.html#header-1) 設置了 `Content-Length`，然後又調用這個方法，`Swoole` 會忽略 `Content-Length` 的設置，並拋出一個警告。
> - `Http2` 不能使用這個函數，否則會拋出一個警告。
> - 如果客戶端支持響應壓縮，`write` 會強制關閉壓縮。

### end

發送 `Http` 響應體，並結束請求處理。

```php
public function end(?string $content = null): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$content` | 要發送的數據內容，最大長度不得超過 `2M`，受 `buffer_output_size` 配置項控制 | `null` |

**返回值**：調用成功，返回 `true`，調用失敗或連接上下文不存在，返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->end('Hello World');
});
$server->start();
```

### sendfile

發送文件到客戶端。

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 要發送的文件名稱，文件不存在或沒有訪問權限時 `sendfile` 會失敗 | 必填 |
| `$offset` | 上傳文件的偏移量，可以指定從文件的中間部分開始傳輸數據，此特性可用於支持斷點續傳 | `0` |
| `$length` | 發送數據的尺寸 | 文件的尺寸 |

**返回值**：調用成功，返回 `true`，調用失敗或連接上下文不存在，返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->sendfile(__FILE__);
});
$server->start();
```

> [!WARNING]
> - 底層無法推斷要發送文件的 MIME 格式，因此需要應用代碼指定 `Content-Type`。
> - 調用 `sendfile` 前不得使用 `write` 方法發送 `Http-Chunk`。
> - 調用 `sendfile` 後底層會自動執行 `end`。
> - `sendfile` 不支持 `gzip` 壓縮。

### redirect

發送 `Http` 重定向跳轉。調用此方法會自動 `end` 發送並結束響應。

```php
public function redirect(string $location, int $http_code = 302): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$location` | 跳轉的新地址，作爲 `Location` 頭進行發送 | 必填 |
| `$http_code` | 狀態碼，默認爲 `302` 臨時跳轉，傳入 `301` 表示永久跳轉 | `302` |

**返回值**：調用成功，返回 `true`，調用失敗或連接上下文不存在，返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->redirect("https://www.baidu.com");
});
$server->start();
```

### cookie

`HTTP` 響應攜帶的 `COOKIE` 信息，格式爲鍵值對數組。

```php
public function cookie(\Swoole\Http\Cookie|string $name_or_object, string $value = '', int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httponly = false, string $samesite = '', string $priority = '', bool $partitioned = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name_or_object` | `Cookie` 的 `Key` | 必填 |
| `$value` | `Cookie` 的 `value` | `''` |
| `$expires` | `Cookie` 的過期時間 | `0`，不過期 |
| `$path` | 規定 Cookie 的服務器路徑 | `/` |
| `$domain` | 規定 Cookie 的域名 | `''` |
| `$secure` | 規定是否通過安全的 HTTPS 連接來傳輸 Cookie | `false` |
| `$httponly` | 是否允許瀏覽器的 JavaScript 訪問帶有 HttpOnly 屬性的 Cookie，`true` 表示不允許，`false` 表示允許 | `false` |
| `$samesite` | 限制第三方 Cookie，從而減少安全風險，可選值爲 `Strict`，`Lax`，`None` | `''` |
| `$priority` | Cookie 優先級，當 Cookie 數量超過規定，低優先級的會先被刪除，可選值爲 `Low`，`Medium`，`High` | `''` |
| `$partitioned` | 讓第三方 `Cookie` 不再跨所有網站通用，而是綁定到它最初被設置時所在的那個特定網站（即“頂級站點”），從而在保留必要功能的同時，有效阻止跨站跟蹤；其它值：`true` | `false` |

**返回值**：設置失敗，返回 `false`，設置成功，返回 `true`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Http\Cookie;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $cookie = new Cookie();
    $cookie->withName('key1')
        ->withValue('val1')
        ->withExpires(time() + 84600)
        ->withPath('/')
        ->withDomain('id.test.com')
        ->withSecure(true)
        ->withHttpOnly(true)
        ->withSameSite('None')
        ->withPriority('High')
        ->withPartitioned(true);
            
    $response->cookie($cookie);
    $response->cookie('key2', 'value2', time() + 84600, '/', '', true, true, 'None', 'High', true);
    $response->end('Hello World');
});
$server->start();
```

> [!IMPORTANT]
> - `cookie` 設置必須在 [end](/zh-hant/server/class/response.html#end) 方法之前。
> - `Swoole` 會自動對 `$value` 進行 `urlencode` 編碼，可使用 `rawcookie()` 方法關閉對 `$value` 的編碼處理。
> - `Swoole` 允許設置多個相同 `$key` 的 `COOKIE`。
> - 推薦使用 [Swoole\Http\Cookie](/zh-hant/server/class/cookie.html) 作爲方法的第一個入參，這樣設置起來簡單，不用再設置方法的剩餘參數。

### rawcookie

設置 `HTTP` 響應的 `cookie` 信息，但是不對 `value` 進行編碼處理。

```php
public function rawcookie(\Swoole\Http\Cookie|string $name_or_object, string $value = '', int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httponly = false, string $samesite = '', string $priority = '', bool $partitioned = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | `Cookie` 的 `Key` | 必填 |
| `$value` | `Cookie` 的 `value` | `''` |
| `$expires` | `Cookie` 的過期時間 | `0`，不過期 |
| `$path` | 規定 Cookie 的服務器路徑 | `/` |
| `$domain` | 規定 Cookie 的域名 | `''` |
| `$secure` | 規定是否通過安全的 HTTPS 連接來傳輸 Cookie | `false` |
| `$httponly` | 是否允許瀏覽器的 JavaScript 訪問帶有 HttpOnly 屬性的 Cookie，`true` 表示不允許，`false` 表示允許 | `false` |
| `$samesite` | 限制第三方 Cookie，從而減少安全風險，可選值爲 `Strict`，`Lax`，`None` | `''` |
| `$priority` | Cookie 優先級，當 Cookie 數量超過規定，低優先級的會先被刪除，可選值爲 `Low`，`Medium`，`High` | `''` |
| `$partitioned` | 讓第三方 `Cookie` 不再跨所有網站通用，而是綁定到它最初被設置時所在的那個特定網站（即“頂級站點”），從而在保留必要功能的同時，有效阻止跨站跟蹤；其它值：`true` | `false` |

**返回值**：設置失敗，返回 `false`，設置成功，返回 `true`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Http\Cookie;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $cookie = new Cookie();
    $cookie->withName('key1')
        ->withValue('val1')
        ->withExpires(time() + 84600)
        ->withPath('/')
        ->withDomain('id.test.com')
        ->withSecure(true)
        ->withHttpOnly(true)
        ->withSameSite('None')
        ->withPriority('High')
        ->withPartitioned(true);
            
    $response->rawcookie($cookie);
    $response->rawcookie('key2', 'value2', time() + 84600, '/', '', true, true, 'None', 'High', true);
    $response->end('Hello World');
});
$server->start();
```

> [!IMPORTANT]
> - `rawcookie` 設置必須在 [end](/zh-hant/server/class/response.html#end) 方法之前。
> - `Swoole` 允許設置多個相同 `$key` 的 `COOKIE`。
> - 推薦使用 [Swoole\Http\Cookie](/zh-hant/server/class/cookie.html) 作爲方法的第一個入參，這樣設置起來簡單，不用再設置方法的剩餘參數。

### header

`HTTP` 響應的頭部信息。類型爲數組，所有 `key` 均爲小寫。

```php
public function header(string $key, string|array $value, bool $format = true): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | `HTTP` 頭的 `Key` | 必填 |
| `$value` | `HTTP` 頭的 `value` | 必填 |
| `$format` | 是否需要對 `Key` 進行 `HTTP` 約定格式化，默認 `true` 會自動格式化 | `true` |

**返回值**：設置失敗，返回 `false`，設置成功，返回 `true`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->header('Content-Type', 'text/html');
    $response->end("Hello World");
});
$server->start();
```

> [!WARNING]
> - `header` 設置必須在 `end` 方法之前。
> - `$key` 必須完全符合 `HTTP` 的約定，每個單詞首字母大寫，不得包含中文，下劃線或者其他特殊字符，`$value` 不能爲空。
> - 支持重複設置相同 `$key` 的 `HTTP` 頭，並且 `$value` 支持多種類型，如 `array`、`object`、`int`、`float`，底層會進行 `toString` 轉換，並且會移除末尾的空格以及換行。
> - 如果客戶端設置了 `Accept-Encoding`，那麼服務端不能設置 `Content-Length` 響應，`Swoole` 檢測到這種情況會忽略 `Content-Length` 的值，並且拋出一個警告。
> - 設置了 `Content-Length` 響應不能調用 [write](/zh-hant/server/class/response.html#write)，`Swoole` 檢測到這種情況會忽略 `Content-Length` 的值，並且拋出一個警告。

### isWritable

判斷 `Swoole\Http\Response` 對象是否已結束（`end`）或已分離（`detach`）。

```php
public function isWritable(): bool
```

**返回值**：`Swoole\Http\Response` 對象未結束或者未分離返回 `true`，否則返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) {
    var_dump($response->isWritable()); // true
    $response->end('hello');
    var_dump($response->isWritable()); // false
    $response->setStatusCode(403); // http response is unavailable (maybe it has been ended or detached)
});

$http->start();
```

### status

設置 `HTTP` 響應狀態碼。別名是 `setStatusCode`。

```php
public function status(int $http_code, string $reason = ''): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$http_code` | 設置 `HttpCode` | 必填 |
| `$reason` | 狀態碼原因 | `''` |

**返回值**：設置失敗，返回 `false`，設置成功，返回 `true`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) {
    $response->setStatusCode(200);
    $response->end('hello');
});

$http->start();
```

> [!IMPORTANT]
> - `status` 設置必須在 [end](/zh-hant/server/class/response.html#end) 方法之前。
> - 如果只傳入了第一個參數 `$http_code`，必須爲合法的 `HttpCode`，如 `200`、`502`、`301`、`404` 等，否則會設置爲 `200` 狀態碼。
> - 如果設置了第二個參數 `$reason`，`$http_code` 可以爲任意的數值，包括未定義的 `HttpCode`，如 `499`。

### detach

分離響應對象。使用此方法後，`Swoole\Http\Response` 對象銷燬時不會自動執行 [end](/zh-hant/server/class/response.html#end) 方法，與 [create](/zh-hant/server/class/response.html#create) 配合使用。

```php
public function detach(): bool
```

**返回值**：調用成功，返回 `true`，調用失敗或連接上下文不存在，返回 `false`。

**示例**

- 跨進程響應。

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();
    $http->task((string) $response->fd);
});

$http->on('finish', function () {
      echo "task finish";
});

$http->on('task', function (Server $serv, int $task_id, int $worker_id, int $data) {
    var_dump($data);
    $resp = Response::create($data);
    $resp->end("in task");
    echo "async task\n";
});

$http->start();
```

- 某些特殊的場景下，需要對客戶端發送特殊的響應內容。

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();
    $http->send($response->fd, "HTTP/1.1 200 OK\r\nServer: server\r\n\r\nHello World\n");
});

$http->start();
```

### create

構造新的 `Swoole\Http\Response` 對象。

```php
public static function create(object|array|int $server = -1, int $fd = -1): Response|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 或者 `Swoole\Coroutine\Socket` 對象，數組或者文件描述符 | `-1` |
| `$fd` | 文件描述符。如果參數 `$server` 是 `Swoole\Server` 對象，`$fd` 是必填的 | `-1` |

**返回值**：調用成功返回一個新的 `Swoole\Http\Response` 對象，調用失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\Socket;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();  // 必須執行detach
    $newResponse = Response::create($response->fd);  // 可以傳入文件描述符來創建新的Response對象
    $newResponse = Response::create($http);  // 可以傳入`Swoole\Server`或者它的子類來創建新的Response對象
    $newResponse = Response::create([$http, $response]);  // 可以傳入數組，第一個是`Swoole\Server`或者它的子類，第二個是Response對象
    
    $socket = new Socket(AF_INET, SOCK_STREAM, IPPROTO_IP);
    $socket->connect('127.0.0.1', 9501);
    $newResponse = Response::create($socket); // 可以傳入 Swoole\Coroutine\Socket 對象來創建新的 Response 對象
    $newResponse->end('Hello World');
});

$http->start();
```

### upgrade

將 `Http` 協程服務器升級爲 `WebSocket` 協程服務器。

```php
public function upgrade(): bool
```

**返回值**：調用成功返回 `true`，調用失敗返回 `false`。

> [!IMPORTANT]
> 只能在 [HTTP/WebSocket 協程服務器](/zh-hant/server/coroutine/http.html) 使用。

### push

`WebSocket` 協程服務器發送數據給客戶端。

```php
public function push(\Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要發送的數據內容 | 必填 |
| `$opcode` | 指定發送數據內容的格式，默認爲文本；發送二進制內容 `$opcode` 參數需要設置爲 `SWOOLE_WEBSOCKET_OPCODE_BINARY`；其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY`，`SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 標誌位；其它值：`SWOOLE_WEBSOCKET_FLAG_RSV1`，`SWOOLE_WEBSOCKET_FLAG_RSV2`，`SWOOLE_WEBSOCKET_FLAG_RSV3`，`SWOOLE_WEBSOCKET_FLAG_MASK`，`SWOOLE_WEBSOCKET_FLAG_COMPRESS` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**支持的 opcode**

| 常量名 | 中文含義 | 說明 |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_OPCODE_TEXT` | 文本幀 | 承載 UTF-8 文本數據 |
| `SWOOLE_WEBSOCKET_OPCODE_BINARY` | 二進制幀 | 承載二進制數據 |
| `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | 延續幀 | 用於分片消息的後續幀 |
| `SWOOLE_WEBSOCKET_OPCODE_CLOSE` | 關閉幀 | 表示連接關閉 |
| `SWOOLE_WEBSOCKET_OPCODE_PING` | Ping 幀 | 心跳檢測請求 |
| `SWOOLE_WEBSOCKET_OPCODE_PONG` | Pong 幀 | 心跳檢測響應 |

**支持的 flags**

| 常量名 | 中文含義 | 說明 |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_FLAG_FIN` | 完成標誌 | 表示當前幀是否爲消息的最後一幀 |
| `SWOOLE_WEBSOCKET_FLAG_RSV1` | RSV1 標誌 | 擴展協議預留位 1，通常用於壓縮（如 Per-Message Deflate） |
| `SWOOLE_WEBSOCKET_FLAG_RSV2` | RSV2 標誌 | 擴展協議預留位 2 |
| `SWOOLE_WEBSOCKET_FLAG_RSV3` | RSV3 標誌 | 擴展協議預留位 3 |
| `SWOOLE_WEBSOCKET_FLAG_MASK` | 掩碼標誌 | 表示數據負載是否使用了掩碼（客戶端到服務端的數據必須設置） |
| `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | 壓縮標誌 | 表示當前幀的數據是否被壓縮（通常與 RSV1 配合使用） |

**示例**

- 發送單個數據幀，不壓縮

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data = new Frame();
        $data->data = 'Hello World';
        $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $data->finish = true;
        $response->push($data);
    });
    $server->start();
});
```

- 發送壓縮後的數據幀

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->set([
        'websocket_compression' => true  // 開啓幀壓縮
    ]);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data = new Frame();
        $data->data = 'Hello World';
        $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $data->finish = true;
        $response->push($data);
    });
    $server->start();
});
```

- 發送連續幀，不壓縮

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        // 發送連續幀，
        $data = new Frame();
        
        for ($i = 0; $i < 100; $i++) {
          $data->data = base64_encode(random_bytes(200));
          if ($i == 0) {
            // 第一個幀需要設置成SWOOLE_WEBSOCKET_OPCODE_TEXT或者SWOOLE_WEBSOCKET_OPCODE_BINARY
            $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
          } else {
            // 後續的幀需要設置成SWOOLE_WEBSOCKET_OPCODE_CONTINUATION
            $data->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
          }
          
          $data->finish = $i == 99;  // 除了最後一個幀設置爲true之外，其他必須爲false
          $response->push($data);
        }
    });
    $server->start();
});
```

- 先壓縮數據，再發送連續幀

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->set([
        'websocket_compression' => true  // 開啓幀壓縮
    ]);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data1 = bin2hex(random_bytes(10 * 1024));
        $data2 = bin2hex(random_bytes(20 * 2048));
        $data3 = bin2hex(random_bytes(40 * 4096));
    
        $context = deflate_init(ZLIB_ENCODING_RAW);
        // 由於底層並不知道數據幀壓縮後需要拆分成多少塊，所以這一步需要使用者自己實現
        // 第一個幀需要手動設置finish爲false，flags爲SWOOLE_WEBSOCKET_FLAG_COMPRESS和SWOOLE_WEBSOCKET_FLAG_RSV1，並且不能設置SWOOLE_WEBSOCKET_FLAG_FIN，表明這是一個壓縮數據幀
        $frame = new Frame();
        $frame->data = deflate_add($context, $data1, ZLIB_SYNC_FLUSH);
        $frame->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $frame->flags = SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1;
        $frame->finish = false;
        $response->push($frame);
        
        // 剩餘的連續幀需要設置opcode爲SWOOLE_WEBSOCKET_OPCODE_CONTINUATION，且flags爲0，finish爲false
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $frame->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
        $frame->flags = 0;
        $frame->finish = false;
        $response->push($frame);
        
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $response->push($frame);
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $response->push($frame);
        
        // 最後一個連續幀需要設置finish爲true，flags爲SWOOLE_WEBSOCKET_FLAG_FIN，表明數據已經發送完畢
        $frame->data = deflate_add($context, $data3, ZLIB_SYNC_FLUSH);
        $frame->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
        $frame->finish = true;
        $response->push($frame);
    });
    $server->start();
});
```

- 發送控制幀（`ping`，`pong` 和 `close`）

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\WebSocket\CloseFrame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $pingFrame = new Frame;
        $pingFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_PING;
        $response->push($pingFrame);
        
        $pongFrame = new Frame;
        $pongFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_PONG;
        $response->push($pongFrame);
        
        $closeFrame = new CloseFrame();
        $closeFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE;
        $closeFrame->code = SWOOLE_WEBSOCKET_CLOSE_NORMAL;
        $response->push($closeFrame);
    });
    $server->start();
});
```

> [!WARNING]
> - 只能在 [HTTP/WebSocket 協程服務器](/zh-hant/server/coroutine/http.html) 使用。
> - 當使用 [`Swoole\WebSocket\Frame`](/zh-hant/server/class/frame.html) 和 [`Swoole\WebSocket\CloseFrame`](/zh-hant/server/class/close_frame.html) 時，請通過對象的**屬性**來設置 `$data`、`$opcode` 和 `$flags`，**方法參數**中的這三個值將被忽略。

### recv

接收 `WebSocket` 客戶端發送的數據。

```php
public function recv(float $timeout = 0): \Swoole\WebSocket\Frame|false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 超時時間 | `0`，不超時 |

**返回值**：操作成功返回 `Swoole\WebSocket\Frame` 對象，連接已經關閉返回空字符串，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                continue;
            }
            
            break;
        }
    });
    $server->start();
});
```

> [!TIP]
> 只能在 [HTTP/WebSocket 協程服務器](/zh-hant/server/coroutine/http.html) 使用。

### close

關閉 `WebSocket` 連接。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                continue;
            }
            
            $response->close();
        }
    });
    $server->start();
});
```

> [!WARNING]
> - 此方法會直接切斷 `TCP` 連接，不會發送關閉幀。
> - 只能在 [HTTP/WebSocket 協程服務器](/zh-hant/server/coroutine/http.html) 使用。

### disconnect

斷開 `WebSocket` 連接。該方法會發送一個關閉幀，然後優雅關閉連接。

```php
public function disconnect(int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$code` | 關閉連接的狀態碼，根據 `RFC6455`，對於應用程序關閉連接狀態碼，取值範圍爲 `1000` 或 `4000-4999` 之間 | `SWOOLE_WEBSOCKET_CLOSE_NORMAL` |
| `$reason` | 關閉連接的原因，`utf-8` 格式字符串，字節長度不超過 `125` | 無 |

**返回值**：發送成功返回 `true`，發送失敗或狀態碼非法時返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                continue;
            }
            
            $response->disconnect();
        }
    });
    $server->start();
});
```

> [!WARNING]
> - 請使用 `disconnect` 來關閉 `WebSocket` 連接，該方法會自動發送 `close` 關閉幀給客戶端並關閉連接。
> - 只能在 [HTTP/WebSocket 協程服務器](/zh-hant/server/coroutine/http.html) 使用。

**支持的狀態碼**

| 狀態碼常量                                     | 中文說明                                      |
|-------------------------------------------|-------------------------------------------|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL             | **正常關閉** - 連接已完成工作，正常結束                   |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY         | **正在離開** - 端點離開（如瀏覽器跳轉或關閉頁面）              |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR     | **協議錯誤** - 端點收到不符合 WebSocket 協議的數據        |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR         | **數據類型錯誤** - 收到無法處理的數據類型（如端點只接收文本卻收到二進制）  |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR       | **狀態碼無效** - 預期收到狀態碼但未收到（實際不發送此碼，用於應用）     |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL           | **異常關閉** - 連接非預期斷開（如沒收到關閉幀就斷開，不主動發送）      |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR      | **消息格式錯誤** - 收到不符合規範的消息（如 UTF-8 編碼錯誤）     |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR       | **違反策略** - 消息違反服務器策略（通用拒絕原因）              |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG    | **消息過大** - 消息長度超出端點願意處理的範圍                |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING  | **缺少擴展** - 客戶端期望服務器協商特定擴展，但服務器未提供（客戶端專用）  |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR       | **服務器內部錯誤** - 服務器遇到異常情況無法完成請求             |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER    | **稍後重試** - 服務器臨時過載或維護中，建議稍後再連             |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY        | **網關錯誤** - 網關或代理收到無效的上游響應   |
| SWOOLE_WEBSOCKET_CLOSE_TLS                | **TLS 握手失敗** - TLS 握手未完成就關閉（不主動發送）        |

### ping

`WebSocket` 發送心跳包給客戶端。

```php
public function ping(string $data = ''): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | `ping` 幀需要攜帶的數據 | `''` |

**返回值**：發送成功返回 `true`，發送失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                $response->ping();
                continue;
            }
            
            $response->disconnect();
        }
    });
    $server->start();
});
```

> [!WARNING]
> - 除非設置 [open_websocket_pong_frame](/zh-hant/server/setting.html#open-websocket-pong-frame) 爲 `true`，否則客戶端發送的 `pong` 幀會被底層自動處理。
> - 只能在 [HTTP/WebSocket 協程服務器](/zh-hant/server/coroutine/http.html) 使用。

### goaway

向客戶端發送 `GOAWAY` 幀，通知客戶端連接即將關閉，並允許優雅地處理完已存在的請求。

```php
public function goaway(int $error_code = SWOOLE_HTTP2_ERROR_NO_ERROR, string $debug_data = ''): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$error_code` | `HTTP/2` 錯誤碼，用於說明關閉連接的原因 | `SWOOLE_HTTP2_ERROR_NO_ERROR` |
| `$debug_data` | 可選的調試數據，會包含在發送的 `GOAWAY` 數據包中 | `''` |

**返回值**：發送成功返回 `true`，發送失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9090, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
$server->set([
    'worker_num' => 1,
    'ssl_cert_file' =>  '/server.crt', 
    'ssl_key_file' =>  '/server.key',
    'open_http2_protocol' => true  // 必須開啓 HTTP/2
]);

$server->on('request', function(Request $request, Response $response) {
    // 發送 GOAWAY 幀通知客戶端關閉連接
    $response->goaway(SWOOLE_HTTP2_ERROR_NO_ERROR, 'Server shutting down');
    $response->end('Goodbye!');
});

$server->start();
```

| 常量名 | 中文定義 |
| :--- | :--- |
| SWOOLE_HTTP2_ERROR_NO_ERROR | 沒有錯誤（通常用於優雅地關閉連接） |
| SWOOLE_HTTP2_ERROR_PROTOCOL_ERROR | 協議錯誤（檢測到未特別指定的協議錯誤） |
| SWOOLE_HTTP2_ERROR_INTERNAL_ERROR | 內部錯誤（端點遇到意外的內部錯誤） |
| SWOOLE_HTTP2_ERROR_FLOW_CONTROL_ERROR | 流量控制錯誤（對端違反了流量控制協議） |
| SWOOLE_HTTP2_ERROR_SETTINGS_TIMEOUT | 設置超時（發送了 SETTINGS 幀但未及時收到響應） |
| SWOOLE_HTTP2_ERROR_STREAM_CLOSED | 流關閉（在流半關閉之後收到了一個幀） |
| SWOOLE_HTTP2_ERROR_FRAME_SIZE_ERROR | 幀大小錯誤（收到的幀的大小無效或超過最大尺寸） |
| SWOOLE_HTTP2_ERROR_REFUSED_STREAM | 被拒絕的流（在執行任何應用處理之前拒絕了該流） |
| SWOOLE_HTTP2_ERROR_CANCEL | 取消（表明不再需要指定的流） |
| SWOOLE_HTTP2_ERROR_COMPRESSION_ERROR | 壓縮錯誤（無法爲連接維護報頭壓縮的上下文） |
| SWOOLE_HTTP2_ERROR_CONNECT_ERROR | 連接錯誤（爲某個連接請求建立的連接被重置或異常關閉） |
| SWOOLE_HTTP2_ERROR_ENHANCE_YOUR_CALM | 提高你的穩定性（檢測到遠端表現出可能產生過大負載的行爲） |
| SWOOLE_HTTP2_ERROR_INADEQUATE_SECURITY | 安全性不夠（底層傳輸存在不滿足最低安全需求的屬性） |
| SWOOLE_HTTP2_ERROR_HTTP_1_1_REQUIRED | 需要 HTTP/1.1（要求使用 HTTP/1.1 而不是 HTTP/2） |

> [!TIP]
> 只能在 [HTTP2 服務器](/zh-hant/server/http.html) 使用。

### trailer

用於在 `HTTP` 響應的主體 `（Body）` 之後追加額外的頭信息 `（Trailer Header）`。它通常用於在生成併發送完動態內容後，補充一些元數據（如內容校驗值、簽名或 gRPC 狀態碼）。

```php
public function trailer(string $key, string $value): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | `HTTP` 頭的鍵名 | 必填 |
| `$value` | `HTTP` 頭的值 | 必填 |

**返回值**：發送成功返回 `true`，發送失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9090);
$server->on('request', function(Request $request, Response $response) {
    $response->write('Hello, ');
    $response->write('World!');
    $response->trailer('Content-MD5', md5('Hello, World!'));
    $response->trailer('X-Process-Time', microtime(true));
    $response->end();
});

$server->start();
```

> [!WARNING]
> - 重複設置相同 `$key` 的 Trailer 會**覆蓋**之前的值。
> - 響應體很大且需邊生成邊發送時，可在最後附加 `Content-MD5` 或 `Digest` 頭進行完整性校驗。
