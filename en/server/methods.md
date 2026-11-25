# Methods

## __construct

Creates an async-style server.

```php
public function __construct(string $host = '0.0.0.0', int $port = 0, int $mode = SWOOLE_BASE, int $sock_type = SWOOLE_SOCK_TCP)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Specifies the IP address to listen on. For IPv4, `127.0.0.1` listens on the local machine and `0.0.0.0` listens on all addresses. For IPv6, `::1` listens on the local machine and `::` (equivalent to `0:0:0:0:0:0:0:0`) listens on all addresses | `'0.0.0.0'` |
| `$port` | Specifies the port to listen on, such as `9501`. Listening on ports below `1024` requires `root` privileges. If this port is already in use, starting the server will fail | `0` |
| `$mode` | Specifies the running mode. Other values: [SWOOLE_PROCESS](/en/server/process_thread.html#working-modes) multi-process mode, [SWOOLE_THREAD](/en/server/process_thread.html#working-modes) multi-thread mode (available in Swoole 6.0) | [SWOOLE_BASE](/en/server/process_thread.html#working-modes) base mode (default) |
| `$sock_type` | Specifies the type of this group of servers. Other values:<br>`SWOOLE_SOCK_TCP`: tcp ipv4 socket<br>`SWOOLE_SOCK_TCP6`: tcp ipv6 socket<br>`SWOOLE_SOCK_UDP`: udp ipv4 socket<br>`SWOOLE_SOCK_UDP6`: udp ipv6 socket<br>[SWOOLE_UNIX_DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php): unix socket dgram<br>[SWOOLE_UNIX_STREAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/stream_server.php): unix socket stream | `SWOOLE_SOCK_TCP` |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->start();
```

> [!NOTE]
> When `$sock_type` is `SWOOLE_UNIX_DGRAM` or `SWOOLE_UNIX_STREAM`, the `$port` parameter is ignored.
> Using `$sock_type` | `SWOOLE_SSL` enables `SSL` tunnel encryption. After enabling `SSL`, you must configure [ssl_key_file](/en/server/setting.html#ssl-cert-file-ssl-key-file) and [ssl_cert_file](/en/server/setting.html#ssl-cert-file-ssl-key-file).

## set

Sets the server runtime [configuration](/en/server/setting.html).

```php
public function set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Sets the server runtime configuration | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);
$server->start();
```

> [!WARNING]
> The `set` method must be called before `start`.

## on

Registers server [event callback functions](/en/server/events.html).

```php
public function on(string $event_name, callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event_name` | `Swoole` provides a very comprehensive event callback mechanism. For all supported event names, see the documentation: [Callback events](/en/server/events.html) | Required |
| `$callback` | Sets the event callback function | Required |

**Example**

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

Gets the callback function corresponding to an event name.

```php
public function getCallback(string $event_name): \Closure|string|null|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event_name` | Event callback name | Required |

**Example**

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

Adds a listening [sub-port](/en/server/port.html).

```php
public function listen(string $host, int $port, int $sock_type): false|Swoole\Server\Port
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Specifies the IP address to listen on. For IPv4, `127.0.0.1` listens on the local machine and `0.0.0.0` listens on all addresses. For IPv6, `::1` listens on the local machine and `::` (equivalent to `0:0:0:0:0:0:0:0`) listens on all addresses | Required |
| `$port` | Specifies the port to listen on, such as `9501`. Listening on ports below `1024` requires `root` privileges. If this port is already in use, starting the server will fail | Required |
| `$sock_type` | Specifies the type of this group of servers. Other values:<br>`SWOOLE_SOCK_TCP`: tcp ipv4 socket<br>`SWOOLE_SOCK_TCP6`: tcp ipv6 socket<br>`SWOOLE_SOCK_UDP`: udp ipv4 socket<br>`SWOOLE_SOCK_UDP6`: udp ipv6 socket<br>[SWOOLE_UNIX_DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php): unix socket dgram<br>[SWOOLE_UNIX_STREAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/stream_server.php): unix socket stream | Required |

**Return value**: Returns [Swoole\Server\Port](/en/server/class/port.html) on success, or `false` on failure.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$http->on('request', function(Request $request, Response $response) {
    echo "main port";
});

$port = $http->listen('127.0.0.1', 9502, SWOOLE_SOCK_TCP);
$port->on('request', function(Request $request, Response $response) {
    echo "sub port";
});

$http->start();
```

## sendMessage

Sends data to any [worker process](/en/server/process_thread.html#processes-threads) or [task process](/en/server/process_thread.html#processes-threads). The process that receives the message triggers the [pipeMessage event](/en/server/events.html#pipemessage).

```php
public function sendMessage(mixed $message, int $workerId): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$message` | The message data to send. There is no length limit, but a temporary memory file is used when it exceeds `8K` | Required |
| `$workerId` | The `ID` of the target process. For the range, see [$worker_id](/en/server/properties.html#worker-id) | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> Calling `sendMessage` inside a `worker` process is asynchronous: the message is first stored in a buffer and sent only when the connection becomes writable.
> Calling `sendMessage` inside a `task` process or [user process](/en/server/process_thread.html#processes-threads) is synchronous IO by default, but in some cases it is automatically converted to asynchronous IO; see "Converting synchronous IO to asynchronous IO".

> [!WARNING]
> Using `sendMessage` requires registering the `pipeMessage` event callback function.
> When [task_ipc_mode](/en/server/setting.html#task-ipc-mode) is `SWOOLE_IPC_PREEMPTIVE`, data cannot be sent to a specific process.

## addProcess

Adds a user-defined [user process](/en/server/process_thread.html#processes-threads). This function is typically used to create a special worker process for monitoring, reporting, or other special tasks.

```php
public function addProcess(Swoole\Process $process): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$process` | A `Swoole\Process` object | Required |

**Return value**: Returns the process id on success; otherwise the program throws a fatal error.

**Example**

```php
<?php
$server = new Swoole\Server('127.0.0.1', 9501);

/**
 * The user process implements broadcasting: it receives unixSocket messages in a loop and sends them to all connections of the server
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
    // Broadcast the received message
    $socket = $process->exportSocket();
    $socket->send($data);
});

$server->start();
```

> [!WARNING]
> Inside a `user process` you can use the [send](/en/server/methods.html#send) and [close](/en/server/methods.html#close) methods, but not the [task](/en/server/methods.html#task), [taskwait](/en/server/methods.html#taskwait), or [taskCo](/en/server/methods.html#taskco) methods.
> Inside a `user process` you can use [sendMessage](/en/server/methods.html#sendmessage) to communicate with [worker processes](/en/server/process_thread.html#processes-threads) or [task processes](/en/server/process_thread.html#processes-threads).
> A `user process` must keep running by using `while(true)` in the code or creating an event loop (for example a timer); otherwise the user process will keep exiting and restarting.
> `addProcess` must be used before calling the [start](/en/server/methods.html#start) method; otherwise the `user` process will not start.

## start

Starts the server.

```php
public function start(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);
$server->start();
```

> [!WARNING]
> After a successful start, the server enters the event loop and waits for client connection requests. Code after the `start` method does not execute when the server stops.

## stop

Stops the specified [worker process](/en/server/process_thread.html#processes-threads) and immediately triggers the [workerStop event](/en/server/events.html#workerstop).

```php
public function stop(int $workerId = -1, bool $waitEvent = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$workerId` | Specifies the `worker` [process number](/en/server/properties.html#worker-id) | `-1`, meaning the current process |
| `$waitEvent` | Controls the exit strategy.<br>`false`: exit immediately, even if events are still pending. For example, an `SQL` statement has been sent but the result from the `MySQL` server has not yet been received. If the process exits forcibly at this point, the `SQL` execution result is lost.<br>`true`: the underlying layer uses an async-safe restart strategy: it first notifies the [manager process](/en/server/process_thread.html#processes-threads) to start a new `worker` to handle new requests. The old `worker` waits for events until the event loop is empty or `max_wait_time` is exceeded, then exits, maximizing the safety of async events.<br>Since `v6.1.0`, this parameter has been removed; the exit logic is controlled by the [reload_async](/en/server/setting.html#reload-async) option | `false` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->set(['worker_num' => 4]);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->stop(rand(0, 3)); // Randomly stop a worker process
});

$server->on('workerStop', function (Server $server, int $workerId) {
    echo "worker stopped, ID: {$workerId}\n";
});
$server->start();
```

## send

Sends data to a client.

```php
public function send(int|string $fd, string $send_data, int $serverSocket = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the client's file descriptor or the unix socket path | Required |
| `$send_data` | The data to send. For the `TCP` protocol it must not exceed `2M`; you can change the maximum allowed packet length via [socket_buffer_size](/en/server/setting.html#socket-buffer-size) | Required |
| `$serverSocket` | Required when sending data to a [UnixSocket DGRAM](https://github.com/swoole/swoole-src/blob/master/examples/unixsock/dgram_server.php) peer; not needed for TCP servers | `-1`, meaning the currently listening udp port |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> Sending is asynchronous: the underlying layer automatically watches for writability and sends the data to the client progressively, so the peer does not necessarily receive the data as soon as `send` returns.
> The `send` operation is atomic. When multiple processes call `send` on the same `TCP` connection simultaneously, the data will not be interleaved.

> [!WARNING]
> If large amounts of data are sent continuously to the same client and the client cannot receive it fast enough, the memory buffer fills up and the Swoole underlying layer immediately returns `false`.

> [!NOTE]
> In [coroutine mode](/en/server/setting.html#enable-coroutine) with [send_yield](/en/server/setting.html#send-yield) enabled, `send` automatically suspends when the buffer is full; the coroutine resumes and continues sending after the peer has read part of the data.

## sendfile

Sends a file to a `TCP` client connection.

```php
public function sendfile(int $fd, Swoole\SendFile|string $filename, int $offset = 0, int $length = 0, bool $delete_file = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the client's file descriptor | Required |
| `$filename` | The path of the file to send, or a [Swoole\SendFile](/en/server/class/send_file.html) object. Returns `false` if the file does not exist | Required |
| `$offset` | Specifies the file offset, so data can be sent starting from a certain position in the file | `0`, meaning send from the beginning of the file |
| `$length` | Specifies the length to send | `0`, i.e. the file size |
| `$delete_file` | Whether to delete the file automatically when the send task finishes. Available since `v6.3.0` | `false` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> **Notes**
>
> - When `$filename` is a [Swoole\SendFile](/en/server/class/send_file.html) object, the `$offset`, `$length`, and `$delete_file` arguments must not be provided, otherwise a `ValueError` is thrown; the object's properties take effect instead.
> - When `$delete_file` is `true`, the file is deleted automatically when the send task finishes, including when sending fails or the connection closes early, which suits the "generate a temporary file first, then send it" scenario.

## stats

Gets information such as the number of active `TCP` connections on the current server, the start time, and the total counts of `accept/close` (connections established/closed).

```php
public function stats(): array
```

**Example**

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

| Parameter | Description |
|:---|:---|
| start_time | The time the server started |
| connection_num | The current number of connections |
| abort_count | How many connections were rejected |
| accept_count | How many connections were accepted |
| close_count | The number of closed connections |
| worker_num | How many [worker processes](/en/server/process_thread.html#processes-threads) were started |
| task_worker_num | How many [task processes](/en/server/process_thread.html#processes-threads) were started [available since `v4.5.7`] |
| user_worker_num | How many [user processes](/en/server/process_thread.html#processes-threads) were started |
| idle_worker_num | The number of idle worker processes |
| dispatch_count | The number of packets the server dispatched to worker processes [available since `v4.5.7`, only effective in [SWOOLE_PROCESS](/en/server/process_thread.html#working-modes) mode] |
| request_count | The number of requests received by the server [only the four data request types [receive](/en/server/events.html#receive), [message](/en/server/events.html#message), [request](/en/server/events.html#request), [packet](/en/server/events.html#packet) are counted] |
| response_count | The number of responses returned by the server |
| total_recv_bytes | Total bytes of data received |
| total_send_bytes | Total bytes of data sent |
| pipe_packet_msg_id | Inter-process communication id |
| session_round | The starting session id |
| min_fd | The smallest connection fd |
| max_fd | The largest connection fd |
| worker_request_count | The number of requests received by the current worker process [the worker process exits when worker_request_count exceeds max_request] |
| worker_response_count | The number of responses from the current worker process |
| worker_dispatch_count | The count of tasks delivered by the master process to the current worker process; incremented when the [master process](/en/server/process_thread.html#processes-threads) performs dispatch |
| task_idle_worker_num | The number of idle task processes |
| tasking_num | The number of tasks currently being processed |
| coroutine_num | The current number of coroutines |
| coroutine_peak_num | The historical peak number of coroutines |
| task_queue_num | The number of tasks in the message queue |
| task_queue_bytes | The memory usage of the message queue in bytes |

## bind

Binds a connection to a user-defined `UID` and uses this value for fixed `hash`-based assignment. This guarantees that all connections of a given `UID` are assigned to the same `Worker` process.

```php
public function bind(int $fd, int $uid): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the connection's `fd` | Required |
| `$uid` | The `UID` to bind; must be a non-`0` number. Other constraints: the `UID` must not exceed `4294967295` and must not be less than `-2147483648` | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> This feature is restricted to [SWOOLE_PROCESS mode](/en/server/process_thread.html#working-modes) and only takes effect when [dispatch_mode](/en/server/setting.html#dispatch-mode) is `SWOOLE_DISPATCH_UIDMOD`.
> A connection can only be bound with `bind` once. If a `UID` is already bound, calling `bind` again returns `false`.

> [!NOTE]
> If the bound `UID` is negative, the underlying layer converts it to a `32-bit unsigned integer`.
> In some cases the business logic requires rebinding a user connection to a new `UID`. In that case, close the connection, re-establish the `TCP` connection and handshake, and bind to the new `UID`.


## sendto

Sends a `UDP` packet to any client `IP:PORT`.

```php
public function sendto(string $ip, int $port, string $send_data, int $server_socket = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$ip` | Specifies the client `ip`. `$ip` is an `IPv4` or `IPv6` string, such as `192.168.1.102`. Returns an error if the `IP` is invalid | Required |
| `$port` | Specifies the client `port`. `$port` is a network port number in `1-65535`; sending fails if the port is invalid | Required |
| `$send_data` | The data content to send; can be text or binary content | Required |
| `$server_socket` | Specifies the `socket` file descriptor to use, for multi-port scenarios | `-1`, meaning the currently listening udp port |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> **Notes**
>
> - Data can be sent to `IPv4` addresses only if a `UDP` port is being listened on.
> - Data can be sent to `IPv6` addresses only if a `UDP6` port is being listened on.
> - `$ip`, `$port`, and `$serverSocket` can be obtained from [$clientInfo in the packet event callback](/en/server/events.html#packet).

## sendwait

Sends data to a client and waits for the result to return. This method is blocking.

```php
public function sendwait(int $fd, string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the client's file descriptor | Required |
| `$data` | The data to send | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> **Notes**
>
> - `sendwait` can only be used in [SWOOLE_BASE mode](/en/server/process_thread.html#working-modes).
> - Some special scenarios require sending data to a client continuously, while the [send](/en/server/methods.html#send) data-sending interface is purely asynchronous, and sending large amounts of data can fill up the memory send queue. In this case you can use `sendwait`, which waits until the connection is writable and returns only after all data has been sent.
> - `sendwait` is only for local-machine or intranet communication. Do not use `sendwait` for external network connections, and do not use this function when coroutines are enabled via [enable_coroutine](/en/server/setting.html#enable-coroutine), as it will block other coroutines. Only synchronous blocking servers may use it.

## exists

Checks whether the connection corresponding to `fd` exists.

```php
public function exists(int $fd): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | File descriptor | Required |

**Return value**: Returns `true` if it exists, `false` if it does not.

## protect

Sets a client connection to protected state so it is not cut off by the [heartbeat thread](/en/server/setting.html#heartbeat-idle-time).

```php
public function protect(int $fd, bool $is_protected = true): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the client connection `fd` | Required |
| `$is_protected` | The state to set. Other value: `false`, meaning not protected | `true`, meaning protected state |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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

Closes a client connection.

```php
public function close(int $fd, bool $reset = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the `fd` (file descriptor) to close | Required |
| `$reset` | Setting this to `true` forcibly closes the connection and discards the data in the send queue | `false` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> **Notes**
>
> - Actively closing a client connection triggers the [close event](/en/server/events.html#close).
> - Do not write cleanup logic after `close`; it should be handled in the `close event`.

## pause

Pauses receiving data sent from the current connection.

```php
public function pause(int $fd): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the file descriptor | Required |

**Return value**: Returns `true` on success, `false` on failure.

> [!NOTE]
> In [SWOOLE_PROCESS mode](/en/server/process_thread.html#working-modes), some data may have already reached the [worker process](/en/server/process_thread.html#processes-threads), so the [receive event](/en/server/events.html#receive) / [request event](/en/server/events.html#request) / [message event](/en/server/events.html#message) / [packet event](/en/server/events.html#packet) may still be triggered.

## resume

Resumes receiving data sent from the current connection.

```php
public function resume(int $fd): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the file descriptor | Required |

**Return value**: Returns `true` on success, `false` on failure.

## task

Delivers a task to a [task process](/en/server/process_thread.html#working-modes). This function is non-blocking and returns immediately after delivery. The [worker process](/en/server/process_thread.html#working-modes) can continue handling new requests.

```php
public function task(mixed $data, int $dstWorkerId = -1, ?callable $finishCallback = null): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The task data to deliver; must be a serializable PHP variable | Required |
| `$dstWorkerId` | Specifies which `task process` to deliver to. Other values: [task process number](/en/server/properties.html#taskworker) | `-1`, meaning random delivery; the underlying layer automatically selects an idle `task process` |
| `$finishCallback` | The `finish` callback function. If a callback is set for the task, the specified callback is executed directly when `task` returns a result, and the [finish callback](/en/server/events.html#finish) is no longer executed | `null` |

**Return value**: On success, returns the integer `$task_id`, which is the `ID` of this task. If there is a `finish` callback, the `finish callback` carries the `$task_id` parameter. On failure, returns `false`. `$task_id` may be `0`, so you must use `===` to check for failure.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);

$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 4,
));

$server->on('receive', function (Server $server, $fd, $reactor_id, $data) {
    echo "Received data" . $data . "\n";
    $data    = trim($data);
    $server->task($data, -1, function (Server $server, $task_id, $data) {
        echo "Task Callback: ";
        var_dump($task_id, $data);
    });
    $task_id = $server->task($data, 0);
    $server->send($fd, "Task dispatched, task id is $task_id\n");
});

$server->on('task', function (Server $server, $task_id, $reactor_id, $data) {
    echo "Tasker process received data";
    echo "#{$server->worker_id}\tonTask: [PID={$server->worker_pid}]: task_id=$task_id, data_len=" . strlen($data) . "." . PHP_EOL;
    $server->finish($data);
});

$server->on('finish', function (Server $server, $task_id, $data) {
    echo "Task#$task_id finished, data_len=" . strlen($data) . PHP_EOL;
});

$server->start();
```

> [!WARNING]
> **Notes**
>
> - The `task` method cannot be used inside a `task` process.
> - You must configure [task_worker_num](/en/server/setting.html#task-worker-num) and register the [task event](/en/server/events.html#task) and [finish event](/en/server/events.html#finish) to use the `task` method.
> - Tasks delivered from the [master](/en/server/process_thread.html#processes-threads), [manager](/en/server/process_thread.html#processes-threads), or [user](/en/server/process_thread.html#processes-threads) processes are one-way; the results returned after processing by the `task process` cannot be received.
> - When the passed `$data` exceeds `8K`, a temporary file is used to store it. When the temporary file content exceeds [package_max_length](/en/server/setting.html#package-max-length), the underlying layer emits a warning. This warning does not affect task delivery, but overly large data may cause performance issues.

## taskwait

Delivers a task to a [task process](/en/server/process_thread.html#working-modes) and waits for the task to complete or time out.

```php
public function taskwait(mixed $data, float $timeout = 0.5, int $taskWorkerIndex = -1): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The task data to deliver; can be of any type. Non-string types are automatically serialized by the underlying layer | Required |
| `$timeout` | The timeout, a float in seconds, with a minimum granularity of `1ms`. If the `task process` does not return data within the specified time, `taskwait` returns `false` and no longer processes subsequent task result data | `0.5` |
| `$taskWorkerIndex` | Specifies which `task process` to deliver to. Other values: [task process number](/en/server/properties.html#taskworker) | `-1`, meaning random delivery; the underlying layer automatically selects an idle `task process` |

**Return value**: Returns `false` if delivery fails. If the `finish` method or `return` is executed in the `task` event, `taskwait` returns the result of the delivered `task`.

> [!WARNING]
> **Notes**
>
> - The `taskwait` method cannot be used inside a `task` process.
> - You must configure [task_worker_num](/en/server/setting.html#task-worker-num) and register the [task event](/en/server/events.html#task) to use the `taskwait` method.
> - Tasks delivered from the [master](/en/server/process_thread.html#processes-threads), [manager](/en/server/process_thread.html#processes-threads), or [user](/en/server/process_thread.html#processes-threads) processes are one-way; the results returned after processing by the `task process` cannot be received.
> - When the passed `$data` exceeds `8K`, a temporary file is used to store it. When the temporary file content exceeds [package_max_length](/en/server/setting.html#package-max-length), the underlying layer emits a warning. This warning does not affect task delivery, but overly large data may cause performance issues.

## taskWaitMulti

Executes multiple `task` async tasks concurrently, with the [worker process](/en/server/process_thread.html#processes-threads) waiting for the tasks to complete or time out.

```php
public function taskWaitMulti(array $tasks, float $timeout = 0.5): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$tasks` | Must be a numerically indexed array; associative arrays are not supported. The underlying layer iterates `$tasks` and delivers the tasks one by one to each [task process](/en/server/process_thread.html#working-modes) | Required |
| `$timeout` | A float in seconds | `0.5` seconds |

**Return value**: When tasks complete or time out, returns a result array. The order of each task result in the result array corresponds to `$tasks`; for example, the result for `$tasks[2]` is `$result[2]`. A task timing out does not affect other tasks; the returned result data will not contain the timed-out tasks.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 4,
));

$server->on('receive', function (Server $server, $fd, $reactor_id, $data) {
    $tasks[] = mt_rand(1000, 9999); // Task 1
    $tasks[] = mt_rand(1000, 9999); // Task 2
    $tasks[] = 0; // Task 3
    $tasks[] = mt_rand(1000, 9999); // Task 4
    $results = $server->taskWaitMulti($tasks, 2); // Task 3 sleeps for 5 seconds during execution and times out, so $result[2] is absent from the returned results
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
> **Notes**
>
> - The maximum number of concurrent tasks must not exceed `1024`
> - The `taskWaitMulti` method cannot be used inside a `task` process.

## taskCo

Executes multiple synchronous tasks concurrently in the current coroutine environment and waits for all task results to return. This process does not block the [worker process](/en/server/process_thread.html#processes-threads), so it can greatly improve processing efficiency.

```php
public function taskCo(array $tasks, float $timeout = 0.5): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$tasks` | Must be a numerically indexed array; associative arrays are not supported. The underlying layer iterates `$tasks` and delivers the tasks one by one to each [task process](/en/server/process_thread.html#processes-threads) | Required |
| `$timeout` | A float in seconds. If not all tasks complete within the specified time, the current async tasks are immediately aborted and results are returned | `0.5` seconds |

**Return value**: When tasks complete or time out, returns a result array. The order of each task result in the result array corresponds to `$tasks`; for example, the result for `$tasks[2]` is `$result[2]`. If a task fails or times out, its corresponding result array item is `false`; for example, if `$tasks[2]` fails, the value of `$result[2]` is `false`.

**Example**

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
> **Notes**
>
> - The maximum number of concurrent tasks must not exceed `1024`
> - The `taskCo` method cannot be used inside a `task` process.

## finish

Used in the [task method](/en/server/methods.html#task) to notify the [worker process](/en/server/process_thread.html#processes-threads) that the delivered task has completed. This function can pass result data to the `worker process`.

```php
public function finish(mixed $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The result content of the task processing | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);

$server->set(array(
    'worker_num'      => 2,
    'task_worker_num' => 4,
));

$server->on('receive', function (Server $server, $fd, $reactor_id, $data) {
    echo "Received data" . $data . "\n";
    $data    = trim($data);
    $server->task($data, -1, function (Server $server, $task_id, $data) {
        echo "Task Callback: ";
        var_dump($task_id, $data);
    });
    $task_id = $server->task($data, 0);
    $server->send($fd, "Task dispatched, task id is $task_id\n");
});

$server->on('task', function (Server $server, $task_id, $reactor_id, $data) {
    echo "Tasker process received data";
    echo "#{$server->worker_id}\tonTask: [PID={$server->worker_pid}]: task_id=$task_id, data_len=" . strlen($data) . "." . PHP_EOL;
    $server->finish($data);
});

$server->on('finish', function (Server $server, $task_id, $data) {
    echo "Task#$task_id finished, data_len=" . strlen($data) . PHP_EOL;
});

$server->start();
```

> [!WARNING]
> **Notes**
>
> - The `finish` method can be called multiple times; the `worker process` will trigger the [finish event](/en/server/events.html#finish) multiple times.
> - If the `worker process` does not care about the task execution result, there is no need to call the `finish` method.
> - Returning a string with `return` in the [task method](/en/server/methods.html#task) is equivalent to calling `finish`.
> - The `finish` method can only be used in the `task method`, and the `finish event` must be registered beforehand.

## reload

Restarts all [worker processes](/en/server/process_thread.html#processes-threads) and [task processes](/en/server/process_thread.html#processes-threads).

```php
public function reload(bool $only_reload_taskworker = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$only_reload_taskworker` | Whether to restart only `task processes`. Other value: `true` | `false` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_SOCK_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, "Hello World");
    $server->reload(); // Restart worker processes and task processes
});

$server->start();
```

> [!WARNING]
> **Notes**
>
> - `reload` has a protection mechanism: while a `reload` is in progress, new restart signals received are discarded.
> - If [user](/en/server/setting.html#user) or [group](/en/server/setting.html#group) is set, `worker` processes and `task` processes cannot use the `reload` method to send signals to the `master process` / `manager process`; however, this issue has been resolved since `v6.2.0`.
> - Sending the `SIGUSR1` signal to the [master process](/en/server/process_thread.html#processes-threads) or [manager process](/en/server/process_thread.html#processes-threads) gracefully `restart`s all `worker` processes and `task` processes.
> - Sending the `SIGUSR2` signal to the `master process` / `manager process` gracefully restarts all `task processes`.
> - When [worker_num](/en/server/setting.html#worker-num) is 1, this method has no effect.
> - It must be combined with [reload_async](/en/server/setting.html#reload-async) to achieve a graceful restart.

## shutdown

Shuts down the server.

```php
public function shutdown(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> **Notes**
>
> - This method can be used inside a [worker process](/en/server/process_thread.html#processes-threads).
> - Sending `SIGTERM` to the [master process](/en/server/process_thread.html#processes-threads) or [manager process](/en/server/process_thread.html#processes-threads) also shuts down the service.

## heartbeat

Enables heartbeat probing to check whether the connections maintained by the current process are still valid.

```php
public function heartbeat(bool $ifCloseConnection = true): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$ifCloseConnection` | Whether to forcibly close invalid connections when found. Other value: `false` | `true` |

**Return value**: Returns `false` if [heartbeat_check_interval](/en/server/setting.html#heartbeat-check-interval) is not set; otherwise returns an array of the closed connections.

**Example**

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
> The difference from [heartbeat_idle_time](/en/server/setting.html#heartbeat-idle-time) is that `heartbeat_idle_time` performs heartbeat checks automatically, without requiring the user to implement it in code with a timer as in the example.

## getClientList

Gets client connections.

```php
public function getClientList(int $start_fd = 0, int $pageSize = 10): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$start_fd` | Specifies the starting `fd` | `0` |
| `$pageSize` | How many entries to fetch per page; must not exceed `100` | `10` |

**Return value**: On success, returns a numerically indexed array sorted in ascending order, whose elements are the fetched `$fd` values. Use the last `$fd` as the starting position for the next query. Returns `false` on failure.

> [!WARNING]
> **Notes**
>
> - It is recommended to use the [connections property](/en/server/properties.html#connections) iterator to traverse connections.
> - `getClientList` can only get `tcp` client connections.
> - In [SWOOLE_BASE mode](/en/server/process_thread.html#working-modes) and [SWOOLE_THREAD mode](/en/server/process_thread.html#working-modes), only the client connections of the current process/thread can be obtained; [SWOOLE_PROCESS mode](/en/server/process_thread.html#working-modes) can get the `tcp` connections of the entire server.

## getClientInfo

Gets the client information of the specified connection.

```php
public function getClientInfo(int $fd, int $reactor_id = -1, bool $ignoreError = false): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | Specifies the file descriptor | Required |
| `$reactor_id` | The thread number of the [reactor thread](/en/server/process_thread.html#processes-threads) the connection belongs to. Currently has no effect; kept only for API compatibility | `-1` |
| `$ignoreError` | Whether to ignore errors. If set to `true`, connection information is returned even if the connection is closed; `false` means `false` is returned once the connection is closed | `false` |

**Return value**: On success, returns an array containing client information; returns `false` on failure.

| Parameter | Description |
|:---|:---|
| server_port | The server listening port |
| server_fd | The server fd |
| socket_fd | The client fd |
| socket_type | The socket type |
| remote_port | The client port |
| remote_ip | The client IP |
| reactor_id | Which Reactor thread it comes from |
| connect_time | The time the client connected to the server, in seconds, set by the master process |
| last_time | The time data was last received, in seconds, set by the master process |
| last_recv_time | The time data was last received, in seconds, set by the master process |
| last_send_time | The time data was last sent, in seconds, set by the master process |
| last_dispatch_time | The time the worker process received the data |
| close_errno | The error code of the connection close. If the connection closed abnormally, close_errno is non-zero; refer to the Linux error message list |
| recv_queued_bytes | The amount of data waiting to be processed |
| send_queued_bytes | The amount of data waiting to be sent |
| websocket_status | [Optional] WebSocket connection status; this extra item is added when the server is `Swoole\WebSocket\Server` |
| uid | [Optional] This extra item is added when a user ID has been bound with `bind` |
| ssl_client_cert | [Optional] This extra item is added when SSL tunnel encryption is used and the client has set a certificate |

> [!WARNING]
> **Notes**
>
> - `ssl_client_cert` can only be obtained by calling `getClientInfo` in the [connect event](/en/server/events.html#connect). It is in `x509` format; you can use the `openssl_x509_parse` function to get the certificate information.
> - When [dispatch_mode](/en/server/setting.html#dispatch-mode) is `SWOOLE_DISPATCH_ROUND` or `SWOOLE_DISPATCH_IDLE_WORKER`, these client connections are stateless. Once a connection disconnects, its information is deleted directly from memory, so `getClientInfo` cannot query the information of these connections.

## getWorkerId

Gets the [number](/en/server/setting.html#worker-num) of the current [worker process](/en/server/process_thread.html#processes-threads) or the [number](/en/server/setting.html#task-worker-num) of the [task process](/en/server/process_thread.html#processes-threads).

```php
public function getWorkerId(): int|false
```

**Return value**: Returns `false` if the process does not exist; otherwise returns the process number.

## getWorkerPid

Gets the `PID` of the specified [worker process](/en/server/process_thread.html#processes-threads) or the `PID` of the [task process](/en/server/process_thread.html#processes-threads).

```php
public function getWorkerPid(int $worker_id = -1): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$worker_id` | Gets the pid of the specified process; `-1` means the current process | `-1` |

**Return value**: Returns `false` if the process does not exist; otherwise returns the process `PID`.

## getWorkerStatus

```php
public function getWorkerStatus(int $worker_id = -1): int|false
```

## getManagerPid

Gets the process `PID` of the [manager process](/en/server/process_thread.html#processes-threads).

```php
public function getManagerPid(): int
```

**Return value**: Returns a process `PID` greater than 0.

## getMasterPid

Gets the process `PID` of the [master process](/en/server/process_thread.html#processes-threads).

```php
public function getMasterPid(): int
```

**Return value**: Returns a process `PID` greater than 0.

> [!NOTE]
> Only [SWOOLE_PROCESS](/en/server/process_thread.html#working-modes) has a `master process`.

## getSocket

Calling this method gets the underlying `socket` handle. The returned object is a `sockets` resource handle.

```php
public function getSocket(int $port = 0): false|\Socket
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$port` | Specifies the listening port. Other values: the sub-ports of [multi-port listening](/en/server/port.html) | The port listened on by the [__construct](/en/server/methods.html#construct) method |

**Return value**: Returns `false` if the listening port does not exist; otherwise returns a `php` `Socket object`.

**Example**

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
        'group' => '224.10.20.30', // The multicast address
        'interface' => 'eth0' // The network interface name; can be a number or a string, such as eth0, wlan0
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
> This method depends on PHP's `sockets` extension, and the `--enable-sockets` option must be enabled when compiling `Swoole`

## push

A `websocket` server pushes data to a `websocket` client.

```php
public function push(int $fd, Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | The file descriptor of the client connection | Required |
| `$data` | The data content to send | Required |
| `$opcode` | Specifies the format of the data content to send; text by default. To send binary content, the `$opcode` parameter must be set to `SWOOLE_WEBSOCKET_OPCODE_BINARY`. Other values: `SWOOLE_WEBSOCKET_OPCODE_BINARY`, `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | Flag bits. Other values: `SWOOLE_WEBSOCKET_FLAG_RSV1`, `SWOOLE_WEBSOCKET_FLAG_RSV2`, `SWOOLE_WEBSOCKET_FLAG_RSV3`, `SWOOLE_WEBSOCKET_FLAG_MASK`, `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

- Send a single data frame, without compression

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

- Send a compressed data frame

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'websocket_compression' => true  // Enable frame compression
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

- Send continuation frames, without compression

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    // Send continuation frames,
    $response = new Frame();
    
    for ($i = 0; $i < 100; $i++) {
      $response->data = base64_encode(random_bytes(200));
      if ($i == 0) {
        // The first frame must be set to SWOOLE_WEBSOCKET_OPCODE_TEXT or SWOOLE_WEBSOCKET_OPCODE_BINARY
        $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
      } else {
        // Subsequent frames must be set to SWOOLE_WEBSOCKET_OPCODE_CONTINUATION
        $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
      }
      
      $response->finish = $i == 99;  // All frames except the last one (set to true) must be false
      $server->push($frame->fd, $response);
    }
});

$server->start();
```

- Compress the data first, then send continuation frames

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->set([
    'websocket_compression' => true  // Enable frame compression
]);
$server->on('message', function(Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));

    $context = deflate_init(ZLIB_ENCODING_RAW);
    // The underlying layer does not know how many chunks the compressed data frame needs to be split into, so this step must be implemented by the user
    // The first frame must manually set finish to false and flags to SWOOLE_WEBSOCKET_FLAG_COMPRESS and SWOOLE_WEBSOCKET_FLAG_RSV1, and must not set SWOOLE_WEBSOCKET_FLAG_FIN, indicating this is a compressed data frame
    $response = new Frame();
    $response->data = deflate_add($context, $data1, ZLIB_SYNC_FLUSH);
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    $response->flags = SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1;
    $response->finish = false;
    $server->push($frame->fd, $response);
    
    // The remaining continuation frames must set opcode to SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, flags to 0, and finish to false
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
    $response->flags = 0;
    $response->finish = false;
    $server->push($frame->fd, $response);
    
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $server->push($frame->fd, $response);
    $response->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
    $server->push($frame->fd, $response);
    
    // The last continuation frame must set finish to true and flags to SWOOLE_WEBSOCKET_FLAG_FIN, indicating that all data has been sent
    $response->data = deflate_add($context, $data3, ZLIB_SYNC_FLUSH);
    $response->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
    $response->finish = true;
    $server->push($frame->fd, $response);
});

$server->start();
```

- Send control frames (`ping`, `pong`, and `close`)

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

**Supported opcodes**

| Constant | Meaning | Description |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_OPCODE_TEXT` | Text frame | Carries UTF-8 text data |
| `SWOOLE_WEBSOCKET_OPCODE_BINARY` | Binary frame | Carries binary data |
| `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | Continuation frame | Used for subsequent frames of a fragmented message |
| `SWOOLE_WEBSOCKET_OPCODE_CLOSE` | Close frame | Indicates the connection is closing |
| `SWOOLE_WEBSOCKET_OPCODE_PING` | Ping frame | Heartbeat check request |
| `SWOOLE_WEBSOCKET_OPCODE_PONG` | Pong frame | Heartbeat check response |

**Supported flags**

| Constant | Meaning | Description |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_FLAG_FIN` | Finish flag | Indicates whether the current frame is the last frame of the message |
| `SWOOLE_WEBSOCKET_FLAG_RSV1` | RSV1 flag | Reserved bit 1 for protocol extensions, usually used for compression (e.g. Per-Message Deflate) |
| `SWOOLE_WEBSOCKET_FLAG_RSV2` | RSV2 flag | Reserved bit 2 for protocol extensions |
| `SWOOLE_WEBSOCKET_FLAG_RSV3` | RSV3 flag | Reserved bit 3 for protocol extensions |
| `SWOOLE_WEBSOCKET_FLAG_MASK` | Mask flag | Indicates whether the data payload is masked (must be set for client-to-server data) |
| `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | Compression flag | Indicates whether the current frame's data is compressed (usually used together with RSV1) |

> [!WARNING]
> **Notes**
>
> - The underlying layer handles control frames automatically, so in general users do not need to handle control frames manually.
> - The `push` method is exclusive to the `Swoole\WebSocket\Server` class.
> - When using `Swoole\WebSocket\Frame` and `Swoole\WebSocket\CloseFrame`, set `$data`, `$opcode`, and `$flags` through the object's **properties**; these three values in the **method parameters** are ignored.

## isEstablished

Checks whether the specified `websocket` client connection is valid.

```php
public function isEstablished(int $fd): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | The file descriptor of the client connection | Required |

**Return value**: Returns `true` if the connection is valid, otherwise `false`.

**Example**

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
> **Notes**
>
> - Unlike [exists](/en/server/methods.html#exists), the `exists` method only checks whether it is a `TCP` connection and cannot determine whether it is a `WebSocket` client that has completed the handshake.
> - The `isEstablished` method is exclusive to the `Swoole\WebSocket\Server` class.

## pack

Packs a `webSocket` data frame.

```php
public static function pack(Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The message content | Required |
| `$opcode` | Specifies the format of the data content to send; text by default. To send binary content, the `$opcode` parameter must be set to `SWOOLE_WEBSOCKET_OPCODE_BINARY`. Other value: `SWOOLE_WEBSOCKET_OPCODE_BINARY` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | Frame flags; `SWOOLE_WEBSOCKET_FLAG_FIN` indicates the frame is finished, with a value of `1` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

> [!NOTE]
> Since `v4.4.12`, the `finish` parameter (`bool` type) was changed to the `flags` parameter (`int` type) to support `WebSocket` compression; the original `bool` values are implicitly converted to `int`, so this change is backward compatible with no impact. The `mask` parameter was removed in `v4.4.12`.

**Return value**: On success, returns the packed `WebSocket` packet; on failure, returns an empty string.

**Example**

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
> **Notes**
>
> - `pack` has fairly specific use cases; the most common is packing data into data frames in a [TCP server](/en/server/tcp_udp.html) to send to `WebSocket` clients.
> - If `$data` is a `Swoole\WebSocket\Frame` object, its `$opcode` and `$finish` properties override the corresponding values in the method parameters.
> - If there are no special requirements, use [Swoole\WebSocket\Server](/en/server/websocket.html) directly; data packing and parsing are automatic.
> - The `pack` method is exclusive to the `Swoole\WebSocket\Server` class.

## unpack

Parses a `webSocket` data frame.

```php
public static function unpack(string $data): Swoole\WebSocket\Frame
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The message content | Required |

**Return value**: On success, returns a [Swoole\WebSocket\Frame object](/en/server/class/frame.html); on failure, returns `false`.

> [!WARNING]
> **Notes**
>
> - `unpack` has fairly specific use cases; the most common is parsing data sent by `WebSocket` clients in a [TCP server](/en/server/tcp_udp.html).
> - If there are no special requirements, use [Swoole\WebSocket\Server](/en/server/websocket.html) directly; data packing and parsing are automatic.
> - The `unpack` method is exclusive to the `Swoole\WebSocket\Server` class.

## disconnect

A `websocket` server actively closes the specified client connection.

```php
public function disconnect(int $fd, int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | The file descriptor of the client connection | Required |
| `$code` | The status code for closing the connection. Per `RFC6455`, application close status codes must be `1000` or in the range `4000-4999` | `SWOOLE_WEBSOCKET_CLOSE_NORMAL` |
| `$reason` | The reason for closing the connection; a `utf-8` string of no more than `125` bytes | Required |

**Return value**: Returns `true` on successful sending; returns `false` if sending fails or the status code is invalid.

**Example**

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
> **Notes**
>
> - Use `disconnect` to close `websocket` connections; this method automatically sends a `close` frame to the client and closes the connection.
> - The `disconnect` method is exclusive to the `Swoole\WebSocket\Server` class.

**Supported status codes**

| Status code constant | Description |
|:---|:---|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL | **Normal closure** - the connection has completed its work and ends normally |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY | **Going away** - the endpoint is leaving (e.g. browser navigation or page close) |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR | **Protocol error** - the endpoint received data that does not conform to the WebSocket protocol |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR | **Data type error** - received a data type that cannot be processed (e.g. an endpoint that only accepts text received binary) |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR | **Invalid status code** - a status code was expected but not received (not actually sent; for application use) |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL | **Abnormal closure** - the connection dropped unexpectedly (e.g. dropped without receiving a close frame; not actively sent) |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR | **Message format error** - received a message that does not conform to the specification (e.g. UTF-8 encoding error) |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR | **Policy violation** - the message violates server policy (a generic rejection reason) |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG | **Message too big** - the message length exceeds what the endpoint is willing to process |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING | **Extension missing** - the client expected the server to negotiate a specific extension, but the server did not provide it (client-only) |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR | **Internal server error** - the server encountered an unexpected condition and could not fulfill the request |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER | **Try again later** - the server is temporarily overloaded or under maintenance; reconnect later |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY | **Bad gateway** - the gateway or proxy received an invalid upstream response |
| SWOOLE_WEBSOCKET_CLOSE_TLS | **TLS handshake failure** - closed before the TLS handshake completed (not actively sent) |

## ping

A `websocket` server sends a `ping` frame to a client.

```php
public function ping(int $fd, string $data = ""): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | The file descriptor of the client connection | Required |
| `$data` | The data the `ping` frame should carry | `''` |

**Return value**: Returns `true` on successful sending, `false` on failure.

**Example**

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
> **Notes**
>
> - Unless [open_websocket_pong_frame](/en/server/setting.html#open-websocket-pong-frame) is set to `true`, `pong` frames sent by clients are handled automatically by the underlying layer.
> - The `ping` method is exclusive to the `Swoole\WebSocket\Server` class.

## setHandler

Registers the handling logic for `Redis` server commands. You can use it to specify how the server responds to `LPUSH`, `GET`, and `SET` commands.

```php
public function setHandler(string $command, callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$command` | The name of the command | Required |
| `$callback` | The command handler function. When the callback returns a string, it is automatically sent to the client | Required |

**Return value**: Returns `true` on successful registration, `false` on failure.

**$callback function signature**

```php
function(int $fd, array $data)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fd` | The file descriptor of the current connection | Required |
| `$data` | The data sent by the client. For example, if the client sends the command `set name swoole`, then `$data[0]` is `name`, `$data[1]` is `swoole`, and so on | Required |

**Example**

```php
<?php
use Swoole\Redis\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(['worker_num' => 1]);
$server->setHandler('get', function(int $fd, array $data) use ($server) {
    if (count($data) == 0) {
        // String data returned via return is sent to the redis client by the underlying layer
        return Server::format(Server::ERROR, "ERR wrong number of arguments for 'GET' command");
    }
    // When a get command is sent from a redis client, the server returns hello
    $server->send($fd, Server::format(Server::STRING, "hello"));
});
$server->start();
```

> [!WARNING]
> **Notes**
>
> - If `$callback` returns string data via `return`, the underlying layer sends this return value back to the `redis` client.
> - The `setHandler` method is exclusive to the `Swoole\Redis\Server` class.

## getHandler

Gets the handling logic of the specified `Redis` server command.

```php
public function getHandler(string $command): \Closure
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$command` | The name of the command | Required |

**Return value**: On success, returns the corresponding callback function.

> [!NOTE]
> The `getHandler` method is exclusive to the `Swoole\Redis\Server` class.

## format

Formats `PHP` data into the standard `Redis` communication protocol `(RESP)` format, making it easy for the server to return it to the client

```php
public static function format(int $type, mixed $value = null): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$type` | The data type | Required |
| `$value` | The data to format | Required |

**Return value**: On success, returns the formatted data; on failure, returns `false`.

**Example**

```php
<?php
use Swoole\Redis\Server;
$server = new Server("127.0.0.1", 9501, SWOOLE_BASE);
$server->set(['worker_num' => 1]);
$server->setHandler('get', function(int $fd, array $data) use ($server) {
    if (count($data) == 0) {
        return Server::format(Server::ERROR, "ERR wrong number of arguments for 'GET' command");
    }
    // When a get command is sent from a redis client, the server returns hello
    $server->send($fd, Server::format(Server::STRING, "hello"));
});
$server->start();
```

**Supported data types**

| Constant | Description |
|:---|:---|
| Swoole\Redis\Server::NIL | Returns nil data |
| Swoole\Redis\Server::ERROR | Returns an error code |
| Swoole\Redis\Server::STATUS | Returns a status |
| Swoole\Redis\Server::INT | Returns an integer; format must be passed a value, and the type must be an integer |
| Swoole\Redis\Server::STRING | Returns a string; format must be passed a value, and the type must be a string |
| Swoole\Redis\Server::SET | Returns a list; format must be passed a value, and the type must be an array |
| Swoole\Redis\Server::MAP | Returns a Map; format must be passed a value, and the type must be an associative array |

> [!NOTE]
> The `format` method is exclusive to the `Swoole\Redis\Server` class.