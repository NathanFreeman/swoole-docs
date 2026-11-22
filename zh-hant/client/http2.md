# HTTP2協程客戶端

`Swoole\Coroutine\Http2\Client` 是 `Swoole` 擴展提供的一個高性能、協程驅動的 `HTTP/2` 客戶端。它讓你能在 `PHP` 中通過協程，以非阻塞、同步代碼的方式連接 `HTTP/2` 服務器。

## 屬性

### errCode

最後一次操作的錯誤碼。成功時爲 0，失敗時爲具體的錯誤代碼。

```php
public int $errCode = 0;
```

### errMsg

最後一次操作的錯誤信息。

```php
public string $errMsg = '';
```

### sock

`Socket` 文件描述符。未連接時值爲 `-1`，連接成功後爲實際的 `socket fd`。

```php
public int $sock = -1;
```

### type

客戶端類型標識

```php
public int $type = 0;
```

### setting

通過 [set](/zh-hant/client/http2.html#set) 方法設置的客戶端配置選項只讀數組。未設置任何配置時爲 `null`。

```php
public ?array $setting = null;
```

### socket

`Socket` 資源對象。允許直接操作底層的 `socket` 資源。

```php
public ?\Socket $socket = null;
```

### connected

連接狀態。`true` 表示當前已連接到服務器，`false` 表示未連接。

```php
public bool $connected = false;
```

### host

遠程服務器的主機地址。在構造函數中設置的 IP 地址或域名。

```php
public ?string $host = null;
```

### port

遠程服務器的端口號。構造函數中設置的端口。

```php
public int $port = 0;
```

### ssl

`SSL/TLS` 加密標誌。`true` 表示啓用了 `SSL` 連接，`false` 表示未啓用。

```php
public bool $ssl = false;
```

### serverLastStreamId

服務器端最後使用的 `Stream ID`。用於跟蹤 `HTTP/2` 連接中服務器端發起的最後一個流標識符，在處理服務器推送或檢測連接狀態時有用

```php
public int $serverLastStreamId = 0;
```

## 方法

### __construct

構造函數。

```php
public function __construct(string $host, int $port = 80, bool $open_ssl = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 目標主機的 IP 地址【`$host` 如果爲域名底層需要進行一次 `DNS` 查詢】 | 必填 |
| `$port` | 目標端口【`Http` 一般爲 `80` 端口，`Https` 一般爲 `443` 端口】 | `80` |
| `$open_ssl` | 是否開啓 `TLS/SSL` 隧道加密【`https` 網站必須設置爲 `true`】；其它值：`true` | `false` |

### set

設置客戶端參數，如超時時間、併發流限制等。

```php
public function set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 客戶端配置 | 必填 |

**返回值**：執行成功返回 `true`，操作失敗返回 `false`。

**支持的配置**

| 配置項                     | 正確說明                                                                                  | 示例值                                                                   |
|:------------------------|:--------------------------------------------------------------------------------------|:----------------------------------------------------------------------|
| `timeout`               | **全局超時**（秒），統一控制連接、讀取、寫入的超時時間。優先級低於 `connect_timeout`、`read_timeout`、`write_timeout`。 | `0.5`                                                                 |
| `connect_timeout`       | **連接超時**（秒），單獨控制 TCP 握手階段的超時時間。                                                       | `1.0`                                                                 |
| `read_timeout`          | **讀取超時**（秒），單獨控制 `recv()` 等待數據的超時時間。                                                  | `0.5`                                                                 |
| `write_timeout`         | **寫入超時**（秒），單獨控制 `send()` 發送數據的超時時間。                                                  | `0.5`                                                                 |
| `bind_address`          | 多網卡環境下，強制綁定本地 IP 地址。需與 `bind_port` 同時使用。                                              | `'192.168.1.100'`                                                     |
| `bind_port`             | 強制綁定本地端口號。需與 `bind_address` 同時使用。                                                     | `9501`                                                                |
| [`socket_buffer_size`](/zh-hant/server/setting.html#socket-buffer-size)    | 發送緩衝區總大小（字節）。                                                                         | `1024 * 1024 * 2`                                                     |
| [`open_tcp_nodelay`](/zh-hant/server/setting.html#open-tcp-nodelay)      | 關閉 Nagle 算法，小數據包立即發送，不等待合併。                                                           | `true`                                                                |
| `socks5_host`           | SOCKS5 代理服務器 IP 或域名。                                                                  | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 代理服務器端口。                                                                       | `1080`                                                                |
| `socks5_username`       | SOCKS5 代理認證用戶名（可選）。                                                                   | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 代理認證密碼（可選）。                                                                    | `'123456'`                                                            |
| `http_proxy_host`       | HTTP 代理服務器 IP 或域名。                                                                    | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP 代理服務器端口。                                                                         | `8080`                                                                |
| `http_proxy_username`   | HTTP 代理認證用戶名（可選）。                                                                     | `'admin'`                                                             |
| `http_proxy_password`   | HTTP 代理認證密碼（可選）。                                                                      | `'123456'`                                                            |
| `open_ssl`              | 啓用 SSL/TLS 加密（等同於在構造函數中使用 `SWOOLE_SSL` 標誌）。                                           | `true`                                                                |
| [`open_http2_protocol`](/zh-hant/server/setting.html#open-http2-protocol)   | 啓用 HTTP/2 協議支持（需在 SSL 之上使用）。                                                          | `true`                                                                |
| [`open_eof_check`](/zh-hant/server/setting.html#open-eof-check)        | 啓用 EOF 邊界檢測，僅當數據包結尾匹配分隔符時才停止接收。                                                       | `true`                                                                |
| [`open_eof_split`](/zh-hant/server/setting.html#open-eof-split)        | 啓用 EOF 自動切分，逐字節掃描並按分隔符切分完整數據包。                                                        | `true`                                                                |
| [`package_eof`](/zh-hant/server/setting.html#package-eof)           | 指定 EOF 分隔符。                                                                           | `"\r\n"`                                                              |
| `open_fastcgi_protocol` | 啓用 FastCGI 協議解析。                                                                      | `true`                                                                |
| [`open_mqtt_protocol`](/zh-hant/server/setting.html#open-mqtt-protocol)    | 啓用 MQTT 協議解析。                                                                         | `true`                                                                |
| [`open_length_check`](/zh-hant/server/setting.html#open-length-check)     | 啓用長度檢測協議解析。                                                                           | `true`                                                                |
| [`package_length_type`](/zh-hant/server/setting.html#package-length-type)   | 長度字段類型，與 `pack()` 函數一致，如 `'N'` 表示 4 字節無符號長整型。                                         | `'N'`                                                                 |
| [`package_length_offset`](/zh-hant/server/setting.html#package-length-offset) | 長度字段在數據包中的起始偏移量（字節）。                                                                  | `0`                                                                   |
| [`package_body_offset`](/zh-hant/server/setting.html#package-body-offset-package-body-start)   | 包體數據在數據包中的起始偏移量（字節）。                                                                  | `4`                                                                   |
| [`package_length_func`](/zh-hant/server/setting.html#package-length-func)   | 自定義長度解析函數，返回完整數據包的長度。                                                                 | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/zh-hant/server/setting.html#package-max-length)    | 最大可接收數據包大小（字節）。                                                                       | `8192`                                                                |
| [`ssl_protocols`](/zh-hant/server/setting.html#ssl-protocols)         | 允許的 SSL/TLS 協議版本。                                                                     | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/zh-hant/server/setting.html#ssl-compress)          | 是否啓用 SSL/TLS 壓縮。                                                                      | `false`                                                               |
| [`ssl_cert_file`](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)         | 客戶端證書文件路徑（雙向驗證時使用）。                                                                   | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)          | 客戶端私鑰文件路徑（雙向驗證時使用）。                                                                   | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | 私鑰文件密碼（若已加密）。                                                                         | `'pass123'`                                                           |
| `ssl_host_name`         | SNI 域名，用於服務端返回正確的 SSL 證書。                                                             | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/zh-hant/server/setting.html#ssl-verify-peer)       | 是否驗證對端證書。                                                                             | `true`                                                                |
| [`ssl_allow_self_signed`](/zh-hant/server/setting.html#ssl-allow-self-signed) | 是否允許自簽名證書。                                                                            | `true`                                                                |
| [`ssl_cafile`](/zh-hant/server/setting.html#ssl-cafile)            | CA 證書文件路徑，用於驗證對端證書籤名。                                                                 | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/zh-hant/server/setting.html#ssl-capath)            | CA 證書目錄路徑（需爲哈希目錄），`ssl_cafile` 未設置或無效時使用。                                             | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/zh-hant/server/setting.html#ssl-verify-depth)      | 證書鏈驗證的最大深度，超過則終止驗證。                                                                   | `5`                                                                   |
| [`ssl_ciphers`](/zh-hant/server/setting.html#ssl-ciphers)           | 設置 OpenSSL 加密算法套件。                                                                    | `'ECDHE-RSA-AES128-GCM-SHA256'`                                       |
| [`ssl_ecdh_curve`](/zh-hant/server/setting.html#ssl-ecdh-curve)        | 控制 ECDH 密鑰交換所使用的橢圓曲線。                                                                 | `'secp256r1'`                                                         |
| `ssl_grease`            | 啓用 TLS GREASE（防僵化）擴展，增強與不標準服務端的兼容，只適用於谷歌的`BoringSSL`。                                 | `true`                                                                |

### connect

連接到目標服務器。

```php
public function connect(): bool
```

**返回值**：連接成功，返回 `true`；連接失敗，返回 `false`，請檢查 `errCode` 屬性獲取錯誤碼。

### stats

獲取流狀態。

```php
public function stats(string $key = ''): array|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 指定的 key | `''` |

**返回值**：指定 `$key` 則返回特定值，否則返回數組。

### isStreamExist

判斷指定的流是否存在。

```php
public function isStreamExist(int $streamId): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$streamId` | 指定的流 id。 | 必填 |

**返回值**：流存在返回 `true`，不存在返回 `false`。

### send

向服務器發送請求，底層會自動建立一個 `Http2` 的 `stream`。可以同時發起多個請求。

```php
public function send(\Swoole\Coroutine\Http2\Request $request): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$request` | 發送 [Swoole\Coroutine\Http2\Request](/zh-hant/client/request.html) 對象 | 必填 |

**返回值**：成功返回流的編號，編號爲從 `1` 開始自增的奇數；失敗返回 `false`。

### write

向服務器發送更多數據幀，可以多次調用向同一個 `stream` 寫入數據幀。

```php
public function write(int $streamId, mixed $data, bool $end = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$streamId` | 流編號，由 `send` 方法返回 | 必填 |
| `$data` | 數據幀的內容，可以爲字符串或數組 | 必填 |
| `$end` | 是否關閉流；其它值：`true` | `false` |

**返回值**：執行成功返回 `true`，操作失敗返回 `false`。

> [!WARNING]
> 如果要使用 `write` 分段發送數據幀，必須在 `send` 請求時將 [`$request->pipeline`](/zh-hant/client/request.html#pipeline) 設置爲 `true`。
> 當發送 `end` 爲 `true` 的數據幀之後，流將關閉，之後不能再調用 `write` 向此 `stream` 發送數據。

### recv

接收請求。

```php
public function recv(float $timeout = 0): \Swoole\Coroutine\Http2\Response|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：成功後返回 [Swoole\Coroutine\Http2\Response](/zh-hant/client/response.html) 對象。

### read

和 `recv()` 基本一致, 區別在於對於 `pipeline` 類型的響應, `read` 可以分多次讀取, 每次讀取到部分的內容以節省內存或是儘快地接收到推送信息，而 `recv` 總是將所有幀拼接成一個完整響應後纔會返回。

```php
public function read(float $timeout = 0): \Swoole\Coroutine\Http2\Response|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時時間，參考客戶端超時規則；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：成功後返回 [Swoole\Coroutine\Http2\Response](/zh-hant/client/response.html) 對象。

### ping

用於測量來自發送方的最小往返時間，以及確定空閒連接是否仍然有效。

```php
public function ping(): bool
```

**返回值**：執行成功返回 `true`，操作失敗返回 `false`。

### goaway

向服務端發送 `GOAWAY` 幀，通知服務端連接即將關閉，並允許優雅地處理完已存在的請求。

```php
public function goaway(int $error_code = SWOOLE_HTTP2_ERROR_NO_ERROR, string $debug_data = ''): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$error_code` | `HTTP/2` 錯誤碼，用於說明關閉連接的原因 | `SWOOLE_HTTP2_ERROR_NO_ERROR` |
| `$debug_data` | 可選的調試數據，會包含在發送的 `GOAWAY` 數據包中 | `''` |

**返回值**：發送成功返回 `true`，發送失敗返回 `false`。

| 常量名                                    | 中文定義                                  |
|:---------------------------------------|:--------------------------------------|
| SWOOLE_HTTP2_ERROR_NO_ERROR            | 沒有錯誤（通常用於優雅地關閉連接）                     |
| SWOOLE_HTTP2_ERROR_PROTOCOL_ERROR      | 協議錯誤（檢測到未特別指定的協議錯誤）                   |
| SWOOLE_HTTP2_ERROR_INTERNAL_ERROR      | 內部錯誤（端點遇到意外的內部錯誤）                     |
| SWOOLE_HTTP2_ERROR_FLOW_CONTROL_ERROR  | 流量控制錯誤（對端違反了流量控制協議）                   |
| SWOOLE_HTTP2_ERROR_SETTINGS_TIMEOUT    | 設置超時（發送了 SETTINGS 幀但未及時收到響應）          |
| SWOOLE_HTTP2_ERROR_STREAM_CLOSED       | 流關閉（在流半關閉之後收到了一個幀）                    |
| SWOOLE_HTTP2_ERROR_FRAME_SIZE_ERROR    | 幀大小錯誤（收到的幀的大小無效或超過最大尺寸）               |
| SWOOLE_HTTP2_ERROR_REFUSED_STREAM      | 被拒絕的流（在執行任何應用處理之前拒絕了該流）               |
| SWOOLE_HTTP2_ERROR_CANCEL              | 取消（表明不再需要指定的流）                        |
| SWOOLE_HTTP2_ERROR_COMPRESSION_ERROR   | 壓縮錯誤（無法爲連接維護報頭壓縮的上下文）                 |
| SWOOLE_HTTP2_ERROR_CONNECT_ERROR       | 連接錯誤（爲某個連接請求建立的連接被重置或異常關閉）            |
| SWOOLE_HTTP2_ERROR_ENHANCE_YOUR_CALM   | 提高你的穩定性（檢測到遠端表現出可能產生過大負載的行爲）          |
| SWOOLE_HTTP2_ERROR_INADEQUATE_SECURITY | 安全性不夠（底層傳輸存在不滿足最低安全需求的屬性）             |
| SWOOLE_HTTP2_ERROR_HTTP_1_1_REQUIRED   | 需要 HTTP/1.1（要求使用 HTTP/1.1 而不是 HTTP/2） |

### close

關閉連接。

```php
public function close(): bool
```

**返回值**：執行成功返回 `true`，操作失敗返回 `false`。

## 示例

```php
<?php
use Swoole\Coroutine\Http2\Request;
use Swoole\Coroutine\Http2\Client;
use function Swoole\Coroutine\run;

run(function () {
    $domain = 'www.zhihu.com';
    $cli = new Client($domain, 443, true);
    $cli->set([
        'timeout' => -1,
        'ssl_host_name' => $domain
    ]);
    $cli->connect();
    $req = new Request();
    $req->method = 'POST';
    $req->path = '/api/v4/answers/300000000/voters';
    $req->headers = [
        'host' => $domain,
        'user-agent' => 'Chrome/49.0.2587.3',
        'accept' => 'text/html,application/xhtml+xml,application/xml',
        'accept-encoding' => 'gzip'
    ];
    $req->data = '{"type":"up"}';
    $cli->send($req);
    $response = $cli->recv();
    var_dump(assert(json_decode($response->data)->error->code === 10002));
    $cli->close();
});
```

