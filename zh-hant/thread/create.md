# 創建線程

`Swoole` 從 `6.0` 版本開始提供了多線程`Swoole\Thread`支持，可使用線程 `API` 來代替多進程。相比多進程，`Thread` 提供了更豐富的併發數據容器，在開發遊戲服務器、通信服務器方面更方便。

## 使用條件

- `PHP` 必須爲 `ZTS` 模式，編譯 `PHP` 時需要加入 `--enable-zts`
- 編譯 `Swoole` 時需要增加 `--enable-swoole-thread` 編譯選項

### 查看是否開啓線程支持

```shell
php -v
PHP 8.1.23 (cli) (built: Mar 20 2024 19:48:19) (ZTS)
Copyright (c) The PHP Group
Zend Engine v4.1.23, Copyright (c) Zend Technologies
```

`(ZTS)` 表示已啓用線程安全。

```shell
php --ri swoole

swoole
Swoole => enabled
thread => enabled
```

`thread => enabled` 表示已開啓多線程支持。

## 注意事項

### 資源隔離

`Swoole` 線程與 `Node.js Worker Thread` 是相似的，在子線程中會創建一個全新的 `ZendVM` 環境。子線程不會從父線程繼承任何資源，因此在子線程中下列內容已被清空，需要重新創建或設置。

- 已加載的 `PHP` 文件，需要重新 `include/require` 加載
- 需要重新註冊 `autoload` 函數
- 類、函數、常量，將被清空，需重新加載 `PHP` 文件創建
- 全局變量，例如 `$GLOBALS`、`$_GET/$_POST` 等，將被重置
- 類的靜態屬性、函數的靜態變量，將重置爲初始值
- 一些 `php.ini` 選項，例如 `error_reporting()` 需要在子線程中重新設置

### 不可用特性

在多線程模式下，下列特性僅支持在主線程中操作，不支持在子線程中使用：

- `swoole_async_set()` 修改線程參數
- [`Swoole\Runtime::enableCoroutine()`](/zh-hant/coroutine/hook.html#enablecoroutine) 和 [`Swoole\Runtime::setHookFlags()`](/zh-hant/coroutine/hook.html#sethookflags)
- 僅主線程可設置信號監聽。[`Process::signal`](/zh-hant/process/process.html#signal) 在工作線程中調用會直接返回 `true`，但監聽不會生效；[`Coroutine\System::waitSignal()`](/zh-hant/coroutine/system_api.html#waitsignal) 不能在子線程中使用
- 僅主線程可創建異步服務器，包括 [`Server`](/zh-hant/server/tcp_udp.html)、[`Http\Server`](/zh-hant/server/http.html)、[`WebSocket\Server`](/zh-hant/server/websocket.html) 等不能在子線程中使用

除此之外，`Runtime Hook` 在多線程模式下開啓後將無法關閉。

### 致命錯誤

當主線程退出時，若依然存在活躍的子線程，將拋出一個致命錯誤，退出的狀態碼爲 `200`，錯誤信息如下：

```shell
Fatal Error: 2 active threads are running, cannot exit safely.
```

## 示例

### 創建多線程

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();
$c = 4;

// 主線程沒有線程參數，$args 爲 null
if (empty($args)) {
    // 主線程
    $threads = [];
    for ($i = 0; $i < $c; $i++) {
        $threads[] = new Thread(__FILE__, $i);
    }
    for ($i = 0; $i < $c; $i++) {
        $threads[$i]->join();
    }
} else {
    // 子線程
    echo "Thread #" . $args[0] . "\n";
    // 示例中循環 5 次後退出，主線程的 join() 才能返回；實際業務中可改爲常駐循環
    for ($i = 0; $i < 5; $i++) {
        sleep(1);
        file_get_contents('https://www.baidu.com/');
    }
}
```

### 線程 + 服務端（異步風格）

- 所有工作進程將使用線程來運行，包括 `Worker`、`Task Worker`、`User Process`
- 新增 [`SWOOLE_THREAD`](/zh-hant/server/process_thread.html#swoole-thread) 運行模式，啓用後將使用線程代替進程運行
- 增加了 [`bootstrap`](/zh-hant/server/setting.html#bootstrap) 和 [`init_arguments`](/zh-hant/server/setting.html#init-arguments) 兩項配置，用於設置工作線程的入口腳本文件、線程共享數據
- 必須在主線程中創建 [`Server`](/zh-hant/server/tcp_udp.html)，可在回調函數中創建新的 `Thread` 執行其他任務
- [`Server::addProcess()`](/zh-hant/server/methods.html#addprocess) 進程對象不支持標準輸入輸出重定向

```php
<?php
use Swoole\Process;
use Swoole\Thread;
use Swoole\Http\Server;

$http = new Server("0.0.0.0", 9503, SWOOLE_THREAD);
$http->set([
    'worker_num' => 2,
    'task_worker_num' => 3,
    'bootstrap' => __FILE__,
    // 通過 init_arguments 實現線程間的數據共享
    'init_arguments' => function () use ($http) {
        $map = new Swoole\Thread\Map();
        return [$map];
    }
]);

$http->on('Request', function ($req, $resp) use ($http) {
    $resp->end('hello world');
});

$http->on('pipeMessage', function ($http, $srcWorkerId, $msg) {
    echo "[worker#" . $http->getWorkerId() . "]\treceived pipe message[$msg] from " . $srcWorkerId . "\n";
});

$http->addProcess(new Process(function () {
    echo "user process, id=" . Thread::getId();
    sleep(2000);
}));

$http->on('Task', function ($server, $taskId, $srcWorkerId, $data) {
    var_dump($taskId, $srcWorkerId, $data);
    return ['result' => uniqid()];
});

$http->on('Finish', function ($server, $taskId, $data) {
    var_dump($taskId, $data);
});

$http->on('WorkerStart', function ($serv, $wid) {
    // 通過 Swoole\Thread::getArguments() 獲取配置中的 init_arguments 傳遞的共享數據
    var_dump(Thread::getArguments(), $wid);
});

$http->on('WorkerStop', function ($serv, $wid) {
    var_dump('stop: T' . Thread::getId());
});

$http->start();
```

## 屬性

### id

通過此對象屬性獲取子線程的 `ID`，該屬性是 `int` 類型。

```php
public int $id
```

> [!NOTE]
> 此屬性僅用在父線程，子線程無法獲得 `$thread` 對象，應使用 [getId](#getid) 靜態方法獲取線程的 `ID`。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__, 1);
    var_dump($thread->id);
    $thread->join();
}
```

## 方法

### __construct

多線程構造方法。

```php
public function __construct(string $script_file, mixed ...$args)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$script_file` | 線程啓動後要執行的文件 | 必填 |
| `$args` | 主線程傳遞給子線程的共享數據，在子線程中可使用 [getArguments](#getarguments) 獲取，可變參數 | 無 |

> [!WARNING]
> 線程創建失敗會拋出 `Swoole\Exception`，可以通過 `try catch` 捕獲它。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    // 主線程：創建子線程並傳遞共享數據
    $thread = new Thread(__FILE__, 'child thread');
    $thread->join();
} else {
    // 子線程
    var_dump($args);
}
```

### join

主線程等待子線程退出。若子線程仍在運行，`join()` 會阻塞，直到子線程退出。

```php
public function join(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    // 主線程
    $thread = new Thread(__FILE__);
    // 阻塞等待子線程退出
    var_dump($thread->join());
} else {
    // 子線程
    sleep(1);
    echo "child thread is finished\n";
}
```

### joinable

檢查子線程是否可被 `join()`，有兩種情況此方法返回 `false`：

1. 線程執行了 `detach()`，無法使用 `join()` 等待線程退出
2. 線程已退出，並且執行了 `join()` 回收了線程

```php
public function joinable(): bool
```

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    var_dump($thread->joinable());

    $thread->join();
    // 線程已退出並被 join() 回收，不再可 join
    var_dump($thread->joinable());
}
```

### getExitStatus

獲取子線程的退出狀態碼。

```php
public function getExitStatus(): int
```

**返回值**：返回子線程的退出狀態碼。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    $thread->join();
    var_dump($thread->getExitStatus());
}
```

### isAlive

檢查是否存活，無論線程是否執行了 `detach()` 或 `join()`，始終可以調用此函數。

```php
public function isAlive(): bool
```

**返回值**：返回 `true` 表示線程存活，返回 `false` 表示線程已退出。

> [!NOTE]
> 此方法不會引起阻塞。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    var_dump($thread->isAlive());

    $thread->join();
    var_dump($thread->isAlive());
} else {
    sleep(1);
}
```

### detach

使子線程脫離主線程的掌控，不再需要 `join()` 等待線程退出。

```php
public function detach(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

> [!WARNING]
> 主線程退出前必須等待所有子線程結束，否則將觸發[致命錯誤](#致命錯誤)。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    // 脫離後不再需要 join()
    var_dump($thread->detach());

    // detach() 之後仍可調用 isAlive() 等待線程結束
    while ($thread->isAlive()) {
        sleep(1);
    }
} else {
    sleep(3);
}
```

### getArguments

靜態方法，獲取由主線程使用 `new Swoole\Thread()` 時傳遞過來的共享數據，在子線程中調用。

```php
public static function getArguments(): ?array
```

**返回值**：子線程中返回父線程傳遞過來的共享數據；主線程沒有線程參數，返回 `null`。

> [!NOTE]
> 主線程不會有任何線程參數，可以通過判斷線程參數是否爲空來分辨父子線程，讓它們執行不同的邏輯。

**示例**

```php
<?php
use Swoole\Thread;

// 如果是主線程，$args 爲空；如果是子線程，$args 不爲空
$args = Thread::getArguments();

if (empty($args)) {
    // 主線程，傳遞線程參數
    $thread = new Thread(__FILE__, 'child thread');
    echo "main thread\n";
    $thread->join();
} else {
    // 子線程，輸出 ['child thread']
    var_dump($args);
}
```

### getId

靜態方法，獲取當前線程的 `ID`。

```php
public static function getId(): int
```

**返回值**：返回 `int` 類型的整數，表示當前線程的 `id`。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    echo "main thread id: " . Thread::getId() . "\n";
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    echo "child thread id: " . Thread::getId() . "\n";
}
```

### getInfo

靜態方法，獲取當前多線程環境的信息。

```php
public static function getInfo(): array
```

**返回值**：返回數組，信息如下：

- `is_main_thread`：當前的線程是否爲主線程
- `is_shutdown`：線程是否已關閉
- `thread_num`：當前活躍的線程數量

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    var_dump(Thread::getInfo());
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    var_dump(Thread::getInfo());
}
```

### activeCount

靜態方法，獲取當前活躍的線程數量。

```php
public static function activeCount(): int
```

**返回值**：返回 `int` 類型的整數，表示當前活躍的線程數量，此方法返回值始終爲大於或等於 `1` 的整數。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $threads = [new Thread(__FILE__), new Thread(__FILE__)];

    var_dump(Thread::activeCount());

    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    sleep(1);
}
```

### yield

靜態方法，讓出當前線程的執行時間片。調用後當前線程會被掛起，等待操作系統調度器優先執行其他線程，等待下一個週期時重新分配時間片給當前線程。

```php
public static function yield(): void
```

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    for ($i = 0; $i < 100; $i++) {
        // 讓出時間片，等待調度器優先執行其他線程
        Thread::yield();
    }
}
```

### getPriority

靜態方法，獲取當前線程調度的信息。

```php
public static function getPriority(): array
```

**返回值**：返回數組，信息如下：

- `policy`：線程調度策略
- `priority`：線程的調度優先級

**示例**

```php
<?php
use Swoole\Thread;

var_dump(Thread::getPriority());
```

### setPriority

靜態方法，設置當前線程調度優先級和策略。

```php
public static function setPriority(int $priority, int $policy = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$priority` | 設置線程調度優先級 | 必填 |
| `$policy` | 設置線程調度優先策略，其它值爲 [`Thread::SCHED_*`](#常量) 相關常量 | `-1`，表示不調整調度策略 |

**返回值**：成功返回 `true`；失敗返回 `false`，使用 `swoole_last_error()` 獲取錯誤信息。

> [!WARNING]
> 僅 `root` 用戶可以調整，非 `root` 用戶調用將被拒絕。

> [!NOTE]
> `SCHED_BATCH`、`SCHED_ISO`、`SCHED_IDLE`、`SCHED_DEADLINE` 僅在 `Linux` 系統下可用。
>
> `SCHED_FIFO`、`SCHED_RR` 策略的線程一般爲實時線程，優先級高於普通線程，可獲得更多的 `CPU` 時間片。

**示例**

```php
<?php
use Swoole\Thread;

// 僅調整優先級，不調整調度策略，需要 root 權限
var_dump(Thread::setPriority(10));

// 同時指定調度策略
var_dump(Thread::setPriority(10, Thread::SCHED_RR));
```

### getAffinity

靜態方法，獲取當前線程 `CPU` 親緣性。

```php
public static function getAffinity(): array
```

**返回值**：返回數組，元素爲 `CPU` 核數，例如 `[0, 1, 3, 4]` 表示此線程將被調度到 `CPU` 的 `0/1/3/4` 核心運行。

**示例**

```php
<?php
use Swoole\Thread;

var_dump(Thread::getAffinity());
```

### setAffinity

靜態方法，設置當前線程 `CPU` 親緣性。

```php
public static function setAffinity(array $cpu_set): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$cpu_set` | `CPU` 核心的列表，例如 `[0, 1, 3, 4]` | 必填 |

**返回值**：成功返回 `true`；失敗返回 `false`，使用 `swoole_last_error()` 獲取錯誤信息。

**示例**

```php
<?php
use Swoole\Thread;

// 將當前線程綁定到 0、1 兩個 CPU 核心上運行
var_dump(Thread::setAffinity([0, 1]));
var_dump(Thread::getAffinity());
```

### setName

靜態方法，設置當前線程的名稱。在使用 `ps` 和 `gdb` 等工具查看和調試時，提供更友好的顯示方式。

```php
public static function setName(string $name): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 線程名稱 | 必填 |

**返回值**：成功返回 `true`；失敗返回 `false`，使用 `swoole_last_error()` 獲取錯誤信息。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    // 主線程
    Thread::setName('Master Thread');

    $threads = [];
    for ($i = 0; $i < 4; $i++) {
        $threads[] = new Thread(__FILE__, $i);
    }
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // 子線程
    Thread::setName('Worker Thread ' . $args[0]);
    sleep(60);
}
```

設置後可使用 `ps` 查看線程名稱：

```shell
$ ps aux|grep -v grep|grep pool.php
swoole   2226813  0.1  0.1 423860 49024 pts/6    Sl+  17:38   0:00 php pool.php

$ ps -T -p 2226813
    PID    SPID TTY          TIME CMD
2226813 2226813 pts/6    00:00:00 Master Thread
2226813 2226814 pts/6    00:00:00 Worker Thread 0
2226813 2226815 pts/6    00:00:00 Worker Thread 1
2226813 2226816 pts/6    00:00:00 Worker Thread 2
2226813 2226817 pts/6    00:00:00 Worker Thread 3
```

### getNativeId

獲取線程的系統 `ID`，將返回一個整數，類似於進程的 `PID`。

```php
public static function getNativeId(): int
```

**返回值**：返回線程的系統 `ID`。

此函數在 `Linux` 系統會調用 `gettid()` 系統調用，獲取操作系統線程 `ID`，是一個短整數。線程銷燬後此 `ID` 可能會被操作系統複用。

此 `ID` 可以用於 `gdb`、`strace` 調試，例如 `gdb -p $tid`。另外還可以讀取 `/proc/{PID}/task/{ThreadNativeId}` 獲取線程的執行信息。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

// 主線程沒有線程參數，$args 爲 null，通過這種方式判斷主線程和子線程
if (empty($args)) {
    echo "main thread native id: " . Thread::getNativeId() . "\n";
    $thread = new Thread(__FILE__, 1);
    $thread->join();
} else {
    echo "child thread native id: " . Thread::getNativeId() . "\n";
}
```

## 常量

| 常量 | 說明 |
|:---|:---|
| `Thread::HARDWARE_CONCURRENCY` | 硬件併發線程數量，一般爲 `CPU` 核數 |
| `Thread::API_NAME` | 線程 `API` 名稱，例如 `POSIX Threads` |
| `Thread::SCHED_OTHER` | 默認的分時調度策略，非實時。由公平調度器按 `nice` 值（`-20 ~ 19`）分配 `CPU` 時間，適用於絕大多數普通任務 |
| `Thread::SCHED_FIFO` | 實時策略，先進先出，優先級取值 `1 ~ 99`。線程會一直運行，直到主動阻塞、讓出 `CPU`，或被更高優先級的實時線程搶佔，同優先級之間不輪換 |
| `Thread::SCHED_RR` | 實時策略，時間片輪轉，優先級取值 `1 ~ 99`。與 `SCHED_FIFO` 基本相同，但同優先級的線程會按時間片輪流運行 |
| `Thread::SCHED_BATCH` | 非實時策略，面向長時間佔用 `CPU` 的批處理任務。調度器將其視爲非交互任務，不給予喚醒搶佔上的優待，優先級同樣由 `nice` 值決定 |
| `Thread::SCHED_ISO` | 等時（isochronous）策略，讓非特權用戶也能獲得接近實時的低延遲，同時限制其 `CPU` 佔用上限。主線內核僅預留了策略編號而未實現，只有 `-ck` / `MuQSS` 補丁內核支持 |
| `Thread::SCHED_IDLE` | 非實時策略，優先級比 `nice` 值爲 `19` 的普通任務還低，只在 `CPU` 空閒時運行，且不受 `nice` 值影響 |
| `Thread::SCHED_DEADLINE` | 實時策略，優先級高於 `SCHED_FIFO` / `SCHED_RR`。按最早截止時間優先（`EDF`）調度，保證線程在每個週期內獲得指定的運行時間預算；預算、截止時間與週期需通過 `sched_setattr()` 設置，僅靠優先級參數無法完整配置 |

> [!WARNING]
> `SCHED_FIFO`、`SCHED_RR`、`SCHED_DEADLINE` 屬於實時策略，線程只要處於可運行狀態就會搶佔普通線程。若實時線程中出現死循環或長時間不阻塞的計算，同一 `CPU` 核心上的其他線程乃至系統服務都可能得不到調度。

**示例**

```php
<?php
use Swoole\Thread;

var_dump(Thread::HARDWARE_CONCURRENCY, Thread::API_NAME);
```

## 數據類型

這裏列出了可以在線程間傳遞和共享的數據類型。

### 基礎類型

`null`、`bool`、`int`、`float` 類型變量，內存尺寸小於 `16 Bytes`，作爲值進行傳遞。

### 字符串

對字符串進行**內存拷貝**，存儲到 `ArrayList`、`Queue`、`Map`。

### Socket 資源

**支持的類型列表**

- [`Co\Socket`](/zh-hant/client/socket.html)
- `PHP Stream`
- `PHP Socket(ext-sockets)`，需開啓 `--enable-sockets` 編譯參數

**不支持的類型**

- [`Swoole\Client`](/zh-hant/client/sync.html)
- [`Swoole\Server`](/zh-hant/server/tcp_udp.html)
- [`Swoole\Coroutine\Client`](/zh-hant/client/tcp_udp.html)
- [`Swoole\Coroutine\Http\Client`](/zh-hant/client/http_websocket.html)
- `pdo` 連接
- `redis` 連接
- 其他的特殊 `Socket` 資源類型

**資源複製**

- 在寫入時將進行 `dup(fd)` 操作，與原有資源分離，互不影響，對原有的資源進行 `close` 操作不會影響到新的資源
- 在讀取時進行 `dup(fd)` 操作，在讀取的子線程 `VM` 內構建新的 `Socket` 資源
- 在刪除時進行 `close(fd)` 操作，釋放文件句柄

這意味着 `Socket` 資源會存在 `3` 次引用計數，分別是：

- `Socket` 資源初始創建時所在的線程
- `ArrayList`、`Queue`、`Map` 容器
- 讀取 `ArrayList`、`Queue`、`Map` 容器的子線程

當沒有任何線程或容器持有此資源，引用計數減爲 `0` 時，`Socket` 資源纔會被真正地釋放。引用計數不爲 `0`，即使執行了 `close` 操作，也不會關閉連接，不會影響其他線程或數據容器持有的 `Socket` 資源。

若希望忽略引用計數，直接關閉 `Socket`，可使用 `shutdown()` 方法，例如：

- `stream_socket_shutdown()`
- [`Socket::shutdown()`](/zh-hant/client/socket.html#shutdown)
- `socket_shutdown()`

> [!WARNING]
> `shutdown` 操作將影響所有線程持有的 `Socket` 資源，執行後將不再可用，無法執行 `read/write` 操作。

### 數組

使用 `array_is_list()` 進行判斷數組的類型，若爲數字索引數組則轉爲 `ArrayList`，關聯索引數組轉爲 `Map`。

- 將會遍歷整個數組，將元素插入到 `ArrayList` 或 `Map` 中
- 支持多維數組，遞歸遍歷多維數組轉爲嵌套結構的 `ArrayList` 或 `Map`

**示例**

```php
<?php
use Swoole\Thread\Map;

$array = [
    'a' => random_int(1, 999999999999999999),
    'b' => random_bytes(128),
    'c' => uniqid(),
    'd' => time(),
    'e' => [
        'key' => 'value',
        'hello' => 'world',
    ],
];

$map = new Map($array);

// $map['e'] 是一個新的 Map 對象，包含兩個元素 key、hello，值爲 'value' 和 'world'
var_dump($map['e']);
```

### 對象

**線程資源對象**

`Thread\Lock`、`Thread\Atomic`、`Thread\ArrayList`、`Thread\Map` 等線程資源對象，可直接存儲到 `ArrayList`、`Queue`、`Map` 中。此操作僅僅是將對象的引用存儲到容器中，不會進行對象的拷貝。

將對象寫入到 `ArrayList` 或 `Map` 時，只是對線程資源增加一次引用計數，不會拷貝。當對象的引用計數爲 `0` 時，會被釋放。

**示例**

```php
<?php
use Swoole\Thread;

$map = new Thread\Map();
$lock = new Thread\Lock(); // 當前引用計數爲 1
$map['lock'] = $lock; // 當前引用計數爲 2
unset($map['lock']); // 當前引用計數爲 1
unset($lock); // 當前引用計數爲 0，Lock 對象被釋放
```

支持列表：

- [`Thread\Lock`](/zh-hant/lock.html#命名空間)
- [`Thread\Atomic`](/zh-hant/atomic.html)
- [`Thread\Atomic\Long`](/zh-hant/atomic.html)
- [`Thread\Barrier`](/zh-hant/thread/barrier.html)
- [`Thread\ArrayList`](/zh-hant/thread/container.html#arraylist)
- [`Thread\Map`](/zh-hant/thread/container.html#map)
- [`Thread\Queue`](/zh-hant/thread/container.html#queue)

> [!WARNING]
> 請注意 `Thread` 線程對象，不可序列化也不可傳遞，僅在父線程中可用。

**普通 PHP 對象**

將在寫入時自動序列化，讀取時反序列化。請注意若對象包含不可序列化類型，將會拋出異常。
