# TCP/UDP 協程服務器

- `Swoole\Coroutine\Server` 是 `Swoole` 基於協程實現的輕量級高性能服務器。它最大的特點是：**允許開發者以同步順序的代碼風格，獲得非阻塞 I/O 的高併發性能**。底層通過協程的自動掛起與恢復，在等待 I/O 時讓出 CPU，從而在**單進程內即可支撐海量連接**。
- 與 [Swoole\Server](/zh-hant/server/tcp_udp.html) 的核心區別在於編程模型：`Swoole\Coroutine\Server` 讓開發者用同步順序書寫的代碼實現非阻塞邏輯，底層自動處理 IO 等待時的協程掛起與恢復，而 `Swoole\Server` 需要顯式註冊回調函數來處理 IO 結果。
- 由於 `Swoole\Coroutine\Server` 是單進程的，無法充分利用多核 `CPU`。如需在多核環境下部署，建議配合 **[`Swoole\Process\Pool`](/zh-hant/process/pool.html)** 實現多進程管理。

## 方法

### __construct

創建一個 TCP 協程服務器。

```php
public function __construct(string $host, int $port = 0, bool $ssl = false, bool $reuse_port = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 監聽的地址 | 必填 |
| `$port` | 監聽的端口，如果爲 `0` 將由操作系統隨機分配一個端口 | `0` |
| `$ssl` | 是否開啓 SSL 加密，可填 `true` | `false` |
| `$reuse_port` | 是否開啓端口重用，可填 `true` | `false` |

### set

設置 TCP 協程服務器運行配置。

```php
public function set(array $setting): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$setting` | 服務器運行配置 | 必填 |

### handle

設置連接處理函數。

```php
public function handle(callable $callback): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$callback` | 服務器接收到連接時的核心處理函數。該回調用於處理服務器請求 | 必填 |

**回調函數簽名**

```php
function (Swoole\Coroutine\Server\Connection $connection)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$connection` | 客戶端連接的對象，詳細請查看 [這裏](/zh-hant/server/class/connection.html) | 必填 |

> [!IMPORTANT]
> 你必須在啓動服務器之前設置這個函數。當連接建立成功後，回調函數被調用來處理請求時，服務器已經爲你創建好了一個協程，無需自己再手動創建。

### start

啓動 TCP 協程服務器。

```php
public function start(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失敗。

### shutdown

關閉 TCP 協程服務器。

```php
public function shutdown(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失敗。

## 示例

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;
use Swoole\Coroutine\Server;
use Swoole\Coroutine\Server\Connection;

//多進程管理模塊
$pool = new Process\Pool(2);
//讓每個OnWorkerStart回調都自動創建一個協程
$pool->set(['enable_coroutine' => true]);
$pool->on('workerStart', function ($pool, $id) {
    //每個進程都監聽9501端口，此時reuse_port必須設置爲true
    $server = new Server('127.0.0.1', 9501, false, true);

    //收到15信號關閉服務
    Process::signal(SIGTERM, function () use ($server) {
        $server->shutdown();
    });

    //接收到新的連接請求 並自動創建一個協程
    $server->handle(function (Connection $conn) {
        while (true) {
            //接收數據
            $data = $conn->recv(1);

            if ($data === '' || $data === false) {
                $errCode = swoole_last_error();
                $errMsg = socket_strerror($errCode);
                echo "errCode: {$errCode}, errMsg: {$errMsg}\n";
                $conn->close();
                break;
            }

            //發送數據
            $conn->send('hello');

            Coroutine::sleep(1);
        }
    });

    //開始監聽端口
    $server->start();
});
$pool->start();
```
