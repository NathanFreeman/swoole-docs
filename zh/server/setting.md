# 配置

[Swoole\Server->set()](/zh/server/methods.html#set) 方法用于设置 `Swoole\Server`、`Swoole\Http\Server`、`Swoole\WebSocket\Server` 和 `Swoole\Redis\Server` 运行时的各项参数。

如果您已经阅读过 [多端口监听](/zh/server/port.html) 章节，其中提到的 [Swoole\Server\Port->set()](/zh/server/port.html) 方法的配置项说明也可以在这里找到。

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
> 自 v4.5.5 版本起，底层会检测配置项的有效性。如果设置了 Swoole 不支持的配置项，将产生一个警告提示。

```shell
PHP Warning:  unsupported option [foo] in @swoole-src/library/core/Server/Helper.php
```

## worker_num

设置启动的 [worker 进程](/zh/server/process_thread.html#worker) 数。默认值为 `CPU` 核数。

`worker` 进程负责处理实际的业务逻辑。合理设置该值直接影响服务器的处理能力。

**示例**

```php
<?php
$server->set(['worker_num' => 4]);
```

> [!NOTE]
> **编号**
>
> - 若 `worker_num` 设为 4，则 `worker` 进程编号范围为 `[0, worker_num - 1]`，即 `[0, 3]`。

> [!WARNING]
> **注意**
>
> - 如果 `1` 个请求耗时 `100ms`，要提供 `1000QPS` 的处理能力，那必须配置 `100` 个进程或更多，但开的进程越多，占用的内存就会大大增加，而且进程间切换的开销就会越来越大。所以这里适当即可。不要配置过大。
> - 如果业务代码为异步 IO 的，这里设置为 `CPU` 核数最合理。
> - 如果业务代码为同步 IO，需要根据请求响应时间和系统负载来调整，例如：`CPU` 核数 * （2 - 4）倍甚至更大。
> - 默认设置为服务器的 `CPU` 核数，最大不得超过为服务器的 `CPU` 核数 * 1000。
> - 假设每个进程占用 `40M` 内存，`100` 个进程就需要占用 `4G` 内存。
> - 如果是 `SWOOLE_THREAD` 模式，该参数则代表创建的线程数量。

## reactor_num

设置启动的 [reactor 线程](/zh/server/process_thread.html#master) 数。默认值为 `CPU` 核数。该配置仅适用于 `SWOOLE_PROCESS` 模式。

`reactor` 线程负责接收客户端连接和网络请求，是 `Swoole` 的"网络事件监听器"。每个 `reactor` 线程都独立维持一个 `EventLoop`，线程之间无锁运行，可以在 128 核 CPU 上并行执行，然后将接收到的请求数据转发给 `worker` 进程处理。

**示例**

```php
<?php
$server->set(['reactor_num' => 4]);
```

> [!WARNING]
> **注意**
>
> - `reactor_num` 建议设置为 `CPU` 核数的 `1-4` 倍。
> - `reactor_num` 最大不得超过 `CPU` 核数 * `4`。
> - `reactor_num` 必须小于或等于 `worker_num`，如果设置的 `reactor_num` 大于 `worker_num`，会自动调整使 `reactor_num` 等于 `worker_num`。
> - `reactor_num` 在超过 `8` 核的机器上默认设置为 `8`。

## task_worker_num

配置 [task 进程](/zh/server/process_thread.html#task) 将启用耗时任务投递功能，此时必须同时注册 [task 事件](/zh/server/events.html#task) 和 [finish 事件](/zh/server/events.html#finish) 两个回调函数，否则服务器程序无法启动。

**示例**

```php
<?php
$server->set(['task_worker_num' => 4]);
$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    echo $data . PHP_EOL;
});
$server->on('finish', function (Server $server, int $taskId, mixed $data) {
    echo $data . PHP_EOL; // task 进程通过 `Swoole\Server->finish()` 返回数据
});
```

> [!NOTE]
> **编号**
>
> - 若 [worker_num](/zh/server/setting.html#worker-num) 为 4，`task_worker_num` 为 8，则 `task` 进程的编号范围为 `[worker_num, worker_num + task_worker_num - 1]`，即 `[4, 11]`。

> [!WARNING]
> **注意**
>
> - `task` 进程数最大不得超过为服务器的 `CPU` 核数 * 1000。
> - 假设单个 `task` 进程的处理耗时为 `100ms`，那一个进程 1 秒就可以处理 `1/0.1=10` 个任务。

## enable_coroutine

控制是否在 [事件回调](/zh/server/events.html) 中自动创建协程来执行业务逻辑，默认值为 `true`。

**示例**

```php
<?php
$server->set(['enable_coroutine' => true]);
```

> [!TIP]
> **配置方式**
>
> - 在 `php.ini` 中设置 `swoole.enable_coroutine = 'Off'`（详见 ini 配置文档）
> - 通过 `$server->set(['enable_coroutine' => false]);` 设置的优先级高于 `php.ini`

> [!NOTE]
> **注意**
>
> - 当 `enable_coroutine = true` 时，底层会在 `request` 等事件中自动创建协程。
> - 当 `enable_coroutine = false` 时，底层不会自动创建协程。如果业务中不需要使用协程，关闭该选项可提升一定性能。如需使用协程，需自行通过 `go()` 创建；若不需要协程特性，行为与 Swoole 1.x 完全一致。
> - 开启该选项仅表示会通过协程方式处理请求。如果回调中包含了阻塞操作（如 `sleep`、`mysqlnd` 扩展等），还需额外配置 [hook_flags](/zh/server/setting.html#hook-flags) 以实现阻塞函数和扩展的协程化。

> [!NOTE]
> **受 `enable_coroutine` 影响的事件回调有**
>
> - [workerStart](/zh/server/events.html#workerstart)
> - [connect](/zh/server/events.html#connect)
> - [open](/zh/server/events.html#open)
> - [receive](/zh/server/events.html#receive)
> - [setHandler](/zh/server/methods.html#sethandler)
> - [packet](/zh/server/events.html#packet)
> - [request](/zh/server/events.html#request)
> - [message](/zh/server/events.html#message)
> - [pipeMessage](/zh/server/events.html#pipemessage)
> - [finish](/zh/server/events.html#finish)
> - [close](/zh/server/events.html#close)

## task_enable_coroutine

开启 [task 进程](/zh/server/process_thread.html#task) 协程化。开启后自动在 [task 事件回调](/zh/server/events.html#task) 创建协程和 [协程容器](/zh/coroutine/container.html)，可以直接使用协程 `API`。

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
> - `task_enable_coroutine` 必须在 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 为 `true` 时才可以使用。
> - 自 `Swoole 4.2.12` 版本起支持该选项。

## hook_flags

用于设置哪些阻塞函数或扩展需要被替换为协程版本，以实现异步非阻塞的协程调度。默认不替换任何阻塞函数或者扩展。

**示例**

```php
<?php
$server->set([
    'hook_flags' => SWOOLE_HOOK_SLEEP | SWOOLE_HOOK_NATIVE_CURL,
]);
```

**支持的协程化选项**

可使用 `SWOOLE_HOOK_ALL` 一键开启全部协程化项，也可按需组合使用以下常量：

| 常量名                             | 说明                                                         |
|:--------------------------------|:-----------------------------------------------------------|
| `SWOOLE_HOOK_TCP`               | TCP 操作（如 `stream_socket_client`）                           |
| `SWOOLE_HOOK_UNIX`              | Unix Socket 操作                                             |
| `SWOOLE_HOOK_UDP`               | UDP 操作                                                     |
| `SWOOLE_HOOK_UDG`               | Unix 数据报套接字                                                |
| `SWOOLE_HOOK_SSL`               | SSL 封装层                                                    |
| `SWOOLE_HOOK_TLS`               | TLS 封装层                                                    |
| `SWOOLE_HOOK_SLEEP`             | `sleep`、`usleep`、`time_nanosleep`、`time_sleep_until` 等睡眠函数 |
| `SWOOLE_HOOK_FILE`              | 文件操作（如 `fread`、`fwrite`、`file_get_contents` 等）             |
| `SWOOLE_HOOK_STREAM_FUNCTION`   | 流函数（如 `stream_select`、`stream_set_blocking`）               |
| `SWOOLE_HOOK_BLOCKING_FUNCTION` | 各类阻塞函数（如 `gethostbyname`、`exec`、`shell_exec` 等）            |
| `SWOOLE_HOOK_PROC`              | 进程操作（如 `proc_open`）                                        |
| `SWOOLE_HOOK_CURL`              | CURL 协程化（基础版）                                              |
| `SWOOLE_HOOK_NATIVE_CURL`       | CURL 原生协程化（更完整、推荐）                                         |
| `SWOOLE_HOOK_SOCKETS`           | sockets 扩展相关函数                                             |
| `SWOOLE_HOOK_STDIO`             | 标准输入输出（如 `stdin`、`stdout`、`stderr`）                        |
| `SWOOLE_HOOK_PDO_PGSQL`         | PDO PostgreSQL 驱动协程化                                       |
| `SWOOLE_HOOK_PDO_ODBC`          | PDO ODBC 驱动协程化                                             |
| `SWOOLE_HOOK_PDO_ORACLE`        | PDO Oracle 驱动协程化                                           |
| `SWOOLE_HOOK_PDO_SQLITE`        | PDO SQLite 驱动协程化                                           |
| `SWOOLE_HOOK_ALL`               | 开启以上所有协程化项                                                 |

> [!TIP]
> **版本要求**
>
> - Swoole 版本为 `v4.5+` 或 [4.4LTS](https://github.com/swoole/swoole-src/tree/v4.4.x) 可用，详情参考[一键协程化](/zh/coroutine/hook.html)

## enable_reuse_port

设置端口复用，启用后，支持多个进程或服务同时监听同一个端口（需内核支持）。默认值为 `false`。

**示例**

```php
<?php
$server->set(['enable_reuse_port' => true]);
```

> [!TIP]
> **可用条件**
>
> - 仅在 `Linux-3.9.0` 以上版本的内核可用，`Swoole4.5` 以上版本可用

## enable_deadlock_check

开启协程死锁检测，默认值为 `false`。

**示例**

```php
<?php
$server->set(['enable_deadlock_check' => true]);
```

> [!WARNING]
> **注意**
>
> - 底层会定期检查所有协程的状态。当检测到所有协程都处于休眠状态且没有可唤醒的事件时，会触发类似 `[fatal error]: all coroutines (count: N) are asleep - deadlock!` 的错误。

## enable_preemptive_scheduler

开启协程抢占式调度，避免其中一个协程执行时间过长导致其他协程饿死，默认值为 `false`。

**示例**

```php
<?php
$server->set(['enable_preemptive_scheduler' => true]);
```

> [!NOTE]
> **注意**
>
> - 有些协程可能完全没有 `I/O` 操作，导致这个协程会一直占用 CPU 导致其他协程无法执行。开启后默认每隔 `10ms` 检测当前协程，如果当前协程运行时间过长，就会强制“打断”它，让出 `CPU` 给其他协程执行。

## enable_unsafe_event

启用 [connect 回调事件](/zh/server/events.html#connect) 和 [close 回调事件](/zh/server/events.html#close)，默认值为 `false`。

**示例**

```php
<?php
$server->set(['enable_unsafe_event' => true]);
```

> [!WARNING]
> **注意**
>
> - [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#swoole-process) 下配置 [dispatch_mode](/zh/server/setting.html#dispatch-mode) 为 `SWOOLE_DISPATCH_ROUND` 或 `SWOOLE_DISPATCH_IDLE_WORKER`，因为系统无法保证 [connect](/zh/server/events.html#connect) / [receive](/zh/server/events.html#receive) / [close](/zh/server/events.html#close) 的执行顺序，默认关闭了 `connect/close` 事件；
> - 如果应用程序需要 `connect/close` 事件，并且能接受顺序问题可能带来的安全风险，可以通过设置 `enable_unsafe_event` 为 true，启用 `connect/close` 事件。

## enable_delay_receive

开启后，客户端连接成功后不会立即监听数据接收事件，而是只触发 [connect 事件](/zh/server/events.html#connect)，等待开发者“批准”后才开始接收数据。默认值为 `false`。

**示例**

```php
<?php
$server->set(['enable_delay_receive' => true]);
```

> [!NOTE]
> **注意**
>
> - 用户需要在代码执行 `Swoole\Server->confirm()` 对连接进行确认，此时才会将客户端连接加入事件循环。

## enable_signalfd

使用 `Linux` 内核提供的 `signalfd` 特性，将信号这种传统的中断，转换成一个文件描述符（file descriptor）来异步处理，默认值为 `true`。

**示例**

```php
<?php
$server->set(['enable_signalfd' => true]);
```

## enable_kqueue

在 `macOS` 苹果系统上，使用 `kqueue` 作为事件驱动引擎。默认值为 `false`。

**示例**

```php
<?php
$server->set(['enable_kqueue' => true]);
```

> [!TIP]
> **可用条件**
>
> - 本配置适用于 `Swoole v6.0.0` 及以上版本。从该版本开始，由于默认的 `kqueue` 与 `Swoole` 的某些功能存在兼容性冲突，因此在 `macOS` 系统上，`Swoole` 将默认使用 `poll` 作为底层的事件驱动引擎，而非 `kqueue`。

## bootstrap

多线程模式下的程序入口文件，默认是当前执行的脚本文件名。

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
> - 在 [SWOOLE_THREAD](/zh/server/process_thread.html#swoole-thread) 模式下，由于 `PHP ZTS（Zend Thread Safe）` 模式下的线程是相互隔离的，无法像进程那样通过 `fork()` 直接复制一份独立的内存数据。因此，每个线程都需要重新执行当前脚本文件来初始化自身环境。

> [!TIP]
> **可用条件**
>
> - Swoole 版本 >= `v6.0`，`PHP` 为 `ZTS` 模式，编译 `Swoole` 时开启了 `--enable-swoole-thread` 可用

## init_arguments

用于设置多线程模式下的共享数据。该配置项需要传入一个回调函数，在服务器启动时会自动执行该函数，其返回值可作为线程间共享的数据对象。

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
    $map = Swoole\Thread::getArguments(); // 这里会返回执行回调函数 function() {return new Map();} 的返回值
});
```

> [!NOTE]
> **线程安全容器**
>
> - Swoole 内置了许多线程安全容器，并发 `Map`、并发 `List`、并发队列。

> [!WARNING]
> **注意**
>
> - 请确保回调函数返回的是线程安全的变量，不要返回非线程安全的普通变量。

> [!TIP]
> **可用条件**
>
> - Swoole 版本 >= `v6.0`，`PHP` 为 `ZTS` 模式，编译 `Swoole` 时开启了 `--enable-swoole-thread` 可用

## dispatch_mode

[reactor 线程](/zh/server/process_thread.html#master) 将客户端数据分发至 [worker 进程](/zh/server/process_thread.html#worker) 的负载均衡策略。默认值为 `SWOOLE_DISPATCH_FDMOD`。

**示例**

```php
<?php
$server->set(['dispatch_mode' => SWOOLE_DISPATCH_FDMOD]);
```

**支持的数据包分发策略有**

| 模式值                             | 模式名称      | 分配策略                                | 核心作用                                    |
|:--------------------------------|:----------|:------------------------------------|:----------------------------------------|
| `SWOOLE_DISPATCH_ROUND`         | 轮循模式      | 依次轮询分配给每个 worker进程                  | 请求均匀分布，适合无状态服务                          |
| `SWOOLE_DISPATCH_FDMOD`         | 固定模式（FD）  | 根据连接 FD 取模分配                        | 同一连接数据固定在同一 worker进程，适合长连接或有状态服务        |
| `SWOOLE_DISPATCH_IDLE_WORKER`   | 抢占模式      | 主进程根据 worker进程 忙闲状态动态投递             | 优先分配给空闲 worker进程，提高资源利用率，避免阻塞           |
| `SWOOLE_DISPATCH_IPMOD`         | IP 哈希模式   | 对客户端 IP 进行取模分配                      | 同一来源 IP 的连接固定到同一 worker进程，适合基于 IP 的会话保持 |
| `SWOOLE_DISPATCH_UIDMOD`        | UID 绑定模式  | 按绑定 UID 取模（字符串 UID 建议先 crc32）       | 基于用户 ID 的会话保持，适用于用户态状态绑定                |
| `SWOOLE_DISPATCH_STREAM`        | Stream 模式 | 空闲 worker进程 主动 Accept 连接并接管请求       | 减少主进程转发开销，提升高并发下连接处理效率                  |
| `SWOOLE_DISPATCH_CO_CONN_LB`    | 固定协程模式    | 首次选最少协程的 worker进程，后续请求固定到该 worker进程 | 同一个连接的请求固定到首次选中的最少协程 worker进程           |
| `SWOOLE_DISPATCH_CO_REQ_LB`     | 均衡协程模式    | 每次请求都发给当前协程数最少的 worker进程            | 平衡所有 worker进程 的协程数量                     |
| `SWOOLE_DISPATCH_CONCURRENT_LB` | 均衡并发模式    | 每次请求都发给当前并发数最少的 worker进程            | 平衡所有 worker进程 的并发数量                     |

> [!WARNING]
> **注意**
>
> - [SWOOLE_BASE 模式](/zh/server/process_thread.html#swoole-base) 下无法使用 `dispatch_mode`，因为不存在投递任务，当收到客户端发来的数据后会立即在当前 worker 进程回调。
> - 无状态的请求可以使用 `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER`，同步阻塞的服务可以使用 `SWOOLE_DISPATCH_IDLE_WORKER`，异步非阻塞可以使用 `SWOOLE_DISPATCH_ROUND`。
> - 有状态的请求可以使用 `SWOOLE_DISPATCH_FDMOD`，`SWOOLE_DISPATCH_IPMOD`，`SWOOLE_DISPATCH_UIDMOD`。
> - UDP 服务器：
>     - `SWOOLE_DISPATCH_FDMOD`，`SWOOLE_DISPATCH_IPMOD` 和 `SWOOLE_DISPATCH_UIDMOD` 时为固定分配，底层使用客户端 `IP` 取模散列到不同的 `worker` 进程。
>     - `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER` 时随机分配到不同 `worker` 进程。

> [!TIP]
> **事件屏蔽**
>
> - `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER` 底层会屏蔽 [connect 事件](/zh/server/events.html#connect) 和 [close 事件](/zh/server/events.html#close)，原因是这两种模式下无法保证 connect 事件/close 事件/[receive 事件](/zh/server/events.html#receive) 的执行顺序。

> [!TIP]
> **长连接服务**
>
> - 在长连接服务（如 WebSocket 服务器）中，必须选择 `SWOOLE_DISPATCH_FDMOD` 或 `SWOOLE_DISPATCH_CO_CONN_LB` 这类将请求始终转发至同一进程的分发策略。否则，同一连接上的数据可能第一次由进程1处理，第二次却被分发到进程2，而进程2并未保存该连接的相关状态记录，从而导致错误。

## dispatch_func

自定义 [reactor 线程](/zh/server/process_thread.html#master) 将客户端数据分发至 [worker 进程](/zh/server/process_thread.html#worker) 的负载均衡策略。

**回调签名**

```php
function (Swoole\Server $server, int $fd, int $type, string $data): int {}
```

**参数**

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | Swoole\Server 对象实例 | 必填 |
| `$fd` | 当前客户端的文件描述符 | 必填 |
| `$type` | 数据类型，`0` 表示来自客户端的数据发送，`3` 表示客户端连接关闭，`4` 表示客户端连接建立 | 必填 |
| `$data` | 数据内容，不会传入完整的数据，只会传入数据包的前 `8K` 内容，需要根据这前 8K 的数据计算出需要投递的进程序号 | 必填 |

**返回值**：返回 `[0, worker_num - 1]` 的数字，表示数据包投递的目标 `worker` 进程序号，参见 [worker_num](/zh/server/setting.html#worker-num)。

**示例**

```php
<?php
$server->set(['dispatch_func' => function (Swoole\Server $server, int $fd, int $type, string $data) {}]);
```

> [!WARNING]
> **注意**
>
> - 返回的进程序不在 `[0, worker_num - 1]` 的话，数据会被丢弃。
> - `dispatch_func` 只能在 [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#swoole-process) 下使用。
> - `dispatch_func` 的优先级大于 `dispatch_mode`。

## daemonize

将当前服务守护进程化，默认值为 `false`。

程序将转入后台作为守护进程运行。长时间运行的服务器端程序必须启用此项。如果不启用守护进程，当 ssh 终端退出后，程序将被终止运行。

**示例**

```php
<?php
$server->set(['daemonize' => true]);
```

> [!WARNING]
> **注意**
>
> - 启用守护进程后，标准输入和输出会被重定向到 [log_file](/zh/server/setting.html#log-file)；如果未设置 `log_file`，将重定向到 `/dev/null`，所有打印屏幕的信息都会被丢弃。
> - 启用守护进程后，当前目录环境变量的值会发生变更，相对路径的文件读写会出错。PHP 程序中必须使用绝对路径。
> - systemd：
>     - 使用 `systemd` 或者 `supervisord` 管理 `Swoole` 服务时，请勿设置 `daemonize => true`。主要原因是 `systemd` 的机制与 `init` 不同。`init` 进程的 `PID` 为 `1`，程序使用 `daemonize` 后，会脱离终端，最终被 `init` 进程托管，与 `init` 关系变为父子进程关系。
>     - 但 `systemd` 是启动了一个单独的后台进程，自行 `fork` 管理其他服务进程，因此不需要 `daemonize`，反而使用了 `daemonize => true` 会使得 `Swoole` 程序与该管理进程失去父子进程关系。

## display_errors

开启 / 关闭 `Swoole` 错误信息。默认值为 `false`。

**示例**

```php
<?php
$server->set(['display_errors' => true]);
```

## dns_server

设置 `DNS` 地址。

**示例**

```php
<?php
$server->set(['dns_server' => '8.8.8.8']);
```

## discard_timeout_request

它决定了当客户端已经断开连接，但请求数据才到达或正在处理时，服务器是否还要处理这个“过期”的请求。默认值为 `true`。

[dispatch_mode](/zh/server/setting.html#dispatch-mode) 为 `SWOOLE_DISPATCH_ROUND` 和 `SWOOLE_DISPATCH_IDLE_WORKER`。系统无法保证 [connect 事件](/zh/server/events.html#connect)、[receive 事件](/zh/server/events.html#receive)、[close 事件](/zh/server/events.html#close) 的顺序执行，因此可能会有一些请求数据在连接关闭后，才能到达 [worker 进程](/zh/server/process_thread.html#worker)。

**示例**

```php
<?php
$server->set(['discard_timeout_request' => true]);
```

> [!WARNING]
> **注意**
>
> - `discard_timeout_request` 配置默认为 `true`，表示如果 `worker` 进程收到了已关闭连接的数据请求，将自动丢弃。
> - `discard_timeout_request` 如果设置为 `false`，表示无论连接是否关闭 `worker` 进程都会处理数据请求。

## task_use_object / task_object

该设置项用于控制 [task 事件](/zh/server/events.html#task) 的回调参数形式，开启后事件回调将切换为 [面向对象风格](/zh/server/events.html#面向对象风格)，回调参数变为一个 [Swoole\Server\Task](/zh/server/class/task.html) 对象。默认值为 `false`。

**示例**

```php
<?php
$server->set(['task_use_object' => true]);
```

## max_request

设置 [worker 进程](/zh/server/process_thread.html#worker) 可以执行的最大任务数。当 `worker` 进程处理的任务数达到该值时，进程会自动重启，以释放占用的内存和资源。默认值为 `0`，表示不设限制，进程不会退出。

**示例**

```php
<?php
$server->set(['max_request' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 达到 `max_request` 不一定马上关闭进程，参考 [max_wait_time](/zh/server/setting.html#max-wait-time)。
> - [SWOOLE_BASE](/zh/server/process_thread.html#swoole-base) 下，达到 `max_request` 后重启进程会导致客户端连接断开。
> - 这个参数的主要作用是解决由于程序编码不规范导致的 PHP 进程内存泄露问题。PHP 应用程序有缓慢的内存泄漏，但无法定位到具体原因、无法解决，可以通过设置 `max_request` 临时解决，需要找到内存泄漏的代码并修复，而不是通过此方案，可以使用 Swoole Tracker 发现泄漏的代码。

## max_request_grace

与 [max_request](/zh/server/setting.html#max-request) 配合使用，实现 [worker 进程](/zh/server/process_thread.html#worker) 错峰重启，默认值为 `0`，表示不设限制。

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
> - 若所有 `worker` 进程的 `max_request` 值完全相同（例如均设为 1000），可能导致：
>     - 各进程几乎同时达到请求数上限；
>     - 同时退出并重启；
>     - 服务在短时间内失去所有 `worker` 进程，引发性能波动。
> - 启用 `max_request_grace` 后，每个 `worker` 进程在启动时会在 `max_request` 的基础上增加一个 `[1, max_request_grace]` 范围内的随机值，从而使各进程的实际上限互不相同，实现错峰重启。

## task_max_request

设置 [task 进程](/zh/server/process_thread.html#task) 可以执行的最大任务数。当 `task` 进程处理的任务数达到该值时，进程会自动重启，以释放占用的内存和资源。默认值为 `0`，表示不设限制，进程不会退出。

**示例**

```php
<?php
$server->set(['task_max_request' => 10000]);
```

## task_max_request_grace

与 [task_max_request](/zh/server/setting.html#task-max-request) 配合使用，实现 [task 进程](/zh/server/process_thread.html#task) 错峰重启，默认值为 `0`，表示不设限制。

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
> - 若所有 `task` 进程的 `task_max_request` 值完全相同（例如均设为 1000），可能导致：
>     - 各进程几乎同时达到请求数上限；
>     - 同时退出并重启；
>     - 服务在短时间内失去所有 `task` 进程，引发性能波动。
> - 启用 `task_max_request_grace` 后，每个 `task` 进程在启动时会在 `task_max_request` 的基础上增加一个 `[1, task_max_request_grace]` 范围内的随机值，从而使各进程的实际上限互不相同，实现错峰重启。

## max_connection / max_conn

设置服务器的最大连接数。当服务器已建立的连接数达到该值时，新进入的连接将被拒绝。默认值为 `ulimit -n`（系统当前用户最大打开文件数）。

**示例**

```php
<?php
$server->set(['max_connection' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 如果应用层未显式设置 `max_connection`，底层将自动使用 `ulimit -n` 的值作为默认值。
> - `max_connection` 的值不能超过操作系统的 `ulimit -n` 值。若设置过大，底层会发出警告并自动将配置重置为 `ulimit -n` 的值。
> - 在 `Swoole 4.2.9` 及以上版本中，当检测到 `ulimit -n` 设置过大（如 `100 万`）时，底层会将默认值调整为 `100000`。这是因为过大的 `ulimit -n` 需要分配大量内存用于连接信息存储，可能导致进程启动失败。
> - 若设置的值过小，底层也会发出警告，并将其调整为 `ulimit -n` 的值。配置的最小有效值为 `(worker_num + task_worker_num) * 2 + 32`。
> - `max_connection` 不应盲目调大，应根据服务器实际可用内存合理设置。Swoole 会按照该数值预先分配一块内存用于保存连接信息，每个 TCP 连接约占用 `224` 字节。

## max_coroutine / max_coro_num

设置当前工作进程最大协程数量。默认值：`100000`，`Swoole` 版本小于 `v4.4.0-beta` 时默认值为 `3000`。

**示例**

```php
<?php
$server->set(['max_coroutine' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 超过 `max_coroutine` 底层将无法创建新的协程，底层会抛出 `exceed max number of coroutine` 错误，`TCP` 服务会直接关闭连接，`Http` 服务会返回 Http 的 503 状态码。
> - 在服务器程序中实际最大可创建协程数量等于 `worker_num * max_coroutine`，[task 进程](/zh/server/process_thread.html#task) 和 [user 进程](/zh/server/process_thread.html#user) 的协程数量单独计算。

## max_concurrency

限制 `HTTP`、`HTTP2` 服务器最大并发请求数量，超过该值之后，以后的请求会返回 `503` 错误，默认值为 `4294967295`，即为无符号 `int` 的最大值。

**示例**

```php
<?php
$server->set(['max_concurrency' => 10000]);
```

## worker_max_concurrency

开启一键协程化之后，`worker` 进程会源源不断的接受请求，为了避免压力过大，我们可以设置 `worker_max_concurrency` 限制 `worker` 进程的请求执行数。

**示例**

```php
<?php
$server->set(['worker_max_concurrency' => 10000]);
```

> [!WARNING]
> **注意**
>
> - 当请求数超过该值时，`worker` 进程会将多余的请求暂存于队列，默认值为 `4294967295`，即为无符号 `int` 的最大值。
> - 如果没有设置 `worker_max_concurrency`，但是设置了 `max_concurrency` 的话，底层会自动设置 `worker_max_concurrency` 等于 `max_concurrency`。
> - 如果进程重启时队列中仍有未处理的请求，底层会遍历整个队列，并向其中的每个请求逐一返回 `503 Service Unavailable`。
> - 可以这样理解：`worker_max_concurrency` 限制的是**单个进程**的并发处理能力，而 `max_concurrency` 限制的是**整个服务器**的总并发处理能力，即所有进程正在处理的请求总数不能超过该值。

> [!TIP]
> Swoole 版本 >= `5.0.0` 可用。

## max_idle_time

该配置指定 TCP 连接的最大空闲时长。若连接在 `max_idle_time` 内未发生任何读写操作，底层将主动关闭该连接。默认值为 `0`，表示不启用超时检查。

**示例**

```php
<?php
$server->set([
    'max_idle_time' => 10, // 单位为秒
]);
```

> [!WARNING]
> **注意**
>
> - 被切断的连接依然会触发 [close 事件回调](/zh/server/events.html#close)。
> - 与 [heartbeat_idle_time](/zh/server/setting.html#heartbeat-idle-time) 不同，该配置从**读写**两个维度判断连接是否空闲，而 `heartbeat_idle_time` 仅判断客户端是否发送过数据。

## heartbeat_idle_time

客户端 `TCP` 连接最大允许空闲的时间，单位为秒。表示一个客户端连接如果 `heartbeat_idle_time` 秒内未向服务器发送任何数据，此连接将被强制关闭。

**示例**

```php
<?php
$server->set([
    'heartbeat_idle_time' => 3,       // 表示一个连接如果3秒内未向服务器发送任何数据，此连接将被强制关闭
    'heartbeat_check_interval' => 60, // 表示每60秒遍历一次
]);
```

> [!WARNING]
> **注意**
>
> - 启用 `heartbeat_idle_time` 后，服务器并不会主动向客户端发送数据包。
> - 如果只设置了 `heartbeat_idle_time` 未设置 `heartbeat_check_interval` 底层将不会创建心跳检测线程。
> - 如果没有设置 `heartbeat_idle_time`，只设置了 `heartbeat_check_interval`，那么 `heartbeat_idle_time` 会设置为 `heartbeat_check_interval` 的两倍。

## heartbeat_check_interval

每隔多少秒发一次 `TCP` 连接心跳检测，默认值为 `0`，表示不开启心跳检测。

**示例**

```php
<?php
$server->set([
    'heartbeat_idle_time' => 3,       // 表示一个连接如果3秒内未向服务器发送任何数据，此连接将被强制关闭
    'heartbeat_check_interval' => 60, // 表示每60秒遍历一次
]);
```

> [!WARNING]
> **注意**
>
> - 服务端并不会主动向客户端发送心跳包，而是被动等待客户端发送心跳。服务器端的 `heartbeat_check` 仅仅是检测连接上一次发送数据的时间，如果超过限制，将切断连接。
> - 此选项表示每隔多久轮循一次，单位为秒。如 `heartbeat_check_interval => 60`，表示每 60 秒，遍历所有连接，如果该连接在 `heartbeat_idle_time` 秒内没有向服务器发送任何数据，此连接将被强制关闭。
> - 若未配置，则不会启用心跳，该配置默认关闭。
> - 被心跳检测切断的连接依然会触发 [close 事件回调](/zh/server/events.html#close)。

## max_wait_time

设置 [worker 进程](/zh/server/process_thread.html#worker) 收到停止服务通知后最大等待时间，默认值：`3`，超过该时间进程还没退出，该进程会被强制杀死。

**示例**

```php
<?php
$server->set(['max_wait_time' => 30]);
```

> [!WARNING]
> **注意**
>
> - 经常会碰到由于 `worker` 阻塞卡顿导致 `worker` 无法正常 `重启`，无法满足一些生产场景，例如发布代码热更新需要 `reload` 进程。所以，Swoole 加入了进程重启超时时间的选项。详细信息请参见 **如何正确的重启服务**。
> - **管理进程收到重启、关闭信号后或者达到 `max_request` 时，管理进程会重启该 `worker` 进程。分以下几个步骤：**
>     - 底层会增加一个（`max_wait_time`）秒的定时器，触发定时器后，检查进程是否依然存在，如果是，会强制杀掉，重新拉一个进程。
>     - 需要在 [workerStop 事件](/zh/server/events.html#workerstop) 里面做收尾工作，需要在 `max_wait_time` 秒内完成收尾。
>     - 依次向目标进程发送 `SIGTERM` 信号，杀掉进程。

## max_queued_bytes

设置 [reactor 线程](/zh/server/process_thread.html#master) 与 [worker 进程](/zh/server/process_thread.html#worker) 之间，针对单个客户端连接的数据转发队列大小上限。默认值为 `0`，表示不限制。

`reactor` 线程和 `worker` 进程共享客户端连接，当 `reactor` 线程转发客户端数据给 `worker` 进程时，会在该连接上记录当前已积压但尚未被 `worker` 进程处理的数据量，如果大于 `max_queued_bytes`，`reactor` 线程会暂停接收这个客户端发送过来的数据。待积压数据被 `worker` 进程处理至低于阈值后，`reactor` 线程自动恢复该连接的数据接收。

**示例**

```php
<?php
$server->set([
    'max_queued_bytes' => '2M', // 这里可以添加单位，底层会自动解析
]);
```

> [!WARNING]
> **注意**
>
> - 该配置只在 [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#swoole-process) 生效。
> - 当连接因积压数据超过 `max_queued_bytes` 而被暂停接收后，系统会采用指数退避定时器检查积压量，若阈值过小或 `worker` 进程处理过慢，可能导致客户端长时间无法恢复接收。

## package_max_length

设置能接收的最大数据包尺寸，单位为字节。默认值：`2M` 即 `2 * 1024 * 1024`，最小值为 `64K`。

此参数不宜设置过大，否则会占用很大的内存。

**示例**

```php
<?php
$server->set(['package_max_length' => 2 * 1024 * 1024]);
```

> [!WARNING]
> **注意**
>
> - 开启协议解析后，Swoole 底层会自动进行数据包拼接。在完整接收一个数据包之前，所有数据都会保存在内存中，因此必须通过 `package_max_length` 限制单个数据包的最大内存占用。例如，若有 1 万个 TCP 连接同时发送 `2M` 大小的数据包，极端情况下内存占用可能高达 `20G`。
> - 不同协议模式下，`package_max_length` 的作用机制如下：
>     - `open_length_check`：当检测到数据包长度超过 `package_max_length` 时，Swoole 会直接丢弃该数据包并关闭连接，不会占用额外内存。
>     - `open_eof_check`：由于无法预先获知数据包长度，接收到的数据会持续保存在内存中，导致内存占用不断增长。一旦内存占用超过 `package_max_length`，Swoole 会丢弃该数据包并关闭连接。
>     - `open_http_protocol`：`GET` 请求最大允许 `8K`，且该限制不可修改。`POST` 请求会检查 `Content-Length`，若其值超过 `package_max_length`，Swoole 将直接丢弃数据包，返回 `HTTP 400` 错误并关闭连接。

## open_eof_check

此选项用于检测客户端发来的数据：仅当数据包 `结尾` 匹配指定分隔符（如 `\r\n`）时，底层才会停止接收数据；否则，数据将被持续拼接，直到超出缓存区限制或接收超时才会中止。

**示例**

```php
<?php
$server->set([
    'open_eof_check' => true,
    'package_eof' => '\r\n',
]);
```

> [!WARNING]
> **注意**
>
> - 性能极高，几乎无额外开销。
> - 若检测过程发生错误，底层会将其视为恶意连接，直接丢弃数据并强制关闭连接。参考 **TCP 数据包边界问题**。
> - 此配置仅适用于流类型的套接字（例如 TCP、Unix Socket Stream）。对于指定分隔符检测，系统不会在数据流中间查找指定分隔符，因此 [worker 进程](/zh/server/process_thread.html#worker) 可能会一次性收到多个数据包。你需要在应用层代码中自行拆分数据包，例如使用 `explode("\r\n", $data)` 进行分包处理。

## open_eof_split

底层逐字节扫描数据流，每次遇到指定分隔符（如 `\r\n`）就自动切分并交付一个完整数据包给 [worker 进程](/zh/server/process_thread.html#worker)。

**示例**

```php
<?php
$server->set([
    'open_eof_split' => true,
    'package_eof' => '\r\n',
]);
```

> [!WARNING]
> **注意**
>
> - 启用 `open_eof_split` 后，底层会在数据流中查找指定分隔符并自动拆分数据包，确保 [receive 回调](/zh/server/events.html#receive) 每次都只收到一个以该分隔符结尾的完整数据包。
> - [open_eof_check](/zh/server/setting.html#open-eof-check) 仅检查数据包末尾是否包含指定分隔符，性能极佳、几乎无额外开销，但无法解决多包合并问题：当客户端连续发送多个带 EOF 的数据包时，底层可能一次性全部返回，需要业务层自行拆包。
> - `open_eof_split` 采用从左到右的逐字节扫描方式查找指定分隔符来拆分数据包，性能较差，且每次仅返回一个数据包。
> - `open_eof_split` 优先级大于 `open_eof_check`。

## package_eof

设置数据包指定分隔符。

**示例**

```php
<?php
$server->set([
    'open_eof_split' => true,
    'package_eof' => '\r\n',
]);
```

> [!TIP]
> `package_eof` 最大只允许传入 `8` 个字节的字符串。

## open_length_check

启用数据包长度检测协议解析功能。默认值为 `false`。参考 **TCP 数据包边界问题**。

**示例**

```php
<?php
$server->set(['open_length_check' => true]);
```

> [!WARNING]
> **注意**
>
> - 开启后，服务器底层会自动根据你设定的规则，可以保证 [reactor 线程](/zh/server/process_thread.html#master) 或者 [worker 进程](/zh/server/process_thread.html#worker) 每次都会收到一个完整的数据包。

## package_length_type

指定长度字段的类型（如 `N` 表示 4 字节无符号长整型）。与 `PHP` 的 `pack` 函数一样。告诉服务器：长度字段占几个字节，以及这些字节的排列顺序（字节序）。

**示例**

```php
<?php
$server->set(['package_length_type' => 'N']);
```

**注意**

目前 Swoole 支持 10 种长度字段类型：

| 字符参数 | 作用 |
|:---|:---|
| `c` | 有符号、1 字节 |
| `C` | 无符号、1 字节 |
| `s` | 有符号、主机字节序、2 字节 |
| `S` | 无符号、主机字节序、2 字节 |
| `n` | 无符号、网络字节序、2 字节 |
| `N` | 无符号、网络字节序、4 字节 |
| `l` | 有符号、主机字节序、4 字节（小写 L） |
| `L` | 无符号、主机字节序、4 字节（大写 L） |
| `v` | 无符号、小端字节序、2 字节 |
| `V` | 无符号、小端字节序、4 字节 |

## package_length_offset

定位长度字段位置的核心参数。它告诉服务器：“长度字段这个值，存放在整个数据包的第几个字节”。

因为有些协议设计不一定总是把长度字段放在数据包的最开头。可能包头还有其他固定信息。长度字段可能偏移几个字节后才出现。

**示例**

假设你的协议格式如下：

```text
[ magic: 2字节 ] [ command: 2字节 ] [ length: 4字节 ] [ body: N字节 ]
字节0-1           字节2-3           字节4-7         字节8开始
```

长度字段 length 位于字节 4、5、6、7（共 4 字节），那么配置就是：

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4字节无符号长整型
    'package_length_offset' => 4,        // 长度字段从第4字节开始 
    'package_body_offset'   => 8,        // 包体从第8字节开始（跳过整个包头）
    'package_max_length'    => 81920,
]);
```

> [!WARNING]
> **注意**
>
> - 偏移量一定是从 `0` 开始的。

## package_body_offset / package_body_start

定位包体数据起始位置的偏移量。告诉服务器：真正的业务数据（包体）从数据包的第几个字节开始。

**示例 1**

假设你的协议格式如下：

```text
[ magic: 2字节 ] [ command: 2字节 ] [ length: 4字节 ] [ body: N字节 ]
字节0-1           字节2-3           字节4-7         字节8开始
```

body 从第 8 个字节开始，那么配置就是：

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4字节无符号长整型
    'package_length_offset' => 4,        // 长度字段从第4字节开始 
    'package_body_offset'   => 8,        // 包体从第8字节开始（跳过整个包头）
    'package_max_length'    => 81920,
]);
```

**示例 2**

假设你的协议格式如下：

```text
[ magic: 2字节 ] [ command: 2字节 ] [ length: 4字节 ] [ type: 4字节 ] [ body: N字节 ]
字节0-1           字节2-3           字节4-7            字节8-11       字节12开始
```

body 从第 12 个字节开始，那么配置就是：

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4字节无符号长整型
    'package_length_offset' => 4,        // 长度字段从第4字节开始 
    'package_body_offset'   => 12,        // 包体从第12字节开始（跳过整个包头）
    'package_max_length'    => 81920,
]);
```

> [!WARNING]
> **注意**
>
> - 偏移量一定是从 `0` 开始的。

## package_length_func

自定义一个 `PHP` 函数来告诉 `Swoole` 一个完整数据包究竟有多长。

这个函数会接收当前接收到的部分数据（存储在一个缓冲区中），然后你需要在这个函数里实现你的核心逻辑：解析并返回整个数据包的长度。

**回调签名**

```php
<?php
function(string $data): int {}
```

**参数**

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 当前接收到的部分数据 | 必填 |

**返回值**

- 返回 `0`：数据不足，需等待并接收更多数据。
- 返回 `-1`：数据错误，底层将自动关闭连接。
- 返回 `>0`：成功获取包长（该值即完整数据包的长度）。

**示例**

下面这个例子模拟了一个简单文本协议，其中数据包的格式为 "LENGTH:xxx\nBODY:yyy"，你需要从数据中解析出 xxx 作为长度。

```php
<?php
$server->set([
    'open_length_check'   => true,          // 1. 必须开启
    'package_max_length'  => 81920,         // 2. 设置最大包长限制
    'package_length_func' => function ($data) {
        // 3. 定义你的解析逻辑
        // 检查是否已经接收到足够的数据，以便解析出长度值
        if (strlen($data) < 16) {
            return 0; // 数据不够，返回0，继续等待更多数据
        }

        // 假设协议是 "LENGTH:123\n"，用正则从收到的数据开头提取长度
        if (preg_match('/^LENGTH:(\d+)\\\n/', $data, $match)) {
            $length = (int)$match[1];
            
            // 获取整个包头的长度，以便计算完整包长
            $header_length = strlen($match[0]);
            
            // 返回整个数据包的总长度 = 包头长度 + 包体长度
            return $header_length + $length;
        }

        // 如果连包头都不符合协议规范，返回 -1，让 Swoole 关闭这个连接
        return -1;
    }
]);
```

> [!WARNING]
> **注意**
>
> - `package_length_func` 主要用来处理那些"无法用一个固定偏移量就读取到长度"的复杂协议。
> - 请勿在长度解析函数中执行阻塞 IO 操作，可能导致所有 [reactor 线程](/zh/server/process_thread.html#master) 或者 [worker 进程](/zh/server/process_thread.html#worker) 发生阻塞。
> - 由于 `ZendVM` 不支持运行在多线程环境，因此底层会自动使用 `Mutex` 互斥锁对 `PHP` 长度函数进行加锁，避免并发执行 `PHP` 函数。

> [!TIP]
> Swoole 版本 >= `1.9.3` 可用。

## upload_max_filesize

设置 `HTTP`，`HTTP2` 服务器允许上传的文件大小上限。防止大文件上传耗尽服务器内存，提升服务稳定性。

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
> - `upload_max_filesize` 用于允许 `HTTP` 服务器接收大文件。当接收到的请求报文大小超过 [package_max_length](/zh/server/setting.html#package-max-length) 但未超过 `upload_max_filesize` 时，服务器不会丢弃数据，而是将请求体内容写入磁盘临时文件，不在内存中保留副本。后续处理时再从文件中读取数据，从而避免内存溢出。
> - 必须配合 `package_max_length` 和 `php` 的 `memory_limit` 使用（两者是硬性上限）。

> [!TIP]
> `Swoole 5.0.0` 以上可以使用。

## upload_tmp_dir

设置 `HTTP`，`HTTP2` 服务器文件上传的临时存储路径，默认值为 `/tmp`。

**示例**

```php
<?php
$server->set([
  'upload_tmp_dir' => '/data/uploadfiles/',
]);
```

## aio_core_worker_num

设置异步线程池最小线程数，默认为 `CPU` 核数。

**示例**

```php
<?php
$server->set([
  'aio_core_worker_num' => 10
]);
```

## aio_worker_num

设置异步线程池最大线程数，默认为 `CPU` 核数 * 8。

**示例**

```php
<?php
$server->set([
  'aio_worker_num' => 80
]);
```

## aio_max_wait_time

设置任务最大等待时间，单位为秒。

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
> - 如果每个线程都有任务在处理，但是队列积压的任务的等待时间已经超过了 `aio_max_wait_time`，底层会扩容出新的线程来处理任务。
> - 扩容的新线程 + 现有线程数不会超过 [aio_worker_num](/zh/server/setting.html#aio-worker-num)。

## aio_max_idle_time

设置异步线程池线程的空闲时间，单位为秒，超过该时间没有接收到任务的线程将会被回收。

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
> - 在底层回收空闲线程时，底层会保证线程数不会少于 [aio_core_worker_num](/zh/server/setting.html#aio-core-worker-num)。

## iouring_entries

设置 `io_uring` 的队列大小时，默认值为 8192。若传入的值不是 2 的幂次方，内核会将其调整为**大于该值且最接近的 2 的幂次方数**。

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
> - 如果传入的值过大，内核会抛出异常并且终止程序。
> - 当系统安装了 `liburing` 和编译 `Swoole` 开启了 [--enable-iouring](/zh/start/install.html#编译选项详解) 之后才能使用。

> [!TIP]
> `Swoole 6.0` 以上可以使用。

## iouring_workers

设置 `io_uring` 的工作线程数，默认值是 `CPU 核数 * 4`。

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
> - 如果传入的值过大，内核会抛出异常并且终止程序。
> - 当系统安装了 `liburing` 和编译 `Swoole` 开启了 [--enable-iouring](/zh/start/install.html#编译选项详解) 之后才能使用。

> [!TIP]
> `Swoole 6.0` 以上可以使用。

## iouring_flag

设置 `io_uring` 的工作模式，默认值为 `SWOOLE_IOURING_DEFAULT`。

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
> - 如果传入的模式不正确，内核会统一使用 `SWOOLE_IOURING_DEFAULT` 中断驱动模式。
> - `SWOOLE_IOURING_DEFAULT`，中断驱动模式，可通过系统调用 `io_uring_enter` 提交 `I/O` 请求，然后直接检查完成队列状态判断是否完成。
> - `SWOOLE_IOURING_SQPOLL`，内核轮询模式，内核会创建内核线程用于提交和收割 `I/O` 请求，几乎完全消除用户态内核态上下文切换，性能较好。
> - 当系统安装了 `liburing` 和编译 `Swoole` 开启了 [--enable-iouring](/zh/start/install.html#编译选项详解) 之后才能使用。

> [!TIP]
> `Swoole 6.0` 以上可以使用。

## reload_async

设置异步柔性重启开关。默认值：`true`

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
> - 将启用异步安全重启特性，[worker 进程](/zh/server/process_thread.html#worker) 会等待异步事件完成后再退出。详细信息请参见「如何正确的重启服务」。
> - `reload_async` 开启的主要目的是为了保证服务重载时，协程或异步任务能正常结束。
> - 在 `4.x` 版本中开启 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 时，底层会额外增加一个协程数量的检测，当前无任何协程时进程才会退出，开启时即使 `reload_async => false` 也会强制打开 `reload_async`。

## single_thread

设置 [master 进程](/zh/server/process_thread.html#master) 中的 `reactor` 线程数为 1。

**示例**

```php
<?php
$server->set([
    'single_thread' => true
]);
```

> [!WARNING]
> **注意**
>
> - 在 `PHP ZTS` 下，如果使用 [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#swoole-process)，一定要设置该值为 `true`。

## ssl_cert_file / ssl_key_file

设置 SSL 隧道加密。

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
> - 使用 `HTTPS` 服务时，浏览器必须信任所配置的 SSL 证书，否则页面会显示不安全。
> - 使用 `wss`（WebSocket over SSL）时，发起连接的页面也必须通过 `HTTPS` 访问。
> - 浏览器不信任 `SSL` 证书将无法使用 `wss`。
> - 文件必须为 `PEM` 格式，不支持 `DER` 格式，可使用 `openssl` 工具进行转换。

**`PEM` 转 `DER` 格式**

```shell
openssl x509 -in cert.crt -outform der -out cert.der
```

**`DER` 转 `PEM` 格式**

```shell
openssl x509 -in cert.crt -inform der -outform pem -out cert.pem
```

> [!TIP]
> 该配置需要编译 `Swoole` 时加入 `--enable-openssl` 选项，但在 `Swoole 6.2.0` 已经默认支持 `openssl`。

## ssl_compress

设置是否启用 `SSL/TLS` 压缩。

**示例**

```php
<?php
$server->set([
  'ssl_compress' => true
]);
```

## ssl_protocols

设置 OpenSSL 隧道加密的协议。默认值：`0`，支持全部协议。

支持的协议类型有 `SWOOLE_SSL_TLSv1`、`SWOOLE_SSL_TLSv1`、`SWOOLE_SSL_TLSv1`、`SWOOLE_SSL_TLSv1`、`SWOOLE_SSL_SSL`、`SWOOLE_SSL_SSLv3`。

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

是否验证服务端 SSL 证书的对端证书。默认值：`false`

**示例**

```php
<?php
$server->set(array(
  'ssl_client_cert_file' => '/path/to/cert_file',
  'ssl_verify_peer' => true,
));
```

> [!TIP]
> 默认关闭，即不验证客户端证书。若开启，必须同时设置 `ssl_client_cert_file` 选项

## ssl_client_cert_file

根证书文件路径，用于验证客户端证书（双向 SSL 认证中的 CA 根证书）。

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
> `TCP` 服务若验证失败，底层会主动关闭连接。

## ssl_allow_self_signed

是否允许自签名证书。默认值：`false`。

**示例**

```php
<?php
$server->set([
  'ssl_allow_self_signed' => true
]);
```

## ssl_cafile

当设置 `ssl_verify_peer` 为 `true` 时，用来验证远端证书所用到的 `CA` 证书。本选项值为 `CA` 证书在本地文件系统的全路径及文件名。

**示例**

```php
<?php
$server->set([
  'ssl_cafile' => '/etc/CA',
]);
```

## ssl_capath

如果未设置 `ssl_cafile`，或者 `ssl_cafile` 所指的文件不存在时，会在 `ssl_capath` 所指定的目录搜索适用的证书。该目录必须是已经经过哈希处理的证书目录。

**示例**

```php
<?php
$server->set([
  'ssl_capath' => '/etc/capath/',
]);
```

## ssl_verify_depth

如果证书链条层次太深，超过了本选项的设定值，则终止验证。

**示例**

```php
<?php
$server->set([
  'ssl_verify_depth' => 5
]);
```

## ssl_prefer_server_ciphers

决定当客户端（浏览器）和服务器建立加密连接时，由谁来选择使用哪种加密算法（密码套件）。

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
> - `true` 表示优先使用服务器端配置的加密套件顺序。
> - `false` 优先使用客户端（浏览器）提供的加密套件顺序。

## ssl_ciphers

设置 `Openssl` 加密算法，默认值为：`EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH`

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
> - `ssl_ciphers` 为空时，由 `openssl` 自行选择加密算法

## ssl_ecdh_curve

专门控制 `ECDH` 密钥交换过程中所使用的椭圆曲线。

**示例**

```php
<?php
$server->set([
  'ssl_ecdh_curve' => 'X25519:prime256v1:secp384r1'
]);
```

## ssl_dhparam

用于指定 Diffie-Hellman (DH) 密钥交换所使用的强参数。当服务器使用老式的 DHE 加密套件时，这个指令告诉服务器应该使用哪个“大质数文件”来生成临时的会话密钥，从而保证安全性。

**示例**

```php
<?php
$server->set([
  'ssl_dhparam' => '/etc/dhparam.pem'
]);
```

## ssl_sni_certs

设置 SNI (Server Name Identification) 证书。

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

是否启用 `WebSocket` 帧数据的压缩功能。启用后，仍需配合 `SWOOLE_WEBSOCKET_FLAG_COMPRESS` 标志位，对具体的帧单独进行压缩。

**示例1：单帧压缩（自动压缩）**

当 `websocket_compression` 设置为 `true`，并在发送帧时携带 `SWOOLE_WEBSOCKET_FLAG_COMPRESS`，`Swoole` 底层会自动对该帧数据进行 `zlib` 压缩后发送给客户端。

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
// 开启 WebSocket 压缩支持
$server->set(['websocket_compression' => true]);

$server->on('message', function (Server $server, Frame $frame) {
  // 发送时带上 SWOOLE_WEBSOCKET_FLAG_COMPRESS 标志，底层会自动使用 zlib 压缩该帧数据
  $server->push(
      $frame->fd,
      'Hello Swoole',
      SWOOLE_WEBSOCKET_OPCODE_TEXT,
      SWOOLE_WEBSOCKET_FLAG_FIN | SWOOLE_WEBSOCKET_FLAG_COMPRESS
  );
});

$server->start();
```

**示例2：连续帧压缩（手动压缩）**

当 `websocket_compression` 为 `true` 时，如果需要发送多个连续帧（分片消息），底层不会自动压缩，必须由开发者自行压缩数据并设置 `RSV1` 标志。

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
// 开启 WebSocket 压缩支持
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
> - 要求服务端与客户端在握手阶段均明确支持压缩；若任一方不支持，则整个通信流程中的消息均不会自动压缩。
> - `Ping`，`Pong` 和关闭帧这三个控制帧不会受到该配置的影响，控制帧不允许压缩。
> - 有关分片消息的处理机制及详细说明，可以查看 [Swoole\WebSocket\Server->push()](/zh/server/methods.html#push)。

## websocket_subprotocol

在 `WebSocket` 连接建立时，客户端和服务器协商确定双方都支持的消息格式或应用层协议。

**示例**

```php
<?php
$server->set([
    'websocket_subprotocol' => 'json',
]);
```

> [!NOTE]
> **说明**
>
> - 设置后握手响应的 HTTP 头会增加 `Sec-WebSocket-Protocol: {$websocket_subprotocol}`。具体使用方法请参考 `WebSocket` 协议相关 `RFC` 文档。
> - `WebSocket` 只提供了一个"全双工通信的管道"，但不管管道里传输的数据长什么样（是 JSON、是 XML、还是自定义二进制格式）。`Subprotocol` 就是告诉对方："我发的消息是按某某协议组织的，你能理解吗？"。

## open_websocket_ping_frame

该选项用于控制是否由使用者自行处理 `websocket` 客户端发来的 `Ping` 帧。默认值为 `false`，此时服务器会自动响应一个 `Pong` 帧给客户端。

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
> - 设置为 `true` 后，由客户端发送的 `Ping` 帧不会由底层自动处理，而是会触发 [message 事件](/zh/server/events.html#message)，由使用者自行处理。

## open_websocket_pong_frame

该选项用于控制是否由使用者自行处理 `websocket` 客户端发来的 `Pong` 帧。默认值为 `false`。

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
> - 设置为 `true` 后，由客户端发送的 `Pong` 帧不会由底层自动处理，而是会触发 [message 事件](/zh/server/events.html#message)，由使用者自行处理。

## open_websocket_close_frame

该选项用于控制是否由使用者自行处理 `websocket` 客户端发来的 `关闭` 帧。默认值为 `false`。

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
> - 设置为 `true` 后，由客户端发送的 `关闭` 帧不会由底层自动处理，而是会触发 [message 事件](/zh/server/events.html#message)，由使用者自行处理。

## http_compression

是否开启 `HTTP` 响应压缩，默认值为：`true`。

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
> - 该参数生效的前提是服务器至少支持 `brotli`、`gzip`、`deflate`、`zstd` 中的一种压缩算法。否则，由于缺乏可用的压缩功能，此参数将不会产生任何作用。

## http_compression_level / compression_level / http_gzip_level

设置 `HTTP` 响应压缩等级，范围是 1-9，等级越高压缩后的尺寸越小，但 CPU 消耗更多。默认为 1，最高为 9。

**示例**

```php
<?php
$http->set([
  'http_compression' => true,
  'http_compression_level' => 6
]);
```

## http_compression_min_length / compression_min_length

设置 `HTTP` 响应压缩的最小字节，超过该选项值才开启压缩。默认 20 字节。

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

设置需要压缩的响应类型。

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

设置底层在解析 `HTTP` 报文时是否启用 `Cookies` 解析，默认值为 `true`。若设置为 `false`，则不会对 `Cookies` 进行解析，原始的 `Cookies` 信息将保留在 [Swoole\Http\Request->header](/zh/server/class/request.html#header) 中。

**示例**

```php
<?php
$http->set([
  'http_parse_cookie' => true,
]);
```

## http_parse_post

设置底层在解析 `HTTP` 报文时是否启用 `POST` 解析，默认值为 `true`。若设置为 `false`，则不会对 `POST` 进行解析。

**示例**

```php
<?php
$http->set([
  'http_parse_post' => true,
]);
```

> [!NOTE]
> **说明**
>
> - 设置为 `true` 时自动将 `Content-Type` 为 `x-www-form-urlencoded` 的请求包体解析到 [Swoole\Http\Request->post](/zh/server/class/request.html#post) 中。
> - 设置为 `false` 时可以通过 [Swoole\Http\Request->getContent()](/zh/server/class/request.html#getcontent) 获取请求包体。

## http_parse_files

设置底层在解析 `HTTP` 报文时是否对用户上传文件进行解析，默认值为 `true`。若设置为 `false`，则不会对用户上传文件进行解析。

**示例**

```php
<?php
$http->set([
  'http_parse_files' => true,
]);
```

## http2_header_table_size

设置 `HTTP/2` 服务器中 `HPACK` 压缩动态表的最大大小的参数。

**示例**

```php
<?php
$http2->set([
  'http2_header_table_size' => 0x1
]);
```

## http2_enable_push

控制 `HTTP/2` 服务器是否启用 `Server Push`（服务端推送）功能的开关。

**示例**

```php
<?php
$http2->set([
  'http2_enable_push' => 0x2
]);
```

## http2_max_concurrent_streams

限制在单个 `HTTP/2` 连接上同时处于活跃状态的流（`Stream`）的最大数量。

**示例**

```php
<?php
$http2->set([
  'http2_max_concurrent_streams' => 256
]);
```

## http2_init_window_size

用于配置 `HTTP/2` 服务器流量控制中初始窗口大小的参数。

**示例**

```php
<?php
$http2->set([
  'http2_init_window_size' => '256K'
]);
```

## http2_max_frame_size

配置 `HTTP/2` 服务器中单个帧（`Frame`）最大有效载荷（`Payload`）大小的参数。

**示例**

```php
<?php
$http2->set([
  'http2_max_frame_size' => '256K'
]);
```

## http2_max_header_list_size

配置 `HTTP/2` 连接中允许接收的最大头部列表大小的参数。

**示例**

```php
<?php
$http2->set([
  'http2_max_header_list_size' => '32K'
]);
```

## document_root

配置静态文件服务器根目录。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true
]);
```

当你访问 `http://127.0.0.1:9501/hello.txt` 时，如果 `/home/files/` 存在这份 `hello.txt` 文件，就会返回这份文件的内容给客户端。

当你访问 `http://127.0.0.1:9501/hello/hello.txt` 时，如果 `/home/files/hello/` 存在这份 `hello.txt` 文件，就会返回这份文件的内容给客户端。

> [!WARNING]
> **注意**
>
> - 设置 `document_root` 并设置 `enable_static_handler` 为 `true` 后，底层收到 `Http` 请求会先判断 `document_root` 路径下是否存在此文件，如果存在会直接发送文件内容给客户端，不再触发 [request 事件](/zh/server/events.html#request)。
> - 使用静态文件处理特性时，应当将动态 `PHP` 代码和静态文件进行隔离，静态文件存放到特定的目录。

> [!TIP]
> 这个功能比较简易，只能用于测试，禁止在互联网中使用。

## enable_static_handler

启动静态文件服务器。默认为：`false`。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true
]);
```

> [!TIP]
> 这个功能比较简易，只能用于测试，禁止在互联网中使用。

## static_handler_locations

设置静态处理器的路径。类型为数组，默认不启用。

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
> **说明**
>
> - 类似于 `Nginx` 的 `location` 指令，可以指定一个或多个路径为静态路径。只有 `URL` 在指定路径下才会启用静态文件处理器，否则会视为动态请求。
> - 必须以 `/` 开头。支持多级路径，如 `/app/images`。
> - 启用 `static_handler_locations` 后，如果请求对应的文件不存在，将直接返回 404 错误。

> [!TIP]
> 这个功能比较简易，只能用于测试，禁止在互联网中使用。

## url_rewrite_rules

静态文件服务器 URL 重写规则的配置采用数组形式。每个规则包含一个键值对，其中键（key）为正则表达式，用于匹配请求路径；值（value）为目标目录路径。当请求路径与某个键的正则表达式匹配成功时，该请求将被重写至对应的目标目录。

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

当访问 `http://127.0.0.1:9501/view/post/123` 时，该 URL 会匹配正则表达式 `~^/view/post/(\d+)$~`。匹配成功后，系统会在 `/home/files/static/` 目录下查找与捕获的数字（即 `123`）对应的 `123.html` 文件。如果该文件存在，则将其内容返回给客户端。

> [!TIP]
> 这个功能比较简易，只能用于测试，禁止在互联网中使用。

## http_autoindex

开启目录浏览功能，默认为：`false`。

当访问服务器上的一个目录，且该目录下没有默认的索引文件（如 index.html、index.php）时，服务器会自动生成一个该目录下的文件和子目录列表（目录索引），并以网页形式返回给客户端。类似 `Nginx` 的 `autoindex` 指令。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'http_autoindex' => true,
]);
```

当你直接访问 `http://127.0.0.1:9501` 时，就会返回整个 `/home/files/` 的文件路径。

> [!TIP]
> 这个功能比较简易，只能用于测试，禁止在互联网中使用。

## http_index_files

用于指定当客户端访问一个目录时，默认返回该目录下的哪个文件。类似 `Nginx` 的 `index` 指令。

**示例**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'http_index_files' => ['index.php'],
]);
```

访问 `http://127.0.0.1:9501/`，如果 `/home/files/` 存在 `index.php`，会将该文件返回给客户端。

> [!TIP]
> 这个功能比较简易，只能用于测试，禁止在互联网中使用。

## log_file

指定 `Swoole` 错误日志文件。

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
> - 在 `Swoole` 运行期发生的异常信息会记录到这个文件中，默认会打印到屏幕。
> - 开启守护进程模式后 `(daemonize => true)`，标准输出将会被重定向到 `log_file`。在 PHP 代码中 `echo/var_dump/print` 等打印到屏幕的内容会写入到 `log_file` 文件。
> - `log_file` 中的日志仅仅是做运行时错误记录，没有长久存储的必要。
> - `log_file` 不会自动切分文件，所以需要定期清理此文件。观察 `log_file` 的输出，可以得到服务器的各类异常信息和警告。
> - 在服务器程序运行期间，日志文件被 `mv` 移动或 `unlink` 删除后，日志信息将无法正常写入，这时可以向 [master 进程](/zh/server/process_thread.html#master) 或者 [manager 进程](/zh/server/process_thread.html#manager) 发送 `SIGRTMIN` 信号实现重新打开日志文件。
> - 在日志信息中，进程 ID 前会加一些标号，表示日志产生的线程/进程类型。`#` 表示 master 进程，`$` 表示 manager 进程，`*` 表示 [worker 进程](/zh/server/process_thread.html#worker)，`^` 表示 [task 进程](/zh/server/process_thread.html#task)。
> - `log_file` 不会记录 [user 进程](/zh/server/process_thread.html#user) 输出的日志。

## log_level

日志打印的等级，低于 `log_level` 设置的日志信息不会抛出。默认值：`SWOOLE_LOG_INFO`。

**示例**

```php
<?php
$http->set([
  'log_level' => SWOOLE_LOG_INFO
]);
```

支持的日志等级有：

| 常量名                  | 级别   | 说明                        |
|:---|:---|:---|
| `SWOOLE_LOG_DEBUG`   | 调试   | 调试日志，仅作为内核开发调试使用          |
| `SWOOLE_LOG_TRACE`   | 跟踪   | 跟踪日志，可用于跟踪系统问题，携带关键性信息    |
| `SWOOLE_LOG_INFO`    | 普通信息 | 普通信息，仅作为信息展示              |
| `SWOOLE_LOG_NOTICE`  | 提示   | 提示信息，系统可能存在某些行为，如重启、关闭    |
| `SWOOLE_LOG_WARNING` | 警告   | 警告信息，系统可能存在某些问题           |
| `SWOOLE_LOG_ERROR`   | 错误   | 错误信息，系统发生了某些关键性的错误，需要即时解决 |
| `SWOOLE_LOG_NONE`    | 无    | 相当于关闭日志信息，日志信息不会抛出        |

> [!WARNING]
> **注意**
>
> - `SWOOLE_LOG_DEBUG` 和 `SWOOLE_LOG_TRACE` 仅在编译为 [--enable-debug-log](/zh/start/install.html#编译选项详解) 和 [--enable-trace-log](/zh/start/install.html#编译选项详解) 版本时可用；
> - 在开启 `daemonize` 守护进程时，底层将把程序中的所有打印屏幕的输出内容写入到 [log_file](/zh/server/setting.html#log-file)，这部分内容不受 `log_level` 控制。

## log_date_format

设置日志时间格式，格式参考 [strftime](https://www.php.net/manual/zh/function.strftime.php) 的时间格式。

**示例**

```php
<?php
$server->set([
    'log_date_format' => '%Y-%m-%d %H:%M:%S',
]);
```

## log_date_with_microseconds

设置日志精度，是否带微秒，默认值：`false`。

**示例**

```php
<?php
$server->set([
    'log_date_with_microseconds' => false,
]);
```

## log_rotation

设置是否开启日志分割，默认值：`SWOOLE_LOG_ROTATION_SINGLE`。

**示例**

```php
<?php
$server->set([
    'log_rotation' => SWOOLE_LOG_ROTATION_SINGLE,
]);
```

支持的日志分割方式有：

| 常量                               | 说明  | 版本信息   |
|:---------------------------------|:----|:-------|
| SWOOLE_LOG_ROTATION_SINGLE       | 不启用 | -      |
| SWOOLE_LOG_ROTATION_MONTHLY      | 每月  | v4.5.8 |
| SWOOLE_LOG_ROTATION_DAILY        | 每日  | v4.5.2 |
| SWOOLE_LOG_ROTATION_HOURLY       | 每小时 | v4.5.8 |
| SWOOLE_LOG_ROTATION_EVERY_MINUTE | 每分钟 | v4.5.8 |

## open_http_protocol

启用 `HTTP` 协议报文解析。

**示例**

```php
<?php
use Swoole\Server;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 先起启动一个 HTTP 服务器 - 1
$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

// 再启动一个 HTTP 服务器 - 2
$port = $http->listen('127.0.0.1', 9502, SWOOLE_TCP);

// 如果你已经阅读了这个多端口监听的章节，就会知道这个是非必须的，因为子端口会继承父端口的配置，这里只是演示如何配置。
$port->set(['open_http_protocol' => true]); 

$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello World. #".rand(1000, 9999)."</h1>");
});

$http->start();
```

> [!WARNING]
> **注意**
>
> - [HTTP/HTTPS/HTTP2 服务器](/zh/server/http.html) 和 [WebSocket 服务器](/zh/server/websocket.html) 默认开启 `open_http_protocol`。
> - 该配置很少使用，一般用于 [多端口监听](/zh/server/port.html)。

## open_websocket_protocol

启用 `WebSocket` 协议报文解析。

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

// 如果你已经阅读了这个多端口监听的章节，就会知道这个是非必须的，因为子端口会继承父端口的配置，这里只是演示如何配置。
$port->set(['open_websocket_protocol' => true]); 

$port->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, "Hello World");
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - [WebSocket 服务器](/zh/server/websocket.html) 默认开启 `open_websocket_protocol`。
> - 该配置很少使用，一般用于 [多端口监听](/zh/server/port.html)。

## open_http2_protocol

启用 `HTTP2` 协议报文解析。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// 设置SSL证书
$http->set([
  'ssl_cert_file' => '/server.crt',
  'ssl_key_file' => '/server.key',
  'open_http2_protocol' => true  // 开启这个以便于解析http2协议
]);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

## open_mqtt_protocol

启用 `mqtt` 协议报文解析。

## open_redis_protocol

启用 `redis` 协议报文解析。

## socket_buffer_size

该配置控制着服务端向客户端发送数据的缓冲区大小，默认值为：`8M`。

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
> - 假设 `socket_buffer_size` 为 `8M`，需要发送 `20M` 的数据给客户端。此时会有两种情况：
>     - 网络非常好，`20M` 数据一次操作就发送给了客户端，不需要开辟缓冲区。
>     - 网络阻塞场景下，单次发送仅完成 `1M`，剩余 `19M` 数据会触发缓冲区首次开辟。**首次开辟缓冲区时，不校验数据量是否超过 `socket_buffer_size`**。这 `19M` 数据会直接存入缓冲区。后续若再发送 `2M` 数据，因缓冲区已非空，底层会先检查缓冲区中积压的数据总量是否已超出 `socket_buffer_size` 阈值。若当前缓冲区待发数据量超过 `socket_buffer_size`，则会报错。否则会将这 `2M` 数据存放在缓冲区。

## send_yield

开启协程后，若服务端向客户端发送的数据填满了发送数据的缓冲区，不会立即抛出错误，而是主动让出当前协程的 CPU，等待缓冲区中的数据发送完毕后，再切回当前协程继续发送。默认值：`true`。

**示例**

```php
<?php
$server->set([
  'send_yield' => true,
  'enable_coroutine' => true,
])
```

> [!WARNING]
> **注意**
>
> - 如果该配置被关闭，一旦发送的数据量大于 `socket_buffer_size`，底层会立马抛出 `connection#1 output buffer overflow` 的错误。

## send_timeout

设置发送超时，需与 `send_yield` 配合使用。若在指定时间内协程未能切回，且数据未能写入发送缓冲区，底层操作将返回 `false`，同时将错误码设为 `ETIMEDOUT`。此时，可通过 `getLastError()` 方法获取该错误码。单位为秒。

**示例**

```php
<?php
$server->set([
  'send_yield' => true,
  'send_timeout' => 1.5,
  'enable_coroutine' => true,
])
```

## socket_dns_timeout

控制域名解析超时时间，单位为秒。

**示例**

```php
<?php
$server->set([
  'socket_dns_timeout' => 10
]);
```

## socket_connect_timeout

控制 TCP 连接建立阶段的超时时间。它指的是客户端从发起 connect() 系统调用开始，到成功与服务器建立 TCP 三次握手连接为止的最大等待时间。单位为秒。

**示例**

```php
<?php
$server->set([
  'socket_connect_timeout' => 10
]);
```

## socket_write_timeout / socket_send_timeout

控制客户端向服务器发送数据的最大允许时间。单位为秒。

**示例**

```php
<?php
$server->set([
  'socket_write_timeout' => 10
]);
```

## socket_read_timeout / socket_recv_timeout

控制的是客户端等待接收数据的最大允许时间。它监控的是从发送完请求后，到完全接收完响应数据之间的整个过程。单位为秒。

**示例**

```php
<?php
$server->set([
  'socket_read_timeout' => 10
]);
```

## open_tcp_nodelay

关闭 `Nagle` 算法，让小数据包能立刻被发送出去，而不是等待合并。默认值：`false`。

**示例**

```php
<?php
$server->set([
  'open_tcp_nodelay' => false
]);
```

## open_tcp_keepalive

开启 TCP 的 KeepAlive 机制，让操作系统内核自动检测连接是否仍然有效，并自动清理已失效的连接。默认值：`false`。

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

TCP 连接在空闲多长时间后，系统内核才开始发送第一个 `KeepAlive` 探测包，检测这个连接是否还活着。单位为秒。

**示例**

```php
<?php
$server->set([
  'tcp_keepidle' => 5
]);
```

## tcp_keepinterval

TCP KeepAlive 探测包的发送间隔。它决定了在第一次探测没有收到响应后，每隔多久重新发送一次探测包。单位为秒。

**示例**

```php
<?php
$server->set([
  'tcp_keepinterval' => 5
]);
```

## tcp_keepcount

TCP KeepAlive 探测失败后，关闭连接前的最大重试次数。它决定了在收到探测包的响应之前，系统愿意尝试多少次。

**示例**

```php
<?php
$server->set([
  'tcp_keepinterval' => 100
]);
```

## tcp_defer_accept

- `tcp_defer_accept` 参数用于控制服务器在新建 TCP 连接时，是否延迟分配套接字和应用层资源。默认值为 `0`，表示采用标准行为：三次握手完成后，服务器立即分配资源并唤醒应用程序处理。
- 标准行为存在一个效率问题：若客户端建立连接后长时间不发送数据，服务器仍需维持该连接、占用资源，这就是“全连接攻击”的典型场景。
- 当设置了 `tcp_defer_accept`（单位：秒）后，服务器仅在收到客户端实际数据时才会分配完整资源。如果超过该时间仍未收到任何数据，连接将被主动丢弃，从而避免资源空耗。

**示例**

```php
<?php
$server->set([
  'tcp_defer_accept' => 5
]);
```

## tcp_user_timeout

- 当发送方发送数据后，如果迟迟收不到对方的 `ACK` 确认，TCP 会按指数退避算法重传数据。
- 累计重传时间一旦超过 `tcp_user_timeout` 的值，连接会被关闭。默认值为：0。单位为毫秒。

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

- 开启 TCP 快速握手特性，它允许在三次握手过程中就携带应用数据，从而减少一个 RTT（往返时间）的延迟。默认值为：`false`。


**示例**

```php
<?php
$server->set([
  'tcp_fastopen' => true
]);
```

## task_ipc_mode

- 设置 [worker 进程](/zh/server/process_thread.html#worker) 和 [task 进程](/zh/server/process_thread.html#task) 之间的通信方式，默认值为：`SWOOLE_IPC_UNSOCK`。


**示例**

```php
<?php
$server->set([
  'task_ipc_mode' => SWOOLE_IPC_UNSOCK,
]);
```

- 支持的通信方式有：

| 模式                    | 说明                                                                                                                                         |
|:---|:---|
| SWOOLE_IPC_UNSOCK     | 使用 Unix Socket 通信，支持定向投递。可在 `task` / `taskwait` 方法中通过 `dst_worker_id` 指定目标 Task 进程。<br>若 `dst_worker_id` 设为 `-1`，底层会自动选择当前空闲的 Task 进程进行投递。 |
| SWOOLE_IPC_MSGQUEUE   | 使用 sysvmsg 消息队列通信，支持定向投递（可通过 `$task_worker_id` 指定目标进程）。                                                                                    |
| SWOOLE_IPC_PREEMPTIVE | 使用 sysvmsg 消息队列通信，**争抢模式**。不支持定向投递，所有 task 进程争抢队列中的任务。即使指定 `$task_worker_id` 也无效。                                                          |

> [!WARNING]
> **注意**
>
> - `SWOOLE_IPC_MSGQUEUE` 和 `SWOOLE_IPC_PREEMPTIVE` 消息队列模式使用操作系统提供的内存队列存储数据。
> - 如果没有指定 [message_queue_key](/zh/server/setting.html#message-queue-key) 将使用私有队列，服务器停止后队列会被自动删除。否则使用持久化队列，服务器停止后队列数据不会被删除，重启后仍可读取。
> - 手动删除队列数据：可使用命令 `ipcrm -q <消息队列 ID>`。
> - `SWOOLE_IPC_PREEMPTIVE` 会影响 [Swoole\Server->sendMessage()](/zh/server/methods.html#sendmessage)，`worker` 进程发送的消息将被随机投递到某一个 `task` 进程。
> - 指定 `SWOOLE_IPC_MSGQUEUE` 和 `SWOOLE_IPC_PREEMPTIVE` 配置项，`task` 进程不支持协程，既不能开启 [task_enable_coroutine](/zh/server/setting.html#task-enable-coroutine)。
> - 若 `task进程` 处理能力低于任务投递速度，`worker进程` 可能会发生阻塞。

## message_queue_key

- 指定消息队列名。


**示例**

```php
<?php
$server->set([
  'message_queue_key' => 'swoole',
]);
```

> [!TIP]
> [task_ipc_mode](/zh/server/setting.html#task-ipc-mode) 为 `SWOOLE_IPC_MSGQUEUE` 或者 `SWOOLE_IPC_PREEMPTIVE` 才生效。

## task_tmpdir

- 设置 [worker 进程](/zh/server/process_thread.html#worker) 发送给 [task 进程](/zh/server/process_thread.html#task) 的数据的存储路径。

- 如果投递的数据超过 `8180` 字节，将启用临时文件来保存数据。这里的 `task_tmpdir` 就是用来设置临时文件保存的位置。


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
> - 底层默认会使用 `/tmp` 目录存储 `task` 数据，如果你的 `Linux` 内核版本过低，`/tmp` 目录不是内存文件系统，可以设置为 `/dev/shm/`。
> - `task_tmpdir` 目录不存在，底层会尝试自动创建，如果创建失败会导致服务器启动失败。

## backlog

- 控制 TCP 全连接队列（Accept Queue）的最大长度。


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
> - `TCP` 有三次握手的过程，客户端 `syn=>服务端` `syn+ack=>客户端` `ack`，当服务器收到客户端的 `ack` 后会将连接放到一个叫做 `accept queue` 的队列里面（注1）。
> - 队列的大小由 `backlog` 参数和配置 `somaxconn` 的最小值决定，可以通过 `ss -lt` 命令查看最终的 `accept queue` 队列大小，`Swoole` 的主进程调用 `accept`（注2）从 `accept queue` 里面取走。
> - 当 `accept queue` 满了之后连接有可能成功（注4），也有可能失败，失败后客户端的表现就是连接被重置（注3）或者连接超时，而服务端会记录失败的记录，可以通过 `netstat -s|grep 'times the listen queue of a socket overflowed` 来查看日志。如果出现了上述现象，你就应该调大该值了。幸运的是 `Swoole` 的 [SWOOLE_PROCESS](/zh/server/process_thread.html#swoole-process) 模式与 `PHP-FPM/Apache` 等软件不同，并不依赖 `backlog` 来解决连接排队的问题。所以基本不会遇到上述现象。
> - 注1: `linux2.2` 之后握手过程分为 `syn queue` 和 `accept queue` 两个队列, `syn queue` 长度由 `tcp_max_syn_backlog` 决定。
> - 注2: 高版本内核调用的是 `accept4`，为了节省一次 `set no block` 系统调用。
> - 注3: 客户端收到 `syn+ack` 包就认为连接成功了，实际上服务端还处于半连接状态，有可能发送 `rst` 包给客户端，客户端的表现就是 `Connection reset by peer`。
> - 注4: 成功是通过 TCP 的重传机制，相关的配置有 `tcp_synack_retries` 和 `tcp_abort_on_overflow`。

## buffer_low_watermark

- 设置服务端和客户端的缓冲区的低水位线。它本身不直接限制内存大小，而是作为一个预警阈值。单位为字节。默认值为：0。

- 底层为每个 `TCP` 连接维护了一个发送缓冲区，当向客户端发送数据时，数据会先进入发送缓存区。`buffer_low_watermark`
  就是监控这个缓存区大小的“警报器”。


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
> - 当缓存区中的数据量小于 `buffer_low_watermark` 设置的值时，会触发 `bufferEmpty` 事件。可以在事件回调中继续向该连接发送新数据。

## buffer_high_watermark

- 设置服务端和客户端的缓冲区的高水位线。它本身不直接限制内存大小，而是作为一个预警阈值。单位为字节。默认值为：`0`。

- 底层为每个 `TCP` 连接维护了一个发送缓冲区，当向客户端发送数据时，数据会先进入发送缓存区。`buffer_high_watermark`
  就是监控这个缓存区大小的“警报器”。


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
> - 当缓存区中的数据量超过 `buffer_high_watermark` 设置的值时，会触发 `bufferFull` 事件。可以在事件回调中暂停向该连接发送新数据，防止缓存区无限膨胀。

## open_cpu_affinity

- 启动 `CPU` 亲和性设置，默认值为：`false`。


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
> - 底层会根据 `reactor` 线程序号和 `worker` 进程序号和 `CPU` 核数取模来设置 `CPU` 绑定。
> - 在多核的硬件平台中，启用此特性会将 `Swoole` 的 [reactor 线程](/zh/server/process_thread.html#master) / [worker 进程](/zh/server/process_thread.html#worker) 绑定到固定的一个核上。可以避免进程 / 线程的运行时在多个核之间互相切换，提高 `CPU Cache` 的命中率。
> - 弊端是有可能进程 / 线程绑定的某个 `CPU核心` 非常繁忙，但是其它 `CPU核心` 却很空闲，导致 CPU 利用率低。

## cpu_affinity_ignore

- 将指定的 `CPU` 核心从 `CPU` 亲和性绑定中排除。


**示例**

```php
<?php
$server->set([
  'cpu_affinity_ignore' => [0, 1]   // CPU0,CPU1不会参与亲和性绑定。
]);
```

> [!NOTE]
> **注意**
>
> - `IO` 密集型程序中，所有网络中断都是用 `CPU0` 来处理，如果网络 IO 很重，`CPU0` 除了收包还要执行业务逻辑，导致负载过高会导致网络中断无法及时处理，那网络收发包的能力就会下降。
> - 为了避免上面的情况，此时利用 `cpu_affinity_ignore` 将 `CPU0` 排除就很有必要。让 `CPU0` 专心负责网络收包。
> - 如果内核与网卡有多队列特性，网络中断会分布到多核，可以缓解网络中断的压力。此时可以不用设置 `cpu_affinity_ignore`。


**如何查看网络中断在哪个 CPU 执行**

```shell
cat /proc/interrupts
```

- 会输出下面的结果

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

- eth0/eth1 就是网络中断的次数，如果 `CPU0` - `CPU3` 是平均分布的，证明网卡有多队列特性。如果全部集中于某一个核，说明网络中断全部由此 `CPU` 进行处理。
- 一旦此 `CPU` 超过 100%，系统将无法处理网络请求。这时就需要使用 `cpu_affinity_ignore` 设置将此 `CPU` 空出，专门用于处理网络中断。

> [!TIP]
> 此选项必须与 [open_cpu_affinity](/zh/server/setting.html#open-cpu-affinity) 同时设置才会生效。

## chroot

- 重定向 [worker 进程](/zh/server/process_thread.html#worker) 的文件系统根目录。

- 此设置可以使进程对文件系统的读写与实际的操作系统文件系统隔离。提升安全性。


**示例**

```php
<?php
$server->set([
  'chroot' => '/data/server/'
]);
```

## user

- 设置 [worker 进程](/zh/server/process_thread.html#worker) 和 [task 进程](/zh/server/process_thread.html#task) 所有者。

- 服务器如果需要监听 `1024` 以下的端口，必须有 `root` 权限。但程序运行在 `root` 用户下，代码中一旦有漏洞，攻击者就可以以 `root` 的方式执行远程指令，风险很大。

- 配置了 `user` 项之后，可以让 [master 进程](/zh/server/process_thread.html#master) 或者 [manager 进程](/zh/server/process_thread.html#manager) 运行在 `root` 权限下，子进程运行在普通用户权限下。


**示例**

```php
<?php
$server->set([
  'user' => 'www-data'
]);
```

> [!TIP]
> 只有用 `root` 启动程序才能修改进程所属用户，普通用户没有这个权限。

> [!TIP]
> `Swoole版本 < 6.2.0` 时，使用 `user` 配置项将工作进程设置为普通用户后，将无法在 `worker` 进程调用 [Swoole\Server->shutdown()](/zh/server/methods.html#shutdown) 或者 [Swoole\Server->reload()](/zh/server/methods.html#reload) 方法关闭或重启服务。只能使用 `root` 账户在 `shell` 终端执行 `kill` 命令。

## group

- 设置 [worker 进程](/zh/server/process_thread.html#worker) 和 [task 进程](/zh/server/process_thread.html#task) 所属组。

- 与 [user](/zh/server/setting.html#user) 配置相同，此配置是修改进程所属用户组，提升服务器程序的安全性。


**示例**

```php
<?php
$server->set([
  'group' => 'www-data'
]);
```

> [!TIP]
> 只有用 `root` 启动程序才能修改进程所属组，普通用户没有这个权限。

## pid_file

- 设置保存 `pid`（进程 id）的文件名。


**示例**

```php
<?php
$server->set([
  'pid_file' => '/tmp/swoole.pid'
]);
```

> [!TIP]
> 使用时需要注意如果服务非正常结束，`PID` 文件不会删除。

## print_backtrace_on_error

- 如果事件循环相关操作发生错误，是否打印出堆栈信息，默认值为：`false`。


**示例**

```php
<?php
$server->set([
  'print_backtrace_on_error' => true
])
```

## c_stack_size / stack_size

- 设置单个协程初始 C 栈的内存尺寸，默认为 2M。


**示例**

```php
<?php
$server->set([
  'c_stack_size' => '4 * 1024'
])
```

> [!NOTE]
> **注意**
>
> - 该值通常无需调整，默认设置即可满足绝大多数场景需求。

## event_object

- 该设置项用于控制事件回调机制将切换为 [面向对象模式](/zh/server/events.html#面向对象风格)。默认值为：`false`。


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
> - 和 [task_use_object / task_object](/zh/server/setting.html#task-use-object-task-object) 不同，`event_object` 的作用范围更广，控制粒度较粗。影响多个事件类型。
> - 受此设置影响的参数对象类共 5 个：[Swoole\Server\Event](/zh/server/class/event.html)、[Swoole\Server\Packet](/zh/server/class/packet.html)、[Swoole\Server\PipeMessage](/zh/server/class/pipe_message.html)、[Swoole\Server\StatusInfo](/zh/server/class/status_info.html)、[Swoole\Server\TaskResult](/zh/server/class/task_result.html)，事件与类的对应关系见 [面向对象风格](/zh/server/events.html#面向对象风格)。

> [!TIP]
> Swoole 版本 >= `v4.6.0` 可用

## debug_mode

- 设置日志模式为 `debug` 调试模式。


**示例**

```php
<?php
$server->set([
  'debug_mode' => true
])
```

> [!NOTE]
> **注意**
>
> - 使用该配置需要编译 `Swoole` 的时候需要开启 [--enable-debug](/zh/start/install.html#编译选项详解)。

## trace_flags

- 用于精确控制跟踪日志的输出范围。

- 底层支持以下跟踪项，可使用 `SWOOLE_TRACE_ALL` 表示跟踪所有项目：

| 标签                             | 说明                |
|:---|:---|
| `SWOOLE_TRACE_SERVER`          | 服务器事件             |
| `SWOOLE_TRACE_CLIENT`          | 客户端操作             |
| `SWOOLE_TRACE_BUFFER`          | 缓冲区操作             |
| `SWOOLE_TRACE_CONN`            | 连接管理              |
| `SWOOLE_TRACE_EVENT`           | 事件循环              |
| `SWOOLE_TRACE_WORKER`          | Worker 进程         |
| `SWOOLE_TRACE_MEMORY`          | 内存分配与释放           |
| `SWOOLE_TRACE_REACTOR`         | Reactor 线程        |
| `SWOOLE_TRACE_PHP`             | PHP 层调用           |
| `SWOOLE_TRACE_HTTP`            | HTTP 协议           |
| `SWOOLE_TRACE_HTTP2`           | HTTP2 协议          |
| `SWOOLE_TRACE_EOF_PROTOCOL`    | EOF 协议            |
| `SWOOLE_TRACE_LENGTH_PROTOCOL` | 长度协议              |
| `SWOOLE_TRACE_CLOSE`           | 连接关闭              |
| `SWOOLE_TRACE_WEBSOCKET`       | WebSocket 协议      |
| `SWOOLE_TRACE_REDIS_CLIENT`    | Redis 客户端         |
| `SWOOLE_TRACE_MYSQL_CLIENT`    | MySQL 客户端         |
| `SWOOLE_TRACE_HTTP_CLIENT`     | HTTP 客户端          |
| `SWOOLE_TRACE_AIO`             | 异步文件 I/O          |
| `SWOOLE_TRACE_SSL`             | SSL/TLS 加密        |
| `SWOOLE_TRACE_NORMAL`          | 普通日志              |
| `SWOOLE_TRACE_CHANNEL`         | Channel 通道        |
| `SWOOLE_TRACE_TIMER`           | 定时器               |
| `SWOOLE_TRACE_SOCKET`          | Socket 操作         |
| `SWOOLE_TRACE_COROUTINE`       | 协程调度              |
| `SWOOLE_TRACE_CONTEXT`         | 协程上下文             |
| `SWOOLE_TRACE_CO_HTTP_SERVER`  | 协程 HTTP 服务器       |
| `SWOOLE_TRACE_TABLE`           | 内存表操作             |
| `SWOOLE_TRACE_CO_CURL`         | 协程 CURL           |
| `SWOOLE_TRACE_CARES`           | c-ares DNS 解析     |
| `SWOOLE_TRACE_ZLIB`            | 压缩/解压             |
| `SWOOLE_TRACE_CO_PGSQL`        | 协程 PostgreSQL 客户端 |
| `SWOOLE_TRACE_CO_ODBC`         | 协程 ODBC 客户端       |
| `SWOOLE_TRACE_CO_ORACLE`       | 协程 Oracle 客户端     |
| `SWOOLE_TRACE_CO_SQLITE`       | 协程 SQLite 客户端     |
| `SWOOLE_TRACE_CO_FIREBIRD`     | 协程 Firebird 客户端   |
| `SWOOLE_TRACE_CO_SSH2`         | 协程 SSH2 客户端       |
| `SWOOLE_TRACE_THREAD`          | 线程操作              |
| `SWOOLE_TRACE_ALL`             | 启用所有跟踪项           |

> [!NOTE]
> **注意**
>
> - 多个标签可用 `|` 组合：`SWOOLE_TRACE_SERVER | SWOOLE_TRACE_HTTP2`
> - 该配置需要在编译 `Swoole` 的时候开启 [--enable-trace-log](/zh/start/install.html#编译选项详解)。
