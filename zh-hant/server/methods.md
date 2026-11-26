# 方法

## __construct

創建一個異步風格的服務器。

```php
public function __construct(string $host = '0.0.0.0', int $port = 0, int $mode = SWOOLE_BASE, int $sock_type = SWOOLE_SOCK_TCP)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 指定監聽的 IP 地址。IPv4 使用 `127.0.0.1` 表示監聽本機，`0.0.0.0` 表示監聽所有地址。IPv6 使用 `::1` 表示監聽本機，`::`（相當於 `0:0:0:0:0:0:0:0`）表示監聽所有地址 | `'0.0.0.0'` |
| `$port` | 指定監聽的端口，如 `9501`。監聽小於 `1024` 端口需要 `root` 權限。如果此端口被佔用，啓動服務器時會失敗 | `0` |
| `$mode` | 指定運行模式。其它值：[SWOOLE_PROCESS](/zh-hant/server/process_thread.html#工作模式) 多進程模式，[SWOOLE_THREAD](/zh-hant/server/process_thread.html#工作模式) 多線程模式（Swoole 6.0 可用） | [SWOOLE_BASE](/zh-hant/server/process_thread.html#工作模式) 基本模式（默認） |
| `$sock_type` | 指定這組服務器的類型。其它值：<br>`SWOOLE_SOCK_TCP`：tcp ipv4 socket<br>`SWOOLE_SOCK_TCP6`：tcp ipv6 socket<br>`SWOOLE_SOCK_UDP`：udp ipv4 socket<br>`SWOOLE_SOCK_UDP6`：udp ipv6 socket<br>[SWOOLE_UNIX_DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php)：unix socket dgram<br>[SWOOLE_UNIX_STREAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/stream_server.php)：unix socket stream | `SWOOLE_SOCK_TCP` |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->start();
```

> [!NOTE]
> `$sock_type` 爲 `SWOOLE_UNIX_DGRAM` 或者 `SWOOLE_UNIX_STREAM`，`$port` 參數會被忽略。
> 使用 `$sock_type` | `SWOOLE_SSL` 可以啓用 `SSL` 隧道加密。啓用 `SSL` 後必須配置 [ssl_key_file](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file) 和 [ssl_cert_file](/zh-hant/server/setting.html#ssl-cert-file-ssl-key-file)。

## set

設置服務器運行時[配置](/zh-hant/server/setting.html)。

```php
public function set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 設置服務器運行時的配置 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);
$server->start();
```

> [!WARNING]
> `set` 該方法必須在 `start` 之前調用。

## on

註冊服務器[事件回調函數](/zh-hant/server/events.html)。

```php
public function on(string $event_name, callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event_name` | `Swoole` 提供了非常全面的事件回調機制，具體支持的所有事件名稱，詳見文檔：[回調事件](/zh-hant/server/events.html) | 必填 |
| `$callback` | 設置事件回調函數 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo $data;
});
$server->start();
```

## getCallback

根據事件名，獲取對應的回調函數。

```php
public function getCallback(string $event_name): \Closure|string|null|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event_name` | 事件回調名 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo $data;
});

var_dump($server->getCallback('receive'));
$server->start();
```

## listen

增加監聽的[子端口](/zh-hant/server/port.html)。

```php
public function listen(string $host, int $port, int $sock_type): false|Swoole\Server\Port
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 指定監聽的 IP 地址。IPv4 使用 `127.0.0.1` 表示監聽本機，`0.0.0.0` 表示監聽所有地址。IPv6 使用 `::1` 表示監聽本機，`::`（相當於 `0:0:0:0:0:0:0:0`）表示監聽所有地址 | 必填 |
| `$port` | 指定監聽的端口，如 `9501`。監聽小於 `1024` 端口需要 `root` 權限。如果此端口被佔用，啓動服務器時會失敗 | 必填 |
| `$sock_type` | 指定這組服務器的類型。其它值：<br>`SWOOLE_SOCK_TCP`：tcp ipv4 socket<br>`SWOOLE_SOCK_TCP6`：tcp ipv6 socket<br>`SWOOLE_SOCK_UDP`：udp ipv4 socket<br>`SWOOLE_SOCK_UDP6`：udp ipv6 socket<br>[SWOOLE_UNIX_DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php)：unix socket dgram<br>[SWOOLE_UNIX_STREAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/stream_server.php)：unix socket stream | 必填 |

**返回值**：返回 [Swoole\Server\Port](/zh-hant/server/class/port.html) 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$http->on('request', function(Request $request, Response $response) {
    echo "主端口";
});

$port = $http->listen('127.0.0.1', 9502, SWOOLE_SOCK_TCP);
$port->on('request', function(Request $request, Response $response) {
    echo "子端口";
});

$http->start();
```

## sendMessage

向任意[worker進程](/zh-hant/server/process_thread.html#進程-線程)或者[task進程](/zh-hant/server/process_thread.html#進程-線程)發送數據，收到消息的進程會觸發[pipeMessage事件](/zh-hant/server/events.html#pipemessage)。

```php
public function sendMessage(mixed $message, int $workerId): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$message` | 爲發送的消息數據內容，沒有長度限制，但超過 `8K` 時會啓動內存臨時文件 | 必填 |
| `$workerId` | 目標進程的 `ID`，範圍參考 [$worker_id](/zh-hant/server/properties.html#worker-id) | 必填 |

**返回值**：成功返回 `true`，失敗返回 `false`。

**示例**

```php
<?php
$server = new Swoole\Server('0.0.0.0', 9501);

$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 2,
));
$server->on('pipeMessage', function ($server, $src_worker_id, $data) {
    echo "#{$server->worker_id} message from #$src_worker_id: $data\n";
});
$server->on('task', function ($server, $task_id, $src_worker_id, $data) {
    var_dump($task_id, $src_worker_id, $data);
});
$server->on('finish', function ($server, $task_id, $data) {

});
$server->on('receive', function (Swoole\Server $server, $fd, $reactor_id, $data) {
    if (trim($data) == 'task') {
        $server->task("async task coming");
    } else {
        $worker_id = 1 - $server->worker_id;
        $server->sendMessage("hello task process", $worker_id);
    }
});

$server->start();
```

> [!NOTE]
> 在 `worker` 進程內調用 `sendMessage` 是異步的，消息會先存到緩衝區，可寫時才發送此消息。
> 在 `task` 進程或者[user進程](/zh-hant/server/process_thread.html#進程-線程)內調用 `sendMessage` 默認是同步 IO，但有些情況會自動轉換成異步 IO，參考「同步 IO 轉換成異步 IO」。

> [!WARNING]
> 使用 `sendMessage` 必須註冊 `pipeMessage` 事件回調函數。
> 當[task_ipc_mode](/zh-hant/server/setting.html#task-ipc-mode)爲 `SWOOLE_IPC_PREEMPTIVE`，將無法向特定進程發送數據。

## addProcess

添加一個用戶自定義的[user進程](/zh-hant/server/process_thread.html#進程-線程)。此函數通常用於創建一個特殊的工作進程，用於監控、上報或者其他特殊的任務。

```php
public function addProcess(Swoole\Process $process): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$process` | `Swoole\Process` 對象 | 必填 |

**返回值**：返回進程 id 編號表示操作成功，否則程序會拋出致命錯誤。

**示例**

```php
<?php
$server = new Swoole\Server('127.0.0.1', 9501);

/**
 * 用戶進程實現了廣播功能，循環接收unixSocket的消息，併發給服務器的所有連接
 */
$process = new Swoole\Process(function ($process) use ($server) {
    $socket = $process->exportSocket();
    while (true) {
        $msg = $socket->recv();
        foreach ($server->connections as $conn) {
            $server->send($conn, $msg);
        }
    }
}, false, 2, 1);

$server->addProcess($process);

$server->on('receive', function ($serv, $fd, $reactor_id, $data) use ($process) {
    //羣發收到的消息
    $socket = $process->exportSocket();
    $socket->send($data);
});

$server->start();
```

> [!WARNING]
> `user進程` 內可以使用 [send](/zh-hant/server/methods.html#send)，[close](/zh-hant/server/methods.html#close) 方法，不能使用 [task](/zh-hant/server/methods.html#task)，[taskwait](/zh-hant/server/methods.html#taskwait) 和 [taskCo](/zh-hant/server/methods.html#taskco) 方法。
> `user進程` 內可以使用 [sendMessage](/zh-hant/server/methods.html#sendmessage) 與[worker進程](/zh-hant/server/process_thread.html#進程-線程)或者[task進程](/zh-hant/server/process_thread.html#進程-線程)通信。
> `user進程` 在代碼中使用 `while(true)` 或者創建一個事件循環（例如定時器）來維持運行，否則用戶進程會不停地退出重啓。
> 必須在執行 [start](/zh-hant/server/methods.html#start) 方法之前使用 `addProcess`，否則 `user` 進程不會啓動。

## addCommand

註冊一個自定義服務器命令，供其他進程通過 [command](#command) 方法調用。必須在 [start](#start) 之前調用。

```php
public function addCommand(string $name, int $accepted_process_types, callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 命令名稱 | 必填 |
| `$accepted_process_types` | 允許處理該命令的進程類型位掩碼，可通過 `\|` 組合，取值見下表 | 必填 |
| `$callback` | 命令處理回調函數 | 必填 |

| 常量 | 說明 |
|:---|:---|
| `SWOOLE_SERVER_COMMAND_MASTER` | `master` 進程 |
| `SWOOLE_SERVER_COMMAND_MANAGER` | `manager` 進程 |
| `SWOOLE_SERVER_COMMAND_EVENT_WORKER` | 事件 `worker` 進程（別名 `SWOOLE_SERVER_COMMAND_WORKER`） |
| `SWOOLE_SERVER_COMMAND_TASK_WORKER` | `task` 進程 |
| `SWOOLE_SERVER_COMMAND_REACTOR_THREAD` | `reactor` 線程，**不允許**用於用戶註冊的命令 |

回調函數簽名：

```php
function (Swoole\Server $server, string $message): string {}
```

`$message` 是調用方傳入的 `$data` 經 `json_encode` 後的字符串。回調必須返回字符串（通常將結果 `json_encode` 後返回）；返回其他類型時調用方會收到 `{"data":"wrong return type","code":-2}`，回調拋出異常時收到 `{"data":"failed to call function","code":-1}`。

**返回值**：註冊成功返回 `true`，失敗返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v4.8.0` 可用。服務器已啓動後調用會產生警告並返回 `false`；`$accepted_process_types` 包含 `SWOOLE_SERVER_COMMAND_REACTOR_THREAD` 時同樣返回 `false`。

**示例**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);
$server->addCommand('test_getpid', SWOOLE_SERVER_COMMAND_MASTER | SWOOLE_SERVER_COMMAND_EVENT_WORKER,
    function (Server $server, string $message) {
        return json_encode(['pid' => posix_getpid()]);
    });
$server->on('start', function (Server $server) {
    $result = $server->command('test_getpid', 0, SWOOLE_SERVER_COMMAND_MASTER, ['type' => 'master']);
    var_dump($result);
});
$server->start();
```

## command

向指定進程發送命令並等待響應，底層通過進程間管道投遞。

```php
public function command(string $name, int $process_id, int $process_type, mixed $data, bool $json_decode = true): false|string|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 命令名稱，必須是 [addCommand](#addcommand) 註冊過的命令 | 必填 |
| `$process_id` | 目標進程 `ID` | 必填 |
| `$process_type` | 目標進程類型，取值與 [addCommand](#addcommand) 的常量相同，單選 | 必填 |
| `$data` | 發送給命令回調的數據，底層會先 `json_encode` | 必填 |
| `$json_decode` | 爲 `true` 時對響應 `json_decode`（關聯數組）後返回，爲 `false` 時返回原始字符串 | `true` |

**返回值**：命令執行成功返回響應（`array` 或 `string`）；命令未註冊、進程類型不在命令接受的掩碼內、進程 `ID` 越界、投遞失敗或響應解碼失敗時返回 `false`。

> [!WARNING]
> 必須在服務器啓動後調用。`SWOOLE_PROCESS` 模式下只能在 `master` 進程調用，`SWOOLE_BASE` 模式下只能在 `0` 號 `worker` 進程調用。在協程中調用時當前協程會掛起等待響應。

## start

啓動服務器。

```php
public function start(): bool
```

**返回值**：成功返回 `true`，失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);
$server->start();
```

> [!WARNING]
> 啓動成功後將進入事件循環，等待客戶端連接請求。`start` 方法之後的代碼在服務器停止前不會執行。

## stop

使指定的[worker進程](/zh-hant/server/process_thread.html#進程-線程)停止運行，並立即觸發[workerStop事件](/zh-hant/server/events.html#workerstop)。

```php
public function stop(int $workerId = -1, bool $waitEvent = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$workerId` | 指定 `worker` [進程編號](/zh-hant/server/properties.html#worker-id) | `-1`，表示當前進程 |
| `$waitEvent` | 控制退出策略。<br>`false`：表示立即退出，可能仍然有事件在等待。比如使用了發送了 `SQL` 語句，但還在等待 `MySQL` 服務器返回結果。這時如果進程強制退出，`SQL` 的執行結果就會丟失了。<br>`true`：表示底層將採用異步安全重啓策略先通知[manager進程](/zh-hant/server/process_thread.html#進程-線程)，重新啓動一個新的 `worker` 來處理新的請求。當前舊的 `worker` 會等待事件，直到事件循環爲空或者超過 `max_wait_time` 後，退出進程，最大限度的保證異步事件的安全性。<br>在 `v6.1.0` 版本之後，此參數已被移除，退出邏輯由 [reload_async](/zh-hant/server/setting.html#reload-async) 選項控制 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->stop(rand(0, 3)); // 隨機停止一個 worker 進程
});

$server->on('workerStop', function (Server $server, int $workerId) {
    echo "worker 停止，ID: {$workerId}\n";
});
$server->start();
```

## send

向客戶端發送數據。

```php
public function send(int|string $fd, string $send_data, int $serverSocket = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定客戶端的文件描述符或者 unix socket 路徑 | 必填 |
| `$send_data` | 發送的數據，`TCP` 協議最大不得超過 `2M`，可修改 [socket_buffer_size](/zh-hant/server/setting.html#socket-buffer-size) 改變允許發送的最大包長度 | 必填 |
| `$serverSocket` | 向[UnixSocket DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php)對端發送數據時需要此項參數，TCP 服務端不需要填寫 | `-1`，表示當前監聽的 udp 端口 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});

$server->start();
```

> [!NOTE]
> 發送過程是異步的，底層會自動監聽可寫，將數據逐步發送給客戶端，也就是說不是 `send` 返回後對端就收到數據了。
> `send` 操作具有原子性，多個進程同時調用 `send` 向同一個 `TCP` 連接發送數據，不會發生數據混雜。

> [!WARNING]
> 如果連續向同一個客戶端發送大量數據，客戶端來不及接收會導致內存緩存區塞滿，Swoole 底層會立即返回 `false`。

> [!NOTE]
> 在[協程模式](/zh-hant/server/setting.html#enable-coroutine)開啓了 [send_yield](/zh-hant/server/setting.html#send-yield) 情況下 `send` 遇到緩存區已滿時會自動掛起，當數據被對端讀走一部分後恢復協程，繼續發送數據。

## sendfile

發送文件到 `TCP` 客戶端連接。

```php
public function sendfile(int $fd, Swoole\SendFile|string $filename, int $offset = 0, int $length = 0, bool $delete_file = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定客戶端的文件描述符 | 必填 |
| `$filename` | 要發送的文件路徑，或一個 [Swoole\SendFile](/zh-hant/server/class/send_file.html) 對象（`v6.3.0` 版本之後可用）。如果文件不存在會返回 `false` | 必填 |
| `$offset` | 指定文件偏移量，可以從文件的某個位置起發送數據 | `0`，表示從文件頭部開始發送 |
| `$length` | 指定發送的長度 | `0`，即文件尺寸 |
| `$delete_file` | 發送任務結束時是否自動刪除文件。`v6.3.0` 版本之後可用 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->sendfile($fd, __FILE__);
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - `$filename` 爲 [Swoole\SendFile](/zh-hant/server/class/send_file.html) 對象時，不得再傳入 `$offset`、`$length`、`$delete_file` 參數，否則拋出 `ValueError`，發送選項以對象屬性爲準。
> - `$delete_file` 爲 `true` 時，文件在發送任務結束時自動刪除，包括發送失敗或連接提前關閉的情況，適用於「先生成臨時文件再發送」的場景。

## stats

得到當前服務器的活動 `TCP` 連接數，啓動時間等信息，`accept/close`(建立連接/關閉連接)的總次數等信息。

```php
public function stats(): array
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    var_dump($server->stats());
});

$server->start();
```

| 參數                    | 作用                                                                                                                                                                                          |
|:----------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| start_time            | 服務器啓動的時間                                                                                                                                                                                    |
| connection_num        | 當前連接的數量                                                                                                                                                                                     |
| abort_count           | 拒絕了多少個連接                                                                                                                                                                                    |
| accept_count          | 接受了多少個連接                                                                                                                                                                                    |
| close_count           | 關閉的連接數量                                                                                                                                                                                     |
| worker_num            | 開啓了多少個[worker進程](/zh-hant/server/process_thread.html#進程-線程)                                                                                                                                      |
| task_worker_num       | 開啓了多少個[task進程](/zh-hant/server/process_thread.html#進程-線程)【`v4.5.7` 可用】                                                                                                                            |
| user_worker_num       | 開啓了多少個[user進程](/zh-hant/server/process_thread.html#進程-線程)                                                                                                                                        |
| idle_worker_num       | 空閒的 worker 進程數                                                                                                                                                                                |
| dispatch_count        | 服務器發送到 worker 進程的包數量【`v4.5.7` 可用，僅在 [SWOOLE_PROCESS](/zh-hant/server/process_thread.html#工作模式) 模式下有效】                                                                                                 |
| request_count         | 服務器收到的請求次數【只有 [receive](/zh-hant/server/events.html#receive)、[message](/zh-hant/server/events.html#message)、[request](/zh-hant/server/events.html#request)、[packet](/zh-hant/server/events.html#packet) 四種數據請求計算】 |
| response_count        | 服務器返回的響應次數                                                                                                                                                                                  |
| total_recv_bytes      | 數據接收總數                                                                                                                                                                                      |
| total_send_bytes      | 數據發送總數                                                                                                                                                                                      |
| pipe_packet_msg_id    | 進程間通信 id                                                                                                                                                                                     |
| session_round         | 起始 session id                                                                                                                                                                                |
| min_fd                | 最小的連接 fd                                                                                                                                                                                     |
| max_fd                | 最大的連接 fd                                                                                                                                                                                     |
| worker_request_count  | 當前 worker 進程收到的請求次數【worker_request_count 超過 max_request 時工作進程將退出】                                                                                                                                |
| worker_response_count | 當前 worker 進程響應次數                                                                                                                                                                              |
| worker_dispatch_count | master 進程向當前 worker 進程投遞任務的計數，在 [master進程](/zh-hant/server/process_thread.html#進程-線程) 進行 dispatch 時增加計數                                                                                                 |
| task_idle_worker_num  | 空閒的 task 進程數                                                                                                                                                                                  |
| tasking_num           | 當前正在處理的任務數量                                                                                                                                                                                |
| coroutine_num         | 當前協程數量                                                                                                                                                                                      |
| coroutine_peak_num    | 協程數量的歷史峯值                                                                                                                                                                                      |
| task_queue_num        | 消息隊列中的任務數量                                                                                                                                                                                  |
| task_queue_bytes      | 消息隊列的內存佔用字節數                                                                                                                                                                                |

## bind

將連接綁定一個用戶定義的 `UID`，設置以此值進行 `hash` 固定分配。可以保證某一個 `UID` 的連接全部會分配到同一個 `Worker` 進程。

```php
public function bind(int $fd, int $uid): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定連接的 `fd` | 必填 |
| `$uid` | 要綁定的 `UID`，必須爲非 `0` 的數字。其它值：`UID` 最大不能超過 `4294967295`，最小不能小於 `-2147483648` | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$serv = new Server('0.0.0.0', 9501);

$serv->fdlist = [];

$serv->set([
    'worker_num' => 4,
    'dispatch_mode' => SWOOLE_DISPATCH_UIDMOD,
]);

$serv->on('connect', function ($serv, $fd, $reactor_id) {
    echo "{$fd} connect, worker:" . $serv->worker_id . PHP_EOL;
});

$serv->on('receive', function (Server $serv, $fd, $reactor_id, $data) {
    $conn = $serv->connection_info($fd);
    print_r($conn);
    echo "worker_id: " . $serv->worker_id . PHP_EOL;
    if (empty($conn['uid'])) {
        $uid = $fd + 1;
        if ($serv->bind($fd, $uid)) {
            $serv->send($fd, "bind {$uid} success");
        }
    } else {
        if (!isset($serv->fdlist[$fd])) {
            $serv->fdlist[$fd] = $conn['uid'];
        }
        print_r($serv->fdlist);
        foreach ($serv->fdlist as $_fd => $uid) {
            $serv->send($_fd, "{$fd} say:" . $data);
        }
    }
});

$serv->on('close', function ($serv, $fd, $reactor_id) {
    echo "{$fd} Close". PHP_EOL;
    unset($serv->fdlist[$fd]);
});

$serv->start();
```

> [!WARNING]
> 此功能約束於 [SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#工作模式)，並且僅在 [dispatch_mode](/zh-hant/server/setting.html#dispatch-mode) 爲 `SWOOLE_DISPATCH_UIDMOD` 時生效。
> 同一個連接只能被 `bind` 一次，如果已經綁定了 `UID`，再次調用 `bind` 會返回 `false`。

> [!NOTE]
> 如果綁定的 `UID` 爲負數，會被底層轉換爲 `32位無符號整數`。
> 某些情況下，業務邏輯需要用戶連接重新綁定 `UID`。這時可以切斷連接，重新建立 `TCP` 連接並握手，綁定到新的 `UID`。


## sendto

向任意的客戶端 `IP:PORT` 發送 `UDP` 數據包。

```php
public function sendto(string $ip, int $port, string $send_data, int $server_socket = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$ip` | 指定客戶端 `ip`，`$ip` 爲 `IPv4` 或 `IPv6` 字符串，如 `192.168.1.102`。如果 `IP` 不合法會返回錯誤 | 必填 |
| `$port` | 指定客戶端 `port`，`$port` 爲 `1-65535` 的網絡端口號，如果端口錯誤發送會失敗 | 必填 |
| `$send_data` | 要發送的數據內容，可以是文本或者二進制內容 | 必填 |
| `$server_socket` | 指定使用的 `socket` 文件描述符，用於多端口場景 | `-1`，表示當前監聽的 udp 端口 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9502, SWOOLE_BASE, SWOOLE_SOCK_UDP);
$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    $server->sendto($clientInfo['address'], $clientInfo['port'], "Hello World");
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 只有監聽了 `UDP` 的端口，纔可以向 `IPv4` 地址發送數據。
> - 必須監聽了 `UDP6` 的端口，纔可以向 `IPv6` 地址發送數據。
> - `$ip`，`$port` 和 `$serverSocket` 可以從 [packet 事件回調中的 $clientInfo](/zh-hant/server/events.html#packet) 獲取。

## sendwait

向客戶端發送數據，並且等待結果返回，該方法是一個阻塞方法。

```php
public function sendwait(int $fd, string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定客戶端的文件描述符 | 必填 |
| `$data` | 要發送的數據 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->sendwait($fd, 'Hello World');
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - [SWOOLE_BASE 模式](/zh-hant/server/process_thread.html#工作模式) 才能使用 `sendwait`。
> - 有一些特殊的場景是需要連續向客戶端發送數據，而 [send](/zh-hant/server/methods.html#send) 數據發送接口是純異步的，大量數據發送會導致內存發送隊列塞滿。此時可以使用 `sendwait`，`sendwait` 會等待連接可寫。直到數據發送完畢纔會返回。
> - `sendwait` 只用於本機或內網通信，外網連接請勿使用 `sendwait`，在開啓協程 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 的時候也不要用這個函數，會卡死其他協程，只有同步阻塞的服務器纔可以用。

## exists

檢測 `fd` 對應的連接是否存在。

```php
public function exists(int $fd): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 文件描述符 | 必填 |

**返回值**：返回 `true` 表示存在，返回 `false` 表示不存在。

## protect

設置客戶端連接爲保護狀態，不被[心跳線程](/zh-hant/server/setting.html#heartbeat-idle-time)切斷。

```php
public function protect(int $fd, bool $is_protected = true): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定客戶端連接 `fd` | 必填 |
| `$is_protected` | 設置的狀態。其它值：`false`，表示不保護 | `true`，表示保護狀態 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->protect($fd, true);
});

$server->start();
```

## close

關閉客戶端連接。

```php
public function close(int $fd, bool $reset = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定關閉的 `fd`（文件描述符） | 必填 |
| `$reset` | 設置爲 `true` 會強制關閉連接，丟棄發送隊列中的數據 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, "Hello World");
    $server->close($fd);
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 主動關閉客戶端連接，會觸發 [close 事件](/zh-hant/server/events.html#close)。
> - 清理邏輯不要在 `close` 之後寫，應該在 `close事件` 處理。

## pause

暫停接收當前連接發送過來的數據。

```php
public function pause(int $fd): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定文件描述符 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

> [!NOTE]
> 在 [SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#工作模式) 下，可能有部分數據已經到達 [worker 進程](/zh-hant/server/process_thread.html#進程-線程)，因此仍然可能會觸發 [receive 事件](/zh-hant/server/events.html#receive) / [request 事件](/zh-hant/server/events.html#request) / [message 事件](/zh-hant/server/events.html#message) / [packet 事件](/zh-hant/server/events.html#packet)。

## resume

恢復接收當前連接發送過來的數據。

```php
public function resume(int $fd): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定文件描述符 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

## task

投遞一個任務到 [task 進程](/zh-hant/server/process_thread.html#工作模式) 中，此函數是非阻塞的，執行完畢會立即返回。[worker 進程](/zh-hant/server/process_thread.html#工作模式) 可以繼續處理新的請求。

```php
public function task(mixed $data, int $dstWorkerId = -1, ?callable $finishCallback = null): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要投遞的任務數據，必須是可序列化的 PHP 變量 | 必填 |
| `$dstWorkerId` | 可以指定要給投遞給哪個 `task 進程`。其它值：[task 進程編號](/zh-hant/server/properties.html#taskworker) | `-1`，表示隨機投遞，底層會自動選擇一個空閒 `task 進程` |
| `$finishCallback` | `finish` 回調函數，如果任務設置了回調函數，`task` 返回結果時會直接執行指定的回調函數，不再執行 [finish 回調](/zh-hant/server/events.html#finish) | `null` |

**返回值**：調用成功，返回值爲整數 `$task_id`，表示此任務的 `ID`。如果有 `finish` 回調，`finish回調` 中會攜帶 `$task_id` 參數。調用失敗，返回值爲 `false`，`$task_id` 可能爲 `0`，因此必須使用 `===` 判斷是否失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);

$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 4,
));

$server->on('receive', function (Server $server, $fd, $reactor_id, $data) {
    echo "接收數據" . $data . "\n";
    $data    = trim($data);
    $server->task($data, -1, function (Server $server, $task_id, $data) {
        echo "Task Callback: ";
        var_dump($task_id, $data);
    });
    $task_id = $server->task($data, 0);
    $server->send($fd, "分發任務，任務id爲$task_id\n");
});

$server->on('task', function (Server $server, $task_id, $reactor_id, $data) {
    echo "Tasker進程接收到數據";
    echo "#{$server->worker_id}\tonTask: [PID={$server->worker_pid}]: task_id=$task_id, data_len=" . strlen($data) . "." . PHP_EOL;
    $server->finish($data);
});

$server->on('finish', function (Server $server, $task_id, $data) {
    echo "Task#$task_id finished, data_len=" . strlen($data) . PHP_EOL;
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 不能在 `task` 進程使用 `task` 方法。
> - 必須配置 [task_worker_num](/zh-hant/server/setting.html#task-worker-num) 和註冊 [task 事件](/zh-hant/server/events.html#task) 和 [finish 事件](/zh-hant/server/events.html#finish)，才能使用 `task` 方法。
> - 從 [master](/zh-hant/server/process_thread.html#進程-線程)、[manager](/zh-hant/server/process_thread.html#進程-線程)、[user](/zh-hant/server/process_thread.html#進程-線程) 進程中投遞的任務，是單向的，無法接收 `task 進程` 處理後返回的結果。
> - 當傳入的 `$data` 數據超過 `8K` 時會啓用臨時文件來保存。當臨時文件內容超過 [package_max_length](/zh-hant/server/setting.html#package-max-length) 時底層會拋出一個警告。此警告不影響數據的投遞，過大的數據可能會存在性能問題。

## taskwait

投遞一個任務到 [task 進程](/zh-hant/server/process_thread.html#工作模式) 中，並且等待任務完成或者超時返回。

```php
public function taskwait(mixed $data, float $timeout = 0.5, int $taskWorkerIndex = -1): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 投遞的任務數據，可以是任意類型，非字符串類型底層會自動進行串化 | 必填 |
| `$timeout` | 超時時間，浮點型，單位爲秒，最小支持 `1ms` 粒度，超過規定時間內 `task 進程` 未返回數據，`taskwait` 將返回 `false`，不再處理後續的任務結果數據 | `0.5` |
| `$taskWorkerIndex` | 可以指定要給投遞給哪個 `task 進程`。其它值：[task 進程編號](/zh-hant/server/properties.html#taskworker) | `-1`，表示隨機投遞，底層會自動選擇一個空閒 `task 進程` |

**返回值**：返回 `false` 表示投遞失敗。如果 `task` 事件中執行了 `finish` 方法或者 `return`，那麼 `taskwait` 將會返回 `task` 投遞的結果。

> [!WARNING]
> **注意**
>
> - 不能在 `task` 進程使用 `taskwait` 方法。
> - 必須配置 [task_worker_num](/zh-hant/server/setting.html#task-worker-num) 和註冊 [task 事件](/zh-hant/server/events.html#task)，才能使用 `taskwait` 方法。
> - 從 [master](/zh-hant/server/process_thread.html#進程-線程)、[manager](/zh-hant/server/process_thread.html#進程-線程)、[user](/zh-hant/server/process_thread.html#進程-線程) 進程中投遞的任務，是單向的，無法接收 `task 進程` 處理後返回的結果。
> - 當傳入的 `$data` 數據超過 `8K` 時會啓用臨時文件來保存。當臨時文件內容超過 [package_max_length](/zh-hant/server/setting.html#package-max-length) 時底層會拋出一個警告。此警告不影響數據的投遞，過大的數據可能會存在性能問題。

## taskWaitMulti

併發執行多個 `task` 異步任務，並且 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 等待任務完成或者超時返回。

```php
public function taskWaitMulti(array $tasks, float $timeout = 0.5): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$tasks` | 必須爲數字索引數組，不支持關聯索引數組，底層會遍歷 `$tasks` 將任務逐個投遞到每個 [task 進程](/zh-hant/server/process_thread.html#工作模式) | 必填 |
| `$timeout` | 爲浮點型，單位爲秒 | `0.5` 秒 |

**返回值**：任務完成或超時，返回結果數組。結果數組中每個任務結果的順序與 `$tasks` 對應，如：`$tasks[2]` 對應的結果爲 `$result[2]`。某個任務執行超時不會影響其他任務，返回的結果數據中將不包含超時的任務。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 4,
));

$server->on('receive', function (Server $server, $fd, $reactor_id, $data) {
    $tasks[] = mt_rand(1000, 9999); //任務1
    $tasks[] = mt_rand(1000, 9999); //任務2
    $tasks[] = 0; //任務3
    $tasks[] = mt_rand(1000, 9999); //任務4
    $results = $server->taskWaitMulti($tasks, 2); // 由於任務3在執行過程中睡眠了5秒超時了，所以返回的結果中不存在$result[2]
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    if ($data == 0) {
        sleep(5);
    }

    return $data;
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 最大併發任務不得超過 `1024`
> - 不能在 `task` 進程使用 `taskWaitMulti` 方法。

## taskCo

用於在當前協程環境中併發地執行多個同步任務，並等待所有任務結果返回，這個過程不會阻塞 [worker 進程](/zh-hant/server/process_thread.html#進程-線程)，因此可以極大地提升處理效率。

```php
public function taskCo(array $tasks, float $timeout = 0.5): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$tasks` | 必須爲數字索引數組，不支持關聯索引數組，底層會遍歷 `$tasks` 將任務逐個投遞到每個 [task 進程](/zh-hant/server/process_thread.html#進程-線程) | 必填 |
| `$timeout` | 爲浮點型，單位爲秒，當規定的時間內任務沒有全部完成，立即中止當前異步任務並返回結果 | `0.5` 秒 |

**返回值**：任務完成或超時，返回結果數組。結果數組中每個任務結果的順序與 `$tasks` 對應，如：`$tasks[2]` 對應的結果爲 `$result[2]`。某個任務執行失敗或超時，對應的結果數組項爲 `false`，如：`$tasks[2]` 失敗了，那麼 `$result[2]` 的值爲 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server("127.0.0.1", 9502, SWOOLE_BASE);

$server->set([
    'worker_num'      => 1,
    'task_worker_num' => 2,
]);

$server->on('Task', function (Server $serv, $task_id, $worker_id, $data) {
    echo "#{$serv->worker_id}\tonTask: worker_id={$worker_id}, task_id=$task_id\n";
    if ($serv->worker_id == 1) {
        sleep(1);
    }
    return $data;
});

$server->on('Request', function (Request $request, Response $response) use ($server) {
    $tasks[0] = "hello world";
    $tasks[1] = ['data' => 1234, 'code' => 200];
    $result   = $server->taskCo($tasks, 0.5);
    $response->end('Test End, Result: ' . var_export($result, true));
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 最大併發任務不得超過 `1024`
> - 不能在 `task` 進程使用 `taskCo` 方法。

## finish

用於在 [task 方法](/zh-hant/server/methods.html#task) 通知 [worker 進程](/zh-hant/server/process_thread.html#進程-線程)，投遞的任務已完成。此函數可以傳遞結果數據給 `worker 進程`。

```php
public function finish(mixed $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 任務處理的結果內容 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);

$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 4,
));

$server->on('receive', function (Server $server, $fd, $reactor_id, $data) {
    echo "接收數據" . $data . "\n";
    $data    = trim($data);
    $server->task($data, -1, function (Server $server, $task_id, $data) {
        echo "Task Callback: ";
        var_dump($task_id, $data);
    });
    $task_id = $server->task($data, 0);
    $server->send($fd, "分發任務，任務id爲$task_id\n");
});

$server->on('task', function (Server $server, $task_id, $reactor_id, $data) {
    echo "Tasker進程接收到數據";
    echo "#{$server->worker_id}\tonTask: [PID={$server->worker_pid}]: task_id=$task_id, data_len=" . strlen($data) . "." . PHP_EOL;
    $server->finish($data);
});

$server->on('finish', function (Server $server, $task_id, $data) {
    echo "Task#$task_id finished, data_len=" . strlen($data) . PHP_EOL;
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - `finish` 方法可以多次調用，`worker 進程` 會多次觸發 [finish 事件](/zh-hant/server/events.html#finish)。
> - 如果 `worker 進程` 不關心任務執行的結果，不需要調用 `finish` 方法。
> - [task 方法](/zh-hant/server/methods.html#task) 中 `return` 返回字符串，等同於調用 `finish`。
> - `finish` 方法只能在 `task 方法` 中使用，且必須事先註冊 `finish 事件`。

## reload

重啓所有 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 和 [task 進程](/zh-hant/server/process_thread.html#進程-線程)。

```php
public function reload(bool $only_reload_taskworker = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$only_reload_taskworker` | 是否僅重啓 `task 進程`，其它值：`true` | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, "Hello World");
    $server->reload(); // 重啓worker進程和task進程
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - `reload` 有保護機制，當一次 `reload` 正在進行時，收到新的重啓信號會丟棄。
> - 如果設置了 [user](/zh-hant/server/setting.html#user) 或者 [group](/zh-hant/server/setting.html#group)，`worker` 進程和 `task` 進程沒法使用 `reload` 方法發送信號給 `master 進程` / `manager 進程`，不過在 `v6.2.0` 版本之後，這個問題就被解決了。
> - 向 [master 進程](/zh-hant/server/process_thread.html#進程-線程) 或者 [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 發送 `SIGUSR1` 信號，將平穩地 `restart` 所有 `worker` 進程和 `task` 進程。
> - 向 `master 進程` / `manager 進程` 發送 `SIGUSR2` 信號，將平穩地重啓所有 `task 進程`。
> - [worker_num](/zh-hant/server/setting.html#worker-num) 爲 1 的情況下，該方法是沒有作用的。
> - 需要和 [reload_async](/zh-hant/server/setting.html#reload-async) 搭配才能實現柔性重啓。

## shutdown

關閉服務器。

```php
public function shutdown(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, "Hello World");
    $server->shutdown();
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 此方法可以用在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 內使用。
> - 向 [master 進程](/zh-hant/server/process_thread.html#進程-線程) 或者 [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 發送 `SIGTERM` 也可以實現關閉服務。

## heartbeat

開啓心跳探測，檢查當前進程維持的連接是否有效。

```php
public function heartbeat(bool $ifCloseConnection = true): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$ifCloseConnection` | 發現無效的連接是否強制關閉，其它值：`false` | `true` |

**返回值**：如果沒有設置 [heartbeat_check_interval](/zh-hant/server/setting.html#heartbeat-check-interval) 返回 `false`，否則返回被關閉的連接數組。

**示例**

```php
<?php
use Swoole\Server;
use Swoole\Timer;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['heartbeat_check_interval' => 1]);
$server->on('workerStart', function(Server $server, int $workerId) {
    Timer::tick(1000, function($timerId) use ($server) {
        $server->heartbeat();
    });
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, "Hello World");
});

$server->start();
```

> [!NOTE]
> 與 [heartbeat_idle_time](/zh-hant/server/setting.html#heartbeat-idle-time) 的區別是，`heartbeat_idle_time` 會自動做心跳檢測，不用像示例那樣需要使用者在代碼通過定時器實現。

## getClientList

獲取客戶端連接。

```php
public function getClientList(int $start_fd = 0, int $pageSize = 10): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$start_fd` | 指定起始 `fd` | `0` |
| `$pageSize` | 每頁取多少條，最大不得超過 `100` | `10` |

**返回值**：調用成功返回一個按升序排列的數字索引數組，元素爲獲取到的 `$fd`。取最後一個 `$fd` 作爲下次查詢的起始位置。調用失敗返回 `false`。

> [!WARNING]
> **注意**
>
> - 推薦使用 [connections 屬性](/zh-hant/server/properties.html#connections) 迭代器來遍歷連接。
> - `getClientList` 只能獲取 `tcp` 客戶端連接。
> - [SWOOLE_BASE 模式](/zh-hant/server/process_thread.html#工作模式) 和 [SWOOLE_THREAD 模式](/zh-hant/server/process_thread.html#工作模式) 只能獲取當前進程/線程的客戶端連接，[SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#工作模式) 可以獲取整個服務端的 `tcp` 連接。

## getClientInfo

獲取指定連接的客戶端信息。

```php
public function getClientInfo(int $fd, int $reactor_id = -1, bool $ignoreError = false): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 指定文件描述符 | 必填 |
| `$reactor_id` | 連接所在的 [reactor 線程](/zh-hant/server/process_thread.html#進程-線程) 線程編號，目前沒有任何作用，僅僅是爲了保持 API 兼容 | `-1` |
| `$ignoreError` | 是否忽略錯誤，如果設置爲 `true`，即使連接關閉也會返回連接的信息，`false` 表示連接關閉就返回 `false` | `false` |

**返回值**：調用成功返回包含客戶端信息的數組，調用失敗返回 `false`。

| 參數 | 作用 |
|:---|:---|
| server_port | 服務端監聽端口 |
| server_fd | 服務端 fd |
| socket_fd | 客戶端 fd |
| socket_type | 套接字類型 |
| remote_port | 客戶端端口 |
| remote_ip | 客戶端 IP |
| reactor_id | 來自哪個 Reactor 線程 |
| connect_time | 客戶端連接到服務端的時間，單位秒，由 master 進程設置 |
| last_time | 最後一次收到數據的時間，單位秒，由 master 進程設置 |
| last_recv_time | 最後一次收到數據的時間，單位秒，由 master 進程設置 |
| last_send_time | 最後一次發送數據的時間，單位秒，由 master 進程設置 |
| last_dispatch_time | worker 進程接收數據的時間 |
| close_errno | 連接關閉的錯誤碼，如果連接異常關閉，close_errno 的值是非零，可以參考 Linux 錯誤信息列表 |
| recv_queued_bytes | 等待處理的數據量 |
| send_queued_bytes | 等待發送的數據量 |
| websocket_status | [可選項] WebSocket 連接狀態，當服務器是 `Swoole\WebSocket\Server` 時會額外增加此項信息 |
| uid | [可選項] 使用 `bind` 綁定了用戶 ID 時會額外增加此項信息 |
| ssl_client_cert | [可選項] 使用 SSL 隧道加密，並且客戶端設置了證書時會額外添加此項信息 |

> [!WARNING]
> **注意**
>
> - `ssl_client_cert` 只能在 [connect 事件](/zh-hant/server/events.html#connect) 中調用 `getClientInfo` 獲取到。格式爲 `x509` 格式，可使用 `openssl_x509_parse` 函數獲取到證書信息。
> - [dispatch_mode](/zh-hant/server/setting.html#dispatch-mode) 爲 `SWOOLE_DISPATCH_ROUND` 或者 `SWOOLE_DISPATCH_IDLE_WORKER` 時，這些客戶端連接是無狀態的，當連接斷開後相關信息會直接從內存中刪除，因此 `getClientInfo` 無法查詢到這些連接的信息。

## getWorkerId

獲取當前 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 的 [編號](/zh-hant/server/setting.html#worker-num) 或者 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 的 [編號](/zh-hant/server/setting.html#task-worker-num)。

```php
public function getWorkerId(): int|false
```

**返回值**：進程不存在返回 `false`，否則返回進程的編號。

## getWorkerPid

獲取指定 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 的 `PID` 或者 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 的 `PID`。

```php
public function getWorkerPid(int $worker_id = -1): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$worker_id` | 獲取指定進程的 pid，`-1` 表示當前進程 | `-1` |

**返回值**：進程不存在返回 `false`，否則返回進程的 `PID`。

## getWorkerStatus

```php
public function getWorkerStatus(int $worker_id = -1): int|false
```

## getManagerPid

獲取 [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 的進程 `PID`。

```php
public function getManagerPid(): int
```

**返回值**：返回大於 0 的進程 `PID`。

## getMasterPid

獲取 [master 進程](/zh-hant/server/process_thread.html#進程-線程) 的進程 `PID`。

```php
public function getMasterPid(): int
```

**返回值**：返回大於 0 的進程 `PID`。

> [!NOTE]
> [SWOOLE_PROCESS](/zh-hant/server/process_thread.html#工作模式) 纔有 `master 進程`。

## getSocket

調用此方法可以得到底層的 `socket` 句柄，返回的對象爲 `sockets` 資源句柄。

```php
public function getSocket(int $port = 0): false|\Socket
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$port` | 指定監聽的端口，其它值：[多端口監聽](/zh-hant/server/port.html) 監聽的子端口 | [__construct](/zh-hant/server/methods.html#construct) 方法監聽的端口 |

**返回值**：監聽的端口不存在返回 `false`，否則返回 `php` 的 `Socket 對象`。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('0.0.0.0', 9905, SWOOLE_BASE, SWOOLE_SOCK_UDP);
$server->set(['worker_num' => 1]);
$socket = $server->getSocket();

$ret = socket_set_option(
    $socket,
    IPPROTO_IP,
    MCAST_JOIN_GROUP,
    array(
        'group' => '224.10.20.30', // 表示組播地址
        'interface' => 'eth0' // 表示網絡接口的名稱，可以爲數字或字符串，如eth0、wlan0
    )
);

if ($ret === false) {
    throw new RuntimeException('Unable to join multicast group');
}

$server->on('packet', function (Swoole\Server $server, $data, $addr) {
    $server->sendto($addr['address'], $addr['port'], "Swoole: $data");
    var_dump($addr, strlen($data));
});

$server->start();
```

> [!NOTE]
> 此方法需要依賴 PHP 的 `sockets` 擴展，並且編譯 `Swoole` 時需要開啓 `--enable-sockets` 選項

## push

`websocket` 服務端將數據推送給 `websocket` 客戶端。

```php
public function push(int $fd, Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 客戶端連接的文件描述符 | 必填 |
| `$data` | 要發送的數據內容 | 必填 |
| `$opcode` | 指定發送數據內容的格式，默認爲文本；發送二進制內容 `$opcode` 參數需要設置爲 `SWOOLE_WEBSOCKET_OPCODE_BINARY`；其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY`，`SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 標誌位；其它值：`SWOOLE_WEBSOCKET_FLAG_RSV1`，`SWOOLE_WEBSOCKET_FLAG_RSV2`，`SWOOLE_WEBSOCKET_FLAG_RSV3`，`SWOOLE_WEBSOCKET_FLAG_MASK`，`SWOOLE_WEBSOCKET_FLAG_COMPRESS` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

**示例**

- 發送單個數據幀，不壓縮

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    $response = new Frame();
    $response->data = $frame->data;
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    $response->finish = true;
    $server->push($frame->fd, $response);
});

$server->start();
```

- 發送壓縮後的數據幀

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'websocket_compression' => true  // 開啓幀壓縮
]);
$server->on('message', function(Server $server, Frame $frame) {
    $response = new Frame();
    $response->data = $frame->data;
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    $response->finish = true;
    $server->push($frame->fd, $response);
});

$server->start();
```

- 發送連續幀，不壓縮

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    // 發送連續幀，
    $response = new Frame();
    
    for ($i = 0; $i < 100; $i++) {
      $response->data = base64_encode(random_bytes(200));
      if ($i == 0) {
        // 第一個幀需要設置成SWOOLE_WEBSOCKET_OPCODE_TEXT或者SWOOLE_WEBSOCKET_OPCODE_BINARY
        $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
      } else {
        // 後續的幀需要設置成SWOOLE_WEBSOCKET_OPCODE_CONTINUATION
        $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
      }
      
      $response->finish = $i == 99;  // 除了最後一個幀設置爲true之外，其他必須爲false
      $server->push($frame->fd, $response);
    }
});

$server->start();
```

- 先壓縮數據，再發送連續幀

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'websocket_compression' => true  // 開啓幀壓縮
]);
$server->on('message', function(Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));

    $context = deflate_init(ZLIB_ENCODING_RAW);
    // 由於底層並不知道數據幀壓縮後需要拆分成多少塊，所以這一步需要使用者自己實現
    // 第一個幀需要手動設置finish爲false，flags爲SWOOLE_WEBSOCKET_FLAG_COMPRESS和SWOOLE_WEBSOCKET_FLAG_RSV1，並且不能設置SWOOLE_WEBSOCKET_FLAG_FIN，表明這是一個壓縮數據幀
    $response = new Frame();
    $response->data = deflate_add($context, $data1, ZLIB_SYNC_FLUSH);
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    $response->flags = SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1;
    $response->finish = false;
    $server->push($frame->fd, $response);
    
    // 剩餘的連續幀需要設置opcode爲SWOOLE_WEBSOCKET_OPCODE_CONTINUATION，且flags爲0，finish爲false
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
    $response->flags = 0;
    $response->finish = false;
    $server->push($frame->fd, $response);
    
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $server->push($frame->fd, $response);
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $server->push($frame->fd, $response);
    
    // 最後一個連續幀需要設置finish爲true，flags爲SWOOLE_WEBSOCKET_FLAG_FIN，表明數據已經發送完畢
    $response->data = deflate_add($context, $data3, ZLIB_SYNC_FLUSH);
    $response->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
    $response->finish = true;
    $server->push($frame->fd, $response);
});

$server->start();
```

- 發送控制幀（`ping`，`pong`和`close`）

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\WebSocket\CloseFrame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    $pingFrame = new Frame;
    $pingFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_PING;
    $server->push($frame->fd, $pingFrame);
    
    $pongFrame = new Frame;
    $pongFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_PONG;
    $server->push($frame->fd, $pongFrame);
    
    $closeFrame = new CloseFrame();
    $closeFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE;
    $closeFrame->code = SWOOLE_WEBSOCKET_CLOSE_NORMAL;
    $server->push($frame->fd, $closeFrame);
});

$server->start();
```

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

> [!WARNING]
> **注意**
>
> - 底層會自動處理控制幀，所以一般情況下，不需要使用者手動處理控制幀。
> - `push` 方法是 `Swoole\WebSocket\Server` 類的專屬方法。
> - 當使用 `Swoole\WebSocket\Frame` 和 `Swoole\WebSocket\CloseFrame` 時，請通過對象的**屬性**來設置 `$data`、`$opcode` 和 `$flags`，**方法參數**中的這三個值將被忽略。

## isEstablished

判斷 `websocket` 指定的客戶端連接是否有效。

```php
public function isEstablished(int $fd): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 客戶端連接的文件描述符 | 必填 |

**返回值**：如果是有效的連接返回 `true`，否則返回 `false`。

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
$server = new Server('127.0.0.1', 9502);
$server->on('message', function(Server $server, Frame $frame) {
    var_dump($server->isEstablished($frame->fd));
    $server->push($frame->fd, json_encode(['hello', 'world']));
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 與 [exists](/zh-hant/server/methods.html#exists) 不同，`exists` 方法僅判斷是否爲 `TCP` 連接，無法判斷是否爲已完成握手的 `WebSocket` 客戶端。
> - `isEstablished` 方法是 `Swoole\WebSocket\Server` 類的專屬方法。

## pack

打包 `webSocket` 數據幀。

```php
public static function pack(Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 消息內容 | 必填 |
| `$opcode` | 指定發送數據內容的格式，默認爲文本。發送二進制內容 `$opcode` 參數需要設置爲 `SWOOLE_WEBSOCKET_OPCODE_BINARY`。其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 幀標誌位，`SWOOLE_WEBSOCKET_FLAG_FIN` 表示幀已完成，值爲 `1` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

> [!NOTE]
> 自 `v4.4.12` 版本起，`finish` 參數（`bool` 型）改爲 `flags` 參數（`int` 型）以支持 `WebSocket` 壓縮，原有 `bool` 型值會隱式轉換爲 `int` 型，此改動向下兼容無影響；`mask` 參數已在 `v4.4.12` 版本移除。

**返回值**：操作成功返回打包好的 `WebSocket` 數據包，操作失敗返回空字符串。

**示例**

```php
<?php
use Swoole\Server;
$ws = new Server('127.0.0.1', 9501 , SWOOLE_BASE);

$ws->on('WorkerStart', function (Server $serv) {
});

$ws->on('receive', function (Server $serv, int $fd, int $threadId, string $data) {
    $sendData = "HTTP/1.1 101 Switching Protocols\r\n";
    $sendData .= "Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: IFpdKwYy9wdo4gTldFLHFh3xQE0=\r\n";
    $sendData .= "Sec-WebSocket-Version: 13\r\nServer: swoole-http-server\r\n\r\n";
    $sendData .= Swoole\WebSocket\Server::pack("hello world\n");
    $serv->send($fd, $sendData);
});

$ws->start();
```

> [!WARNING]
> **注意**
>
> - `pack` 的使用場景比較特定，最常見的就是在 [TCP 服務器](/zh-hant/server/tcp_udp.html) 將數據打包成數據幀發送給 `WebSocket` 客戶端。
> - 如果 `$data` 爲 `Swoole\WebSocket\Frame` 對象，其 `$opcode` 和 `$finish` 屬性會覆蓋方法參數中的對應值。
> - 如果無特殊要求，請直接使用 [Swoole\WebSocket\Server](/zh-hant/server/websocket.html)，數據的打包和解析都是自動的。
> - `pack` 方法是 `Swoole\WebSocket\Server` 類的專屬方法。

## unpack

解析 `webSocket` 數據幀。

```php
public static function unpack(string $data): Swoole\WebSocket\Frame
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 消息內容 | 必填 |

**返回值**：解析成功返回 [Swoole\WebSocket\Frame 對象](/zh-hant/server/class/frame.html)，解析失敗返回 `false`。

> [!WARNING]
> **注意**
>
> - `unpack` 的使用場景比較特定，最常見的就是在 [TCP 服務器](/zh-hant/server/tcp_udp.html) 中解析 `WebSocket` 客戶端發來的數據。
> - 如果無特殊要求，請直接使用 [Swoole\WebSocket\Server](/zh-hant/server/websocket.html)，數據的打包和解析都是自動的。
> - `unpack` 方法是 `Swoole\WebSocket\Server` 類的專屬方法。

## disconnect

`websocket` 服務器主動關閉指定的客戶端連接。

```php
public function disconnect(int $fd, int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 客戶端連接的文件描述符 | 必填 |
| `$code` | 關閉連接的狀態碼。根據 `RFC6455`，對於應用程序關閉連接狀態碼，取值範圍爲 `1000` 或 `4000-4999` 之間 | `SWOOLE_WEBSOCKET_CLOSE_NORMAL` |
| `$reason` | 關閉連接的原因，`utf-8` 格式字符串，字節長度不超過 `125` | 必填 |

**返回值**：發送成功返回 `true`，發送失敗或狀態碼非法時返回 `false`。

**示例**

```php
<?php
use Swoole\Websocket\Server;
use Swoole\Websocket\Frame;

$server = new Server('127.0.0.1', 9502);
$server->on('message', function(Server $server, Frame $frame) {
    $server->push($frame->fd, json_encode(['hello', 'world']));
    $server->disconnect($frame->fd, SWOOLE_WEBSOCKET_CLOSE_NORMAL, "normal close");
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 請使用 `disconnect` 來關閉 `websocket` 連接，該方法會自動發送 `close` 關閉幀給客戶端並關閉連接。
> - `disconnect` 方法是 `Swoole\WebSocket\Server` 類的專屬方法。

**支持的狀態碼**

| 狀態碼常量 | 中文說明 |
|:---|:---|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL | **正常關閉** - 連接已完成工作，正常結束 |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY | **正在離開** - 端點離開（如瀏覽器跳轉或關閉頁面） |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR | **協議錯誤** - 端點收到不符合 WebSocket 協議的數據 |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR | **數據類型錯誤** - 收到無法處理的數據類型（如端點只接收文本卻收到二進制） |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR | **狀態碼無效** - 預期收到狀態碼但未收到（實際不發送此碼，用於應用） |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL | **異常關閉** - 連接非預期斷開（如沒收到關閉幀就斷開，不主動發送） |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR | **消息格式錯誤** - 收到不符合規範的消息（如 UTF-8 編碼錯誤） |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR | **違反策略** - 消息違反服務器策略（通用拒絕原因） |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG | **消息過大** - 消息長度超出端點願意處理的範圍 |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING | **缺少擴展** - 客戶端期望服務器協商特定擴展，但服務器未提供（客戶端專用） |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR | **服務器內部錯誤** - 服務器遇到異常情況無法完成請求 |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER | **稍後重試** - 服務器臨時過載或維護中，建議稍後再連 |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY | **網關錯誤** - 網關或代理收到無效的上游響應 |
| SWOOLE_WEBSOCKET_CLOSE_TLS | **TLS 握手失敗** - TLS 握手未完成就關閉（不主動發送） |

## ping

`websocket` 服務器向客戶端發送 `ping` 幀。

```php
public function ping(int $fd, string $data = ""): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 客戶端連接的文件描述符 | 必填 |
| `$data` | `ping` 幀需要攜帶的數據 | `''` |

**返回值**：發送成功返回 `true`，發送失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Websocket\Server;
use Swoole\Websocket\Frame;

$server = new Server('127.0.0.1', 9502);
$server->on('message', function(Server $server, Frame $frame) {
    $server->push($frame->fd, json_encode(['hello', 'world']));
    $server->ping($frame->fd, 'Hello World');
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 除非設置 [open_websocket_pong_frame](/zh-hant/server/setting.html#open-websocket-pong-frame) 爲 `true`，否則客戶端發送的 `pong` 幀會被底層自動處理。
> - `ping` 方法是 `Swoole\WebSocket\Server` 類的專屬方法。

## setHandler

註冊 `Redis` 服務器命令的處理邏輯，你可以通過它來指定服務器如何響應 `LPUSH`、`GET`、`SET` 命令。

```php
public function setHandler(string $command, callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$command` | 命令的名稱 | 必填 |
| `$callback` | 命令的處理函數，回調函數返回字符串類型時會自動發送給客戶端 | 必填 |

**返回值**：註冊成功返回 `true`，註冊失敗返回 `false`。

**$callback 函數簽名**

```php
function(int $fd, array $data)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fd` | 當前連接的文件描述符 | 必填 |
| `$data` | 客戶端發送過來的數據，例如客戶端發送的命令是 `set name swoole`，那麼 `$data[0]` 爲 `name`，`$data[1]` 爲 `swoole`，以此類推 | 必填 |

**示例**

```php
<?php
use Swoole\Redis\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(['worker_num' => 1]);
$server->setHandler('get', function(int $fd, array $data) use ($server) {
    if (count($data) == 0) {
        // 通過return返回的字符串數據，底層會將它發送給redis客戶端
        return Server::format(Server::ERROR, "ERR wrong number of arguments for 'GET' command");
    }
    // 通過redis客戶端發送get命令時，服務端會返回hello
    $server->send($fd, Server::format(Server::STRING, "hello"));
});
$server->start();
```

> [!WARNING]
> **注意**
>
> - 如果 `$callback` 中通過 `return` 返回了字符串數據，底層會將這個返回值返回給 `redis` 客戶端。
> - `setHandler` 方法是 `Swoole\Redis\Server` 類的專屬方法。

## getHandler

獲取 `Redis` 服務器指定命令的處理邏輯。

```php
public function getHandler(string $command): \Closure
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$command` | 命令的名稱 | 必填 |

**返回值**：成功返回對應的回調函數。

> [!NOTE]
> `getHandler` 方法是 `Swoole\Redis\Server` 類的專屬方法。

## format

將 `PHP` 數據格式化爲標準的 `Redis` 通信協議 `(RESP)` 格式，方便服務器返回給客戶端

```php
public static function format(int $type, mixed $value = null): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$type` | 數據類型 | 必填 |
| `$value` | 需要格式化的數據 | 必填 |

**返回值**：操作成功返回格式化後的數據，操作失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Redis\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(['worker_num' => 1]);
$server->setHandler('get', function(int $fd, array $data) use ($server) {
    if (count($data) == 0) {
        return Server::format(Server::ERROR, "ERR wrong number of arguments for 'GET' command");
    }
    // 通過redis客戶端發送get命令時，服務端會返回hello
    $server->send($fd, Server::format(Server::STRING, "hello"));
});
$server->start();
```

**支持的數據類型**

| 常量 | 說明 |
|:---|:---|
| Swoole\Redis\Server::NIL | 返回 nil 數據 |
| Swoole\Redis\Server::ERROR | 返回錯誤碼 |
| Swoole\Redis\Server::STATUS | 返回狀態 |
| Swoole\Redis\Server::INT | 返回整數，format 必須傳入參數值，類型必須爲整數 |
| Swoole\Redis\Server::STRING | 返回字符串，format 必須傳入參數值，類型必須爲字符串 |
| Swoole\Redis\Server::SET | 返回列表，format 必須傳入參數值，類型必須爲數組 |
| Swoole\Redis\Server::MAP | 返回 Map，format 必須傳入參數值，類型必須爲關聯索引數組 |

> [!NOTE]
> `format` 方法是 `Swoole\Redis\Server` 類的專屬方法。

## getLastError

獲取最近一次 `Swoole` 底層錯誤的錯誤碼，等同於 [swoole_last_error()](/zh-hant/functions.html#swoole-last-error)。

```php
public function getLastError(): int
```

**返回值**：`Swoole` 底層錯誤碼整數。可使用 [swoole_strerror](/zh-hant/functions.html#swoole-strerror) 將錯誤碼轉換爲錯誤信息，使用 [swoole_clear_error](/zh-hant/functions.html#swoole-clear-error) 清零。

> [!TIP]
> 與 [swoole_errno()](/zh-hant/functions.html#swoole-errno) 不同，`getLastError` 返回的是 `Swoole` 內部錯誤碼，而不是操作系統 `errno`。

