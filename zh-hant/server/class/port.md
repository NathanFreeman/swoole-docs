# Swoole\Server\Port

如果你已經閱讀過[多端口監聽](/zh-hant/server/port.html)，會發現 `Swoole\Server\Port` 是 `Swoole` 服務器中實現單機多端口混合協議的核心類。它讓你可以爲一個異步服務器主服務添加多個額外的監聽端口，併爲每個端口獨立設置協議解析規則和事件回調函數。

你不能直接 `new` 這個對象，而是通過主服務器的 [listen](/zh-hant/server/methods.html#listen) 方法來創建。

## 方法

### on

爲額外端口綁定專屬的回調函數。這樣，同一個 [worker](/zh-hant/server/process_thread.html) 進程在處理不同端口的連接時，會執行不同的業務代碼。

```php
public function on(string $event_name, callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event_name` | 事件名稱 | 必填 |
| `$callback` | 設置事件回調函數 | 必填 |

| 該方法支持設置的事件 | 說明 |
| :--- | :--- |
| [connect](/zh-hant/server/events.html#connect) | 客戶端連接建立時觸發 |
| [close](/zh-hant/server/events.html#close) | 客戶端連接關閉時觸發 |
| [disconnect](/zh-hant/server/events.html#disconnect) | WebSocket 連接斷開時觸發 |
| [receive](/zh-hant/server/events.html#receive) | 接收 TCP 數據流時觸發 |
| [packet](/zh-hant/server/events.html#packet) | 接收 UDP 數據包時觸發 |
| [message](/zh-hant/server/events.html#message) | 接收 WebSocket 消息時觸發 |
| [request](/zh-hant/server/events.html#request) | 接收到 HTTP 請求時觸發 |
| [handshake](/zh-hant/server/events.html#handshake) | WebSocket 握手時觸發 |
| [beforeHandshakeResponse](/zh-hant/server/events.html#beforehandshakeresponse) | 發送 WebSocket 握手響應前觸發 |
| [open](/zh-hant/server/events.html#open) | WebSocket 握手成功後連接開啓時觸發 |

### set

爲主端口和額外端口配置不同的通信協議。例如，主端口處理 `WebSocket`，額外端口處理 `TCP` 流式處理

```php
public function set(array $settings): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 設置服務器運行時的配置 | 必填 |

| 該方法支持的配置項                                                                      | 說明                                                                                                 |
|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| [backlog](/zh-hant/server/setting.html#backlog)                                     | 控制 TCP 全連接隊列（Accept Queue）的最大長度。                                                                   |
| [socket_buffer_size](/zh-hant/server/setting.html#socket-buffer-size)               | 該配置控制着服務端向客戶端發送數據的緩衝區大小                                                                            |
| [heartbeat_idle_time](/zh-hant/server/setting.html#heartbeat-idle-time)             | 客戶端 TCP 連接最大允許空閒的時間，單位爲秒。表示一個客戶端連接如果 heartbeat_idle_time 秒內未向服務器發送任何數據，此連接將被強制關閉。                      |
| [buffer_high_watermark](/zh-hant/server/setting.html#buffer-high-watermark)         | 設置服務端和客戶端的緩衝區的高水位線。它本身不直接限制內存大小，而是作爲一個預警閾值。單位爲字節                                                   |
| [buffer_low_watermark](/zh-hant/server/setting.html#buffer-low-watermark)           | 設置服務端和客戶端的緩衝區的低水位線。它本身不直接限制內存大小，而是作爲一個預警閾值。單位爲字節                                                   |
| [max_idle_time](/zh-hant/server/setting.html#max-idle-time)                         | 該配置指定 TCP 連接的最大空閒時長。若連接在 max_idle_time 內未發生任何讀寫操作，底層將主動關閉該連接                                       |
| [open_tcp_nodelay](/zh-hant/server/setting.html#open-tcp-nodelay)                   | 關閉 Nagle 算法，讓小數據包能立刻被髮送出去，而不是等待合併。                                                                 |
| [tcp_defer_accept](/zh-hant/server/setting.html#tcp-defer-accept)                   | tcp_defer_accept 參數用於控制服務器在新建 TCP 連接時，是否延遲分配套接字和應用層資源                                              |
| [open_tcp_keepalive](/zh-hant/server/setting.html#open-tcp-keepalive)               | 開啓 TCP 的 KeepAlive 機制，讓操作系統內核自動檢測連接是否仍然有效，並自動清理已失效的連接。                                             |
| [tcp_keepidle](/zh-hant/server/setting.html#tcp-keepidle)                           | TCP 連接在空閒多長時間後，系統內核纔開始發送第一個 KeepAlive 探測包，檢測這個連接是否還活着。                                             |
| [tcp_keepinterval](/zh-hant/server/setting.html#tcp-keepinterval)                   | TCP KeepAlive 探測包的發送間隔。它決定了在第一次探測沒有收到響應後，每隔多久重新發送一次探測包。                                            |
| [tcp_keepcount](/zh-hant/server/setting.html#tcp-keepcount)                         | TCP KeepAlive 探測失敗後，關閉連接前的最大重試次數。它決定了在收到探測包的響應之前，系統願意嘗試多少次。                                        |
| [tcp_user_timeout](/zh-hant/server/setting.html#tcp-user-timeout)                   | 當發送方發送數據後，如果遲遲收不到對方的 ACK 確認，TCP 會按指數退避算法重傳數據。累計重傳時間一旦超過 tcp_user_timeout 的值，連接會被關閉。                  |
| [tcp_fastopen](/zh-hant/server/setting.html#tcp-fastopen)                           | 開啓 TCP 快速握手特性，它允許在三次握手過程中就攜帶應用數據，從而減少一個 RTT（往返時間）的延遲。                                              |
| [open_eof_check](/zh-hant/server/setting.html#open-eof-check)                       | 此選項用於檢測客戶端發來的數據：僅當數據包結尾匹配指定分隔符（如 `\r\n`）時，底層纔會停止接收數據；否則，數據將被持續拼接，直到超出緩存區限制或接收超時纔會中止。                 |
| [open_eof_split](/zh-hant/server/setting.html#open-eof-split)                       | 底層逐字節掃描數據流，每次遇到指定分隔符（如 `\r\n`）就自動切分並交付一個完整數據包                                                        |
| [package_eof](/zh-hant/server/setting.html#package-eof)                             | 設置數據包指定分隔符。                                                                                        |
| [open_length_check](/zh-hant/server/setting.html#open-length-check)                 | 啓用數據包長度檢測協議解析功能。                                                                                   |
| [package_length_type](/zh-hant/server/setting.html#package-length-type)             | 指定長度字段的類型（如 'N' 表示 4 字節無符號長整型）。與 PHP 的 pack 函數一樣。                                                  |
| [package_length_offset](/zh-hant/server/setting.html#package-length-offset)         | 定位長度字段位置的核心參數。它告訴服務器：“長度字段這個值，存放在整個數據包的第幾個字節”。                                                     |
| [package_body_offset](/zh-hant/server/setting.html#package-body-offset-package-body-start)             | 定位包體數據起始位置的偏移量。告訴服務器：真正的業務數據（包體）從數據包的第幾個字節開始。                                                      |
| [package_length_func](/zh-hant/server/setting.html#package-length-func)             | 自定義一個 PHP 函數來告訴 Swoole 一個完整數據包究竟有多長。這個函數會接收當前接收到的部分數據（存儲在一個緩衝區中），然後你需要在這個函數里實現你的核心邏輯：解析並返回整個數據包的長度。 |
| [package_max_length](/zh-hant/server/setting.html#package-max-length)               | 設置能接收的最大數據包尺寸，單位爲字節。                                                                               |
| [open_http_protocol](/zh-hant/server/setting.html#open-http-protocol)               | 開啓 HTTP 協議                                                                                         |
| [open_websocket_protocol](/zh-hant/server/setting.html#open-websocket-protocol)     | 開啓 WebSocket 協議                                                                                    |
| [open_http2_protocol](/zh-hant/server/setting.html#open-http2-protocol)             | 開啓 HTTP2 協議                                                                                        |
| [open_mqtt_protocol](/zh-hant/server/setting.html#open-mqtt-protocol)               | 開啓 MQTT 協議                                                                                         |
| [open_redis_protocol](/zh-hant/server/setting.html#open-redis-protocol)             | 開啓 Redis 協議                                                                                        |
| [ssl_compress](/zh-hant/server/setting.html#ssl-compress)                           | 設置是否啓用 SSL/TLS 壓縮                                                                                  |
| [ssl_protocols](/zh-hant/server/setting.html#ssl-protocols)                         | 設置 OpenSSL 隧道加密的協議                                                                                 |
| [ssl_verify_peer](/zh-hant/server/setting.html#ssl-verify-peer)                     | 服務 SSL 設置驗證對端證書                                                                                    |
| [ssl_allow_self_signed](/zh-hant/server/setting.html#ssl-allow-self-signed)         | 允許自簽名證書                                                                                            |
| [ssl_client_cert_file](/zh-hant/server/setting.html#ssl-client-cert-file)           | 根證書，用於驗證客戶端證書                                                                                      |
| [ssl_cafile](/zh-hant/server/setting.html#ssl-cafile)                               | 用來驗證遠端證書所用到的 CA 證書。本選項值爲 CA 證書在本地文件系統的全路徑及文件名。                                                                                            |
| [ssl_capath](/zh-hant/server/setting.html#ssl-capath)                               | 如果未設置 ssl_cafile，或者 ssl_cafile 所指的文件不存在時，會在 ssl_capath 所指定的目錄搜索適用的證書。該目錄必須是已經經過哈希處理的證書目錄。                                                                                            |
| [ssl_verify_depth](/zh-hant/server/setting.html#ssl-verify-depth)                   | 如果證書鏈條層次太深，超過了本選項的設定值，則終止驗證。                                                                        |
| [ssl_prefer_server_ciphers](/zh-hant/server/setting.html#ssl-prefer-server-ciphers) | 決定當客戶端（瀏覽器）和服務器建立加密連接時，由誰來選擇使用哪種加密算法（密碼套件）。                                                                               |
| [ssl_ciphers](/zh-hant/server/setting.html#ssl-ciphers)                             | 設置 OpenSSL 加密算法，默認值爲：`EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH`                                                                                   |
| [ssl_ecdh_curve](/zh-hant/server/setting.html#ssl-ecdh-curve)                       | 專門控制 ECDH 密鑰交換過程中所使用的橢圓曲線。                                                                         |
| [ssl_dhparam](/zh-hant/server/setting.html#ssl-dhparam)                             | 用於指定 Diffie-Hellman (DH) 密鑰交換所使用的強參數。當服務器使用老式的 DHE 加密套件時，這個指令告訴服務器應該使用哪個“大質數文件”來生成臨時的會話密鑰，從而保證安全性。                                                                     |
| [ssl_sni_certs](/zh-hant/server/setting.html#ssl-sni-certs)                         | 設置 SNI (Server Name Identification) 證書。                                                             |

### getCallback

根據事件名，獲取對應的回調函數。

```php
public function getCallback(string $event_name): \Closure|string|null|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event_name` | 事件回調名 | 必填 |

## 示例

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 1. 主端口配置：假設用於處理某種定長包
$server->set([
    'open_length_check' => true,
    'package_length_type' => 'C',
    'package_length_offset' => 100, // 假設第100字節是包長度的值
    'package_max_length' => 1000,  // 發送到9501端口的數據一定不會超過1000字節
]);

// 主端口接收事件
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9501 端口收到數據\n";
});

// 2. 監聽子端口 9502
$port = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// 【關鍵】必須重寫配置，否則 9502 也會使用上面的 package_length_type=C，package_length_offset=100和package_max_length=1000
$port->set([
    'open_length_check' => true,
    'package_length_type' => 'N',
    'package_length_offset' => 200, // 假設第200字節是包長度的值
    'package_max_length' => 800000, // 發送到9502端口的數據一定不會超過800000字節
]);

// 【關鍵】必須爲子端口單獨綁定事件，否則還是觸發主端口的receive事件
$port->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9502 端口收到數據，使用不同的解析規則\n";
});

$server->start();
```