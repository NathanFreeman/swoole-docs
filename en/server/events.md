# Event Callbacks

- The examples for the [TCP/UDP server](/en/server/tcp_udp.html), [HTTP/HTTPS/HTTP2 server](/en/server/http.html), and [WebSocket server](/en/server/websocket.html) all contain a piece of structurally similar code:

```php
<?php
$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});
```

- A function registered this way with [Swoole\Server->on()](/en/server/methods.html#on) is an **event callback**. It decides what the server does when a client sends data, a connection is established or closed, or a process starts or exits — it is the core of the entire async server model.

- Taking the code above as an example: **as soon as a client sends data, the server fires the `receive` event, executes the bound function, and replies to the client with Hello World**.

- This section introduces every event supported by the Swoole async server, one by one.

## Event Overview

The table below lists all events ordered by purpose; click an event name to jump to its details. "Process" is the process/thread in which the callback runs; "Coroutine" indicates whether the underlying layer automatically creates a coroutine to run the callback: `Yes` is controlled by [enable_coroutine](/en/server/setting.html#enable-coroutine), the `task` row is controlled by [task_enable_coroutine](/en/server/setting.html#task-enable-coroutine), and `No` means a coroutine is never created.

| Event | Process | Coroutine |
|:---|:---|:---|
| [start](#start) | master | Yes |
| [managerStart](#managerstart) | manager | No |
| [managerStop](#managerstop) | manager | No |
| [beforeReload](#beforereload) | manager | No |
| [afterReload](#afterreload) | manager | No |
| [workerError](#workererror) | manager | No |
| [beforeShutdown](#beforeshutdown) | master/worker/task | Yes |
| [shutdown](#shutdown) | master | No |
| [workerStart](#workerstart) | worker/task | Yes |
| [workerExit](#workerexit) | worker | No |
| [workerStop](#workerstop) | worker/task | No |
| [connect](#connect) | worker | Yes |
| [receive](#receive) | worker | Yes |
| [packet](#packet) | worker | Yes |
| [close](#close) | worker | Yes |
| [bufferFull](#bufferfull) | worker | No |
| [bufferEmpty](#bufferempty) | worker | No |
| [task](#task) | task | task_enable_coroutine |
| [finish](#finish) | worker | Yes |
| [pipeMessage](#pipemessage) | worker/task | Yes |
| [request](#request) | worker | Yes |
| [beforeHandshakeResponse](#beforehandshakeresponse) | worker | Yes |
| [handshake](#handshake) | worker | Yes |
| [open](#open) | worker | Yes |
| [message](#message) | worker | Yes |
| [disconnect](#disconnect) | worker | Yes |

## start

- Fired in the [master process](/en/server/process_thread.html#processes-threads) after the server starts.

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object instance | Required |

**Example**

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

**Before this event fires, the Server has already**

- Created the [manager process](/en/server/process_thread.html#processes-threads)
- Created the [worker processes](/en/server/process_thread.html#processes-threads)
- Started listening on all TCP/UDP/`Unix Socket` ports, but has not yet begun accepting connections and requests
- Readied the timers

**What happens next**

- The [reactor threads](/en/server/process_thread.html#processes-threads) begin receiving events, and clients can connect

**Usage notes**

- `start` is only suitable for simple operations such as `echo`, logging, and changing the process name. **Do not call `Swoole\Server` methods**, because the service is not fully ready at this point. `start` and `workerStart` run in parallel in different processes, with no fixed order.
- It is recommended to write `Swoole\Server->master_pid` and `Swoole\Server->manager_pid` to a file in `start`, so management scripts can send signals to these two PIDs to stop or restart the service.

> [!WARNING]
> - Global objects created in `start` cannot be used in worker processes: when `start` runs, the worker processes have already been created, so new objects exist only in the master process's memory and are inaccessible to worker processes.
> - [SWOOLE_BASE](/en/server/process_thread.html#working-modes) mode has no master process and therefore no `start` event. **Do not register `start` in BASE mode**.
> - Async and coroutine APIs can be used in `start`, but they may conflict with `dispatch_func` and `package_length_func`. **Do not use them together**.
> - Do not start timers in `start`, otherwise the program cannot exit normally after calling `Swoole\Server::shutdown()`.

> [!NOTE]
> - The server does not accept any client connections before `start` returns, so synchronous blocking functions can be used safely.

```php
<?php
use Swoole\Server;
use Swoole\Timer;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('start', function(Server $server) {
  // Do not operate timers here, otherwise the master process can never exit
  Timer::add(1000, function() {});
  echo "master process start";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `start` event.

## connect

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when a new connection arrives.

```php
function (Swoole\Server $server, int $fd, int $reactorId) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$fd` | File descriptor of the connection | Required |
| `$reactorId` | In `SWOOLE_PROCESS` mode, the index of the [reactor thread](/en/server/process_thread.html#processes-threads) holding the `TCP` connection; in other modes, the `worker` process index | Required |

**Example**

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
> `HTTP` servers and `WebSocket` servers do not fire the `connect` callback.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `connect` event.

## beforeShutdown

- Fired before a process exits normally.

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object instance | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('beforeShutdown', function(Server $server) {
    echo "Server is about to shutdown\n";
    // Perform resource cleanup, state saving, etc. here
    // Coroutine APIs are supported
});
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

- When the service is terminated by a signal, whether each process fires `beforeShutdown`:

| Process type | Fires `beforeShutdown`? |
|:---|:---|
| **master process** | ✅ Fires |
| **worker process** | ✅ Fires |
| **task process** | ✅ Fires |
| **manager process** | ✅ Fires in SWOOLE_BASE mode |
| **user process** | ❌ Does not fire |

> [!NOTE]
> - Coroutines are supported in this event; coroutine APIs can be used safely.

> [!WARNING]
> - Fires only when a process **exits normally**; forced termination such as `kill -9` or `Ctrl+C` does not trigger it.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `beforeShutdown` event.


## shutdown

- Fired when the service exits normally.

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object instance | Required |

**Example**

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


**When it fires**

- When the service is terminated by a signal, whether each process fires `shutdown`:

| Process type | Fires `shutdown`? |
|:---|:---|
| **master process** | ✅ Fires |
| **worker process** | ❌ Does not fire |
| **task process** | ❌ Does not fire |
| **manager process** | ✅ Fires in SWOOLE_BASE mode |
| **user process** | ❌ Does not fire |

> [!WARNING]
> - Forcibly terminating a process (e.g. `kill -9`) does not fire `shutdown`.
> - Pressing `Ctrl+C` on the command line stops the program immediately and likewise does not fire `shutdown`.
> - Do not call async or coroutine APIs in `shutdown`; the underlying layer has already destroyed all event loop facilities at this point.

> [!NOTE]
> - All processes and threads have terminated, and the listening ports are closed.
> - To make the program follow the normal exit flow, use `kill -15` to send `SIGTERM` to the master process.
> - There is no coroutine environment at this point; if you really need coroutine APIs, you must manually call `Co\run` to create a [coroutine container](/en/coroutine/container.html).

> [!TIP]
> Even if [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer does not create a coroutine to execute the `shutdown` event, because the coroutine environment has already been destroyed at this point.

## workerStart

- Fired when a [worker process](/en/server/process_thread.html#processes-threads) / [task process](/en/server/process_thread.html#processes-threads) starts. Objects created here can be used throughout the process's entire lifecycle.

```php
function (Swoole\Server $server, int $workerId) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$workerId` | Process index, not the system PID | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerStart', function (Server $server, int $workerId) {
    echo "worker started, ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

**Code hot-reload support**

- To achieve code hot reloading via process restarts, **include your code files inside `workerStart`**, so new code is loaded on every restart.
- When worker/task processes are **recreated** (after `reload` or a restart following an unexpected exit), the **manager process** forks the new child processes.
- Files included **before `workerStart`** (such as common libraries) are loaded into memory **when the manager process starts**; the manager itself does not restart, so these files are never reloaded. The cost is that they cannot be hot-updated; the benefit is that all workers share the same copy in memory instead of each process keeping its own. Shared, rarely changing `php` files are suitable here.
- Files included **inside `workerStart`** (such as business code) are reloaded every time each worker process starts, so they can be hot-updated, but each process keeps its own copy in memory.

```
Manager process starts
    ├── Loads common libraries (framework core, configuration, etc.)
    │
    ├── fork worker process 0
    │       └── Runs workerStart  → loads business code
    │
    ├── fork worker process 1
    │       └── Runs workerStart  → loads business code
    │
    └── On reload
            ├── Manager process (common libraries stay in memory, not reloaded)
            └── Forks new worker processes again
                    └── Runs workerStart again  → reloads business code (hot update)
```

```php
<?php
require __DIR__ . '/common_lib.php'; // All worker processes can read this file, but process restarts do not reload it.
$server->on('workerStart', function ($server, $workerId) {
    require __DIR__ . '/process_a_only.php'; // Only process A can read this file; process B cannot
});
```

**Coroutine support**

A **coroutine environment is created automatically** in `workerStart`, so coroutine APIs can be used directly:

```php
<?php
$server->on('workerStart', function ($server, $workerId) {
    file_put_contents('data.txt', 'hello world');
});
```

> [!NOTE]
> - `workerStart` and `start` **run concurrently**, with no fixed order.
> - When [worker_num](/en/server/setting.html#worker-num) or [task_worker_num](/en/server/setting.html#task-worker-num) is greater than 1, `workerStart` **fires once per process**.
> - `$workerId` is the process index, not the system PID; use `posix_getpid()` to get the actual PID.
> - Use [taskworker](/en/server/properties.html#taskworker) to determine whether the current process is a `worker` process or a `task` process.
> - [user processes](/en/server/process_thread.html#processes-threads) do not fire `workerStart`.

> [!WARNING]
> - If a **fatal error** occurs in `workerStart` or `exit` is called explicitly, the current worker/task process exits and the manager process immediately recreates a new one. If this happens frequently, processes are **constantly created and destroyed**, hurting service stability.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `workerStart` event.

## workerExit

- `workerExit` fires only when [reload_async](/en/server/setting.html#reload-async) is enabled, just before the process exits.

```php
function (Swoole\Server $server, int $workerId) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$workerId` | Process index, not the system PID | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
  'reload_async' => true,  // workerExit fires only when this is enabled
  'max_wait_time' => 10
]);
$server->on('workerExit', function (Server $server, int $workerId) {
    echo "worker stopped, ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!NOTE]
> - `workerExit` fires inside the `worker` process; it also fires in [task processes](/en/server/process_thread.html#processes-threads) if an event loop exists there.
> - In `workerExit`, remove or close async `Socket` connections whenever possible; the underlying layer exits the process only when it detects that the number of listening handles in the event loop is `0`.
> - If the process was not listening on any event handles in the first place, this event does not fire on exit.
> - `workerStop` fires only after the `worker` process has exited.

> [!WARNING]
> - As long as the `worker` process has not exited, `workerExit` keeps firing.
> - If the process still has not exited after `max_wait_time` seconds, it is forcibly killed with the message `worker exit timeout, forced termination`.

> [!TIP]
> The underlying layer does not create a coroutine to execute the `workerExit` event.

## workerStop

- Fired when a `worker` process terminates. You can reclaim the various resources allocated by that process here.

```php
function (Swoole\Server $server, int $workerId) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$workerId` | Process index, not the system PID | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerStop', function (Server $server, int $workerId) {
    echo "worker stopped, ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!WARNING]
> - `workerStop` does not fire when a process ends abnormally (forced `kill`, fatal error, `core dump`).
> - Do not call async or coroutine APIs in `workerStop`; the underlying layer has already destroyed all event loop facilities at this point.

> [!TIP]
> The underlying layer does not create a coroutine to execute the `workerStop` event.

## workerError

- Fired in the [manager process](/en/server/process_thread.html#processes-threads) when a [worker process](/en/server/process_thread.html#processes-threads) exits abnormally.

```php
function (Swoole\Server $server, int $workerId, int $pid, int $exitCode, int $signal) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$workerId` | Process index, not the system PID | Required |
| `$pid` | Process PID | Required |
| `$exitCode` | Process exit status code, 0~255 | Required |
| `$signal` | Signal that caused the process to exit | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('workerError', function (Server $server, int $workerId, int $pid, int $exitCode, int $signal) {
    echo "worker exited abnormally, ID: {$workerId}\n";
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

> [!NOTE]
> - This event is mainly for alerting and monitoring: an abnormal worker process exit usually means a fatal error or core dump; log it or send an alert so developers can handle it.

> [!WARNING]
> - `$signal = 11`: the `worker` process suffered a `segmentation fault`, possibly an underlying bug. Collect the `core dump` information and `valgrind` memory-check logs and report them to the Swoole development team.
> - `$exitCode = 255`: the worker process hit a `Fatal Error`; check the PHP error log to locate the offending code.
> - `$signal = 9`: the `worker` was forcibly killed by the system; check for a manual `kill -9` and whether `dmesg` contains an `OOM (Out of memory)` record.

> [!TIP]
> - The underlying layer does not create a coroutine to execute the `workerError` event.

## beforeReload

- Fired before [worker processes](/en/server/process_thread.html#processes-threads) / [task processes](/en/server/process_thread.html#processes-threads) restart; executed in the [manager process](/en/server/process_thread.html#processes-threads).

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |

**Example**

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
> - Restart requests do not stack: while a previous restart is still in progress, new restart requests are ignored.
> - Sending `SIGUSR1` to the `master` / `manager` process gracefully restarts all `worker` and `task` processes.
> - Sending `SIGUSR2` to the `master` / `manager` process gracefully restarts all `task` processes.
> - This event does not fire when a `user` process exits.

> [!WARNING]
> - Do not use blocking code such as `while(1) {}` in `beforeReload`, otherwise the processes cannot restart.
> - If the restart has not completed after `max_wait_time`, all `worker` processes are forcibly killed.

> [!TIP]
> - The underlying layer does not create a coroutine to execute the `beforeReload` event.

## afterReload

- Fired after [worker processes](/en/server/process_thread.html#processes-threads) / [task processes](/en/server/process_thread.html#processes-threads) restart; executed in the [manager process](/en/server/process_thread.html#processes-threads).

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |

**Example**

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
> - The underlying layer does not create a coroutine to execute the `afterReload` event.

## task

- Fired in the `task` process when a [worker process](/en/server/process_thread.html#processes-threads) dispatches a task to a [task process](/en/server/process_thread.html#processes-threads). Used to handle time-consuming tasks without blocking `worker` processes.

```php
function (Swoole\Server $server, int $taskId, int $workerId, mixed $data) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$taskId` | The ID of the task; globally unique only when combined with `$workerId` | Required |
| `$workerId` | Index of the `worker` process that dispatched the task; tasks dispatched by different `worker` processes may have the same ID | Required |
| `$data` | Data content of the task | Required |

**Example**

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
  echo $data . PHP_EOL; // The task process returns data via `Swoole\Server->finish()`  
});

$server->start();
```

> [!WARNING]
> - `task_worker_num` must be set, otherwise no `task` processes are created and `worker` processes cannot dispatch tasks.
> - Do not call [task](/en/server/methods.html#task), [taskwait](/en/server/methods.html#taskwait), [taskwaitmulti](/en/server/methods.html#taskwaitmulti), or [taskco](/en/server/methods.html#taskco) inside the `task` event; the underlying layer checks the environment and throws an error.
> - If task execution exits due to a fatal error or is forcibly `kill`ed by an external process, the current task is discarded, but other queued tasks are unaffected.

> [!NOTE]
> - When no target `task` process is specified, the underlying layer picks one from all `task` processes by modulo, regardless of whether it is idle.
> - A `task` process marks itself busy upon receiving a task and stops accepting new ones; when all are busy, dispatching reports `No idle task worker is available`, and you can only wait for a target process to become idle.

> [!TIP]
> - If [task_enable_coroutine](/en/server/setting.html#task-enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `task` event.

## finish

- After a task dispatched by a [worker process](/en/server/process_thread.html#processes-threads) completes in a [task process](/en/server/process_thread.html#processes-threads), the task process sends the result back to the worker process via `Swoole\Server->finish()` or `return`, at which point `finish` fires in the worker process.

```php
function (Swoole\Server $server, int $taskId, mixed $data) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$taskId` | The ID of the task | Required |
| `$data` | Result content of the task processing | Required |

**Example**

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
  echo $data . PHP_EOL; // The task process returns data via `Swoole\Server->finish()`  
});

$server->on('task', function (Server $server, int $taskId, int $workerId, mixed $data) use ($server) {
    echo $data . PHP_EOL;
    $server->finish($data);  // return $data; has the same effect
});

$server->start();
```


> [!WARNING]
> - If the [task](/en/server/events.html#task) event **does not call** the [finish](/en/server/events.html#finish) method and **does not** return a result via `return`, the worker process **does not fire** the `finish` event.
> - If the [task](/en/server/events.html#task) event returns a result but the `finish` event is **not registered**, the underlying layer throws an exception: `require 'onFinish' callback`.

> [!NOTE]
> - The worker process that executes [finish](/en/server/events.html#finish) is the very worker process that originally dispatched the task.

> [!TIP]
> - If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `finish` event.

## managerStart

- Fired when the [manager process](/en/server/process_thread.html#processes-threads) starts.

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |

**Example**

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
> - You can change the manager process's name in this event.
> - Before `4.2.12`, the `manager` process could not add timers, dispatch async tasks, or use coroutines; since `4.2.12`, signal-based synchronous-mode timers can be used.
> - The `manager` process can call [sendMessage](/en/server/methods.html#sendmessage) to send messages to other worker processes.

> [!TIP]
> - The underlying layer does not create a coroutine to execute the `managerStart` event.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('managerStart', function (Server $server) {
    $server->sendMessage('Hello World', 1); // Send a message to the process with index 1
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});


$server->on('pipeMessage', function(Server $server, int $workerId, mixed $message) {
  // Receives messages sent by the manager process via Swoole\Server->sendMessage()
});

$server->start();
```


## managerStop

- Fired when the [manager process](/en/server/process_thread.html#processes-threads) ends.

```php
function (Swoole\Server $server) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |

**Example**

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
> - When `managerStop` fires, all [worker processes](/en/server/process_thread.html#processes-threads) and [task processes](/en/server/process_thread.html#processes-threads) have already ended and been reaped by the `manager` process.

> [!TIP]
> - The underlying layer does not create a coroutine to execute the `managerStop` event.

## pipeMessage

- Fired when a [worker process](/en/server/process_thread.html#processes-threads) / [task process](/en/server/process_thread.html#processes-threads) receives a `unixSocket` message sent via [sendMessage](/en/server/methods.html#sendmessage); both types of processes can fire it.

```php
function (Swoole\Server $server, int $workerId, mixed $message) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$workerId` | Process index of the sender | Required |
| `$message` | Message content; can be any PHP type | Required |

**Example**

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
      $server->sendMessage('Hello World', 1); // Send a message to the process with index 1
    } else {
      $server->sendMessage('Hello World', 0); // Send a message to the process with index 0
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
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `pipeMessage` event.

## receive

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when `TCP` data is received.

```php
function (Swoole\Server $server, int $fd, int $reactorId, string $data) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$fd` | File descriptor of the connection | Required |
| `$reactorId` | In [SWOOLE_PROCESS mode](/en/server/process_thread.html#swoole-process), the index of the [reactor thread](/en/server/process_thread.html#processes-threads) holding the `TCP` connection; in other modes, the [worker process](/en/server/process_thread.html#processes-threads) index | Required |
| `$data` | Received data; may be text or binary | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});
$server->start();
```

> [!IMPORTANT]
> [TCP servers](/en/server/tcp_udp.html) must set the `receive` event.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `receive` event.

## packet

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when `UDP` data is received.

```php
function (Swoole\Server $server, mixed $data, array $clientInfo) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$data` | Received data; may be text or binary | Required |
| `$clientInfo` | Client information | Required |

**Example**

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

| Field | Description |
|:---|:---|
| `server_socket` | `socket` file descriptor of the current connection |
| `dispatch_time` | Time the data was received |
| `server_port` | Server listening port |
| `address` | Client IP |
| `port` | Client port |

> [!IMPORTANT]
> [UDP servers](/en/server/tcp_udp.html) must set the `packet` event.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `packet` event.

## request

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when an `HTTP` request is received.

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| [Swoole\Http\Request](/en/server/class/request.html) `$request` | `HTTP` request object, containing client request information such as `GET`, `POST`, `COOKIE`, and `Header`. | Required |
| [Swoole\Http\Response](/en/server/class/response.html) `$response` | `HTTP` response object; call its methods to send the response. | Required |

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('request', function (Request $request, Response $response) {
    echo "HTTP request received" . PHP_EOL;
});

$server->start();
```

> [!IMPORTANT]
> [HTTP/HTTPS/HTTP2 servers](/en/server/http.html) must set the `request` event.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `request` event.

## beforeHandshakeResponse

- Fired before the `WebSocket` handshake. Use this event when you do not want to customize the handshake flow but do want to add some `HTTP header`s to the response headers.

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| [Swoole\Http\Request](/en/server/class/request.html) `$request` | `HTTP` request object, containing client request information. | Required |
| [Swoole\Http\Response](/en/server/class/response.html) `$response` | `HTTP` response object; use it to send the response to the client. | Required |

**Example**

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
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `beforeHandshakeResponse` event.

## handshake

- To complete the `WebSocket` handshake yourself, register the `handshake` event.

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| [Swoole\Http\Request](/en/server/class/request.html) `$request` | `HTTP` request object, containing client request information. | Required |
| [Swoole\Http\Response](/en/server/class/response.html) `$response` | `HTTP` response object; use it to send the response to the client. | Required |

**Example**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('handshake', function (Request $request, Response $response) {
    // print_r( $request->header );
    // if (some of my custom requirements are not met, respond with empty output and return false; the handshake fails) {
    //    $response->end();
    //    return false;
    // }

    // WebSocket handshake connection algorithm verification
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

    // If the request headers contain Sec-WebSocket-Protocol, the response headers must set the same Sec-WebSocket-Protocol
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
> - Register this event only when you need to handle the `WebSocket` handshake yourself; without it, Swoole completes the handshake automatically.
> - After registering `handshake`, the `open` event no longer fires.
> - In `handshake` you must call [status](/en/server/class/response.html#status) to set the status code to `101`, then call [end](/en/server/class/response.html#end) to respond, otherwise the handshake fails.
> - The built-in handshake protocol is `Sec-WebSocket-Version: 13`; older browsers require you to implement the handshake yourself.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `handshake` event.

## open

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) after a `WebSocket` client completes the handshake.

```php
function (Swoole\WebSocket\Server $server,  Swoole\Http\Request $request) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` object. | Required |
| [Swoole\Http\Request](/en/server/class/request.html) `$request` | `HTTP` request object. | Required |

**Example**

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
> - `WebSocket` first handshakes over the `HTTP` protocol, so `$request` contains the handshake request information sent by the client.
> - In the `open` event you can call [push](/en/server/methods.html#push) to send data to the client, or call [close](/en/server/methods.html#close) to close the connection.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `open` event.

## message

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when `WebSocket` data is received.

```php
function (Swoole\WebSocket\Server $server,  Swoole\WebSocket\Frame $frame) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` object. | Required |
| `$frame` | `WebSocket` frame sent by the client. | Required |

**Example**

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
> [WebSocket servers](/en/server/websocket.html) must set the `message` event.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `message` event.

## disconnect

- Fired when a `WebSocket` connection closes.

```php
function (Swoole\WebSocket\Server $server, int $fd) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | `Swoole\WebSocket\Server` object. | Required |
| `$fd` | File descriptor of the closed connection. | Required |

**Example**

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
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `disconnect` event.

## close

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) after a `TCP` connection closes.

```php
function (Swoole\Server $server, int $fd, int $reactorId) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$fd` | File descriptor of the connection | Required |
| `$reactorId` | Index of the `reactor` thread holding the connection; negative when the server closes it actively. | Required |

**Example**

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
> - When the server actively closes a connection, the underlying layer sets `$reactorId` to `-1`, so checking `$reactorId < 0` tells you whether the close was initiated by the server or the client.
> - Only an explicit call to [close](/en/server/methods.html#close) in server-side PHP code counts as an active close.
> - A fatal error in `close` causes connection leaks; `netstat` will show large numbers of TCP connections in `CLOSE_WAIT` state.
> - Whether the client disconnects or the server calls [close](/en/server/methods.html#close), this event always fires whenever a connection closes.
> - You can still call [getClientInfo](/en/server/methods.html#getclientinfo) in `close` to get connection information; the underlying layer actually closes the `TCP` connection only after the callback finishes.
> - The connection is already closed when `close` fires; do not call [close](/en/server/methods.html#close) again in the event, otherwise a PHP warning is thrown.

> [!TIP]
> If [enable_coroutine](/en/server/setting.html#enable-coroutine) is `true`, the underlying layer creates a coroutine to execute the `close` event.

## bufferFull

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when a connection's send buffer reaches the high watermark. It notifies your code to pause sending data to that connection, preventing the buffer from growing without bound.

```php
function (Swoole\Server $server, int $fd) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$fd` | File descriptor of the connection | Required |

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->set([
    'buffer_high_watermark' => 8 * 1024 * 1024,
    'buffer_low_watermark' => 1 * 1024 * 1024,
]);
$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, str_repeat('A', 1024 * 1024));
});
$server->on('bufferFull', function (Server $server, int $fd) {
    echo "connection#{$fd} send buffer is full, pause sending\n";
});
$server->on('bufferEmpty', function (Server $server, int $fd) {
    echo "connection#{$fd} send buffer is empty, resume sending\n";
});
$server->start();
```

> [!NOTE]
> - Fires when the data in a connection's send buffer reaches [buffer_high_watermark](/en/server/setting.html#buffer-high-watermark); when unset, the default is `80%` of [socket_buffer_size](/en/server/setting.html#socket-buffer-size).
> - After firing, the underlying layer marks the connection as being at the high watermark; the mark is cleared only when the buffer drops below [buffer_low_watermark](/en/server/setting.html#buffer-low-watermark) and [bufferEmpty](#bufferempty) fires.
> - This is a port-level event; you can register it for a specific listening port via [Swoole\Server\Port](/en/server/class/port.html).

> [!WARNING]
> In `SWOOLE_PROCESS` mode, non-hash dispatch strategies (`SWOOLE_DISPATCH_ROUND`, `SWOOLE_DISPATCH_IDLE_WORKER`, `SWOOLE_DISPATCH_UIDMOD`, `SWOOLE_DISPATCH_CO_REQ_LB`, `SWOOLE_DISPATCH_CONCURRENT_LB`, etc.) disable `bufferFull`/`bufferEmpty` (as well as `connect`/`close`) and emit a warning, unless [enable_unsafe_event](/en/server/setting.html#enable-unsafe-event) is enabled. Hash dispatch strategies (`SWOOLE_DISPATCH_FDMOD`, `SWOOLE_DISPATCH_IPMOD`, `SWOOLE_DISPATCH_CO_CONN_LB`) are not subject to this restriction.

> [!TIP]
> The underlying layer does not create a coroutine to execute the `bufferFull` event.

## bufferEmpty

- Fired in the [worker process](/en/server/process_thread.html#processes-threads) when the data in a connection's send buffer drops below the low watermark. It notifies your code to resume sending data to that connection.

```php
function (Swoole\Server $server, int $fd) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | Swoole\Server object | Required |
| `$fd` | File descriptor of the connection | Required |

**Example**

See the [bufferFull](#bufferfull) example.

> [!NOTE]
> - Fires when the data in a connection's send buffer drops below [buffer_low_watermark](/en/server/setting.html#buffer-low-watermark), provided the connection had previously entered the high-watermark state.
> - With [send_yield](/en/server/setting.html#send-yield) enabled, the underlying layer also resumes the send coroutines that were suspended because the buffer was full.
> - Also a port-level event; the dispatch-mode restriction is the same as for [bufferFull](#bufferfull).

> [!TIP]
> The underlying layer does not create a coroutine to execute the `bufferEmpty` event.

## Event Differences

> [!NOTE]
> `receive`, `packet`, `request`, and `message` all handle client messages; the core difference is the **data processing level**:
> - **`receive`**: receives the raw **TCP byte stream**. The underlying layer does no parsing; you must implement protocol decoding yourself.
> - **`packet`**: receives raw **UDP data**. The underlying layer does no parsing; you must implement protocol decoding yourself.
> - **`request` / `message`**: receive **structured data automatically parsed** by the underlying layer, ready for direct use in business logic.

> [!NOTE]
> `disconnect` and `close` both relate to connection closing, but at different levels:
> - **`disconnect`**: corresponds to the disconnection of the **WebSocket logical connection** (including handshake state and protocol-level disconnection).
> - **`close`**: corresponds to the closing of the underlying **TCP connection**, at which point the OS-level file descriptor is released.

> [!NOTE]
> `workerExit` and `workerStop` both fire when a process exits, but serve different purposes:
> - **`workerExit`**: performs a **graceful shutdown** within `max_wait_time`, actively cleaning up and closing all event handle listeners.
> - **`workerStop`**: is merely a **notification that the process has stopped**; it does not participate in graceful shutdown and runs after the worker process has fully exited.


## Object-Oriented Style
Set [event_object](/en/server/setting.html#event-object) to `true`, and the callback parameters of some events switch to **object-oriented mode**.

### Key Changes
- **Traditional mode**: the callback receives multiple separate parameters (such as `$fd`, `$reactor_id`, `$data`).
- **Object-oriented mode**: the callback instead receives an **object instance** encapsulating the event's full context, with more intuitive property access and friendlier type hints.

The parameter objects for each event are listed below; click a class name to view its properties and methods:

| Event | Parameter object in object-oriented mode |
|:---|:---|
| `connect` / `close` / `receive` | [Swoole\Server\Event](/en/server/class/event.html) |
| `packet` | [Swoole\Server\Packet](/en/server/class/packet.html) |
| `pipeMessage` | [Swoole\Server\PipeMessage](/en/server/class/pipe_message.html) |
| `workerError` | [Swoole\Server\StatusInfo](/en/server/class/status_info.html) |
| `finish` | [Swoole\Server\TaskResult](/en/server/class/task_result.html) |
| `task` | [Swoole\Server\Task](/en/server/class/task.html) |

The first five rows of the table are controlled by [event_object](/en/server/setting.html#event-object); the [task](/en/server/events.html#task) event is controlled by [task_use_object / task_object](/en/server/setting.html#task-use-object-task-object).

**Example**

```php
<?php

use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\Packet;
use Swoole\Server\PipeMessage;
use Swoole\Server\StatusInfo;
use Swoole\Server\TaskResult;

// Create the server instance
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

// Enable object-oriented event mode
$server->set([
    'event_object' => true, 
]);

// 1. Connection event: receives an Event object
$server->on('connect', function (Server $serv, Event $event) {
    // $event->fd, $event->reactor_id, etc.
    var_dump($event);
});

// 2. Data receive event: receives an Event object (with the data property)
$server->on('receive', function (Server $serv, Event $event) {
    // $event->data is the received message content
    var_dump($event);
});

// 3. Connection close event: receives an Event object
$server->on('close', function (Server $serv, Event $event) {
    var_dump($event);
});

// 4. UDP packet event: receives a Packet object
$server->on('packet', function (Server $serv, Packet $packet) {
    // $packet->data, $packet->address, $packet->port
    var_dump($packet);
});

// 5. Pipe message event: receives a PipeMessage object
$server->on('pipeMessage', function (Server $serv, PipeMessage $msg) {
    var_dump($msg);
    
    // Demonstrates how to get data from the object and send it
    $payload = $msg->data; 
    // Assume $payload is an object/array containing address, port, data, server_socket
    $serv->sendto(
        $payload->address, 
        $payload->port, 
        $payload->data, 
        $payload->server_socket ?? 0
    );
});

// 6. Worker error event: receives a StatusInfo object
$server->on('workerError', function (Server $serv, StatusInfo $info) {
    // $info->worker_id, $info->worker_pid, $info->exit_code, $info->signal, etc.
    var_dump($info);
});

// 7. Async task completion event: receives a TaskResult object
$server->on('finish', function (Server $serv, TaskResult $result) {
    // $result->data, $result->task_id
    var_dump($result);
});

$server->start();
```

## Notes

### Event Names Are Case-Insensitive
When registering events, the underlying layer converts names uniformly to **lowercase**, so the following spellings are the same event with identical behavior:
- `workerStart`
- `workerstart`
- `WoRkerStarT`

> [!NOTE]
> It is recommended to consistently use the **camelCase naming** from the documentation (such as `workerStart`) for readability and maintainability.

### Server Types and Required Events
Different types of servers **must** listen for their corresponding core events, otherwise a warning is thrown at startup or the service cannot work properly.

| Server/process type | **Required events** | Description |
|:---|:---|:---|
| **TCP server** | `receive` | Handles the raw data stream sent by clients |
| **UDP server** | `packet` | Handles data packets sent by clients |
| **HTTP server** | `request` | Handles HTTP requests and returns responses |
| **WebSocket server** | `message` | Handles WebSocket frame messages |
| **Task async task process** | `task`, `finish` | `task`: receives async tasks<br>`finish`: receives task completion results |

**Example**

```php
<?php
// Example 1: a TCP server must listen for the receive event
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo $data . PHP_EOL;
});

$server->start();
```

```php
<?php
// Example 2: a UDP server must listen for the packet event
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);

$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    echo $data . PHP_EOL;
});

$server->start();
```

```php
<?php
// Example 3: an HTTP server must listen for the request event
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
// Example 4: a WebSocket server must listen for the message event
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
// Example 5: when task processes are enabled, the task and finish events must be registered
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