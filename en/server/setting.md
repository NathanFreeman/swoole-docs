# Configuration

The [Swoole\Server->set()](/en/server/methods.html#set) method is used to set the runtime parameters of `Swoole\Server`, `Swoole\Http\Server`, `Swoole\WebSocket\Server`, and `Swoole\Redis\Server`.

If you have already read the [Multi-port listening](/en/server/port.html) chapter, the configuration options of the [Swoole\Server\Port->set()](/en/server/port.html) method mentioned there can also be found here.

**Example**

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
> Since v4.5.5, the underlying layer validates configuration options. If you set an option that Swoole does not support, a warning is emitted.

```shell
PHP Warning:  unsupported option [foo] in @swoole-src/library/core/Server/Helper.php
```

## worker_num

Sets the number of [worker processes](/en/server/process_thread.html#worker) to start. The default is the number of `CPU` cores.

`worker` processes handle the actual business logic. Setting this value properly directly affects the server's processing capacity.

**Example**

```php
<?php
$server->set(['worker_num' => 4]);
```

> [!NOTE]
> **Numbering**
>
> - If `worker_num` is set to 4, the `worker` process IDs range over `[0, worker_num - 1]`, i.e. `[0, 3]`.

> [!WARNING]
> **Notes**
>
> - If `1` request takes `100ms`, providing `1000QPS` of processing capacity requires `100` processes or more. However, the more processes you start, the more memory is consumed, and the greater the context-switching overhead between processes. So keep this value moderate; do not set it too high.
> - If the business code uses async IO, setting this to the number of `CPU` cores is the most reasonable choice.
> - If the business code uses synchronous IO, adjust it according to request response time and system load, e.g. the number of `CPU` cores * (2 - 4) or even more.
> - The default is the server's number of `CPU` cores; the maximum must not exceed the server's number of `CPU` cores * 1000.
> - Assuming each process uses `40M` of memory, `100` processes require `4G` of memory.
> - In `SWOOLE_THREAD` mode, this parameter represents the number of threads created.

## reactor_num

Sets the number of [reactor threads](/en/server/process_thread.html#master) to start. The default is the number of `CPU` cores. This option only applies to `SWOOLE_PROCESS` mode.

`reactor` threads are responsible for accepting client connections and network requests; they are `Swoole`'s "network event listeners". Each `reactor` thread independently maintains an `EventLoop`, runs lock-free relative to the other threads, and can execute in parallel on a 128-core CPU, then forwards the received request data to `worker` processes for handling.

**Example**

```php
<?php
$server->set(['reactor_num' => 4]);
```

> [!WARNING]
> **Notes**
>
> - It is recommended to set `reactor_num` to `1-4` times the number of `CPU` cores.
> - `reactor_num` must not exceed the number of `CPU` cores * `4`.
> - `reactor_num` must be less than or equal to `worker_num`. If the configured `reactor_num` is greater than `worker_num`, it is automatically adjusted so that `reactor_num` equals `worker_num`.
> - On machines with more than `8` cores, `reactor_num` defaults to `8`.
> - Setting [dispatch_func](/en/server/setting.html#dispatch-func) forces `reactor_num` to `1`.

## task_worker_num

Configuring [task processes](/en/server/process_thread.html#task) enables the time-consuming task dispatch feature. You must then register both the [task event](/en/server/events.html#task) and [finish event](/en/server/events.html#finish) callbacks, otherwise the server program cannot start.

**Example**

```php
<?php
$server->set(['task_worker_num' => 4]);
$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) {
    echo $data . PHP_EOL;
});
$server->on('finish', function (Server $server, int $taskId, mixed $data) {
    echo $data . PHP_EOL; // The task process returns data via `Swoole\Server->finish()`
});
```

> [!NOTE]
> **Numbering**
>
> - If [worker_num](/en/server/setting.html#worker-num) is 4 and `task_worker_num` is 8, the `task` process IDs range over `[worker_num, worker_num + task_worker_num - 1]`, i.e. `[4, 11]`.

> [!WARNING]
> **Notes**
>
> - The number of `task` processes must not exceed the server's number of `CPU` cores * 1000.
> - Assuming a single `task` process takes `100ms` per task, one process can handle `1/0.1=10` tasks per second.

## enable_coroutine

Controls whether coroutines are automatically created in [event callbacks](/en/server/events.html) to execute business logic. The default is `true`.

**Example**

```php
<?php
$server->set(['enable_coroutine' => true]);
```

> [!TIP]
> **Configuration methods**
>
> - Set `swoole.enable_coroutine = 'Off'` in `php.ini` (see the ini configuration documentation for details)
> - Setting it via `$server->set(['enable_coroutine' => false]);` takes precedence over `php.ini`

> [!NOTE]
> **Notes**
>
> - When `enable_coroutine = true`, the underlying layer automatically creates coroutines in events such as `request`.
> - When `enable_coroutine = false`, the underlying layer does not create coroutines automatically. If your business logic does not need coroutines, disabling this option can improve performance somewhat. If you need coroutines, create them yourself with `go()`; without the coroutine feature, the behavior is exactly the same as Swoole 1.x.
> - Enabling this option only means requests are handled via coroutines. If the callback contains blocking operations (such as `sleep`, the `mysqlnd` extension, etc.), you must additionally configure [hook_flags](/en/server/setting.html#hook-flags) to hook blocking functions and extensions into coroutines.

> [!NOTE]
> **Event callbacks affected by `enable_coroutine`**
>
> - [workerStart](/en/server/events.html#workerstart)
> - [connect](/en/server/events.html#connect)
> - [open](/en/server/events.html#open)
> - [receive](/en/server/events.html#receive)
> - [setHandler](/en/server/methods.html#sethandler)
> - [packet](/en/server/events.html#packet)
> - [request](/en/server/events.html#request)
> - [message](/en/server/events.html#message)
> - [pipeMessage](/en/server/events.html#pipemessage)
> - [finish](/en/server/events.html#finish)
> - [close](/en/server/events.html#close)

## task_enable_coroutine

Enables coroutines in [task processes](/en/server/process_thread.html#task). Once enabled, a coroutine and a [coroutine container](/en/coroutine/container.html) are automatically created in the [task event callback](/en/server/events.html#task), so you can use coroutine `API`s directly.

**Example**

```php
<?php
$server->set([
    'enable_coroutine' => true,
    'task_enable_coroutine' => true,
]);
```

> [!NOTE]
> **Notes**
>
> - `task_enable_coroutine` can only be used when [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`.
> - This option is supported since `Swoole 4.2.12`.

## hook_flags

Sets which blocking functions or extensions should be replaced with coroutine versions to achieve async, non-blocking coroutine scheduling. By default, no blocking functions or extensions are replaced.

**Example**

```php
<?php
$server->set([
    'hook_flags' => SWOOLE_HOOK_SLEEP | SWOOLE_HOOK_NATIVE_CURL,
]);
```

**Supported hook options**

You can use `SWOOLE_HOOK_ALL` to enable all hook options at once, or combine the following constants as needed:

| Constant                        | Description                                                 |
|:--------------------------------|:-----------------------------------------------------------|
| `SWOOLE_HOOK_TCP`               | TCP operations (such as `stream_socket_client`)             |
| `SWOOLE_HOOK_UNIX`              | Unix Socket operations                                      |
| `SWOOLE_HOOK_UDP`               | UDP operations                                              |
| `SWOOLE_HOOK_UDG`               | Unix datagram sockets                                       |
| `SWOOLE_HOOK_SSL`               | SSL wrapper layer                                           |
| `SWOOLE_HOOK_TLS`               | TLS wrapper layer                                           |
| `SWOOLE_HOOK_SLEEP`             | Sleep functions such as `sleep`, `usleep`, `time_nanosleep`, `time_sleep_until` |
| `SWOOLE_HOOK_FILE`              | File operations (such as `fread`, `fwrite`, `file_get_contents`, etc.) |
| `SWOOLE_HOOK_STREAM_FUNCTION`   | Stream functions (such as `stream_select`, `stream_set_blocking`) |
| `SWOOLE_HOOK_BLOCKING_FUNCTION` | Various blocking functions (such as `gethostbyname`, `exec`, `shell_exec`, etc.) |
| `SWOOLE_HOOK_PROC`              | Process operations (such as `proc_open`)                    |
| `SWOOLE_HOOK_CURL`              | CURL hooking (basic version)                                |
| `SWOOLE_HOOK_NATIVE_CURL`       | Native CURL hooking (more complete, recommended)            |
| `SWOOLE_HOOK_SOCKETS`           | Functions of the sockets extension                          |
| `SWOOLE_HOOK_STDIO`             | Standard input/output (such as `stdin`, `stdout`, `stderr`) |
| `SWOOLE_HOOK_PDO_PGSQL`         | PDO PostgreSQL driver hooking                               |
| `SWOOLE_HOOK_PDO_ODBC`          | PDO ODBC driver hooking                                     |
| `SWOOLE_HOOK_PDO_ORACLE`        | PDO Oracle driver hooking                                   |
| `SWOOLE_HOOK_PDO_SQLITE`        | PDO SQLite driver hooking                                   |
| `SWOOLE_HOOK_ALL`               | Enables all of the hook options above                       |

> [!TIP]
> **Version requirements**
>
> - Available in Swoole `v4.5+` or [4.4LTS](https://github.com/swoole/swoole-src/tree/v4.4.x); see [Coroutine hooks](/en/coroutine/hook.html) for details

## enable_reuse_port

Enables port reuse. Once enabled, multiple processes or services can listen on the same port simultaneously (kernel support required). The default is `false`.

**Example**

```php
<?php
$server->set(['enable_reuse_port' => true]);
```

> [!TIP]
> **Availability**
>
> - Only available on `Linux-3.9.0` and later kernels, with `Swoole4.5` and later versions

## enable_deadlock_check

Enables coroutine deadlock detection. The default is `false`.

**Example**

```php
<?php
$server->set(['enable_deadlock_check' => true]);
```

> [!WARNING]
> **Notes**
>
> - The underlying layer periodically checks the state of all coroutines. When it detects that all coroutines are asleep and no event can wake them, it triggers an error like `[fatal error]: all coroutines (count: N) are asleep - deadlock!`.

## enable_preemptive_scheduler

Enables preemptive coroutine scheduling to prevent one long-running coroutine from starving the others. The default is `false`.

**Example**

```php
<?php
$server->set(['enable_preemptive_scheduler' => true]);
```

> [!NOTE]
> **Notes**
>
> - Some coroutines may perform no `I/O` at all, occupying the CPU continuously so other coroutines cannot run. Once enabled, the current coroutine is checked every `10ms` by default; if it has been running too long, it is forcibly "interrupted" to yield the `CPU` to other coroutines.

## enable_unsafe_event

Enables the [connect callback event](/en/server/events.html#connect) and [close callback event](/en/server/events.html#close). The default is `false`.

**Example**

```php
<?php
$server->set(['enable_unsafe_event' => true]);
```

> [!WARNING]
> **Notes**
>
> - In [SWOOLE_PROCESS mode](/en/server/process_thread.html#swoole-process) with [dispatch_mode](/en/server/setting.html#dispatch-mode) set to `SWOOLE_DISPATCH_ROUND` or `SWOOLE_DISPATCH_IDLE_WORKER`, the system cannot guarantee the execution order of [connect](/en/server/events.html#connect) / [receive](/en/server/events.html#receive) / [close](/en/server/events.html#close), so the `connect/close` events are disabled by default;
> - If the application needs the `connect/close` events and can accept the safety risks caused by ordering issues, set `enable_unsafe_event` to true to enable the `connect/close` events.

## enable_delay_receive

Once enabled, data-receive events are not monitored immediately after a client connects; only the [connect event](/en/server/events.html#connect) is triggered, and data reception starts only after the developer "approves" the connection. The default is `false`.

**Example**

```php
<?php
$server->set(['enable_delay_receive' => true]);
```

> [!NOTE]
> **Notes**
>
> - You must call `Swoole\Server->confirm()` in your code to confirm the connection; only then is the client connection added to the event loop.

## enable_signalfd

Uses the `signalfd` feature provided by the `Linux` kernel to turn signals — a traditional form of interrupt — into a file descriptor handled asynchronously. The default is `true`.

**Example**

```php
<?php
$server->set(['enable_signalfd' => true]);
```

## enable_kqueue

On `macOS`, uses `kqueue` as the event-driven engine. The default is `false`.

**Example**

```php
<?php
$server->set(['enable_kqueue' => true]);
```

> [!TIP]
> **Availability**
>
> - This option applies to `Swoole v6.0.0` and later. Starting from that version, because the default `kqueue` has compatibility conflicts with certain `Swoole` features, `Swoole` uses `poll` instead of `kqueue` as the underlying event-driven engine on `macOS` by default.

## bootstrap

The program entry file in multi-thread mode. The default is the name of the currently executing script file.

**Example**

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
> **Notes**
>
> - In [SWOOLE_THREAD](/en/server/process_thread.html#swoole-thread) mode, threads under `PHP ZTS (Zend Thread Safe)` are isolated from each other and cannot copy an independent set of memory data via `fork()` the way processes do. Therefore, each thread must re-execute the current script file to initialize its own environment.

> [!TIP]
> **Availability**
>
> - Available with Swoole version >= `v6.0`, `PHP` in `ZTS` mode, and `Swoole` compiled with `--enable-swoole-thread`

## init_arguments

Sets shared data for multi-thread mode. This option takes a callback function that is executed automatically when the server starts; its return value serves as the data object shared between threads.

**Example**

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
    $map = Swoole\Thread::getArguments(); // This returns the return value of the callback function() {return new Map();}
});
```

> [!NOTE]
> **Thread-safe containers**
>
> - Swoole ships with many thread-safe containers: concurrent `Map`, concurrent `List`, and concurrent queues.

> [!WARNING]
> **Notes**
>
> - Make sure the callback returns a thread-safe variable; do not return ordinary, non-thread-safe variables.

> [!TIP]
> **Availability**
>
> - Available with Swoole version >= `v6.0`, `PHP` in `ZTS` mode, and `Swoole` compiled with `--enable-swoole-thread`

## dispatch_mode

The load-balancing strategy used by [reactor threads](/en/server/process_thread.html#master) to dispatch client data to [worker processes](/en/server/process_thread.html#worker). The default is `SWOOLE_DISPATCH_FDMOD`.

**Example**

```php
<?php
$server->set(['dispatch_mode' => SWOOLE_DISPATCH_FDMOD]);
```

**Supported packet dispatch strategies**

| Mode value                      | Mode name        | Dispatch strategy                    | Core purpose                             |
|:--------------------------------|:----------|:------------------------------------|:----------------------------------------|
| `SWOOLE_DISPATCH_ROUND`         | Round-robin      | Assigns to each worker process in turn | Even request distribution; suitable for stateless services |
| `SWOOLE_DISPATCH_FDMOD`         | Fixed (FD)       | Assigns by modulo of the connection FD | Data from the same connection always goes to the same worker process; suitable for persistent connections or stateful services |
| `SWOOLE_DISPATCH_IDLE_WORKER`   | Preemptive       | The master process dispatches dynamically based on worker busy/idle state | Prefers idle worker processes, improving resource utilization and avoiding blocking |
| `SWOOLE_DISPATCH_IPMOD`         | IP hash          | Assigns by modulo of the client IP   | Connections from the same source IP go to the same worker process; suitable for IP-based session persistence |
| `SWOOLE_DISPATCH_UIDMOD`        | UID binding      | Assigns by modulo of the bound UID (for string UIDs, apply crc32 first) | User-ID-based session persistence; suitable for user-level state binding |
| `SWOOLE_DISPATCH_STREAM`        | Stream           | Idle worker processes actively accept connections and take over requests | Reduces master-process forwarding overhead and improves connection handling under high concurrency |
| `SWOOLE_DISPATCH_CO_CONN_LB`    | Fixed coroutine  | First picks the worker process with the fewest coroutines; subsequent requests stay on that worker process | Requests of the same connection stay on the worker process with the fewest coroutines chosen initially |
| `SWOOLE_DISPATCH_CO_REQ_LB`     | Balanced coroutine | Every request goes to the worker process with the fewest coroutines | Balances the coroutine count across all worker processes |
| `SWOOLE_DISPATCH_CONCURRENT_LB` | Balanced concurrency | Every request goes to the worker process with the lowest concurrency | Balances the concurrency across all worker processes |

> [!WARNING]
> **Notes**
>
> - `dispatch_mode` cannot be used in [SWOOLE_BASE mode](/en/server/process_thread.html#swoole-base), because there is no task dispatching: when data arrives from a client, the callback runs immediately in the current worker process.
> - Stateless requests can use `SWOOLE_DISPATCH_ROUND` and `SWOOLE_DISPATCH_IDLE_WORKER`; synchronous blocking services can use `SWOOLE_DISPATCH_IDLE_WORKER`, and async non-blocking services can use `SWOOLE_DISPATCH_ROUND`.
> - Stateful requests can use `SWOOLE_DISPATCH_FDMOD`, `SWOOLE_DISPATCH_IPMOD`, and `SWOOLE_DISPATCH_UIDMOD`.
> - UDP servers:
>     - With `SWOOLE_DISPATCH_FDMOD`, `SWOOLE_DISPATCH_IPMOD`, and `SWOOLE_DISPATCH_UIDMOD`, assignment is fixed: the underlying layer hashes the client `IP` by modulo to different `worker` processes.
>     - With `SWOOLE_DISPATCH_ROUND` and `SWOOLE_DISPATCH_IDLE_WORKER`, requests are randomly assigned to different `worker` processes.

> [!TIP]
> **Event masking**
>
> - With `SWOOLE_DISPATCH_ROUND` and `SWOOLE_DISPATCH_IDLE_WORKER`, the underlying layer masks the [connect event](/en/server/events.html#connect) and [close event](/en/server/events.html#close), because these two modes cannot guarantee the execution order of the connect event / close event / [receive event](/en/server/events.html#receive).

> [!TIP]
> **Persistent connection services**
>
> - For persistent connection services (such as WebSocket servers), you must choose a dispatch strategy that always forwards requests to the same process, such as `SWOOLE_DISPATCH_FDMOD` or `SWOOLE_DISPATCH_CO_CONN_LB`. Otherwise, data on the same connection may be handled by process 1 the first time but dispatched to process 2 the second time, and process 2 has no state records for that connection, causing errors.

## dispatch_func

Customizes the load-balancing strategy used by [reactor threads](/en/server/process_thread.html#master) to dispatch client data to [worker processes](/en/server/process_thread.html#worker).

**Callback signature**

```php
function (Swoole\Server $server, int $fd, int $type, string $data): int {}
```

**Parameters**

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | The Swoole\Server object instance | Required |
| `$fd` | The file descriptor of the current client | Required |
| `$type` | Data type: `0` means data sent by the client, `3` means the client connection closed, `4` means the client connection was established | Required |
| `$data` | Data content. The full data is not passed in — only the first `8K` of the packet. You must compute the target process ID from these first 8K of data | Required |

**Return value**: return a number in `[0, worker_num - 1]` indicating the target `worker` process ID for the packet; see [worker_num](/en/server/setting.html#worker-num).

**Example**

```php
<?php
$server->set(['dispatch_func' => function (Swoole\Server $server, int $fd, int $type, string $data) {}]);
```

> [!WARNING]
> **Notes**
>
> - If the returned worker process number is not within `[0, worker_num - 1]`, the data is discarded.
> - `dispatch_func` can only be used in [SWOOLE_PROCESS mode](/en/server/process_thread.html#swoole-process).
> - `dispatch_func` takes precedence over `dispatch_mode`.
> - Setting `dispatch_func` forces [reactor_num](/en/server/setting.html#reactor-num) to `1`.

## daemonize

Daemonizes the current service. The default is `false`.

The program moves to the background and runs as a daemon. Long-running server programs must enable this option. Without daemonization, the program is terminated when the ssh terminal exits.

**Example**

```php
<?php
$server->set(['daemonize' => true]);
```

> [!WARNING]
> **Notes**
>
> - After daemonization, standard input and output are redirected to [log_file](/en/server/setting.html#log-file); if `log_file` is not set, they are redirected to `/dev/null` and everything printed to the screen is discarded.
> - After daemonization, the value of the current-directory environment variable changes, so file reads and writes using relative paths will fail. PHP programs must use absolute paths.
> - systemd:
>     - When managing the `Swoole` service with `systemd` or `supervisord`, do not set `daemonize => true`. The main reason is that `systemd` works differently from `init`. The `init` process has `PID` `1`; after a program uses `daemonize`, it detaches from the terminal and is eventually adopted by `init`, forming a parent-child relationship with `init`.
>     - But `systemd` starts a separate background process that `fork`s and manages the other service processes itself, so `daemonize` is unnecessary — in fact, using `daemonize => true` breaks the parent-child relationship between the `Swoole` program and that management process.

## display_errors

Enables / disables `Swoole` error messages. The default is `true`.

**Example**

```php
<?php
$server->set(['display_errors' => true]);
```

## dns_server

Sets the `DNS` address.

**Example**

```php
<?php
$server->set(['dns_server' => '8.8.8.8']);
```

## discard_timeout_request

Determines whether the server still processes an "expired" request when the client has already disconnected but the request data only just arrived or is being processed. The default is `true`.

With [dispatch_mode](/en/server/setting.html#dispatch-mode) set to `SWOOLE_DISPATCH_ROUND` or `SWOOLE_DISPATCH_IDLE_WORKER`, the system cannot guarantee the ordered execution of the [connect event](/en/server/events.html#connect), [receive event](/en/server/events.html#receive), and [close event](/en/server/events.html#close), so some request data may reach the [worker process](/en/server/process_thread.html#worker) only after the connection has closed.

**Example**

```php
<?php
$server->set(['discard_timeout_request' => true]);
```

> [!WARNING]
> **Notes**
>
> - `discard_timeout_request` defaults to `true`, meaning that if a `worker` process receives a data request for a connection that has already closed, it is discarded automatically.
> - If `discard_timeout_request` is set to `false`, the `worker` process processes the data request regardless of whether the connection has closed.

## task_use_object / task_object

This option controls the callback parameter form of the [task event](/en/server/events.html#task). Once enabled, the event callback switches to the [object-oriented style](/en/server/events.html#object-oriented-style), and the callback parameter becomes a [Swoole\Server\Task](/en/server/class/task.html) object. The default is `false`.

**Example**

```php
<?php
$server->set(['task_use_object' => true]);
```

## max_request

Sets the maximum number of tasks a [worker process](/en/server/process_thread.html#worker) may execute. When a `worker` process has handled this many tasks, it restarts automatically to release the memory and resources it holds. The default is `0`, meaning no limit — the process never exits.

**Example**

```php
<?php
$server->set(['max_request' => 10000]);
```

> [!WARNING]
> **Notes**
>
> - Reaching `max_request` does not necessarily shut the process down immediately; see [max_wait_time](/en/server/setting.html#max-wait-time).
> - Under [SWOOLE_BASE](/en/server/process_thread.html#swoole-base), restarting a process after reaching `max_request` disconnects its clients.
> - This parameter mainly addresses PHP process memory leaks caused by poorly written code. If a PHP application leaks memory slowly but you cannot locate or fix the cause, setting `max_request` is a temporary workaround. You should find and fix the leaking code rather than rely on this approach; Swoole Tracker can help you locate the leaking code.

## max_request_grace

Used together with [max_request](/en/server/setting.html#max-request) to stagger [worker process](/en/server/process_thread.html#worker) restarts. The default is `0`, meaning no limit.

**Example**

```php
<?php
$server->set([
    'max_request' => 10000,
    'max_request_grace' => 10000,
]);
```

> [!WARNING]
> **Notes**
>
> - If all `worker` processes have exactly the same `max_request` value (e.g. all set to 1000), it may happen that:
>     - all processes reach the request limit at almost the same time;
>     - they exit and restart simultaneously;
>     - the service loses all `worker` processes for a short period, causing performance fluctuations.
> - With `max_request_grace` enabled, each `worker` process adds a random value in `[1, max_request_grace]` on top of `max_request` at startup, so the effective limits differ across processes, staggering the restarts.

## task_max_request

Sets the maximum number of tasks a [task process](/en/server/process_thread.html#task) may execute. When a `task` process has handled this many tasks, it restarts automatically to release the memory and resources it holds. The default is `0`, meaning no limit — the process never exits.

**Example**

```php
<?php
$server->set(['task_max_request' => 10000]);
```

## task_max_request_grace

Used together with [task_max_request](/en/server/setting.html#task-max-request) to stagger [task process](/en/server/process_thread.html#task) restarts. The default is `0`, meaning no limit.

**Example**

```php
<?php
$server->set([
    'task_max_request' => 10000,
    'task_max_request_grace' => 10000,
]);
```

> [!WARNING]
> **Notes**
>
> - If all `task` processes have exactly the same `task_max_request` value (e.g. all set to 1000), it may happen that:
>     - all processes reach the request limit at almost the same time;
>     - they exit and restart simultaneously;
>     - the service loses all `task` processes for a short period, causing performance fluctuations.
> - With `task_max_request_grace` enabled, each `task` process adds a random value in `[1, task_max_request_grace]` on top of `task_max_request` at startup, so the effective limits differ across processes, staggering the restarts.

## max_connection / max_conn

Sets the server's maximum number of connections. When the number of established connections reaches this value, new incoming connections are rejected. The default is `ulimit -n` (the current user's maximum number of open files).

**Example**

```php
<?php
$server->set(['max_connection' => 10000]);
```

> [!WARNING]
> **Notes**
>
> - If the application does not explicitly set `max_connection`, the underlying layer automatically uses the value of `ulimit -n` as the default.
> - The value of `max_connection` cannot exceed the operating system's `ulimit -n`. If set too high, the underlying layer emits a warning and automatically resets it to the value of `ulimit -n`.
> - In `Swoole 4.2.9` and later, when `ulimit -n` is detected to be excessively large (e.g. `1 million`), the underlying layer adjusts the default to `100000`. This is because an excessive `ulimit -n` requires allocating a large amount of memory for connection information, which may cause the process to fail to start.
> - If the value is set too small, the underlying layer also emits a warning and adjusts it to the value of `ulimit -n`. The minimum valid value is `(worker_num + task_worker_num) * 2 + 32`.
> - Do not blindly increase `max_connection`; set it reasonably based on the server's actually available memory. Swoole pre-allocates a block of memory sized by this value to store connection information; each TCP connection takes about `224` bytes.

## max_coroutine / max_coro_num

Sets the maximum number of coroutines in the current worker process. Default: `100000`; in `Swoole` versions earlier than `v4.4.0-beta` the default is `3000`.

**Example**

```php
<?php
$server->set(['max_coroutine' => 10000]);
```

> [!WARNING]
> **Notes**
>
> - Beyond `max_coroutine`, the underlying layer cannot create new coroutines and throws an `exceed max number of coroutine` error. `TCP` services close the connection directly, and `Http` services return the HTTP 503 status code.
> - In a server program, the actual maximum number of coroutines that can be created equals `worker_num * max_coroutine`; the coroutine counts of [task processes](/en/server/process_thread.html#task) and [user processes](/en/server/process_thread.html#user) are counted separately.

## max_concurrency

Limits the maximum number of concurrent requests on `HTTP` and `HTTP2` servers. Beyond this value, subsequent requests return a `503` error. The default is `4294967295`, the maximum value of an unsigned `int`.

**Example**

```php
<?php
$server->set(['max_concurrency' => 10000]);
```

## worker_max_concurrency

After coroutine hooks are enabled, `worker` processes accept requests continuously. To avoid excessive pressure, you can set `worker_max_concurrency` to limit the number of requests a `worker` process executes.

**Example**

```php
<?php
$server->set(['worker_max_concurrency' => 10000]);
```

> [!WARNING]
> **Notes**
>
> - When the number of requests exceeds this value, the `worker` process temporarily stores the excess requests in a queue. The default is `4294967295`, the maximum value of an unsigned `int`.
> - If `worker_max_concurrency` is not set but `max_concurrency` is, the underlying layer automatically sets `worker_max_concurrency` equal to `max_concurrency`.
> - If unprocessed requests remain in the queue when the process restarts, the underlying layer walks the entire queue and returns `503 Service Unavailable` to each request in turn.
> - Think of it this way: `worker_max_concurrency` limits the concurrent processing capacity of a **single process**, while `max_concurrency` limits the total concurrent processing capacity of the **entire server** — the total number of requests being processed across all processes cannot exceed that value.

> [!TIP]
> Available with Swoole version >= `5.0.0`.

## max_idle_time

Specifies the maximum idle time of a TCP connection. If no read or write occurs on a connection within `max_idle_time`, the underlying layer actively closes it. The default is `0`, meaning the timeout check is disabled.

**Example**

```php
<?php
$server->set([
    'max_idle_time' => 10, // Unit: seconds
]);
```

> [!WARNING]
> **Notes**
>
> - Connections cut off this way still trigger the [close event callback](/en/server/events.html#close).
> - Unlike [heartbeat_idle_time](/en/server/setting.html#heartbeat-idle-time), this option judges idleness on both **read and write** activity, whereas `heartbeat_idle_time` only checks whether the client has sent data.

## heartbeat_idle_time

The maximum idle time allowed for a client `TCP` connection, in seconds. If a client connection sends no data to the server within `heartbeat_idle_time` seconds, it is forcibly closed.

**Example**

```php
<?php
$server->set([
    'heartbeat_idle_time' => 3,       // A connection that sends no data to the server within 3 seconds is forcibly closed
    'heartbeat_check_interval' => 60, // Traverse all connections every 60 seconds
]);
```

> [!WARNING]
> **Notes**
>
> - With `heartbeat_idle_time` enabled, the server does not actively send packets to the client.
> - If only `heartbeat_idle_time` is set and `heartbeat_check_interval` is not, the underlying layer does not create a heartbeat-check thread.
> - If `heartbeat_idle_time` is not set and only `heartbeat_check_interval` is, `heartbeat_idle_time` is set to twice `heartbeat_check_interval`.

## heartbeat_check_interval

How often, in seconds, to run the `TCP` connection heartbeat check. The default is `0`, meaning heartbeat checking is disabled.

**Example**

```php
<?php
$server->set([
    'heartbeat_idle_time' => 3,       // A connection that sends no data to the server within 3 seconds is forcibly closed
    'heartbeat_check_interval' => 60, // Traverse all connections every 60 seconds
]);
```

> [!WARNING]
> **Notes**
>
> - The server does not actively send heartbeat packets to clients; it passively waits for the client to send heartbeats. The server-side `heartbeat_check` merely checks the time of the connection's last data transmission and cuts the connection if the limit is exceeded.
> - This option specifies the polling interval in seconds. For example, `heartbeat_check_interval => 60` means every 60 seconds all connections are traversed, and any connection that has sent no data to the server within `heartbeat_idle_time` seconds is forcibly closed.
> - If not configured, heartbeats are not enabled; this option is off by default.
> - Connections cut off by the heartbeat check still trigger the [close event callback](/en/server/events.html#close).

## max_wait_time

Sets the maximum time a [worker process](/en/server/process_thread.html#worker) may wait after receiving the stop-service notification. Default: `3`. If the process has not exited within this time, it is forcibly killed.

**Example**

```php
<?php
$server->set(['max_wait_time' => 30]);
```

> [!WARNING]
> **Notes**
>
> - It is common for a blocked or stuck `worker` to fail to `restart` properly, which does not meet some production scenarios — for example, hot code updates that require `reload`ing processes. Swoole therefore added a process-restart timeout option. See **How to restart the service correctly** for details.
> - **When the manager process receives a restart or shutdown signal, or when `max_request` is reached, it restarts that `worker` process in the following steps:**
>     - The underlying layer adds a timer of (`max_wait_time`) seconds; when it fires, it checks whether the process still exists and, if so, forcibly kills it and spawns a new one.
>     - Wrap-up work must be done in the [workerStop event](/en/server/events.html#workerstop) and completed within `max_wait_time` seconds.
>     - A `SIGTERM` signal is sent to the target process in turn to kill it.

## max_queued_bytes

Sets the upper limit of the per-client-connection data forwarding queue between [reactor threads](/en/server/process_thread.html#master) and [worker processes](/en/server/process_thread.html#worker). The default is `0`, meaning no limit.

`reactor` threads and `worker` processes share client connections. When a `reactor` thread forwards client data to a `worker` process, it records on that connection the amount of data currently backlogged but not yet processed by the `worker` process. If it exceeds `max_queued_bytes`, the `reactor` thread pauses receiving data from that client. Once the `worker` process has drained the backlog below the threshold, the `reactor` thread automatically resumes data reception on the connection.

**Example**

```php
<?php
$server->set([
    'max_queued_bytes' => '2M', // A unit can be added here; the underlying layer parses it automatically
]);
```

> [!WARNING]
> **Notes**
>
> - This option only takes effect in [SWOOLE_PROCESS mode](/en/server/process_thread.html#swoole-process).
> - After reception on a connection is paused because the backlog exceeds `max_queued_bytes`, the system uses an exponential-backoff timer to check the backlog. If the threshold is too small or the `worker` process is too slow, the client may be unable to resume sending for a long time.

## package_max_length

Sets the maximum receivable packet size, in bytes. Default: `2M`, i.e. `2 * 1024 * 1024`; the minimum is `64K`.

Do not set this parameter too high, or it will consume a large amount of memory.

**Example**

```php
<?php
$server->set(['package_max_length' => 2 * 1024 * 1024]);
```

> [!WARNING]
> **Notes**
>
> - With protocol parsing enabled, the Swoole underlying layer automatically assembles packets. Until a complete packet is received, all data is kept in memory, so `package_max_length` must limit the maximum memory usage of a single packet. For example, if 10,000 TCP connections simultaneously send `2M` packets, memory usage could reach `20G` in the worst case.
> - Under different protocol modes, `package_max_length` works as follows:
>     - `open_length_check`: when the detected packet length exceeds `package_max_length`, Swoole discards the packet and closes the connection directly, without using extra memory.
>     - `open_eof_check`: since the packet length cannot be known in advance, received data keeps accumulating in memory, so memory usage grows continuously. Once it exceeds `package_max_length`, Swoole discards the packet and closes the connection.
>     - `open_http_protocol`: `GET` requests are limited to `8K`, and this limit cannot be changed. For `POST` requests, `Content-Length` is checked; if it exceeds `package_max_length`, Swoole discards the packet, returns an `HTTP 400` error, and closes the connection.

## open_eof_check

This option checks the data sent by the client: the underlying layer stops receiving only when the `end` of the packet matches the specified delimiter (such as `\r\n`); otherwise, data keeps being appended until the buffer limit is exceeded or reception times out.

**Example**

```php
<?php
$server->set([
    'open_eof_check' => true,
    'package_eof' => "\r\n",
]);
```

> [!WARNING]
> **Notes**
>
> - Extremely high performance, with almost no extra overhead.
> - If an error occurs during the check, the underlying layer treats the connection as malicious, discards the data, and forcibly closes the connection. See **TCP packet boundary issues**.
> - This option only applies to stream-type sockets (e.g. TCP, Unix Socket Stream). For delimiter checking, the system does not search for the delimiter in the middle of the data stream, so a [worker process](/en/server/process_thread.html#worker) may receive multiple packets at once. You must split the packets yourself in application code, e.g. with `explode("\r\n", $data)`.

## open_eof_split

The underlying layer scans the data stream byte by byte and, each time it encounters the specified delimiter (such as `\r\n`), automatically splits off and delivers one complete packet to the [worker process](/en/server/process_thread.html#worker).

**Example**

```php
<?php
$server->set([
    'open_eof_split' => true,
    'package_eof' => "\r\n",
]);
```

> [!WARNING]
> **Notes**
>
> - With `open_eof_split` enabled, the underlying layer searches the data stream for the delimiter and splits packets automatically, ensuring the [receive callback](/en/server/events.html#receive) receives exactly one complete packet ending with that delimiter each time.
> - [open_eof_check](/en/server/setting.html#open-eof-check) only checks whether the end of the packet contains the delimiter. It has excellent performance with almost no extra overhead, but cannot solve packet merging: when the client sends multiple EOF-terminated packets in a row, the underlying layer may return them all at once, and the business layer must split them itself.
> - `open_eof_split` scans left to right, byte by byte, to find the delimiter and split packets. Performance is poorer, and only one packet is returned at a time.
> - `open_eof_split` takes precedence over `open_eof_check`.

## package_eof

Sets the packet delimiter.

**Example**

```php
<?php
$server->set([
    'open_eof_split' => true,
    'package_eof' => "\r\n",
]);
```

> [!TIP]
> `package_eof` accepts a string of at most `8` bytes.

## open_length_check

Enables packet length-check protocol parsing. The default is `false`. See **TCP packet boundary issues**.

**Example**

```php
<?php
$server->set(['open_length_check' => true]);
```

> [!WARNING]
> **Notes**
>
> - Once enabled, the server's underlying layer automatically follows the rules you configure, guaranteeing that the [reactor thread](/en/server/process_thread.html#master) or [worker process](/en/server/process_thread.html#worker) receives one complete packet each time.

## package_length_type

Specifies the type of the length field (e.g. `N` for a 4-byte unsigned long), just like `PHP`'s `pack` function. It tells the server how many bytes the length field occupies and the byte order of those bytes.

**Example**

```php
<?php
$server->set(['package_length_type' => 'N']);
```

**Notes**

Swoole currently supports 10 length-field types:

| Character | Description |
|:---|:---|
| `c` | Signed, 1 byte |
| `C` | Unsigned, 1 byte |
| `s` | Signed, host byte order, 2 bytes |
| `S` | Unsigned, host byte order, 2 bytes |
| `n` | Unsigned, network byte order, 2 bytes |
| `N` | Unsigned, network byte order, 4 bytes |
| `l` | Signed, host byte order, 4 bytes (lowercase L) |
| `L` | Unsigned, host byte order, 4 bytes (uppercase L) |
| `v` | Unsigned, little-endian, 2 bytes |
| `V` | Unsigned, little-endian, 4 bytes |

## package_length_offset

The key parameter that locates the length field. It tells the server: "the length-field value is stored at which byte of the whole packet".

Some protocol designs do not always place the length field at the very beginning of the packet. The header may contain other fixed information, and the length field may appear only after an offset of several bytes.

**Example**

Suppose your protocol format is as follows:

```text
[ magic: 2 bytes ] [ command: 2 bytes ] [ length: 4 bytes ] [ body: N bytes ]
Bytes 0-1           Bytes 2-3           Bytes 4-7           From byte 8
```

The length field occupies bytes 4, 5, 6, 7 (4 bytes in total), so the configuration is:

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4-byte unsigned long
    'package_length_offset' => 4,        // The length field starts at byte 4
    'package_body_offset'   => 8,        // The body starts at byte 8 (skipping the entire header)
    'package_max_length'    => 81920,
]);
```

> [!WARNING]
> **Notes**
>
> - Offsets always start from `0`.

## package_body_offset / package_body_start

The offset that locates the start of the packet body. It tells the server at which byte of the packet the actual business data (the body) begins.

**Example 1**

Suppose your protocol format is as follows:

```text
[ magic: 2 bytes ] [ command: 2 bytes ] [ length: 4 bytes ] [ body: N bytes ]
Bytes 0-1           Bytes 2-3           Bytes 4-7           From byte 8
```

The body starts at byte 8, so the configuration is:

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4-byte unsigned long
    'package_length_offset' => 4,        // The length field starts at byte 4
    'package_body_offset'   => 8,        // The body starts at byte 8 (skipping the entire header)
    'package_max_length'    => 81920,
]);
```

**Example 2**

Suppose your protocol format is as follows:

```text
[ magic: 2 bytes ] [ command: 2 bytes ] [ length: 4 bytes ] [ type: 4 bytes ] [ body: N bytes ]
Bytes 0-1           Bytes 2-3           Bytes 4-7            Bytes 8-11        From byte 12
```

The body starts at byte 12, so the configuration is:

```php
<?php
$server->set([
    'open_length_check'     => true,
    'package_length_type'   => 'N',      // 4-byte unsigned long
    'package_length_offset' => 4,        // The length field starts at byte 4
    'package_body_offset'   => 12,        // The body starts at byte 12 (skipping the entire header)
    'package_max_length'    => 81920,
]);
```

> [!WARNING]
> **Notes**
>
> - Offsets always start from `0`.

## package_length_func

Defines a custom `PHP` function that tells `Swoole` how long a complete packet is.

The function receives the partial data received so far (stored in a buffer), and you implement your core logic inside it: parse and return the length of the entire packet.

**Callback signature**

```php
<?php
function(string $data): int {}
```

**Parameters**

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The partial data received so far | Required |

**Return value**

- Return `0`: not enough data; wait and receive more.
- Return `-1`: data error; the underlying layer closes the connection automatically.
- Return `>0`: the packet length was obtained successfully (this value is the length of the complete packet).

**Example**

The following example simulates a simple text protocol where the packet format is "LENGTH:xxx\nBODY:yyy"; you need to parse xxx out of the data as the length.

```php
<?php
$server->set([
    'open_length_check'   => true,          // 1. Must be enabled
    'package_max_length'  => 81920,         // 2. Set the maximum packet length limit
    'package_length_func' => function ($data) {
        // 3. Define your parsing logic
        // Check whether enough data has been received to parse out the length value
        if (strlen($data) < 16) {
            return 0; // Not enough data; return 0 and keep waiting for more
        }

        // Assume the protocol is "LENGTH:123\n"; use a regex to extract the length from the start of the received data
        if (preg_match('/^LENGTH:(\d+)\n/', $data, $match)) {
            $length = (int)$match[1];
            
            // Get the length of the entire header to compute the full packet length
            $header_length = strlen($match[0]);
            
            // Return the total packet length = header length + body length
            return $header_length + $length;
        }

        // If even the header does not conform to the protocol, return -1 so Swoole closes this connection
        return -1;
    }
]);
```

> [!WARNING]
> **Notes**
>
> - `package_length_func` is mainly for complex protocols where "the length cannot be read at a fixed offset".
> - Do not perform blocking IO in the length-parsing function; it may block all [reactor threads](/en/server/process_thread.html#master) or [worker processes](/en/server/process_thread.html#worker).
> - Because the `ZendVM` does not support running in a multi-threaded environment, the underlying layer automatically guards the `PHP` length function with a `Mutex` lock to prevent concurrent execution of `PHP` functions.

> [!TIP]
> Available with Swoole version >= `1.9.3`.

## upload_max_filesize

Sets the maximum uploaded file size allowed by `HTTP` and `HTTP2` servers. It prevents large uploads from exhausting server memory and improves service stability.

**Example**

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
> **Notes**
>
> - `upload_max_filesize` allows the `HTTP` server to receive large files. When the received request message exceeds [package_max_length](/en/server/setting.html#package-max-length) but not `upload_max_filesize`, the server does not discard the data; instead, it writes the request body to a temporary file on disk without keeping a copy in memory. The data is read back from the file during subsequent processing, avoiding memory overflow.
> - It must be used together with `package_max_length` and `php`'s `memory_limit` (both are hard limits).

> [!TIP]
> Available with `Swoole 5.0.0` and later.

## upload_tmp_dir

Sets the temporary storage path for file uploads on `HTTP` and `HTTP2` servers. The default is `/tmp`.

**Example**

```php
<?php
$server->set([
  'upload_tmp_dir' => '/data/uploadfiles/',
]);
```

## aio_core_worker_num

Sets the minimum number of threads in the async thread pool. The default is the number of `CPU` cores.

**Example**

```php
<?php
$server->set([
  'aio_core_worker_num' => 10
]);
```

## aio_worker_num

Sets the maximum number of threads in the async thread pool. The default is the number of `CPU` cores * 8.

**Example**

```php
<?php
$server->set([
  'aio_worker_num' => 80
]);
```

## aio_max_wait_time

Sets the maximum task waiting time, in seconds.

**Example**

```php
<?php
$server->set([
  'aio_max_wait_time' => 80
]);
```

> [!WARNING]
> **Notes**
>
> - If every thread is busy with a task but the queued tasks have already waited longer than `aio_max_wait_time`, the underlying layer spawns new threads to handle them.
> - The newly spawned threads plus the existing threads never exceed [aio_worker_num](/en/server/setting.html#aio-worker-num).

## aio_max_idle_time

Sets the idle time of threads in the async thread pool, in seconds. Threads that receive no task within this time are reclaimed.

**Example**

```php
<?php
$server->set([
  'aio_max_idle_time' => 10
]);
```

> [!WARNING]
> **Notes**
>
> - When reclaiming idle threads, the underlying layer guarantees the thread count never drops below [aio_core_worker_num](/en/server/setting.html#aio-core-worker-num).

## iouring_entries

Sets the queue size of `io_uring`. The default is 8192. If the value is not a power of 2, the kernel adjusts it to **the nearest power of 2 greater than the value**.

**Example**

```php
<?php
$server->set([
  'iouring_entries' => 8192
]);
```

> [!WARNING]
> **Notes**
>
> - If the value is too large, the kernel throws an exception and terminates the program.
> - Available only when `liburing` is installed on the system and `Swoole` was compiled with [--enable-iouring](/en/start/install.html#build-options).

> [!TIP]
> Available with `Swoole 6.0` and later.

## iouring_workers

Sets the number of `io_uring` worker threads. The default is `number of CPU cores * 4`.

**Example**

```php
<?php
$server->set([
  'iouring_workers' => 128
]);
```

> [!WARNING]
> **Notes**
>
> - If the value is too large, the kernel throws an exception and terminates the program.
> - Available only when `liburing` is installed on the system and `Swoole` was compiled with [--enable-iouring](/en/start/install.html#build-options).

> [!TIP]
> Available with `Swoole 6.0` and later.

## iouring_flag

Sets the working mode of `io_uring`. The default is `SWOOLE_IOURING_DEFAULT`.

**Example**

```php
<?php
$server->set([
  'iouring_flag' => SWOOLE_IOURING_DEFAULT
]);
```

> [!WARNING]
> **Notes**
>
> - If an invalid mode is passed, the kernel uniformly uses the `SWOOLE_IOURING_DEFAULT` interrupt-driven mode.
> - `SWOOLE_IOURING_DEFAULT`: interrupt-driven mode. `I/O` requests are submitted via the `io_uring_enter` system call, and completion is determined by directly checking the completion queue state.
> - `SWOOLE_IOURING_SQPOLL`: kernel polling mode. The kernel creates kernel threads to submit and reap `I/O` requests, almost entirely eliminating user/kernel context switches, with better performance.
> - Available only when `liburing` is installed on the system and `Swoole` was compiled with [--enable-iouring](/en/start/install.html#build-options).

> [!TIP]
> Available with `Swoole 6.0` and later.

## reload_async

Sets the async graceful-restart switch. Default: `true`

**Example**

```php
<?php
$server->set([
  'reload_async' => true
]);
```

> [!WARNING]
> **Notes**
>
> - Enables the async-safe restart feature: [worker processes](/en/server/process_thread.html#worker) wait for async events to complete before exiting. See "How to restart the service correctly" for details.
> - The main purpose of enabling `reload_async` is to ensure coroutines or async tasks finish normally when the service reloads.
> - In `4.x` versions, when [enable_coroutine](/en/server/setting.html#enable-coroutine) is enabled, the underlying layer adds an extra coroutine-count check: the process exits only when no coroutines remain. In that case, `reload_async` is forcibly turned on even if `reload_async => false`.

## single_thread

Sets the number of `reactor` threads in the [master process](/en/server/process_thread.html#master) to 1.

**Example**

```php
<?php
$server->set([
    'single_thread' => true
]);
```

## ssl_cert_file / ssl_key_file

Configures SSL tunnel encryption.

**Example**

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
> **Notes**
>
> - For `HTTPS` services, the browser must trust the configured SSL certificate, otherwise the page is shown as insecure.
> - When using `wss` (WebSocket over SSL), the page initiating the connection must also be served over `HTTPS`.
> - `wss` cannot be used if the browser does not trust the `SSL` certificate.
> - Files must be in `PEM` format; `DER` format is not supported. Use the `openssl` tool to convert.

**Convert `PEM` to `DER` format**

```shell
openssl x509 -in cert.crt -outform der -out cert.der
```

**Convert `DER` to `PEM` format**

```shell
openssl x509 -in cert.crt -inform der -outform pem -out cert.pem
```

> [!TIP]
> This option requires compiling `Swoole` with `--enable-openssl`, but `Swoole 6.2.0` supports `openssl` by default.

## ssl_compress

Sets whether to enable `SSL/TLS` compression.

**Example**

```php
<?php
$server->set([
  'ssl_compress' => true
]);
```

## ssl_protocols

Sets the protocols for OpenSSL tunnel encryption. Default: `0`, supporting all protocols.

The supported protocol types are `SWOOLE_SSL_TLSv1`, `SWOOLE_SSL_TLSv1_1`, `SWOOLE_SSL_TLSv1_2`, `SWOOLE_SSL_TLSv1_3`, `SWOOLE_SSL_SSLv2`, `SWOOLE_SSL_SSLv3`.

**Example**

```php
<?php
$server->set(array(
    'ssl_protocols' => SWOOLE_SSL_TLSv1,
));
```

> [!TIP]
> Available with Swoole version >= `v4.5.4`.

## ssl_verify_peer

Whether to verify the peer certificate against the server SSL certificate. Default: `false`

**Example**

```php
<?php
$server->set(array(
  'ssl_client_cert_file' => '/path/to/cert_file',
  'ssl_verify_peer' => true,
));
```

> [!TIP]
> Disabled by default, i.e. the client certificate is not verified. If enabled, the `ssl_client_cert_file` option must also be set

## ssl_client_cert_file

Path to the root certificate file used to verify client certificates (the CA root certificate in mutual SSL authentication).

**Example**

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
> For `TCP` services, if verification fails, the underlying layer actively closes the connection.

## ssl_allow_self_signed

Whether to allow self-signed certificates. Default: `false`.

**Example**

```php
<?php
$server->set([
  'ssl_allow_self_signed' => true
]);
```

## ssl_cafile

When `ssl_verify_peer` is set to `true`, this is the `CA` certificate used to verify the remote certificate. The value is the full path and file name of the `CA` certificate on the local filesystem.

**Example**

```php
<?php
$server->set([
  'ssl_cafile' => '/etc/CA',
]);
```

## ssl_capath

If `ssl_cafile` is not set, or the file it points to does not exist, suitable certificates are searched for in the directory specified by `ssl_capath`. The directory must be a hashed certificate directory.

**Example**

```php
<?php
$server->set([
  'ssl_capath' => '/etc/capath/',
]);
```

## ssl_verify_depth

If the certificate chain is deeper than this option's value, verification is terminated.

**Example**

```php
<?php
$server->set([
  'ssl_verify_depth' => 5
]);
```

## ssl_prefer_server_ciphers

Determines who chooses the cipher suite when the client (browser) and server establish an encrypted connection.

**Example**

```php
<?php
$server->set([
  'ssl_prefer_server_ciphers' => true
]);
```

> [!WARNING]
> **Notes**
>
> - `true` means the cipher-suite order configured on the server takes precedence.
> - `false` gives precedence to the cipher-suite order provided by the client (browser).

## ssl_ciphers

Sets the `Openssl` cipher algorithms. Default: `EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH`

**Example**

```php
<?php
$server->set([
  'ssl_ciphers' => 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH'
]);
```

> [!WARNING]
> **Notes**
>
> - When `ssl_ciphers` is empty, `openssl` chooses the cipher algorithms itself

## ssl_ecdh_curve

Controls the elliptic curves used during `ECDH` key exchange.

**Example**

```php
<?php
$server->set([
  'ssl_ecdh_curve' => 'X25519:prime256v1:secp384r1'
]);
```

## ssl_dhparam

Specifies strong parameters for Diffie-Hellman (DH) key exchange. When the server uses legacy DHE cipher suites, this directive tells the server which "large-prime file" to use to generate ephemeral session keys, ensuring security.

**Example**

```php
<?php
$server->set([
  'ssl_dhparam' => '/etc/dhparam.pem'
]);
```

## ssl_sni_certs

Configures SNI (Server Name Identification) certificates.

**Example**

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

Whether to enable compression of `WebSocket` frame data. Even when enabled, individual frames are compressed only in combination with the `SWOOLE_WEBSOCKET_FLAG_COMPRESS` flag.

**Example 1: Single-frame compression (automatic)**

When `websocket_compression` is set to `true` and a frame is sent with `SWOOLE_WEBSOCKET_FLAG_COMPRESS`, the `Swoole` underlying layer automatically `zlib`-compresses the frame data before sending it to the client.

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
// Enable WebSocket compression support
$server->set(['websocket_compression' => true]);

$server->on('message', function (Server $server, Frame $frame) {
  // Send with the SWOOLE_WEBSOCKET_FLAG_COMPRESS flag; the underlying layer automatically compresses the frame data with zlib
  $server->push(
      $frame->fd,
      'Hello Swoole',
      SWOOLE_WEBSOCKET_OPCODE_TEXT,
      SWOOLE_WEBSOCKET_FLAG_FIN | SWOOLE_WEBSOCKET_FLAG_COMPRESS
  );
});

$server->start();
```

**Example 2: Continuous-frame compression (manual)**

When `websocket_compression` is `true` and you need to send multiple continuous frames (a fragmented message), the underlying layer does not compress automatically; the developer must compress the data manually and set the `RSV1` flag.

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
// Enable WebSocket compression support
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
> **Notes**
>
> - Both the server and the client must explicitly support compression during the handshake; if either side does not, messages are never compressed automatically throughout the communication.
> - The three control frames — `Ping`, `Pong`, and close frames — are not affected by this option; control frames must not be compressed.
> - For the handling mechanism and detailed explanation of fragmented messages, see [Swoole\WebSocket\Server->push()](/en/server/methods.html#push).

## websocket_subprotocol

When a `WebSocket` connection is established, the client and server negotiate a message format or application-layer protocol that both sides support.

**Example**

```php
<?php
$server->set([
    'websocket_subprotocol' => 'json',
]);
```

> [!NOTE]
> **Description**
>
> - Once set, the handshake response gains the HTTP header `Sec-WebSocket-Protocol: {$websocket_subprotocol}`. For usage details, refer to the `WebSocket` protocol `RFC` documents.
> - `WebSocket` only provides a "full-duplex communication pipe" and does not care what the data inside looks like (JSON, XML, or a custom binary format). The `Subprotocol` tells the other side: "my messages are organized according to a certain protocol — can you understand them?".

## open_websocket_ping_frame

Controls whether `Ping` frames sent by `websocket` clients are handled by the user. The default is `false`, in which case the server automatically responds to the client with a `Pong` frame.

**Example**

```php
<?php
$websocket->set([
  'open_websocket_ping_frame' => true
]);
```

> [!WARNING]
> **Notes**
>
> - When set to `true`, `Ping` frames sent by the client are not handled automatically by the underlying layer; instead, the [message event](/en/server/events.html#message) is triggered for the user to handle.

## open_websocket_pong_frame

Controls whether `Pong` frames sent by `websocket` clients are handled by the user. The default is `false`.

**Example**

```php
<?php
$websocket->set([
  'open_websocket_pong_frame' => true
]);
```

> [!WARNING]
> **Notes**
>
> - When set to `true`, `Pong` frames sent by the client are not handled automatically by the underlying layer; instead, the [message event](/en/server/events.html#message) is triggered for the user to handle.

## open_websocket_close_frame

Controls whether `close` frames sent by `websocket` clients are handled by the user. The default is `false`.

**Example**

```php
<?php
$websocket->set([
  'open_websocket_close_frame' => true
]);
```

> [!WARNING]
> **Notes**
>
> - When set to `true`, `close` frames sent by the client are not handled automatically by the underlying layer; instead, the [message event](/en/server/events.html#message) is triggered for the user to handle.

## http_compression

Whether to enable `HTTP` response compression. Default: `true`.

**Example**

```php
<?php
$http->set([
  'http_compression' => true
]);
```

> [!WARNING]
> **Notes**
>
> - This parameter takes effect only if the server supports at least one of the `brotli`, `gzip`, `deflate`, or `zstd` compression algorithms. Otherwise, with no compression available, the parameter has no effect.

## http_compression_level / compression_level / http_gzip_level

Sets the `HTTP` response compression level, ranging from 1-9. Higher levels produce smaller output but consume more CPU. The default is 1; the maximum is 9.

**Example**

```php
<?php
$http->set([
  'http_compression' => true,
  'http_compression_level' => 6
]);
```

## http_compression_min_length / compression_min_length

Sets the minimum response size in bytes for `HTTP` compression; compression is enabled only above this value. The default is 20 bytes.

**Example**

```php
<?php
$http->set([
  'http_compression' => true,
  'http_compression_level' => 6,
  'http_compression_min_length' => 4096
]);
```

## http_compression_types / compression_types

Sets the response types to compress.

**Example**

```php
<?php
$http->set([
  'http_compression_types' => ['text/html', 'application/json']
]);
```

> [!TIP]
> Available with `Swoole` version >= `v4.8.12`

## http_parse_cookie

Sets whether the underlying layer parses `Cookies` when parsing `HTTP` messages. The default is `true`. If set to `false`, `Cookies` are not parsed, and the raw `Cookies` information remains in [Swoole\Http\Request->header](/en/server/class/request.html#header).

**Example**

```php
<?php
$http->set([
  'http_parse_cookie' => true,
]);
```

## http_parse_post

Sets whether the underlying layer parses `POST` data when parsing `HTTP` messages. The default is `true`. If set to `false`, `POST` data is not parsed.

**Example**

```php
<?php
$http->set([
  'http_parse_post' => true,
]);
```

> [!NOTE]
> **Description**
>
> - When set to `true`, request bodies with `Content-Type` `x-www-form-urlencoded` are automatically parsed into [Swoole\Http\Request->post](/en/server/class/request.html#post).
> - When set to `false`, the request body can be obtained via [Swoole\Http\Request->getContent()](/en/server/class/request.html#getcontent).

## http_parse_files

Sets whether the underlying layer parses user-uploaded files when parsing `HTTP` messages. The default is `true`. If set to `false`, uploaded files are not parsed.

**Example**

```php
<?php
$http->set([
  'http_parse_files' => true,
]);
```

## http2_header_table_size

Sets the maximum size of the `HPACK` compression dynamic table in the `HTTP/2` server.

**Example**

```php
<?php
$http2->set([
  'http2_header_table_size' => 0x1
]);
```

## http2_enable_push

The switch controlling whether the `HTTP/2` server enables `Server Push`.

**Example**

```php
<?php
$http2->set([
  'http2_enable_push' => 0x2
]);
```

## http2_max_concurrent_streams

Limits the maximum number of simultaneously active streams (`Stream`) on a single `HTTP/2` connection.

**Example**

```php
<?php
$http2->set([
  'http2_max_concurrent_streams' => 256
]);
```

## http2_init_window_size

Configures the initial window size for `HTTP/2` server flow control.

**Example**

```php
<?php
$http2->set([
  'http2_init_window_size' => '256K'
]);
```

## http2_max_frame_size

Configures the maximum payload (`Payload`) size of a single frame (`Frame`) in the `HTTP/2` server.

**Example**

```php
<?php
$http2->set([
  'http2_max_frame_size' => '256K'
]);
```

## http2_max_header_list_size

Configures the maximum header list size the `HTTP/2` connection is allowed to receive.

**Example**

```php
<?php
$http2->set([
  'http2_max_header_list_size' => '32K'
]);
```

## http2_cancel_on_stream_reset

Controls whether the request coroutine of an `HTTP/2` stream is canceled when the client resets the stream with an `RST_STREAM` frame. The default is `false`.

When enabled, each `HTTP/2` request callback runs in its own coroutine. When the client resets a stream (for example, a browser cancels a request), `Swoole` throws a `Swoole\Coroutine\CanceledException` into that stream's request coroutine, stopping further pointless work (such as database queries or downstream service calls) and freeing server resources.

**Example**

```php
<?php
use Swoole\Coroutine\CanceledException;

$http2->set([
    'open_http2_protocol' => true,
    'http2_cancel_on_stream_reset' => true,
]);

$http2->on('request', function (Swoole\Http\Request $request, Swoole\Http\Response $response) {
    try {
        Swoole\Coroutine::sleep(10); // Simulate a time-consuming operation
        $response->end('done');
    } catch (CanceledException $e) {
        // The client canceled the request; clean up and return
        var_dump($e->getReason());
    }
});
```

The associative array returned by `getReason()` contains the following fields:

| Field | Description |
|:---|:---|
| `session_id` | The `fd` of the client connection |
| `stream_id` | The `ID` of the reset stream |
| `code` | The `HTTP/2` error code carried by the `RST_STREAM` frame, e.g. `8` for `CANCEL` |
| `message` | Always `HTTP2 Stream Reset` |

> [!WARNING]
> **Notes**
>
> - Available since Swoole `v6.3`.
> - Both [open_http2_protocol](/en/server/setting.html#open-http2-protocol) and [enable_coroutine](/en/server/setting.html#enable-coroutine) must be enabled, otherwise a configuration exception is thrown at startup.
> - The request callback must catch `Swoole\Coroutine\CanceledException`, otherwise a `Fatal Error` occurs and the `worker` process exits.
> - After a stream is reset, its `$response` is no longer writable: `isWritable()`, `write()`, and `end()` all return `false`.
> - If a request is still queued due to the [worker_max_concurrency](/en/server/setting.html#worker-max-concurrency) limit, a received reset skips its callback entirely.
> - Cancellation is only triggered by `RST_STREAM` frames; `GOAWAY` frames and connection close do not cancel request coroutines.

## document_root

Configures the root directory of the static file server.

**Example**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true
]);
```

When you visit `http://127.0.0.1:9501/hello.txt`, if the file `hello.txt` exists in `/home/files/`, its contents are returned to the client.

When you visit `http://127.0.0.1:9501/hello/hello.txt`, if the file `hello.txt` exists in `/home/files/hello/`, its contents are returned to the client.

> [!WARNING]
> **Notes**
>
> - After setting `document_root` and setting `enable_static_handler` to `true`, when the underlying layer receives an `Http` request it first checks whether the file exists under the `document_root` path. If it exists, the file contents are sent directly to the client and the [request event](/en/server/events.html#request) is not triggered.
> - When using the static file handling feature, keep dynamic `PHP` code separate from static files, storing static files in a dedicated directory.

> [!TIP]
> This feature is fairly basic and is for testing only; do not use it on the public internet.

## enable_static_handler

Starts the static file server. Default: `false`.

**Example**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true
]);
```

> [!TIP]
> This feature is fairly basic and is for testing only; do not use it on the public internet.

## static_handler_locations

Sets the paths of the static handler. The type is an array; disabled by default.

**Example**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'static_handler_locations' => ['/static', '/app/images'],
]);
```

> [!NOTE]
> **Description**
>
> - Similar to `Nginx`'s `location` directive, you can designate one or more paths as static paths. The static file handler is enabled only for `URL`s under the specified paths; otherwise the request is treated as dynamic.
> - Paths must start with `/`. Multi-level paths such as `/app/images` are supported.
> - With `static_handler_locations` enabled, if the file corresponding to a request does not exist, a 404 error is returned directly.

> [!TIP]
> This feature is fairly basic and is for testing only; do not use it on the public internet.

## url_rewrite_rules

URL rewrite rules for the static file server are configured as an array. Each rule is a key-value pair where the key is a regular expression matching the request path and the value is the target directory path. When a request path matches a key's regular expression, the request is rewritten to the corresponding target directory.

**Example**

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

When visiting `http://127.0.0.1:9501/view/post/123`, the URL matches the regular expression `~^/view/post/(\d+)$~`. After a successful match, the system looks in `/home/files/static/` for the `123.html` file corresponding to the captured number (`123`). If the file exists, its contents are returned to the client.

> [!TIP]
> This feature is fairly basic and is for testing only; do not use it on the public internet.

## http_autoindex

Enables directory browsing. Default: `false`.

When a directory on the server is visited and it has no default index file (such as index.html or index.php), the server automatically generates a listing of the files and subdirectories in that directory (a directory index) and returns it to the client as a web page. Similar to `Nginx`'s `autoindex` directive.

**Example**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'http_autoindex' => true,
]);
```

When you visit `http://127.0.0.1:9501` directly, the file listing of the entire `/home/files/` directory is returned.

> [!TIP]
> This feature is fairly basic and is for testing only; do not use it on the public internet.

## http_index_files

Specifies which file in a directory is returned by default when a client visits that directory. Similar to `Nginx`'s `index` directive.

**Example**

```php
<?php
$http->set([
  'document_root' => '/home/files/',
  'enable_static_handler' => true,
  'http_index_files' => ['index.php'],
]);
```

When visiting `http://127.0.0.1:9501/`, if `index.php` exists in `/home/files/`, that file is returned to the client.

> [!TIP]
> This feature is fairly basic and is for testing only; do not use it on the public internet.

## log_file

Specifies the `Swoole` error log file.

**Example**

```php
<?php
$http->set([
  'log_file' => '/home/log.txt'
]);
```

> [!WARNING]
> **Notes**
>
> - Exception information occurring while `Swoole` runs is recorded in this file; by default it is printed to the screen.
> - With daemon mode enabled `(daemonize => true)`, standard output is redirected to `log_file`. Content printed to the screen by `echo/var_dump/print` etc. in PHP code is written to the `log_file` file.
> - The logs in `log_file` are only runtime error records; there is no need to store them long-term.
> - `log_file` does not rotate files automatically, so clean it up periodically. Watching the output of `log_file` reveals the server's various exceptions and warnings.
> - If the log file is moved with `mv` or deleted with `unlink` while the server program is running, log information can no longer be written. In that case, send the `SIGRTMIN` signal to the [master process](/en/server/process_thread.html#master) or [manager process](/en/server/process_thread.html#manager) to reopen the log file.
> - In log messages, the process ID is prefixed with a marker indicating the type of thread/process that produced the log: `#` for the master process, `$` for the manager process, `*` for [worker processes](/en/server/process_thread.html#worker), and `^` for [task processes](/en/server/process_thread.html#task).
> - `log_file` does not record logs output by [user processes](/en/server/process_thread.html#user).

## log_level

The log printing level; log messages below `log_level` are not emitted. Default: `SWOOLE_LOG_INFO`.

**Example**

```php
<?php
$http->set([
  'log_level' => SWOOLE_LOG_INFO
]);
```

Supported log levels:

| Constant             | Level | Description                  |
|:---|:---|:---|
| `SWOOLE_LOG_DEBUG`   | Debug | Debug logs, for kernel development and debugging only |
| `SWOOLE_LOG_TRACE`   | Trace | Trace logs, usable for tracking system issues, carrying key information |
| `SWOOLE_LOG_INFO`    | Info  | General information, for display only |
| `SWOOLE_LOG_NOTICE`  | Notice | Notice messages; the system may be performing certain actions, such as restarting or shutting down |
| `SWOOLE_LOG_WARNING` | Warning | Warning messages; the system may have certain problems |
| `SWOOLE_LOG_ERROR`   | Error | Error messages; a critical error has occurred in the system and needs immediate attention |
| `SWOOLE_LOG_NONE`    | None  | Equivalent to turning logging off; no log messages are emitted |

> [!WARNING]
> **Notes**
>
> - `SWOOLE_LOG_DEBUG` and `SWOOLE_LOG_TRACE` are available only in builds compiled with [--enable-debug-log](/en/start/install.html#build-options) and [--enable-trace-log](/en/start/install.html#build-options);
> - With `daemonize` enabled, the underlying layer writes all screen-printed output of the program to [log_file](/en/server/setting.html#log-file); that content is not controlled by `log_level`.

## log_date_format

Sets the log time format; the format follows [strftime](https://www.php.net/manual/zh/function.strftime.php)'s time format.

**Example**

```php
<?php
$server->set([
    'log_date_format' => '%Y-%m-%d %H:%M:%S',
]);
```

## log_date_with_microseconds

Sets the log time precision — whether to include microseconds. Default: `false`.

**Example**

```php
<?php
$server->set([
    'log_date_with_microseconds' => false,
]);
```

## log_rotation

Sets whether to enable log rotation. Default: `SWOOLE_LOG_ROTATION_SINGLE`.

**Example**

```php
<?php
$server->set([
    'log_rotation' => SWOOLE_LOG_ROTATION_SINGLE,
]);
```

Supported log rotation modes:

| Constant                         | Description | Version |
|:---------------------------------|:----|:-------|
| SWOOLE_LOG_ROTATION_SINGLE       | Disabled | -      |
| SWOOLE_LOG_ROTATION_MONTHLY      | Monthly | v4.5.8 |
| SWOOLE_LOG_ROTATION_DAILY        | Daily | v4.5.2 |
| SWOOLE_LOG_ROTATION_HOURLY       | Hourly | v4.5.8 |
| SWOOLE_LOG_ROTATION_EVERY_MINUTE | Every minute | v4.5.8 |

## open_http_protocol

Enables `HTTP` protocol message parsing.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// First start an HTTP server - 1
$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

// Then start another HTTP server - 2
$port = $http->listen('127.0.0.1', 9502, SWOOLE_TCP);

// If you have read the multi-port listening chapter, you know this is not required, because child ports inherit the parent port's configuration; this only demonstrates how to configure it.
$port->set(['open_http_protocol' => true]); 

$port->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello World. #".rand(1000, 9999)."</h1>");
});

$http->start();
```

> [!WARNING]
> **Notes**
>
> - [HTTP/HTTPS/HTTP2 servers](/en/server/http.html) and [WebSocket servers](/en/server/websocket.html) enable `open_http_protocol` by default.
> - This option is rarely used; it is mainly for [multi-port listening](/en/server/port.html).

## open_websocket_protocol

Enables `WebSocket` protocol message parsing.

**Example**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, "Hello Swoole");
});

$port = $server->listen('127.0.0.1', 9502, SWOOLE_TCP);

// If you have read the multi-port listening chapter, you know this is not required, because child ports inherit the parent port's configuration; this only demonstrates how to configure it.
$port->set(['open_websocket_protocol' => true]); 

$port->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, "Hello World");
});

$server->start();
```

> [!WARNING]
> **Notes**
>
> - [WebSocket servers](/en/server/websocket.html) enable `open_websocket_protocol` by default.
> - This option is rarely used; it is mainly for [multi-port listening](/en/server/port.html).

## open_http2_protocol

Enables `HTTP2` protocol message parsing.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// Set the SSL certificate
$http->set([
  'ssl_cert_file' => '/server.crt',
  'ssl_key_file' => '/server.key',
  'open_http2_protocol' => true  // Enable this to parse the http2 protocol
]);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

## open_mqtt_protocol

Enables `mqtt` protocol message parsing.

## open_redis_protocol

Enables `redis` protocol message parsing.

## socket_buffer_size

Controls the size of the buffer for data the server sends to clients. Default: `8M`.

**Example**

```php
<?php
$server->set([
  'socket_buffer_size' => 128 * 1024 *1024
]);
```

> [!WARNING]
> **Notes**
>
> - Suppose `socket_buffer_size` is `8M` and `20M` of data must be sent to the client. Two cases arise:
>     - The network is very good: the `20M` of data is sent to the client in one operation, and no buffer needs to be allocated.
>     - Under network congestion, a single send completes only `1M`, and the remaining `19M` triggers the first buffer allocation. **On the first buffer allocation, the data size is not checked against `socket_buffer_size`**. The `19M` of data goes straight into the buffer. If another `2M` is sent afterwards, since the buffer is no longer empty, the underlying layer first checks whether the total backlogged data in the buffer already exceeds the `socket_buffer_size` threshold. If the pending data in the buffer exceeds `socket_buffer_size`, an error is raised; otherwise the `2M` of data is stored in the buffer.

## send_yield

With coroutines enabled, if the data the server sends to a client fills the send buffer, no error is thrown immediately. Instead, the current coroutine voluntarily yields the CPU, waits for the buffered data to be sent, and then resumes to continue sending. Default: `true`.

**Example**

```php
<?php
$server->set([
  'send_yield' => true,
  'enable_coroutine' => true,
]);
```

> [!WARNING]
> **Notes**
>
> - If this option is disabled, once the amount of data sent exceeds `socket_buffer_size`, the underlying layer immediately throws a `connection#1 output buffer overflow` error.

## send_timeout

Sets the send timeout; must be used together with `send_yield`. If the coroutine does not resume within the specified time and the data cannot be written to the send buffer, the underlying operation returns `false` and sets the error code to `ETIMEDOUT`. The error code can then be obtained via `getLastError()`. The unit is seconds.

**Example**

```php
<?php
$server->set([
  'send_yield' => true,
  'send_timeout' => 1.5,
  'enable_coroutine' => true,
]);
```

## socket_dns_timeout

Controls the domain name resolution timeout, in seconds.

**Example**

```php
<?php
$server->set([
  'socket_dns_timeout' => 10
]);
```

## socket_connect_timeout

Controls the timeout of the TCP connection establishment phase. It is the maximum wait from the client issuing the connect() system call until the TCP three-way handshake with the server completes successfully. The unit is seconds.

**Example**

```php
<?php
$server->set([
  'socket_connect_timeout' => 10
]);
```

## socket_write_timeout / socket_send_timeout

Controls the maximum time allowed for the client to send data to the server. The unit is seconds.

**Example**

```php
<?php
$server->set([
  'socket_write_timeout' => 10
]);
```

## socket_read_timeout / socket_recv_timeout

Controls the maximum time the client waits to receive data. It covers the entire process from finishing sending the request to fully receiving the response data. The unit is seconds.

**Example**

```php
<?php
$server->set([
  'socket_read_timeout' => 10
]);
```

## open_tcp_nodelay

Disables the `Nagle` algorithm so small packets are sent immediately instead of waiting to be merged. Default: `false`.

**Example**

```php
<?php
$server->set([
  'open_tcp_nodelay' => false
]);
```

## open_tcp_keepalive

Enables TCP's KeepAlive mechanism so the operating system kernel automatically detects whether connections are still valid and cleans up dead ones. Default: `false`.

**Example**

```php
<?php
$server->set([
  'open_tcp_keepalive' => false
]);
```

> [!WARNING]
> **Notes**
>
> - Must be used together with `tcp_keepidle`, `tcp_keepinterval`, and `tcp_keepcount`,

## tcp_keepidle

How long a TCP connection must be idle before the kernel sends the first `KeepAlive` probe to check whether the connection is still alive. The unit is seconds.

**Example**

```php
<?php
$server->set([
  'tcp_keepidle' => 5
]);
```

## tcp_keepinterval

The interval between TCP KeepAlive probes. It determines how often probes are resent after the first probe receives no response. The unit is seconds.

**Example**

```php
<?php
$server->set([
  'tcp_keepinterval' => 5
]);
```

## tcp_keepcount

The maximum number of retries after TCP KeepAlive probes fail before the connection is closed. It determines how many attempts the system makes before receiving a probe response.

**Example**

```php
<?php
$server->set([
  'tcp_keepcount' => 100
]);
```

## tcp_defer_accept

- The `tcp_defer_accept` parameter controls whether the server defers allocating socket and application-layer resources when a new TCP connection is created. The default is `0`, meaning standard behavior: as soon as the three-way handshake completes, the server allocates resources and wakes the application to handle the connection.
- Standard behavior has an efficiency problem: if a client establishes a connection but sends no data for a long time, the server still maintains the connection and holds resources — the typical "full-connection attack" scenario.
- With `tcp_defer_accept` set (unit: seconds), the server allocates full resources only when actual client data arrives. If no data arrives within that time, the connection is actively dropped, avoiding wasted resources.

**Example**

```php
<?php
$server->set([
  'tcp_defer_accept' => 5
]);
```

## tcp_user_timeout

- After the sender transmits data, if the peer's `ACK` does not arrive, TCP retransmits the data with an exponential-backoff algorithm.
- Once the cumulative retransmission time exceeds the value of `tcp_user_timeout`, the connection is closed. Default: 0. The unit is milliseconds.

**Example**

```php
<?php
$server->set([
  'tcp_user_timeout' => 5000 // 5 seconds
]);
```

> [!TIP]
> Available with Swoole version >= `v4.5.3-alpha`.

## tcp_fastopen

- Enables the TCP fast-handshake feature, which allows application data to be carried during the three-way handshake, saving one RTT (round-trip time) of latency. Default: `false`.


**Example**

```php
<?php
$server->set([
  'tcp_fastopen' => true
]);
```

## task_ipc_mode

- Sets the communication method between [worker processes](/en/server/process_thread.html#worker) and [task processes](/en/server/process_thread.html#task). Default: `SWOOLE_IPC_UNSOCK`.


**Example**

```php
<?php
$server->set([
  'task_ipc_mode' => SWOOLE_IPC_UNSOCK,
]);
```

- Supported communication methods:

| Mode                  | Description                                                                                                                                  |
|:---|:---|
| SWOOLE_IPC_UNSOCK     | Communicates via Unix Socket; supports targeted dispatch. The target Task process can be specified via `dst_worker_id` in the `task` / `taskwait` methods.<br>If `dst_worker_id` is set to `-1`, the underlying layer automatically picks a currently idle Task process for dispatch. |
| SWOOLE_IPC_MSGQUEUE   | Communicates via a sysvmsg message queue; supports targeted dispatch (the target process can be specified via `$task_worker_id`).              |
| SWOOLE_IPC_PREEMPTIVE | Communicates via a sysvmsg message queue, in **contended mode**. Targeted dispatch is not supported; all task processes compete for tasks in the queue. Specifying `$task_worker_id` has no effect. |

> [!WARNING]
> **Notes**
>
> - The `SWOOLE_IPC_MSGQUEUE` and `SWOOLE_IPC_PREEMPTIVE` message-queue modes store data in memory queues provided by the operating system.
> - If [message_queue_key](/en/server/setting.html#message-queue-key) is not specified, a private queue is used and is deleted automatically when the server stops. Otherwise a persistent queue is used: its data survives server shutdown and can still be read after a restart.
> - To delete queue data manually, use the command `ipcrm -q <message queue ID>`.
> - `SWOOLE_IPC_PREEMPTIVE` affects [Swoole\Server->sendMessage()](/en/server/methods.html#sendmessage): messages sent by `worker` processes are dispatched randomly to one of the `task` processes.
> - With the `SWOOLE_IPC_MSGQUEUE` and `SWOOLE_IPC_PREEMPTIVE` options, `task` processes do not support coroutines, i.e. [task_enable_coroutine](/en/server/setting.html#task-enable-coroutine) cannot be enabled.
> - If the `task processes`' processing capacity is lower than the task dispatch rate, `worker processes` may block.

## message_queue_key

- Specifies the message queue name.


**Example**

```php
<?php
$server->set([
  'message_queue_key' => 'swoole',
]);
```

> [!TIP]
> Takes effect only when [task_ipc_mode](/en/server/setting.html#task-ipc-mode) is `SWOOLE_IPC_MSGQUEUE` or `SWOOLE_IPC_PREEMPTIVE`.

## task_tmpdir

- Sets the storage path for data that [worker processes](/en/server/process_thread.html#worker) send to [task processes](/en/server/process_thread.html#task).

- If the dispatched data exceeds `8180` bytes, a temporary file is used to store it. `task_tmpdir` sets where these temporary files are saved.


**Example**

```php
<?php
$server->set([
  'task_tmpdir' => '/tmp'
]);
```

> [!WARNING]
> **Notes**
>
> - The underlying layer stores `task` data in the `/tmp` directory by default. If your `Linux` kernel version is too old and `/tmp` is not a memory filesystem, you can set this to `/dev/shm/`.
> - If the `task_tmpdir` directory does not exist, the underlying layer tries to create it automatically; if creation fails, the server fails to start.

## backlog

- Controls the maximum length of the TCP established-connection queue (Accept Queue).


**Example**

```php
<?php
$server->set([
  'backlog' => 4096
]);
```

> [!NOTE]
> **Notes**
>
> - `TCP` has a three-way handshake: client `syn=>server`, `syn+ack=>client`, `ack`. When the server receives the client's `ack`, it places the connection into a queue called the `accept queue` (note 1).
> - The queue size is determined by the minimum of the `backlog` parameter and the `somaxconn` setting. You can view the final `accept queue` size with the `ss -lt` command. `Swoole`'s master process calls `accept` (note 2) to take connections from the `accept queue`.
> - When the `accept queue` is full, connections may still succeed (note 4) or may fail. On failure, the client sees a connection reset (note 3) or a connection timeout, while the server records the failures, which you can inspect with `netstat -s|grep 'times the listen queue of a socket overflowed`. If this happens, you should increase this value. Fortunately, unlike `PHP-FPM/Apache` and similar software, `Swoole`'s [SWOOLE_PROCESS](/en/server/process_thread.html#swoole-process) mode does not rely on `backlog` to queue connections, so you will rarely encounter this.
> - Note 1: since `linux2.2`, the handshake uses two queues, the `syn queue` and the `accept queue`; the `syn queue` length is determined by `tcp_max_syn_backlog`.
> - Note 2: newer kernels call `accept4` to save one `set no block` system call.
> - Note 3: the client considers the connection established as soon as it receives the `syn+ack` packet, but the server is actually still in the half-open state and may send an `rst` packet to the client, which the client sees as `Connection reset by peer`.
> - Note 4: success comes from TCP's retransmission mechanism; the related settings are `tcp_synack_retries` and `tcp_abort_on_overflow`.

## buffer_low_watermark

- Sets the low watermark of the server-client buffer. It does not directly limit memory size; it acts as an early-warning threshold. The unit is bytes. Default: 0.

- The underlying layer maintains a send buffer for each `TCP` connection; when data is sent to the client, it first enters the send buffer. `buffer_low_watermark` is the "alarm" monitoring the size of this buffer.


**Example**

```php
<?php
$server->set([
  'buffer_low_watermark' => 1 * 1024 * 1024
]);
```

> [!NOTE]
> **Notes**
>
> - When the amount of data in the buffer drops below the value set by `buffer_low_watermark`, the `bufferEmpty` event is triggered. You can continue sending new data on that connection in the event callback.

## buffer_high_watermark

- Sets the high watermark of the server-client buffer. It does not directly limit memory size; it acts as an early-warning threshold. The unit is bytes. Default: `0`.

- The underlying layer maintains a send buffer for each `TCP` connection; when data is sent to the client, it first enters the send buffer. `buffer_high_watermark` is the "alarm" monitoring the size of this buffer.


**Example**

```php
<?php
$server->set([
  'buffer_high_watermark' => 8 * 1024 * 1024
]);
```

> [!NOTE]
> **Notes**
>
> - When the amount of data in the buffer exceeds the value set by `buffer_high_watermark`, the `bufferFull` event is triggered. You can pause sending new data on that connection in the event callback to prevent the buffer from growing without bound.

## open_cpu_affinity

- Enables `CPU` affinity settings. Default: `false`.


**Example**

```php
<?php
$server->set([
  'open_cpu_affinity' => true
]);
```

> [!NOTE]
> **Notes**
>
> - The underlying layer sets `CPU` binding by taking the `reactor` thread ID and `worker` process ID modulo the number of `CPU` cores.
> - On multi-core hardware, enabling this feature binds `Swoole`'s [reactor threads](/en/server/process_thread.html#master) / [worker processes](/en/server/process_thread.html#worker) to a fixed core. This avoids processes/threads migrating between cores at runtime and improves the `CPU Cache` hit rate.
> - The downside is that the `CPU core` a process/thread is bound to may be very busy while other `CPU cores` are idle, resulting in low CPU utilization.

## cpu_affinity_ignore

- Excludes the specified `CPU` cores from `CPU` affinity binding.


**Example**

```php
<?php
$server->set([
  'cpu_affinity_ignore' => [0, 1]   // CPU0 and CPU1 do not participate in affinity binding.
]);
```

> [!NOTE]
> **Notes**
>
> - In `IO`-intensive programs, all network interrupts are handled by `CPU0`. If network IO is heavy, `CPU0` must both receive packets and run business logic; the resulting overload prevents network interrupts from being handled in time, degrading packet send/receive throughput.
> - To avoid this, it is important to use `cpu_affinity_ignore` to exclude `CPU0`, letting it focus on receiving network packets.
> - If the kernel and NIC support multi-queue, network interrupts are spread across multiple cores, relieving interrupt pressure. In that case, `cpu_affinity_ignore` need not be set.


**How to check which CPU handles network interrupts**

```shell
cat /proc/interrupts
```

- This produces output like the following

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

- eth0/eth1 are the network interrupt counts. If they are evenly distributed across `CPU0` - `CPU3`, the NIC has multi-queue support. If they are all concentrated on one core, all network interrupts are handled by that `CPU`.
- Once that `CPU` exceeds 100%, the system can no longer process network requests. In that case, use `cpu_affinity_ignore` to keep that `CPU` free exclusively for handling network interrupts.

> [!TIP]
> This option takes effect only when set together with [open_cpu_affinity](/en/server/setting.html#open-cpu-affinity).

## chroot

- Redirects the filesystem root directory of [worker processes](/en/server/process_thread.html#worker).

- This setting isolates the process's filesystem reads and writes from the actual operating system filesystem, improving security.


**Example**

```php
<?php
$server->set([
  'chroot' => '/data/server/'
]);
```

## user

- Sets the owner of [worker processes](/en/server/process_thread.html#worker) and [task processes](/en/server/process_thread.html#task).

- To listen on ports below `1024`, the server needs `root` privileges. But if the program runs as `root`, any vulnerability in the code lets an attacker execute remote commands as `root`, which is very risky.

- With the `user` option configured, the [master process](/en/server/process_thread.html#master) or [manager process](/en/server/process_thread.html#manager) can run with `root` privileges while child processes run as a regular user.


**Example**

```php
<?php
$server->set([
  'user' => 'www-data'
]);
```

> [!TIP]
> Only a program started as `root` can change the user a process belongs to; regular users do not have this permission.

> [!TIP]
> With `Swoole version < 6.2.0`, after using the `user` option to run worker processes as a regular user, you cannot call [Swoole\Server->shutdown()](/en/server/methods.html#shutdown) or [Swoole\Server->reload()](/en/server/methods.html#reload) in a `worker` process to stop or restart the service. You can only run the `kill` command in a `shell` terminal as the `root` account.

## group

- Sets the group of [worker processes](/en/server/process_thread.html#worker) and [task processes](/en/server/process_thread.html#task).

- Like the [user](/en/server/setting.html#user) option, this setting changes the user group a process belongs to, improving the security of the server program.


**Example**

```php
<?php
$server->set([
  'group' => 'www-data'
]);
```

> [!TIP]
> Only a program started as `root` can change the group a process belongs to; regular users do not have this permission.

## pid_file

- Sets the file name for storing the `pid` (process id).


**Example**

```php
<?php
$server->set([
  'pid_file' => '/tmp/swoole.pid'
]);
```

> [!TIP]
> Note that if the service terminates abnormally, the `PID` file is not deleted.

## print_backtrace_on_error

- Whether to print stack trace information when an error occurs in event-loop-related operations. Default: `false`.


**Example**

```php
<?php
$server->set([
  'print_backtrace_on_error' => true
]);
```

## c_stack_size / stack_size

- Sets the initial C stack memory size of a single coroutine. The default is 2M.


**Example**

```php
<?php
$server->set([
  'c_stack_size' => 4 * 1024 * 1024
]);
```

> [!NOTE]
> **Notes**
>
> - This value usually needs no adjustment; the default meets the needs of the vast majority of scenarios.

## event_object

- This option switches the event callback mechanism to the [object-oriented style](/en/server/events.html#object-oriented-style). Default: `false`.


**Example**

```php
<?php
$server->set([
    'event_object' => true,
]);
```

> [!NOTE]
> **Notes**
>
> - Unlike [task_use_object / task_object](/en/server/setting.html#task-use-object-task-object), `event_object` has a broader scope and coarser granularity, affecting multiple event types.
> - There are 5 parameter object classes affected by this setting: [Swoole\Server\Event](/en/server/class/event.html), [Swoole\Server\Packet](/en/server/class/packet.html), [Swoole\Server\PipeMessage](/en/server/class/pipe_message.html), [Swoole\Server\StatusInfo](/en/server/class/status_info.html), [Swoole\Server\TaskResult](/en/server/class/task_result.html). For the mapping between events and classes, see [Object-oriented style](/en/server/events.html#object-oriented-style).

> [!TIP]
> Available with Swoole version >= `v4.6.0`

## debug_mode

- Sets the log mode to `debug` debugging mode.


**Example**

```php
<?php
$server->set([
  'debug_mode' => true
]);
```

> [!NOTE]
> **Notes**
>
> - Using this option requires compiling `Swoole` with [--enable-debug](/en/start/install.html#build-options).

## trace_flags

- Precisely controls the output scope of trace logs.

- The underlying layer supports the following trace items; use `SWOOLE_TRACE_ALL` to trace everything:

| Flag                             | Description         |
|:---|:---|
| `SWOOLE_TRACE_SERVER`          | Server events       |
| `SWOOLE_TRACE_CLIENT`          | Client operations   |
| `SWOOLE_TRACE_BUFFER`          | Buffer operations   |
| `SWOOLE_TRACE_CONN`            | Connection management |
| `SWOOLE_TRACE_EVENT`           | Event loop          |
| `SWOOLE_TRACE_WORKER`          | Worker processes    |
| `SWOOLE_TRACE_MEMORY`          | Memory allocation and release |
| `SWOOLE_TRACE_REACTOR`         | Reactor threads     |
| `SWOOLE_TRACE_PHP`             | PHP-layer calls     |
| `SWOOLE_TRACE_HTTP`            | HTTP protocol       |
| `SWOOLE_TRACE_HTTP2`           | HTTP2 protocol      |
| `SWOOLE_TRACE_EOF_PROTOCOL`    | EOF protocol        |
| `SWOOLE_TRACE_LENGTH_PROTOCOL` | Length protocol     |
| `SWOOLE_TRACE_CLOSE`           | Connection closing  |
| `SWOOLE_TRACE_WEBSOCKET`       | WebSocket protocol  |
| `SWOOLE_TRACE_REDIS_CLIENT`    | Redis client        |
| `SWOOLE_TRACE_MYSQL_CLIENT`    | MySQL client        |
| `SWOOLE_TRACE_HTTP_CLIENT`     | HTTP client         |
| `SWOOLE_TRACE_AIO`             | Async file I/O      |
| `SWOOLE_TRACE_SSL`             | SSL/TLS encryption  |
| `SWOOLE_TRACE_NORMAL`          | Normal logs         |
| `SWOOLE_TRACE_CHANNEL`         | Channel             |
| `SWOOLE_TRACE_TIMER`           | Timers              |
| `SWOOLE_TRACE_SOCKET`          | Socket operations   |
| `SWOOLE_TRACE_COROUTINE`       | Coroutine scheduling |
| `SWOOLE_TRACE_CONTEXT`         | Coroutine context   |
| `SWOOLE_TRACE_CO_HTTP_SERVER`  | Coroutine HTTP server |
| `SWOOLE_TRACE_TABLE`           | Memory table operations |
| `SWOOLE_TRACE_CO_CURL`         | Coroutine CURL      |
| `SWOOLE_TRACE_CARES`           | c-ares DNS resolution |
| `SWOOLE_TRACE_ZLIB`            | Compression/decompression |
| `SWOOLE_TRACE_CO_PGSQL`        | Coroutine PostgreSQL client |
| `SWOOLE_TRACE_CO_ODBC`         | Coroutine ODBC client |
| `SWOOLE_TRACE_CO_ORACLE`       | Coroutine Oracle client |
| `SWOOLE_TRACE_CO_SQLITE`       | Coroutine SQLite client |
| `SWOOLE_TRACE_CO_FIREBIRD`     | Coroutine Firebird client |
| `SWOOLE_TRACE_CO_SSH2`         | Coroutine SSH2 client |
| `SWOOLE_TRACE_THREAD`          | Thread operations   |
| `SWOOLE_TRACE_ALL`             | Enables all trace items |

> [!NOTE]
> **Notes**
>
> - Multiple flags can be combined with `|`: `SWOOLE_TRACE_SERVER | SWOOLE_TRACE_HTTP2`
> - This option requires compiling `Swoole` with [--enable-trace-log](/en/start/install.html#build-options).