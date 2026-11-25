# 协程容器

`Swoole` 的协程容器，可以理解为协程运行的**环境**或**调度室**。它负责管理所有协程的**创建**、**执行**和**切换**，保证协程代码以异步非阻塞的模式高效运行。简单来说，所有协程都必须运行在容器之内。

## 如何创建协程容器

### run() 函数

```php
<?php
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    go(function () {
        sleep(2);  // 协程 1
        echo 'coroutine 1' . PHP_EOL;
    });

    go(function () {
        sleep(1);  // 协程 2
        echo 'coroutine 2' . PHP_EOL;
    });
});
```

`run()` 是协程调度的核心入口：

- 它在底层自动完成事件循环与调度器的初始化，为协程的**并发执行**、**自动挂起**与**恢复**提供必要的运行时环境。
- 它由 `library` 模块提供，因此必须在 `php.ini` 中设置 `swoole.enable_library=On` 才可以使用。
- `run()` 本身就会创建一个协程环境，其回调函数也是在一个协程中执行的。如果只需要运行一个协程，无需再调用 [`go()`](/zh/coroutine/coroutine_api.html#create)，直接把业务逻辑写在 `run()` 的回调中即可。
- 除了[异步服务器](/zh/server/tcp_udp.html)和启用协程的 [Swoole\Process](/zh/process/process.html)，独立脚本、自定义程序都需要通过 `run()` 方法创建协程容器。

> [!WARNING]
> 不能在 `run()` 里面嵌套执行 `run()`，否则会提示 `Unable to call Event::wait() in coroutine`。

### 异步服务器

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

设置 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true` 后，每个 [request](/zh/server/events.html#request) 事件的回调函数都会自动在**协程容器**中执行，无需手动调用 `run()`。

> [!TIP]
> 异步服务器的更多细节可参阅「异步服务器」章节。这里只需要了解：在 `enable_coroutine` 为 `true` 的作用下，当异步服务器执行**特定**事件的回调时，会自动创建协程容器，调度协程来运行回调。

> [!WARNING]
> 如果异步服务器已经通过 `enable_coroutine` 开启了协程，就不能再在回调中执行 `Swoole\Coroutine\run`。

### Swoole\Process

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$process = new Process(function (Process $process) {
    // 回调在协程中执行，可直接使用协程 API
    Coroutine::sleep(1);
    $process->write('done' . PHP_EOL);
}, false, Process::PIPE_TYPE_DGRAM, true);

$process->start();
echo $process->read();
Process::wait();
```

将构造函数的第 4 个参数 `$enable_coroutine` 设为 `true`（或通过 [set()](/zh/process/process.html#set) 设置 `enable_coroutine`），子进程启动时会自动创建协程容器：回调函数在协程中执行，回调返回后进入事件循环，直到所有协程结束进程才退出。

> [!TIP]
> 通过 [addProcess](/zh/server/methods.html#addprocess) 添加到异步服务器的自定义进程同样如此，是否创建容器由 `Process` 对象自身的 `enable_coroutine` 设置决定，不跟随服务器的 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 配置。

> [!WARNING]
> 协程容器只在子进程中创建，父进程不会自动创建容器，在父进程中使用协程 API 仍需通过 `run()` 自行创建。
