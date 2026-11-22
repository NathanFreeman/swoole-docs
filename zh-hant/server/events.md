# 事件回調

- [TCP/UDP 服務器](/zh-hant/server/tcp_udp.html)、[HTTP/HTTPS/HTTP2 服務器](/zh-hant/server/http.html) 和 [WebSocket 服務器](/zh-hant/server/websocket.html) 的示例裏，都有這樣一段結構相似的代碼：

```php
<?php
$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});
```

- 這種用 [Swoole\Server->on()](/zh-hant/server/methods.html#on) 註冊的函數就是**事件回調**。客戶端發來數據、連接建立或關閉、進程啓動或退出時服務器該做什麼，都由它決定，是整個異步服務器模型的核心。

- 以上面的代碼爲例：**客戶端一發來數據，服務器就觸發 `receive` 事件，執行綁定的函數，向客戶端回覆一句 Hello World**。

- 本節逐一介紹 Swoole 異步服務器支持的全部事件。

## start

- 服務器啓動後，在 [master 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象實例 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('start', function(Server $server) {
  echo "master process start";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

**此事件觸發前，Server 已完成**

- 已創建 [manager 進程](/zh-hant/server/process_thread.html#進程-線程)
- 已創建 [worker 進程](/zh-hant/server/process_thread.html#進程-線程)
- 已監聽所有 TCP/UDP/`Unix Socket` 端口，但還沒開始 accept 連接和請求
- 定時器已就緒

**接下來將執行**

- [reactor 線程](/zh-hant/server/process_thread.html#進程-線程) 開始接收事件，客戶端即可連接

**使用說明**

- `start` 中只適合做 `echo`、打印日誌、修改進程名這類簡單操作，**不要調用 `Swoole\Server` 的方法**，因爲此時服務還沒完全就緒。`start` 和 `workerStart` 在不同進程中並行執行，沒有先後順序。
- 建議在 `start` 中把 `Swoole\Server->master_pid` 和 `Swoole\Server->manager_pid` 寫入文件，管理腳本就能向這兩個 PID 發信號來關閉或重啓服務。

> [!WARNING]
> - `start` 中創建的全局對象不能在 worker 進程裏使用：`start` 執行時 worker 進程已經創建好了，新對象只存在於 master 進程的內存中，worker 進程訪問不到。
> - [SWOOLE_BASE](/zh-hant/server/process_thread.html#工作模式) 模式沒有 master 進程，也就沒有 `start` 事件，**不要在 BASE 模式下注冊 `start`**。
> - `start` 中可以使用異步和協程 API，但可能與 `dispatch_func`、`package_length_func` 衝突，**不要同時使用**。
> - 不要在 `start` 中啓動定時器，否則調用 `Swoole\Server::shutdown()` 後程序無法正常退出。

> [!NOTE]
> - `start` 返回前服務端不會接受任何客戶端連接，所以可以放心使用同步阻塞函數。

```php
<?php
use Swoole\Server;
use Swoole\Timer;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('start', function(Server $server) {
  // 禁止在這裏操作定時器，否則主進程永遠無法退出
  Timer::add(1000, function() {});
  echo "master process start";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `start` 事件。

## connect

- 有新連接進入時，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\Server $server, int $fd, int $reactorId) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$fd` | 連接的文件描述符 | 必填 |
| `$reactorId` | `SWOOLE_PROCESS` 模式下是 `TCP` 連接所在的 [reactor 線程](/zh-hant/server/process_thread.html#進程-線程) 序號，其他模式下是 `worker` 進程序號 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('connect', function(Server $server, int $fd, int $reactorId) {
  echo 'new connection coming' . PHP_EOL;
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> `HTTP` 服務器和 `WebSocket` 服務器不會觸發 `connect` 回調。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `connect` 事件。

## beforeShutdown

- 進程正常退出前觸發。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象實例 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('beforeShutdown', function(Server $server) {
    echo "Server is about to shutdown\n";
    // 在此可執行資源清理、狀態保存等操作
    // 支持協程 API
});
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

- 通過信號終止服務時，各進程觸發 `beforeShutdown` 的情況：

| 進程類型 | 是否觸發 `beforeShutdown` |
|:---|:---|
| **master 進程** | ✅ 觸發 |
| **worker 進程** | ✅ 觸發 |
| **task 進程** | ✅ 觸發 |
| **manager 進程** | ✅ SWOOLE_BASE 模式下觸發 |
| **user 進程** | ❌ 不觸發 |

> [!NOTE]
> - 此事件中支持協程，可以安全使用協程 API。

> [!WARNING]
> - 只在進程**正常退出**時觸發，`kill -9`、`Ctrl+C` 這類強制終止不會觸發。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `beforeShutdown` 事件。


## shutdown

- 服務正常退出時觸發。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象實例 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('shutdown', function(Server $server) {
    echo "Server is shutdown\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```


**觸發時機**

- 通過信號終止服務時，各進程觸發 `shutdown` 的情況：

| 進程類型 | 是否觸發 `shutdown` |
|:---|:---|
| **master 進程** | ✅ 觸發 |
| **worker 進程** | ❌ 不觸發 |
| **task 進程** | ❌ 不觸發 |
| **manager 進程** | ✅ SWOOLE_BASE 模式下觸發 |
| **user 進程** | ❌ 不觸發 |

> [!WARNING]
> - 強制終止進程（如 `kill -9`）不會觸發 `shutdown`。
> - 命令行下按 `Ctrl+C` 會立即停止程序，同樣不觸發 `shutdown`。
> - 不要在 `shutdown` 中調用異步或協程 API，此時底層已銷燬所有事件循環設施。

> [!NOTE]
> - 此時所有進程和線程都已終止，監聽端口也已關閉。
> - 要讓程序走正常退出流程，需用 `kill -15` 向 master 進程發送 `SIGTERM` 信號。
> - 此時已沒有協程環境，若確實要用協程 API，必須手動調用 `Co\run` 創建[協程容器](/zh-hant/coroutine/container.html)。

> [!TIP]
> 即使 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層也不會創建協程來執行 `shutdown` 事件，此時協程環境已被銷燬。

## workerStart

- [worker 進程](/zh-hant/server/process_thread.html#進程-線程) / [task 進程](/zh-hant/server/process_thread.html#進程-線程) 啓動時觸發，在這裏創建的對象可以在整個進程生命週期內使用。

```php
function (Swoole\Server $server, int $workerId) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$workerId` | 進程序號，非系統 PID | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerStart', function (Server $server, int $workerId) {
    echo "worker 啓動，ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

**代碼熱重載支持**

- 想借進程重啓實現代碼熱重載，**就把代碼文件放在 `workerStart` 中引入**，這樣每次重啓都會加載新代碼。
- worker/task 進程被**重新創建**時（`reload` 或意外退出後重啓），由 **manager 進程** 負責 fork 出新的子進程。
- 在 **`workerStart` 之前**引入的文件（如公共庫），在 **manager 進程啓動時**就已加載進內存；manager 本身不重啓，這些文件也就不會重新加載。代價是不能熱更新，好處是所有 worker 共享同一份內存，不必每個進程各存一份，公用且不易變的 `php` 文件適合放在這裏。
- 在 **`workerStart` 中**引入的文件（如業務代碼），每個 worker 進程啓動時都會重新加載，因此能熱更新，但每個進程都要在內存中各存一份。

```
Manager 進程啓動
    ├── 加載公共庫（如框架核心、配置等）
    │
    ├── fork worker 進程 0
    │       └── 執行 workerStart  → 加載業務代碼
    │
    ├── fork worker 進程 1
    │       └── 執行 workerStart  → 加載業務代碼
    │
    └── reload 時
            ├── Manager 進程（公共庫仍在內存中，不重新加載）
            └── 重新 fork 新 worker 進程
                    └── 再次執行 workerStart  → 重新加載業務代碼（實現熱更新）
```

```php
<?php
require __DIR__ . '/公共庫.php'; // 所有 worker 進程都能讀到這份文件，但進程重啓不會重新加載它。
$server->on('workerStart', function ($server, $workerId) {
    require __DIR__ . '/進程A專屬文件.php'; // 這份文件只有進程 A 能讀到，進程 B 讀不到
});
```

**協程支持**

`workerStart` 中**會自動創建協程環境**，可以直接使用協程 API：

```php
<?php
$server->on('workerStart', function ($server, $workerId) {
    file_put_contents('data.txt', 'hello world');
});
```

> [!NOTE]
> - `workerStart` 與 `start` **併發執行**，沒有先後順序。
> - 當 [worker_num](/zh-hant/server/setting.html#worker-num) 或 [task_worker_num](/zh-hant/server/setting.html#task-worker-num) 大於 1 時，**每個進程都會觸發一次** `workerStart`。
> - `$workerId` 是進程序號，不是系統 PID，實際 PID 要用 `posix_getpid()` 獲取。
> - 可通過 [taskworker](/zh-hant/server/properties.html#taskworker) 判斷當前是 `worker` 進程還是 `task` 進程。
> - [user 進程](/zh-hant/server/process_thread.html#進程-線程) 不會觸發 `workerStart`。

> [!WARNING]
> - `workerStart` 中發生**致命錯誤**或主動調用 `exit`，當前 worker/task 進程會退出，manager 進程隨即重建一個新進程。頻繁發生就會**不斷創建與銷燬進程**，影響服務穩定性。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `workerStart` 事件。

## workerExit

- 只有開啓 [reload_async](/zh-hant/server/setting.html#reload-async) 纔會觸發 `workerExit`，觸發時機是進程退出前。參見 **如何正確的重啓服務**

```php
function (Swoole\Server $server, int $workerId) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$workerId` | 進程序號，非系統 PID | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
  'reload_async' => true,  // 開啓這個纔會觸發workerExit
  'max_wait_time' => 10
]);
$server->on('workerExit', function (Server $server, int $workerId) {
    echo "worker 停止，ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!NOTE]
> - `workerExit` 在 `worker` 進程內觸發；[task 進程](/zh-hant/server/process_thread.html#進程-線程) 中若存在事件循環，也會觸發。
> - 在 `workerExit` 中儘量移除或關閉異步 `Socket` 連接，底層檢測到事件循環中的監聽句柄數爲 `0` 時才退出進程。
> - 如果進程本來就沒有監聽任何事件句柄，退出時不會觸發此事件。
> - `worker` 進程退出後，纔會觸發 `workerStop`。

> [!WARNING]
> - 只要 `worker` 進程還沒退出，`workerExit` 就會持續觸發。
> - 超過 `max_wait_time` 秒仍未退出，進程會被強制殺死，並提示 `worker exit timeout, forced termination`。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `workerExit` 事件。

## workerStop

- `worker` 進程終止時觸發，可以在這裏回收該進程申請的各類資源。

```php
function (Swoole\Server $server, int $workerId) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$workerId` | 進程序號，非系統 PID | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerStop', function (Server $server, int $workerId) {
    echo "worker 停止，ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!WARNING]
> - 進程異常結束（被強制 `kill`、致命錯誤、`core dump`）時不會觸發 `workerStop`。
> - 不要在 `workerStop` 中調用異步或協程 API，此時底層已銷燬所有事件循環設施。

> [!TIP]
> 底層不會創建協程來執行 `workerStop` 事件。

## workerError

- 此事件在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 異常退出時觸發。

```php
function (Swoole\Server $server, int $workerId, int $pid, int $exitCode, int $signal) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$workerId` | 進程序號，非系統 PID | 必填 |
| `$pid` | 進程 PID | 必填 |
| `$exitCode` | 進程退出狀態碼，0~255 | 必填 |
| `$signal` | 進程退出的信號 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerError', function (Server $server, int $workerId, int $pid, int $exitCode, int $signal) {
    echo "worker 異常退出，ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> - 此事件主要用於報警和監控：worker 進程異常退出，多半是遇到了致命錯誤或 core dump，應記錄日誌或發出報警，提示開發者處理。

> [!WARNING]
> - `$signal = 11`：`worker` 進程發生段錯誤（`segmentation fault`），可能是底層 BUG，請收集 `core dump` 信息和 `valgrind` 內存檢測日誌，反饋給 Swoole 開發組。
> - `$exitCode = 255`：worker 進程發生致命錯誤（`Fatal Error`），請查 PHP 錯誤日誌定位問題代碼。
> - `$signal = 9`：`worker` 被系統強殺，請檢查是否有人爲的 `kill -9`，以及 `dmesg` 中是否有 `OOM（Out of memory）` 記錄。

> [!TIP]
> - 底層不會創建協程來執行 `workerError` 事件。

## beforeReload

- [worker 進程](/zh-hant/server/process_thread.html#進程-線程) / [task 進程](/zh-hant/server/process_thread.html#進程-線程) 重啓前觸發，在 [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 中執行。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('beforeReload', function (Server $server) {
    echo "worker before reload\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> - 重啓請求不會疊加：上一次重啓還沒完成時，新的重啓請求會被忽略。
> - 向 `master` 進程 / `manager` 進程發送 `SIGUSR1` 信號，會平穩地重啓所有 `worker` 進程和 `task` 進程。
> - 向 `master` 進程 / `manager` 進程發送 `SIGUSR2` 信號，會平穩地重啓所有 `task` 進程。
> - `user` 進程退出時不會觸發此事件。

> [!WARNING]
> - 不要在 `beforeReload` 中用 `while(1) {}` 之類的阻塞代碼，否則進程無法重啓。
> - 超過 `max_wait_time` 仍未重啓完畢，所有 `worker` 進程會被強制殺死。

> [!TIP]
> - 底層不會創建協程來執行 `beforeReload` 事件。

## afterReload

- [worker 進程](/zh-hant/server/process_thread.html#進程-線程) / [task 進程](/zh-hant/server/process_thread.html#進程-線程) 重啓後觸發，在 [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 中執行。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('afterReload', function (Server $server) {
    echo "worker after reload\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!TIP]
> - 底層不會創建協程來執行 `afterReload` 事件。

## task

- [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 向 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 投遞任務時，在 `task` 進程中觸發，用於處理耗時任務，避免阻塞 `worker` 進程。

```php
function (Swoole\Server $server, int $taskId, int $workerId, mixed $data) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$taskId` | 任務的 ID，需與 `$workerId` 組合起來才全局唯一 | 必填 |
| `$workerId` | 投遞任務的 `worker` 進程序號，不同 `worker` 進程投遞的任務 ID 可能相同 | 必填 |
| `$data` | 任務的數據內容 | 必填 |

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set(['task_worker_num' => 2]);
$server->on('request', function(Request $request, Response $response) use ($server) {
  $server->task('Hello Swoole!!!!');
});
$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    echo $data . PHP_EOL;
});

$server->on('finish', function(Server $server, int $taskId, mixed $data) {
  echo $data . PHP_EOL; // task進程通過`Swoole\Server->finish()`返回數據  
});

$server->start();
```

> [!WARNING]
> - 必須設置 `task_worker_num`，否則不會創建 `task` 進程，`worker` 進程也無法投遞任務。
> - 不要在 `task` 事件中調用 [task](/zh-hant/server/methods.html#task)、[taskwait](/zh-hant/server/methods.html#taskwait)、[taskwaitmulti](/zh-hant/server/methods.html#taskwaitmulti)、[taskco](/zh-hant/server/methods.html#taskco)，底層會檢查環境並拋出錯誤。
> - 任務執行中遇到致命錯誤退出，或被外部進程強制 `kill`，當前任務會被丟棄，但不影響其他排隊中的任務。

> [!NOTE]
> - 未指定目標 `task` 進程時，底層用取模方式從所有 `task` 進程中選一個投遞，不管它是否空閒。
> - `task` 進程接到任務後會置爲忙碌，不再接收新任務；全部忙碌時投遞會提示 `No idle task worker is available`，只能等目標進程空閒下來。

> [!TIP]
> - 如果 [task_enable_coroutine](/zh-hant/server/setting.html#task-enable-coroutine) 爲 `true`，底層會創建協程來執行 `task` 事件。

## finish

- [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 投遞的任務在 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 中完成後，task 進程通過 `Swoole\Server->finish()` 或 `return` 把結果發回 worker 進程，此時在 worker 進程中觸發 `finish`。

```php
function (Swoole\Server $server, int $taskId, mixed $data) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$taskId` | 任務的 ID | 必填 |
| `$data` | 任務處理的結果內容 | 必填 |

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set(['task_worker_num' => 2]);
$server->on('request', function(Request $request, Response $response) use ($server) {
  $server->task('Hello Swoole!!!!');
});

$server->on('finish', function(Server $server, int $taskId, mixed $data) {
  echo $data . PHP_EOL; // task進程通過`Swoole\Server->finish()`返回數據  
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) use ($server) {
    echo $data . PHP_EOL;
    $server->finish($data);  // return $data; 也是同樣的效果
});

$server->start();
```


> [!WARNING]
> - 如果在 [task](/zh-hant/server/events.html#task) 事件中**沒有調用** [finish](/zh-hant/server/events.html#finish) 方法，也**沒有**通過 `return` 返回結果，則 worker 進程**不會觸發** `finish` 事件。
> - 如果 [task](/zh-hant/server/events.html#task) 事件返回了結果，但**沒有監聽** `finish` 事件，底層會拋出異常：`require 'onFinish' callback`。

> [!NOTE]
> - 執行 [finish](/zh-hant/server/events.html#finish) 的 worker 進程，就是當初投遞該任務的那個 worker 進程。

> [!TIP]
> - 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `finish` 事件。

## managerStart

- [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 啓動時觸發。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('managerStart', function (Server $server) {
    echo "manager start\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> - 可以在此事件中修改 manager 進程的名稱。
> - `4.2.12` 之前，`manager` 進程不能加定時器、不能投遞異步任務、不能用協程；`4.2.12` 起可以使用基於信號實現的同步模式定時器。
> - `manager` 進程可以調用 [sendMessage](/zh-hant/server/methods.html#sendmessage) 向其他工作進程發送消息。

> [!TIP]
> - 底層不會創建協程來執行 `managerStart` 事件。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('managerStart', function (Server $server) {
    $server->sendMessage('Hello World', 1); // 發送消息給序號爲1的進程
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});


$server->on('pipeMessage', function(Server $server, int $workerId, mixed $message) {
  // 收到manager進程通過Swoole\Server->sendMessage()發送的信息
});

$server->start();
```


## managerStop

- [manager 進程](/zh-hant/server/process_thread.html#進程-線程) 結束時觸發。

```php
function (Swoole\Server $server) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('managerStop', function (Server $server) {
    echo "manager stop\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> - `managerStop` 觸發時，[worker 進程](/zh-hant/server/process_thread.html#進程-線程) 和 [task 進程](/zh-hant/server/process_thread.html#進程-線程) 已全部結束，並已被 `manager` 進程回收。

> [!TIP]
> - 底層不會創建協程來執行 `managerStop` 事件。

## pipeMessage

- [worker 進程](/zh-hant/server/process_thread.html#進程-線程) / [task 進程](/zh-hant/server/process_thread.html#進程-線程) 收到 [sendMessage](/zh-hant/server/methods.html#sendmessage) 發來的 `unixSocket` 消息時觸發，兩類進程都可能觸發。

```php
function (Swoole\Server $server, int $workerId, mixed $message) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$workerId` | 發送方的進程序號 | 必填 |
| `$message` | 消息內容，可以是任意 PHP 類型 | 必填 |

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
  'worker_num' => 2
]);

$server->on('request', function (Request $request, Response $response) use ($server) {
    if ($server->worker_id == 0) {
      $server->sendMessage('Hello World', 1); // 發送消息給序號爲1的進程
    } else {
      $server->sendMessage('Hello World', 0); // 發送消息給序號爲0的進程
    }
    
    $response->end('Hello World');
});

$server->on('pipeMessage', function(Server $server, int $workerId, mixed $message) {
  var_dump($workerId);
  var_dump($message);
});

$server->start();
```

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `pipeMessage` 事件。

## receive

- 收到 `TCP` 數據時，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\Server $server, int $fd, int $reactorId, string $data) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$fd` | 連接的文件描述符 | 必填 |
| `$reactorId` | [SWOOLE_PROCESS 模式](/zh-hant/server/process_thread.html#swoole-process) 下是 `TCP` 連接所在的 [reactor 線程](/zh-hant/server/process_thread.html#進程-線程) 編號，其他模式下是 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 編號 | 必填 |
| `$data` | 收到的數據，可能是文本或二進制 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!IMPORTANT]
> [TCP 服務器](/zh-hant/server/tcp_udp.html) 必須設置 `receive` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `receive` 事件。

## packet

- 收到 `UDP` 數據時，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\Server $server, mixed $data, array $clientInfo) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$data` | 收到的數據，可能是文本或二進制 | 必填 |
| `$clientInfo` | 客戶端信息 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);
$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    echo $data . PHP_EOL;
});

$server->start();
```

**`$clientInfo`**

| 字段 | 說明 |
|:---|:---|
| `server_socket` | 當前連接的 `socket` 文件描述符 |
| `dispatch_time` | 數據接收時間 |
| `server_port` | 服務端監聽端口 |
| `address` | 客戶端 IP |
| `port` | 客戶端端口 |

> [!IMPORTANT]
> [UDP 服務器](/zh-hant/server/tcp_udp.html) 必須設置 `packet` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `packet` 事件。

## request

- 收到 `HTTP` 請求時，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| [Swoole\Http\Request](/zh-hant/server/class/request.html) `$request` | `HTTP` 請求對象，包含 `GET`、`POST`、`COOKIE`、`Header` 等客戶端請求信息。 | 必填 |
| [Swoole\Http\Response](/zh-hant/server/class/response.html) `$response` | `HTTP` 響應對象，調用它的方法發送響應。 | 必填 |

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('request', function (Request $request, Response $response) {
    echo "接收到http請求" . PHP_EOL;
});

$server->start();
```

> [!IMPORTANT]
> [HTTP/HTTPS/HTTP2 服務器](/zh-hant/server/http.html) 必須設置 `request` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `request` 事件。

## beforeHandshakeResponse

- `WebSocket` 握手前觸發。不想自定義握手流程、但又想往響應頭裏加一些 `HTTP header` 時，用這個事件。

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| [Swoole\Http\Request](/zh-hant/server/class/request.html) `$request` | `HTTP` 請求對象，包含客戶端請求信息。 | 必填 |
| [Swoole\Http\Response](/zh-hant/server/class/response.html) `$response` | `HTTP` 響應對象，用它向客戶端發送響應。 | 必填 |

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('beforeHandshakeResponse', function (Request $request, Response $response) {
    var_dump($request);
});

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->start();
```

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `beforeHandshakeResponse` 事件。

## handshake

- 想自己完成 `WebSocket` 握手，就註冊 `handshake` 事件。

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| [Swoole\Http\Request](/zh-hant/server/class/request.html) `$request` | `HTTP` 請求對象，包含客戶端請求信息。 | 必填 |
| [Swoole\Http\Response](/zh-hant/server/class/response.html) `$response` | `HTTP` 響應對象，用它向客戶端發送響應。 | 必填 |

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('handshake', function (Request $request, Response $response) {
    // print_r( $request->header );
    // if (如果不滿足我某些自定義的需求條件，那麼響應空輸出，返回false，握手失敗) {
    //    $response->end();
    //    return false;
    // }

    // websocket握手連接算法驗證
    $secWebSocketKey = $request->header['sec-websocket-key'];
    $patten = '#^[+/0-9A-Za-z]{21}[AQgw]==$#';
    if (0 === preg_match($patten, $secWebSocketKey) || 16 !== strlen(base64_decode($secWebSocketKey))) {
        $response->end();
        return false;
    }
    echo $request->header['sec-websocket-key'];
    $key = base64_encode(
        sha1(
            $request->header['sec-websocket-key'] . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
            true
        )
    );

    $headers = [
        'Upgrade' => 'websocket',
        'Connection' => 'Upgrade',
        'Sec-WebSocket-Accept' => $key,
        'Sec-WebSocket-Version' => '13',
    ];

    // 如果請求頭有Sec-WebSocket-Protocol，響應頭必須設置相同的Sec-WebSocket-Protocol
    if (isset($request->header['sec-websocket-protocol'])) {
        $headers['Sec-WebSocket-Protocol'] = $request->header['sec-websocket-protocol'];
    }

    foreach ($headers as $key => $val) {
        $response->header($key, $val);
    }

    $response->status(101);
    $response->end();
});

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->start();
```

> [!TIP]
> - 只在需要自行處理 `WebSocket` 握手時才註冊此事件；不註冊時 Swoole 會自動完成握手。
> - 註冊 `handshake` 後不會再觸發 `open` 事件。
> - `handshake` 中必須調用 [status](/zh-hant/server/class/response.html#status) 把狀態碼設爲 `101`，再調用 [end](/zh-hant/server/class/response.html#end) 響應，否則握手失敗。
> - 內置的握手協議爲 `Sec-WebSocket-Version: 13`，低版本瀏覽器需要自行實現握手。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `handshake` 事件。

## open

- `WebSocket` 客戶端完成握手後，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\WebSocket\Server $server,  Swoole\Http\Request $request) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` 對象。 | 必填 |
| [Swoole\Http\Request](/zh-hant/server/class/request.html) `$request` | `HTTP` 請求對象。 | 必填 |

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('open', function (Server $server,  Request $request) {
    var_dump($request);
});

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->start();
```

> [!TIP]
> - `WebSocket` 先用 `HTTP` 協議握手，所以 `$request` 裏就是客戶端發來的握手請求信息。
> - `open` 事件中可以調用 [push](/zh-hant/server/methods.html#push) 向客戶端發送數據，或調用 [close](/zh-hant/server/methods.html#close) 關閉連接。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `open` 事件。

## message

- 收到 `WebSocket` 數據時，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\WebSocket\Server $server,  Swoole\WebSocket\Frame $frame) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` 對象。 | 必填 |
| `$frame` | 客戶端發來的 `WebSocket` 幀。 | 必填 |

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->start();
```

> [!IMPORTANT]
> [WebSocket 服務器](/zh-hant/server/websocket.html) 必須設置 `message` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `message` 事件。

## disconnect

- `WebSocket` 連接關閉時觸發。

```php
function (Swoole\WebSocket\Server $server, int $fd) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` 對象。 | 必填 |
| `$fd` | 已關閉連接的文件描述符。 | 必填 |

**示例**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->on('disconnect', function (Server $server, int $fd) {
    echo 'disconnect' . PHP_EOL;
});

$server->start();
```

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `disconnect` 事件。

## close

- `TCP` 連接關閉後，在 [worker 進程](/zh-hant/server/process_thread.html#進程-線程) 中觸發。

```php
function (Swoole\Server $server, int $fd, int $reactorId) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$server` | Swoole\Server 對象 | 必填 |
| `$fd` | 連接的文件描述符 | 必填 |
| `$reactorId` | 連接所在的 `reactor` 線程編號，服務端主動關閉時爲負數。 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->on('close', function(Server $server, int $fd, int $reactorId) {
  echo "connection close" . PHP_EOL;
});

$server->start();
```

> [!TIP]
> - 服務端主動關閉連接時，底層會把 `$reactorId` 設爲 `-1`，因此判斷 `$reactorId < 0` 就能分辨關閉是服務端還是客戶端發起的。
> - 只有在服務端 PHP 代碼中主動調用 [close](/zh-hant/server/methods.html#close) 纔算主動關閉。
> - `close` 中發生致命錯誤會導致連接泄漏，用 `netstat` 能看到大量 `CLOSE_WAIT` 狀態的 TCP 連接。
> - 無論是客戶端斷開還是服務端調用 [close](/zh-hant/server/methods.html#close)，只要連接關閉就一定觸發此事件。
> - `close` 中仍可調用 [getClientInfo](/zh-hant/server/methods.html#getclientinfo) 獲取連接信息，回調執行完畢後底層才真正關閉 `TCP` 連接。
> - 觸發 `close` 時連接已經關閉，不要再在事件中調用 [close](/zh-hant/server/methods.html#close)，否則會拋出 PHP 警告。

> [!TIP]
> 如果 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true`，底層會創建協程來執行 `close` 事件。

## 事件區別

> [!NOTE]
> `receive`、`packet`、`request` 和 `message` 都用於處理客戶端消息，核心區別在於**數據處理層級**：
> - **`receive`**：接收原始的 **TCP 字節流**。底層不做任何解析，協議解碼要自己實現。
> - **`packet`**：接收原始的 **UDP 數據**。底層不做任何解析，協議解碼要自己實現。
> - **`request` / `message`**：接收底層**自動解析後的結構化數據**，可直接在業務邏輯中使用。

> [!NOTE]
> `disconnect` 和 `close` 都與連接關閉有關，但層次不同：
> - **`disconnect`**：對應 **WebSocket 邏輯連接**的斷開（含握手狀態與協議級斷開）。
> - **`close`**：對應底層 **TCP 連接**的關閉，此時操作系統層面的文件描述符被釋放。

> [!NOTE]
> `workerExit` 和 `workerStop` 都在進程退出時觸發，但作用不同：
> - **`workerExit`**：在 `max_wait_time` 內執行**柔性關閉**，主動清理並關閉所有事件句柄監聽。
> - **`workerStop`**：只是**進程停止的通知**，不參與柔性關閉，在 worker 進程完全退出後執行。


## 面向對象風格
把 [event_object](/zh-hant/server/setting.html#event-object) 設爲 `true`，部分事件的回調參數會切換爲**面向對象模式**。

### 核心變化
- **傳統模式**：回調接收多個分散的參數（如 `$fd`、`$reactor_id`、`$data`）。
- **面向對象模式**：回調改爲接收一個**對象實例**，裏面封裝了該事件的全部上下文，屬性訪問更直觀，類型提示更友好。

各事件對應的參數對象如下，點擊類名可查看屬性與方法：

| 事件 | 面向對象模式下的參數對象 |
|:---|:---|
| `connect` / `close` / `receive` | [Swoole\Server\Event](/zh-hant/server/class/event.html) |
| `packet` | [Swoole\Server\Packet](/zh-hant/server/class/packet.html) |
| `pipeMessage` | [Swoole\Server\PipeMessage](/zh-hant/server/class/pipe_message.html) |
| `workerError` | [Swoole\Server\StatusInfo](/zh-hant/server/class/status_info.html) |
| `finish` | [Swoole\Server\TaskResult](/zh-hant/server/class/task_result.html) |
| `task` | [Swoole\Server\Task](/zh-hant/server/class/task.html) |

表中前五行由 [event_object](/zh-hant/server/setting.html#event-object) 控制，[task](/zh-hant/server/events.html#task) 事件由 [task_use_object / task_object](/zh-hant/server/setting.html#task-use-object-task-object) 控制。

**示例**

```php
<?php

use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\Packet;
use Swoole\Server\PipeMessage;
use Swoole\Server\StatusInfo;
use Swoole\Server\TaskResult;

// 創建服務器實例
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

// 開啓面向對象事件模式
$server->set([
    'event_object' => true, 
]);

// 1. 連接事件：接收 Event 對象
$server->on('connect', function (Server $serv, Event $event) {
    // $event->fd, $event->reactor_id 等
    var_dump($event);
});

// 2. 數據接收事件：接收 Event 對象 (包含 data 屬性)
$server->on('receive', function (Server $serv, Event $event) {
    // $event->data 即爲收到的消息內容
    var_dump($event);
});

// 3. 關閉連接事件：接收 Event 對象
$server->on('close', function (Server $serv, Event $event) {
    var_dump($event);
});

// 4. UDP 數據包事件：接收 Packet 對象
$server->on('packet', function (Server $serv, Packet $packet) {
    // $packet->data, $packet->address, $packet->port
    var_dump($packet);
});

// 5. 管道消息事件：接收 PipeMessage 對象
$server->on('pipeMessage', function (Server $serv, PipeMessage $msg) {
    var_dump($msg);
    
    // 演示如何從對象中獲取數據併發送
    $payload = $msg->data; 
    // 假設 $payload 是一個包含 address, port, data, server_socket 的對象/數組
    $serv->sendto(
        $payload->address, 
        $payload->port, 
        $payload->data, 
        $payload->server_socket ?? 0
    );
});

// 6. worker 錯誤事件：接收 StatusInfo 對象
$server->on('workerError', function (Server $serv, StatusInfo $info) {
    // $info->worker_id, $info->worker_pid, $info->exit_code, $info->signal 等
    var_dump($info);
});

// 7. 異步任務完成事件：接收 TaskResult 對象
$server->on('finish', function (Server $serv, TaskResult $result) {
    // $result->data, $result->task_id
    var_dump($result);
});

$server->start();
```

## 注意事項

### 事件名稱大小寫不敏感
底層註冊事件時會把名稱統一轉成**小寫**，所以下面幾種寫法是同一個事件，效果完全一致：
- `workerStart`
- `workerstart`
- `WoRkerStarT`

> [!NOTE]
> 建議統一使用文檔中的**駝峯命名**（如 `workerStart`），便於閱讀和維護。

### 服務器類型與必選事件
不同類型的服務器**必須**監聽對應的核心事件，否則啓動時會拋出警告，或服務無法正常工作。

| 服務器/進程類型 | **必須監聽的事件** | 說明 |
|:---|:---|:---|
| **TCP 服務器** | `receive` | 處理客戶端發送的原始數據流 |
| **UDP 服務器** | `packet` | 處理客戶端發送的數據包 |
| **HTTP 服務器** | `request` | 處理 HTTP 請求並返回響應 |
| **WebSocket 服務器** | `message` | 處理 WebSocket 幀消息 |
| **Task 異步任務進程** | `task`, `finish` | `task`: 接收異步任務<br>`finish`: 接收任務完成結果 |

**示例**

```php
<?php
// 例1：TCP服務器必須監聽receive事件
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

```php
<?php
// 例2：UDP服務器必須監聽packet事件
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);

$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    echo $data . PHP_EOL;
});

$server->start();
```

```php
<?php
// 例3：HTTP服務器必須監聽request事件
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('request', function(Request $request, Response $response) {
  var_dump($request);
});

$server->start();
```

```php
<?php
// 例4：WebSocket服務器必須監聽message事件
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->start();
```

```php
<?php
// 例5：啓用task進程時候，必須監聽task和finish事件
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set(['task_worker_num' => 2]);

$server->on('request', function(Request $request, Response $response) use ($server) {
  $server->task('Hello Swoole!!!!');
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) use ($server) {
    echo $data . PHP_EOL;
    $server->finish($data);
});

$server->on('finish', function(Swoole\Server $server, int $taskId, mixed $data) {
  echo $data . PHP_EOL;
});

$server->start();
```
