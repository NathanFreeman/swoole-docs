# HTTP協程客戶端

- `Swoole\Coroutine\Http\Client` 是 `Swoole` 提供的協程版 `HTTP/HTTPS` 客戶端，用於在協程環境中發起 `HTTP` 和 `WebSocket` 請求
- 只支持 `gzip` 報文壓縮（需依賴 `zlib` 庫）。

## 屬性

### socket

當前連接 `fd` 對應的 [`Swoole\Coroutine\Socket`](/zh-hant/client/socket.html) 對象，以便執行更底層的操作。

```php
public Swoole\Coroutine\Socket $socket;
```

### errCode

最近一次操作的錯誤碼。

```php
public int $errCode = 0;
```

### errMsg

最近一次操作的錯誤信息。

```php
public string $errMsg = '';
```

### connected

當前客戶端是否已經連接上服務端。

```php
public bool $connected = false;
```

### host

服務端地址。

```php
public string $host;
```

### port

服務端端口。

```php
public int $port;
```

### ssl

是否開啓 `ssl` 連接。

```php
public bool $ssl;
```

### setting

當前客戶端的連接配置。

```php
public array $setting;
```

### requestMethod

當前 `HTTP` 客戶端請求方法。

```php
public string $requestMethod;
```

### requestHeaders

當前 `HTTP` 客戶端請求頭。

```php
public array $requestHeaders;
```

### requestBody

當前 `HTTP` 客戶端請求包體。

```php
public string $requestBody;
```

### uploadFiles

當前 `HTTP` 客戶端上傳文件。

```php
public array $uploadFiles;
```

### downloadFile

從服務端下載的文件在本地的保存路徑。

```php
public string $downloadFile;
```

### downloadOffset

從服務端下載的文件的偏移量。

```php
public int $downloadOffset;
```

### statusCode

當前請求狀態碼。

```php
public int $statusCode;
```

### headers

`HTTP` 服務端的響應頭。

```php
public array $headers;
```

### set_cookie_headers

`HTTP` 服務端的原生響應 `cookie`。

```php
public array $set_cookie_headers;
```

**示例**

```php
["set_cookie_headers"]=>
  array(4) {
    [0]=>
    string(129) "BAIDUID=CE62AAD88DC35A8ED32959FE69170AD6:FG=1; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [1]=>
    string(125) "BIDUPSID=CE62AAD88DC35A8ED32959FE69170AD6; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [2]=>
    string(99) "PSTM=1779953245; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [3]=>
    string(150) "BAIDUID=CE62AAD88DC35A8EC30AC4C975C8B357:FG=1; max-age=31536000; expires=Fri, 28-May-27 07:27:25 GMT; domain=.baidu.com; path=/; version=1; comment=bd"
```

### cookies

`HTTP` 服務端的響應 `cookie`。

```php
public array $cookies;
```

**示例**

```php
["cookies"]=>
  array(3) {
    ["BAIDUID"]=>
    string(37) "CE62AAD88DC35A8EC30AC4C975C8B357:FG=1"
    ["BIDUPSID"]=>
    string(32) "CE62AAD88DC35A8ED32959FE69170AD6"
    ["PSTM"]=>
    string(10) "1779953245"
  }
```

> [!TIP]
> 與 `set_cookie_headers` 的區別是，`set_cookie_headers` 不會將 `cookie` 轉化鍵值對數組。

### body

`HTTP` 響應的包體內容。

```php
public string $body = '';
```

## 方法

### __construct

構造函數，創建一個 `HTTP`/`WebSocket` 客戶端。

```php
public function __construct(string $host, int $port = 0, bool $ssl = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 目標服務器主機地址【可以爲IP或域名，底層自動進行域名解析，若是本地UNIXSocket則應以形如 `unix://tmp/your_file.sock` 的格式填寫；若是域名不需要填寫協議頭 `http://` 或 `https://`】 | 必填 |
| `$port` | 目標服務器主機端口 | `0` |
| `$ssl` | 是否啓用 `SSL/TLS` 隧道加密，如果目標服務器是 https 必須設置 `$ssl` 參數爲 `true` | `false` |

### set

設置 `HTTP`/`WebSocket` 客戶端運行時配置。

```php
public function set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | `HTTP`/`WebSocket` 客戶端運行時配置 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**支持的配置**

| 配置項                         | 正確說明                                                                                  | 示例值                                                                   |
|:----------------------------|:--------------------------------------------------------------------------------------|:----------------------------------------------------------------------|
| `max_retries`               | 設置連接失敗時的最大重試次數。                                                                       | `3`                                                                   |
| `defer`                     | 啓用延遲收包模式。請求發出後不立即等待響應，協程可以處理其他任務，稍後再通過 `recv()` 獲取結果，提升併發能力。                          | `true`                                                                |
| `lowercase_header`          | 將 HTTP 響應頭部的鍵名全部轉換爲小寫。                                                                | `true`                                                                |
| `keep_alive`                | 啓用 HTTP 持久連接，複用同一個 TCP 連接發送多個請求，提高效率。                                                 | `true`                                                                |
| [`http_compression`](/zh-hant/server/setting.html#http-compression)          | 啓用 HTTP 請求壓縮（如 gzip），減少傳輸數據量。                                                         | `true`                                                                |
| `body_decompression`        | 啓用後，自動對服務器返回的壓縮響應體（如 gzip 內容）進行解壓。                                                    | `true`                                                                |
| `write_func`                | 自定義數據發送函數的回調。                                                                         | `function($client, $data) { /* ... */ }`                              |
| [`websocket_subprotocol`](/zh-hant/server/setting.html#websocket-subprotocol)     | 設置 WebSocket 握手時希望使用的子協議。                                                             | `'chat'`                                                              |
| `websocket_mask`            | 設置是否對 WebSocket 幀數據應用掩碼。根據 RFC 標準，客戶端發送的數據必須掩碼，默認爲 `true`。                            | `true`                                                                |
| [`websocket_compression`](/zh-hant/server/setting.html#websocket-compression)     | 啓用 WebSocket 消息壓縮。需服務端支持，且依賴 `zlib` 庫。                                                | `true`                                                                |
| [`open_websocket_ping_frame`](/zh-hant/server/setting.html#open-websocket-ping-frame) | 開啓後，服務端發來的 Ping 幀不再由底層自動回覆 Pong，而是通過 `recv()` 返回給使用者自行處理（Swoole 6.1+ 底層默認自動處理控制幀）。 | `true`                                                                |
| [`open_websocket_pong_frame`](/zh-hant/server/setting.html#open-websocket-pong-frame) | 開啓後，服務端發來的 Pong 幀不再由底層自動處理，而是通過 `recv()` 返回給使用者自行處理（Swoole 6.1+ 底層默認自動處理控制幀）。 | `true`                                                                |
| `timeout`                   | **全局超時**（秒），統一控制連接、讀取、寫入的超時時間。優先級低於 `connect_timeout`、`read_timeout`、`write_timeout`。 | `0.5`                                                                 |
| `connect_timeout`           | **連接超時**（秒），單獨控制 TCP 握手階段的超時時間。                                                       | `1.0`                                                                 |
| `read_timeout`              | **讀取超時**（秒），單獨控制等待數據的超時時間。                                                            | `0.5`                                                                 |
| `write_timeout`             | **寫入超時**（秒），單獨控制發送數據的超時時間。                                                            | `0.5`                                                                 |
| `bind_address`              | 多網卡環境下，強制綁定本地 IP 地址。需與 `bind_port` 同時使用。                                              | `'192.168.1.100'`                                                     |
| `bind_port`                 | 強制綁定本地端口號。需與 `bind_address` 同時使用。                                                     | `9501`                                                                |
| [`socket_buffer_size`](/zh-hant/server/setting.html#socket-buffer-size)        | 發送緩衝區總大小（字節）。                                                                         | `1024 * 1024 * 2`                                                     |
| [`open_tcp_nodelay`](/zh-hant/server/setting.html#open-tcp-nodelay)          | 關閉 Nagle 算法，小數據包立即發送，不等待合併。                                                           | `true`                                                                |
| `socks5_host`               | SOCKS5 代理服務器 IP 或域名。                                                                  | `'192.168.1.1'`                                                       |
| `socks5_port`               | SOCKS5 代理服務器端口。                                                                       | `1080`                                                                |
| `socks5_username`           | SOCKS5 代理認證用戶名（可選）。                                                                   | `'admin'`                                                             |
| `socks5_password`           | SOCKS5 代理認證密碼（可選）。                                                                    | `'123456'`                                                            |
| `http_proxy_host`           | HTTP 代理服務器 IP 或域名。                                                                    | `'192.168.1.1'`                                                       |
| `http_proxy_port`           | HTTP 代理服務器端口。                                                                         | `8080`                                                                |
| `http_proxy_username`       | HTTP 代理認證用戶名（可選）。                                                                     | `'admin'`                                                             |
| `http_proxy_password`       | HTTP 代理認證密碼（可選）。                                                                      | `'123456'`                                                            |
| [`open_http2_protocol`](/zh-hant/server/setting.html#open-http2-protocol)       | 啓用 HTTP/2 協議支持（需在 SSL 之上使用）。                                                          | `true`                                                                |
| [`open_eof_check`](/zh-hant/server/setting.html#open-eof-check)            | 啓用 EOF 邊界檢測，僅當數據包結尾匹配分隔符時才停止接收。                                                       | `true`                                                                |
| [`open_eof_split`](/zh-hant/server/setting.html#open-eof-split)            | 啓用 EOF 自動切分，逐字節掃描並按分隔符切分完整數據包。                                                        | `true`                                                                |
| [`package_eof`](/zh-hant/server/setting.html#package-eof)               | 指定 EOF 分隔符。                                                                           | `"\r\n"`                                                              |
| `open_fastcgi_protocol`     | 啓用 FastCGI 協議解析。                                                                      | `true`                                                                |
| [`open_mqtt_protocol`](/zh-hant/server/setting.html#open-mqtt-protocol)        | 啓用 MQTT 協議解析。                                                                         | `true`                                                                |
| [`open_length_check`](/zh-hant/server/setting.html#open-length-check)         | 啓用長度檢測協議解析。                                                                           | `true`                                                                |
| [`package_length_type`](/zh-hant/server/setting.html#package-length-type)       | 長度字段類型，與 `pack()` 函數一致，如 `'N'` 表示 4 字節無符號長整型。                                         | `'N'`                                                                 |
| [`package_length_offset`](/zh-hant/server/setting.html#package-length-offset)     | 長度字段在數據包中的起始偏移量（字節）。                                                                  | `0`                                                                   |
| [`package_body_offset`](/zh-hant/server/setting.html#package-body-offset-package-body-start)       | 包體數據在數據包中的起始偏移量（字節）。                                                                  | `4`                                                                   |
| [`package_length_func`](/zh-hant/server/setting.html#package-length-func)       | 自定義長度解析函數，返回完整數據包的長度。                                                                 | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/zh-hant/server/setting.html#package-max-length)        | 最大可接收數據包大小（字節）。                                                                       | `8192`                                                                |
| [`ssl_protocols`](/zh-hant/server/setting.html#ssl-protocols)             | 允許的 SSL/TLS 協議版本。                                                                     | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/zh-hant/server/setting.html#ssl-compress)              | 是否啓用 SSL/TLS 壓縮。                                                                      | `false`                                                               |
| [`ssl_cert_file`](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)             | 客戶端證書文件路徑（雙向驗證時使用）。                                                                   | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)              | 客戶端私鑰文件路徑（雙向驗證時使用）。                                                                   | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`            | 私鑰文件密碼（若已加密）。                                                                         | `'pass123'`                                                           |
| `ssl_host_name`             | SNI 域名，用於服務端返回正確的 SSL 證書。                                                             | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/zh-hant/server/setting.html#ssl-verify-peer)           | 是否驗證對端證書。                                                                             | `true`                                                                |
| [`ssl_allow_self_signed`](/zh-hant/server/setting.html#ssl-allow-self-signed)     | 是否允許自簽名證書。                                                                            | `true`                                                                |
| [`ssl_cafile`](/zh-hant/server/setting.html#ssl-cafile)                | CA 證書文件路徑，用於驗證對端證書籤名。                                                                 | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/zh-hant/server/setting.html#ssl-capath)                | CA 證書目錄路徑（需爲哈希目錄），`ssl_cafile` 未設置或無效時使用。                                             | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/zh-hant/server/setting.html#ssl-verify-depth)          | 證書鏈驗證的最大深度，超過則終止驗證。                                                                   | `5`                                                                   |
| [`ssl_ciphers`](/zh-hant/server/setting.html#ssl-ciphers)               | 設置 OpenSSL 加密算法套件。                                                                    | `'ECDHE-RSA-AES128-GCM-SHA256'`                                       |
| [`ssl_ecdh_curve`](/zh-hant/server/setting.html#ssl-ecdh-curve)            | 控制 ECDH 密鑰交換所使用的橢圓曲線。                                                                 | `'secp256r1'`                                                         |
| `ssl_grease`                | 啓用 TLS GREASE（防僵化）擴展，增強與不標準服務端的兼容，只適用於谷歌的`BoringSSL`。                                 | `true`                                                                |

### setDefer

開啓延遲收包模式。

```php
public function setDefer(bool $defer = true): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$defer` | 是否開啓延遲收包模式。其它值：`false` | `true` |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 創建多個客戶端併發請求
    $clients = [];
    for ($i = 0; $i < 5; $i++) {
        $cli = new Client('127.0.0.1', 80);
        $cli->setHeaders([
            'Host' => 'localhost',
            'User-Agent' => 'Chrome/49.0.2587.3',
        ]);
        $cli->set(['timeout' => 2]);
        
        // 開啓 defer 模式（只發包，不收包）
        $cli->setDefer(true);
        $cli->get('/api/user/' . $i);
        
        $clients[] = $cli;
    }
    
    // 批量收包
    $results = [];
    foreach ($clients as $cli) {
        $cli->recv();      // 等待並接收響應
        $results[] = $cli->body;
        $cli->close();
    }
});
```

> [!WARNING]
> `setDefer` 將 `發送請求` 和 `接收響應` 拆分成兩個步驟，必須要通過 [recv](/zh-hant/client/http_websocket.html#recv) 獲取響應

### getDefer

判斷當前請求是否開啓了延遲收包模式。

```php
public function getDefer(): bool
```

**返回值**：`true` 表示開啓了延遲收包模式，`false` 表示關閉延遲收包。

### setMethod

設置 `HTTP` 客戶端請求方法。僅在當前請求有效，發送請求後會立刻清除 method 設置。

```php
public function setMethod(string $method): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$method` | 設置請求方法 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

### setHeaders

設置 `HTTP` 客戶端請求頭。

```php
public function setHeaders(array $headers): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$headers` | 設置請求頭 【必須爲鍵值對應的數組，底層會自動映射爲 `$key`: `$value` 格式的 `HTTP` 標準頭格式】 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

### setBasicAuth

設置 `HTTP` 基礎認證（Basic Authentication）。

```php
public function setBasicAuth(string $username, string $password): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$username` | `HTTP Basic Auth` 的用戶名 | 必填 |
| `$password` | `HTTP Basic Auth` 的密碼 | 必填 |

**返回值**：無返回值。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 設置請求頭
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
    ]);
    
    // 設置超時時間
    $client->set(['timeout' => 2]);
    
    // 設置 Basic Auth
    $client->setBasicAuth('user', 'pass');
    
    // 發起請求
    $client->get('/user');
    
    echo $client->body;
    $client->close();
});
```

### setCookies

設置 `HTTP` 客戶端請求 `Cookie`。

```php
public function setCookies(array $cookies): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cookies` | 設置 `COOKIE` 【必須爲鍵值對應數組】 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**注意**

- 設置的 `cookie` 會在客戶端對象存活期間會持續保存。
- 重複調用 `setCookies` 方法，會覆蓋當前的 `cookie` 狀態，這會丟棄之前服務器端下發的 `cookie` 以及之前主動設置的 `cookie`。
- `cookie` 的值將會被進行 `urlencode` 編碼, 若想保持原始信息, 請自行用 `setHeaders` 設置名爲 `Cookie` 的請求頭。

### setData

設置 `HTTP` 請求體 `（body）` 數據。

```php
public function setData(array|string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 設置請求的包體 | 必填 |

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
    ]);
    
    $client->set(['timeout' => 1]);
    
    // 使用數組設置數據
    $client->setData(['msg' => 'Hello', 'from' => 'Swoole']);
    
    // 執行請求（需配合 setMethod 使用）
    $client->setMethod('POST');
    $status = $client->execute('/index');
    
    echo $status . "\n";
    var_dump($client->body);
    
    $client->close();
});
```

**注意**

- 設置 `$data` 且未設置 `$method` 時，底層會自動將請求方式設爲 `POST`。
- 若 `$data` 爲數組，且 `Content-Type` 爲 `application/x-www-form-urlencoded` 格式，底層會自動執行 `http_build_query` 進行編碼。
- 若通過 `addFile` 或 `addData` 啓用了 `multipart/form-data` 格式：
    - 當 `$data` 爲字符串時，將被忽略（因爲字符串無法與 `multipart/form-data` 格式兼容）；
    - 當 `$data` 爲數組時，底層會以 `multipart/form-data` 格式將數組中的字段逐個追加到請求中。

### addFile

`HTTP` 客戶端中用於上傳文件，支持 `multipart/form-data` 格式的文件上傳。

```php
public function addFile(string $path, string $name, ?string $type = null, ?string $filename = null, int $offset = 0, int $length = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 要上傳的本地文件路徑 | 必填 |
| `$name` | 表單的名稱【必選參數，對應服務端 `$_FILES['name']`】 | 必填 |
| `$type` | 文件的 `MIME` 格式，【可選參數，底層會根據文件的擴展名自動推斷】（原文記作 `$mimeType`） | `null` |
| `$filename` | 文件名稱【可選參數】 | `basename($path)` |
| `$offset` | 上傳文件的偏移量【可選參數，可以指定從文件的中間部分開始傳輸數據。此特性可用於支持斷點續傳。】 | `0` |
| `$length` | 發送數據的尺寸【可選參數】 | 默認爲整個文件的尺寸 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 設置請求頭（Content-Type 會自動變爲 multipart/form-data）
    $client->setHeaders([
        'Host' => 'localhost',
    ]);
    
    // 添加上傳文件
    $client->addFile('/home/test/1.jpg', 'img1');           // 表單字段名爲 img1
    $client->addFile('/home/test/2.jpg', 'img2');           // 可上傳多個文件
    
    // 發起 POST 請求
    $client->post('/upload.php', []);
    // 或使用 execute
    // $client->setMethod('POST');
    // $client->execute('/upload.php');
    
    echo $client->body;
    $client->close();
});
```

### addData

`HTTP` 客戶端中用於上傳內存數據的方法，與 `addFile` 類似，但它允許將 `字符串內容` 作爲 `虛擬文件` 進行上傳（支持 `multipart/form-data` 格式）

```php
public function addData(string $data, string $name, ?string $type = null, ?string $filename = null): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 數據內容【必選參數，最大長度不得超過 `buffer_output_size`】 | 必填 |
| `$name` | 表單的名稱【必選參數，對應服務端 `$_FILES['name']`】 | 必填 |
| `$type` | 文件的 `MIME` 格式【可選參數，默認爲 `application/octet-stream`】（原文記作 `$mimeType`） | `null` |
| `$filename` | 文件名稱【可選參數，默認爲 `$name`】 | `null` |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 準備要上傳的內存數據（例如動態生成的圖片、JSON字符串等）
    $imageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // 將內存數據作爲文件上傳
    $client->addData($imageData, 'image_file', 'image/png', 'test.png');
    
    // 發起 POST 請求
    $client->post('/upload.php', []);
    
    echo $client->body;
    $client->close();
});
```

### execute

執行 `HTTP` 請求的核心方法。

```php
public function execute(string $path): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 請求路徑 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 設置請求頭
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
    ]);
    
    // 設置超時
    $client->set(['timeout' => 5]);
    
    // 執行 GET 請求
    $client->setMethod('GET');
    $client->execute('/api/users');
    
    // 檢查結果
    if ($client->statusCode == 200) {
        echo $client->body;
    } else {
        echo "Error: " . $client->statusCode;
    }
    
    $client->close();
});
```

### getsockname

獲取客戶端本地 `Socket` 地址信息。

```php
public function getsockname(): array|false
```

**返回值**：操作成功返回一個數組，包含客戶端信息，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('www.baidu.com', 80);
    
    // 發起請求
    $client->get('/');
    
    // 獲取本地 Socket 地址信息
    $localAddr = $client->getsockname();
    
    if ($localAddr) {
        echo "本地 IP: " . $localAddr['address'] . "\n";
        echo "本地端口: " . $localAddr['port'] . "\n";
    }
    
    $client->close();
});
```

| key     | 含義      |
|---------|---------|
| address | 客戶端地址   |
| port    | 客戶端監聽端口 |

### getpeername

用於獲取遠端服務端 `Socket` 地址信息的方法。

```php
public function getpeername(): array|false
```

**返回值**：操作成功返回一個數組，包含服務端信息，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('www.baidu.com', 80);
    
    // 發起請求
    $client->get('/');
    
    // 獲取遠端 Socket 地址信息
    $remoteAddr = $client->getpeername();
    
    if ($remoteAddr) {
        echo "遠端 IP: " . $remoteAddr['address'] . "\n";
        echo "遠端端口: " . $remoteAddr['port'] . "\n";
    }
    
    $client->close();
});
```

| key     | 含義      |
|---------|---------|
| address | 服務端地址   |
| port    | 服務端監聽端口 |

### get

`HTTP` 客戶端發起 `GET` 請求。

```php
public function get(string $path): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 請求路徑 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 設置通用請求頭
    $client->setHeaders([
        'User-Agent' => 'Swoole Client',
    ]);
    
    // 發起 GET 請求
    $success = $client->get('/get?a=1&b=2');
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->body . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
}); 
```

### post

`HTTP` 客戶端發起 `POST` 請求。

```php
public function post(string $path, mixed $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 請求路徑 | 必填 |
| `$data` | 需要提交的數據 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 設置通用請求頭
    $client->setHeaders([
        'Content-Type' => 'application/json',
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    ]);
    
    $data = ['name' => 'John', 'age' => 25];
    $success = $client->post('/post', json_encode($data));
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->body . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
});
```

> [!TIP]
> 如果 `$data` 是數組，底層會自動設置 `Content-Type` 爲 `application/x-www-form-urlencoded`。

### download

從遠程服務器下載文件。

```php
public function download(string $path, string $filename, int $offset = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 請求的 `URL` 路徑 | 必填 |
| `$filename` | 指定下載內容寫入的文件路徑【會自動寫入到 `downloadFile` 屬性】 | 必填 |
| `$offset` | 指定寫入文件的偏移量【此選項可用於支持斷點續傳，可配合 `HTTP` 頭 `Range:bytes=$offset` 實現】 | `0` |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 設置通用請求頭
    $client->setHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    ]);
    
    $client->download('/images/swoole.svg', '/home/swoole.svg');
    $client->close();
});
```

> [!IMPORTANT]
> `$offset` 爲 `0` 時若文件已存在，底層會自動清空此文件。

### getBody

獲取 `HTTP` 響應的包體內容。

```php
public function getBody(): false|string
```

**返回值**：操作成功返回 `響應的包體內容`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 設置通用請求頭
    $client->setHeaders([
        'User-Agent' => 'Swoole Client',
    ]);
    
    // 發起 GET 請求
    $success = $client->get('/get?a=1&b=2');
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->getBody() . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
}); 
```

### getHeaders

返回 `HTTP` 響應的頭信息。

```php
public function getHeaders(): null|array|false
```

**返回值**：操作成功返回一個數組，裏面包含 `HTTP` 響應的頭信息，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 發起 GET 請求
    $client->get('/get');
    
    // 獲取響應頭
    $headers = $client->getHeaders();
    
    if ($headers) {
        echo "=== 響應頭信息 ===\n";
        foreach ($headers as $key => $value) {
            echo "$key: $value\n";
        }
    } else {
        echo "獲取響應頭失敗\n";
    }
    
    $client->close();
});
```

### getCookies

獲取服務器返回的 `Cookie` 信息。

```php
public function getCookies(): null|array|false
```

**返回值**：操作成功返回一個數組，裏面包含服務器返回的 `Cookie` 鍵值對，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('example.com', 80);
    
    // 發起請求
    $client->get('/login');
    
    // 獲取服務器返回的 Cookie
    $cookies = $client->getCookies();
    
    if ($cookies) {
        echo "=== 服務器返回的 Cookie ===\n";
        foreach ($cookies as $name => $value) {
            echo "$name = $value\n";
        }
    } else {
        echo "未收到任何 Cookie\n";
    }
    
    $client->close();
});
```

### getStatusCode

獲取服務器響應的 `HTTP` 狀態碼。

```php
public function getStatusCode(): false|int
```

**返回值**：操作成功返回響應的 `HTTP` 狀態碼，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    $client->get('/get');
    
    // 獲取狀態碼
    $statusCode = $client->getStatusCode();
    
    if ($statusCode === 200) {
        echo "請求成功\n";
        echo "響應內容: " . $client->body . "\n";
    } else {
        echo "請求失敗，狀態碼: $statusCode\n";
    }
    
    $client->close();
});
```

### getHeaderOut

獲取實際發送給 `服務端` 的原始請求頭（`Raw Request Headers`）。

```php
public function getHeaderOut(): false|string
```

**返回值**：操作成功返回原始請求頭，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
        'Accept-Encoding' => 'gzip',
    ]);
    $client->get('/get');
    
    // 獲取狀態碼
    $statusCode = $client->getStatusCode();
    
    // 獲取原始請求頭
    var_dump($client->getHeaderOut());
    
    $client->close();
});
```

### getPeerCert

獲取服務端 `SSL/TLS` 證書信息。

```php
public function getPeerCert(): false|string
```

**返回值**：操作成功返回 `X.509` 證書信息，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 第三個參數設置爲 true 以啓用 SSL/TLS
    $client = new Client('www.baidu.com', 443, true);
    
    $client->setHeaders([
        'Host' => 'www.baidu.com',
        'User-Agent' => 'Swoole Client',
    ]);
    
    $client->set(['timeout' => 10]);
    
    $client->get('/');
    
    // 獲取服務端證書信息
    $cert = $client->getPeerCert();
    
    if ($cert !== false) {
        echo "證書獲取成功\n";
        
        // 需要配合 openssl 擴展解析證書內容
        $certInfo = openssl_x509_parse($cert);
        print_r($certInfo);
    } else {
        echo "獲取證書失敗\n";
    }
    
    $client->close();
});
```

### upgrade

將 `HTTP` 連接升級爲 `WebSocket` 連接。

```php
public function upgrade(string $path): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 設置 `URL` 路徑【如 `/`，注意這裏不能傳入 `http://domain`】 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 創建 HTTP 客戶端
    $client = new Client('127.0.0.1', 9501);
    
    // 升級爲 WebSocket 連接
    $ret = $client->upgrade('/websocket');
    
    if (!$ret) {
        echo "WebSocket 握手失敗，HTTP 狀態碼: " . $client->statusCode . "\n";
        $client->close();
        return;
    }
    
    echo "WebSocket 連接成功！\n";
    
    // 發送消息
    $client->push("Hello WebSocket!");
    
    // 接收消息
    $response = $client->recv();
    if ($response && $response->data) {
        echo "收到: " . $response->data . "\n";
    }
    
    // 優雅關閉
    $client->disconnect();
});
```

> [!WARNING]
> 某些情況下請求雖然是成功的，`upgrade` 返回了 `true`，但服務器並未設置 `HTTP` 狀態碼爲 `101`，而是 `200` 或 `403` ，這說明服務器拒絕了握手請求。

### push

向 `WebSocket` 服務器推送消息。

```php
public function push(mixed $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要發送的數據內容【默認爲 `UTF-8` 文本格式，如果爲其他格式編碼或二進制數據，請使用 [`SWOOLE_WEBSOCKET_OPCODE_BINARY`](/zh-hant/server/methods.html#push)】 | 必填 |
| `$opcode` | 操作碼；其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 操作類型 | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：發送成功，返回 `true`；連接不存在、已關閉、未完成 `WebSocket`，發送失敗返回 `false`。

### recv

接收 `HTTP` 或者 `WebSocket` 服務器消息。

```php
public function recv(float $timeout = 0): Swoole\WebSocket\Frame|string|bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時時間。值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：

- `WebSocket` 客戶端：操作成功返回 [`Swoole\WebSocket\Frame`](/zh-hant/server/class/frame.html) 對象，連接關閉返回空字符串，操作失敗返回 `false`。
- `HTTP` 客戶端：操作成功返回 `true`，連接關閉返回空字符串，操作失敗返回 `false`。

**示例**

- `HTTP` 客戶端。

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 創建多個客戶端併發請求
    $clients = [];
    for ($i = 0; $i < 5; $i++) {
        $cli = new Client('127.0.0.1', 80);
        $cli->setHeaders([
            'Host' => 'localhost',
            'User-Agent' => 'Chrome/49.0.2587.3',
        ]);
        $cli->set(['timeout' => 2]);
        
        // 開啓 defer 模式（只發包，不收包）
        $cli->setDefer(true);
        $cli->get('/api/user/' . $i);
        
        $clients[] = $cli;
    }
    
    // 批量收包
    $results = [];
    foreach ($clients as $cli) {
        $cli->recv();      // 等待並接收響應
        $results[] = $cli->body;
        $cli->close();
    }
});
```

- `WebSocket` 客戶端。

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 創建 HTTP 客戶端
    $client = new Client('127.0.0.1', 9501);
    
    // 升級爲 WebSocket 連接
    $ret = $client->upgrade('/websocket');
    
    if (!$ret) {
        echo "WebSocket 握手失敗，HTTP 狀態碼: " . $client->statusCode . "\n";
        $client->close();
        return;
    }
    
    echo "WebSocket 連接成功！\n";
    
    // 發送消息
    $client->push("Hello WebSocket!");
    
    // 接收消息
    $response = $client->recv();
    if ($response && $response->data) {
        echo "收到: " . $response->data . "\n";
    }
    
    // 優雅關閉
    $client->disconnect();
});
```

**注意**

- `HTTP` 客戶端需要配合 [setDefer](/zh-hant/client/http_websocket.html#setdefer) 使用，只有設置了 `setDefer`，才能使用 `recv` 接收到服務端數據。
- `HTTP` 客戶端執行 `recv` 成功之後，會將響應體保存在當前的 [body](/zh-hant/client/http_websocket.html#body) 屬性中，可以通過 [body](/zh-hant/client/http_websocket.html#body) 屬性或者 [getBody](/zh-hant/client/http_websocket.html#getbody) 方法獲取。

### close

關閉連接。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 設置請求頭
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
    ]);
    
    // 設置超時
    $client->set(['timeout' => 5]);
    
    // 執行 GET 請求
    $client->setMethod('GET');
    $client->execute('/api/users');
    
    // 檢查結果
    if ($client->statusCode == 200) {
        echo $client->body;
    } else {
        echo "Error: " . $client->statusCode;
    }
    
    $client->close();
});
```

### ping

發送 `WebSocket` 心跳包。

```php
public function ping(string $data = ""): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 心跳包數據內容 | 空字符串 |

**返回值**：發送成功返回 `true`；連接不存在、已關閉、未完成 `WebSocket`，發送失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use Swoole\WebSocket\Frame;
use function Swoole\Coroutine\run;

run(function () {
    $client = new Client('127.0.0.1', 9501);
    $client->upgrade('/');  // 先升級爲 WebSocket 連接

    // 發送 Ping
    $client->ping('Hello');
    $client->disconnect();
    $client->close();
});
```

> [!WARNING]
> 底層會自動處理服務端發送的 `pong` 控制幀，如果想要手動處理 `pong` 控制幀的話，可以通過 [set](/zh-hant/client/http_websocket.html#set) 方法設置 `open_websocket_pong_frame` 爲 `true`。

### disconnect

關閉當前 `WebSocket` 連接。

```php
public function disconnect(int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$code` | 錯誤碼 | [`SWOOLE_WEBSOCKET_CLOSE_NORMAL`](/zh-hant/server/methods.html#disconnect) |
| `$reason` | 關閉原因 | 空字符串 |

**返回值**：關閉成功返回 `true`；連接不存在、已關閉、未完成 `WebSocket`，關閉失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function() {
    // 創建客戶端並連接到 WebSocket 服務端
    $client = new Client('127.0.0.1', 9501);
    
    // 升級爲 WebSocket 連接
    $ret = $client->upgrade('/');
    
    if (!$ret) {
        echo "WebSocket 握手失敗\n";
        return;
    }
    
    echo "WebSocket 連接成功！\n";
    
    // 發送消息
    $client->push("Hello WebSocket!");
    echo "發送: Hello WebSocket!\n";
    
    // 接收回復
    $response = $client->recv();
    if ($response && $response->data) {
        echo "收到回覆: {$response->data}\n";
    }
    
    // 繼續發送幾條消息
    for ($i = 1; $i <= 3; $i++) {
        $msg = "消息第 {$i} 條";
        $client->push($msg);
        echo "發送: {$msg}\n";
        
        $resp = $client->recv();
        if ($resp && $resp->data) {
            echo "收到回覆: {$resp->data}\n";
        }
        
        Coroutine::sleep(1);
    }
    
    // ===== 關鍵：使用 disconnect() 優雅關閉連接 =====
    echo "\n準備優雅斷開連接...\n";
    $client->disconnect();
    echo "已調用 disconnect()，發送了關閉幀\n";
    
    // 驗證連接狀態
    if ($client->isConnected()) {
        echo "連接仍然存在\n";
    } else {
        echo "連接已斷開\n";
    }
});
```

> [!WARNING]
> 和 [close](/zh-hant/client/http_websocket.html#close) 不同的是，`disconnect` 會發送一個 `WebSocket` 關閉幀給 `WebSocket` 服務端實現優雅關閉。
