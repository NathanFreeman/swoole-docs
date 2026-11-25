# 方法

## __construct

创建一个异步风格的服务器。

```php
public function __construct(string $host = '0.0.0.0', int $port = 0, int $mode = SWOOLE_BASE, int $sock_type = SWOOLE_SOCK_TCP)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 指定监听的 IP 地址。IPv4 使用 `127.0.0.1` 表示监听本机，`0.0.0.0` 表示监听所有地址。IPv6 使用 `::1` 表示监听本机，`::`（相当于 `0:0:0:0:0:0:0:0`）表示监听所有地址 | `'0.0.0.0'` |
| `$port` | 指定监听的端口，如 `9501`。监听小于 `1024` 端口需要 `root` 权限。如果此端口被占用，启动服务器时会失败 | `0` |
| `$mode` | 指定运行模式。其它值：[SWOOLE_PROCESS](/zh/server/process_thread.html#工作模式) 多进程模式，[SWOOLE_THREAD](/zh/server/process_thread.html#工作模式) 多线程模式（Swoole 6.0 可用） | [SWOOLE_BASE](/zh/server/process_thread.html#工作模式) 基本模式（默认） |
| `$sock_type` | 指定这组服务器的类型。其它值：<br>`SWOOLE_SOCK_TCP`：tcp ipv4 socket<br>`SWOOLE_SOCK_TCP6`：tcp ipv6 socket<br>`SWOOLE_SOCK_UDP`：udp ipv4 socket<br>`SWOOLE_SOCK_UDP6`：udp ipv6 socket<br>[SWOOLE_UNIX_DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php)：unix socket dgram<br>[SWOOLE_UNIX_STREAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/stream_server.php)：unix socket stream | `SWOOLE_SOCK_TCP` |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->start();
```

> [!NOTE]
> `$sock_type` 为 `SWOOLE_UNIX_DGRAM` 或者 `SWOOLE_UNIX_STREAM`，`$port` 参数会被忽略。
> 使用 `$sock_type` | `SWOOLE_SSL` 可以启用 `SSL` 隧道加密。启用 `SSL` 后必须配置 [ssl_key_file](/zh/server/setting.html#ssl-cert-file-ssl-key-file) 和 [ssl_cert_file](/zh/server/setting.html#ssl-cert-file-ssl-key-file)。

## set

设置服务器运行时[配置](/zh/server/setting.html)。

```php
public function set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 设置服务器运行时的配置 | 必填 |

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);
$server->start();
```

> [!WARNING]
> `set` 该方法必须在 `start` 之前调用。

## on

注册服务器[事件回调函数](/zh/server/events.html)。

```php
public function on(string $event_name, callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event_name` | `Swoole` 提供了非常全面的事件回调机制，具体支持的所有事件名称，详见文档：[回调事件](/zh/server/events.html) | 必填 |
| `$callback` | 设置事件回调函数 | 必填 |

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

根据事件名，获取对应的回调函数。

```php
public function getCallback(string $event_name): \Closure|string|null|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event_name` | 事件回调名 | 必填 |

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

增加监听的[子端口](/zh/server/port.html)。

```php
public function listen(string $host, int $port, int $sock_type): false|Swoole\Server\Port
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 指定监听的 IP 地址。IPv4 使用 `127.0.0.1` 表示监听本机，`0.0.0.0` 表示监听所有地址。IPv6 使用 `::1` 表示监听本机，`::`（相当于 `0:0:0:0:0:0:0:0`）表示监听所有地址 | 必填 |
| `$port` | 指定监听的端口，如 `9501`。监听小于 `1024` 端口需要 `root` 权限。如果此端口被占用，启动服务器时会失败 | 必填 |
| `$sock_type` | 指定这组服务器的类型。其它值：<br>`SWOOLE_SOCK_TCP`：tcp ipv4 socket<br>`SWOOLE_SOCK_TCP6`：tcp ipv6 socket<br>`SWOOLE_SOCK_UDP`：udp ipv4 socket<br>`SWOOLE_SOCK_UDP6`：udp ipv6 socket<br>[SWOOLE_UNIX_DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php)：unix socket dgram<br>[SWOOLE_UNIX_STREAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/stream_server.php)：unix socket stream | 必填 |

**返回值**：返回 [Swoole\Server\Port](/zh/server/class/port.html) 表示操作成功，返回 `false` 表示操作失败。

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

向任意[worker进程](/zh/server/process_thread.html#进程-线程)或者[task进程](/zh/server/process_thread.html#进程-线程)发送数据，收到消息的进程会触发[pipeMessage事件](/zh/server/events.html#pipemessage)。

```php
public function sendMessage(mixed $message, int $workerId): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$message` | 为发送的消息数据内容，没有长度限制，但超过 `8K` 时会启动内存临时文件 | 必填 |
| `$workerId` | 目标进程的 `ID`，范围参考 [$worker_id](/zh/server/properties.html#worker-id) | 必填 |

**返回值**：成功返回 `true`，失败返回 `false`。

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
> 在 `worker` 进程内调用 `sendMessage` 是异步的，消息会先存到缓冲区，可写时才发送此消息。
> 在 `task` 进程或者[user进程](/zh/server/process_thread.html#进程-线程)内调用 `sendMessage` 默认是同步 IO，但有些情况会自动转换成异步 IO，参考「同步 IO 转换成异步 IO」。

> [!WARNING]
> 使用 `sendMessage` 必须注册 `pipeMessage` 事件回调函数。
> 当[task_ipc_mode](/zh/server/setting.html#task-ipc-mode)为 `SWOOLE_IPC_PREEMPTIVE`，将无法向特定进程发送数据。

## addProcess

添加一个用户自定义的[user进程](/zh/server/process_thread.html#进程-线程)。此函数通常用于创建一个特殊的工作进程，用于监控、上报或者其他特殊的任务。

```php
public function addProcess(Swoole\Process $process): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$process` | `Swoole\Process` 对象 | 必填 |

**返回值**：返回进程 id 编号表示操作成功，否则程序会抛出致命错误。

**示例**

```php
<?php
$server = new Swoole\Server('127.0.0.1', 9501);

/**
 * 用户进程实现了广播功能，循环接收unixSocket的消息，并发给服务器的所有连接
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
    //群发收到的消息
    $socket = $process->exportSocket();
    $socket->send($data);
});

$server->start();
```

> [!WARNING]
> `user进程` 内可以使用 [send](/zh/server/methods.html#send)，[close](/zh/server/methods.html#close) 方法，不能使用 [task](/zh/server/methods.html#task)，[taskwait](/zh/server/methods.html#taskwait) 和 [taskCo](/zh/server/methods.html#taskco) 方法。
> `user进程` 内可以使用 [sendMessage](/zh/server/methods.html#sendmessage) 与[worker进程](/zh/server/process_thread.html#进程-线程)或者[task进程](/zh/server/process_thread.html#进程-线程)通信。
> `user进程` 在代码中使用 `while(true)` 或者创建一个事件循环（例如定时器）来维持运行，否则用户进程会不停地退出重启。
> 必须在执行 [start](/zh/server/methods.html#start) 方法之前使用 `addProcess`，否则 `user` 进程不会启动。

## start

启动服务器。

```php
public function start(): bool
```

**返回值**：成功返回 `true`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);
$server->start();
```

> [!WARNING]
> 启动成功后将进入事件循环，等待客户端连接请求。`start` 方法之后的代码在服务器停止前不会执行。

## stop

使指定的[worker进程](/zh/server/process_thread.html#进程-线程)停止运行，并立即触发[workerStop事件](/zh/server/events.html#workerstop)。

```php
public function stop(int $workerId = -1, bool $waitEvent = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$workerId` | 指定 `worker` [进程编号](/zh/server/properties.html#worker-id) | `-1`，表示当前进程 |
| `$waitEvent` | 控制退出策略。<br>`false`：表示立即退出，可能仍然有事件在等待。比如使用了发送了 `SQL` 语句，但还在等待 `MySQL` 服务器返回结果。这时如果进程强制退出，`SQL` 的执行结果就会丢失了。<br>`true`：表示底层将采用异步安全重启策略先通知[manager进程](/zh/server/process_thread.html#进程-线程)，重新启动一个新的 `worker` 来处理新的请求。当前旧的 `worker` 会等待事件，直到事件循环为空或者超过 `max_wait_time` 后，退出进程，最大限度的保证异步事件的安全性。<br>在 `v6.1.0` 版本之后，此参数已被移除，退出逻辑由 [reload_async](/zh/server/setting.html#reload-async) 选项控制 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->stop(rand(0, 3)); // 随机停止一个 worker 进程
});

$server->on('workerStop', function (Server $server, int $workerId) {
    echo "worker 停止，ID: {$workerId}\n";
});
$server->start();
```

## send

向客户端发送数据。

```php
public function send(int|string $fd, string $send_data, int $serverSocket = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定客户端的文件描述符或者 unix socket 路径 | 必填 |
| `$send_data` | 发送的数据，`TCP` 协议最大不得超过 `2M`，可修改 [socket_buffer_size](/zh/server/setting.html#socket-buffer-size) 改变允许发送的最大包长度 | 必填 |
| `$serverSocket` | 向[UnixSocket DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php)对端发送数据时需要此项参数，TCP 服务端不需要填写 | `-1`，表示当前监听的 udp 端口 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> 发送过程是异步的，底层会自动监听可写，将数据逐步发送给客户端，也就是说不是 `send` 返回后对端就收到数据了。
> `send` 操作具有原子性，多个进程同时调用 `send` 向同一个 `TCP` 连接发送数据，不会发生数据混杂。

> [!WARNING]
> 如果连续向同一个客户端发送大量数据，客户端来不及接收会导致内存缓存区塞满，Swoole 底层会立即返回 `false`。

> [!NOTE]
> 在[协程模式](/zh/server/setting.html#enable-coroutine)开启了 [send_yield](/zh/server/setting.html#send-yield) 情况下 `send` 遇到缓存区已满时会自动挂起，当数据被对端读走一部分后恢复协程，继续发送数据。

## sendfile

发送文件到 `TCP` 客户端连接。

```php
public function sendfile(int $fd, Swoole\SendFile|string $filename, int $offset = 0, int $length = 0, bool $delete_file = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定客户端的文件描述符 | 必填 |
| `$filename` | 要发送的文件路径，或一个 [Swoole\SendFile](/zh/server/class/send_file.html) 对象（`v6.3.0` 版本之后可用）。如果文件不存在会返回 `false` | 必填 |
| `$offset` | 指定文件偏移量，可以从文件的某个位置起发送数据 | `0`，表示从文件头部开始发送 |
| `$length` | 指定发送的长度 | `0`，即文件尺寸 |
| `$delete_file` | 发送任务结束时是否自动删除文件。`v6.3.0` 版本之后可用 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> - `$filename` 为 [Swoole\SendFile](/zh/server/class/send_file.html) 对象时，不得再传入 `$offset`、`$length`、`$delete_file` 参数，否则抛出 `ValueError`，发送选项以对象属性为准。
> - `$delete_file` 为 `true` 时，文件在发送任务结束时自动删除，包括发送失败或连接提前关闭的情况，适用于「先生成临时文件再发送」的场景。

## stats

得到当前服务器的活动 `TCP` 连接数，启动时间等信息，`accept/close`(建立连接/关闭连接)的总次数等信息。

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

| 参数                    | 作用                                                                                                                                                                                          |
|:----------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| start_time            | 服务器启动的时间                                                                                                                                                                                    |
| connection_num        | 当前连接的数量                                                                                                                                                                                     |
| abort_count           | 拒绝了多少个连接                                                                                                                                                                                    |
| accept_count          | 接受了多少个连接                                                                                                                                                                                    |
| close_count           | 关闭的连接数量                                                                                                                                                                                     |
| worker_num            | 开启了多少个[worker进程](/zh/server/process_thread.html#进程-线程)                                                                                                                                      |
| task_worker_num       | 开启了多少个[task进程](/zh/server/process_thread.html#进程-线程)【`v4.5.7` 可用】                                                                                                                            |
| user_worker_num       | 开启了多少个[user进程](/zh/server/process_thread.html#进程-线程)                                                                                                                                        |
| idle_worker_num       | 空闲的 worker 进程数                                                                                                                                                                                |
| dispatch_count        | 服务器发送到 worker 进程的包数量【`v4.5.7` 可用，仅在 [SWOOLE_PROCESS](/zh/server/process_thread.html#工作模式) 模式下有效】                                                                                                 |
| request_count         | 服务器收到的请求次数【只有 [receive](/zh/server/events.html#receive)、[message](/zh/server/events.html#message)、[request](/zh/server/events.html#request)、[packet](/zh/server/events.html#packet) 四种数据请求计算】 |
| response_count        | 服务器返回的响应次数                                                                                                                                                                                  |
| total_recv_bytes      | 数据接收总数                                                                                                                                                                                      |
| total_send_bytes      | 数据发送总数                                                                                                                                                                                      |
| pipe_packet_msg_id    | 进程间通信 id                                                                                                                                                                                     |
| session_round         | 起始 session id                                                                                                                                                                                |
| min_fd                | 最小的连接 fd                                                                                                                                                                                     |
| max_fd                | 最大的连接 fd                                                                                                                                                                                     |
| worker_request_count  | 当前 worker 进程收到的请求次数【worker_request_count 超过 max_request 时工作进程将退出】                                                                                                                                |
| worker_response_count | 当前 worker 进程响应次数                                                                                                                                                                              |
| worker_dispatch_count | master 进程向当前 worker 进程投递任务的计数，在 [master进程](/zh/server/process_thread.html#进程-线程) 进行 dispatch 时增加计数                                                                                                 |
| task_idle_worker_num  | 空闲的 task 进程数                                                                                                                                                                                  |
| tasking_num           | 当前正在处理的任务数量                                                                                                                                                                                |
| coroutine_num         | 当前协程数量                                                                                                                                                                                      |
| coroutine_peak_num    | 协程数量的历史峰值                                                                                                                                                                                      |
| task_queue_num        | 消息队列中的任务数量                                                                                                                                                                                  |
| task_queue_bytes      | 消息队列的内存占用字节数                                                                                                                                                                                |

## bind

将连接绑定一个用户定义的 `UID`，设置以此值进行 `hash` 固定分配。可以保证某一个 `UID` 的连接全部会分配到同一个 `Worker` 进程。

```php
public function bind(int $fd, int $uid): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定连接的 `fd` | 必填 |
| `$uid` | 要绑定的 `UID`，必须为非 `0` 的数字。其它值：`UID` 最大不能超过 `4294967295`，最小不能小于 `-2147483648` | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> 此功能约束于 [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#工作模式)，并且仅在 [dispatch_mode](/zh/server/setting.html#dispatch-mode) 为 `SWOOLE_DISPATCH_UIDMOD` 时生效。
> 同一个连接只能被 `bind` 一次，如果已经绑定了 `UID`，再次调用 `bind` 会返回 `false`。

> [!NOTE]
> 如果绑定的 `UID` 为负数，会被底层转换为 `32位无符号整数`。
> 某些情况下，业务逻辑需要用户连接重新绑定 `UID`。这时可以切断连接，重新建立 `TCP` 连接并握手，绑定到新的 `UID`。


## sendto

向任意的客户端 `IP:PORT` 发送 `UDP` 数据包。

```php
public function sendto(string $ip, int $port, string $send_data, int $server_socket = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$ip` | 指定客户端 `ip`，`$ip` 为 `IPv4` 或 `IPv6` 字符串，如 `192.168.1.102`。如果 `IP` 不合法会返回错误 | 必填 |
| `$port` | 指定客户端 `port`，`$port` 为 `1-65535` 的网络端口号，如果端口错误发送会失败 | 必填 |
| `$send_data` | 要发送的数据内容，可以是文本或者二进制内容 | 必填 |
| `$server_socket` | 指定使用的 `socket` 文件描述符，用于多端口场景 | `-1`，表示当前监听的 udp 端口 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> - 只有监听了 `UDP` 的端口，才可以向 `IPv4` 地址发送数据。
> - 必须监听了 `UDP6` 的端口，才可以向 `IPv6` 地址发送数据。
> - `$ip`，`$port` 和 `$serverSocket` 可以从 [packet 事件回调中的 $clientInfo](/zh/server/events.html#packet) 获取。

## sendwait

向客户端发送数据，并且等待结果返回，该方法是一个阻塞方法。

```php
public function sendwait(int $fd, string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定客户端的文件描述符 | 必填 |
| `$data` | 要发送的数据 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> - [SWOOLE_BASE 模式](/zh/server/process_thread.html#工作模式) 才能使用 `sendwait`。
> - 有一些特殊的场景是需要连续向客户端发送数据，而 [send](/zh/server/methods.html#send) 数据发送接口是纯异步的，大量数据发送会导致内存发送队列塞满。此时可以使用 `sendwait`，`sendwait` 会等待连接可写。直到数据发送完毕才会返回。
> - `sendwait` 只用于本机或内网通信，外网连接请勿使用 `sendwait`，在开启协程 [enable_coroutine](/zh/server/setting.html#enable-coroutine) 的时候也不要用这个函数，会卡死其他协程，只有同步阻塞的服务器才可以用。

## exists

检测 `fd` 对应的连接是否存在。

```php
public function exists(int $fd): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 文件描述符 | 必填 |

**返回值**：返回 `true` 表示存在，返回 `false` 表示不存在。

## protect

设置客户端连接为保护状态，不被[心跳线程](/zh/server/setting.html#heartbeat-idle-time)切断。

```php
public function protect(int $fd, bool $is_protected = true): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定客户端连接 `fd` | 必填 |
| `$is_protected` | 设置的状态。其它值：`false`，表示不保护 | `true`，表示保护状态 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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

关闭客户端连接。

```php
public function close(int $fd, bool $reset = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定关闭的 `fd`（文件描述符） | 必填 |
| `$reset` | 设置为 `true` 会强制关闭连接，丢弃发送队列中的数据 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> - 主动关闭客户端连接，会触发 [close 事件](/zh/server/events.html#close)。
> - 清理逻辑不要在 `close` 之后写，应该在 `close事件` 处理。

## pause

暂停接收当前连接发送过来的数据。

```php
public function pause(int $fd): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定文件描述符 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

> [!NOTE]
> 在 [SWOOLE_PROCESS 模式](/zh/server/process_thread.html#工作模式) 下，可能有部分数据已经到达 [worker 进程](/zh/server/process_thread.html#进程-线程)，因此仍然可能会触发 [receive 事件](/zh/server/events.html#receive) / [request 事件](/zh/server/events.html#request) / [message 事件](/zh/server/events.html#message) / [packet 事件](/zh/server/events.html#packet)。

## resume

恢复接收当前连接发送过来的数据。

```php
public function resume(int $fd): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定文件描述符 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

## task

投递一个任务到 [task 进程](/zh/server/process_thread.html#工作模式) 中，此函数是非阻塞的，执行完毕会立即返回。[worker 进程](/zh/server/process_thread.html#工作模式) 可以继续处理新的请求。

```php
public function task(mixed $data, int $dstWorkerId = -1, ?callable $finishCallback = null): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 要投递的任务数据，必须是可序列化的 PHP 变量 | 必填 |
| `$dstWorkerId` | 可以指定要给投递给哪个 `task 进程`。其它值：[task 进程编号](/zh/server/properties.html#taskworker) | `-1`，表示随机投递，底层会自动选择一个空闲 `task 进程` |
| `$finishCallback` | `finish` 回调函数，如果任务设置了回调函数，`task` 返回结果时会直接执行指定的回调函数，不再执行 [finish 回调](/zh/server/events.html#finish) | `null` |

**返回值**：调用成功，返回值为整数 `$task_id`，表示此任务的 `ID`。如果有 `finish` 回调，`finish回调` 中会携带 `$task_id` 参数。调用失败，返回值为 `false`，`$task_id` 可能为 `0`，因此必须使用 `===` 判断是否失败。

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
    echo "接收数据" . $data . "\n";
    $data    = trim($data);
    $server->task($data, -1, function (Server $server, $task_id, $data) {
        echo "Task Callback: ";
        var_dump($task_id, $data);
    });
    $task_id = $server->task($data, 0);
    $server->send($fd, "分发任务，任务id为$task_id\n");
});

$server->on('task', function (Server $server, $task_id, $reactor_id, $data) {
    echo "Tasker进程接收到数据";
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
> - 不能在 `task` 进程使用 `task` 方法。
> - 必须配置 [task_worker_num](/zh/server/setting.html#task-worker-num) 和注册 [task 事件](/zh/server/events.html#task) 和 [finish 事件](/zh/server/events.html#finish)，才能使用 `task` 方法。
> - 从 [master](/zh/server/process_thread.html#进程-线程)、[manager](/zh/server/process_thread.html#进程-线程)、[user](/zh/server/process_thread.html#进程-线程) 进程中投递的任务，是单向的，无法接收 `task 进程` 处理后返回的结果。
> - 当传入的 `$data` 数据超过 `8K` 时会启用临时文件来保存。当临时文件内容超过 [package_max_length](/zh/server/setting.html#package-max-length) 时底层会抛出一个警告。此警告不影响数据的投递，过大的数据可能会存在性能问题。

## taskwait

投递一个任务到 [task 进程](/zh/server/process_thread.html#工作模式) 中，并且等待任务完成或者超时返回。

```php
public function taskwait(mixed $data, float $timeout = 0.5, int $taskWorkerIndex = -1): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 投递的任务数据，可以是任意类型，非字符串类型底层会自动进行串化 | 必填 |
| `$timeout` | 超时时间，浮点型，单位为秒，最小支持 `1ms` 粒度，超过规定时间内 `task 进程` 未返回数据，`taskwait` 将返回 `false`，不再处理后续的任务结果数据 | `0.5` |
| `$taskWorkerIndex` | 可以指定要给投递给哪个 `task 进程`。其它值：[task 进程编号](/zh/server/properties.html#taskworker) | `-1`，表示随机投递，底层会自动选择一个空闲 `task 进程` |

**返回值**：返回 `false` 表示投递失败。如果 `task` 事件中执行了 `finish` 方法或者 `return`，那么 `taskwait` 将会返回 `task` 投递的结果。

> [!WARNING]
> **注意**
>
> - 不能在 `task` 进程使用 `taskwait` 方法。
> - 必须配置 [task_worker_num](/zh/server/setting.html#task-worker-num) 和注册 [task 事件](/zh/server/events.html#task)，才能使用 `taskwait` 方法。
> - 从 [master](/zh/server/process_thread.html#进程-线程)、[manager](/zh/server/process_thread.html#进程-线程)、[user](/zh/server/process_thread.html#进程-线程) 进程中投递的任务，是单向的，无法接收 `task 进程` 处理后返回的结果。
> - 当传入的 `$data` 数据超过 `8K` 时会启用临时文件来保存。当临时文件内容超过 [package_max_length](/zh/server/setting.html#package-max-length) 时底层会抛出一个警告。此警告不影响数据的投递，过大的数据可能会存在性能问题。

## taskWaitMulti

并发执行多个 `task` 异步任务，并且 [worker 进程](/zh/server/process_thread.html#进程-线程) 等待任务完成或者超时返回。

```php
public function taskWaitMulti(array $tasks, float $timeout = 0.5): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$tasks` | 必须为数字索引数组，不支持关联索引数组，底层会遍历 `$tasks` 将任务逐个投递到每个 [task 进程](/zh/server/process_thread.html#工作模式) | 必填 |
| `$timeout` | 为浮点型，单位为秒 | `0.5` 秒 |

**返回值**：任务完成或超时，返回结果数组。结果数组中每个任务结果的顺序与 `$tasks` 对应，如：`$tasks[2]` 对应的结果为 `$result[2]`。某个任务执行超时不会影响其他任务，返回的结果数据中将不包含超时的任务。

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
    $tasks[] = mt_rand(1000, 9999); //任务1
    $tasks[] = mt_rand(1000, 9999); //任务2
    $tasks[] = 0; //任务3
    $tasks[] = mt_rand(1000, 9999); //任务4
    $results = $server->taskWaitMulti($tasks, 2); // 由于任务3在执行过程中睡眠了5秒超时了，所以返回的结果中不存在$result[2]
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
> - 最大并发任务不得超过 `1024`
> - 不能在 `task` 进程使用 `taskWaitMulti` 方法。

## taskCo

用于在当前协程环境中并发地执行多个同步任务，并等待所有任务结果返回，这个过程不会阻塞 [worker 进程](/zh/server/process_thread.html#进程-线程)，因此可以极大地提升处理效率。

```php
public function taskCo(array $tasks, float $timeout = 0.5): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$tasks` | 必须为数字索引数组，不支持关联索引数组，底层会遍历 `$tasks` 将任务逐个投递到每个 [task 进程](/zh/server/process_thread.html#进程-线程) | 必填 |
| `$timeout` | 为浮点型，单位为秒，当规定的时间内任务没有全部完成，立即中止当前异步任务并返回结果 | `0.5` 秒 |

**返回值**：任务完成或超时，返回结果数组。结果数组中每个任务结果的顺序与 `$tasks` 对应，如：`$tasks[2]` 对应的结果为 `$result[2]`。某个任务执行失败或超时，对应的结果数组项为 `false`，如：`$tasks[2]` 失败了，那么 `$result[2]` 的值为 `false`。

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
> - 最大并发任务不得超过 `1024`
> - 不能在 `task` 进程使用 `taskCo` 方法。

## finish

用于在 [task 方法](/zh/server/methods.html#task) 通知 [worker 进程](/zh/server/process_thread.html#进程-线程)，投递的任务已完成。此函数可以传递结果数据给 `worker 进程`。

```php
public function finish(mixed $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 任务处理的结果内容 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
    echo "接收数据" . $data . "\n";
    $data    = trim($data);
    $server->task($data, -1, function (Server $server, $task_id, $data) {
        echo "Task Callback: ";
        var_dump($task_id, $data);
    });
    $task_id = $server->task($data, 0);
    $server->send($fd, "分发任务，任务id为$task_id\n");
});

$server->on('task', function (Server $server, $task_id, $reactor_id, $data) {
    echo "Tasker进程接收到数据";
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
> - `finish` 方法可以多次调用，`worker 进程` 会多次触发 [finish 事件](/zh/server/events.html#finish)。
> - 如果 `worker 进程` 不关心任务执行的结果，不需要调用 `finish` 方法。
> - [task 方法](/zh/server/methods.html#task) 中 `return` 返回字符串，等同于调用 `finish`。
> - `finish` 方法只能在 `task 方法` 中使用，且必须事先注册 `finish 事件`。

## reload

重启所有 [worker 进程](/zh/server/process_thread.html#进程-线程) 和 [task 进程](/zh/server/process_thread.html#进程-线程)。

```php
public function reload(bool $only_reload_taskworker = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$only_reload_taskworker` | 是否仅重启 `task 进程`，其它值：`true` | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, "Hello World");
    $server->reload(); // 重启worker进程和task进程
});

$server->start();
```

> [!WARNING]
> **注意**
>
> - `reload` 有保护机制，当一次 `reload` 正在进行时，收到新的重启信号会丢弃。
> - 如果设置了 [user](/zh/server/setting.html#user) 或者 [group](/zh/server/setting.html#group)，`worker` 进程和 `task` 进程没法使用 `reload` 方法发送信号给 `master 进程` / `manager 进程`，不过在 `v6.2.0` 版本之后，这个问题就被解决了。
> - 向 [master 进程](/zh/server/process_thread.html#进程-线程) 或者 [manager 进程](/zh/server/process_thread.html#进程-线程) 发送 `SIGUSR1` 信号，将平稳地 `restart` 所有 `worker` 进程和 `task` 进程。
> - 向 `master 进程` / `manager 进程` 发送 `SIGUSR2` 信号，将平稳地重启所有 `task 进程`。
> - [worker_num](/zh/server/setting.html#worker-num) 为 1 的情况下，该方法是没有作用的。
> - 需要和 [reload_async](/zh/server/setting.html#reload-async) 搭配才能实现柔性重启。

## shutdown

关闭服务器。

```php
public function shutdown(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> - 此方法可以用在 [worker 进程](/zh/server/process_thread.html#进程-线程) 内使用。
> - 向 [master 进程](/zh/server/process_thread.html#进程-线程) 或者 [manager 进程](/zh/server/process_thread.html#进程-线程) 发送 `SIGTERM` 也可以实现关闭服务。

## heartbeat

开启心跳探测，检查当前进程维持的连接是否有效。

```php
public function heartbeat(bool $ifCloseConnection = true): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$ifCloseConnection` | 发现无效的连接是否强制关闭，其它值：`false` | `true` |

**返回值**：如果没有设置 [heartbeat_check_interval](/zh/server/setting.html#heartbeat-check-interval) 返回 `false`，否则返回被关闭的连接数组。

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
> 与 [heartbeat_idle_time](/zh/server/setting.html#heartbeat-idle-time) 的区别是，`heartbeat_idle_time` 会自动做心跳检测，不用像示例那样需要使用者在代码通过定时器实现。

## getClientList

获取客户端连接。

```php
public function getClientList(int $start_fd = 0, int $pageSize = 10): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$start_fd` | 指定起始 `fd` | `0` |
| `$pageSize` | 每页取多少条，最大不得超过 `100` | `10` |

**返回值**：调用成功返回一个按升序排列的数字索引数组，元素为获取到的 `$fd`。取最后一个 `$fd` 作为下次查询的起始位置。调用失败返回 `false`。

> [!WARNING]
> **注意**
>
> - 推荐使用 [connections 属性](/zh/server/properties.html#connections) 迭代器来遍历连接。
> - `getClientList` 只能获取 `tcp` 客户端连接。
> - [SWOOLE_BASE 模式](/zh/server/process_thread.html#工作模式) 和 [SWOOLE_THREAD 模式](/zh/server/process_thread.html#工作模式) 只能获取当前进程/线程的客户端连接，[SWOOLE_PROCESS 模式](/zh/server/process_thread.html#工作模式) 可以获取整个服务端的 `tcp` 连接。

## getClientInfo

获取指定连接的客户端信息。

```php
public function getClientInfo(int $fd, int $reactor_id = -1, bool $ignoreError = false): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 指定文件描述符 | 必填 |
| `$reactor_id` | 连接所在的 [reactor 线程](/zh/server/process_thread.html#进程-线程) 线程编号，目前没有任何作用，仅仅是为了保持 API 兼容 | `-1` |
| `$ignoreError` | 是否忽略错误，如果设置为 `true`，即使连接关闭也会返回连接的信息，`false` 表示连接关闭就返回 `false` | `false` |

**返回值**：调用成功返回包含客户端信息的数组，调用失败返回 `false`。

| 参数 | 作用 |
|:---|:---|
| server_port | 服务端监听端口 |
| server_fd | 服务端 fd |
| socket_fd | 客户端 fd |
| socket_type | 套接字类型 |
| remote_port | 客户端端口 |
| remote_ip | 客户端 IP |
| reactor_id | 来自哪个 Reactor 线程 |
| connect_time | 客户端连接到服务端的时间，单位秒，由 master 进程设置 |
| last_time | 最后一次收到数据的时间，单位秒，由 master 进程设置 |
| last_recv_time | 最后一次收到数据的时间，单位秒，由 master 进程设置 |
| last_send_time | 最后一次发送数据的时间，单位秒，由 master 进程设置 |
| last_dispatch_time | worker 进程接收数据的时间 |
| close_errno | 连接关闭的错误码，如果连接异常关闭，close_errno 的值是非零，可以参考 Linux 错误信息列表 |
| recv_queued_bytes | 等待处理的数据量 |
| send_queued_bytes | 等待发送的数据量 |
| websocket_status | [可选项] WebSocket 连接状态，当服务器是 `Swoole\WebSocket\Server` 时会额外增加此项信息 |
| uid | [可选项] 使用 `bind` 绑定了用户 ID 时会额外增加此项信息 |
| ssl_client_cert | [可选项] 使用 SSL 隧道加密，并且客户端设置了证书时会额外添加此项信息 |

> [!WARNING]
> **注意**
>
> - `ssl_client_cert` 只能在 [connect 事件](/zh/server/events.html#connect) 中调用 `getClientInfo` 获取到。格式为 `x509` 格式，可使用 `openssl_x509_parse` 函数获取到证书信息。
> - [dispatch_mode](/zh/server/setting.html#dispatch-mode) 为 `SWOOLE_DISPATCH_ROUND` 或者 `SWOOLE_DISPATCH_IDLE_WORKER` 时，这些客户端连接是无状态的，当连接断开后相关信息会直接从内存中删除，因此 `getClientInfo` 无法查询到这些连接的信息。

## getWorkerId

获取当前 [worker 进程](/zh/server/process_thread.html#进程-线程) 的 [编号](/zh/server/setting.html#worker-num) 或者 [task 进程](/zh/server/process_thread.html#进程-线程) 的 [编号](/zh/server/setting.html#task-worker-num)。

```php
public function getWorkerId(): int|false
```

**返回值**：进程不存在返回 `false`，否则返回进程的编号。

## getWorkerPid

获取指定 [worker 进程](/zh/server/process_thread.html#进程-线程) 的 `PID` 或者 [task 进程](/zh/server/process_thread.html#进程-线程) 的 `PID`。

```php
public function getWorkerPid(int $worker_id = -1): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$worker_id` | 获取指定进程的 pid，`-1` 表示当前进程 | `-1` |

**返回值**：进程不存在返回 `false`，否则返回进程的 `PID`。

## getWorkerStatus

```php
public function getWorkerStatus(int $worker_id = -1): int|false
```

## getManagerPid

获取 [manager 进程](/zh/server/process_thread.html#进程-线程) 的进程 `PID`。

```php
public function getManagerPid(): int
```

**返回值**：返回大于 0 的进程 `PID`。

## getMasterPid

获取 [master 进程](/zh/server/process_thread.html#进程-线程) 的进程 `PID`。

```php
public function getMasterPid(): int
```

**返回值**：返回大于 0 的进程 `PID`。

> [!NOTE]
> [SWOOLE_PROCESS](/zh/server/process_thread.html#工作模式) 才有 `master 进程`。

## getSocket

调用此方法可以得到底层的 `socket` 句柄，返回的对象为 `sockets` 资源句柄。

```php
public function getSocket(int $port = 0): false|\Socket
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$port` | 指定监听的端口，其它值：[多端口监听](/zh/server/port.html) 监听的子端口 | [__construct](/zh/server/methods.html#construct) 方法监听的端口 |

**返回值**：监听的端口不存在返回 `false`，否则返回 `php` 的 `Socket 对象`。

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
        'group' => '224.10.20.30', // 表示组播地址
        'interface' => 'eth0' // 表示网络接口的名称，可以为数字或字符串，如eth0、wlan0
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
> 此方法需要依赖 PHP 的 `sockets` 扩展，并且编译 `Swoole` 时需要开启 `--enable-sockets` 选项

## push

`websocket` 服务端将数据推送给 `websocket` 客户端。

```php
public function push(int $fd, Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 客户端连接的文件描述符 | 必填 |
| `$data` | 要发送的数据内容 | 必填 |
| `$opcode` | 指定发送数据内容的格式，默认为文本；发送二进制内容 `$opcode` 参数需要设置为 `SWOOLE_WEBSOCKET_OPCODE_BINARY`；其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY`，`SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 标志位；其它值：`SWOOLE_WEBSOCKET_FLAG_RSV1`，`SWOOLE_WEBSOCKET_FLAG_RSV2`，`SWOOLE_WEBSOCKET_FLAG_RSV3`，`SWOOLE_WEBSOCKET_FLAG_MASK`，`SWOOLE_WEBSOCKET_FLAG_COMPRESS` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

- 发送单个数据帧，不压缩

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

- 发送压缩后的数据帧

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'websocket_compression' => true  // 开启帧压缩
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

- 发送连续帧，不压缩

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    // 发送连续帧，
    $response = new Frame();
    
    for ($i = 0; $i < 100; $i++) {
      $response->data = base64_encode(random_bytes(200));
      if ($i == 0) {
        // 第一个帧需要设置成SWOOLE_WEBSOCKET_OPCODE_TEXT或者SWOOLE_WEBSOCKET_OPCODE_BINARY
        $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
      } else {
        // 后续的帧需要设置成SWOOLE_WEBSOCKET_OPCODE_CONTINUATION
        $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
      }
      
      $response->finish = $i == 99;  // 除了最后一个帧设置为true之外，其他必须为false
      $server->push($frame->fd, $response);
    }
});

$server->start();
```

- 先压缩数据，再发送连续帧

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'websocket_compression' => true  // 开启帧压缩
]);
$server->on('message', function(Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));

    $context = deflate_init(ZLIB_ENCODING_RAW);
    // 由于底层并不知道数据帧压缩后需要拆分成多少块，所以这一步需要使用者自己实现
    // 第一个帧需要手动设置finish为false，flags为SWOOLE_WEBSOCKET_FLAG_COMPRESS和SWOOLE_WEBSOCKET_FLAG_RSV1，并且不能设置SWOOLE_WEBSOCKET_FLAG_FIN，表明这是一个压缩数据帧
    $response = new Frame();
    $response->data = deflate_add($context, $data1, ZLIB_SYNC_FLUSH);
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    $response->flags = SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1;
    $response->finish = false;
    $server->push($frame->fd, $response);
    
    // 剩余的连续帧需要设置opcode为SWOOLE_WEBSOCKET_OPCODE_CONTINUATION，且flags为0，finish为false
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
    $response->flags = 0;
    $response->finish = false;
    $server->push($frame->fd, $response);
    
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $server->push($frame->fd, $response);
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $server->push($frame->fd, $response);
    
    // 最后一个连续帧需要设置finish为true，flags为SWOOLE_WEBSOCKET_FLAG_FIN，表明数据已经发送完毕
    $response->data = deflate_add($context, $data3, ZLIB_SYNC_FLUSH);
    $response->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
    $response->finish = true;
    $server->push($frame->fd, $response);
});

$server->start();
```

- 发送控制帧（`ping`，`pong`和`close`）

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

| 常量名 | 中文含义 | 说明 |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_OPCODE_TEXT` | 文本帧 | 承载 UTF-8 文本数据 |
| `SWOOLE_WEBSOCKET_OPCODE_BINARY` | 二进制帧 | 承载二进制数据 |
| `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | 延续帧 | 用于分片消息的后续帧 |
| `SWOOLE_WEBSOCKET_OPCODE_CLOSE` | 关闭帧 | 表示连接关闭 |
| `SWOOLE_WEBSOCKET_OPCODE_PING` | Ping 帧 | 心跳检测请求 |
| `SWOOLE_WEBSOCKET_OPCODE_PONG` | Pong 帧 | 心跳检测响应 |

**支持的 flags**

| 常量名 | 中文含义 | 说明 |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_FLAG_FIN` | 完成标志 | 表示当前帧是否为消息的最后一帧 |
| `SWOOLE_WEBSOCKET_FLAG_RSV1` | RSV1 标志 | 扩展协议预留位 1，通常用于压缩（如 Per-Message Deflate） |
| `SWOOLE_WEBSOCKET_FLAG_RSV2` | RSV2 标志 | 扩展协议预留位 2 |
| `SWOOLE_WEBSOCKET_FLAG_RSV3` | RSV3 标志 | 扩展协议预留位 3 |
| `SWOOLE_WEBSOCKET_FLAG_MASK` | 掩码标志 | 表示数据负载是否使用了掩码（客户端到服务端的数据必须设置） |
| `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | 压缩标志 | 表示当前帧的数据是否被压缩（通常与 RSV1 配合使用） |

> [!WARNING]
> **注意**
>
> - 底层会自动处理控制帧，所以一般情况下，不需要使用者手动处理控制帧。
> - `push` 方法是 `Swoole\WebSocket\Server` 类的专属方法。
> - 当使用 `Swoole\WebSocket\Frame` 和 `Swoole\WebSocket\CloseFrame` 时，请通过对象的**属性**来设置 `$data`、`$opcode` 和 `$flags`，**方法参数**中的这三个值将被忽略。

## isEstablished

判断 `websocket` 指定的客户端连接是否有效。

```php
public function isEstablished(int $fd): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 客户端连接的文件描述符 | 必填 |

**返回值**：如果是有效的连接返回 `true`，否则返回 `false`。

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
> - 与 [exists](/zh/server/methods.html#exists) 不同，`exists` 方法仅判断是否为 `TCP` 连接，无法判断是否为已完成握手的 `WebSocket` 客户端。
> - `isEstablished` 方法是 `Swoole\WebSocket\Server` 类的专属方法。

## pack

打包 `webSocket` 数据帧。

```php
public static function pack(Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 消息内容 | 必填 |
| `$opcode` | 指定发送数据内容的格式，默认为文本。发送二进制内容 `$opcode` 参数需要设置为 `SWOOLE_WEBSOCKET_OPCODE_BINARY`。其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 帧标志位，`SWOOLE_WEBSOCKET_FLAG_FIN` 表示帧已完成，值为 `1` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

> [!NOTE]
> 自 `v4.4.12` 版本起，`finish` 参数（`bool` 型）改为 `flags` 参数（`int` 型）以支持 `WebSocket` 压缩，原有 `bool` 型值会隐式转换为 `int` 型，此改动向下兼容无影响；`mask` 参数已在 `v4.4.12` 版本移除。

**返回值**：操作成功返回打包好的 `WebSocket` 数据包，操作失败返回空字符串。

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
> - `pack` 的使用场景比较特定，最常见的就是在 [TCP 服务器](/zh/server/tcp_udp.html) 将数据打包成数据帧发送给 `WebSocket` 客户端。
> - 如果 `$data` 为 `Swoole\WebSocket\Frame` 对象，其 `$opcode` 和 `$finish` 属性会覆盖方法参数中的对应值。
> - 如果无特殊要求，请直接使用 [Swoole\WebSocket\Server](/zh/server/websocket.html)，数据的打包和解析都是自动的。
> - `pack` 方法是 `Swoole\WebSocket\Server` 类的专属方法。

## unpack

解析 `webSocket` 数据帧。

```php
public static function unpack(string $data): Swoole\WebSocket\Frame
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 消息内容 | 必填 |

**返回值**：解析成功返回 [Swoole\WebSocket\Frame 对象](/zh/server/class/frame.html)，解析失败返回 `false`。

> [!WARNING]
> **注意**
>
> - `unpack` 的使用场景比较特定，最常见的就是在 [TCP 服务器](/zh/server/tcp_udp.html) 中解析 `WebSocket` 客户端发来的数据。
> - 如果无特殊要求，请直接使用 [Swoole\WebSocket\Server](/zh/server/websocket.html)，数据的打包和解析都是自动的。
> - `unpack` 方法是 `Swoole\WebSocket\Server` 类的专属方法。

## disconnect

`websocket` 服务器主动关闭指定的客户端连接。

```php
public function disconnect(int $fd, int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 客户端连接的文件描述符 | 必填 |
| `$code` | 关闭连接的状态码。根据 `RFC6455`，对于应用程序关闭连接状态码，取值范围为 `1000` 或 `4000-4999` 之间 | `SWOOLE_WEBSOCKET_CLOSE_NORMAL` |
| `$reason` | 关闭连接的原因，`utf-8` 格式字符串，字节长度不超过 `125` | 必填 |

**返回值**：发送成功返回 `true`，发送失败或状态码非法时返回 `false`。

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
> - 请使用 `disconnect` 来关闭 `websocket` 连接，该方法会自动发送 `close` 关闭帧给客户端并关闭连接。
> - `disconnect` 方法是 `Swoole\WebSocket\Server` 类的专属方法。

**支持的状态码**

| 状态码常量 | 中文说明 |
|:---|:---|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL | **正常关闭** - 连接已完成工作，正常结束 |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY | **正在离开** - 端点离开（如浏览器跳转或关闭页面） |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR | **协议错误** - 端点收到不符合 WebSocket 协议的数据 |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR | **数据类型错误** - 收到无法处理的数据类型（如端点只接收文本却收到二进制） |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR | **状态码无效** - 预期收到状态码但未收到（实际不发送此码，用于应用） |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL | **异常关闭** - 连接非预期断开（如没收到关闭帧就断开，不主动发送） |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR | **消息格式错误** - 收到不符合规范的消息（如 UTF-8 编码错误） |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR | **违反策略** - 消息违反服务器策略（通用拒绝原因） |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG | **消息过大** - 消息长度超出端点愿意处理的范围 |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING | **缺少扩展** - 客户端期望服务器协商特定扩展，但服务器未提供（客户端专用） |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR | **服务器内部错误** - 服务器遇到异常情况无法完成请求 |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER | **稍后重试** - 服务器临时过载或维护中，建议稍后再连 |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY | **网关错误** - 网关或代理收到无效的上游响应 |
| SWOOLE_WEBSOCKET_CLOSE_TLS | **TLS 握手失败** - TLS 握手未完成就关闭（不主动发送） |

## ping

`websocket` 服务器向客户端发送 `ping` 帧。

```php
public function ping(int $fd, string $data = ""): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 客户端连接的文件描述符 | 必填 |
| `$data` | `ping` 帧需要携带的数据 | `''` |

**返回值**：发送成功返回 `true`，发送失败返回 `false`。

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
> - 除非设置 [open_websocket_pong_frame](/zh/server/setting.html#open-websocket-pong-frame) 为 `true`，否则客户端发送的 `pong` 帧会被底层自动处理。
> - `ping` 方法是 `Swoole\WebSocket\Server` 类的专属方法。

## setHandler

注册 `Redis` 服务器命令的处理逻辑，你可以通过它来指定服务器如何响应 `LPUSH`、`GET`、`SET` 命令。

```php
public function setHandler(string $command, callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$command` | 命令的名称 | 必填 |
| `$callback` | 命令的处理函数，回调函数返回字符串类型时会自动发送给客户端 | 必填 |

**返回值**：注册成功返回 `true`，注册失败返回 `false`。

**$callback 函数签名**

```php
function(int $fd, array $data)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fd` | 当前连接的文件描述符 | 必填 |
| `$data` | 客户端发送过来的数据，例如客户端发送的命令是 `set name swoole`，那么 `$data[0]` 为 `name`，`$data[1]` 为 `swoole`，以此类推 | 必填 |

**示例**

```php
<?php
use Swoole\Redis\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(['worker_num' => 1]);
$server->setHandler('get', function(int $fd, array $data) use ($server) {
    if (count($data) == 0) {
        // 通过return返回的字符串数据，底层会将它发送给redis客户端
        return Server::format(Server::ERROR, "ERR wrong number of arguments for 'GET' command");
    }
    // 通过redis客户端发送get命令时，服务端会返回hello
    $server->send($fd, Server::format(Server::STRING, "hello"));
});
$server->start();
```

> [!WARNING]
> **注意**
>
> - 如果 `$callback` 中通过 `return` 返回了字符串数据，底层会将这个返回值返回给 `redis` 客户端。
> - `setHandler` 方法是 `Swoole\Redis\Server` 类的专属方法。

## getHandler

获取 `Redis` 服务器指定命令的处理逻辑。

```php
public function getHandler(string $command): \Closure
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$command` | 命令的名称 | 必填 |

**返回值**：成功返回对应的回调函数。

> [!NOTE]
> `getHandler` 方法是 `Swoole\Redis\Server` 类的专属方法。

## format

将 `PHP` 数据格式化为标准的 `Redis` 通信协议 `(RESP)` 格式，方便服务器返回给客户端

```php
public static function format(int $type, mixed $value = null): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$type` | 数据类型 | 必填 |
| `$value` | 需要格式化的数据 | 必填 |

**返回值**：操作成功返回格式化后的数据，操作失败返回 `false`。

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
    // 通过redis客户端发送get命令时，服务端会返回hello
    $server->send($fd, Server::format(Server::STRING, "hello"));
});
$server->start();
```

**支持的数据类型**

| 常量 | 说明 |
|:---|:---|
| Swoole\Redis\Server::NIL | 返回 nil 数据 |
| Swoole\Redis\Server::ERROR | 返回错误码 |
| Swoole\Redis\Server::STATUS | 返回状态 |
| Swoole\Redis\Server::INT | 返回整数，format 必须传入参数值，类型必须为整数 |
| Swoole\Redis\Server::STRING | 返回字符串，format 必须传入参数值，类型必须为字符串 |
| Swoole\Redis\Server::SET | 返回列表，format 必须传入参数值，类型必须为数组 |
| Swoole\Redis\Server::MAP | 返回 Map，format 必须传入参数值，类型必须为关联索引数组 |

> [!NOTE]
> `format` 方法是 `Swoole\Redis\Server` 类的专属方法。

