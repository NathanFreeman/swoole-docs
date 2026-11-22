# Swoole\Http\Request

`Swoole\Http\Request` 請求對象封裝了客戶端發起的 `HTTP` 請求信息，包含 `GET` 參數、`POST` 數據、`Cookie` 以及 `Header` 等關鍵內容。

## 屬性

### fd

當前請求的客戶端文件描述符，是一個 `int` 類型的整數。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->fd);
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

### streamId

HTTP/2 在一個 `TCP` 連接上可以同時傳輸多個請求和響應，每個獨立的“請求-響應”交互被稱爲一個流。`streamId` 就是用來區分這些不同流的 ID 號。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// 設置SSL證書
$http->set([
  'ssl_cert_file' => '/server.crt',
  'ssl_key_file' => '/server.key',
  'open_http2_protocol' => true  // 開啓這個以便於解析http2協議
]);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->streamId);
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start();
```

### header

`HTTP` 請求的頭部信息。類型爲數組，所有 `key` 均爲小寫。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->header['server'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### server

`HTTP` 請求相關的服務器信息，相當於 `PHP` 的 `$_SERVER` 數組。包含了 `HTTP` 請求的方法，`URL` 路徑，客戶端 `IP` 等信息。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $method = $request->server['request_method'];
  $response->end("<h1>Hello $method</h1>");
});

$http->start(); 
```

**參數信息**

| 鍵名 | 說明 |
|:---|:---|
| `query_string` | 請求的 `GET` 參數字符串（如 `id=1&cid=2`）；若不存在則省略 |
| `request_method` | HTTP 請求方法（如 `GET`、`POST`） |
| `request_uri` | 不含 `GET` 參數的請求路徑（如 `/favicon.ico`） |
| `path_info` | 同 `request_uri` |
| `request_time` | 請求開始處理的時間戳（秒）。<br>在 [`SWOOLE_PROCESS`](/zh-hant/server/process_thread.html#swoole-process) 模式下因存在 `dispatch` 過程，可能滯後於實際收包時間；高負載時偏差更明顯。可通過 [`$server->getClientInfo()`](/zh-hant/server/methods.html#getclientinfo) 中的 `last_time` 獲取精確收包時間 |
| `request_time_float` | 請求開始處理的微秒級時間戳，`float` 類型（如 `1576220199.2725`） |
| `server_protocol` | 服務器協議版本：`HTTP/1.0`、`HTTP/1.1` 或 `HTTP/2` |
| `server_port` | 服務器監聽的端口 |
| `remote_port` | 客戶端端口 |
| `remote_addr` | 客戶端 IP 地址 |
| `server_addr` | 接收請求的服務器網卡地址，Swoole 6.2+ 纔有該鍵值 |
| `master_time` | 連接最後一次通信的時間 |

### cookie

`HTTP` 請求攜帶的 `COOKIE` 信息，相當於 `PHP` 中的 `$_COOKIE`，格式爲數組。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->cookie['name'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### get

`HTTP` 請求的 `GET` 參數，相當於 `PHP` 中的 `$_GET`，格式爲數組。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### post

`HTTP` 請求的 `POST` 參數，相當於 `PHP` 中的 `$_POST`，格式爲數組。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->post['name'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### files

上傳文件信息，類型爲以 `form` 名稱爲 `key` 的二維數組。與 `PHP` 的 `$_FILES` 相同。最大文件尺寸不得超過 [package_max_length](/zh-hant/server/setting.html#package-max-length) 設置的值。因爲 Swoole 在解析報文的時候是會佔用內存的，報文越大，內存佔用越大，因此請勿使用 `Swoole\Http\Server` 處理大文件上傳或者由用戶自行設計斷點續傳的功能。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->files);
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

**參數信息**

| 鍵名 | 說明 |
|:---|:---|
| `name` | 瀏覽器上傳時傳入的文件名稱 |
| `type` | MIME 類型 |
| `tmp_name` | 上傳的臨時文件，文件名以 `/tmp/swoole.upfile` 開頭 |
| `error` | 錯誤碼 |
| `size` | 上傳文件大小 |

## 方法

### getContent

- 獲取原始 HTTP 請求主體（Body），主要用於處理 `application/x-www-form-urlencoded` 之外的 `POST` 請求類型（如 `application/json`、`text/xml` 等）。
- 此方法等效於 PHP 中的 `file_get_contents('php://input')`。

```php
Swoole\Http\Request->getContent(): string|false
```

**返回值**：成功時返回原始的請求主體字符串；若當前請求的上下文連接已不存在，返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump(json_decode($request->getContent(), true));
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

- 新開一個終端，使用 `curl` 發送 `application/json` 請求。

```shell
curl -X POST 127.0.0.1:9501 -H "Content-Type: application/json" -d '{"name":"張三","age":25}'
```

- 服務器終端輸出結果爲

```shell
array(2) {
  ["name"]=>
  string(6) "張三"
  ["age"]=>
  int(25)
}
```

> [!NOTE]
> Swoole 版本 >= `v4.5.0` 可用，在低版本可使用別名 `rawContent`（此別名將永久保留，即向下兼容）。

### getData

獲取完整的原始 `Http` 請求報文，注意 `Http2` 下無法使用。

```php
Swoole\Http\Request->getData(): string|false
```

**返回值**：執行成功返回報文，如果上下文連接不存在或者在 `Http2` 模式下返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $protocol = $request->getData();
  echo $protocol . PHP_EOL;
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

- 新開一個終端，使用 `curl` 發送 `application/json` 請求。

```shell
curl -X POST 127.0.0.1:9501 -H "Content-Type: application/json" -d '{"name":"張三","age":25}'
```

- 輸出結果爲。

```shell
POST / HTTP/1.1
Host: 127.0.0.1:9501
User-Agent: curl/8.5.0
Accept: */*
Content-Type: application/json
Content-Length: 26

{"name":"張三","age":25}
```

### create

創建一個 `Swoole\Http\Request` 對象。

```php
Swoole\Http\Request::create(array $options = []): Swoole\Http\Request
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$options` | 可選參數，用於設置 `Request` 對象的配置，可用的鍵見下表 | `[]` |

**`$options` 可用的配置項**

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `parse_cookie` | 是否解析 Cookie | `true` |
| `parse_body` | 是否解析 HTTP Body | `true` |
| `parse_files` | 是否解析上傳的文件 | `true` |
| `enable_compression` | 是否啓用壓縮 | `false`（若服務器不支持壓縮報文） |
| `compression_level` | 壓縮級別（1-9），值越高壓縮越小，但 CPU 消耗越大 | `1` |
| `upload_tmp_dir` | 上傳文件的臨時存儲目錄 | `/tmp` |

**返回值**：返回一個 `Swoole\Http\Request` 對象。

**示例：解析 HTTP 報文**

假設你有一段 HTTP 原始報文，需要從中提取關鍵信息，可以這樣操作：

```php
<?php
use Swoole\Http\Request;

$protocol = "POST / HTTP/1.1\r\nHost: 127.0.0.1:9501\r\nUser-Agent: curl/8.5.0\r\nAccept: */*\r\nContent-Type: application/json\r\nContent-Length: 26\r\n\r\n{\"name\":\"張三\",\"age\":25}";

$request = Request::create(['parse_body' => true]);
$request->parse($protocol);
$data = $request->getContent();
echo $data;
```

### parse

解析一個 `HTTP` 報文。

```php
Swoole\Http\Request->parse(string $data): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要解析的報文 | 必填 |

**返回值**：解析成功返回解析的報文長度，連接上下文不存在或者上下文已經結束返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Request;

$protocol1 = "POST / HTTP/1.1\r\nHost: 127.0.0.1:9501\r\nUser-Agent: curl/8.5.0\r\nAccept: */*\r\n";
$protocol2 = "Content-Type: application/json\r\nContent-Length: 26\r\n\r\n";
$protocol3 = "{\"name\":\"張三\",\"age\":25}";

$request = Request::create(['parse_body' => true]);
$request->parse($protocol1);
$request->parse($protocol2);
$request->parse($protocol3);
$data = $request->getContent();
echo $data;
```

> [!WARNING]
> 只能解析 `HTTP/1.1` 的報文，無法解析 `HTTPS` 和 `HTTP2` 的報文。

> [!NOTE]
> 支持將一個完整的 `HTTP` 報文拆分成多個片段，並分多次調用 `parse` 方法進行解析。底層會自動維護解析狀態，將新傳入的數據與之前未解析完的數據拼接，並從上次解析中斷的位置繼續解析。

### isCompleted

獲取當前的 `HTTP` 請求數據包是否已解析到結尾。

```php
Swoole\Http\Request->isCompleted(): bool
```

**返回值**：`true` 表示已經是結尾，`false` 表示連接上下文已經結束或者未到結尾。

**示例**

```php
<?php
use Swoole\Http\Request;

$data = "GET /index.html?hello=world&test=2123 HTTP/1.1\r\n";
$data .= "Host: 127.0.0.1\r\n";
$data .= "Connection: keep-alive\r\n";
$data .= "Pragma: no-cache\r\n";
$data .= "Cache-Control: no-cache\r\n";
$data .= "Upgrade-Insecure-Requests: \r\n";
$data .= "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36\r\n";
$data .= "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9\r\n";
$data .= "Accept-Encoding: gzip, deflate, br\r\n";
$data .= "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ja;q=0.6\r\n";
$data .= "Cookie: env=pretest; phpsessid=fcccs2af8673a2f343a61a96551c8523d79ea; username=hantianfeng\r\n";

/** @var Request $req */
$req = Request::create(['parse_cookie' => false]);
var_dump($req);

var_dump($req->isCompleted());
var_dump($req->parse($data));

var_dump($req->parse("\r\n"));
var_dump($req->isCompleted());

var_dump($req);
// 關閉瞭解析cookie，所以會是null
var_dump($req->cookie);
```

### getMethod

獲取當前的 `HTTP` 請求的請求方式。

```php
Swoole\Http\Request->getMethod(): string|false
```

**返回值**：成功返回大寫的請求方式，`false` 表示連接上下文不存在。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->getMethod());
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```
