# 進程池

進程池`Swoole\Process\Pool`，基於 [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 的 [`Manager`](/zh-hant/server/process_thread.html#manager) 進程管理模塊實現，用於管理多個工作進程。

相比用 [Swoole\Process](/zh-hant/process/process.html) 手寫多進程，`Swoole\Process\Pool` 封裝層次更高，進程管理代碼更少。配合[協程 TCP/UDP 服務器](/zh-hant/server/coroutine/tcp_udp.html#示例)可創建純協程風格、利用多核 `CPU` 的服務端程序。

## 方法

### __construct

構造方法。

```php
public function __construct(int $worker_num, int $ipc_type = SWOOLE_IPC_NONE, int $msgqueue_key = 0, bool $enable_coroutine = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$worker_num` | 工作進程數量 | 必填 |
| `$ipc_type` | 通信模式，取值見下表 | `SWOOLE_IPC_NONE` |
| `$msgqueue_key` | 消息隊列的 `key` | `0` |
| `$enable_coroutine` | 是否啓用協程。啓用後無法設置 `Message` 回調，見[協程模式](#協程模式) | `false` |

**`$ipc_type` 取值**

| 常量 | 說明 |
|:---|:---|
| `SWOOLE_IPC_NONE` | 不啓用進程間通信，`$ipc_type` 的默認值 |
| `SWOOLE_IPC_MSGQUEUE` | 系統消息隊列通信 |
| `SWOOLE_IPC_SOCKET` | `Socket` 通信 |
| `SWOOLE_IPC_UNIXSOCK` | `unixSocket` 通信（`v4.4`+） |

`$ipc_type` 非 `SWOOLE_IPC_NONE` 時，必須設置 `Message` 回調，`WorkerStart` 變爲可選。

**SWOOLE_IPC_NONE**

不啓用進程間通信。必須設置 `WorkerStart` 回調並在其中實現循環邏輯；回調返回即工作進程退出，隨後由 `Manager` 進程重新拉起。

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

// 2 個工作進程，不啓用進程間通信，啓用協程
$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    Coroutine::sleep($workerId + 1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    if ($workerId == 1) {
        // 回調返回即工作進程退出並被重新拉起，此處終止整個進程池
        $pool->shutdown();
    }
});

$pool->start();
```

**SWOOLE_IPC_MSGQUEUE**

使用系統消息隊列通信，可由 `sysvmsg` 擴展投遞消息，單條消息不超過 `65536` 字節。

> [!NOTE]
> 用 `sysvmsg` 擴展投遞消息時，構造函數必須傳入 `$msgqueue_key`；未設置時底層申請私有隊列。

> [!WARNING]
> 底層不支持 `sysvmsg` 擴展 `msg_send` 的第二個參數 `mtype`，須傳入任意非 `0` 值。

**示例**

接收端（進程池）：

```php
<?php
use Swoole\Process;

$key = 0x7000001;

// 由外部 sysvmsg 擴展投遞時，構造函數必須傳入 $msgqueue_key
$pool = new Process\Pool(2, SWOOLE_IPC_MSGQUEUE, $key);

// 非 SWOOLE_IPC_NONE 模式下 WorkerStart 可選，只設置 Message 即可
$pool->on('Message', function (Process\Pool $pool, string $data) {
    $msg = json_decode($data, true);
    echo "index: {$msg['index']}\n";
});

$pool->start();
```

投遞端（`sysvmsg` 擴展）：

```php
<?php
$key = 0x7000001;
$q = msg_get_queue($key);

foreach (range(1, 100) as $i) {
    $data = json_encode(['data' => base64_encode(random_bytes(1024)), 'id' => uniqid(), 'index' => $i]);
    // 第二個參數 mtype 須傳入任意非 0 值
    msg_send($q, $i, $data, false);
}
```

**SWOOLE_IPC_SOCKET**

使用 `Socket` 通信，適用於客戶端與服務端不在同一臺機器的場景。

用 [listen](#listen) 監聽端口，`Message` 事件接收客戶端數據，[write](#write) 返回響應。

客戶端發送數據時，須在實際數據前附加 `4` 字節網絡字節序的長度值：

```php
<?php
$msg = 'Hello Swoole';
$packet = pack('N', strlen($msg)) . $msg;
```

**示例**

服務端：

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_SOCKET);

$pool->on('Message', function (Process\Pool $pool, string $data) {
    echo "recv: {$data}\n";
    $pool->write("hello client\n");
});

$pool->listen('127.0.0.1', 8089);
$pool->start();
```

調用端：

```php
<?php
$fp = stream_socket_client('tcp://127.0.0.1:8089', $errno, $errstr) or die("error: {$errstr}\n");

$msg = 'hello swoole';
// 請求須附加 4 字節網絡字節序的長度值
fwrite($fp, pack('N', strlen($msg)) . $msg);

// 響應同樣帶 4 字節長度頭
$data = fread($fp, 8192);
echo substr($data, 4, unpack('N', substr($data, 0, 4))[1]);

fclose($fp);
```

**SWOOLE_IPC_UNIXSOCK**

使用 `unixSocket` 通信，**強烈推薦**的方式。

通過 [sendMessage](#sendmessage) 與 `Message` 事件即可通信。開啓協程模式後，也可用 [getProcess](#getprocess) 取得 `Swoole\Process` 對象，再用 [exportSocket](/zh-hant/process/process.html#exportsocket) 導出 `Swoole\Coroutine\Socket` 通信；此時不能設置 `Message` 事件，見[協程模式](#協程模式)。

**示例**

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        $pool->sendMessage('ping', 1);
    }
});

$pool->on('Message', function (Process\Pool $pool, string $data) {
    echo "recv: {$data}\n";
    // Message 回調只有 $data，沒有進程編號，用內容區分收發方向
    if ($data === 'ping') {
        $pool->sendMessage('pong', 0);
        return;
    }
    $pool->shutdown();
});

$pool->start();
```

### set

設置參數。

```php
public function set(array $settings): void
```

| 配置項 | 類型 | 說明 | 默認值 |
|:---|:---|:---|:---|
| `enable_coroutine` | `bool` | 是否啓用協程 | `false` |
| `enable_message_bus` | `bool` | 啓用消息總線。爲 `true` 時底層將大數據切分爲小塊逐塊發送 | `false` |
| `max_package_size` | `int` | 進程可接收的最大數據量，單位爲字節 | `2 * 1024 * 1024` |

- `enable_message_bus` 爲 `true` 時 `max_package_size` 無效，底層拆分發送、合併接收。
- `SWOOLE_IPC_MSGQUEUE` 模式下 `max_package_size` 無效，底層單次最多接收 `65536`。
- `SWOOLE_IPC_SOCKET` 模式下 `enable_message_bus` 爲 `false` 時，數據量超過 `max_package_size` 會直接中斷連接。
- `SWOOLE_IPC_UNIXSOCK` 模式下 `enable_message_bus` 爲 `false` 時，超過 `max_package_size` 的數據被截斷。
- 協程模式下 `enable_message_bus` 爲 `true` 時 `max_package_size` 同樣無效，底層負責拆分（發送）與合併（接收）；爲 `false` 時按 `max_package_size` 限制接收量。

> [!WARNING]
> Swoole 版本 >= `v4.4.4` 可用

**示例**

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);

// 須在 start() 之前調用
$pool->set([
    'enable_coroutine' => false,
    'enable_message_bus' => true,
    'max_package_size' => 2 * 1024,
]);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        // 開啓消息總線後，6000 字節被拆分發送、合併接收，不會截斷爲 2048
        $pool->sendMessage(str_repeat('a', 6000), 1);
    }
});

$pool->on('Message', function (Process\Pool $pool, string $data) {
    echo 'recv ' . strlen($data) . " bytes\n";
    $pool->shutdown();
});

$pool->start();
```

### on

設置進程池回調函數。

```php
public function on(string $event, callable $function): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$event` | 事件名稱，見下方事件列表 | 必填 |
| `$function` | 回調函數 | 必填 |

**事件**

- **`WorkerStart`** 子進程啓動。回調 `function (Pool $pool, int $workerId)`，`$workerId` 爲底層分配的工作進程編號。
- **`WorkerStop`** 子進程結束。回調 `function (Pool $pool, int $workerId)`。
- **`Message`** 收到消息。回調 `function (Pool $pool, string $data)`，`$data` 爲消息內容。

> [!NOTE]
> 事件名不區分大小寫，`WorkerStart`、`workerStart`、`workerstart` 等價。

> [!WARNING]
> `Message` 接收外部投遞的消息，一次連接只能投遞一次，類似 `PHP-FPM` 的短連接機制。

**示例**

```php
<?php
use Swoole\Process\Pool;
$pool = new Pool(2, SWOOLE_IPC_UNIXSOCK);

$pool->on('WorkerStart', function (Pool $pool, int $workerId) {
    if ($workerId == 0) {
        $pool->sendMessage('hello worker 1', 1);
    }
});

$pool->on('Message', function (Pool $pool, string $data) {
    var_dump($data);
    $pool->shutdown();
});

$pool->on('WorkerStop', function (Pool $pool, $workerId) {
    echo("[Worker #{$workerId}] WorkerStop\n");
});

$pool->start();
```

### listen

監聽 `Socket`，僅 `$ipc_type` 爲 `SWOOLE_IPC_SOCKET` 時可用。

```php
public function listen(string $host, int $port = 0, int $backlog = 2048): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 監聽地址，支持 `TCP` 與 `unixSocket`。`127.0.0.1` 爲 `TCP` 地址，須指定 `$port`；`unix:/tmp/php.sock` 爲 `unixSocket` 地址 | 必填 |
| `$port` | 監聽端口，`TCP` 模式下須指定 | `0` |
| `$backlog` | 監聽隊列長度 | `2048` |

**返回值**：成功返回 `true`；失敗返回 `false`，可用 `swoole_errno` 獲取錯誤碼。監聽失敗後 `start` 立即返回 `false`。

**通信協議**：客戶端須在請求數據前附加 `4` 字節網絡字節序的長度值。

```php
<?php
// $msg 需要發送的數據
$packet = pack('N', strlen($msg)) . $msg;
```

**示例**

```php
<?php
$pool->listen('127.0.0.1', 8089);
$pool->listen('unix:/tmp/php.sock');
```

### write

向對端寫入數據，僅 `$ipc_type` 爲 `SWOOLE_IPC_SOCKET` 時可用。

```php
public function write(string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 寫入的數據。可多次調用 `write`，底層在 `Message` 回調退出後將全部數據寫入 `socket` 並 `close` 連接 | 必填 |

> [!NOTE]
> 此方法爲內存操作，無 `IO` 消耗；實際發送爲同步阻塞 `IO`。

**示例**

服務端：

```php
<?php
$pool = new Swoole\Process\Pool(2, SWOOLE_IPC_SOCKET);

$pool->on("Message", function ($pool, $message) {
    echo "Message: {$message}\n";
    $pool->write("hello ");
    $pool->write("world ");
    $pool->write("\n");
});

$pool->listen('127.0.0.1', 8089);
$pool->start();
```

調用端：

```php
<?php
$fp = stream_socket_client("tcp://127.0.0.1:8089", $errno, $errstr) or die("error: $errstr\n");
$msg = json_encode(['data' => 'hello', 'uid' => 1991]);
fwrite($fp, pack('N', strlen($msg)) . $msg);
sleep(1);
// 將顯示 hello world\n
$data = fread($fp, 8192);
var_dump(substr($data, 4, unpack('N', substr($data, 0, 4))[1]));
fclose($fp);
```

### sendMessage

向目標進程發送數據，僅 `$ipc_type` 爲 `SWOOLE_IPC_UNIXSOCK` 時可用。

```php
public function sendMessage(string $data, int $dst_worker_id): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 發送的數據 | 必填 |
| `$dst_worker_id` | 目標進程 `id` | 必填 |

**返回值**：成功返回 `true`，失敗返回 `false`。

> [!WARNING]
> 數據大於 `max_package_size` 且 `enable_message_bus` 爲 `false` 時，目標進程接收時會截斷數據。

**示例**

`2` 個進程，進程 `0` 向進程 `1` 發送 `6000` 字節，進程 `1` 在 `Message` 回調中打印收到的長度。關閉消息總線時截斷爲 `2048`，開啓後完整收到 `6000`。

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);
$pool->set([
    'enable_coroutine' => false,
    // 'enable_message_bus' => true, // 開啓後輸出 int(6000)
    'enable_message_bus' => false,   // 關閉後輸出 int(2048)
    'max_package_size' => 2 * 1024,
]);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        $pool->sendMessage(str_repeat('a', 2 * 3000), 1);
    }
});

$pool->on('Message', function (Process\Pool $pool, string $data) {
    var_dump(strlen($data));
});

$pool->start();
```

### start

啓動工作進程。

```php
public function start(): bool
```

> [!NOTE]
> 啓動成功後當前進程進入 `wait` 狀態管理工作進程；失敗返回 `false`，可用 `swoole_errno` 獲取錯誤碼。

**進程管理**

- 工作進程因致命錯誤或主動退出時，管理器負責回收，避免殭屍進程。
- 工作進程退出後，管理器自動創建新的工作進程補位。
- 主進程收到 `SIGTERM` 時停止 `fork` 新進程，並 `kill` 所有運行中的工作進程。
- 主進程收到 `SIGUSR1` 時逐個 `kill` 運行中的工作進程並重啓新進程。

**信號處理**

底層只設置主進程（管理進程）的信號處理，`Worker` 進程的信號監聽須自行實現。

- 異步模式用 [Swoole\Process::signal](/zh-hant/process/process.html#signal) 監聽信號。
- 同步模式用 `pcntl_signal` 與 `pcntl_signal_dispatch` 監聽信號。

工作進程應監聽 `SIGTERM`：主進程終止它時會發送該信號。未監聽則底層強行終止進程，導致部分邏輯丟失。

```php
<?php
$pool->on("WorkerStart", function ($pool, $workerId) {
    $running = true;
    pcntl_signal(SIGTERM, function () use (&$running) {
        $running = false;
    });
    echo "Worker#{$workerId} is started\n";
    $redis = new Redis();
    $redis->pconnect('127.0.0.1', 6379);
    $key = "key1";
    while ($running) {
        $msg = $redis->brpop($key, 2);
        pcntl_signal_dispatch();
        if ($msg == null) continue;
        var_dump($msg);
    }
});
```

**示例**

```php
<?php
$workerNum = 10;
$pool = new Swoole\Process\Pool($workerNum);

$pool->on("WorkerStart", function ($pool, $workerId) {
    echo "Worker#{$workerId} is started\n";
    $redis = new Redis();
    $redis->pconnect('127.0.0.1', 6379);
    $key = "key1";
    while (true) {
        $msg = $redis->brpop($key, 2);
        if ($msg == null) continue;
        var_dump($msg);
    }
});

$pool->on("WorkerStop", function ($pool, $workerId) {
    echo "Worker#{$workerId} is stopped\n";
});

$pool->start();
```

### stop

將當前進程的套接字移出事件循環，僅協程模式下有效。

```php
public function stop(): bool
```

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

// stop() 僅在協程模式下有效
$pool = new Process\Pool(1, SWOOLE_IPC_UNIXSOCK, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    // 移出事件循環後不再接收進程間消息，但進程自身仍可繼續執行
    $pool->stop();

    Coroutine::sleep(1);
    echo "worker #{$workerId} still running\n";
    $pool->shutdown();
});

$pool->start();
```

### shutdown

終止工作進程。

```php
public function shutdown(): bool
```

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    for ($i = 0; $i < 3; $i++) {
        Coroutine::sleep(0.5);
        echo "worker #{$workerId} task {$i}\n";
    }
    if ($workerId == 1) {
        // 等待其他工作進程完成任務後終止整個進程池
        Coroutine::sleep(1);
        $pool->shutdown();
    }
});

$pool->on('WorkerStop', function (Process\Pool $pool, int $workerId) {
    echo "worker #{$workerId} stopped\n";
});

$pool->start();
```

### getProcess

獲取工作進程對象，返回 [Swoole\Process](/zh-hant/process/process.html)。

```php
public function getProcess(int $worker_id = -1): Swoole\Process
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$worker_id` | 目標 `worker` 編號 | 當前 `worker` |

> [!WARNING]
> 須在 `start` 之後、工作進程的 `WorkerStart` 或其他回調中調用。返回的 `Process` 對象爲單例，同一工作進程內重複調用 `getProcess()` 返回同一對象。

> [!NOTE]
> Swoole 版本 >= `v4.2.0` 可用

**示例**

```php
<?php
$pool = new Swoole\Process\Pool(3);

$pool->on('WorkerStart', function ($pool, $workerId) {
    $process = $pool->getProcess();
    $process->exec('/usr/local/bin/php', ['-r', 'var_dump(swoole_version());']);
});

$pool->start();
```

### detach

將當前 `Worker` 進程脫離進程池管理。底層立即創建新進程，原進程不再處理數據，生命週期由應用層自行管理。

```php
public function detach(): bool
```

> [!NOTE]
> Swoole 版本 >= `v4.7.0` 可用

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        // 脫離進程池管理，底層立即創建新進程補位
        $pool->detach();
        echo "detached pid: " . getmypid() . "\n";
        Coroutine::sleep(1);
        // 脫離後生命週期由應用層自行管理
        exit(0);
    }

    Coroutine::sleep(2);
    // 終止進程池，避免工作進程被反覆拉起
    $pool->shutdown();
});

$pool->start();
```

## 協程模式

`v4.4.0` 起支持協程，將構造函數第 `4` 個參數設爲 `true` 啓用。啓用後底層在 `WorkerStart` 時自動創建協程與[協程容器](/zh-hant/coroutine/container.html)，回調中可直接使用協程 `API`。

```php
<?php
$pool = new Swoole\Process\Pool(1, SWOOLE_IPC_NONE, 0, true);

$pool->on('workerStart', function (Swoole\Process\Pool $pool, int $workerId) {
    while (true) {
        Co::sleep(0.5);
        echo "hello world\n";
    }
});

$pool->start();
```

協程模式下禁止設置 `Message` 回調。需要進程間通信時，`$ipc_type` 必須爲 `SWOOLE_IPC_UNIXSOCK`，通過 `$pool->getProcess()->exportSocket()` 導出 `Swoole\Coroutine\Socket` 對象實現 `Worker` 間通信。

```php
<?php
$pool = new Swoole\Process\Pool(2, SWOOLE_IPC_UNIXSOCK, 0, true);

$pool->on('workerStart', function (Swoole\Process\Pool $pool, int $workerId) {
    $process = $pool->getProcess(0);
    $socket = $process->exportSocket();
    if ($workerId == 0) {
        echo $socket->recv();
        $socket->send("hello proc1\n");
        echo "proc0 stop\n";
    } else {
        $socket->send("hello proc0\n");
        echo $socket->recv();
        echo "proc1 stop\n";
        $pool->shutdown();
    }
});

$pool->start();
```

> [!NOTE]
> 用法見 [Socket 客戶端](/zh-hant/client/socket.html) 與 [Swoole\Process](/zh-hant/process/process.html#exportsocket)。

