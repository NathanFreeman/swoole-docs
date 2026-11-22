# TCP/UDP客戶端

`Swoole\Coroutine\Client` 是對底層 `Socket` 的協程化封裝，旨在爲 `TCP`、`UDP` 及 `Unix Socket` 協議提供統一的客戶端編程接口。使用時，創建 `Swoole\Coroutine\Client` 對象即可開始構建網絡請求。

## 方法

### __construct

構造函數

```php
public function __construct(int $type)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$type` | 表示連接的類型。 | 必填 |

**支持的類型**

| 常量                        | 協議族         | 傳輸協議    | 套接字類型           | 通信範圍         | 主要特點與適用場景                                                        |
|:--------------------------|:------------|:--------|:----------------|:-------------|:-----------------------------------------------------------------|
| **`SWOOLE_SOCK_TCP`**     | IPv4        | TCP     | 流式（SOCK_STREAM） | 跨網絡（局域網/互聯網） | **最常用**。面向連接、可靠、有序。適用於 HTTP、HTTPS、MySQL、Redis 等絕大多數網絡服務。         |
| **`SWOOLE_SOCK_TCP6`**    | IPv6        | TCP     | 流式（SOCK_STREAM） | 跨網絡（IPv6 網絡） | 功能與 TCP 相同，但使用 IPv6 地址。適用於需要 IPv6 支持的現代網絡環境。                     |
| **`SWOOLE_SOCK_UDP`**     | IPv4        | UDP     | 數據報（SOCK_DGRAM） | 跨網絡（局域網/互聯網） | 無連接、不可靠但速度快。適用於 DNS 查詢、音視頻流、實時遊戲、物聯網設備等場景。                       |
| **`SWOOLE_SOCK_UDP6`**    | IPv6        | UDP     | 數據報（SOCK_DGRAM） | 跨網絡（IPv6 網絡） | 功能與 UDP 相同，但使用 IPv6 地址。                                          |
| **`SWOOLE_UNIX_STREAM`**  | Unix Domain | 本地進程間通信 | 流式（SOCK_STREAM） | **僅限本機**     | 面向連接、可靠的本地 IPC。速度極快，不經過網絡棧。常用於同一機器上高性能服務間的通信（如 Nginx 與 PHP-FPM）。 |
| **`SWOOLE_UNIX_DGRAM`**   | Unix Domain | 本地進程間通信 | 數據報（SOCK_DGRAM） | **僅限本機**     | 無連接的本地 IPC。同樣高速，適用於本機內對可靠性要求不高的快速數據交換。                           |

> [!TIP]
> `SWOOLE_UNIX_STREAM` / `SWOOLE_UNIX_DGRAM` 與 [`SWOOLE_SOCK_UNIX_STREAM` / `SWOOLE_SOCK_UNIX_DGRAM`](/zh-hant/server/properties.html#type) 是同一組常量的兩種寫法，值相同，可互換使用。

### set

設置客戶端參數。

```php
public function set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 客戶端配置 | 必填 |

**返回值**：執行成功返回 `true`，操作失敗返回 `false`。

**支持的配置項**

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

連接服務器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 服務器地址【支持自動異步解析域名，`$host` 可直接傳入域名】 | 必填 |
| `$port` | 服務器端口 | `0` |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | `0.5` |
| `$flag` | `UDP客戶端` 設置 `$flag = 1` 時，連接會被“綁定”到 `connect` 方法中指定的 `$host` 和 `$port`。此後，它將只接收來自這個特定 IP 和端口的數據包，並丟棄所有其他來源的數據。這可以讓你在 UDP 這種 `無連接` 協議上，模擬出一個類似“連接”的行爲。<br>`TCP客戶端` 設置 `$flag = 1` 時，表示設置爲非阻塞模式，之後此 `fd` 會變成異步 IO，`connect` 會立即返回。 | `0` |

**返回值**：成功返回 `true`。失敗返回 `false`，請檢查 `errCode` 屬性獲取失敗原因。

### recv

從服務器端接收數據。

```php
public function recv(float $timeout = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：操作成功返回字符串，連接已關閉返回空字符串，返回 `false` 表示操作失敗，請檢查 `$client->errCode`。

### peek

從內核接收緩衝區中讀取數據，但並不從緩衝區中移除這些數據。

```php
public function peek(int $length = 65535): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 獲取的數據長度 | `65535` |

**返回值**：操作成功返回字符串，連接已被關閉 `peek` 會返回空字符串，緩存區爲空時返回 `false`，請檢查 `$client->errCode`。

> [!WARNING]
> `peek` 方法是非阻塞的，它會立即返回。
> 你可以把它理解成一次“偷看”或“預覽”，這讓你可以在不消費數據的情況下，先檢查一下緩衝區裏有什麼內容。

### send

發送數據。

```php
public function send(string $data, float $timeout = 0): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 爲發送的數據，必須爲字符串類型，支持二進制數據 | 必填 |
| `$timeout` | 超時時間，單位：秒。 | `0` |

**返回值**：發送成功返回寫入 `Socket` 緩存區的字節數，底層會盡可能地將所有數據發出。如果返回的字節數與傳入的 `$data` 長度不同，可能是 `Socket` 已被對端關閉，在下一次調用 `send` 或 `recv` 時將返回對應的錯誤碼。發送失敗返回 false，可以使用 `$client->errCode` 獲取錯誤原因。

### sendfile

將客戶端上的一個文件直接發送給已連接的 `TCP` 服務端

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 指定要發送文件的路徑 | 必填 |
| `$offset` | 上傳文件的偏移量【可以指定從文件的中間部分開始傳輸數據。此特性可用於支持斷點續傳。】 | `0` |
| `$length` | 發送數據的尺寸【默認爲整個文件的尺寸】 | `0` |

**返回值**：執行成功返回 `true`，如果傳入的文件不存在，將返回 `false`。

### sendto

專門爲 `UDP` 協議設計的方法，用於向指定的 `IP` 和 `端口` 發送數據。

```php
public function sendto(string $address, int $port, string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$address` | 目標地址。 | 必填 |
| `$port` | 目標端口。 | 必填 |
| `$data` | 需要發送的數據。 | 必填 |

**返回值**：成功時返回 `true`。失敗時返回 `false`，可以通過 `$client->errCode` 獲取錯誤碼。

### recvfrom

專門爲 `UDP` 協議準備的方法，用來接收數據並“順便”獲取發送方的地址信息。

```php
public function recvfrom(int $length, mixed &$address, mixed &$port = 0): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$length` | 接收的數據長度 | 必填 |
| `&$address` | 這是一個引用參數，調用後會被賦值爲發送方的 IP 地址。 | 必填 |
| `&$port` | 這也是一個引用參數，調用後會被賦值爲發送方的端口。 | `0` |

**返回值**：操作成功時返回接收到的數據字符串。如果服務器關閉了連接，返回空字符串。如果發生錯誤（如超時），返回 `false`，此時可以通過 `$client->errCode` 獲取具體的錯誤碼。

### enableSSL

動態開啓 SSL 隧道加密。

```php
public function enableSSL(): bool
```

**返回值**：執行成功返回 `true`，否則返回 `false`

> [!IMPORTANT]
> 只有在編譯 `swoole` 時開啓了 [--enable-openssl](/zh-hant/start/install.html#編譯選項詳解) 才能使用該函數。但是 `Swoole 6.2.0` 已經默認支持 `openssl`。

### getPeerCert

獲取服務器端證書信息。

```php
public function getPeerCert(): string|bool
```

**返回值**：成功返回一個 `X509` 證書字符串信息，失敗返回 `false`。

> [!IMPORTANT]
> 只有在編譯 `swoole` 時開啓了 `--enable-openssl` 才能使用該函數。但是 `Swoole 6.2.0` 已經默認支持 `openssl`。

### verifyPeerCert

驗證服務器端證書。

```php
public function verifyPeerCert(bool $allow_self_signed = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$allow_self_signed` | 是否允許自簽名證書；其它值：`true` | `false` 不允許自簽名證書 |

**返回值**：操作成功返回 `true`，發送失敗返回 `false`。

> [!IMPORTANT]
> 只有在編譯 `swoole` 時開啓了 `--enable-openssl` 才能使用該函數。但是 `Swoole 6.2.0` 已經默認支持 `openssl`。

### exportSocket

將當前連接導出爲 [`Swoole\Coroutine\Socket`](/zh-hant/client/socket.html) 對象，可調用更底層的方法。

```php
public function exportSocket(): Swoole\Coroutine\Socket
```

**返回值**：返回當前連接的 `Coroutine\Socket` 對象。

### isConnected

返回客戶端的連接狀態。

```php
public function isConnected(): bool
```

**返回值**：返回 `true`，表示當前已連接到服務器，返回 `false`，表示當前未連接到服務器。

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

### close

關閉客戶端。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，否則返回 `false`。


