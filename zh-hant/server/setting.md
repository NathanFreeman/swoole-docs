# 配置

[Swoole\Server->set()](/zh-hant/server/methods.html#set) 方法用於設置 `Swoole\Server`、`Swoole\Http\Server`、`Swoole\WebSocket\Server` 和 `Swoole\Redis\Server` 運行時的各項參數。

如果您已經閱讀過 [多端口監聽](/zh-hant/server/port.html) 章節，其中提到的 [Swoole\Server\Port->set()](/zh-hant/server/port.html) 方法的配置項說明也可以在這裏找到。

**示例**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => 4
]);

$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});
$server->start();
```

> [!NOTE]
> 自 v4.5.5 版本起，底層會檢測配置項的有效性。如果設置了 Swoole 不支持的配置項，將產生一個警告提示。

```shell
PHP Warning:  unsupported option [foo] in @swoole-src/library/core/Server/Helper.php
```

## worker_num

設置啓動的 [worker 進程](/zh-hant/server/process_thread.html#worker) 數。默認值爲 `CPU` 核數。

`worker` 進程負責處理實際的業務邏輯。合理設置該值直接影響服務器的處理能力。

**示例**

```php
<?php
$server->set(['worker_num' => 4]);
```

> [!NOTE]
> **編號**
>
> - 若 `worker_num` 設爲 4，則 `worker` 進程編號範圍爲 `[0, worker_num - 1]`，即 `[0, 3]`。

> [!WARNING]
> **注意**
>
> - 如果 `1` 個請求耗時 `100ms`，要提供 `1000QPS` 的處理能力，那必須配置 `100` 個進程或更多，但開的進程越多，佔用的內存就會大大增加，而且進程間切換的開銷就會越來越大。所以這裏適當即可。不要配置過大。
> - 如果業務代碼爲異步 IO 的，這裏設置爲 `CPU` 核數最合理。
> - 如果業務代碼爲同步 IO，需要根據請求響應時間和系統負載來調整，例如：`CPU` 核數 * （2 - 4）倍甚至更大。
> - 默認設置爲服務器的 `CPU` 核數，最大不得超過爲服務器的 `CPU` 核數 * 1000。
> - 假設每個進程佔用 `40M` 內存，`100` 個進程就需要佔用 `4G` 內存。
> - 如果是 `SWOOLE_THREAD` 模式，該參數則代表創建的線程數量。

## reactor_num

設置啓動的 [reactor 線程](/zh-hant/server/process_thread.html#master) 數。默認值爲 `CPU` 核數。該配置僅適用於 `SWOOLE_PROCESS` 模式。

`reactor` 線程負責接收客戶端連接和網絡請求，是 `Swoole` 的"網絡事件監聽器"。每個 `reactor` 線程都獨立維持一個 `EventLoop`，線程之間無鎖運行，可以在 128 核 CPU 上並行執行，然後將接收到的請求數據轉發給 `worker` 進程處理。

**示例**

```php
<?php
$server->set(['reactor_num' => 4]);
```

> [!WARNING]
> **注意**
>
> - `reactor_num` 建議設置爲 `CPU` 核數的 `1-4` 倍。
> - `reactor_num` 最大不得超過 `CPU` 核數 * `4`。
> - `reactor_num` 必須小於或等於 `worker_num`，如果設置的 `reactor_num` 大於 `worker_num`，會自動調整使 `reactor_num` 等於 `worker_num`。
> - `reactor_num` 在超過 `8` 核的機器上默認設置爲 `8`。
> - 設置 [dispatch_func](/zh-hant/server/setting.html#dispatch-func) 後，會強制 `reactor_num` 爲 `1`。

## task_worker_num

配置 [task 進程](/zh-hant/server/process_thread.html#task) 將啓用耗時任務投遞功能，此時必須同時註冊 [task 事件](/zh-hant/server/events.html#task) 和 [finish 事件](/zh-hant/server/events.html#finish) 兩個回調函數，否則服務器程序無法啓動。

**示例**

```php
<?php
$server->set(['task_worker_num' => 4]);
$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    echo $data . PHP_EOL;
});
$server->on('finish', function (Server $server, int $taskId, mixed $data) {
    echo $data . PHP_EOL; // task 進程通過 `Swoole\Server->finish()` 返回數據
});
```

> [!NOTE]
> **編號**
>
> - 若 [worker_num](/zh-hant/server/setting.html#worker-num) 爲 4，`task_worker_num` 爲 8，則 `task` 進程的編號範圍爲 `[worker_num, worker_num + task_worker_num - 1]`，即 `[4, 11]`。

> [!WARNING]
> **注意**
>
> - `task` 進程數最大不得超過爲服務器的 `CPU` 核數 * 1000。
> - 假設單個 `task` 進程的處理耗時爲 `100ms`，那一個進程 1 秒就可以處理 `1/0.1=10` 個任務。

## enable_coroutine

控制是否在 [事件回調](/zh-hant/server/events.html) 中自動創建協程來執行業務邏輯，默認值爲 `true`。

**示例**

```php
<?php
$server->set(['enable_coroutine' => true]);
```

> [!TIP]
> **配置方式**
>
> - 在 `php.ini` 中設置 `swoole.enable_coroutine = 'Off'`（詳見 ini 配置文檔）
> - 通過 `$server->set(['enable_coroutine' => false]);` 設置的優先級高於 `php.ini`

> [!NOTE]
> **注意**
>
> - 當 `enable_coroutine = true` 時，底層會在 `request` 等事件中自動創建協程。
> - 當 `enable_coroutine = false` 時，底層不會自動創建協程。如果業務中不需要使用協程，關閉該選項可提升一定性能。如需使用協程，需自行通過 `go()` 創建；若不需要協程特性，行爲與 Swoole 1.x 完全一致。
> - 開啓該選項僅表示會通過協程方式處理請求。如果回調中包含了阻塞操作（如 `sleep`、`mysqlnd` 擴展等），還需額外配置 [hook_flags](/zh-hant/server/setting.html#hook-flags) 以實現阻塞函數和擴展的協程化。

> [!NOTE]
> **受 `enable_coroutine` 影響的事件回調有**
>
> - [workerStart](/zh-hant/server/events.html#workerstart)
> - [connect](/zh-hant/server/events.html#connect)
> - [open](/zh-hant/server/events.html#open)
> - [receive](/zh-hant/server/events.html#receive)
> - [setHandler](/zh-hant/server/methods.html#sethandler)
> - [packet](/zh-hant/server/events.html#packet)
> - [request](/zh-hant/server/events.html#request)
> - [message](/zh-hant/server/events.html#message)
> - [pipeMessage](/zh-hant/server/events.html#pipemessage)
> - [finish](/zh-hant/server/events.html#finish)
> - [close](/zh-hant/server/events.html#close)

## task_enable_coroutine

開啓 [task 進程](/zh-hant/server/process_thread.html#task) 協程化。開啓後自動在 [task 事件回調](/zh-hant/server/events.html#task) 創建協程和 [協程容器](/zh-hant/coroutine/container.html)，可以直接使用協程 `API`。

**示例**

```php
<?php
$server->set([
    'enable_coroutine' => true,
    'task_enable_coroutine' => true,
]);
```

> [!NOTE]
> **注意**
>
> - `task_enable_coroutine` 必須在 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true` 時纔可以使用。
> - 自 `Swoole 4.2.12` 版本起支持該選項。

## hook_flags

用於設置哪些阻塞函數或擴展需要被替換爲協程版本，以實現異步非阻塞的協程調度。默認不替換任何阻塞函數或者擴展。

**示例**

```php
<?php
$server->set([
    'hook_flags' => SWOOLE_HOOK_SLEEP | SWOOLE_HOOK_NATIVE_CURL,
]);
```

**支持的協程化選項**

可使用 `SWOOLE_HOOK_ALL` 一鍵開啓全部協程化項，也可按需組合使用以下常量：

| 常量名                             | 說明                                                         |
|:--------------------------------|:-----------------------------------------------------------|
| `SWOOLE_HOOK_TCP`               | TCP 操作（如 `stream_socket_client`）                           |
| `SWOOLE_HOOK_UNIX`              | Unix Socket 操作                                             |
| `SWOOLE_HOOK_UDP`               | UDP 操作                                                     |
| `SWOOLE_HOOK_UDG`               | Unix 數據報套接字                                                |
| `SWOOLE_HOOK_SSL`               | SSL 封裝層                                                    |
| `SWOOLE_HOOK_TLS`               | TLS 封裝層                                                    |
| `SWOOLE_HOOK_SLEEP`             | `sleep`、`usleep`、`time_nanosleep`、`time_sleep_until` 等睡眠函數 |
| `SWOOLE_HOOK_FILE`              | 文件操作（如 `fread`、`fwrite`、`file_get_contents` 等）             |
| `SWOOLE_HOOK_STREAM_FUNCTION`   | 流函數（如 `stream_select`、`stream_set_blocking`）               |
| `SWOOLE_HOOK_BLOCKING_FUNCTION` | 各類阻塞函數（如 `gethostbyname`、`exec`、`shell_exec` 等）            |
| `SWOOLE_HOOK_PROC`              | 進程操作（如 `proc_open`）                                        |
| `SWOOLE_HOOK_CURL`              | CURL 協程化（基礎版）                                              |
| `SWOOLE_HOOK_NATIVE_CURL`       | CURL 原生協程化（更完整、推薦）                                         |
| `SWOOLE_HOOK_SOCKETS`           | sockets 擴展相關函數                                             |
| `SWOOLE_HOOK_STDIO`             | 標準輸入輸出（如 `stdin`、`stdout`、`stderr`）                        |
| `SWOOLE_HOOK_PDO_PGSQL`         | PDO PostgreSQL 驅動協程化                                       |
| `SWOOLE_HOOK_PDO_ODBC`          | PDO ODBC 驅動協程化                                             |
| `SWOOLE_HOOK_PDO_ORACLE`        | PDO Oracle 驅動協程化                                           |
| `SWOOLE_HOOK_PDO_SQLITE`        | PDO SQLite 驅動協程化                                           |
| `SWOOLE_HOOK_ALL`               | 開啓以上所有協程化項                                                 |

> [!TIP]
> **版本要求**
>
> - Swoole 版本爲 `v4.5+` 或 [4.4LTS](https://github.com/swoole/swoole-src/tree/v4.4.x) 可用，詳情參考[一鍵協程化](/zh-hant/coroutine/hook.html)

## enable_reuse_port

設置端口複用，啓用後，支持多個進程或服務同時監聽同一個端口（需內核支持）。默認值爲 `false`。

**示例**

```php
<?php
$server->set(['enable_reuse_port' => true]);
```

> [!TIP]
> **可用條件**
>
> - 僅在 `Linux-3.9.0` 以上版本的內核可用，`Swoole4.5` 以上版本可用

## enable_deadlock_check

開啓協程死鎖檢測，默認值爲 `false`。

**示例**

```php
<?php
$server->set(['enable_deadlock_check' => true]);
```

> [!WARNING]
> **注意**
>
> - 底層會定期檢查所有協程的狀態。當檢測到所有協程都處於休眠狀態且沒有可喚醒的事件時，會觸發類似 `[fatal error]: all coroutines (count: N) are asleep - deadlock!` 的錯誤。

## enable_preemptive_scheduler

開啓協程搶佔式調度，避免其中一個協程執行時間過長導致其他協程餓死，默認值爲 `false`。

**示例**

```php
<?php
$server->set(['enable_preemptive_scheduler' => true]);
```

> [!NOTE]
> **注意**
>
> - 有些協程可能完全沒有 `I/O` 操作，導致這個協程會一直佔用 CPU 導致其他協程無法執行。開啓後默認每隔 `10ms` 檢測當前協程，如果當前協程運行時間過長，就會強制“打斷”它，讓出 `CPU` 給其他協程執行。

## enable_unsafe_event

啓用 [connect 回調事件](/zh-hant/server/events.html#connect) 和 [close 回調事件](/zh-hant/server/events.html#close)，默認值爲 `false`。

**示例**

```php
<?php
$server->set(['enable_unsafe_event' => true]);
```

> [!WARNING]
> **注意**
>
> - [SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#swoole-process) 下配置 [dispatch_mode](/zh-hant/server/setting.html#dispatch-mode) 爲 `SWOOLE_DISPATCH_ROUND` 或 `SWOOLE_DISPATCH_IDLE_WORKER`，因爲系統無法保證 [connect](/zh-hant/server/events.html#connect) / [receive](/zh-hant/server/events.html#receive) / [close](/zh-hant/server/events.html#close) 的執行順序，默認關閉了 `connect/close` 事件；
> - 如果應用程序需要 `connect/close` 事件，並且能接受順序問題可能帶來的安全風險，可以通過設置 `enable_unsafe_event` 爲 true，啓用 `connect/close` 事件。

## enable_delay_receive

開啓後，客戶端連接成功後不會立即監聽數據接收事件，而是隻觸發 [connect 事件](/zh-hant/server/events.html#connect)，等待開發者“批准”後纔開始接收數據。默認值爲 `false`。

**示例**

```php
<?php
$server->set(['enable_delay_receive' => true]);
```

> [!NOTE]
> **注意**
>
> - 用戶需要在代碼執行 `Swoole\Server->confirm()` 對連接進行確認，此時纔會將客戶端連接加入事件循環。

## enable_signalfd

使用 `Linux` 內核提供的 `signalfd` 特性，將信號這種傳統的中斷，轉換成一個文件描述符（file descriptor）來異步處理，默認值爲 `true`。

**示例**

```php
<?php
$server->set(['enable_signalfd' => true]);
```

## enable_kqueue

在 `macOS` 蘋果系統上，使用 `kqueue` 作爲事件驅動引擎。默認值爲 `false`。

**示例**

```php
<?php
$server->set(['enable_kqueue' => true]);
```

> [!TIP]
> **可用條件**
>
> - 本配置適用於 `Swoole v6.0.0` 及以上版本。從該版本開始，由於默認的 `kqueue` 與 `Swoole` 的某些功能存在兼容性衝突，因此在 `macOS` 系統上，`Swoole` 將默認使用 `poll` 作爲底層的事件驅動引擎，而非 `kqueue`。

## bootstrap

多線程模式下的程序入口文件，默認是當前執行的腳本文件名。

**示例**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501, SWOOLE_THREAD);
$server->set([
    'worker_num' => 4,
    'bootstrap' => __FILE__,
]);
```

> [!NOTE]
> **注意**
>
> - 在 [SWOOLE_THREAD](/zh-hant/server/process_thread.html#swoole-thread) 模式下，由於 `PHP ZTS（Zend Thread Safe）` 模式下的線程是相互隔離的，無法像進程那樣通過 `fork()` 直接複製一份獨立的內存數據。因此，每個線程都需要重新執行當前腳本文件來初始化自身環境。

> [!TIP]
> **可用條件**
>
> - Swoole 版本 >= `v6.0`，`PHP` 爲 `ZTS` 模式，編譯 `Swoole` 時開啓了 `--enable-swoole-thread` 可用

## init_arguments

用於設置多線程模式下的共享數據。該配置項需要傳入一個回調函數，在服務器啓動時會自動執行該函數，其返回值可作爲線程間共享的數據對象。

**示例**

```php
<?php
use Swoole\Server;
use Swoole\Thread\Map;

$server = new Server('127.0.0.1', 9501, SWOOLE_THREAD);
$server->set([
    'init_arguments' => function () {
        return new Map();
    },
    'bootstrap' => __FILE__,
]);

$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $map = Swoole\Thread::getArguments(); // 這裏會返回執行回調函數 function() {return new Map();} 的返回值
});
```

> [!NOTE]
> **線程安全容器**
>
> - Swoole 內置了許多線程安全容器，併發 `Map`、併發 `List`、併發隊列。

> [!WARNING]
> **注意**
>
> - 請確保回調函數返回的是線程安全的變量，不要返回非線程安全的普通變量。

> [!TIP]
> **可用條件**
>
> - Swoole 版本 >= `v6.0`，`PHP` 爲 `ZTS` 模式，編譯 `Swoole` 時開啓了 `--enable-swoole-thread` 可用

## dispatch_mode

[reactor 線程](/zh-hant/server/process_thread.html#master) 將客戶端數據分發至 [worker 進程](/zh-hant/server/process_thread.html#worker) 的負載均衡策略。默認值爲 `SWOOLE_DISPATCH_FDMOD`。

**示例**

```php
<?php
$server->set(['dispatch_mode' => SWOOLE_DISPATCH_FDMOD]);
```

**支持的數據包分發策略有**

| 模式值                             | 模式名稱      | 分配策略                                | 核心作用                                    |
|:--------------------------------|:----------|:------------------------------------|:----------------------------------------|
| `SWOOLE_DISPATCH_ROUND`         | 輪詢模式      | 依次輪詢分配給每個 worker進程                  | 請求均勻分佈，適合無狀態服務                          |
| `SWOOLE_DISPATCH_FDMOD`         | 固定模式（FD）  | 根據連接 FD 取模分配                        | 同一連接數據固定在同一 worker進程，適合長連接或有狀態服務        |
| `SWOOLE_DISPATCH_IDLE_WORKER`   | 搶佔模式      | 主進程根據 worker進程 忙閒狀態動態投遞             | 優先分配給空閒 worker進程，提高資源利用率，避免阻塞           |
| `SWOOLE_DISPATCH_IPMOD`         | IP 哈希模式   | 對客戶端 IP 進行取模分配                      | 同一來源 IP 的連接固定到同一 worker進程，適合基於 IP 的會話保持 |
| `SWOOLE_DISPATCH_UIDMOD`        | UID 綁定模式  | 按綁定 UID 取模（字符串 UID 建議先 crc32）       | 基於用戶 ID 的會話保持，適用於用戶態狀態綁定                |
| `SWOOLE_DISPATCH_STREAM`        | Stream 模式 | 空閒 worker進程 主動 Accept 連接並接管請求       | 減少主進程轉發開銷，提升高併發下連接處理效率                  |
| `SWOOLE_DISPATCH_CO_CONN_LB`    | 固定協程模式    | 首次選最少協程的 worker進程，後續請求固定到該 worker進程 | 同一個連接的請求固定到首次選中的最少協程 worker進程           |
| `SWOOLE_DISPATCH_CO_REQ_LB`     | 均衡協程模式    | 每次請求都發給當前協程數最少的 worker進程            | 平衡所有 worker進程 的協程數量                     |
| `SWOOLE_DISPATCH_CONCURRENT_LB` | 均衡併發模式    | 每次請求都發給當前併發數最少的 worker進程            | 平衡所有 worker進程 的併發數量                     |

> [!WARNING]
> **注意**
>
> - [SWOOLE_BASE 模式](/zh-hant/server/process_thread.html#swoole-base) 下無法使用 `dispatch_mode`，因爲不存在投遞任務，當收到客戶端發來的數據後會立即在當前 worker 進程回調。
> - 無狀態的請求可以使用 `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER`，同步阻塞的服務可以使用 `SWOOLE_DISPATCH_IDLE_WORKER`，異步非阻塞可以使用 `SWOOLE_DISPATCH_ROUND`。
> - 有狀態的請求可以使用 `SWOOLE_DISPATCH_FDMOD`，`SWOOLE_DISPATCH_IPMOD`，`SWOOLE_DISPATCH_UIDMOD`。
> - UDP 服務器：
>     - `SWOOLE_DISPATCH_FDMOD`，`SWOOLE_DISPATCH_IPMOD` 和 `SWOOLE_DISPATCH_UIDMOD` 時爲固定分配，底層使用客戶端 `IP` 取模散列到不同的 `worker` 進程。
>     - `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER` 時隨機分配到不同 `worker` 進程。

> [!TIP]
> **事件屏蔽**
>
> - `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER` 底層會屏蔽 [connect 事件](/zh-hant/server/events.html#connect) 和 [close 事件](/zh-hant/server/events.html#close)，原因是這兩種模式下無法保證 connect 事件/close 事件/[receive 事件](/zh-hant/server/events.html#receive) 的執行順序。

> [!TIP]
> **長連接服務**
>
> - 在長連接服務（如 WebSocket 服務器）中，必須選擇 `SWOOLE_DISPATCH_FDMOD` 或 `SWOOLE_DISPATCH_CO_CONN_LB` 這類將請求始終轉發至同一進程的分發策略。否則，同一連接上的數據可能第一次由進程1處理，第二次卻被分發到進程2，而進程2並未保存該連接的相關狀態記錄，從而導致錯誤。

## dispatch_func

自定義 [reactor 線程](/zh-hant/server/process_thread.html#master) 將客戶端數據分發至 [worker 進程](/zh-hant/server/process_thread.html#worker) 的負載均衡策略。

**回調簽名**

```php
function (Swoole\Server $server, int $fd, int $type, string $data): int {}
```

**參數**

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象實例 | 必填 |
| `$fd` | 當前客戶端的文件描述符 | 必填 |
| `$type` | 數據類型，`0` 表示來自客戶端的數據發送，`3` 表示客戶端連接關閉，`4` 表示客戶端連接建立 | 必填 |
| `$data` | 數據內容，不會傳入完整的數據，只會傳入數據包的前 `8K` 內容，需要根據這前 8K 的數據計算出需要投遞的進程序號 | 必填 |

**返回值**：返回 `[0, worker_num - 1]` 的數字，表示數據包投遞的目標 `worker` 進程序號，參見 [worker_num](/zh-hant/server/setting.html#worker-num)。

**示例**

```php
<?php
$server->set(['dispatch_func' => function (Swoole\Server $server, int $fd, int $type, string $data) {}]);
```

> [!WARNING]
> **注意**
>
> - 返回的進程序號不在 `[0, worker_num - 1]` 的話，數據會被丟棄。
> - `dispatch_func` 只能在 [SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#swoole-process) 下使用。
> - `dispatch_func` 的優先級大於 `dispatch_mode`。
> - 設置 `dispatch_func` 後，會強制 [reactor_num](/zh-hant/server/setting.html#reactor-num) 爲 `1`。

## daemonize

將當前服務守護進程化，默認值爲 `false`。

程序將轉入後臺作爲守護進程運行。長時間運行的服務器端程序必須啓用此項。如果不啓用守護進程，當 ssh 終端退出後，程序將被終止運行。

**示例**

```php
<?php
$server->set(['daemonize' => true]);
```

> [!WARNING]
> **注意**
>
> - 啓用守護進程後，標準輸入和輸出會被重定向到 [log_file](/zh-hant/server/setting.html#log-file)；如果未設置 `log_file`，將重定向到 `/dev/null`，所有打印屏幕的信息都會被丟棄。
> - 啓用守護進程後，當前目錄環境變量的值會發生變更，相對路徑的文件讀寫會出錯。PHP 程序中必須使用絕對路徑。
> - systemd：
>     - 使用 `systemd` 或者 `supervisord` 管理 `Swoole` 服務時，請勿設置 `daemonize => true`。主要原因是 `systemd` 的機制與 `init` 不同。`init` 進程的 `PID` 爲 `1`，程序使用 `daemonize` 後，會脫離終端，最終被 `init` 進程託管，與 `init` 關係變爲父子進程關係。
>     - 但 `systemd` 是啓動了一個單獨的後臺進程，自行 `fork` 管理其他服務進程，因此不需要 `daemonize`，反而使用了 `daemonize => true` 會使得 `Swoole` 程序與該管理進程失去父子進程關係。

## display_errors

開啓 / 關閉 `Swoole` 錯誤信息。默認值爲 `true`。

**示例**

```php
<?php
$server->set(['display_errors' => true]);
```

## dns_server

設置 `DNS` 地址。

**示例**

```php
<?php
$server->set(['dns_server' => '8.8.8.8']);
```

## discard_timeout_request

它決定了當客戶端已經斷開連接，但請求數據纔到達或正在處理時，服務器是否還要處理這個“過期”的請求。默認值爲 `true`。

[dispatch_mode](/zh-hant/server/setting.html#dispatch-mode) 爲 `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER`。系統無法保證 [connect 事件](/zh-hant/server/events.html#connect)、[receive 事件](/zh-hant/server/events.html#receive)、[close 事件](/zh-hant/server/events.html#close) 的順序執行，因此可能會有一些請求數據在連接關閉後，才能到達 [worker 進程](/zh-hant/server/process_thread.html#worker)。

**示例**

```php
<?php
$server->set(['discard_timeout_request' => true]);
```

> [!WARNING]
> **注意**
>
> - `discard_timeout_request` 配置默認爲 `true`，表示如果 `worker` 進程收到了已關閉連接的數據請求，將自動丟棄。
> - `discard_timeout_request` 如果設置爲 `false`，表示無論連接是否關閉 `worker` 進程都會處理數據請求。

## task_use_object / task_object

該設置項用於控制 [task 事件](/zh-hant/server/events.html#task) 的回調參數形式，開啓後事件回調將切換爲 [面向對象風格](/zh-hant/server/events.html#面向對象風格)，回調參數變爲一個 [Swoole\Server\Task](/zh-hant/server/class/task.html) 對象。默認值爲 `false`。

**示例**

```php
<?php
$server->set(['task_use_object' => true]);
```

## max_request

設置 [worker 進程](/zh-hant/server/process_thread.html#worker) 可以執行的最大任務數。當 `worker` 進程處理的任務數達到該值時，進程會自動重啓，以釋放佔用的內存和資源。默認值爲 `0`，表示不設限制，進程不會退出。

**示例**

```php
<?php
$server->set(['max_request' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 達到 `max_request` 不一定馬上關閉進程，參考 [max_wait_time](/zh-hant/server/setting.html#max-wait-time)。
> - [SWOOLE_BASE](/zh-hant/server/process_thread.html#swoole-base) 下，達到 `max_request` 後重啓進程會導致客戶端連接斷開。
> - 這個參數的主要作用是解決由於程序編碼不規範導致的 PHP 進程內存泄露問題。PHP 應用程序有緩慢的內存泄漏，但無法定位到具體原因、無法解決，可以通過設置 `max_request` 臨時解決，需要找到內存泄漏的代碼並修復，而不是通過此方案，可以使用 Swoole Tracker 發現泄漏的代碼。

## max_request_grace

與 [max_request](/zh-hant/server/setting.html#max-request) 配合使用，實現 [worker 進程](/zh-hant/server/process_thread.html#worker) 錯峯重啓，默認值爲 `0`，表示不設限制。

**示例**

```php
<?php
$server->set([
    'max_request' => 10000,
    'max_request_grace' => 10000,
]);
```

> [!WARNING]
> **注意**
>
> - 若所有 `worker` 進程的 `max_request` 值完全相同（例如均設爲 1000），可能導致：
>     - 各進程幾乎同時達到請求數上限；
>     - 同時退出並重啓；
>     - 服務在短時間內失去所有 `worker` 進程，引發性能波動。
> - 啓用 `max_request_grace` 後，每個 `worker` 進程在啓動時會在 `max_request` 的基礎上增加一個 `[1, max_request_grace]` 範圍內的隨機值，從而使各進程的實際上限互不相同，實現錯峯重啓。

## task_max_request

設置 [task 進程](/zh-hant/server/process_thread.html#task) 可以執行的最大任務數。當 `task` 進程處理的任務數達到該值時，進程會自動重啓，以釋放佔用的內存和資源。默認值爲 `0`，表示不設限制，進程不會退出。

**示例**

```php
<?php
$server->set(['task_max_request' => 10000]);
```

## task_max_request_grace

與 [task_max_request](/zh-hant/server/setting.html#task-max-request) 配合使用，實現 [task 進程](/zh-hant/server/process_thread.html#task) 錯峯重啓，默認值爲 `0`，表示不設限制。

**示例**

```php
<?php
$server->set([
    'task_max_request' => 10000,
    'task_max_request_grace' => 10000,
]);
```

> [!WARNING]
> **注意**
>
> - 若所有 `task` 進程的 `task_max_request` 值完全相同（例如均設爲 1000），可能導致：
>     - 各進程幾乎同時達到請求數上限；
>     - 同時退出並重啓；
>     - 服務在短時間內失去所有 `task` 進程，引發性能波動。
> - 啓用 `task_max_request_grace` 後，每個 `task` 進程在啓動時會在 `task_max_request` 的基礎上增加一個 `[1, task_max_request_grace]` 範圍內的隨機值，從而使各進程的實際上限互不相同，實現錯峯重啓。

## max_connection / max_conn

設置服務器的最大連接數。當服務器已建立的連接數達到該值時，新進入的連接將被拒絕。默認值爲 `ulimit -n`（系統當前用戶最大打開文件數）。

**示例**

```php
<?php
$server->set(['max_connection' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 如果應用層未顯式設置 `max_connection`，底層將自動使用 `ulimit -n` 的值作爲默認值。
> - `max_connection` 的值不能超過操作系統的 `ulimit -n` 值。若設置過大，底層會發出警告並自動將配置重置爲 `ulimit -n` 的值。
> - 在 `Swoole 4.2.9` 及以上版本中，當檢測到 `ulimit -n` 設置過大（如 `100 萬`）時，底層會將默認值調整爲 `100000`。這是因爲過大的 `ulimit -n` 需要分配大量內存用於連接信息存儲，可能導致進程啓動失敗。
> - 若設置的值過小，底層也會發出警告，並將其調整爲 `ulimit -n` 的值。配置的最小有效值爲 `(worker_num + task_worker_num) * 2 + 32`。
> - `max_connection` 不應盲目調大，應根據服務器實際可用內存合理設置。Swoole 會按照該數值預先分配一塊內存用於保存連接信息，每個 TCP 連接約佔用 `224` 字節。

## max_coroutine / max_coro_num

設置當前工作進程最大協程數量。默認值：`100000`，`Swoole` 版本小於 `v4.4.0-beta` 時默認值爲 `3000`。

**示例**

```php
<?php
$server->set(['max_coroutine' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 超過 `max_coroutine` 底層將無法創建新的協程，底層會拋出 `exceed max number of coroutine` 錯誤，`TCP` 服務會直接關閉連接，`Http` 服務會返回 Http 的 503 狀態碼。
> - 在服務器程序中實際最大可創建協程數量等於 `worker_num * max_coroutine`，[task 進程](/zh-hant/server/process_thread.html#task) 和 [user 進程](/zh-hant/server/process_thread.html#user) 的協程數量單獨計算。

## max_concurrency

限制 `HTTP`、`HTTP2` 服務器最大併發請求數量，超過該值之後，以後的請求會返回 `503` 錯誤，默認值爲 `4294967295`，即爲無符號 `int` 的最大值。

**示例**

```php
<?php
$server->set(['max_concurrency' => 10000]);
```

## worker_max_concurrency

開啓一鍵協程化之後，`worker` 進程會源源不斷的接受請求，爲了避免壓力過大，我們可以設置 `worker_max_concurrency` 限制 `worker` 進程的請求執行數。

**示例**

```php
<?php
$server->set(['worker_max_concurrency' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 當請求數超過該值時，`worker` 進程會將多餘的請求暫存於隊列，默認值爲 `4294967295`，即爲無符號 `int` 的最大值。
> - 如果沒有設置 `worker_max_concurrency`，但是設置了 `max_concurrency` 的話，底層會自動設置 `worker_max_concurrency` 等於 `max_concurrency`。
> - 如果進程重啓時隊列中仍有未處理的請求，底層會遍歷整個隊列，並向其中的每個請求逐一返回 `503 Service Unavailable`。
> - 可以這樣理解：`worker_max_concurrency` 限制的是**單個進程**的併發處理能力，而 `max_concurrency` 限制的是**整個服務器**的總併發處理能力，即所有進程正在處理的請求總數不能超過該值。

> [!TIP]
> Swoole 版本 >= `5.0.0` 可用。

## max_idle_time

該配置指定 TCP 連接的最大空閒時長。若連接在 `max_idle_time` 內未發生任何讀寫操作，底層將主動關閉該連接。默認值爲 `0`，表示不啓用超時檢查。

**示例**

```php
<?php
$server->set([
    'max_idle_time' => 10, // 單位爲秒
]);
```

> [!WARNING]
> **注意**
>
> - 被切斷的連接依然會觸發 [close 事件回調](/zh-hant/server/events.html#close)。
> - 與 [heartbeat_idle_time](/zh-hant/server/setting.html#heartbeat-idle-time) 不同，該配置從**讀寫**兩個維度判斷連接是否空閒，而 `heartbeat_idle_time` 僅判斷客戶端是否發送過數據。

## heartbeat_idle_time

客戶端 `TCP` 連接最大允許空閒的時間，單位爲秒。表示一個客戶端連接如果 `heartbeat_idle_time` 秒內未向服務器發送任何數據，此連接將被強制關閉。

**示例**

```php
<?php
$server->set([
    'heartbeat_idle_time' => 3,       // 表示一個連接如果3秒內未向服務器發送任何數據，此連接將被強制關閉
    'heartbeat_check_interval' => 60, // 表示每60秒遍歷一次
]);
```

> [!WARNING]
> **注意**
>
> - 啓用 `heartbeat_idle_time` 後，服務器並不會主動向客戶端發送數據包。
> - 如果只設置了 `heartbeat_idle_time` 未設置 `heartbeat_check_interval` 底層將不會創建心跳檢測線程。
> - 如果沒有設置 `heartbeat_idle_time`，只設置了 `heartbeat_check_interval`，那麼 `heartbeat_idle_time` 會設置爲 `heartbeat_check_interval` 的兩倍。

## heartbeat_check_interval

每隔多少秒發一次 `TCP` 連接心跳檢測，默認值爲 `0`，表示不開啓心跳檢測。

**示例**

```php
<?php
$server->set([
    'heartbeat_idle_time' => 3,       // 表示一個連接如果3秒內未向服務器發送任何數據，此連接將被強制關閉
    'heartbeat_check_interval' => 60, // 表示每60秒遍歷一次
]);
```

> [!WARNING]
> **注意**
>
> - 服務端並不會主動向客戶端發送心跳包，而是被動等待客戶端發送心跳。服務器端的 `heartbeat_check` 僅僅是檢測連接上一次發送數據的時間，如果超過限制，將切斷連接。
> - 此選項表示每隔多久輪詢一次，單位爲秒。如 `heartbeat_check_interval => 60`，表示每 60 秒，遍歷所有連接，如果該連接在 `heartbeat_idle_time` 秒內沒有向服務器發送任何數據，此連接將被強制關閉。
> - 若未配置，則不會啓用心跳，該配置默認關閉。
> - 被心跳檢測切斷的連接依然會觸發 [close 事件回調](/zh-hant/server/events.html#close)。

## max_wait_time

設置 [worker 進程](/zh-hant/server/process_thread.html#worker) 收到停止服務通知後最大等待時間，默認值：`3`，超過該時間進程還沒退出，該進程會被強制殺死。

**示例**

```php
<?php
$server->set(['max_wait_time' => 30]);
```

> [!WARNING]
> **注意**
>
> - 經常會碰到由於 `worker` 阻塞卡頓導致 `worker` 無法正常 `重啓`，無法滿足一些生產場景，例如發佈代碼熱更新需要 `reload` 進程。所以，Swoole 加入了進程重啓超時時間的選項。詳細信息請參見 **如何正確的重啓服務**。
> - **管理進程收到重啓、關閉信號後或者達到 `max_request` 時，管理進程會重啓該 `worker` 進程。分以下幾個步驟：**
>     - 底層會增加一個（`max_wait_time`）秒的定時器，觸發定時器後，檢查進程是否依然存在，如果是，會強制殺掉，重新拉一個進程。
>     - 需要在 [workerStop 事件](/zh-hant/server/events.html#workerstop) 裏面做收尾工作，需要在 `max_wait_time` 秒內完成收尾。
>     - 依次向目標進程發送 `SIGTERM` 信號，殺掉進程。

## max_queued_bytes

設置 [reactor 線程](/zh-hant/server/process_thread.html#master) 與 [worker 進程](/zh-hant/server/process_thread.html#worker) 之間，針對單個客戶端連接的數據轉發隊列大小上限。默認值爲 `0`，表示不限制。

`reactor` 線程和 `worker` 進程共享客戶端連接，當 `reactor` 線程轉發客戶端數據給 `worker` 進程時，會在該連接上記錄當前已積壓但尚未被 `worker` 進程處理的數據量，如果大於 `max_queued_bytes`，`reactor` 線程會暫停接收這個客戶端發送過來的數據。待積壓數據被 `worker` 進程處理至低於閾值後，`reactor` 線程自動恢復該連接的數據接收。

**示例**

```php
<?php
$server->set([
    'max_queued_bytes' => '2M', // 這裏可以添加單位，底層會自動解析
]);
```

> [!WARNING]
> **注意**
>
> - 該配置只在 [SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#swoole-process) 生效。
> - 當連接因積壓數據超過 `max_queued_bytes` 而被暫停接收後，系統會採用指數退避定時器檢查積壓量，若閾值過小或 `worker` 進程處理過慢，可能導致客戶端長時間無法恢復接收。

## package_max_length

設置能接收的最大數據包尺寸，單位爲字節。默認值：`2M` 即 `2 * 1024 * 1024`，最小值爲 `64K`。

此參數不宜設置過大，否則會佔用很大的內存。

**示例**

```php
<?php
$server->set(['package_max_length' => 2 * 1024 * 1024]);
```

> [!WARNING]
> **注意**
>
> - 開啓協議解析後，Swoole 底層會自動進行數據包拼接。在完整接收一個數據包之前，所有數據都會保存在內存中，因此必須通過 `package_max_length` 限制單個數據包的最大內存佔用。例如，若有 1 萬個 TCP 連接同時發送 `2M` 大小的數據包，極端情況下內存佔用可能高達 `20G`。
> - 不同協議模式下，`package_max_length` 的作用機制如下：
>     - `open_length_check`：當檢測到數據包長度超過 `package_max_length` 時，Swoole 會直接丟棄該數據包並關閉連接，不會佔用額外內存。
>     - `open_eof_check`：由於無法預先獲知數據包長度，接收到的數據會持續保存在內存中，導致內存佔用不斷增長。一旦內存佔用超過 `package_max_length`，Swoole 會丟棄該數據包並關閉連接。
>     - `open_http_protocol`：`GET` 請求最大允許 `8K`，且該限制不可修改。`POST` 請求會檢查 `Content-Length`，若其值超過 `package_max_length`，Swoole 將直接丟棄數據包，返回 `HTTP 400` 錯誤並關閉連接。

## open_eof_check

此選項用於檢測客戶端發來的數據：僅當數據包 `結尾` 匹配指定分隔符（如 `\r\n`）時，底層纔會停止接收數據；否則，數據將被持續拼接，直到超出緩存區限制或接收超時纔會中止。

**示例**

```php
<?php
$server->set([
    'open_eof_check' => true,
    'package_eof' => "\r\n",
]);
```

> [!WARNING]
> **注意**
>
> - 性能極高，幾乎無額外開銷。
> - 若檢測過程發生錯誤，底層會將其視爲惡意連接，直接丟棄數據並強制關閉連接。參考 **TCP 數據包邊界問題**。
> - 此配置僅適用於流類型的套接字（例如 TCP、Unix Socket Stream）。對於指定分隔符檢測，系統不會在數據流中間查找指定分隔符，因此 [worker 進程](/zh-hant/server/process_thread.html#worker) 可能會一次性收到多個數據包。你需要在應用層代碼中自行拆分數據包，例如使用 `explode("\r\n", $data)` 進行分包處理。

## open_eof_split

底層逐字節掃描數據流，每次遇到指定分隔符（如 `\r\n`）就自動切分並交付一個完整數據包給 [worker 進程](/zh-hant/server/process_thread.html#worker)。

**示例**

```php
<?php
$server->set([
    'open_eof_split' => true,
    'package_eof' => "\r\n",
]);
```

> [!WARNING]
> **注意**
>
> - 啓用 `open_eof_split` 後，底層會在數據流中查找指定分隔符並自動拆分數據包，確保 [receive 回調](/zh-hant/server/events.html#receive) 每次都只收到一個以該分隔符結尾的完整數據包。
> - [open_eof_check](/zh-hant/server/setting.html#open-eof-check) 僅檢查數據包末尾是否包含指定分隔符，性能極佳、幾乎無額外開銷，但無法解決多包合併問題：當客戶端連續發送多個帶 EOF 的數據包時，底層可能一次性全部返回，需要業務層自行拆包。
> - `open_eof_split` 採用從左到右的逐字節掃描方式查找指定分隔符來拆分數據包，性能較差，且每次僅返回一個數據包。
> - `open_eof_split` 優先級大於 `open_eof_check`。

## package_eof

設置數據包指定分隔符。

**示例**

```php
<?php
$server->set([
    'open_eof_split' => true,
    'package_eof' => "\r\n",
]);
```

> [!TIP]
> `package_eof` 最大隻允許傳入 `8` 個字節的字符串。

## open_length_check

啓用數據包長度檢測協議解析功能。默認值爲 `false`。參考 **TCP 數據包邊界問題**。

**示例**

```php
<?php
$server->set(['open_length_check' => true]);
```

> [!WARNING]
> **注意**
>
> - 開啓後，服務器底層會自動根據你設定的規則，可以保證 [reactor 線程](/zh-hant/server/process_thread.html#master) 或者 [worker 進程](/zh-hant/server/process_thread.html#worker) 每次都會收到一個完整的數據包。

## package_length_type

指定長度字段的類型（如 `N` 表示 4 字節無符號長整型）。與 `PHP` 的 `pack` 函數一樣。告訴服務器：長度字段佔幾個字節，以及這些字節的排列順序（字節序）。

**示例**

```php
<?php
$server->set(['package_length_type' => 'N']);
```

**注意**

目前 Swoole 支持 10 種長度字段類型：

| 字符參數 | 作用 |
|:---|:---|
| `c` | 有符號、1 字節 |
| `C` | 無符號、1 字節 |
| `s` | 有符號、主機字節序、2 字節 |
| `S` | 無符號、主機字節序、2 字節 |
| `n` | 無符號、網絡字節序、2 字節 |
| `N` | 無符號、網絡字節序、4 字節 |
| `l` | 有符號、主機字節序、4 字節（小寫 L） |
| `L` | 無符號、主機字節序、4 字節（大寫 L） |
| `v` | 無符號、小端字節序、2 字節 |
| `V` | 無符號、小端字節序、4 字節 |

## package_length_offset

定位長度字段位置的核心參數。它告訴服務器：“長度字段這個值，存放在整個數據包的第幾個字節”。

因爲有些協議設計不一定總是把長度字段放在數據包的最開頭。可能包頭還有其他固定信息。長度字段可能偏移幾個字節後纔出現。

**示例**

假設你的協議格式如下：

```text
[ magic: 2字節 ] [ command: 2字節 ] [ length: 4字節 ] [ body: N字節 ]
字節0-1           字節2-3           字節4-7         字節8開始
```

長度字段 length 位於字節 4、5、6、7（共 4 字節），那麼配置就是：

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4字節無符號長整型
    'package_length_offset' => 4,        // 長度字段從第4字節開始 
    'package_body_offset'   => 8,        // 包體從第8字節開始（跳過整個包頭）
    'package_max_length'    => 81920,
]);
```

> [!WARNING]
> **注意**
>
> - 偏移量一定是從 `0` 開始的。

## package_body_offset / package_body_start

定位包體數據起始位置的偏移量。告訴服務器：真正的業務數據（包體）從數據包的第幾個字節開始。

**示例 1**

假設你的協議格式如下：

```text
[ magic: 2字節 ] [ command: 2字節 ] [ length: 4字節 ] [ body: N字節 ]
字節0-1           字節2-3           字節4-7         字節8開始
```

body 從第 8 個字節開始，那麼配置就是：

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4字節無符號長整型
    'package_length_offset' => 4,        // 長度字段從第4字節開始 
    'package_body_offset'   => 8,        // 包體從第8字節開始（跳過整個包頭）
    'package_max_length'    => 81920,
]);
```

**示例 2**

假設你的協議格式如下：

```text
[ magic: 2字節 ] [ command: 2字節 ] [ length: 4字節 ] [ type: 4字節 ] [ body: N字節 ]
字節0-1           字節2-3           字節4-7            字節8-11       字節12開始
```

body 從第 12 個字節開始，那麼配置就是：

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4字節無符號長整型
    'package_length_offset' => 4,        // 長度字段從第4字節開始 
    'package_body_offset'   => 12,        // 包體從第12字節開始（跳過整個包頭）
    'package_max_length'    => 81920,
]);
```

> [!WARNING]
> **注意**
>
> - 偏移量一定是從 `0` 開始的。

## package_length_func

自定義一個 `PHP` 函數來告訴 `Swoole` 一個完整數據包究竟有多長。

這個函數會接收當前接收到的部分數據（存儲在一個緩衝區中），然後你需要在這個函數里實現你的核心邏輯：解析並返回整個數據包的長度。

**回調簽名**

```php
<?php
function(string $data): int {}
```

**參數**

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 當前接收到的部分數據 | 必填 |

**返回值**

- 返回 `0`：數據不足，需等待並接收更多數據。
- 返回 `-1`：數據錯誤，底層將自動關閉連接。
- 返回 `>0`：成功獲取包長（該值即完整數據包的長度）。

**示例**

下面這個例子模擬了一個簡單文本協議，其中數據包的格式爲 "LENGTH:xxx\nBODY:yyy"，你需要從數據中解析出 xxx 作爲長度。

```php
<?php
$server->set([
    'open_length_check'   => true,          // 1. 必須開啓
    'package_max_length'  => 81920,         // 2. 設置最大包長限制
    'package_length_func' => function ($data) {
        // 3. 定義你的解析邏輯
        // 檢查是否已經接收到足夠的數據，以便解析出長度值
        if (strlen($data) < 16) {
            return 0; // 數據不夠，返回0，繼續等待更多數據
        }

        // 假設協議是 "LENGTH:123\n"，用正則從收到的數據開頭提取長度
        if (preg_match('/^LENGTH:(\d+)\n/', $data, $match)) {
            $length = (int)$match[1];
            
            // 獲取整個包頭的長度，以便計算完整包長
            $header_length = strlen($match[0]);
            
            // 返回整個數據包的總長度 = 包頭長度 + 包體長度
            return $header_length + $length;
        }

        // 如果連包頭都不符合協議規範，返回 -1，讓 Swoole 關閉這個連接
        return -1;
    }
]);
```

> [!WARNING]
> **注意**
>
> - `package_length_func` 主要用來處理那些"無法用一個固定偏移量就讀取到長度"的複雜協議。
> - 請勿在長度解析函數中執行阻塞 IO 操作，可能導致所有 [reactor 線程](/zh-hant/server/process_thread.html#master) 或者 [worker 進程](/zh-hant/server/process_thread.html#worker) 發生阻塞。
> - 由於 `ZendVM` 不支持運行在多線程環境，因此底層會自動使用 `Mutex` 互斥鎖對 `PHP` 長度函數進行加鎖，避免併發執行 `PHP` 函數。

> [!TIP]
> Swoole 版本 >= `1.9.3` 可用。

## upload_max_filesize

設置 `HTTP`，`HTTP2` 服務器允許上傳的文件大小上限。防止大文件上傳耗盡服務器內存，提升服務穩定性。

**示例**

```php
<?php
use Swoole\Http\Server;
$http = new Server('127.0.0.1', 9501);
$http->set([
  'package_max_length' => 2 * 1024 * 1024,
  'upload_max_filesize' => 4 * 1024 * 1024
]);
```

> [!WARNING]
> **注意**
>
> - `upload_max_filesize` 用於允許 `HTTP` 服務器接收大文件。當接收到的請求報文大小超過 [package_max_length](/zh-hant/server/setting.html#package-max-length) 但未超過 `upload_max_filesize` 時，服務器不會丟棄數據，而是將請求體內容寫入磁盤臨時文件，不在內存中保留副本。後續處理時再從文件中讀取數據，從而避免內存溢出。
> - 必須配合 `package_max_length` 和 `php` 的 `memory_limit` 使用（兩者是硬性上限）。

> [!TIP]
> `Swoole 5.0.0` 以上可以使用。

## upload_tmp_dir

設置 `HTTP`，`HTTP2` 服務器文件上傳的臨時存儲路徑，默認值爲 `/tmp`。

**示例**

```php
<?php
$server->set([
  'upload_tmp_dir' => '/data/uploadfiles/',
]);
```

## aio_core_worker_num

設置異步線程池最小線程數，默認爲 `CPU` 核數。

**示例**

```php
<?php
$server->set([
  'aio_core_worker_num' => 10
]);
```

## aio_worker_num

設置異步線程池最大線程數，默認爲 `CPU` 核數 * 8。

**示例**

```php
<?php
$server->set([
  'aio_worker_num' => 80
]);
```

## aio_max_wait_time

設置任務最大等待時間，單位爲秒。

**示例**

```php
<?php
$server->set([
  'aio_max_wait_time' => 80
]);
```

> [!WARNING]
> **注意**
>
> - 如果每個線程都有任務在處理，但是隊列積壓的任務的等待時間已經超過了 `aio_max_wait_time`，底層會擴容出新的線程來處理任務。
> - 擴容的新線程 + 現有線程數不會超過 [aio_worker_num](/zh-hant/server/setting.html#aio-worker-num)。

## aio_max_idle_time

設置異步線程池線程的空閒時間，單位爲秒，超過該時間沒有接收到任務的線程將會被回收。

**示例**

```php
<?php
$server->set([
  'aio_max_idle_time' => 10
]);
```

> [!WARNING]
> **注意**
>
> - 在底層回收空閒線程時，底層會保證線程數不會少於 [aio_core_worker_num](/zh-hant/server/setting.html#aio-core-worker-num)。

## iouring_entries

設置 `io_uring` 的隊列大小時，默認值爲 8192。若傳入的值不是 2 的冪次方，內核會將其調整爲**大於該值且最接近的 2 的冪次方數**。

**示例**

```php
<?php
$server->set([
  'iouring_entries' => 8192
]);
```

> [!WARNING]
> **注意**
>
> - 如果傳入的值過大，內核會拋出異常並且終止程序。
> - 當系統安裝了 `liburing` 和編譯 `Swoole` 開啓了 [--enable-iouring](/zh-hant/start/install.html#編譯選項詳解) 之後才能使用。

> [!TIP]
> `Swoole 6.0` 以上可以使用。

## iouring_workers

設置 `io_uring` 的工作線程數，默認值是 `CPU 核數 * 4`。

**示例**

```php
<?php
$server->set([
  'iouring_workers' => 128
]);
```

> [!WARNING]
> **注意**
>
> - 如果傳入的值過大，內核會拋出異常並且終止程序。
> - 當系統安裝了 `liburing` 和編譯 `Swoole` 開啓了 [--enable-iouring](/zh-hant/start/install.html#編譯選項詳解) 之後才能使用。

> [!TIP]
> `Swoole 6.0` 以上可以使用。

## iouring_flag

設置 `io_uring` 的工作模式，默認值爲 `SWOOLE_IOURING_DEFAULT`。

**示例**

```php
<?php
$server->set([
  'iouring_flag' => SWOOLE_IOURING_DEFAULT
]);
```

> [!WARNING]
> **注意**
>
> - 如果傳入的模式不正確，內核會統一使用 `SWOOLE_IOURING_DEFAULT` 中斷驅動模式。
> - `SWOOLE_IOURING_DEFAULT`，中斷驅動模式，可通過系統調用 `io_uring_enter` 提交 `I/O` 請求，然後直接檢查完成隊列狀態判斷是否完成。
> - `SWOOLE_IOURING_SQPOLL`，內核輪詢模式，內核會創建內核線程用於提交和收割 `I/O` 請求，幾乎完全消除用戶態內核態上下文切換，性能較好。
> - 當系統安裝了 `liburing` 和編譯 `Swoole` 開啓了 [--enable-iouring](/zh-hant/start/install.html#編譯選項詳解) 之後才能使用。

> [!TIP]
> `Swoole 6.0` 以上可以使用。

## reload_async

設置異步柔性重啓開關。默認值：`true`

**示例**

```php
<?php
$server->set([
  'reload_async' => true
]);
```

> [!WARNING]
> **注意**
>
> - 將啓用異步安全重啓特性，[worker 進程](/zh-hant/server/process_thread.html#worker) 會等待異步事件完成後再退出。詳細信息請參見「如何正確的重啓服務」。
> - `reload_async` 開啓的主要目的是爲了保證服務重載時，協程或異步任務能正常結束。
> - 在 `4.x` 版本中開啓 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 時，底層會額外增加一個協程數量的檢測，當前無任何協程時進程纔會退出，開啓時即使 `reload_async => false` 也會強制打開 `reload_async`。

## single_thread

設置 [master 進程](/zh-hant/server/process_thread.html#master) 中的 `reactor` 線程數爲 1。

**示例**

```php
<?php
$server->set([
    'single_thread' => true
]);
```

## ssl_cert_file / ssl_key_file

設置 SSL 隧道加密。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_TCP | SWOOLE_SSL);
$server->set(array(
  'ssl_cert_file' => __DIR__.'/config/ssl.crt',
  'ssl_key_file' => __DIR__.'/config/ssl.key',
));
```

> [!WARNING]
> **注意**
>
> - 使用 `HTTPS` 服務時，瀏覽器必須信任所配置的 SSL 證書，否則頁面會顯示不安全。
> - 使用 `wss`（WebSocket over SSL）時，發起連接的頁面也必須通過 `HTTPS` 訪問。
> - 瀏覽器不信任 `SSL` 證書將無法使用 `wss`。
> - 文件必須爲 `PEM` 格式，不支持 `DER` 格式，可使用 `openssl` 工具進行轉換。

**`PEM` 轉 `DER` 格式**

```shell
openssl x509 -in cert.crt -outform der -out cert.der
```

**`DER` 轉 `PEM` 格式**

```shell
openssl x509 -in cert.crt -inform der -outform pem -out cert.pem
```

> [!TIP]
> 該配置需要編譯 `Swoole` 時加入 `--enable-openssl` 選項，但在 `Swoole 6.2.0` 已經默認支持 `openssl`。

## ssl_compress

設置是否啓用 `SSL/TLS` 壓縮。

**示例**

```php
<?php
$server->set([
  'ssl_compress' => true
]);
```

## ssl_protocols

設置 OpenSSL 隧道加密的協議。默認值：`0`，支持全部協議。

支持的協議類型有 `SWOOLE_SSL_TLSv1`、`SWOOLE_SSL_TLSv1_1`、`SWOOLE_SSL_TLSv1_2`、`SWOOLE_SSL_TLSv1_3`、`SWOOLE_SSL_SSLv2`、`SWOOLE_SSL_SSLv3`。

**示例**

```php
<?php
$server->set(array(
    'ssl_protocols' => SWOOLE_SSL_TLSv1,
));
```

> [!TIP]
> Swoole 版本 >= `v4.5.4` 可用。

## ssl_verify_peer

是否驗證服務端 SSL 證書的對端證書。默認值：`false`

**示例**

```php
<?php
$server->set(array(
  'ssl_client_cert_file' => '/path/to/cert_file',
  'ssl_verify_peer' => true,
));
```

> [!TIP]
> 默認關閉，即不驗證客戶端證書。若開啓，必須同時設置 `ssl_client_cert_file` 選項

## ssl_client_cert_file

根證書文件路徑，用於驗證客戶端證書（雙向 SSL 認證中的 CA 根證書）。

**示例**

```php
<?php
$server->set(array(
    'ssl_cert_file'         => __DIR__ . '/config/ssl.crt',
    'ssl_key_file'          => __DIR__ . '/config/ssl.key',
    'ssl_verify_peer'       => true,
    'ssl_allow_self_signed' => true,
    'ssl_client_cert_file'  => __DIR__ . '/config/ca.crt',
));
```

> [!TIP]
> `TCP` 服務若驗證失敗，底層會主動關閉連接。

## ssl_allow_self_signed

是否允許自簽名證書。默認值：`false`。

**示例**

```php
<?php
$server->set([
  'ssl_allow_self_signed' => true
]);
```

## ssl_cafile

當設置 `ssl_verify_peer` 爲 `true` 時，用來驗證遠端證書所用到的 `CA` 證書。本選項值爲 `CA` 證書在本地文件系統的全路徑及文件名。

**示例**

```php
<?php
$server->set([
  'ssl_cafile' => '/etc/CA',
]);
```

## ssl_capath

如果未設置 `ssl_cafile`，或者 `ssl_cafile` 所指的文件不存在時，會在 `ssl_capath` 所指定的目錄搜索適用的證書。該目錄必須是已經經過哈希處理的證書目錄。

**示例**

```php
<?php
$server->set([
  'ssl_capath' => '/etc/capath/',
]);
```

## ssl_verify_depth

如果證書鏈條層次太深，超過了本選項的設定值，則終止驗證。

**示例**

```php
<?php
$server->set([
  'ssl_verify_depth' => 5
]);
```

## ssl_prefer_server_ciphers

決定當客戶端（瀏覽器）和服務器建立加密連接時，由誰來選擇使用哪種加密算法（密碼套件）。

**示例**

```php
<?php
$server->set([
  'ssl_prefer_server_ciphers' => true
]);
```

> [!WARNING]
> **注意**
>
> - `true` 表示優先使用服務器端配置的加密套件順序。
> - `false` 優先使用客戶端（瀏覽器）提供的加密套件順序。

## ssl_ciphers

設置 `Openssl` 加密算法，默認值爲：`EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH`

**示例**

```php
<?php
$server->set([
  'ssl_ciphers' => 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH'
]);
```

> [!WARNING]
> **注意**
>
> - `ssl_ciphers` 爲空時，由 `openssl` 自行選擇加密算法

## ssl_ecdh_curve

專門控制 `ECDH` 密鑰交換過程中所使用的橢圓曲線。

**示例**

```php
<?php
$server->set([
  'ssl_ecdh_curve' => 'X25519:prime256v1:secp384r1'
]);
```

## ssl_dhparam

用於指定 Diffie-Hellman (DH) 密鑰交換所使用的強參數。當服務器使用老式的 DHE 加密套件時，這個指令告訴服務器應該使用哪個“大質數文件”來生成臨時的會話密鑰，從而保證安全性。

**示例**

```php
<?php
$server->set([
  'ssl_dhparam' => '/etc/dhparam.pem'
]);
```

## ssl_sni_certs

設置 SNI (Server Name Identification) 證書。

**示例**

```php
<?php
$server->set([
  'ssl_sni_certs' => [
        'cs.php.net' => [
            'ssl_cert_file' => __DIR__ . '/sni_server_cs_cert.pem',
            'ssl_key_file' => __DIR__ . '/sni_server_cs_key.pem',
        ],
        'uk.php.net' => [
            'ssl_cert_file' =>  __DIR__ . '/sni_server_uk_cert.pem',
            'ssl_key_file' => __DIR__ . '/sni_server_uk_key.pem',
        ],
        'us.php.net' => [
            'ssl_cert_file' => __DIR__ . '/sni_server_us_cert.pem',
            'ssl_key_file' => __DIR__ . '/sni_server_us_key.pem',
        ],
    ]
]);
```

## websocket_compression

是否啓用 `WebSocket` 幀數據的壓縮功能。啓用後，仍需配合 `SWOOLE_WEBSOCKET_FLAG_COMPRESS` 標誌位，對具體的幀單獨進行壓縮。

**示例1：單幀壓縮（自動壓縮）**

當 `websocket_compression` 設置爲 `true`，並在發送幀時攜帶 `SWOOLE_WEBSOCKET_FLAG_COMPRESS`，`Swoole` 底層會自動對該幀數據進行 `zlib` 壓縮後發送給客戶端。

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
// 開啓 WebSocket 壓縮支持
$server->set(['websocket_compression' => true]);

$server->on('message', function (Server $server, Frame $frame) {
  // 發送時帶上 SWOOLE_WEBSOCKET_FLAG_COMPRESS 標誌，底層會自動使用 zlib 壓縮該幀數據
  $server->push(
      $frame->fd,
      'Hello Swoole',
      SWOOLE_WEBSOCKET_OPCODE_TEXT,
      SWOOLE_WEBSOCKET_FLAG_FIN | SWOOLE_WEBSOCKET_FLAG_COMPRESS
  );
});

$server->start();
```

**示例2：連續幀壓縮（手動壓縮）**

當 `websocket_compression` 爲 `true` 時，如果需要發送多個連續幀（分片消息），底層不會自動壓縮，必須由開發者自行壓縮數據並設置 `RSV1` 標誌。

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
// 開啓 WebSocket 壓縮支持
$server->set(['websocket_compression' => true]);

$server->on('message', function (Server $server, Frame $frame) {
  $data1 = bin2hex(random_bytes(10 * 1024));
  $data2 = bin2hex(random_bytes(20 * 2048));
  $data3 = bin2hex(random_bytes(40 * 4096));
  $data4 = bin2hex(random_bytes(40 * 4096));
  
  $context = deflate_init(ZLIB_ENCODING_RAW);
  $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
  $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
  $server->push($frame->fd, deflate_add($context, $data3, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
  $server->push($frame->fd, deflate_add($context, $data4, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - 要求服務端與客戶端在握手階段均明確支持壓縮；若任一方不支持，則整個通信流程中的消息均不會自動壓縮。
> - `Ping`，`Pong` 和關閉幀這三個控制幀不會受到該配置的影響，控制幀不允許壓縮。
> - 有關分片消息的處理機制及詳細說明，可以查看 [Swoole\WebSocket\Server->push()](/zh-hant/server/methods.html#push)。

## websocket_subprotocol

在 `WebSocket` 連接建立時，客戶端和服務器協商確定雙方都支持的消息格式或應用層協議。

**示例**

```php
<?php
$server->set([
    'websocket_subprotocol' => 'json',
]);
```

> [!NOTE]
> **說明**
>
> - 設置後握手響應的 HTTP 頭會增加 `Sec-WebSocket-Protocol: {$websocket_subprotocol}`。具體使用方法請參考 `WebSocket` 協議相關 `RFC` 文檔。
> - `WebSocket` 只提供了一個"全雙工通信的管道"，但不管管道里傳輸的數據長什麼樣（是 JSON、是 XML、還是自定義二進制格式）。`Subprotocol` 就是告訴對方："我發的消息是按某某協議組織的，你能理解嗎？"。

## open_websocket_ping_frame

該選項用於控制是否由使用者自行處理 `websocket` 客戶端發來的 `Ping` 幀。默認值爲 `false`，此時服務器會自動響應一個 `Pong` 幀給客戶端。

**示例**

```php
<?php
$websocket->set([
  'open_websocket_ping_frame' => true
]);
```

> [!WARNING]
> **注意**
>
> - 設置爲 `true` 後，由客戶端發送的 `Ping` 幀不會由底層自動處理，而是會觸發 [message 事件](/zh-hant/server/events.html#message)，由使用者自行處理。

## open_websocket_pong_frame

該選項用於控制是否由使用者自行處理 `websocket` 客戶端發來的 `Pong` 幀。默認值爲 `false`。

**示例**

```php
<?php
$websocket->set([
  'open_websocket_pong_frame' => true
]);
```

> [!WARNING]
> **注意**
>
> - 設置爲 `true` 後，由客戶端發送的 `Pong` 幀不會由底層自動處理，而是會觸發 [message 事件](/zh-hant/server/events.html#message)，由使用者自行處理。

## open_websocket_close_frame

該選項用於控制是否由使用者自行處理 `websocket` 客戶端發來的 `關閉` 幀。默認值爲 `false`。

**示例**

```php
<?php
$websocket->set([
  'open_websocket_close_frame' => true
]);
```

> [!WARNING]
> **注意**
>
> - 設置爲 `true` 後，由客戶端發送的 `關閉` 幀不會由底層自動處理，而是會觸發 [message 事件](/zh-hant/server/events.html#message)，由使用者自行處理。

## http_compression

是否開啓 `HTTP` 響應壓縮，默認值爲：`true`。

**示例**

```php
<?php
$http->set([
  'http_compression' => true
]);
```

> [!WARNING]
> **注意**
>
> - 該參數生效的前提是服務器至少支持 `brotli`、`gzip`、`deflate`、`zstd` 中的一種壓縮算法。否則，由於缺乏可用的壓縮功能，此參數將不會產生任何作用。

## http_compression_level / compression_level / http_gzip_level

設置 `HTTP` 響應壓縮等級，範圍是 1-9，等級越高壓縮後的尺寸越小，但 CPU 消耗更多。默認爲 1，最高爲 9。

**示例**

```php
<?php
$http->set([
  'http_compression' => true,
  'http_compression_level' => 6
]);
```

## http_compression_min_length / compression_min_length

設置 `HTTP` 響應壓縮的最小字節，超過該選項值纔開啓壓縮。默認 20 字節。

**示例**

```php
<?php
$http->set([
  'http_compression' => true,
  'http_compression_level' => 6,
  'http_compression_min_length' => 4096
]);
```

## http_compression_types / compression_types

設置需要壓縮的響應類型。

**示例**

```php
<?php
$http->set([
  'http_compression_types' => ['text/html', 'application/json']
]);
```

> [!TIP]
> `Swoole` 版本 >= `v4.8.12` 可用

## http_parse_cookie

設置底層在解析 `HTTP` 報文時是否啓用 `Cookies` 解析，默認值爲 `true`。若設置爲 `false`，則不會對 `Cookies` 進行解析，原始的 `Cookies` 信息將保留在 [Swoole\Http\Request->header](/zh-hant/server/class/request.html#header) 中。

**示例**

```php
<?php
$http->set([
  'http_parse_cookie' => true,
]);
```

## http_parse_post

設置底層在解析 `HTTP` 報文時是否啓用 `POST` 解析，默認值爲 `true`。若設置爲 `false`，則不會對 `POST` 進行解析。

**示例**

```php
<?php
$http->set([
  'http_parse_post' => true,
]);
```

> [!NOTE]
> **說明**
>
> - 設置爲 `true` 時自動將 `Content-Type` 爲 `x-www-form-urlencoded` 的請求包體解析到 [Swoole\Http\Request->post](/zh-hant/server/class/request.html#post) 中。
> - 設置爲 `false` 時可以通過 [Swoole\Http\Request->getContent()](/zh-hant/server/class/request.html#getcontent) 獲取請求包體。

## http_parse_files

設置底層在解析 `HTTP` 報文時是否對用戶上傳文件進行解析，默認值爲 `true`。若設置爲 `false`，則不會對用戶上傳文件進行解析。

**示例**

```php
<?php
$http->set([
  'http_parse_files' => true,
]);
```

## http2_header_table_size

設置 `HTTP/2` 服務器中 `HPACK` 壓縮動態表的最大大小的參數。

**示例**

```php
<?php
$http2->set([
  'http2_header_table_size' => 0x1
]);
```

## http2_enable_push

控制 `HTTP/2` 服務器是否啓用 `Server Push`（服務端推送）功能的開關。

**示例**

```php
<?php
$http2->set([
  'http2_enable_push' => 0x2
]);
```

## http2_max_concurrent_streams

限制在單個 `HTTP/2` 連接上同時處於活躍狀態的流（`Stream`）的最大數量。

**示例**

```php
<?php
$http2->set([
  'http2_max_concurrent_streams' => 256
]);
```

## http2_init_window_size

用於配置 `HTTP/2` 服務器流量控制中初始窗口大小的參數。

**示例**

```php
<?php
$http2->set([
  'http2_init_window_size' => '256K'
]);
```

## http2_max_frame_size

配置 `HTTP/2` 服務器中單個幀（`Frame`）最大有效載荷（`Payload`）大小的參數。

**示例**

```php
<?php
$http2->set([
  'http2_max_frame_size' => '256K'
]);
```

## http2_max_header_list_size

配置 `HTTP/2` 連接中允許接收的最大頭部列表大小的參數。

**示例**

```php
<?php
$http2->set([
  'http2_max_header_list_size' => '32K'
]);
```

## http2_cancel_on_stream_reset

設置客戶端發送 `RST_STREAM` 幀重置 `HTTP/2` 流時，是否取消該流上正在處理的請求協程。默認值爲 `false`。

開啓後，`HTTP/2` 請求回調會在獨立的協程中執行。當客戶端重置某個流（例如瀏覽器取消請求）時，`Swoole` 會向該流對應的請求協程拋出 `Swoole\Coroutine\CanceledException` 異常，及時終止無意義的後續處理（如數據庫查詢、調用下游服務），釋放服務器資源。

**示例**

```php
<?php
use Swoole\Coroutine\CanceledException;

$http2->set([
    'open_http2_protocol' => true,
    'http2_cancel_on_stream_reset' => true,
]);

$http2->on('request', function (Swoole\Http\Request $request, Swoole\Http\Response $response) {
    try {
        Swoole\Coroutine::sleep(10); // 模擬耗時操作
        $response->end('done');
    } catch (CanceledException $e) {
        // 客戶端已取消請求，清理資源後直接返回
        var_dump($e->getReason());
    }
});
```

`getReason()` 返回的關聯數組包含以下字段：

| 字段 | 說明 |
|:---|:---|
| `session_id` | 客戶端連接的 `fd` |
| `stream_id` | 被重置的流 `ID` |
| `code` | `RST_STREAM` 幀攜帶的 `HTTP/2` 錯誤碼，例如 `8` 表示 `CANCEL` |
| `message` | 固定爲 `HTTP2 Stream Reset` |

> [!WARNING]
> **注意**
>
> - Swoole 版本 >= `v6.3` 可用。
> - 必須同時開啓 [open_http2_protocol](/zh-hant/server/setting.html#open-http2-protocol) 和 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine)，否則啓動時會拋出配置異常。
> - 請求回調中必須捕獲 `Swoole\Coroutine\CanceledException` 異常，否則將產生 `Fatal Error`，導致 `worker` 進程退出。
> - 流被重置後，對應的 `$response` 不再可寫，`isWritable()`、`write()`、`end()` 均返回 `false`。
> - 若請求因 [worker_max_concurrency](/zh-hant/server/setting.html#worker-max-concurrency) 限制仍在排隊，收到重置後會直接跳過該請求的回調，不再執行。
> - 僅在收到 `RST_STREAM` 幀時觸發取消，`GOAWAY` 幀和連接關閉不會取消請求協程。

## document_root

配置靜態文件服務器根目錄。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true
]);
```

當你訪問 `http://127.0.0.1:9501/hello.txt` 時，如果 `/home/files/` 存在這份 `hello.txt` 文件，就會返回這份文件的內容給客戶端。

當你訪問 `http://127.0.0.1:9501/hello/hello.txt` 時，如果 `/home/files/hello/` 存在這份 `hello.txt` 文件，就會返回這份文件的內容給客戶端。

> [!WARNING]
> **注意**
>
> - 設置 `document_root` 並設置 `enable_static_handler` 爲 `true` 後，底層收到 `Http` 請求會先判斷 `document_root` 路徑下是否存在此文件，如果存在會直接發送文件內容給客戶端，不再觸發 [request 事件](/zh-hant/server/events.html#request)。
> - 使用靜態文件處理特性時，應當將動態 `PHP` 代碼和靜態文件進行隔離，靜態文件存放到特定的目錄。

> [!TIP]
> 這個功能比較簡易，只能用於測試，禁止在互聯網中使用。

## enable_static_handler

啓動靜態文件服務器。默認爲：`false`。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true
]);
```

> [!TIP]
> 這個功能比較簡易，只能用於測試，禁止在互聯網中使用。

## static_handler_locations

設置靜態處理器的路徑。類型爲數組，默認不啓用。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'static_handler_locations' => ['/static', '/app/images'],
]);
```

> [!NOTE]
> **說明**
>
> - 類似於 `Nginx` 的 `location` 指令，可以指定一個或多個路徑爲靜態路徑。只有 `URL` 在指定路徑下才會啓用靜態文件處理器，否則會視爲動態請求。
> - 必須以 `/` 開頭。支持多級路徑，如 `/app/images`。
> - 啓用 `static_handler_locations` 後，如果請求對應的文件不存在，將直接返回 404 錯誤。

> [!TIP]
> 這個功能比較簡易，只能用於測試，禁止在互聯網中使用。

## url_rewrite_rules

靜態文件服務器 URL 重寫規則的配置採用數組形式。每個規則包含一個鍵值對，其中鍵（key）爲正則表達式，用於匹配請求路徑；值（value）爲目標目錄路徑。當請求路徑與某個鍵的正則表達式匹配成功時，該請求將被重寫至對應的目標目錄。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'url_rewrite_rules' => [
    '~^/view/post/(\d+)$~' => '/static/$1.html',
    '/article/' => '/static/article/'
  ]
]);
```

當訪問 `http://127.0.0.1:9501/view/post/123` 時，該 URL 會匹配正則表達式 `~^/view/post/(\d+)$~`。匹配成功後，系統會在 `/home/files/static/` 目錄下查找與捕獲的數字（即 `123`）對應的 `123.html` 文件。如果該文件存在，則將其內容返回給客戶端。

> [!TIP]
> 這個功能比較簡易，只能用於測試，禁止在互聯網中使用。

## http_autoindex

開啓目錄瀏覽功能，默認爲：`false`。

當訪問服務器上的一個目錄，且該目錄下沒有默認的索引文件（如 index.html、index.php）時，服務器會自動生成一個該目錄下的文件和子目錄列表（目錄索引），並以網頁形式返回給客戶端。類似 `Nginx` 的 `autoindex` 指令。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'http_autoindex' => true,
]);
```

當你直接訪問 `http://127.0.0.1:9501` 時，就會返回整個 `/home/files/` 的文件路徑。

> [!TIP]
> 這個功能比較簡易，只能用於測試，禁止在互聯網中使用。

## http_index_files

用於指定當客戶端訪問一個目錄時，默認返回該目錄下的哪個文件。類似 `Nginx` 的 `index` 指令。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'http_index_files' => ['index.php'],
]);
```

訪問 `http://127.0.0.1:9501/`，如果 `/home/files/` 存在 `index.php`，會將該文件返回給客戶端。

> [!TIP]
> 這個功能比較簡易，只能用於測試，禁止在互聯網中使用。

## log_file

指定 `Swoole` 錯誤日誌文件。

**示例**

```php
<?php
$http->set([
  'log_file' => '/home/log.txt'
]);
```

> [!WARNING]
> **注意**
>
> - 在 `Swoole` 運行期發生的異常信息會記錄到這個文件中，默認會打印到屏幕。
> - 開啓守護進程模式後 `(daemonize => true)`，標準輸出將會被重定向到 `log_file`。在 PHP 代碼中 `echo/var_dump/print` 等打印到屏幕的內容會寫入到 `log_file` 文件。
> - `log_file` 中的日誌僅僅是做運行時錯誤記錄，沒有長久存儲的必要。
> - `log_file` 不會自動切分文件，所以需要定期清理此文件。觀察 `log_file` 的輸出，可以得到服務器的各類異常信息和警告。
> - 在服務器程序運行期間，日誌文件被 `mv` 移動或 `unlink` 刪除後，日誌信息將無法正常寫入，這時可以向 [master 進程](/zh-hant/server/process_thread.html#master) 或者 [manager 進程](/zh-hant/server/process_thread.html#manager) 發送 `SIGRTMIN` 信號實現重新打開日誌文件。
> - 在日誌信息中，進程 ID 前會加一些標號，表示日誌產生的線程/進程類型。`#` 表示 master 進程，`$` 表示 manager 進程，`*` 表示 [worker 進程](/zh-hant/server/process_thread.html#worker)，`^` 表示 [task 進程](/zh-hant/server/process_thread.html#task)。
> - `log_file` 不會記錄 [user 進程](/zh-hant/server/process_thread.html#user) 輸出的日誌。

## log_level

日誌打印的等級，低於 `log_level` 設置的日誌信息不會拋出。默認值：`SWOOLE_LOG_INFO`。

**示例**

```php
<?php
$http->set([
  'log_level' => SWOOLE_LOG_INFO
]);
```

支持的日誌等級有：

| 常量名                  | 級別   | 說明                        |
|:---|:---|:---|
| `SWOOLE_LOG_DEBUG`   | 調試   | 調試日誌，僅作爲內核開發調試使用          |
| `SWOOLE_LOG_TRACE`   | 跟蹤   | 跟蹤日誌，可用於跟蹤系統問題，攜帶關鍵性信息    |
| `SWOOLE_LOG_INFO`    | 普通信息 | 普通信息，僅作爲信息展示              |
| `SWOOLE_LOG_NOTICE`  | 提示   | 提示信息，系統可能存在某些行爲，如重啓、關閉    |
| `SWOOLE_LOG_WARNING` | 警告   | 警告信息，系統可能存在某些問題           |
| `SWOOLE_LOG_ERROR`   | 錯誤   | 錯誤信息，系統發生了某些關鍵性的錯誤，需要即時解決 |
| `SWOOLE_LOG_NONE`    | 無    | 相當於關閉日誌信息，日誌信息不會拋出        |

> [!WARNING]
> **注意**
>
> - `SWOOLE_LOG_DEBUG` 和 `SWOOLE_LOG_TRACE` 僅在編譯爲 [--enable-debug-log](/zh-hant/start/install.html#編譯選項詳解) 和 [--enable-trace-log](/zh-hant/start/install.html#編譯選項詳解) 版本時可用；
> - 在開啓 `daemonize` 守護進程時，底層將把程序中的所有打印屏幕的輸出內容寫入到 [log_file](/zh-hant/server/setting.html#log-file)，這部分內容不受 `log_level` 控制。

## log_date_format

設置日誌時間格式，格式參考 [strftime](https://www.php.net/manual/zh/function.strftime.php) 的時間格式。

**示例**

```php
<?php
$server->set([
    'log_date_format' => '%Y-%m-%d %H:%M:%S',
]);
```

## log_date_with_microseconds

設置日誌精度，是否帶微秒，默認值：`false`。

**示例**

```php
<?php
$server->set([
    'log_date_with_microseconds' => false,
]);
```

## log_rotation

設置是否開啓日誌分割，默認值：`SWOOLE_LOG_ROTATION_SINGLE`。

**示例**

```php
<?php
$server->set([
    'log_rotation' => SWOOLE_LOG_ROTATION_SINGLE,
]);
```

支持的日誌分割方式有：

| 常量                               | 說明  | 版本信息   |
|:---------------------------------|:----|:-------|
| SWOOLE_LOG_ROTATION_SINGLE       | 不啓用 | -      |
| SWOOLE_LOG_ROTATION_MONTHLY      | 每月  | v4.5.8 |
| SWOOLE_LOG_ROTATION_DAILY        | 每日  | v4.5.2 |
| SWOOLE_LOG_ROTATION_HOURLY       | 每小時 | v4.5.8 |
| SWOOLE_LOG_ROTATION_EVERY_MINUTE | 每分鐘 | v4.5.8 |

## open_http_protocol

啓用 `HTTP` 協議報文解析。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 先啓動一個 HTTP 服務器 - 1
$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

// 再啓動一個 HTTP 服務器 - 2
$port = $http->listen('127.0.0.1', 9502, SWOOLE_TCP);

// 如果你已經閱讀了這個多端口監聽的章節，就會知道這個是非必須的，因爲子端口會繼承父端口的配置，這裏只是演示如何配置。
$port->set(['open_http_protocol' => true]); 

$port->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello World. #".rand(1000, 9999)."</h1>");
});

$http->start();
```

> [!WARNING]
> **注意**
>
> - [HTTP/HTTPS/HTTP2 服務器](/zh-hant/server/http.html) 和 [WebSocket 服務器](/zh-hant/server/websocket.html) 默認開啓 `open_http_protocol`。
> - 該配置很少使用，一般用於 [多端口監聽](/zh-hant/server/port.html)。

## open_websocket_protocol

啓用 `WebSocket` 協議報文解析。

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, "Hello Swoole");
});

$port = $server->listen('127.0.0.1', 9502, SWOOLE_TCP);

// 如果你已經閱讀了這個多端口監聽的章節，就會知道這個是非必須的，因爲子端口會繼承父端口的配置，這裏只是演示如何配置。
$port->set(['open_websocket_protocol' => true]); 

$port->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, "Hello World");
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - [WebSocket 服務器](/zh-hant/server/websocket.html) 默認開啓 `open_websocket_protocol`。
> - 該配置很少使用，一般用於 [多端口監聽](/zh-hant/server/port.html)。

## open_http2_protocol

啓用 `HTTP2` 協議報文解析。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// 設置SSL證書
$http->set([
  'ssl_cert_file' => '/server.crt',
  'ssl_key_file' => '/server.key',
  'open_http2_protocol' => true  // 開啓這個以便於解析http2協議
]);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

## open_mqtt_protocol

啓用 `mqtt` 協議報文解析。

## open_redis_protocol

啓用 `redis` 協議報文解析。

## socket_buffer_size

該配置控制着服務端向客戶端發送數據的緩衝區大小，默認值爲：`8M`。

**示例**

```php
<?php
$server->set([
  'socket_buffer_size' => 128 * 1024 *1024
]);
```

> [!WARNING]
> **注意**
>
> - 假設 `socket_buffer_size` 爲 `8M`，需要發送 `20M` 的數據給客戶端。此時會有兩種情況：
>     - 網絡非常好，`20M` 數據一次操作就發送給了客戶端，不需要開闢緩衝區。
>     - 網絡阻塞場景下，單次發送僅完成 `1M`，剩餘 `19M` 數據會觸發緩衝區首次開闢。**首次開闢緩衝區時，不校驗數據量是否超過 `socket_buffer_size`**。這 `19M` 數據會直接存入緩衝區。後續若再發送 `2M` 數據，因緩衝區已非空，底層會先檢查緩衝區中積壓的數據總量是否已超出 `socket_buffer_size` 閾值。若當前緩衝區待發數據量超過 `socket_buffer_size`，則會報錯。否則會將這 `2M` 數據存放在緩衝區。

## send_yield

開啓協程後，若服務端向客戶端發送的數據填滿了發送數據的緩衝區，不會立即拋出錯誤，而是主動讓出當前協程的 CPU，等待緩衝區中的數據發送完畢後，再切回當前協程繼續發送。默認值：`true`。

**示例**

```php
<?php
$server->set([
  'send_yield' => true,
  'enable_coroutine' => true,
]);
```

> [!WARNING]
> **注意**
>
> - 如果該配置被關閉，一旦發送的數據量大於 `socket_buffer_size`，底層會立馬拋出 `connection#1 output buffer overflow` 的錯誤。

## send_timeout

設置發送超時，需與 `send_yield` 配合使用。若在指定時間內協程未能切回，且數據未能寫入發送緩衝區，底層操作將返回 `false`，同時將錯誤碼設爲 `ETIMEDOUT`。此時，可通過 `getLastError()` 方法獲取該錯誤碼。單位爲秒。

**示例**

```php
<?php
$server->set([
  'send_yield' => true,
  'send_timeout' => 1.5,
  'enable_coroutine' => true,
]);
```

## socket_dns_timeout

控制域名解析超時時間，單位爲秒。

**示例**

```php
<?php
$server->set([
  'socket_dns_timeout' => 10
]);
```

## socket_connect_timeout

控制 TCP 連接建立階段的超時時間。它指的是客戶端從發起 connect() 系統調用開始，到成功與服務器建立 TCP 三次握手連接爲止的最大等待時間。單位爲秒。

**示例**

```php
<?php
$server->set([
  'socket_connect_timeout' => 10
]);
```

## socket_write_timeout / socket_send_timeout

控制客戶端向服務器發送數據的最大允許時間。單位爲秒。

**示例**

```php
<?php
$server->set([
  'socket_write_timeout' => 10
]);
```

## socket_read_timeout / socket_recv_timeout

控制的是客戶端等待接收數據的最大允許時間。它監控的是從發送完請求後，到完全接收完響應數據之間的整個過程。單位爲秒。

**示例**

```php
<?php
$server->set([
  'socket_read_timeout' => 10
]);
```

## open_tcp_nodelay

關閉 `Nagle` 算法，讓小數據包能立刻被髮送出去，而不是等待合併。默認值：`false`。

**示例**

```php
<?php
$server->set([
  'open_tcp_nodelay' => false
]);
```

## open_tcp_keepalive

開啓 TCP 的 KeepAlive 機制，讓操作系統內核自動檢測連接是否仍然有效，並自動清理已失效的連接。默認值：`false`。

**示例**

```php
<?php
$server->set([
  'open_tcp_keepalive' => false
]);
```

> [!WARNING]
> **注意**
>
> - 需要配合 `tcp_keepidle`，`tcp_keepinterval` 和 `tcp_keepcount` 一起使用，

## tcp_keepidle

TCP 連接在空閒多長時間後，系統內核纔開始發送第一個 `KeepAlive` 探測包，檢測這個連接是否還活着。單位爲秒。

**示例**

```php
<?php
$server->set([
  'tcp_keepidle' => 5
]);
```

## tcp_keepinterval

TCP KeepAlive 探測包的發送間隔。它決定了在第一次探測沒有收到響應後，每隔多久重新發送一次探測包。單位爲秒。

**示例**

```php
<?php
$server->set([
  'tcp_keepinterval' => 5
]);
```

## tcp_keepcount

TCP KeepAlive 探測失敗後，關閉連接前的最大重試次數。它決定了在收到探測包的響應之前，系統願意嘗試多少次。

**示例**

```php
<?php
$server->set([
  'tcp_keepcount' => 100
]);
```

## tcp_defer_accept

- `tcp_defer_accept` 參數用於控制服務器在新建 TCP 連接時，是否延遲分配套接字和應用層資源。默認值爲 `0`，表示採用標準行爲：三次握手完成後，服務器立即分配資源並喚醒應用程序處理。
- 標準行爲存在一個效率問題：若客戶端建立連接後長時間不發送數據，服務器仍需維持該連接、佔用資源，這就是“全連接攻擊”的典型場景。
- 當設置了 `tcp_defer_accept`（單位：秒）後，服務器僅在收到客戶端實際數據時纔會分配完整資源。如果超過該時間仍未收到任何數據，連接將被主動丟棄，從而避免資源空耗。

**示例**

```php
<?php
$server->set([
  'tcp_defer_accept' => 5
]);
```

## tcp_user_timeout

- 當發送方發送數據後，如果遲遲收不到對方的 `ACK` 確認，TCP 會按指數退避算法重傳數據。
- 累計重傳時間一旦超過 `tcp_user_timeout` 的值，連接會被關閉。默認值爲：0。單位爲毫秒。

**示例**

```php
<?php
$server->set([
  'tcp_user_timeout' => 5000 // 5秒
]);
```

> [!TIP]
> Swoole 版本 >= `v4.5.3-alpha` 可用。

## tcp_fastopen

- 開啓 TCP 快速握手特性，它允許在三次握手過程中就攜帶應用數據，從而減少一個 RTT（往返時間）的延遲。默認值爲：`false`。


**示例**

```php
<?php
$server->set([
  'tcp_fastopen' => true
]);
```

## task_ipc_mode

- 設置 [worker 進程](/zh-hant/server/process_thread.html#worker) 和 [task 進程](/zh-hant/server/process_thread.html#task) 之間的通信方式，默認值爲：`SWOOLE_IPC_UNSOCK`。


**示例**

```php
<?php
$server->set([
  'task_ipc_mode' => SWOOLE_IPC_UNSOCK,
]);
```

- 支持的通信方式有：

| 模式                    | 說明                                                                                                                                         |
|:---|:---|
| SWOOLE_IPC_UNSOCK     | 使用 Unix Socket 通信，支持定向投遞。可在 `task` / `taskwait` 方法中通過 `dst_worker_id` 指定目標 Task 進程。<br>若 `dst_worker_id` 設爲 `-1`，底層會自動選擇當前空閒的 Task 進程進行投遞。 |
| SWOOLE_IPC_MSGQUEUE   | 使用 sysvmsg 消息隊列通信，支持定向投遞（可通過 `$task_worker_id` 指定目標進程）。                                                                                    |
| SWOOLE_IPC_PREEMPTIVE | 使用 sysvmsg 消息隊列通信，**爭搶模式**。不支持定向投遞，所有 task 進程爭搶隊列中的任務。即使指定 `$task_worker_id` 也無效。                                                          |

> [!WARNING]
> **注意**
>
> - `SWOOLE_IPC_MSGQUEUE` 和 `SWOOLE_IPC_PREEMPTIVE` 消息隊列模式使用操作系統提供的內存隊列存儲數據。
> - 如果沒有指定 [message_queue_key](/zh-hant/server/setting.html#message-queue-key) 將使用私有隊列，服務器停止後隊列會被自動刪除。否則使用持久化隊列，服務器停止後隊列數據不會被刪除，重啓後仍可讀取。
> - 手動刪除隊列數據：可使用命令 `ipcrm -q <消息隊列 ID>`。
> - `SWOOLE_IPC_PREEMPTIVE` 會影響 [Swoole\Server->sendMessage()](/zh-hant/server/methods.html#sendmessage)，`worker` 進程發送的消息將被隨機投遞到某一個 `task` 進程。
> - 指定 `SWOOLE_IPC_MSGQUEUE` 和 `SWOOLE_IPC_PREEMPTIVE` 配置項，`task` 進程不支持協程，既不能開啓 [task_enable_coroutine](/zh-hant/server/setting.html#task-enable-coroutine)。
> - 若 `task進程` 處理能力低於任務投遞速度，`worker進程` 可能會發生阻塞。

## message_queue_key

- 指定消息隊列名。


**示例**

```php
<?php
$server->set([
  'message_queue_key' => 'swoole',
]);
```

> [!TIP]
> [task_ipc_mode](/zh-hant/server/setting.html#task-ipc-mode) 爲 `SWOOLE_IPC_MSGQUEUE` 或者 `SWOOLE_IPC_PREEMPTIVE` 才生效。

## task_tmpdir

- 設置 [worker 進程](/zh-hant/server/process_thread.html#worker) 發送給 [task 進程](/zh-hant/server/process_thread.html#task) 的數據的存儲路徑。

- 如果投遞的數據超過 `8180` 字節，將啓用臨時文件來保存數據。這裏的 `task_tmpdir` 就是用來設置臨時文件保存的位置。


**示例**

```php
<?php
$server->set([
  'task_tmpdir' => '/tmp'
]);
```

> [!WARNING]
> **注意**
>
> - 底層默認會使用 `/tmp` 目錄存儲 `task` 數據，如果你的 `Linux` 內核版本過低，`/tmp` 目錄不是內存文件系統，可以設置爲 `/dev/shm/`。
> - `task_tmpdir` 目錄不存在，底層會嘗試自動創建，如果創建失敗會導致服務器啓動失敗。

## backlog

- 控制 TCP 全連接隊列（Accept Queue）的最大長度。


**示例**

```php
<?php
$server->set([
  'backlog' => 4096
]);
```

> [!NOTE]
> **注意**
>
> - `TCP` 有三次握手的過程，客戶端 `syn=>服務端` `syn+ack=>客戶端` `ack`，當服務器收到客戶端的 `ack` 後會將連接放到一個叫做 `accept queue` 的隊列裏面（注1）。
> - 隊列的大小由 `backlog` 參數和配置 `somaxconn` 的最小值決定，可以通過 `ss -lt` 命令查看最終的 `accept queue` 隊列大小，`Swoole` 的主進程調用 `accept`（注2）從 `accept queue` 裏面取走。
> - 當 `accept queue` 滿了之後連接有可能成功（注4），也有可能失敗，失敗後客戶端的表現就是連接被重置（注3）或者連接超時，而服務端會記錄失敗的記錄，可以通過 `netstat -s|grep 'times the listen queue of a socket overflowed` 來查看日誌。如果出現了上述現象，你就應該調大該值了。幸運的是 `Swoole` 的 [SWOOLE_PROCESS](/zh-hant/server/process_thread.html#swoole-process) 模式與 `PHP-FPM/Apache` 等軟件不同，並不依賴 `backlog` 來解決連接排隊的問題。所以基本不會遇到上述現象。
> - 注1: `linux2.2` 之後握手過程分爲 `syn queue` 和 `accept queue` 兩個隊列, `syn queue` 長度由 `tcp_max_syn_backlog` 決定。
> - 注2: 高版本內核調用的是 `accept4`，爲了節省一次 `set no block` 系統調用。
> - 注3: 客戶端收到 `syn+ack` 包就認爲連接成功了，實際上服務端還處於半連接狀態，有可能發送 `rst` 包給客戶端，客戶端的表現就是 `Connection reset by peer`。
> - 注4: 成功是通過 TCP 的重傳機制，相關的配置有 `tcp_synack_retries` 和 `tcp_abort_on_overflow`。

## buffer_low_watermark

- 設置服務端和客戶端的緩衝區的低水位線。它本身不直接限制內存大小，而是作爲一個預警閾值。單位爲字節。默認值爲：0。

- 底層爲每個 `TCP` 連接維護了一個發送緩衝區，當向客戶端發送數據時，數據會先進入發送緩存區。`buffer_low_watermark`
  就是監控這個緩存區大小的“警報器”。


**示例**

```php
<?php
$server->set([
  'buffer_low_watermark' => 1 * 1024 * 1024
]);
```

> [!NOTE]
> **注意**
>
> - 當緩存區中的數據量小於 `buffer_low_watermark` 設置的值時，會觸發 `bufferEmpty` 事件。可以在事件回調中繼續向該連接發送新數據。

## buffer_high_watermark

- 設置服務端和客戶端的緩衝區的高水位線。它本身不直接限制內存大小，而是作爲一個預警閾值。單位爲字節。默認值爲：`0`。

- 底層爲每個 `TCP` 連接維護了一個發送緩衝區，當向客戶端發送數據時，數據會先進入發送緩存區。`buffer_high_watermark`
  就是監控這個緩存區大小的“警報器”。


**示例**

```php
<?php
$server->set([
  'buffer_high_watermark' => 8 * 1024 * 1024
]);
```

> [!NOTE]
> **注意**
>
> - 當緩存區中的數據量超過 `buffer_high_watermark` 設置的值時，會觸發 `bufferFull` 事件。可以在事件回調中暫停向該連接發送新數據，防止緩存區無限膨脹。

## open_cpu_affinity

- 啓動 `CPU` 親和性設置，默認值爲：`false`。


**示例**

```php
<?php
$server->set([
  'open_cpu_affinity' => true
]);
```

> [!NOTE]
> **注意**
>
> - 底層會根據 `reactor` 線程序號和 `worker` 進程序號和 `CPU` 核數取模來設置 `CPU` 綁定。
> - 在多核的硬件平臺中，啓用此特性會將 `Swoole` 的 [reactor 線程](/zh-hant/server/process_thread.html#master) / [worker 進程](/zh-hant/server/process_thread.html#worker) 綁定到固定的一個核上。可以避免進程 / 線程的運行時在多個核之間互相切換，提高 `CPU Cache` 的命中率。
> - 弊端是有可能進程 / 線程綁定的某個 `CPU核心` 非常繁忙，但是其它 `CPU核心` 卻很空閒，導致 CPU 利用率低。

## cpu_affinity_ignore

- 將指定的 `CPU` 核心從 `CPU` 親和性綁定中排除。


**示例**

```php
<?php
$server->set([
  'cpu_affinity_ignore' => [0, 1]   // CPU0,CPU1不會參與親和性綁定。
]);
```

> [!NOTE]
> **注意**
>
> - `IO` 密集型程序中，所有網絡中斷都是用 `CPU0` 來處理，如果網絡 IO 很重，`CPU0` 除了收包還要執行業務邏輯，導致負載過高會導致網絡中斷無法及時處理，那網絡收發包的能力就會下降。
> - 爲了避免上面的情況，此時利用 `cpu_affinity_ignore` 將 `CPU0` 排除就很有必要。讓 `CPU0` 專心負責網絡收包。
> - 如果內核與網卡有多隊列特性，網絡中斷會分佈到多核，可以緩解網絡中斷的壓力。此時可以不用設置 `cpu_affinity_ignore`。


**如何查看網絡中斷在哪個 CPU 執行**

```shell
cat /proc/interrupts
```

- 會輸出下面的結果

```shell
           CPU0       CPU1       CPU2       CPU3       
  0: 1383283707          0          0          0    IO-APIC-edge  timer
  1:          3          0          0          0    IO-APIC-edge  i8042
  3:         11          0          0          0    IO-APIC-edge  serial
  8:          1          0          0          0    IO-APIC-edge  rtc
  9:          0          0          0          0   IO-APIC-level  acpi
 12:          4          0          0          0    IO-APIC-edge  i8042
 14:         25          0          0          0    IO-APIC-edge  ide0
 82:         85          0          0          0   IO-APIC-level  uhci_hcd:usb5
 90:         96          0          0          0   IO-APIC-level  uhci_hcd:usb6
114:    1067499          0          0          0       PCI-MSI-X  cciss0
130:   96508322          0          0          0         PCI-MSI  eth0
138:     384295          0          0          0         PCI-MSI  eth1
169:          0          0          0          0   IO-APIC-level  ehci_hcd:usb1, uhci_hcd:usb2
177:          0          0          0          0   IO-APIC-level  uhci_hcd:usb3
185:          0          0          0          0   IO-APIC-level  uhci_hcd:usb4
NMI:      11370       6399       6845       6300 
LOC: 1383174675 1383278112 1383174810 1383277705 
ERR:          0
MIS:          0
```

- eth0/eth1 就是網絡中斷的次數，如果 `CPU0` - `CPU3` 是平均分佈的，證明網卡有多隊列特性。如果全部集中於某一個核，說明網絡中斷全部由此 `CPU` 進行處理。
- 一旦此 `CPU` 超過 100%，系統將無法處理網絡請求。這時就需要使用 `cpu_affinity_ignore` 設置將此 `CPU` 空出，專門用於處理網絡中斷。

> [!TIP]
> 此選項必須與 [open_cpu_affinity](/zh-hant/server/setting.html#open-cpu-affinity) 同時設置纔會生效。

## chroot

- 重定向 [worker 進程](/zh-hant/server/process_thread.html#worker) 的文件系統根目錄。

- 此設置可以使進程對文件系統的讀寫與實際的操作系統文件系統隔離。提升安全性。


**示例**

```php
<?php
$server->set([
  'chroot' => '/data/server/'
]);
```

## user

- 設置 [worker 進程](/zh-hant/server/process_thread.html#worker) 和 [task 進程](/zh-hant/server/process_thread.html#task) 所有者。

- 服務器如果需要監聽 `1024` 以下的端口，必須有 `root` 權限。但程序運行在 `root` 用戶下，代碼中一旦有漏洞，攻擊者就可以以 `root` 的方式執行遠程指令，風險很大。

- 配置了 `user` 項之後，可以讓 [master 進程](/zh-hant/server/process_thread.html#master) 或者 [manager 進程](/zh-hant/server/process_thread.html#manager) 運行在 `root` 權限下，子進程運行在普通用戶權限下。


**示例**

```php
<?php
$server->set([
  'user' => 'www-data'
]);
```

> [!TIP]
> 只有用 `root` 啓動程序才能修改進程所屬用戶，普通用戶沒有這個權限。

> [!TIP]
> `Swoole版本 < 6.2.0` 時，使用 `user` 配置項將工作進程設置爲普通用戶後，將無法在 `worker` 進程調用 [Swoole\Server->shutdown()](/zh-hant/server/methods.html#shutdown) 或者 [Swoole\Server->reload()](/zh-hant/server/methods.html#reload) 方法關閉或重啓服務。只能使用 `root` 賬戶在 `shell` 終端執行 `kill` 命令。

## group

- 設置 [worker 進程](/zh-hant/server/process_thread.html#worker) 和 [task 進程](/zh-hant/server/process_thread.html#task) 所屬組。

- 與 [user](/zh-hant/server/setting.html#user) 配置相同，此配置是修改進程所屬用戶組，提升服務器程序的安全性。


**示例**

```php
<?php
$server->set([
  'group' => 'www-data'
]);
```

> [!TIP]
> 只有用 `root` 啓動程序才能修改進程所屬組，普通用戶沒有這個權限。

## pid_file

- 設置保存 `pid`（進程 id）的文件名。


**示例**

```php
<?php
$server->set([
  'pid_file' => '/tmp/swoole.pid'
]);
```

> [!TIP]
> 使用時需要注意如果服務非正常結束，`PID` 文件不會刪除。

## print_backtrace_on_error

- 如果事件循環相關操作發生錯誤，是否打印出堆棧信息，默認值爲：`false`。


**示例**

```php
<?php
$server->set([
  'print_backtrace_on_error' => true
]);
```

## c_stack_size / stack_size

- 設置單個協程初始 C 棧的內存尺寸，默認爲 2M。


**示例**

```php
<?php
$server->set([
  'c_stack_size' => 4 * 1024 * 1024
]);
```

> [!NOTE]
> **注意**
>
> - 該值通常無需調整，默認設置即可滿足絕大多數場景需求。

## event_object

- 該設置項用於控制事件回調機制將切換爲 [面向對象模式](/zh-hant/server/events.html#面向對象風格)。默認值爲：`false`。


**示例**

```php
<?php
$server->set([
    'event_object' => true,
]);
```

> [!NOTE]
> **注意**
>
> - 和 [task_use_object / task_object](/zh-hant/server/setting.html#task-use-object-task-object) 不同，`event_object` 的作用範圍更廣，控制粒度較粗。影響多個事件類型。
> - 受此設置影響的參數對象類共 5 個：[Swoole\Server\Event](/zh-hant/server/class/event.html)、[Swoole\Server\Packet](/zh-hant/server/class/packet.html)、[Swoole\Server\PipeMessage](/zh-hant/server/class/pipe_message.html)、[Swoole\Server\StatusInfo](/zh-hant/server/class/status_info.html)、[Swoole\Server\TaskResult](/zh-hant/server/class/task_result.html)，事件與類的對應關係見 [面向對象風格](/zh-hant/server/events.html#面向對象風格)。

> [!TIP]
> Swoole 版本 >= `v4.6.0` 可用

## debug_mode

- 設置日誌模式爲 `debug` 調試模式。


**示例**

```php
<?php
$server->set([
  'debug_mode' => true
]);
```

> [!NOTE]
> **注意**
>
> - 使用該配置需要編譯 `Swoole` 的時候需要開啓 [--enable-debug](/zh-hant/start/install.html#編譯選項詳解)。

## trace_flags

- 用於精確控制跟蹤日誌的輸出範圍。

- 底層支持以下跟蹤項，可使用 `SWOOLE_TRACE_ALL` 表示跟蹤所有項目：

| 標籤                             | 說明                |
|:---|:---|
| `SWOOLE_TRACE_SERVER`          | 服務器事件             |
| `SWOOLE_TRACE_CLIENT`          | 客戶端操作             |
| `SWOOLE_TRACE_BUFFER`          | 緩衝區操作             |
| `SWOOLE_TRACE_CONN`            | 連接管理              |
| `SWOOLE_TRACE_EVENT`           | 事件循環              |
| `SWOOLE_TRACE_WORKER`          | Worker 進程         |
| `SWOOLE_TRACE_MEMORY`          | 內存分配與釋放           |
| `SWOOLE_TRACE_REACTOR`         | Reactor 線程        |
| `SWOOLE_TRACE_PHP`             | PHP 層調用           |
| `SWOOLE_TRACE_HTTP`            | HTTP 協議           |
| `SWOOLE_TRACE_HTTP2`           | HTTP2 協議          |
| `SWOOLE_TRACE_EOF_PROTOCOL`    | EOF 協議            |
| `SWOOLE_TRACE_LENGTH_PROTOCOL` | 長度協議              |
| `SWOOLE_TRACE_CLOSE`           | 連接關閉              |
| `SWOOLE_TRACE_WEBSOCKET`       | WebSocket 協議      |
| `SWOOLE_TRACE_REDIS_CLIENT`    | Redis 客戶端         |
| `SWOOLE_TRACE_MYSQL_CLIENT`    | MySQL 客戶端         |
| `SWOOLE_TRACE_HTTP_CLIENT`     | HTTP 客戶端          |
| `SWOOLE_TRACE_AIO`             | 異步文件 I/O          |
| `SWOOLE_TRACE_SSL`             | SSL/TLS 加密        |
| `SWOOLE_TRACE_NORMAL`          | 普通日誌              |
| `SWOOLE_TRACE_CHANNEL`         | Channel 通道        |
| `SWOOLE_TRACE_TIMER`           | 定時器               |
| `SWOOLE_TRACE_SOCKET`          | Socket 操作         |
| `SWOOLE_TRACE_COROUTINE`       | 協程調度              |
| `SWOOLE_TRACE_CONTEXT`         | 協程上下文             |
| `SWOOLE_TRACE_CO_HTTP_SERVER`  | 協程 HTTP 服務器       |
| `SWOOLE_TRACE_TABLE`           | 內存表操作             |
| `SWOOLE_TRACE_CO_CURL`         | 協程 CURL           |
| `SWOOLE_TRACE_CARES`           | c-ares DNS 解析     |
| `SWOOLE_TRACE_ZLIB`            | 壓縮/解壓             |
| `SWOOLE_TRACE_CO_PGSQL`        | 協程 PostgreSQL 客戶端 |
| `SWOOLE_TRACE_CO_ODBC`         | 協程 ODBC 客戶端       |
| `SWOOLE_TRACE_CO_ORACLE`       | 協程 Oracle 客戶端     |
| `SWOOLE_TRACE_CO_SQLITE`       | 協程 SQLite 客戶端     |
| `SWOOLE_TRACE_CO_FIREBIRD`     | 協程 Firebird 客戶端   |
| `SWOOLE_TRACE_CO_SSH2`         | 協程 SSH2 客戶端       |
| `SWOOLE_TRACE_THREAD`          | 線程操作              |
| `SWOOLE_TRACE_ALL`             | 啓用所有跟蹤項           |

> [!NOTE]
> **注意**
>
> - 多個標籤可用 `|` 組合：`SWOOLE_TRACE_SERVER | SWOOLE_TRACE_HTTP2`
> - 該配置需要在編譯 `Swoole` 的時候開啓 [--enable-trace-log](/zh-hant/start/install.html#編譯選項詳解)。
