# 協程容器

`Swoole` 的協程容器，可以理解爲協程運行的**環境**或**調度室**。它負責管理所有協程的**創建**、**執行**和**切換**，保證協程代碼以異步非阻塞的模式高效運行。簡單來說，所有協程都必須運行在容器之內。

## 如何創建協程容器

### run() 函數

```php
<?php
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    go(function () {
        sleep(2);  // 協程 1
        echo 'coroutine 1' . PHP_EOL;
    });

    go(function () {
        sleep(1);  // 協程 2
        echo 'coroutine 2' . PHP_EOL;
    });
});
```

`run()` 是協程調度的核心入口：

- 它在底層自動完成事件循環與調度器的初始化，爲協程的**併發執行**、**自動掛起**與**恢復**提供必要的運行時環境。
- 它由 `library` 模塊提供，因此必須在 `php.ini` 中設置 `swoole.enable_library=On` 纔可以使用。
- `run()` 本身就會創建一個協程環境，其回調函數也是在一個協程中執行的。如果只需要運行一個協程，無需再調用 [`go()`](/zh-hant/coroutine/coroutine_api.html#create)，直接把業務邏輯寫在 `run()` 的回調中即可。
- 除了[異步服務器](/zh-hant/server/tcp_udp.html)和啓用協程的 [Swoole\Process](/zh-hant/process/process.html)，獨立腳本、自定義程序都需要通過 `run()` 方法創建協程容器。

> [!WARNING]
> 不能在 `run()` 裏面嵌套執行 `run()`，否則會提示 `Unable to call Event::wait() in coroutine`。

### 異步服務器

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->set([
    'enable_coroutine' => true
]);
$server->on('request', function (Request $request, Response $response) {
    $response->end('<h1>Hello World</h1>');
});

$server->start();
```

設置 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 爲 `true` 後，每個 [request](/zh-hant/server/events.html#request) 事件的回調函數都會自動在**協程容器**中執行，無需手動調用 `run()`。

> [!TIP]
> 異步服務器的更多細節可參閱「異步服務器」章節。這裏只需要瞭解：在 `enable_coroutine` 爲 `true` 的作用下，當異步服務器執行**特定**事件的回調時，會自動創建協程容器，調度協程來運行回調。

> [!WARNING]
> 如果異步服務器已經通過 `enable_coroutine` 開啓了協程，就不能再在回調中執行 `Swoole\Coroutine\run`。

### Swoole\Process

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$process = new Process(function (Process $process) {
    // 回調在協程中執行，可直接使用協程 API
    Coroutine::sleep(1);
    $process->write('done' . PHP_EOL);
}, false, Process::PIPE_TYPE_DGRAM, true);

$process->start();
echo $process->read();
Process::wait();
```

將構造函數的第 4 個參數 `$enable_coroutine` 設爲 `true`（或通過 [set()](/zh-hant/process/process.html#set) 設置 `enable_coroutine`），子進程啓動時會自動創建協程容器：回調函數在協程中執行，回調返回後進入事件循環，直到所有協程結束進程才退出。

> [!TIP]
> 通過 [addProcess](/zh-hant/server/methods.html#addprocess) 添加到異步服務器的自定義進程同樣如此，是否創建容器由 `Process` 對象自身的 `enable_coroutine` 設置決定，不跟隨服務器的 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) 配置。

> [!WARNING]
> 協程容器只在子進程中創建，父進程不會自動創建容器，在父進程中使用協程 API 仍需通過 `run()` 自行創建。
