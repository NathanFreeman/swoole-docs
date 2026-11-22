# Process Pool

The process pool `Swoole\Process\Pool` is implemented on top of the [`Manager`](/en/server/process_thread.html#manager) process management module of [`Swoole\Server`](/en/server/tcp_udp.html) and is used to manage multiple worker processes.

Compared with hand-writing multi-process code with [Swoole\Process](/en/process/process.html), `Swoole\Process\Pool` provides a higher-level abstraction with less process management code. Combined with a [coroutine TCP/UDP server](/en/server/coroutine/tcp_udp.html#examples), it can create purely coroutine-style server programs that utilize multi-core `CPU`s.

## Methods

### __construct

Constructor.

```php
public function __construct(int $worker_num, int $ipc_type = SWOOLE_IPC_NONE, int $msgqueue_key = 0, bool $enable_coroutine = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$worker_num` | Number of worker processes | Required |
| `$ipc_type` | Communication mode; see the table below for possible values | `SWOOLE_IPC_NONE` |
| `$msgqueue_key` | The `key` of the message queue | `0` |
| `$enable_coroutine` | Whether to enable coroutines. When enabled, the `Message` callback cannot be set; see [Coroutine Mode](#coroutine-mode) | `false` |

**`$ipc_type` values**

| Constant | Description |
|:---|:---|
| `SWOOLE_IPC_NONE` | Inter-process communication is disabled; the default value of `$ipc_type` |
| `SWOOLE_IPC_MSGQUEUE` | System message queue communication |
| `SWOOLE_IPC_SOCKET` | `Socket` communication |
| `SWOOLE_IPC_UNIXSOCK` | `unixSocket` communication (`v4.4`+) |

When `$ipc_type` is not `SWOOLE_IPC_NONE`, the `Message` callback must be set, and `WorkerStart` becomes optional.

**SWOOLE_IPC_NONE**

Inter-process communication is disabled. The `WorkerStart` callback must be set and implement the loop logic within it; when the callback returns, the worker process exits and is then restarted by the `Manager` process.

**Example**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

// 2 worker processes, no inter-process communication, coroutines enabled
$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    Coroutine::sleep($workerId + 1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    if ($workerId == 1) {
        // When the callback returns, the worker process exits and is restarted; shut down the whole pool here
        $pool->shutdown();
    }
});

$pool->start();
```

**SWOOLE_IPC_MSGQUEUE**

Uses system message queue communication. Messages can be delivered by the `sysvmsg` extension; a single message must not exceed `65536` bytes.

> [!NOTE]
> When delivering messages with the `sysvmsg` extension, `$msgqueue_key` must be passed to the constructor; if it is not set, the underlying layer requests a private queue.

> [!WARNING]
> The underlying layer does not support the second parameter `mtype` of the `sysvmsg` extension's `msg_send`; any non-`0` value must be passed.

**Example**

Receiver (the process pool):

```php
<?php
use Swoole\Process;

$key = 0x7000001;

// When messages are delivered by the external sysvmsg extension, $msgqueue_key must be passed to the constructor
$pool = new Process\Pool(2, SWOOLE_IPC_MSGQUEUE, $key);

// In modes other than SWOOLE_IPC_NONE, WorkerStart is optional; setting only Message is sufficient
$pool->on('Message', function (Process\Pool $pool, string $data) {
    $msg = json_decode($data, true);
    echo "index: {$msg['index']}\n";
});

$pool->start();
```

Sender (the `sysvmsg` extension):

```php
<?php
$key = 0x7000001;
$q = msg_get_queue($key);

foreach (range(1, 100) as $i) {
    $data = json_encode(['data' => base64_encode(random_bytes(1024)), 'id' => uniqid(), 'index' => $i]);
    // The second parameter mtype must be any non-0 value
    msg_send($q, $i, $data, false);
}
```

**SWOOLE_IPC_SOCKET**

Uses `Socket` communication, suitable for scenarios where the client and the server are not on the same machine.

Use [listen](#listen) to listen on a port, receive client data in the `Message` event, and return responses with [write](#write).

When the client sends data, it must prepend a `4`-byte length value in network byte order before the actual data:

```php
<?php
$msg = 'Hello Swoole';
$packet = pack('N', strlen($msg)) . $msg;
```

**Example**

Server:

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_SOCKET);

$pool->on('Message', function (Process\Pool $pool, string $data) {
    echo "recv: {$data}\n";
    $pool->write("hello client\n");
});

$pool->listen('127.0.0.1', 8089);
$pool->start();
```

Caller:

```php
<?php
$fp = stream_socket_client('tcp://127.0.0.1:8089', $errno, $errstr) or die("error: {$errstr}\n");

$msg = 'hello swoole';
// The request must be prefixed with a 4-byte length value in network byte order
fwrite($fp, pack('N', strlen($msg)) . $msg);

// The response also carries a 4-byte length header
$data = fread($fp, 8192);
echo substr($data, 4, unpack('N', substr($data, 0, 4))[1]);

fclose($fp);
```

**SWOOLE_IPC_UNIXSOCK**

Uses `unixSocket` communication, the **strongly recommended** approach.

Communication works through [sendMessage](#sendmessage) and the `Message` event. With coroutine mode enabled, you can also use [getProcess](#getprocess) to obtain the `Swoole\Process` object and then [exportSocket](/en/process/process.html#exportsocket) to export a `Swoole\Coroutine\Socket` for communication; in this case the `Message` event cannot be set — see [Coroutine Mode](#coroutine-mode).

**Example**

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        $pool->sendMessage('ping', 1);
    }
});

$pool->on('Message', function (Process\Pool $pool, string $data) {
    echo "recv: {$data}\n";
    // The Message callback only has $data, no process number; use the content to distinguish send/receive direction
    if ($data === 'ping') {
        $pool->sendMessage('pong', 0);
        return;
    }
    $pool->shutdown();
});

$pool->start();
```

### set

Sets parameters.

```php
public function set(array $settings): void
```

| Option | Type | Description | Default |
|:---|:---|:---|:---|
| `enable_coroutine` | `bool` | Whether to enable coroutines | `false` |
| `enable_message_bus` | `bool` | Enables the message bus. When `true`, the underlying layer splits large data into small chunks and sends them one by one | `false` |
| `max_package_size` | `int` | The maximum amount of data a process can receive, in bytes | `2 * 1024 * 1024` |

- When `enable_message_bus` is `true`, `max_package_size` has no effect; the underlying layer splits on send and merges on receive.
- In `SWOOLE_IPC_MSGQUEUE` mode, `max_package_size` has no effect; the underlying layer receives at most `65536` bytes at a time.
- In `SWOOLE_IPC_SOCKET` mode, when `enable_message_bus` is `false`, data exceeding `max_package_size` causes the connection to be closed immediately.
- In `SWOOLE_IPC_UNIXSOCK` mode, when `enable_message_bus` is `false`, data exceeding `max_package_size` is truncated.
- In coroutine mode, when `enable_message_bus` is `true`, `max_package_size` likewise has no effect; the underlying layer handles splitting (send) and merging (receive). When `false`, the received amount is limited by `max_package_size`.

> [!WARNING]
> Available in Swoole version >= `v4.4.4`

**Example**

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);

// Must be called before start()
$pool->set([
    'enable_coroutine' => false,
    'enable_message_bus' => true,
    'max_package_size' => 2 * 1024,
]);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        // With the message bus enabled, 6000 bytes are split on send and merged on receive, not truncated to 2048
        $pool->sendMessage(str_repeat('a', 6000), 1);
    }
});

$pool->on('Message', function (Process\Pool $pool, string $data) {
    echo 'recv ' . strlen($data) . " bytes\n";
    $pool->shutdown();
});

$pool->start();
```

### on

Sets a process pool callback function.

```php
public function on(string $event, callable $function): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event` | Event name; see the event list below | Required |
| `$function` | Callback function | Required |

**Events**

- **`WorkerStart`** A child process starts. Callback `function (Pool $pool, int $workerId)`, where `$workerId` is the worker process number assigned by the underlying layer.
- **`WorkerStop`** A child process ends. Callback `function (Pool $pool, int $workerId)`.
- **`Message`** A message is received. Callback `function (Pool $pool, string $data)`, where `$data` is the message content.

> [!NOTE]
> Event names are case-insensitive: `WorkerStart`, `workerStart`, and `workerstart` are equivalent.

> [!WARNING]
> `Message` receives externally delivered messages; each connection can deliver only once, similar to the short-connection mechanism of `PHP-FPM`.

**Example**

```php
<?php
use Swoole\Process\Pool;
$pool = new Pool(2, SWOOLE_IPC_UNIXSOCK);

$pool->on('WorkerStart', function (Pool $pool, int $workerId) {
    if ($workerId == 0) {
        $pool->sendMessage('hello worker 1', 1);
    }
});

$pool->on('Message', function (Pool $pool, string $data) {
    var_dump($data);
    $pool->shutdown();
});

$pool->on('WorkerStop', function (Pool $pool, $workerId) {
    echo("[Worker #{$workerId}] WorkerStop\n");
});

$pool->start();
```

### listen

Listens on a `Socket`; only available when `$ipc_type` is `SWOOLE_IPC_SOCKET`.

```php
public function listen(string $host, int $port = 0, int $backlog = 2048): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Listen address; supports `TCP` and `unixSocket`. `127.0.0.1` is a `TCP` address and requires `$port`; `unix:/tmp/php.sock` is a `unixSocket` address | Required |
| `$port` | Listen port; must be specified in `TCP` mode | `0` |
| `$backlog` | Listen queue length | `2048` |

**Return value**: Returns `true` on success; returns `false` on failure, and `swoole_errno` can be used to get the error code. If listening fails, `start` immediately returns `false`.

**Communication protocol**: The client must prepend a `4`-byte length value in network byte order before the request data.

```php
<?php
// $msg is the data to send
$packet = pack('N', strlen($msg)) . $msg;
```

**Example**

```php
<?php
$pool->listen('127.0.0.1', 8089);
$pool->listen('unix:/tmp/php.sock');
```

### write

Writes data to the peer; only available when `$ipc_type` is `SWOOLE_IPC_SOCKET`.

```php
public function write(string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to write. `write` can be called multiple times; after the `Message` callback exits, the underlying layer writes all data to the `socket` and `close`s the connection | Required |

> [!NOTE]
> This method is a memory operation with no `IO` cost; the actual sending is synchronous blocking `IO`.

**Example**

Server:

```php
<?php
$pool = new Swoole\Process\Pool(2, SWOOLE_IPC_SOCKET);

$pool->on("Message", function ($pool, $message) {
    echo "Message: {$message}\n";
    $pool->write("hello ");
    $pool->write("world ");
    $pool->write("\n");
});

$pool->listen('127.0.0.1', 8089);
$pool->start();
```

Caller:

```php
<?php
$fp = stream_socket_client("tcp://127.0.0.1:8089", $errno, $errstr) or die("error: $errstr\n");
$msg = json_encode(['data' => 'hello', 'uid' => 1991]);
fwrite($fp, pack('N', strlen($msg)) . $msg);
sleep(1);
// This will display hello world\n
$data = fread($fp, 8192);
var_dump(substr($data, 4, unpack('N', substr($data, 0, 4))[1]));
fclose($fp);
```

### sendMessage

Sends data to a target process; only available when `$ipc_type` is `SWOOLE_IPC_UNIXSOCK`.

```php
public function sendMessage(string $data, int $dst_worker_id): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to send | Required |
| `$dst_worker_id` | The target process `id` | Required |

**Return value**: Returns `true` on success and `false` on failure.

> [!WARNING]
> When the data is larger than `max_package_size` and `enable_message_bus` is `false`, the target process truncates the data on receive.

**Example**

`2` processes: process `0` sends `6000` bytes to process `1`, and process `1` prints the received length in the `Message` callback. With the message bus disabled it is truncated to `2048`; with it enabled, the full `6000` bytes are received.

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);
$pool->set([
    'enable_coroutine' => false,
    // 'enable_message_bus' => true, // When enabled, outputs int(6000)
    'enable_message_bus' => false,   // When disabled, outputs int(2048)
    'max_package_size' => 2 * 1024,
]);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        $pool->sendMessage(str_repeat('a', 2 * 3000), 1);
    }
});

$pool->on('Message', function (Process\Pool $pool, string $data) {
    var_dump(strlen($data));
});

$pool->start();
```

### start

Starts the worker processes.

```php
public function start(): bool
```

> [!NOTE]
> After a successful start, the current process enters the `wait` state to manage the worker processes; on failure it returns `false`, and `swoole_errno` can be used to get the error code.

**Process management**

- When a worker process exits due to a fatal error or on its own, the manager reaps it to avoid zombie processes.
- After a worker process exits, the manager automatically creates a new worker process to take its place.
- When the master process receives `SIGTERM`, it stops `fork`ing new processes and `kill`s all running worker processes.
- When the master process receives `SIGUSR1`, it `kill`s the running worker processes one by one and restarts new ones.

**Signal handling**

The underlying layer only sets up signal handling for the master process (the manager process); signal listening in `Worker` processes must be implemented by yourself.

- In async mode, use [Swoole\Process::signal](/en/process/process.html#signal) to listen for signals.
- In synchronous mode, use `pcntl_signal` and `pcntl_signal_dispatch` to listen for signals.

Worker processes should listen for `SIGTERM`: the master process sends this signal when terminating them. Without a listener, the underlying layer forcibly terminates the process, causing some logic to be lost.

```php
<?php
$pool->on("WorkerStart", function ($pool, $workerId) {
    $running = true;
    pcntl_signal(SIGTERM, function () use (&$running) {
        $running = false;
    });
    echo "Worker#{$workerId} is started\n";
    $redis = new Redis();
    $redis->pconnect('127.0.0.1', 6379);
    $key = "key1";
    while ($running) {
        $msg = $redis->brpop($key, 2);
        pcntl_signal_dispatch();
        if ($msg == null) continue;
        var_dump($msg);
    }
});
```

**Example**

```php
<?php
$workerNum = 10;
$pool = new Swoole\Process\Pool($workerNum);

$pool->on("WorkerStart", function ($pool, $workerId) {
    echo "Worker#{$workerId} is started\n";
    $redis = new Redis();
    $redis->pconnect('127.0.0.1', 6379);
    $key = "key1";
    while (true) {
        $msg = $redis->brpop($key, 2);
        if ($msg == null) continue;
        var_dump($msg);
    }
});

$pool->on("WorkerStop", function ($pool, $workerId) {
    echo "Worker#{$workerId} is stopped\n";
});

$pool->start();
```

### stop

Removes the current process's socket from the event loop; only effective in coroutine mode.

```php
public function stop(): bool
```

**Example**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

// stop() is only effective in coroutine mode
$pool = new Process\Pool(1, SWOOLE_IPC_UNIXSOCK, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    // After being removed from the event loop, no more inter-process messages are received, but the process itself can keep running
    $pool->stop();

    Coroutine::sleep(1);
    echo "worker #{$workerId} still running\n";
    $pool->shutdown();
});

$pool->start();
```

### shutdown

Terminates the worker processes.

```php
public function shutdown(): bool
```

**Example**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    for ($i = 0; $i < 3; $i++) {
        Coroutine::sleep(0.5);
        echo "worker #{$workerId} task {$i}\n";
    }
    if ($workerId == 1) {
        // Wait for the other worker processes to finish their tasks, then terminate the whole pool
        Coroutine::sleep(1);
        $pool->shutdown();
    }
});

$pool->on('WorkerStop', function (Process\Pool $pool, int $workerId) {
    echo "worker #{$workerId} stopped\n";
});

$pool->start();
```

### getProcess

Gets the worker process object; returns [Swoole\Process](/en/process/process.html).

```php
public function getProcess(int $worker_id = -1): Swoole\Process
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$worker_id` | The target `worker` number | The current `worker` |

> [!WARNING]
> Must be called after `start`, inside the worker process's `WorkerStart` or another callback. The returned `Process` object is a singleton: repeated calls to `getProcess()` within the same worker process return the same object.

> [!NOTE]
> Available in Swoole version >= `v4.2.0`

**Example**

```php
<?php
$pool = new Swoole\Process\Pool(3);

$pool->on('WorkerStart', function ($pool, $workerId) {
    $process = $pool->getProcess();
    $process->exec('/usr/local/bin/php', ['-r', 'var_dump(swoole_version());']);
});

$pool->start();
```

### detach

Detaches the current `Worker` process from process pool management. The underlying layer immediately creates a new process; the original process no longer handles data, and its lifecycle is managed by the application layer.

```php
public function detach(): bool
```

> [!NOTE]
> Available in Swoole version >= `v4.7.0`

**Example**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        // Detach from process pool management; the underlying layer immediately creates a new process to take its place
        $pool->detach();
        echo "detached pid: " . getmypid() . "\n";
        Coroutine::sleep(1);
        // After detaching, the lifecycle is managed by the application layer
        exit(0);
    }

    Coroutine::sleep(2);
    // Terminate the pool to prevent worker processes from being restarted repeatedly
    $pool->shutdown();
});

$pool->start();
```

## Coroutine Mode

Coroutines are supported since `v4.4.0`; enable them by setting the `4`th constructor parameter to `true`. Once enabled, the underlying layer automatically creates a coroutine and a [coroutine container](/en/coroutine/container.html) at `WorkerStart`, so coroutine `API`s can be used directly in the callback.

```php
<?php
$pool = new Swoole\Process\Pool(1, SWOOLE_IPC_NONE, 0, true);

$pool->on('workerStart', function (Swoole\Process\Pool $pool, int $workerId) {
    while (true) {
        Co::sleep(0.5);
        echo "hello world\n";
    }
});

$pool->start();
```

In coroutine mode, setting the `Message` callback is forbidden. When inter-process communication is needed, `$ipc_type` must be `SWOOLE_IPC_UNIXSOCK`; export a `Swoole\Coroutine\Socket` object via `$pool->getProcess()->exportSocket()` to implement communication between `Worker`s.

```php
<?php
$pool = new Swoole\Process\Pool(2, SWOOLE_IPC_UNIXSOCK, 0, true);

$pool->on('workerStart', function (Swoole\Process\Pool $pool, int $workerId) {
    $process = $pool->getProcess(0);
    $socket = $process->exportSocket();
    if ($workerId == 0) {
        echo $socket->recv();
        $socket->send("hello proc1\n");
        echo "proc0 stop\n";
    } else {
        $socket->send("hello proc0\n");
        echo $socket->recv();
        echo "proc1 stop\n";
        $pool->shutdown();
    }
});

$pool->start();
```

> [!NOTE]
> For usage, see [Socket Client](/en/client/socket.html) and [Swoole\Process](/en/process/process.html#exportsocket).