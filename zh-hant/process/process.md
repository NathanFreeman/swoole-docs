# 創建進程

`Swoole\Process` 是 `Swoole` 的進程管理模塊，用於替代 `PHP` 的 `pcntl` 擴展。

> [!WARNING]
> 此模塊是操作系統進程管理的底層封裝，使用者需具備 `Linux` 多進程編程經驗。

> [!IMPORTANT]
> 協程內禁止創建進程，`start()` 不可在協程中調用。協程環境下管理外部程序應使用 [`runtime hook`](/zh-hant/coroutine/hook.html) + `proc_open`，見[禁止在協程中創建進程](/zh-hant/coroutine/others.html#禁止在協程中創建進程)。

## 屬性

### id

當前進程 `id`。

```php
public int $id
```

### pid

當前進程的 `pid`。

```php
public int $pid
```

### pipe

`unixSocket` 的文件描述符。

```php
public int $pipe
```

### msgQueueId

消息隊列的 `id`。

```php
public int $msgQueueId
```

### msgQueueKey

消息隊列的 `key`。

```php
public ?int $msgQueueKey
```

## 方法

### __construct

構造方法，僅創建對象並保存子進程回調，不會 `fork` 進程；調用 [start](#start) 後才真正創建子進程。

```php
public function __construct(callable $function, bool $redirect_stdin_stdout = false, int $pipe_type = Swoole\Process::PIPE_TYPE_DGRAM, bool $enable_coroutine = false)
```

| 參數 | 說明                                                                                                                                            | 默認值 |
|:---|:----------------------------------------------------------------------------------------------------------------------------------------------|:---|
| `$function` | 子進程啓動後執行的回調函數。底層將其存入對象的 `callback` 屬性，該屬性爲 `private`，外部不可訪問                                                                                   | 必填 |
| `$redirect_stdin_stdout` | 重定向子進程的標準輸入輸出。啓用後子進程的輸出寫入主進程管道而非屏幕，鍵盤輸入改爲從管道讀取，默認阻塞讀取。參見 [exec](#exec)                                                                        | `false` |
| `$pipe_type` | `unixSocket` 類型。啓用 `$redirect_stdin_stdout` 時忽略此參數，強制爲 `Swoole\Process::PIPE_TYPE_STREAM`。<br>子進程內無進程間通信時可設爲 `Swoole\Process::PIPE_TYPE_NONE` | `Swoole\Process::PIPE_TYPE_DGRAM` |
| `$enable_coroutine` | 在 `$function` 中啓用協程，啓用後可直接使用協程 `API`                                                                                                          | `false` |

**`$pipe_type` 取值**

| 值 | 說明                                |
|:---|:----------------------------------|
| `Swoole\Process::PIPE_TYPE_NONE` | 不創建`unixSocket`通信                 |
| `Swoole\Process::PIPE_TYPE_STREAM` | 創建 `SOCK_STREAM` 類型的 `unixSocket` |
| `Swoole\Process::PIPE_TYPE_DGRAM` | 創建 `SOCK_DGRAM` 類型的 `unixSocket`  |

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo 'child pid: ' . getmypid() . PHP_EOL;
}, false, Process::PIPE_TYPE_STREAM, false);

$process->start();

Process::wait();
```

### set

設置參數。

```php
public function set(array $settings): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 配置數組。`enable_coroutine` 控制是否啓用協程，等同於構造函數的第 4 個參數 | 必填 |

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    Swoole\Coroutine::sleep(1);
    echo "child exit\n";
});

// 須在 start() 之前調用
$process->set(['enable_coroutine' => true]);
$process->start();

Process::wait();
```

### start

執行 `fork` 系統調用創建子進程，`Linux` 下耗時數百微秒。

```php
public function start(): int|false
```

**返回值**：成功返回子進程的 `PID`，失敗返回 `false`，可用 `swoole_errno` 和 `swoole_strerror` 獲取錯誤碼與錯誤信息。

- 子進程繼承父進程的內存與文件句柄。
- 啓動時清除繼承自父進程的 `EventLoop`、[signal](#signal) 與 [Timer](/zh-hant/timer.html)。

> [!WARNING]
> 子進程沿用父進程的內存與資源。父進程已創建的 `redis` 連接在子進程中保留爲同一對象，父子操作的是同一個連接。

**示例**

```php
<?php
$redis = new Redis;
$redis->connect('127.0.0.1', 6379);

function callback_function() {
    swoole_timer_after(1000, function () {
        echo "hello world\n";
    });
    global $redis;//同一個連接
};

swoole_timer_tick(1000, function () {
    echo "parent timer\n";
});//不會繼承

Swoole\Process::signal(SIGCHLD, function ($sig) {
    while ($ret = Swoole\Process::wait(false)) {
        // create a new child process
        $p = new Swoole\Process('callback_function');
        $p->start();
    }
});

// create a new child process
$p = new Swoole\Process('callback_function');

$p->start();
```

### name

修改進程名稱，是 `swoole_set_process_name` 的別名。

```php
public function name(string $name): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 新的進程名稱 | 必填 |

> [!WARNING]
> `exec` 後進程名稱由新程序重新設置。應在 `start` 之後的子進程回調函數中調用 `name`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->name('my-worker');
    // 此時可用 ps aux | grep my-worker 觀察到新進程名
    sleep(5);
});

$process->start();

Process::wait();
```

### exec

執行外部程序，是 `exec` 系統調用的封裝。執行成功後當前進程的代碼段被新程序替換，父子進程關係保持不變。

```php
public function exec(string $execfile, array $args)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$execfile` | 可執行文件的絕對路徑，如 `/usr/bin/python` | 必填 |
| `$args` | 參數列表，各參數獨立放入數組。`array('test.py', 123)` 等價於 `python test.py 123` | 必填 |

> [!WARNING]
> `$execfile` 必須是絕對路徑，否則報文件不存在。`exec` 不同於 `shell_exec`，整條命令不能寫成一個字符串。
>
> 父進程與新進程通過標準輸入輸出通信，須啓用重定向；未設置 `redirect_stdin_stdout = true` 時，`exec` 後兩者無法通信。

**示例**

子進程中運行 `Swoole\Server`，須在 `start()` 之後再調用 `exec()`：

```php
<?php
$process = new Swoole\Process('callback_function', true);

$pid = $process->start();

function callback_function(Swoole\Process $worker)
{
    $worker->exec('/usr/local/bin/php', array(__DIR__ . '/swoole_server.php'));
    // $worker->exec('/usr/local/bin/php' . __DIR__ . '/swoole_server.php'); // 不允許這樣把命令和參數全部寫在一起
}

Swoole\Process::wait();
```

執行 `shell` 命令須經 `/bin/sh` 的 `-c` 參數：

```php
<?php
$worker->exec('/bin/sh', array('-c', "cp -rf /data/test/* /tmp/test/"));
```

### exit

退出子進程。

```php
public function exit(int $status = 0)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$status` | 退出狀態碼。`0` 爲正常結束，執行清理工作（`PHP` 的 `shutdown_function`、對象析構 `__destruct`、其他擴展的 `RSHUTDOWN` 函數）；非 `0` 爲異常退出，立即終止進程並跳過清理 | `0` |

父進程通過 [Process::wait](#wait) 獲取子進程的退出事件與狀態碼。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    register_shutdown_function(function () {
        echo "cleanup\n";
    });
    // 傳 0 會執行上面的清理函數，傳非 0 則跳過
    $child->exit(0);
});

$process->start();

$status = Process::wait();
echo "exit code: {$status['code']}\n";
```

### kill

向指定進程發送信號。

```php
public static function kill(int $pid, int $signo = SIGTERM): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$pid` | 目標進程的 `pid` | 必填 |
| `$signo` | 信號編號。傳 `0` 僅檢測進程是否存在，不發送信號 | `SIGTERM` |

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function () {
    sleep(10);
});
$process->start();

// signo 傳 0：只檢測進程是否存在，不發送信號
var_dump(Process::kill($process->pid, 0));

Process::kill($process->pid, SIGTERM);

$status = Process::wait();
echo "killed by signal: {$status['signal']}\n";
```

### wait

回收已退出的子進程。

```php
public static function wait(bool $blocking = true): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$blocking` | 是否阻塞等待 | `true` |

**返回值**：成功返回數組，含子進程的 `PID`、退出狀態碼與終止信號；失敗返回 `false`。

> [!WARNING]
> 每個子進程結束後，父進程必須調用一次 `wait()` 回收，否則子進程成爲殭屍進程，佔用系統進程資源。
>
> 父進程無法阻塞等待時，應註冊 `SIGCHLD` 信號並在回調中回收。一次 `SIGCHLD` 可能對應多個子進程退出，須以非阻塞方式循環調用 `wait()`，直到返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v4.5.0` 時推薦使用協程版本的 `wait()`，參考 [Swoole\Coroutine\System::wait()](/zh-hant/coroutine/system_api.html#wait)。

**示例**

阻塞模式，等待單個子進程退出：

```php
<?php
use Swoole\Process;

$process = new Process(function () {
    sleep(1);
});
$process->start();

// 阻塞等待，直到子進程退出
$ret = Process::wait(true);
echo "PID={$ret['pid']}, code={$ret['code']}, signal={$ret['signal']}\n";
```

非阻塞模式，配合 `SIGCHLD` 回收多個子進程：

```php
<?php
use Swoole\Process;
use Swoole\Event;

$workerNum = 3;
$reaped = 0;

Process::signal(SIGCHLD, function ($sig) use (&$reaped, $workerNum) {
    // 必須爲 false，一次 SIGCHLD 可能對應多個子進程退出
    while ($ret = Process::wait(false)) {
        echo "PID={$ret['pid']}, code={$ret['code']}, signal={$ret['signal']}\n";
        $reaped++;
    }
    // 全部回收完畢，移除信號監聽後事件循環隨之退出
    if ($reaped >= $workerNum) {
        Process::signal(SIGCHLD, null);
    }
});

for ($n = 1; $n <= $workerNum; $n++) {
    $process = new Process(function () use ($n) {
        sleep($n);
    });
    $process->start();
}

Event::wait();
```

### daemon

使當前進程轉爲守護進程。

```php
public static function daemon(bool $nochdir = true, bool $noclose = true): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$nochdir` | 是否保留當前工作目錄。`true` 表示不切換到根目錄 | `true` |
| `$noclose` | 是否關閉標準輸入輸出文件描述符。`true` 表示不關閉 | `true` |

> [!NOTE]
> 轉爲守護進程後 `PID` 會變化，用 `getmypid()` 獲取當前 `PID`。

**示例**

默認參數，保留工作目錄與標準輸出：

```php
<?php
use Swoole\Process;

echo 'before daemon: ' . getmypid() . PHP_EOL;

// 默認 nochdir = true、noclose = true
Process::daemon();

// PID 已變化，標準輸出未關閉，仍可打印
echo 'after daemon: ' . getmypid() . PHP_EOL;
echo 'cwd: ' . getcwd() . PHP_EOL;
```

`daemon(false, false)`，切換到根目錄並關閉標準輸出，轉爲後臺常駐：

```php
<?php
use Swoole\Process;
use Swoole\Timer;
use Swoole\Event;

// nochdir = false：切換到根目錄
// noclose = false：關閉標準輸入輸出，之後的 echo 不再顯示在終端
Process::daemon(false, false);

$log = fopen('/tmp/daemon.log', 'a');
fwrite($log, 'pid: ' . getmypid() . ', cwd: ' . getcwd() . PHP_EOL);

Timer::tick(1000, function () use ($log) {
    fwrite($log, 'tick ' . time() . PHP_EOL);
});

// 10 秒後清除所有定時器，事件循環無事件後進程退出
Timer::after(10000, function () use ($log) {
    Timer::clearAll();
    fclose($log);
});

Event::wait();
```

## unixSocket 管道通信

### write

父子進程間通過`unixSocket`進行消息寫入。

```php
public function write(string $data): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 寫入的數據 | 必填 |

**返回值**：成功返回寫入的字節數，失敗返回 `false`。

**示例**

父進程寫入，子進程讀取：

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->read();
});
$process->start();

$process->write("hello child\n");

Process::wait();
```

### read

父子進程間通過`unixSocket`進行消息讀取。

```php
public function read(int $size = 8192): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$size` | 讀取長度，單位爲字節 | `8192` |

**返回值**：成功返回讀取到的數據，失敗返回 `false`。

**示例**

子進程寫入，父進程讀取：

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->write("hello parent\n");
});
$process->start();

// 默認阻塞讀取，單次最多 8192 字節
echo $process->read();

Process::wait();
```

### setBlocking

設置套接字是否阻塞。

```php
public function setBlocking(bool $blocking): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$blocking` | `true` 阻塞，`false` 非阻塞 | 必填 |

> [!NOTE]
> 新建的進程套接字默認阻塞，`unixSocket` 通信時讀寫會使進程阻塞。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
    $child->write("hello parent\n");
});
$process->start();

// 非阻塞：管道暫無數據時立即返回 false
$process->setBlocking(false);
var_dump($process->read());

// 恢復阻塞後讀取
$process->setBlocking(true);
echo $process->read();

Process::wait();
```

### setTimeout

設置管道（`unixSocket`）讀寫超時。

```php
public function setTimeout(float $seconds): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$seconds` | 超時時間，單位爲秒 | 必填 |

**返回值**：成功返回 `true`，失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
    $child->write("hello parent\n");
});
$process->start();

// 子進程 1 秒後才寫入，0.5 秒的超時等不到數據
$process->setTimeout(0.5);
var_dump($process->read());

// 放寬到 2 秒後可正常讀到
$process->setTimeout(2);
echo $process->read();

Process::wait();
```

### exportSocket

將 `unixSocket` 導出爲 `Swoole\Coroutine\Socket` 對象，用其方法完成進程間通信，用法見 [Socket 客戶端](/zh-hant/client/socket.html)。

```php
public function exportSocket(): Swoole\Coroutine\Socket|false
```

**返回值**：成功返回 `Coroutine\Socket` 對象；進程未創建 `unixSocket` 時返回 `false`。

> [!NOTE]
> 多次調用返回同一對象。導出的 `socket` 是新的 `fd`，關閉它不影響進程原有管道。

> [!IMPORTANT]
> `Coroutine\Socket` 只能在[協程容器](/zh-hant/coroutine/container.html)內使用，因此構造函數的 `$enable_coroutine` 必須爲 `true`；父進程側需自行 `Coroutine\run()` 創建容器。

**示例**

父子進程通信：

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

$proc1 = new Process(function (Process $proc) {
    $socket = $proc->exportSocket();
    echo $socket->recv();
    $socket->send("hello master\n");
    echo "proc1 stop\n";
}, false, 1, true);

$proc1->start();

// 父進程創建一個協程容器
run(function () use ($proc1) {
    $socket = $proc1->exportSocket();
    $socket->send("hello pro1\n");
    var_dump($socket->recv());
});
Process::wait(true);
```

`SOCK_DGRAM` 類型無需處理 `TCP` 數據包邊界：

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

// IPC 通訊即使是 SOCK_DGRAM 類型的 socket 也不需要用 sendto / recvfrom 這組函數，send / recv 即可。
$proc1 = new Process(function (Process $proc) {
    $socket = $proc->exportSocket();
    while (1) {
        var_dump($socket->send("hello master\n"));
    }
    echo "proc1 stop\n";
}, false, 2, 1); // 構造函數 pipe type 傳爲 2 即 SOCK_DGRAM

$proc1->start();

run(function () use ($proc1) {
    $socket = $proc1->exportSocket();
    Swoole\Coroutine::sleep(5);
    var_dump(strlen($socket->recv())); // 一次 recv 只會收到一個 "hello master\n" 字符串，不會出現多個
});

Process::wait(true);
```

> [!WARNING]
> `SOCK_STREAM` 類型需處理 `TCP` 數據包邊界，參考 [Socket 客戶端](/zh-hant/client/socket.html) 的 `setProtocol()` 方法。

### close

關閉已創建的 `unixSocket`管道通信。

```php
public function close(int $which = 0): bool
```
| 參數 | 說明                                                                                                                    | 默認值 |
|:---|:----------------------------------------------------------------------------------------------------------------------|:---|
| `$which` | 指定關閉 Unix Socket 的哪一端（該 Socket 爲全雙工）：<br>`0` 表示讀寫兩端，`Swoole\Process::PIPE_WRITE` 表示寫端，`Swoole\Process::PIPE_READ` 表示讀端 | `0` |

> [!NOTE]
> 某些情況下 `Process` 對象無法釋放，持續創建進程會導致連接泄漏；調用此方法可關閉 `unixSocket` 釋放資源。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->write("hello parent\n");
});
$process->start();

echo $process->read();

// 0 關閉讀寫兩端，也可傳 Process::PIPE_WRITE / Process::PIPE_READ 只關一端
$process->close(0);

Process::wait();
```

## 消息隊列通信

### useQueue

使用消息隊列進行進程間通信。

```php
public function useQueue(int $key = 0, int $mode = SWOOLE_MSGQUEUE_BALANCE, int $capacity = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 消息隊列的 `key`。傳入 `<= 0` 的值時，底層使用 `ftok`，以當前執行文件的文件名生成 `key` | `0` |
| `$mode` | 通信模式。<br>`SWOOLE_MSGQUEUE_BALANCE`：`pop()` 取隊列首條消息，`push()` 不附加類型。所有進程平等競爭，誰先 `pop()` 誰取走隊首消息，屬於競爭消費/負載均衡，適合多進程共同處理同一批任務；<br>`SWOOLE_MSGQUEUE_ORIENT`：`push()` 附加 `進程 id + 1` 作爲類型，`pop()` 只取該類型的消息。消息被精確投遞給指定進程，屬於定向投遞，適合點對點通信 | `SWOOLE_MSGQUEUE_BALANCE` |
| `$capacity` | 隊列可存儲的數據總字節數上限（對應系統的 `msg_qbytes`） | `-1` |

> [!WARNING]
> 隊列爲空時 `pop()` 阻塞，隊列已滿時 `push()` 阻塞。需要非阻塞時，`$mode` 必須爲 `SWOOLE_MSGQUEUE_BALANCE | Swoole\Process::IPC_NOWAIT` 或 `SWOOLE_MSGQUEUE_ORIENT | Swoole\Process::IPC_NOWAIT`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

// 須在 start() 之前調用，子進程才能共享同一隊列
$process->useQueue();
$process->start();

$process->push("hello queue\n");

Process::wait();
$process->freeQueue();
```

### statQueue

獲取消息隊列狀態。

```php
public function statQueue(): array|false
```

**返回值**：成功返回數組，`queue_num` 爲隊列中的消息總數，`queue_bytes` 爲消息總字節數；失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
});

$process->useQueue();
$process->start();

$process->push('hello');
$process->push('swoole');

// queue_num 爲消息條數，queue_bytes 爲消息總字節數
var_dump($process->statQueue());

Process::wait();
$process->freeQueue();
```

### freeQueue

銷燬消息隊列。

```php
public function freeQueue(): bool
```

**返回值**：成功返回 `true`，失敗返回 `false`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

$process->useQueue();
$process->start();

$process->push("hello queue\n");
Process::wait();

// 隊列由內核維護，進程退出後依然存在，須顯式銷燬
var_dump($process->freeQueue());
```

### pop

從消息隊列讀取數據。

```php
public function pop(int $size = 65536): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$size` | 單次讀取的最大數據量，單位爲字節 | `65536` |

**返回值**：成功返回 `string`，失敗返回 `false`。

- `SWOOLE_MSGQUEUE_BALANCE`：返回隊列首條消息。
- `SWOOLE_MSGQUEUE_ORIENT`：返回首條類型爲 `進程 id + 1` 的消息。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // BALANCE 模式按入隊順序取消息
    var_dump($child->pop());
    var_dump($child->pop());
});

$process->useQueue();
$process->start();

$process->push('first');
$process->push('second');

Process::wait();
$process->freeQueue();
```

### push

向消息隊列寫入數據。

```php
public function push(string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 寫入的數據 | 必填 |

**返回值**：成功返回 `true`，失敗返回 `false`。

- `SWOOLE_MSGQUEUE_BALANCE`：數據直接入隊。
- `SWOOLE_MSGQUEUE_ORIENT`：數據附加 `進程 id + 1` 的類型。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

$process->useQueue();
$process->start();

var_dump($process->push("hello queue\n"));

Process::wait();
$process->freeQueue();
```

## 信號與高精度定時器

### signal

註冊異步信號監聽，基於 `signalfd` 與 `EventLoop` 實現。

```php
public static function signal(int $signo, ?callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$signo` | 信號編號 | 必填 |
| `$callback` | 信號回調函數，傳 `null` 移除監聽 | 必填 |

- 阻塞程序中回調是不會執行的，需要改用 `pcntl` 擴展的 `pcntl_signal`。
- 重複設置同一信號會覆蓋已有回調。
- 多線程模式下只有主線程可以執行此方法，工作線程中調用會直接返回 `true`，但監聽不會生效，詳見[不可用特性](/zh-hant/thread/create.html#不可用特性)。

> [!WARNING]
> [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 中部分信號不可監聽，如 `SIGTERM`、`SIGALRM`。

**示例**

```php
<?php
Swoole\Process::signal(SIGTERM, function ($signo) {
    echo "shutdown.";
});
```

> [!WARNING]
> `v4.4.0` 中，若 `EventLoop` 內只有信號監聽事件而無其他事件（如 `Timer`），進程會直接退出。

```php
<?php
Swoole\Process::signal(SIGTERM, function ($signo) {
    echo "shutdown.";
});
Swoole\Event::wait();
```

此程序不會進入 `EventLoop`，[`Swoole\Event::wait()`](/zh-hant/event.html#wait) 立即返回並退出進程。

### alarm

高精度定時器，封裝 `setitimer` 系統調用，精度爲微秒。到期觸發信號，須配合 [Process::signal](#signal) 或 `pcntl_signal` 使用。

```php
public static function alarm(int $time, int $type = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$time` | 定時間隔，單位爲微秒；負數表示清除定時器 | 必填 |
| `$type` | 定時器類型，取值見下表 | `0` |

| 定時器類型 | 說明 |
|:---|:---|
| `0` | 真實時間，觸發 `SIGALRM` 信號 |
| `1` | 用戶態 `CPU` 時間，觸發 `SIGVTALRM` 信號 |
| `2` | 用戶態 + 內核態時間，觸發 `SIGPROF` 信號 |

**返回值**：成功返回 `true`，失敗返回 `false`，可用 `swoole_errno` 獲取錯誤碼。

> [!WARNING]
> `alarm` 不能與 [Timer](/zh-hant/timer.html) 同時使用。

**示例**

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

run(function () {
    Process::signal(SIGALRM, function () {
        static $i = 0;
        echo "#{$i}\talarm\n";
        $i++;
        if ($i > 20) {
            Process::alarm(-1);
            Process::kill(getmypid());
        }
    });

    // 100ms
    Process::alarm(100 * 1000);

    while (true) {
        sleep(0.5);
    }
});
```

## CPU 親和性與優先級

### setAffinity

設置 `CPU` 親和性，將進程綁定到指定 `CPU` 核，讓出其餘核給更重要的程序。

```php
public static function setAffinity(array $cpus): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cpus` | 綁定的 `CPU` 核列表，`array(0, 2, 3)` 即綁定 `CPU0/CPU2/CPU3` | 必填 |

> [!WARNING]
> - 元素個數不得超過 `CPU` 核數，`CPU-ID` 不得超過 `CPU` 核數 - `1`
> - 需操作系統支持 `CPU` 綁定
> - `swoole_cpu_num()` 返回當前服務器的 `CPU` 核數

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // CPU-ID 不得超過 swoole_cpu_num() - 1
    var_dump(Process::setAffinity([0, 1]));
});

$process->start();

Process::wait();
```

### getAffinity

獲取進程 `CPU` 親和性。

```php
public static function getAffinity(): array
```

**返回值**：返回 `CPU` 核 `ID` 數組，如 `[0, 1, 3, 4]` 表示進程可被調度到 `0/1/3/4` 核運行。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    Process::setAffinity([0, 1]);
    var_dump(Process::getAffinity());
});

$process->start();

Process::wait();
```

### setPriority

讓指定的進程（或進程組、用戶進程）在競爭 CPU 資源時，能被內核更優先或更延後地調度。

```php
public function setPriority(int $which, int $priority): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$which` | 優先級的作用範圍，取值見下表 | 必填 |
| `$priority` | 優先級，取值 `[-20, 19]`，值越小優先級越高 | 必填 |

| 常量                             | 說明 |
|:-------------------------------|:---|
| `Swoole\Process::PRIO_PROCESS` | 表示操作對象是單個進程。這是最常用的默認類型。 |
| `Swoole\Process::PRIO_PGRP`                    | 表示操作對象是進程組。設置或獲取時，會影響該組內的相關進程。 |
| `Swoole\Process::PRIO_USER`                    | 表示操作對象是指定用戶擁有的所有進程。 |

**返回值**：成功返回 `true`，失敗返回 `false`，可用 `swoole_errno` 和 `swoole_strerror` 獲取錯誤碼與錯誤信息。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // 調低優先級（數值增大）無需特權，調高則需要相應權限
    var_dump($child->setPriority(Process::PRIO_PROCESS, 10));
});

$process->start();

Process::wait();
```

### getPriority

獲取進程的優先級。

```php
public function getPriority(int $which): int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$which` | 優先級的作用範圍，取值同 [setPriority](#setpriority) | 必填 |

**返回值**：返回當前優先級。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->setPriority(Process::PRIO_PROCESS, 10);
    var_dump($child->getPriority(Process::PRIO_PROCESS));
});

$process->start();

Process::wait();
```
