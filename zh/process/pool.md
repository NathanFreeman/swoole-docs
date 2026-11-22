# 进程池

进程池`Swoole\Process\Pool`，基于 [`Swoole\Server`](/zh/server/tcp_udp.html) 的 [`Manager`](/zh/server/process_thread.html#manager) 进程管理模块实现，用于管理多个工作进程。

相比用 [Swoole\Process](/zh/process/process.html) 手写多进程，`Swoole\Process\Pool` 封装层次更高，进程管理代码更少。配合[协程 TCP/UDP 服务器](/zh/server/coroutine/tcp_udp.html#示例)可创建纯协程风格、利用多核 `CPU` 的服务端程序。

## 方法

### __construct

构造方法。

```php
public function __construct(int $worker_num, int $ipc_type = SWOOLE_IPC_NONE, int $msgqueue_key = 0, bool $enable_coroutine = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$worker_num` | 工作进程数量 | 必填 |
| `$ipc_type` | 通信模式，取值见下表 | `SWOOLE_IPC_NONE` |
| `$msgqueue_key` | 消息队列的 `key` | `0` |
| `$enable_coroutine` | 是否启用协程。启用后无法设置 `Message` 回调，见[协程模式](#协程模式) | `false` |

**`$ipc_type` 取值**

| 常量 | 说明 |
|:---|:---|
| `SWOOLE_IPC_NONE` | 不启用进程间通信，`$ipc_type` 的默认值 |
| `SWOOLE_IPC_MSGQUEUE` | 系统消息队列通信 |
| `SWOOLE_IPC_SOCKET` | `Socket` 通信 |
| `SWOOLE_IPC_UNIXSOCK` | `unixSocket` 通信（`v4.4`+） |

`$ipc_type` 非 `SWOOLE_IPC_NONE` 时，必须设置 `Message` 回调，`WorkerStart` 变为可选。

**SWOOLE_IPC_NONE**

不启用进程间通信。必须设置 `WorkerStart` 回调并在其中实现循环逻辑；回调返回即工作进程退出，随后由 `Manager` 进程重新拉起。

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

// 2 个工作进程，不启用进程间通信，启用协程
$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    Coroutine::sleep($workerId + 1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    if ($workerId == 1) {
        // 回调返回即工作进程退出并被重新拉起，此处终止整个进程池
        $pool->shutdown();
    }
});

$pool->start();
```

**SWOOLE_IPC_MSGQUEUE**

使用系统消息队列通信，可由 `sysvmsg` 扩展投递消息，单条消息不超过 `65536` 字节。

> [!NOTE]
> 用 `sysvmsg` 扩展投递消息时，构造函数必须传入 `$msgqueue_key`；未设置时底层申请私有队列。

> [!WARNING]
> 底层不支持 `sysvmsg` 扩展 `msg_send` 的第二个参数 `mtype`，须传入任意非 `0` 值。

**示例**

接收端（进程池）：

```php
<?php
use Swoole\Process;

$key = 0x7000001;

// 由外部 sysvmsg 扩展投递时，构造函数必须传入 $msgqueue_key
$pool = new Process\Pool(2, SWOOLE_IPC_MSGQUEUE, $key);

// 非 SWOOLE_IPC_NONE 模式下 WorkerStart 可选，只设置 Message 即可
$pool->on('Message', function (Process\Pool $pool, string $data) {
    $msg = json_decode($data, true);
    echo "index: {$msg['index']}\n";
});

$pool->start();
```

投递端（`sysvmsg` 扩展）：

```php
<?php
$key = 0x7000001;
$q = msg_get_queue($key);

foreach (range(1, 100) as $i) {
    $data = json_encode(['data' => base64_encode(random_bytes(1024)), 'id' => uniqid(), 'index' => $i]);
    // 第二个参数 mtype 须传入任意非 0 值
    msg_send($q, $i, $data, false);
}
```

**SWOOLE_IPC_SOCKET**

使用 `Socket` 通信，适用于客户端与服务端不在同一台机器的场景。

用 [listen](#listen) 监听端口，`Message` 事件接收客户端数据，[write](#write) 返回响应。

客户端发送数据时，须在实际数据前附加 `4` 字节网络字节序的长度值：

```php
<?php
$msg = 'Hello Swoole';
$packet = pack('N', strlen($msg)) . $msg;
```

**示例**

服务端：

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

调用端：

```php
<?php
$fp = stream_socket_client('tcp://127.0.0.1:8089', $errno, $errstr) or die("error: {$errstr}\n");

$msg = 'hello swoole';
// 请求须附加 4 字节网络字节序的长度值
fwrite($fp, pack('N', strlen($msg)) . $msg);

// 响应同样带 4 字节长度头
$data = fread($fp, 8192);
echo substr($data, 4, unpack('N', substr($data, 0, 4))[1]);

fclose($fp);
```

**SWOOLE_IPC_UNIXSOCK**

使用 `unixSocket` 通信，**强烈推荐**的方式。

通过 [sendMessage](#sendmessage) 与 `Message` 事件即可通信。开启协程模式后，也可用 [getProcess](#getprocess) 取得 `Swoole\Process` 对象，再用 [exportSocket](/zh/process/process.html#exportsocket) 导出 `Swoole\Coroutine\Socket` 通信；此时不能设置 `Message` 事件，见[协程模式](#协程模式)。

**示例**

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
    // Message 回调只有 $data，没有进程编号，用内容区分收发方向
    if ($data === 'ping') {
        $pool->sendMessage('pong', 0);
        return;
    }
    $pool->shutdown();
});

$pool->start();
```

### set

设置参数。

```php
public function set(array $settings): void
```

| 配置项 | 类型 | 说明 | 默认值 |
|:---|:---|:---|:---|
| `enable_coroutine` | `bool` | 是否启用协程 | `false` |
| `enable_message_bus` | `bool` | 启用消息总线。为 `true` 时底层将大数据切分为小块逐块发送 | `false` |
| `max_package_size` | `int` | 进程可接收的最大数据量，单位为字节 | `2 * 1024 * 1024` |

- `enable_message_bus` 为 `true` 时 `max_package_size` 无效，底层拆分发送、合并接收。
- `SWOOLE_IPC_MSGQUEUE` 模式下 `max_package_size` 无效，底层单次最多接收 `65536`。
- `SWOOLE_IPC_SOCKET` 模式下 `enable_message_bus` 为 `false` 时，数据量超过 `max_package_size` 会直接中断连接。
- `SWOOLE_IPC_UNIXSOCK` 模式下 `enable_message_bus` 为 `false` 时，超过 `max_package_size` 的数据被截断。
- 协程模式下 `enable_message_bus` 为 `true` 时 `max_package_size` 同样无效，底层负责拆分（发送）与合并（接收）；为 `false` 时按 `max_package_size` 限制接收量。

> [!WARNING]
> Swoole 版本 >= `v4.4.4` 可用

**示例**

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);

// 须在 start() 之前调用
$pool->set([
    'enable_coroutine' => false,
    'enable_message_bus' => true,
    'max_package_size' => 2 * 1024,
]);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        // 开启消息总线后，6000 字节被拆分发送、合并接收，不会截断为 2048
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

设置进程池回调函数。

```php
public function on(string $event, callable $function): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event` | 事件名称，见下方事件列表 | 必填 |
| `$function` | 回调函数 | 必填 |

**事件**

- **`WorkerStart`** 子进程启动。回调 `function (Pool $pool, int $workerId)`，`$workerId` 为底层分配的工作进程编号。
- **`WorkerStop`** 子进程结束。回调 `function (Pool $pool, int $workerId)`。
- **`Message`** 收到消息。回调 `function (Pool $pool, string $data)`，`$data` 为消息内容。

> [!NOTE]
> 事件名不区分大小写，`WorkerStart`、`workerStart`、`workerstart` 等价。

> [!WARNING]
> `Message` 接收外部投递的消息，一次连接只能投递一次，类似 `PHP-FPM` 的短连接机制。

**示例**

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

监听 `Socket`，仅 `$ipc_type` 为 `SWOOLE_IPC_SOCKET` 时可用。

```php
public function listen(string $host, int $port = 0, int $backlog = 2048): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 监听地址，支持 `TCP` 与 `unixSocket`。`127.0.0.1` 为 `TCP` 地址，须指定 `$port`；`unix:/tmp/php.sock` 为 `unixSocket` 地址 | 必填 |
| `$port` | 监听端口，`TCP` 模式下须指定 | `0` |
| `$backlog` | 监听队列长度 | `2048` |

**返回值**：成功返回 `true`；失败返回 `false`，可用 `swoole_errno` 获取错误码。监听失败后 `start` 立即返回 `false`。

**通信协议**：客户端须在请求数据前附加 `4` 字节网络字节序的长度值。

```php
<?php
// $msg 需要发送的数据
$packet = pack('N', strlen($msg)) . $msg;
```

**示例**

```php
<?php
$pool->listen('127.0.0.1', 8089);
$pool->listen('unix:/tmp/php.sock');
```

### write

向对端写入数据，仅 `$ipc_type` 为 `SWOOLE_IPC_SOCKET` 时可用。

```php
public function write(string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 写入的数据。可多次调用 `write`，底层在 `Message` 回调退出后将全部数据写入 `socket` 并 `close` 连接 | 必填 |

> [!NOTE]
> 此方法为内存操作，无 `IO` 消耗；实际发送为同步阻塞 `IO`。

**示例**

服务端：

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

调用端：

```php
<?php
$fp = stream_socket_client("tcp://127.0.0.1:8089", $errno, $errstr) or die("error: $errstr\n");
$msg = json_encode(['data' => 'hello', 'uid' => 1991]);
fwrite($fp, pack('N', strlen($msg)) . $msg);
sleep(1);
// 将显示 hello world\n
$data = fread($fp, 8192);
var_dump(substr($data, 4, unpack('N', substr($data, 0, 4))[1]));
fclose($fp);
```

### sendMessage

向目标进程发送数据，仅 `$ipc_type` 为 `SWOOLE_IPC_UNIXSOCK` 时可用。

```php
public function sendMessage(string $data, int $dst_worker_id): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 发送的数据 | 必填 |
| `$dst_worker_id` | 目标进程 `id` | 必填 |

**返回值**：成功返回 `true`，失败返回 `false`。

> [!WARNING]
> 数据大于 `max_package_size` 且 `enable_message_bus` 为 `false` 时，目标进程接收时会截断数据。

**示例**

`2` 个进程，进程 `0` 向进程 `1` 发送 `6000` 字节，进程 `1` 在 `Message` 回调中打印收到的长度。关闭消息总线时截断为 `2048`，开启后完整收到 `6000`。

```php
<?php
use Swoole\Process;

$pool = new Process\Pool(2, SWOOLE_IPC_UNIXSOCK);
$pool->set([
    'enable_coroutine' => false,
    // 'enable_message_bus' => true, // 开启后输出 int(6000)
    'enable_message_bus' => false,   // 关闭后输出 int(2048)
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

启动工作进程。

```php
public function start(): bool
```

> [!NOTE]
> 启动成功后当前进程进入 `wait` 状态管理工作进程；失败返回 `false`，可用 `swoole_errno` 获取错误码。

**进程管理**

- 工作进程因致命错误或主动退出时，管理器负责回收，避免僵尸进程。
- 工作进程退出后，管理器自动创建新的工作进程补位。
- 主进程收到 `SIGTERM` 时停止 `fork` 新进程，并 `kill` 所有运行中的工作进程。
- 主进程收到 `SIGUSR1` 时逐个 `kill` 运行中的工作进程并重启新进程。

**信号处理**

底层只设置主进程（管理进程）的信号处理，`Worker` 进程的信号监听须自行实现。

- 异步模式用 [Swoole\Process::signal](/zh/process/process.html#signal) 监听信号。
- 同步模式用 `pcntl_signal` 与 `pcntl_signal_dispatch` 监听信号。

工作进程应监听 `SIGTERM`：主进程终止它时会发送该信号。未监听则底层强行终止进程，导致部分逻辑丢失。

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

**示例**

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

将当前进程的套接字移出事件循环，仅协程模式下有效。

```php
public function stop(): bool
```

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

// stop() 仅在协程模式下有效
$pool = new Process\Pool(1, SWOOLE_IPC_UNIXSOCK, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    // 移出事件循环后不再接收进程间消息，但进程自身仍可继续执行
    $pool->stop();

    Coroutine::sleep(1);
    echo "worker #{$workerId} still running\n";
    $pool->shutdown();
});

$pool->start();
```

### shutdown

终止工作进程。

```php
public function shutdown(): bool
```

**示例**

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
        // 等待其他工作进程完成任务后终止整个进程池
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

获取工作进程对象，返回 [Swoole\Process](/zh/process/process.html)。

```php
public function getProcess(int $worker_id = -1): Swoole\Process
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$worker_id` | 目标 `worker` 编号 | 当前 `worker` |

> [!WARNING]
> 须在 `start` 之后、工作进程的 `WorkerStart` 或其他回调中调用。返回的 `Process` 对象为单例，同一工作进程内重复调用 `getProcess()` 返回同一对象。

> [!NOTE]
> Swoole 版本 >= `v4.2.0` 可用

**示例**

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

将当前 `Worker` 进程脱离进程池管理。底层立即创建新进程，原进程不再处理数据，生命周期由应用层自行管理。

```php
public function detach(): bool
```

> [!NOTE]
> Swoole 版本 >= `v4.7.0` 可用

**示例**

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;

$pool = new Process\Pool(2, SWOOLE_IPC_NONE, 0, true);

$pool->on('WorkerStart', function (Process\Pool $pool, int $workerId) {
    if ($workerId == 0) {
        // 脱离进程池管理，底层立即创建新进程补位
        $pool->detach();
        echo "detached pid: " . getmypid() . "\n";
        Coroutine::sleep(1);
        // 脱离后生命周期由应用层自行管理
        exit(0);
    }

    Coroutine::sleep(2);
    // 终止进程池，避免工作进程被反复拉起
    $pool->shutdown();
});

$pool->start();
```

## 协程模式

`v4.4.0` 起支持协程，将构造函数第 `4` 个参数设为 `true` 启用。启用后底层在 `WorkerStart` 时自动创建协程与[协程容器](/zh/coroutine/container.html)，回调中可直接使用协程 `API`。

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

协程模式下禁止设置 `Message` 回调。需要进程间通信时，`$ipc_type` 必须为 `SWOOLE_IPC_UNIXSOCK`，通过 `$pool->getProcess()->exportSocket()` 导出 `Swoole\Coroutine\Socket` 对象实现 `Worker` 间通信。

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
> 用法见 [Socket 客户端](/zh/client/socket.html) 与 [Swoole\Process](/zh/process/process.html#exportsocket)。

