# 事件回调

- [TCP/UDP 服务器](/zh/server/tcp_udp.html)、[HTTP/HTTPS/HTTP2 服务器](/zh/server/http.html) 和 [WebSocket 服务器](/zh/server/websocket.html) 的示例里，都有这样一段结构相似的代码：

```php
<?php
$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});
```

- 这种用 [Swoole\Server->on()](/zh/server/methods.html#on) 注册的函数就是**事件回调**。客户端发来数据、连接建立或关闭、进程启动或退出时服务器该做什么，都由它决定，是整个异步服务器模型的核心。

- 以上面的代码为例：**客户端一发来数据，服务器就触发 `receive` 事件，执行绑定的函数，向客户端回复一句 Hello World**。

- 本节逐一介绍 Swoole 异步服务器支持的全部事件。

## start

- 服务器启动后，在 [master 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象实例 | 必填 |

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

**此事件触发前，Server 已完成**

- 已创建 [manager 进程](/zh/server/process_thread.html#进程-线程)
- 已创建 [worker 进程](/zh/server/process_thread.html#进程-线程)
- 已监听所有 TCP/UDP/`Unix Socket` 端口，但还没开始 accept 连接和请求
- 定时器已就绪

**接下来将执行**

- [reactor 线程](/zh/server/process_thread.html#进程-线程) 开始接收事件，客户端即可连接

**使用说明**

- `start` 中只适合做 `echo`、打印日志、修改进程名这类简单操作，**不要调用 `Swoole\Server` 的方法**，因为此时服务还没完全就绪。`start` 和 `workerStart` 在不同进程中并行执行，没有先后顺序。
- 建议在 `start` 中把 `Swoole\Server->master_pid` 和 `Swoole\Server->manager_pid` 写入文件，管理脚本就能向这两个 PID 发信号来关闭或重启服务。

> [!WARNING]
> - `start` 中创建的全局对象不能在 worker 进程里使用：`start` 执行时 worker 进程已经创建好了，新对象只存在于 master 进程的内存中，worker 进程访问不到。
> - [SWOOLE_BASE](/zh/server/process_thread.html#工作模式) 模式没有 master 进程，也就没有 `start` 事件，**不要在 BASE 模式下注册 `start`**。
> - `start` 中可以使用异步和协程 API，但可能与 `dispatch_func`、`package_length_func` 冲突，**不要同时使用**。
> - 不要在 `start` 中启动定时器，否则调用 `Swoole\Server::shutdown()` 后程序无法正常退出。

> [!NOTE]
> - `start` 返回前服务端不会接受任何客户端连接，所以可以放心使用同步阻塞函数。

```php
<?php
use Swoole\Server;
use Swoole\Timer;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('start', function(Server $server) {
  // 禁止在这里操作定时器，否则主进程永远无法退出
  Timer::add(1000, function() {});
  echo "master process start";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `start` 事件。

## connect

- 有新连接进入时，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\Server $server, int $fd, int $reactorId) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$fd` | 连接的文件描述符 | 必填 |
| `$reactorId` | `SWOOLE_PROCESS` 模式下是 `TCP` 连接所在的 [reactor 线程](/zh/server/process_thread.html#进程-线程) 序号，其他模式下是 `worker` 进程序号 | 必填 |

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
> `HTTP` 服务器和 `WebSocket` 服务器不会触发 `connect` 回调。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `connect` 事件。

## beforeShutdown

- 进程正常退出前触发。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象实例 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('beforeShutdown', function(Server $server) {
    echo "Server is about to shutdown\n";
    // 在此可执行资源清理、状态保存等操作
    // 支持协程 API
});
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

- 通过信号终止服务时，各进程触发 `beforeShutdown` 的情况：

| 进程类型 | 是否触发 `beforeShutdown` |
|:---|:---|
| **master 进程** | ✅ 触发 |
| **worker 进程** | ✅ 触发 |
| **task 进程** | ✅ 触发 |
| **manager 进程** | ✅ SWOOLE_BASE 模式下触发 |
| **user 进程** | ❌ 不触发 |

> [!NOTE]
> - 此事件中支持协程，可以安全使用协程 API。

> [!WARNING]
> - 只在进程**正常退出**时触发，`kill -9`、`Ctrl+C` 这类强制终止不会触发。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `beforeShutdown` 事件。


## shutdown

- 服务正常退出时触发。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象实例 | 必填 |

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


**触发时机**

- 通过信号终止服务时，各进程触发 `shutdown` 的情况：

| 进程类型 | 是否触发 `shutdown` |
|:---|:---|
| **master 进程** | ✅ 触发 |
| **worker 进程** | ❌ 不触发 |
| **task 进程** | ❌ 不触发 |
| **manager 进程** | ✅ SWOOLE_BASE 模式下触发 |
| **user 进程** | ❌ 不触发 |

> [!WARNING]
> - 强制终止进程（如 `kill -9`）不会触发 `shutdown`。
> - 命令行下按 `Ctrl+C` 会立即停止程序，同样不触发 `shutdown`。
> - 不要在 `shutdown` 中调用异步或协程 API，此时底层已销毁所有事件循环设施。

> [!NOTE]
> - 此时所有进程和线程都已终止，监听端口也已关闭。
> - 要让程序走正常退出流程，需用 `kill -15` 向 master 进程发送 `SIGTERM` 信号。
> - 此时已没有协程环境，若确实要用协程 API，必须手动调用 `Co\run` 创建[协程容器](/zh/coroutine/container.html)。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `shutdown` 事件。

## workerStart

- [worker 进程](/zh/server/process_thread.html#进程-线程) / [task 进程](/zh/server/process_thread.html#进程-线程) 启动时触发，在这里创建的对象可以在整个进程生命周期内使用。

```php
function (Swoole\Server $server, int $workerId) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$workerId` | 进程序号，非系统 PID | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerStart', function (Server $server, int $workerId) {
    echo "worker 启动，ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

**代码热重载支持**

- 想借进程重启实现代码热重载，**就把代码文件放在 `workerStart` 中引入**，这样每次重启都会加载新代码。
- worker/task 进程被**重新创建**时（`reload` 或意外退出后重启），由 **manager 进程** 负责 fork 出新的子进程。
- 在 **`workerStart` 之前**引入的文件（如公共库），在 **manager 进程启动时**就已加载进内存；manager 本身不重启，这些文件也就不会重新加载。代价是不能热更新，好处是所有 worker 共享同一份内存，不必每个进程各存一份，公用且不易变的 `php` 文件适合放在这里。
- 在 **`workerStart` 中**引入的文件（如业务代码），每个 worker 进程启动时都会重新加载，因此能热更新，但每个进程都要在内存中各存一份。

```
Manager 进程启动
    ├── 加载公共库（如框架核心、配置等）
    │
    ├── fork worker 进程 0
    │       └── 执行 workerStart  → 加载业务代码
    │
    ├── fork worker 进程 1
    │       └── 执行 workerStart  → 加载业务代码
    │
    └── reload 时
            ├── Manager 进程（公共库仍在内存中，不重新加载）
            └── 重新 fork 新 worker 进程
                    └── 再次执行 workerStart  → 重新加载业务代码（实现热更新）
```

```php
<?php
require __DIR__ . '/公共库.php'; // 所有 worker 进程都能读到这份文件，但进程重启不会重新加载它。
$server->on('workerStart', function ($server, $workerId) {
    require __DIR__ . '/进程A专属文件.php'; // 这份文件只有进程 A 能读到，进程 B 读不到
});
```

**协程支持**

`workerStart` 中**会自动创建协程环境**，可以直接使用协程 API：

```php
<?php
$server->on('workerStart', function ($server, $workerId) {
    file_put_contents('data.txt', 'hello world');
});
```

> [!NOTE]
> - `workerStart` 与 `start` **并发执行**，没有先后顺序。
> - 当 [worker_num](/zh/server/setting.html#worker-num) 或 [task_worker_num](/zh/server/setting.html#task-worker-num) 大于 1 时，**每个进程都会触发一次** `workerStart`。
> - `$workerId` 是进程序号，不是系统 PID，实际 PID 要用 `posix_getpid()` 获取。
> - 可通过 [taskworker](/zh/server/properties.html#taskworker) 判断当前是 `worker` 进程还是 `task` 进程。
> - [user 进程](/zh/server/process_thread.html#进程-线程) 不会触发 `workerStart`。

> [!WARNING]
> - `workerStart` 中发生**致命错误**或主动调用 `exit`，当前 worker/task 进程会退出，manager 进程随即重建一个新进程。频繁发生就会**不断创建与销毁进程**，影响服务稳定性。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `workerStart` 事件。

## workerExit

- 只有开启 [reload_async](/zh/server/setting.html#reload-async) 才会触发 `workerExit`，触发时机是进程退出前。参见 **如何正确的重启服务**

```php
function (Swoole\Server $server, int $workerId) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$workerId` | 进程序号，非系统 PID | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
  'reload_async' => true,  // 开启这个才会触发workerExit
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
> - `workerExit` 在 `worker` 进程内触发；[task 进程](/zh/server/process_thread.html#进程-线程) 中若存在事件循环，也会触发。
> - 在 `workerExit` 中尽量移除或关闭异步 `Socket` 连接，底层检测到事件循环中的监听句柄数为 `0` 时才退出进程。
> - 如果进程本来就没有监听任何事件句柄，退出时不会触发此事件。
> - `worker` 进程退出后，才会触发 `workerStop`。

> [!WARNING]
> - 只要 `worker` 进程还没退出，`workerExit` 就会持续触发。
> - 超过 `max_wait_time` 秒仍未退出，进程会被强制杀死，并提示 `worker exit timeout, forced termination`。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `workerExit` 事件。

## workerStop

- `worker` 进程终止时触发，可以在这里回收该进程申请的各类资源。

```php
function (Swoole\Server $server, int $workerId) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$workerId` | 进程序号，非系统 PID | 必填 |

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
> - 进程异常结束（被强制 `kill`、致命错误、`core dump`）时不会触发 `workerStop`。
> - 不要在 `workerStop` 中调用异步或协程 API，此时底层已销毁所有事件循环设施。

> [!TIP]
> 底层不会创建协程来执行 `workerStop` 事件。

## workerError

- 此事件在 [worker 进程](/zh/server/process_thread.html#进程-线程) 异常退出时触发。

```php
function (Swoole\Server $server, int $workerId, int $pid, int $exitCode, int $signal) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$workerId` | 进程序号，非系统 PID | 必填 |
| `$pid` | 进程 PID | 必填 |
| `$exitCode` | 进程退出状态码，0~255 | 必填 |
| `$signal` | 进程退出的信号 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerError', function (Server $server, int $workerId, int $pid, int $exitCode, int $signal) {
    echo "worker 异常退出，ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> - 此事件主要用于报警和监控：worker 进程异常退出，多半是遇到了致命错误或 core dump，应记录日志或发出报警，提示开发者处理。

> [!WARNING]
> - `$signal = 11`：`worker` 进程发生段错误（`segmentation fault`），可能是底层 BUG，请收集 `core dump` 信息和 `valgrind` 内存检测日志，反馈给 Swoole 开发组。
> - `$exitCode = 255`：worker 进程发生致命错误（`Fatal Error`），请查 PHP 错误日志定位问题代码。
> - `$signal = 9`：`worker` 被系统强杀，请检查是否有人为的 `kill -9`，以及 `dmesg` 中是否有 `OOM（Out of memory）` 记录。

> [!TIP]
> - 底层不会创建协程来执行 `workerError` 事件。

## beforeReload

- [worker 进程](/zh/server/process_thread.html#进程-线程) / [task 进程](/zh/server/process_thread.html#进程-线程) 重启前触发，在 [manager 进程](/zh/server/process_thread.html#进程-线程) 中执行。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |

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
> - 重启请求不会叠加：上一次重启还没完成时，新的重启请求会被忽略。
> - 向 `master` 进程 / `manager` 进程发送 `SIGUSR1` 信号，会平稳地重启所有 `worker` 进程和 `task` 进程。
> - 向 `master` 进程 / `manager` 进程发送 `SIGUSR2` 信号，会平稳地重启所有 `task` 进程。
> - `user` 进程退出时不会触发此事件。

> [!WARNING]
> - 不要在 `beforeReload` 中用 `while(1) {}` 之类的阻塞代码，否则进程无法重启。
> - 超过 `max_wait_time` 仍未重启完毕，所有 `worker` 进程会被强制杀死。

> [!TIP]
> - 底层不会创建协程来执行 `beforeReload` 事件。

## afterReload

- [worker 进程](/zh/server/process_thread.html#进程-线程) / [task 进程](/zh/server/process_thread.html#进程-线程) 重启后触发，在 [manager 进程](/zh/server/process_thread.html#进程-线程) 中执行。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |

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
> - 底层不会创建协程来执行 `afterReload` 事件。

## task

- [worker 进程](/zh/server/process_thread.html#进程-线程) 向 [task 进程](/zh/server/process_thread.html#进程-线程) 投递任务时，在 `task` 进程中触发，用于处理耗时任务，避免阻塞 `worker` 进程。

```php
function (Swoole\Server $server, int $taskId, int $workerId, mixed $data) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$taskId` | 执行任务的 `task` 进程序号，需与 `$workerId` 组合起来才全局唯一 | 必填 |
| `$workerId` | 投递任务的 `worker` 进程序号，不同 `worker` 进程投递的任务 ID 可能相同 | 必填 |
| `$data` | 任务的数据内容 | 必填 |

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
  echo $data . PHP_EOL; // task进程通过`Swoole\Server->finish()`返回数据  
});

$server->start();
```

> [!WARNING]
> - 必须设置 `task_worker_num`，否则不会创建 `task` 进程，`worker` 进程也无法投递任务。
> - 不要在 `task` 事件中调用 [task](/zh/server/methods.html#task)、[taskwait](/zh/server/methods.html#taskwait)、[taskwaitmulti](/zh/server/methods.html#taskwaitmulti)、[taskco](/zh/server/methods.html#taskco)，底层会检查环境并抛出错误。
> - 任务执行中遇到致命错误退出，或被外部进程强制 `kill`，当前任务会被丢弃，但不影响其他排队中的任务。

> [!NOTE]
> - 未指定目标 `task` 进程时，底层用取模方式从所有 `task` 进程中选一个投递，不管它是否空闲。
> - `task` 进程接到任务后会置为忙碌，不再接收新任务；全部忙碌时投递会提示 `No idle task worker is available`，只能等目标进程空闲下来。

> [!TIP]
> - 如果 [task_enable_coroutine](/zh/server/setting.html#task-enable-coroutine) 为 `true`，底层会创建协程来执行 `task` 事件。

## finish

- [worker 进程](/zh/server/process_thread.html#进程-线程) 投递的任务在 [task 进程](/zh/server/process_thread.html#进程-线程) 中完成后，task 进程通过 `Swoole\Server->finish()` 或 `return` 把结果发回 worker 进程，此时在 worker 进程中触发 `finish`。

```php
function (Swoole\Server $server, int $taskId, mixed $data) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$taskId` | 执行任务的 `task` 进程序号 | 必填 |
| `$data` | 任务处理的结果内容 | 必填 |

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
  echo $data . PHP_EOL; // task进程通过`Swoole\Server->finish()`返回数据  
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) use ($server) {
    echo $data . PHP_EOL;
    $server->finish($data);  // return $data; 也是同样的效果
});

$server->start();
```


> [!WARNING]
> - 如果在 [task](/zh/server/events.html#task) 事件中**没有调用** [finish](/zh/server/events.html#finish) 方法，也**没有**通过 `return` 返回结果，则 worker 进程**不会触发** `finish` 事件。
> - 如果 [task](/zh/server/events.html#task) 事件返回了结果，但**没有监听** `finish` 事件，底层会抛出异常：`require 'onFinish' callback`。

> [!NOTE]
> - 执行 [finish](/zh/server/events.html#finish) 的 worker 进程，就是当初投递该任务的那个 worker 进程。

> [!TIP]
> - 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `finish` 事件。

## managerStart

- [manager 进程](/zh/server/process_thread.html#进程-线程) 启动时触发。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |

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
> - 可以在此事件中修改 manager 进程的名称。
> - `4.2.12` 之前，`manager` 进程不能加定时器、不能投递异步任务、不能用协程；`4.2.12` 起可以使用基于信号实现的同步模式定时器。
> - `manager` 进程可以调用 [sendMessage](/zh/server/methods.html#sendmessage) 向其他工作进程发送消息。

> [!TIP]
> - 底层不会创建协程来执行 `managerStart` 事件。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('managerStart', function (Server $server) {
    $server->sendMessage('Hello World', 1); // 发送消息给序号为1的进程
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});


$server->on('pipeMessage', function(Server $server, int $workerId, mixed $message) {
  // 收到manager进程通过Swoole\Server->sendMessage()发送的信息
});

$server->start();
```


## managerStop

- [manager 进程](/zh/server/process_thread.html#进程-线程) 结束时触发。

```php
function (Swoole\Server $server) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |

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
> - `managerStop` 触发时，[worker 进程](/zh/server/process_thread.html#进程-线程) 和 [task 进程](/zh/server/process_thread.html#进程-线程) 已全部结束，并已被 `manager` 进程回收。

> [!TIP]
> - 底层不会创建协程来执行 `managerStop` 事件。

## pipeMessage

- [worker 进程](/zh/server/process_thread.html#进程-线程) / [task 进程](/zh/server/process_thread.html#进程-线程) 收到 [sendMessage](/zh/server/methods.html#sendmessage) 发来的 `unixSocket` 消息时触发，两类进程都可能触发。

```php
function (Swoole\Server $server, int $workerId, mixed $message) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$workerId` | 发送方的进程序号 | 必填 |
| `$message` | 消息内容，可以是任意 PHP 类型 | 必填 |

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
      $server->sendMessage('Hello World', 1); // 发送消息给序号为1的进程
    } else {
      $server->sendMessage('Hello World', 0); // 发送消息给序号为0的进程
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
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `pipeMessage` 事件。

## receive

- 收到 `TCP` 数据时，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\Server $server, int $fd, int $reactorId, string $data) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$fd` | 连接的文件描述符 | 必填 |
| `$reactorId` | [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#swoole-process) 下是 `TCP` 连接所在的 [reactor 线程](/zh/server/process_thread.html#进程-线程) 编号，其他模式下是 [worker 进程](/zh/server/process_thread.html#进程-线程) 编号 | 必填 |
| `$data` | 收到的数据，可能是文本或二进制 | 必填 |

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
> [TCP 服务器](/zh/server/tcp_udp.html) 必须设置 `receive` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `receive` 事件。

## packet

- 收到 `UDP` 数据时，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\Server $server, mixed $data, array $clientInfo) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$data` | 收到的数据，可能是文本或二进制 | 必填 |
| `$clientInfo` | 客户端信息 | 必填 |

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

| 字段 | 说明 |
|:---|:---|
| `server_socket` | 当前连接的 `socket` 文件描述符 |
| `dispatch_time` | 数据接收时间 |
| `server_port` | 服务端监听端口 |
| `address` | 客户端 IP |
| `port` | 客户端端口 |

> [!IMPORTANT]
> [UDP 服务器](/zh/server/tcp_udp.html) 必须设置 `packet` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `packet` 事件。

## request

- 收到 `HTTP` 请求时，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| [Swoole\Http\Request](/zh/server/class/request.html) `$request` | `HTTP` 请求对象，包含 `GET`、`POST`、`COOKIE`、`Header` 等客户端请求信息。 | 必填 |
| [Swoole\Http\Response](/zh/server/class/response.html) `$response` | `HTTP` 响应对象，调用它的方法发送响应。 | 必填 |

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('request', function (Request $request, Response $response) {
    echo "接收到http请求" . PHP_EOL;
});

$server->start();
```

> [!IMPORTANT]
> [HTTP/HTTPS/HTTP2 服务器](/zh/server/http.html) 必须设置 `request` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `request` 事件。

## beforeHandshakeResponse

- `WebSocket` 握手前触发。不想自定义握手流程、但又想往响应头里加一些 `HTTP header` 时，用这个事件。

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| [Swoole\Http\Request](/zh/server/class/request.html) `$request` | `HTTP` 请求对象，包含客户端请求信息。 | 必填 |
| [Swoole\Http\Response](/zh/server/class/response.html) `$response` | `HTTP` 响应对象，用它向客户端发送响应。 | 必填 |

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
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `beforeHandshakeResponse` 事件。

## handshake

- 想自己完成 `WebSocket` 握手，就注册 `handshake` 事件。

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| [Swoole\Http\Request](/zh/server/class/request.html) `$request` | `HTTP` 请求对象，包含客户端请求信息。 | 必填 |
| [Swoole\Http\Response](/zh/server/class/response.html) `$response` | `HTTP` 响应对象，用它向客户端发送响应。 | 必填 |

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
    // if (如果不满足我某些自定义的需求条件，那么响应空输出，返回false，握手失败) {
    //    $response->end();
    //    return false;
    // }

    // websocket握手连接算法验证
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

    // 如果请求头有Sec-WebSocket-Protocol，响应头必须设置相同的Sec-WebSocket-Protocol
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
> - 只在需要自行处理 `WebSocket` 握手时才注册此事件；不注册时 Swoole 会自动完成握手。
> - 注册 `handshake` 后不会再触发 `open` 事件。
> - `handshake` 中必须调用 [status](/zh/server/class/response.html#status) 把状态码设为 `101`，再调用 [end](/zh/server/class/response.html#end) 响应，否则握手失败。
> - 内置的握手协议为 `Sec-WebSocket-Version: 13`，低版本浏览器需要自行实现握手。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `handshake` 事件。

## open

- `WebSocket` 客户端完成握手后，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\WebSocket\Server $server,  Swoole\Http\Request $request) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` 对象。 | 必填 |
| [Swoole\Http\Request](/zh/server/class/request.html) `$request` | `HTTP` 请求对象。 | 必填 |

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
> - `WebSocket` 先用 `HTTP` 协议握手，所以 `$request` 里就是客户端发来的握手请求信息。
> - `open` 事件中可以调用 [push](/zh/server/methods.html#push) 向客户端发送数据，或调用 [close](/zh/server/methods.html#close) 关闭连接。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `open` 事件。

## message

- 收到 `WebSocket` 数据时，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\WebSocket\Server $server,  Swoole\WebSocket\Frame $frame) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` 对象。 | 必填 |
| `$frame` | 客户端发来的 `WebSocket` 帧。 | 必填 |

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
> [WebSocket 服务器](/zh/server/websocket.html) 必须设置 `message` 事件。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `message` 事件。

## disconnect

- `WebSocket` 连接关闭时触发。

```php
function (Swoole\WebSocket\Server $server, int $fd) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` 对象。 | 必填 |
| `$fd` | 已关闭连接的文件描述符。 | 必填 |

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
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `disconnect` 事件。

## close

- `TCP` 连接关闭后，在 [worker 进程](/zh/server/process_thread.html#进程-线程) 中触发。

```php
function (Swoole\Server $server, int $fd, int $reactorId) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象 | 必填 |
| `$fd` | 连接的文件描述符 | 必填 |
| `$reactorId` | 连接所在的 `reactor` 线程编号，服务端主动关闭时为负数。 | 必填 |

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
> - 服务端主动关闭连接时，底层会把 `$reactorId` 设为 `-1`，因此判断 `$reactorId < 0` 就能分辨关闭是服务端还是客户端发起的。
> - 只有在服务端 PHP 代码中主动调用 [close](/zh/server/methods.html#close) 才算主动关闭。
> - `close` 中发生致命错误会导致连接泄漏，用 `netstat` 能看到大量 `CLOSE_WAIT` 状态的 TCP 连接。
> - 无论是客户端断开还是服务端调用 [close](/zh/server/methods.html#close)，只要连接关闭就一定触发此事件。
> - `close` 中仍可调用 [getClientInfo](/zh/server/methods.html#getclientinfo) 获取连接信息，回调执行完毕后底层才真正关闭 `TCP` 连接。
> - 触发 `close` 时连接已经关闭，不要再在事件中调用 [close](/zh/server/methods.html#close)，否则会抛出 PHP 警告。

> [!TIP]
> 如果 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true`，底层会创建协程来执行 `close` 事件。

## 事件区别

> [!NOTE]
> `receive`、`packet`、`request` 和 `message` 都用于处理客户端消息，核心区别在于**数据处理层级**：
> - **`receive`**：接收原始的 **TCP 字节流**。底层不做任何解析，协议解码要自己实现。
> - **`packet`**：接收原始的 **UDP 数据**。底层不做任何解析，协议解码要自己实现。
> - **`request` / `message`**：接收底层**自动解析后的结构化数据**，可直接在业务逻辑中使用。

> [!NOTE]
> `disconnect` 和 `close` 都与连接关闭有关，但层次不同：
> - **`disconnect`**：对应 **WebSocket 逻辑连接**的断开（含握手状态与协议级断开）。
> - **`close`**：对应底层 **TCP 连接**的关闭，此时操作系统层面的文件描述符被释放。

> [!NOTE]
> `workerExit` 和 `workerStop` 都在进程退出时触发，但作用不同：
> - **`workerExit`**：在 `max_wait_time` 内执行**柔性关闭**，主动清理并关闭所有事件句柄监听。
> - **`workerStop`**：只是**进程停止的通知**，不参与柔性关闭，在 worker 进程完全退出后执行。


## 面向对象风格
把 [event_object](/zh/server/setting.html#event-object) 设为 `true`，部分事件的回调参数会切换为**面向对象模式**。

### 核心变化
- **传统模式**：回调接收多个分散的参数（如 `$fd`、`$reactor_id`、`$data`）。
- **面向对象模式**：回调改为接收一个**对象实例**，里面封装了该事件的全部上下文，属性访问更直观，类型提示更友好。

各事件对应的参数对象如下，点击类名可查看属性与方法：

| 事件 | 面向对象模式下的参数对象 |
|:---|:---|
| `connect` / `close` / `receive` | [Swoole\Server\Event](/zh/server/class/event.html) |
| `packet` | [Swoole\Server\Packet](/zh/server/class/packet.html) |
| `pipeMessage` | [Swoole\Server\PipeMessage](/zh/server/class/pipe_message.html) |
| `workerError` | [Swoole\Server\StatusInfo](/zh/server/class/status_info.html) |
| `finish` | [Swoole\Server\TaskResult](/zh/server/class/task_result.html) |
| `task` | [Swoole\Server\Task](/zh/server/class/task.html) |

表中前五行由 [event_object](/zh/server/setting.html#event-object) 控制，[task](/zh/server/events.html#task) 事件由 [task_use_object / task_object](/zh/server/setting.html#task-use-object-task-object) 控制。

**示例**

```php
<?php

use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\Packet;
use Swoole\Server\PipeMessage;
use Swoole\Server\StatusInfo;
use Swoole\Server\TaskResult;

// 创建服务器实例
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

// 开启面向对象事件模式
$server->set([
    'event_object' => true, 
]);

// 1. 连接事件：接收 Event 对象
$server->on('connect', function (Server $serv, Event $event) {
    // $event->fd, $event->reactor_id 等
    var_dump($event);
});

// 2. 数据接收事件：接收 Event 对象 (包含 data 属性)
$server->on('receive', function (Server $serv, Event $event) {
    // $event->data 即为收到的消息内容
    var_dump($event);
});

// 3. 关闭连接事件：接收 Event 对象
$server->on('close', function (Server $serv, Event $event) {
    var_dump($event);
});

// 4. UDP 数据包事件：接收 Packet 对象
$server->on('packet', function (Server $serv, Packet $packet) {
    // $packet->data, $packet->address, $packet->port
    var_dump($packet);
});

// 5. 管道消息事件：接收 PipeMessage 对象
$server->on('pipeMessage', function (Server $serv, PipeMessage $msg) {
    var_dump($msg);
    
    // 演示如何从对象中获取数据并发送
    $payload = $msg->data; 
    // 假设 $payload 是一个包含 address, port, data, server_socket 的对象/数组
    $serv->sendto(
        $payload->address, 
        $payload->port, 
        $payload->data, 
        $payload->server_socket ?? 0
    );
});

// 6. worker 错误事件：接收 StatusInfo 对象
$server->on('workerError', function (Server $serv, StatusInfo $info) {
    // $info->worker_id, $info->error_type, $info->errno 等
    var_dump($info);
});

// 7. 异步任务完成事件：接收 TaskResult 对象
$server->on('finish', function (Server $serv, TaskResult $result) {
    // $result->data, $result->task_id
    var_dump($result);
});

$server->start();
```

## 注意事项

### 事件名称大小写不敏感
底层注册事件时会把名称统一转成**小写**，所以下面几种写法是同一个事件，效果完全一致：
- `workerStart`
- `workerstart`
- `WoRkerStarT`

> [!NOTE]
> 建议统一使用文档中的**驼峰命名**（如 `workerStart`），便于阅读和维护。

### 服务器类型与必选事件
不同类型的服务器**必须**监听对应的核心事件，否则启动时会抛出警告，或服务无法正常工作。

| 服务器/进程类型 | **必须监听的事件** | 说明 |
|:---|:---|:---|
| **TCP 服务器** | `receive` | 处理客户端发送的原始数据流 |
| **UDP 服务器** | `packet` | 处理客户端发送的数据包 |
| **HTTP 服务器** | `request` | 处理 HTTP 请求并返回响应 |
| **WebSocket 服务器** | `message` | 处理 WebSocket 帧消息 |
| **Task 异步任务进程** | `task`, `finish` | `task`: 接收异步任务<br>`finish`: 接收任务完成结果 |

**示例**

```php
<?php
// 例1：TCP服务器必须监听receive事件
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();

// 例2：UDP服务器必须监听packet事件
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);

$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    echo $data . PHP_EOL;
});

$server->start();

// 例3：HTTP服务器必须监听request事件
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('request', function(Request $request, Response $response) {
  var_dump($request);
});

$server->start();


// 例4：WebSocket服务器必须监听message事件
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('message', function (Server $server,  Frame $frame) {
    echo $frame->data . PHP_EOL;
});

$server->start();


// 例5：启用task进程时候，必须监听task和finish事件
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
