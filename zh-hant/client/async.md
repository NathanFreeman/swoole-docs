# 異步回調客戶端

[Swoole\Client](/zh-hant/client/sync.html) 支持同步阻塞和異步非阻塞兩種模式。構造方法的第二個參數 `$async` 設置爲 `true` 時，客戶端以異步非阻塞模式運行，支持 `TCP/UDP/UnixSocket`。此模式下需通過事件回調處理數據，而非同步等待。

## 方法

### __construct

構造方法

```php
public function __construct(int $type, bool $async = false, string $id = '')
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$type` | 表示連接的類型【支持 `SWOOLE_SOCK_TCP`、`SWOOLE_SOCK_TCP6`、`SWOOLE_SOCK_UDP`、`SWOOLE_SOCK_UDP6`】 | 必填 |
| `$async` | 是否啓用異步非阻塞模式，本頁的用法需設置爲 `true` | `false` |
| `$id` | 用於長連接的 `key`【默認使用 `IP:PORT` 作爲 `key`。相同的 `key`，即使 new 兩次也只用一個 TCP 連接】 | `IP:PORT` |

### on

註冊事件回調函數。

```php
public function on(string $event, callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event` | 回調事件名稱，大小寫不敏感 | 必填 |
| `$callback` | 回調函數 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**支持的事件**

| 事件名稱          | 觸發時機                          | 回調參數                                  |
|:--------------|:------------------------------|:--------------------------------------|
| `connect`     | 客戶端成功連接到服務器時觸發。               | `$cli` (客戶端對象實例)。                     |
| `receive`     | 客戶端接收到來自服務器的數據時觸發。            | `$cli` (客戶端對象實例), `$data` (接收到的數據內容)。 |
| `error`       | 客戶端發生網絡錯誤（如連接超時、連接被拒）時觸發。     | `$cli` (客戶端對象實例)。                     |
| `close`       | 客戶端連接被關閉時觸發。                  | `$cli` (客戶端對象實例)。                     |
| `bufferFull`  | 輸出緩衝區已滿，達到高水位標記時觸發（通常用於流量控制）。 | `$cli` (客戶端對象實例)。                     |
| `bufferEmpty` | 輸出緩衝區數據已全部發送，降至低水位標記時觸發。      | `$cli` (客戶端對象實例)。                     |

**示例**

```php
<?php
use Swoole\Client;

$client = new Client(SWOOLE_SOCK_TCP, true);

$client->on('connect', function(Client $client) {
});

$client->on('receive', function(Client $client, string $data) {
});

$client->on('error', function(Client $client) {
});

$client->on('close', function(Client $client) {
});

$client->on('bufferFull', function(Client $client) {
});

$client->on('bufferEmpty', function(Client $client) {
});
```

> [!WARNING]
> 重複調用 `on` 方法時會覆蓋上一次的設定。
> 必須在 `connect` 方法執行之前調用

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
| `$flag` | `UDP客戶端` 設置 `$flag = 1` 時，連接會被“綁定”到 `connect` 方法中指定的 `$host` 和 `$port`。此後，它將只接收來自這個特定 IP 和端口的數據包，並丟棄所有其他來源的數據。這可以讓你在 UDP 這種 `無連接` 協議上，模擬出一個類似“連接”的行爲；`TCP客戶端` 設置 `$flag = 1` 時，表示設置爲非阻塞模式，之後此 `fd` 會變成異步 IO，`connect` 會立即返回。 | `0` |

**返回值**：成功返回 `true`。失敗返回 `false`，請檢查 [`errCode`](/zh-hant/client/sync.html#errcode) 屬性獲取失敗原因。

### enableSSL

動態開啓 `SSL/TLS` 加密，一般用於 `startTLS` 客戶端。在連接建立後先發送明文數據，然後再開啓加密傳輸。

```php
public function enableSSL(?callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$callback` | 回調函數 | 必填 |

**返回值**：成功返回 `true`。失敗返回 `false`，請檢查 `errCode` 屬性獲取失敗原因。

> [!WARNING]
> 使用 `SWOOLE_SSL` 直接建立加密連接時，必須在 `connect` 方法執行之前調用；使用 `startTLS` 方式（連接建立後先發送明文數據）時，在 `connect` 之後調用。

### pause

暫時停止接收數據，調用後將從事件循環中移出，不再觸發數據接收事件。

```php
public function pause(): bool
```

**返回值**：成功返回 `true`。失敗返回 `false`。

### resume

恢復接收數據，調用後將加入事件循環。

```php
public function resume(): bool
```

**返回值**：成功返回 `true`。失敗返回 `false`。

## 示例

```php
<?php
use Swoole\Client;
// 創建一個異步TCP客戶端
$client = new Client(SWOOLE_SOCK_TCP, true);

// 註冊事件回調函數
$client->on("connect", function(Client $cli) {
    echo "連接成功\n";
    $cli->send("Hello, Server!\n"); // 連接成功後發送數據
});

$client->on("receive", function(Client $cli, $data){
    echo "收到服務器數據: " . $data . "\n";
    // 收到數據後，可以在此處繼續處理或關閉連接
    // $cli->close();
});

$client->on("error", function(Client $cli){
    // 可以通過 $cli->errCode 獲取錯誤碼，連接超時錯誤碼爲 ETIMEOUT
    echo "連接失敗\n";
});

$client->on("close", function(Client $cli){
    echo "連接已關閉\n";
});

// 發起連接，第三個參數是超時時間（秒）
$client->connect('127.0.0.1', 9501, 0.5);
```
