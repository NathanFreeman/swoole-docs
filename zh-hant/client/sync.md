# 同步阻塞客戶端

`Swoole` 提供了 `Swoole\Client` 對 `TCP/UDP/Unix Socket` 客戶端的封裝，只需通過 `new Swoole\Client()` 即可使用。

相比傳統的 PHP `streams` 系列函數，`Client` 具有以下顯著優勢：

- **超時控制更靈活**：`stream` 函數的默認超時時間較長，若對端響應緩慢，可能導致請求長時間阻塞；而 `Client`
  支持更精細的超時設置，便於業務控制。
- **突破 8192 字節緩衝區限制**：`stream` 的 `fread` 默認緩衝區僅爲 8192 字節，無法高效處理 UDP 大包；`Client`
  則無此限制，可順暢收發大數據包。
- **支持 [`waitall`](#recv) 一次讀取完整包**：在已知包長度的場景下，`Client` 可通過 `waitall` 一次性讀取完整數據，無需像 `stream`
  那樣循環調用 `fread`，簡化編碼並提升效率。
- **支持 UDP Connect**：`Client` 支持 UDP 連接綁定，可有效避免 UDP 通信中常見的“串包”問題，提升數據準確性。
- **純 C 實現，性能更優**：`Client` 是專爲 Socket 處理優化的純 C 擴展，內部邏輯簡潔高效；而 `stream` 函數功能複雜、層次較多，性能開銷相對更大。
- **支持多客戶端併發管理**：配合 `swoole_client_select` 函數，可輕鬆實現對多個 `Client` 實例的併發控制，便於構建高併發網絡客戶端。

綜上，`Swoole\Client` 在易用性、性能、包處理能力和併發管理方面均優於傳統 `streams`，尤其適用於對穩定性和性能有較高要求的網絡通信場景。

## 屬性

### errCode

最近一次操作的錯誤碼。

```php
public int $errCode = 0;
```

### sock

當前連接的文件描述符。

```php
public int $sock = 0;
```

### reuse

是否重用當前連接。

```php
public bool $reuse = false;
```

### reuseCount

當前連接重用次數。

```php
public int $reuseCount = 0;
```

### type

當前連接類型。

```php
public int $type = 0;
```

### id

構造函數啓用長連接指定的 `key`。

```php
public string $id = '';
```

### setting

當前客戶端運行配置。

```php
public ?array $setting;
```

## 方法

### __construct

創建一個 `Swoole\Client` 的對象。

```php
public function __construct(int $type, bool $async = false, string $id = '')
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$type` | 表示連接的類型【支持 `SWOOLE_SOCK_TCP`、`SWOOLE_SOCK_TCP6`、`SWOOLE_SOCK_UDP`、`SWOOLE_SOCK_UDP6`】。 | 必填 |
| `$async` | 同步阻塞模式，只能設置爲 `false`。 | `false` |
| `$id` | 用於長連接的 `key`【默認使用 `IP:PORT` 作爲 `key`。相同的 `key`，即使 new 兩次也只用一個 TCP 連接】 | `IP:PORT` |

**長連接**

- 加入 `SWOOLE_KEEP` 標誌後，表示開啓長連接。此時，所創建的 `TCP` 連接在 `PHP` 請求結束或調用 [close](/zh-hant/client/sync.html#close) 方法時，並不會被關閉，而是會被保留以供複用。當再次調用 [connect](/zh-hant/client/sync.html#connect) 時，將優先複用之前已建立的連接。
- 默認情況下，長連接以 `IP:PORT` 作爲鍵值進行存儲與複用。你也可以通過第 `3` 個參數，手動指定自定義的鍵值。

```php
<?php
use Swoole\Client;
$client = new Client(SWOOLE_SOCK_TCP | SWOOLE_KEEP); // 開啓長連接
```

> [!WARNING]
> 在協程環境下使用此 `Swoole\Client` 會導致退化爲同步阻塞環境。

### set

設置客戶端運行配置。

```php
public function set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 客戶端運行時配置 | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**支持的配置項**

| 配置項                     | 說明                           | 示例值                                                                   |
|:------------------------|:-----------------------------|:----------------------------------------------------------------------|
| [`open_eof_check`](/zh-hant/server/setting.html#open-eof-check)        | 啓用 EOF 邊界檢測，數據包結尾匹配分隔符時才停止接收 | `true`                                                                |
| [`open_eof_split`](/zh-hant/server/setting.html#open-eof-split)        | 啓用 EOF 自動切分，逐字節掃描並按分隔符切分數據包  | `true`                                                                |
| [`package_eof`](/zh-hant/server/setting.html#package-eof)           | 指定 EOF 分隔符                   | `"\r\n"`                                                              |
| [`open_length_check`](/zh-hant/server/setting.html#open-length-check)     | 啓用長度檢測協議解析                   | `true`                                                                |
| [`package_length_type`](/zh-hant/server/setting.html#package-length-type)   | 長度字段類型，與 `pack` 函數一致         | `'N'`（4字節無符號長整型）                                                      |
| [`package_length_offset`](/zh-hant/server/setting.html#package-length-offset) | 長度字段在數據包中的起始偏移量（字節）          | `0`                                                                   |
| [`package_body_offset`](/zh-hant/server/setting.html#package-body-offset-package-body-start)   | 包體數據在數據包中的起始偏移量（字節）          | `4`                                                                   |
| [`package_length_func`](/zh-hant/server/setting.html#package-length-func)   | 自定義長度解析函數，返回完整數據包長度          | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/zh-hant/server/setting.html#package-max-length)    | 最大可接收數據包大小（字節）               | `8192`                                                                |
| [`open_mqtt_protocol`](/zh-hant/server/setting.html#open-mqtt-protocol)    | 啓用 MQTT 協議解析                 | `true`                                                                |
| [`socket_buffer_size`](/zh-hant/server/setting.html#socket-buffer-size)    | 發送緩衝區總大小（字節）                 | `1024 * 1024 * 2`                                                     |
| [`buffer_high_watermark`](/zh-hant/server/setting.html#buffer-high-watermark) | 高水位線閾值（字節）                   | `1024 * 1024`                                                         |
| [`buffer_low_watermark`](/zh-hant/server/setting.html#buffer-low-watermark)  | 低水位線閾值（字節）                   | `512 * 1024`                                                          |
| `bind_address`          | 多網卡環境下強制綁定的本地 IP 地址          | `'192.168.1.100'`                                                     |
| `bind_port`             | 強制綁定的本地端口號                   | `9501`                                                                |
| [`open_tcp_nodelay`](/zh-hant/server/setting.html#open-tcp-nodelay)      | 關閉 Nagle 算法，小數據包立即發送         | `true`                                                                |
| `socks5_host`           | SOCKS5 代理 IP 或域名             | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 代理端口                  | `1080`                                                                |
| `socks5_username`       | SOCKS5 代理認證用戶名               | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 代理認證密碼                | `'123456'`                                                            |
| `http_proxy_host`       | HTTP 代理 IP 或域名               | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP 代理端口                    | `8080`                                                                |
| `http_proxy_username`   | HTTP 代理認證用戶名                 | `'admin'`                                                             |
| `http_proxy_password`   | HTTP 代理認證密碼                  | `'123456'`                                                            |
| [`ssl_protocols`](/zh-hant/server/setting.html#ssl-protocols)         | 允許的 SSL/TLS 協議版本             | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/zh-hant/server/setting.html#ssl-compress)          | 是否啓用 SSL/TLS 壓縮              | `false`                                                               |
| [`ssl_cert_file`](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)         | 客戶端證書文件路徑（雙向驗證）              | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)          | 客戶端私鑰文件路徑（雙向驗證）              | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | 私鑰文件密碼（若已加密）                 | `'pass123'`                                                           |
| `ssl_host_name`         | SNI 域名，用於服務端返回正確證書           | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/zh-hant/server/setting.html#ssl-verify-peer)       | 是否驗證對端證書                     | `true`                                                                |
| [`ssl_allow_self_signed`](/zh-hant/server/setting.html#ssl-allow-self-signed) | 是否允許自簽名證書                    | `true`                                                                |
| [`ssl_cafile`](/zh-hant/server/setting.html#ssl-cafile)            | CA 證書文件路徑                    | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/zh-hant/server/setting.html#ssl-capath)            | CA 證書目錄路徑（需爲哈希目錄）            | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/zh-hant/server/setting.html#ssl-verify-depth)      | 證書鏈驗證的最大深度                   | `5`                                                                   |

> [!TIP]
> 必須在 [connect函數](/zh-hant/client/sync.html#connect) 執行之前調用。

### connect

連接服務器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 服務器地址【支持自動異步解析域名，`$host` 可直接傳入域名】 | 必填 |
| `$port` | 服務器端口 | `0` |
| `$timeout` | 設置超時時間；值單位：秒【支持浮點型，如 `1.5` 表示 `1s` + `500ms`】 | `0.5` |
| `$flag` | `UDP客戶端` 設置 `$flag = 1` 時，連接會被“綁定”到 `connect` 方法中指定的 `$host` 和 `$port`。此後，它將只接收來自這個特定 IP 和端口的數據包，並丟棄所有其他來源的數據。這可以讓你在 UDP 這種 `無連接` 協議上，模擬出一個類似“連接”的行爲；`TCP客戶端` 設置 `$flag = 1` 時，表示設置爲非阻塞模式，之後此 `fd` 會變成異步 IO，`connect` 會立即返回。如果將 `$flag` 設置爲 `1`，那麼在 `send/recv` 前必須使用 [swoole_client_select](/zh-hant/client/sync.html#swoole-client-select) 來檢測是否可以讀寫。 | `0` |

**返回值**：成功返回 `true`。失敗返回 `false`，請檢查 `errCode` 屬性獲取失敗原因。

**注意**

- 如果 `$flag` 爲 `0`，`connect` 方法會阻塞，直到連接成功並返回 `true`。這時候就可以向服務器端發送數據或者收取數據了。
- `connect` 失敗後如果希望重連一次，必須先進行 [close](/zh-hant/client/sync.html#close) 關閉舊的 `socket`，否則會返回 `EINPROGRESS` 錯誤，因爲當前的 `socket` 正在連接服務器，客戶端並不知道是否連接成功，所以無法再次執行 `connect`。調用 `close` 會關閉當前的 `socket`，底層重新創建新的 `socket` 來進行連接。

### recv

從服務器端接收數據。

```php
public function recv(int $size = 65536, int $flag = 0): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$size` | 接收數據的緩存區最大長度【此參數不要設置過大，否則會佔用較大內存】 | `65536` |
| `$flag` | 用於控制接收行爲的標誌位，可以組合使用。 | `0` |

**返回值**：成功收到數據返回字符串；連接關閉返回空字符串；失敗返回 `false`，並設置 `$client->errCode` 屬性。

**$flag 參數支持的可選常量**

| 常量                            | 說明                                                                             |
|-------------------------------|--------------------------------------------------------------------------------|
| `Swoole\Client::MSG_WAITALL`  | 等待所有數據。recv 會一直阻塞，直到接收到的數據長度達到 $size 參數指定的字節數。注意：該常量的數值在不同文檔中有差異，使用時建議直接使用常量名。 |
| `Swoole\Client::MSG_DONTWAIT` | 非阻塞模式。如果當前沒有數據可讀，recv 會立即返回，而不是阻塞等待。                                           |
| `Swoole\Client::MSG_PEEK`     | 窺視數據。查看數據但不從接收緩衝區中移除。再次調用 recv 時，仍然可以讀到相同的數據。                                  |
| `Swoole\Client::MSG_OOB`      | 接收帶外數據。用於處理TCP緊急數據。                                                            |

### send

發送數據到遠程服務器，必須在建立連接後，纔可向對端發送數據。

```php
public function send(string $data, int $flag = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 發送內容【支持二進制數據】 | 必填 |

**返回值**：成功發送，返回已發數據長度，失敗返回 `false`，並設置 `errCode` 屬性。

**注意**

- 如果未執行 [connect](/zh-hant/client/sync.html#connect)，調用 `send` 會觸發警告。
- 發送的數據沒有長度限制，太多數據會導致緩存區 塞滿，程序會阻塞等待可寫

### sendfile

發送文件到服務器，本函數是基於 `sendfile` 操作系統調用實現

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 指定要發送文件的路徑 | 必填 |
| `$offset` | 上傳文件的偏移量【可以指定從文件的中間部分開始傳輸數據。此特性可用於支持斷點續傳。】 | `0` |
| `$length` | 發送數據的尺寸【默認爲整個文件的尺寸】 | `0` |

**返回值**：執行成功返回 `true`，如果傳入的文件不存在，將返回 `false`。

> [!WARNING]
> `sendfile` 會一直阻塞直到整個文件發送完畢或者發生致命錯誤。

### sendto

向任意 `IP:PORT` 的主機發送 `UDP` 數據包，僅支持 `SWOOLE_SOCK_UDP/SWOOLE_SOCK_UDP6` 類型

```php
public function sendto(string $ip, int $port, string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$ip` | 目標主機的 `IP` 地址，支持 `IPv4/IPv6` | 必填 |
| `$port` | 目標主機的端口 | 必填 |
| `$data` | 要發送的數據內容【不得超過 `64K`】 | 必填 |

**返回值**：執行成功返回 `true`，否則返回 `false`

### enableSSL

動態開啓 SSL 隧道加密。

```php
public function enableSSL(): bool
```

**返回值**：執行成功返回 `true`，否則返回 `false`

> [!IMPORTANT]
> 只有在編譯 `swoole` 時開啓了 `--enable-openssl` 才能使用該函數。但是 `Swoole 6.2.0` 已經默認支持 `openssl`。

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
public function verifyPeerCert(): bool
```

**返回值**：驗證成功返回 `true`，否則返回 `false`

> [!IMPORTANT]
> 只有在編譯 `swoole` 時開啓了 `--enable-openssl` 才能使用該函數。但是 `Swoole 6.2.0` 已經默認支持 `openssl`。

### isConnected

返回客戶端的連接狀態。

```php
public function isConnected(): bool
```

**返回值**：返回 `true`，表示當前已連接到服務器，返回 `false`，表示當前未連接到服務器。

### getsockname

用於獲取客戶端 socket 的本地 host:port。

```php
public function getsockname(): array|false
```

**返回值**：操作成功返回一個數組，否則返回 `false`。

**返回值結構如下**

| 參數名  | 類型     | 說明      |
|------|--------|---------|
| host | string | 客戶端IP地址 |
| port | int    | 客戶端端口號  |

### getpeername

獲取對端 `socket` 的 IP 地址和端口。

```php
public function getpeername(): array|false
```

**返回值**：操作成功返回一個數組，否則返回 `false`。

**返回結構如下**

| 參數名  | 類型     | 說明      |
|------|--------|---------|
| host | string | 對端（服務器）IP地址 |
| port | int    | 對端（服務器）端口號  |

### close

關閉連接。

```php
public function close(bool $force = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$force` | 強制關閉連接，可以用於關閉指定 `SWOOLE_KEEP` 標誌位的長連接。 | `false` |

**返回值**：操作成功返回 `true`，否則返回 `false`。

**注意**

- 啓用 `SWOOLE_KEEP` 長連接後，close 調用的第一個參數要設置爲 `true` 表示強行銷燬長連接。
- 當一個連接被 `close` 後不要再次發起 `connect`。正確的做法是銷燬當前的 `Swoole\Client`，重新創建一個 `Swoole\Client` 併發起新的連接。

### shutdown

關閉客戶端

```php
public function shutdown(int $how): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$how` | 設置如何關閉客戶端 | 必填 |

**返回值**：操作成功返回 `true`，否則返回 `false`。

**支持的方式有：**

| 類型                         | 說明     |
|----------------------------|--------|
| `Swoole\Client::SHUT_RDWR` | 關閉讀寫   |
| `Swoole\Client::SHUT_RD`   | 只關閉讀操作 |
| `Swoole\Client::SHUT_WR`   | 只關閉寫操作 |

### getSocket

獲取底層的 `socket` 句柄，返回的對象爲 `sockets` 資源句柄。

```php
public function getSocket(): \Socket|false
```

**返回值**：操作成功返回 `Socket` 對象，否則返回 `false`。

> [!IMPORTANT]
> 此方法需要依賴 `php sockets` 擴展，並且編譯時需要開啓 [--enable-sockets](/zh-hant/start/install.html#編譯選項詳解) 選項。

### swoole_client_select

用於在同步阻塞的 Swoole 客戶端中，同時監控一個或多個連接的狀態變化，比如是否有數據可讀、是否可寫、或者是否發生了錯誤。

```php
function swoole_client_select(?array &$read, ?array &$write, ?array &$except, ?float $timeout = 0.5): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `&$read` | 存放需要監聽是否可讀的客戶端對象數組。函數返回後，此數組會被修改，只保留那些真正可讀的客戶端。 | 必填 |
| `&$write` | 存放需要監聽是否可寫的客戶端對象數組。函數返回後，此數組會被修改，只保留那些真正可寫的客戶端。 | 必填 |
| `&$except` | 存放需要監聽是否發生錯誤的客戶端對象數組。函數返回後，此數組會被修改，只保留那些發生錯誤的客戶端。 | 必填 |
| `$timeout` | 超時時間，單位爲秒。 | `0.5` |

**返回值**：調用成功返回事件的數量，並修改 `&$read`、`&$write`、`&$except` 數組；返回 `0` 表示在規定的時間內沒有任何 `IO` 可用，`select` 調用已超時；失敗返回 `false`。

**示例**

```php
<?php

use Swoole\Client;

$clients = array();

for($i=0; $i< 20; $i++) {
    $client = new Client(SWOOLE_SOCK_TCP, SWOOLE_SOCK_SYNC); //同步阻塞
    $ret = $client->connect('127.0.0.1', 9501, 0.5, 0);
    if(!$ret) {
        echo "Connect Server fail.errCode=".$client->errCode;
    } else {
        $client->send("HELLO WORLD\n");
        $clients[$client->sock] = $client;
    }
}

while (!empty($clients)) {
    $write = $error = array();
    $read = array_values($clients);
    $n = swoole_client_select($read, $write, $error, 0.6);
    if ($n > 0) {
        foreach ($read as $index => $c) {
            echo "Recv #{$c->sock}: " . $c->recv() . "\n";
            unset($clients[$c->sock]);
        }
    }
}
```

## 示例

```php
<?php
use Swoole\Client;
$client = new Client(SWOOLE_SOCK_TCP);
if (!$client->connect('127.0.0.1', 9501, -1)) {
    exit("connect failed. Error: {$client->errCode}\n");
}
$client->send("hello world\n");
echo $client->recv();
$client->close();
```
