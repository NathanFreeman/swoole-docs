# 创建进程

`Swoole\Process` 是 `Swoole` 的进程管理模块，用于替代 `PHP` 的 `pcntl` 扩展。

> [!WARNING]
> 此模块是操作系统进程管理的底层封装，使用者需具备 `Linux` 多进程编程经验。

> [!IMPORTANT]
> 协程内禁止创建进程，`start()` 不可在协程中调用。协程环境下管理外部程序应使用 [`runtime hook`](/zh/coroutine/hook.html) + `proc_open`，见[禁止在协程中创建进程](/zh/coroutine/others.html#禁止在协程中创建进程)。

## 属性

### id

当前进程 `id`。

```php
public int $id
```

### pid

当前进程的 `pid`。

```php
public int $pid
```

### pipe

`unixSocket` 的文件描述符。

```php
public int $pipe
```

### msgQueueId

消息队列的 `id`。

```php
public int $msgQueueId
```

### msgQueueKey

消息队列的 `key`。

```php
public ?int $msgQueueKey
```

## 方法

### __construct

构造方法，仅创建对象并保存子进程回调，不会 `fork` 进程；调用 [start](#start) 后才真正创建子进程。

```php
public function __construct(callable $function, bool $redirect_stdin_stdout = false, int $pipe_type = Swoole\Process::PIPE_TYPE_DGRAM, bool $enable_coroutine = false)
```

| 参数 | 说明                                                                                                                                            | 默认值 |
|:---|:----------------------------------------------------------------------------------------------------------------------------------------------|:---|
| `$function` | 子进程启动后执行的回调函数。底层将其存入对象的 `callback` 属性，该属性为 `private`，外部不可访问                                                                                   | 必填 |
| `$redirect_stdin_stdout` | 重定向子进程的标准输入输出。启用后子进程的输出写入主进程管道而非屏幕，键盘输入改为从管道读取，默认阻塞读取。参见 [exec](#exec)                                                                        | `false` |
| `$pipe_type` | `unixSocket` 类型。启用 `$redirect_stdin_stdout` 时忽略此参数，强制为 `Swoole\Process::PIPE_TYPE_STREAM`。<br>子进程内无进程间通信时可设为 `Swoole\Process::PIPE_TYPE_NONE` | `Swoole\Process::PIPE_TYPE_DGRAM` |
| `$enable_coroutine` | 在 `$function` 中启用协程，启用后可直接使用协程 `API`                                                                                                          | `false` |

**`$pipe_type` 取值**

| 值 | 说明                                |
|:---|:----------------------------------|
| `Swoole\Process::PIPE_TYPE_NONE` | 不创建`unixSocket`通信                 |
| `Swoole\Process::PIPE_TYPE_STREAM` | 创建 `SOCK_STREAM` 类型的 `unixSocket` |
| `Swoole\Process::PIPE_TYPE_DGRAM` | 创建 `SOCK_DGRAM` 类型的 `unixSocket`  |

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo 'child pid: ' . getmypid() . PHP_EOL;
}, false, Process::PIPE_TYPE_STREAM, false);

$process->start();

Process::wait();
```

### set

设置参数。

```php
public function set(array $settings): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 配置数组。`enable_coroutine` 控制是否启用协程，等同于构造函数的第 4 个参数 | 必填 |

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    Swoole\Coroutine::sleep(1);
    echo "child exit\n";
});

// 须在 start() 之前调用
$process->set(['enable_coroutine' => true]);
$process->start();

Process::wait();
```

### start

执行 `fork` 系统调用创建子进程，`Linux` 下耗时数百微秒。

```php
public function start(): int|false
```

**返回值**：成功返回子进程的 `PID`，失败返回 `false`，可用 `swoole_errno` 和 `swoole_strerror` 获取错误码与错误信息。

- 子进程继承父进程的内存与文件句柄。
- 启动时清除继承自父进程的 `EventLoop`、[signal](#signal) 与 [Timer](/zh/timer.html)。

> [!WARNING]
> 子进程沿用父进程的内存与资源。父进程已创建的 `redis` 连接在子进程中保留为同一对象，父子操作的是同一个连接。

**示例**

```php
<?php
$redis = new Redis;
$redis->connect('127.0.0.1', 6379);

function callback_function() {
    swoole_timer_after(1000, function () {
        echo "hello world\n";
    });
    global $redis;//同一个连接
};

swoole_timer_tick(1000, function () {
    echo "parent timer\n";
});//不会继承

Swoole\Process::signal(SIGCHLD, function ($sig) {
    while ($ret = Swoole\Process::wait(false)) {
        // create a new child process
        $p = new Swoole\Process('callback_function');
        $p->start();
    }
});

// create a new child process
$p = new Swoole\Process('callback_function');

$p->start();
```

### name

修改进程名称，是 `swoole_set_process_name` 的别名。

```php
public function name(string $name): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 新的进程名称 | 必填 |

> [!WARNING]
> `exec` 后进程名称由新程序重新设置。应在 `start` 之后的子进程回调函数中调用 `name`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->name('my-worker');
    // 此时可用 ps aux | grep my-worker 观察到新进程名
    sleep(5);
});

$process->start();

Process::wait();
```

### exec

执行外部程序，是 `exec` 系统调用的封装。执行成功后当前进程的代码段被新程序替换，父子进程关系保持不变。

```php
public function exec(string $execfile, array $args)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$execfile` | 可执行文件的绝对路径，如 `/usr/bin/python` | 必填 |
| `$args` | 参数列表，各参数独立放入数组。`array('test.py', 123)` 等价于 `python test.py 123` | 必填 |

> [!WARNING]
> `$execfile` 必须是绝对路径，否则报文件不存在。`exec` 不同于 `shell_exec`，整条命令不能写成一个字符串。
>
> 父进程与新进程通过标准输入输出通信，须启用重定向；未设置 `redirect_stdin_stdout = true` 时，`exec` 后两者无法通信。

**示例**

子进程中运行 `Swoole\Server`，须在 `start()` 之后再调用 `exec()`：

```php
<?php
$process = new Swoole\Process('callback_function', true);

$pid = $process->start();

function callback_function(Swoole\Process $worker)
{
    $worker->exec('/usr/local/bin/php', array(__DIR__ . '/swoole_server.php'));
    // $worker->exec('/usr/local/bin/php' . __DIR__ . '/swoole_server.php'); // 不允许这样把命令和参数全部写在一起
}

Swoole\Process::wait();
```

执行 `shell` 命令须经 `/bin/sh` 的 `-c` 参数：

```php
<?php
$worker->exec('/bin/sh', array('-c', "cp -rf /data/test/* /tmp/test/"));
```

### exit

退出子进程。

```php
public function exit(int $status = 0)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$status` | 退出状态码。`0` 为正常结束，执行清理工作（`PHP` 的 `shutdown_function`、对象析构 `__destruct`、其他扩展的 `RSHUTDOWN` 函数）；非 `0` 为异常退出，立即终止进程并跳过清理 | `0` |

父进程通过 [Process::wait](#wait) 获取子进程的退出事件与状态码。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    register_shutdown_function(function () {
        echo "cleanup\n";
    });
    // 传 0 会执行上面的清理函数，传非 0 则跳过
    $child->exit(0);
});

$process->start();

$status = Process::wait();
echo "exit code: {$status['code']}\n";
```

### kill

向指定进程发送信号。

```php
public static function kill(int $pid, int $signo = SIGTERM): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$pid` | 目标进程的 `pid` | 必填 |
| `$signo` | 信号编号。传 `0` 仅检测进程是否存在，不发送信号 | `SIGTERM` |

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function () {
    sleep(10);
});
$process->start();

// signo 传 0：只检测进程是否存在，不发送信号
var_dump(Process::kill($process->pid, 0));

Process::kill($process->pid, SIGTERM);

$status = Process::wait();
echo "killed by signal: {$status['signal']}\n";
```

### wait

回收已退出的子进程。

```php
public static function wait(bool $blocking = true): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$blocking` | 是否阻塞等待 | `true` |

**返回值**：成功返回数组，含子进程的 `PID`、退出状态码与终止信号；失败返回 `false`。

> [!WARNING]
> 每个子进程结束后，父进程必须调用一次 `wait()` 回收，否则子进程成为僵尸进程，占用系统进程资源。
>
> 父进程无法阻塞等待时，应注册 `SIGCHLD` 信号并在回调中回收。一次 `SIGCHLD` 可能对应多个子进程退出，须以非阻塞方式循环调用 `wait()`，直到返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v4.5.0` 时推荐使用协程版本的 `wait()`，参考 [Swoole\Coroutine\System::wait()](/zh/coroutine/system_api.html#wait)。

**示例**

阻塞模式，等待单个子进程退出：

```php
<?php
use Swoole\Process;

$process = new Process(function () {
    sleep(1);
});
$process->start();

// 阻塞等待，直到子进程退出
$ret = Process::wait(true);
echo "PID={$ret['pid']}, code={$ret['code']}, signal={$ret['signal']}\n";
```

非阻塞模式，配合 `SIGCHLD` 回收多个子进程：

```php
<?php
use Swoole\Process;
use Swoole\Event;

$workerNum = 3;
$reaped = 0;

Process::signal(SIGCHLD, function ($sig) use (&$reaped, $workerNum) {
    // 必须为 false，一次 SIGCHLD 可能对应多个子进程退出
    while ($ret = Process::wait(false)) {
        echo "PID={$ret['pid']}, code={$ret['code']}, signal={$ret['signal']}\n";
        $reaped++;
    }
    // 全部回收完毕，移除信号监听后事件循环随之退出
    if ($reaped >= $workerNum) {
        Process::signal(SIGCHLD, null);
    }
});

for ($n = 1; $n <= $workerNum; $n++) {
    $process = new Process(function () use ($n) {
        sleep($n);
    });
    $process->start();
}

Event::wait();
```

### daemon

使当前进程转为守护进程。

```php
public static function daemon(bool $nochdir = true, bool $noclose = true): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$nochdir` | 是否保留当前工作目录。`true` 表示不切换到根目录 | `true` |
| `$noclose` | 是否关闭标准输入输出文件描述符。`true` 表示不关闭 | `true` |

> [!NOTE]
> 转为守护进程后 `PID` 会变化，用 `getmypid()` 获取当前 `PID`。

**示例**

默认参数，保留工作目录与标准输出：

```php
<?php
use Swoole\Process;

echo 'before daemon: ' . getmypid() . PHP_EOL;

// 默认 nochdir = true、noclose = true
Process::daemon();

// PID 已变化，标准输出未关闭，仍可打印
echo 'after daemon: ' . getmypid() . PHP_EOL;
echo 'cwd: ' . getcwd() . PHP_EOL;
```

`daemon(false, false)`，切换到根目录并关闭标准输出，转为后台常驻：

```php
<?php
use Swoole\Process;
use Swoole\Timer;
use Swoole\Event;

// nochdir = false：切换到根目录
// noclose = false：关闭标准输入输出，之后的 echo 不再显示在终端
Process::daemon(false, false);

$log = fopen('/tmp/daemon.log', 'a');
fwrite($log, 'pid: ' . getmypid() . ', cwd: ' . getcwd() . PHP_EOL);

Timer::tick(1000, function () use ($log) {
    fwrite($log, 'tick ' . time() . PHP_EOL);
});

// 10 秒后清除所有定时器，事件循环无事件后进程退出
Timer::after(10000, function () use ($log) {
    Timer::clearAll();
    fclose($log);
});

Event::wait();
```

## unixSocket 管道通信

### write

父子进程间通过`unixSocket`进行消息写入。

```php
public function write(string $data): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 写入的数据 | 必填 |

**返回值**：成功返回写入的字节数，失败返回 `false`。

**示例**

父进程写入，子进程读取：

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->read();
});
$process->start();

$process->write("hello child\n");

Process::wait();
```

### read

父子进程间通过`unixSocket`进行消息读取。

```php
public function read(int $size = 8192): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$size` | 读取长度，单位为字节 | `8192` |

**返回值**：成功返回读取到的数据，失败返回 `false`。

**示例**

子进程写入，父进程读取：

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->write("hello parent\n");
});
$process->start();

// 默认阻塞读取，单次最多 8192 字节
echo $process->read();

Process::wait();
```

### setBlocking

设置套接字是否阻塞。

```php
public function setBlocking(bool $blocking): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$blocking` | `true` 阻塞，`false` 非阻塞 | 必填 |

> [!NOTE]
> 新建的进程套接字默认阻塞，`unixSocket` 通信时读写会使进程阻塞。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
    $child->write("hello parent\n");
});
$process->start();

// 非阻塞：管道暂无数据时立即返回 false
$process->setBlocking(false);
var_dump($process->read());

// 恢复阻塞后读取
$process->setBlocking(true);
echo $process->read();

Process::wait();
```

### setTimeout

设置管道（`unixSocket`）读写超时。

```php
public function setTimeout(float $seconds): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$seconds` | 超时时间，单位为秒 | 必填 |

**返回值**：成功返回 `true`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
    $child->write("hello parent\n");
});
$process->start();

// 子进程 1 秒后才写入，0.5 秒的超时等不到数据
$process->setTimeout(0.5);
var_dump($process->read());

// 放宽到 2 秒后可正常读到
$process->setTimeout(2);
echo $process->read();

Process::wait();
```

### exportSocket

将 `unixSocket` 导出为 `Swoole\Coroutine\Socket` 对象，用其方法完成进程间通信，用法见 [Socket 客户端](/zh/client/socket.html)。

```php
public function exportSocket(): Swoole\Coroutine\Socket|false
```

**返回值**：成功返回 `Coroutine\Socket` 对象；进程未创建 `unixSocket` 时返回 `false`。

> [!NOTE]
> 多次调用返回同一对象。导出的 `socket` 是新的 `fd`，关闭它不影响进程原有管道。

> [!IMPORTANT]
> `Coroutine\Socket` 只能在[协程容器](/zh/coroutine/container.html)内使用，因此构造函数的 `$enable_coroutine` 必须为 `true`；父进程侧需自行 `Coroutine\run()` 创建容器。

**示例**

父子进程通信：

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

$proc1 = new Process(function (Process $proc) {
    $socket = $proc->exportSocket();
    echo $socket->recv();
    $socket->send("hello master\n");
    echo "proc1 stop\n";
}, false, 1, true);

$proc1->start();

// 父进程创建一个协程容器
run(function () use ($proc1) {
    $socket = $proc1->exportSocket();
    $socket->send("hello pro1\n");
    var_dump($socket->recv());
});
Process::wait(true);
```

`SOCK_DGRAM` 类型无需处理 `TCP` 数据包边界：

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

// IPC 通讯即使是 SOCK_DGRAM 类型的 socket 也不需要用 sendto / recvfrom 这组函数，send / recv 即可。
$proc1 = new Process(function (Process $proc) {
    $socket = $proc->exportSocket();
    while (1) {
        var_dump($socket->send("hello master\n"));
    }
    echo "proc1 stop\n";
}, false, 2, 1); // 构造函数 pipe type 传为 2 即 SOCK_DGRAM

$proc1->start();

run(function () use ($proc1) {
    $socket = $proc1->exportSocket();
    Swoole\Coroutine::sleep(5);
    var_dump(strlen($socket->recv())); // 一次 recv 只会收到一个 "hello master\n" 字符串，不会出现多个
});

Process::wait(true);
```

> [!WARNING]
> `SOCK_STREAM` 类型需处理 `TCP` 数据包边界，参考 [Socket 客户端](/zh/client/socket.html) 的 `setProtocol()` 方法。

### close

关闭已创建的 `unixSocket`管道通信。

```php
public function close(int $which = 0): bool
```
| 参数 | 说明                                                                                                                    | 默认值 |
|:---|:----------------------------------------------------------------------------------------------------------------------|:---|
| `$which` | 指定关闭 Unix Socket 的哪一端（该 Socket 为全双工）：<br>`0` 表示读写两端，`Swoole\Process::PIPE_WRITE` 表示写端，`Swoole\Process::PIPE_READ` 表示读端 | `0` |

> [!NOTE]
> 某些情况下 `Process` 对象无法释放，持续创建进程会导致连接泄漏；调用此方法可关闭 `unixSocket` 释放资源。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->write("hello parent\n");
});
$process->start();

echo $process->read();

// 0 关闭读写两端，也可传 Process::PIPE_WRITE / Process::PIPE_READ 只关一端
$process->close(0);

Process::wait();
```

## 消息队列通信

### useQueue

使用消息队列进行进程间通信。

```php
public function useQueue(int $key = 0, int $mode = SWOOLE_MSGQUEUE_BALANCE, int $capacity = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 消息队列的 `key`。传入 `<= 0` 的值时，底层使用 `ftok`，以当前执行文件的文件名生成 `key` | `0` |
| `$mode` | 通信模式。<br>`SWOOLE_MSGQUEUE_BALANCE`：`pop()` 取队列首条消息，`push()` 不附加类型。所有进程平等竞争，谁先 `pop()` 谁取走队首消息，属于竞争消费/负载均衡，适合多进程共同处理同一批任务；<br>`SWOOLE_MSGQUEUE_ORIENT`：`push()` 附加 `进程 id + 1` 作为类型，`pop()` 只取该类型的消息。消息被精确投递给指定进程，属于定向投递，适合点对点通信 | `SWOOLE_MSGQUEUE_BALANCE` |
| `$capacity` | 队列可存储的数据总字节数上限（对应系统的 `msg_qbytes`） | `-1` |

> [!WARNING]
> 队列为空时 `pop()` 阻塞，队列已满时 `push()` 阻塞。需要非阻塞时，`$mode` 必须为 `SWOOLE_MSGQUEUE_BALANCE | Swoole\Process::IPC_NOWAIT` 或 `SWOOLE_MSGQUEUE_ORIENT | Swoole\Process::IPC_NOWAIT`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

// 须在 start() 之前调用，子进程才能共享同一队列
$process->useQueue();
$process->start();

$process->push("hello queue\n");

Process::wait();
$process->freeQueue();
```

### statQueue

获取消息队列状态。

```php
public function statQueue(): array|false
```

**返回值**：成功返回数组，`queue_num` 为队列中的消息总数，`queue_bytes` 为消息总字节数；失败返回 `false`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    sleep(1);
});

$process->useQueue();
$process->start();

$process->push('hello');
$process->push('swoole');

// queue_num 为消息条数，queue_bytes 为消息总字节数
var_dump($process->statQueue());

Process::wait();
$process->freeQueue();
```

### freeQueue

销毁消息队列。

```php
public function freeQueue(): bool
```

**返回值**：成功返回 `true`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

$process->useQueue();
$process->start();

$process->push("hello queue\n");
Process::wait();

// 队列由内核维护，进程退出后依然存在，须显式销毁
var_dump($process->freeQueue());
```

### pop

从消息队列读取数据。

```php
public function pop(int $size = 65536): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$size` | 单次读取的最大数据量，单位为字节 | `65536` |

**返回值**：成功返回 `string`，失败返回 `false`。

- `SWOOLE_MSGQUEUE_BALANCE`：返回队列首条消息。
- `SWOOLE_MSGQUEUE_ORIENT`：返回首条类型为 `进程 id + 1` 的消息。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // BALANCE 模式按入队顺序取消息
    var_dump($child->pop());
    var_dump($child->pop());
});

$process->useQueue();
$process->start();

$process->push('first');
$process->push('second');

Process::wait();
$process->freeQueue();
```

### push

向消息队列写入数据。

```php
public function push(string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 写入的数据 | 必填 |

**返回值**：成功返回 `true`，失败返回 `false`。

- `SWOOLE_MSGQUEUE_BALANCE`：数据直接入队。
- `SWOOLE_MSGQUEUE_ORIENT`：数据附加 `进程 id + 1` 的类型。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    echo $child->pop();
});

$process->useQueue();
$process->start();

var_dump($process->push("hello queue\n"));

Process::wait();
$process->freeQueue();
```

## 信号与高精度定时器

### signal

注册异步信号监听，基于 `signalfd` 与 `EventLoop` 实现。

```php
public static function signal(int $signo, ?callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$signo` | 信号编号 | 必填 |
| `$callback` | 信号回调函数，传 `null` 移除监听 | 必填 |

- 阻塞程序中回调是不会执行的，需要改用 `pcntl` 扩展的 `pcntl_signal`。
- 重复设置同一信号会覆盖已有回调。
- 多线程模式下只有主线程可以执行此方法，工作线程中调用会直接返回 `true`，但监听不会生效，详见[不可用特性](/zh/thread/create.html#不可用特性)。

> [!WARNING]
> [`Swoole\Server`](/zh/server/tcp_udp.html) 中部分信号不可监听，如 `SIGTERM`、`SIGALRM`。

**示例**

```php
<?php
Swoole\Process::signal(SIGTERM, function ($signo) {
    echo "shutdown.";
});
```

> [!WARNING]
> `v4.4.0` 中，若 `EventLoop` 内只有信号监听事件而无其他事件（如 `Timer`），进程会直接退出。

```php
<?php
Swoole\Process::signal(SIGTERM, function ($signo) {
    echo "shutdown.";
});
Swoole\Event::wait();
```

此程序不会进入 `EventLoop`，[`Swoole\Event::wait()`](/zh/event.html#wait) 立即返回并退出进程。

### alarm

高精度定时器，封装 `setitimer` 系统调用，精度为微秒。到期触发信号，须配合 [Process::signal](#signal) 或 `pcntl_signal` 使用。

```php
public static function alarm(int $time, int $type = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$time` | 定时间隔，单位为微秒；负数表示清除定时器 | 必填 |
| `$type` | 定时器类型，取值见下表 | `0` |

| 定时器类型 | 说明 |
|:---|:---|
| `0` | 真实时间，触发 `SIGALRM` 信号 |
| `1` | 用户态 `CPU` 时间，触发 `SIGVTALRM` 信号 |
| `2` | 用户态 + 内核态时间，触发 `SIGPROF` 信号 |

**返回值**：成功返回 `true`，失败返回 `false`，可用 `swoole_errno` 获取错误码。

> [!WARNING]
> `alarm` 不能与 [Timer](/zh/timer.html) 同时使用。

**示例**

```php
<?php
use Swoole\Process;
use function Swoole\Coroutine\run;

run(function () {
    Process::signal(SIGALRM, function () {
        static $i = 0;
        echo "#{$i}\talarm\n";
        $i++;
        if ($i > 20) {
            Process::alarm(-1);
            Process::kill(getmypid());
        }
    });

    // 100ms
    Process::alarm(100 * 1000);

    while (true) {
        sleep(0.5);
    }
});
```

## CPU 亲和性与优先级

### setAffinity

设置 `CPU` 亲和性，将进程绑定到指定 `CPU` 核，让出其余核给更重要的程序。

```php
public static function setAffinity(array $cpus): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cpus` | 绑定的 `CPU` 核列表，`array(0, 2, 3)` 即绑定 `CPU0/CPU2/CPU3` | 必填 |

> [!WARNING]
> - 元素个数不得超过 `CPU` 核数，`CPU-ID` 不得超过 `CPU` 核数 - `1`
> - 需操作系统支持 `CPU` 绑定
> - `swoole_cpu_num()` 返回当前服务器的 `CPU` 核数

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // CPU-ID 不得超过 swoole_cpu_num() - 1
    var_dump(Process::setAffinity([0, 1]));
});

$process->start();

Process::wait();
```

### getAffinity

获取进程 `CPU` 亲和性。

```php
public static function getAffinity(): array
```

**返回值**：返回 `CPU` 核 `ID` 数组，如 `[0, 1, 3, 4]` 表示进程可被调度到 `0/1/3/4` 核运行。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    Process::setAffinity([0, 1]);
    var_dump(Process::getAffinity());
});

$process->start();

Process::wait();
```

### setPriority

让指定的进程（或进程组、用户进程）在竞争 CPU 资源时，能被内核更优先或更延后地调度。

```php
public function setPriority(int $which, int $priority): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$which` | 优先级的作用范围，取值见下表 | 必填 |
| `$priority` | 优先级，取值 `[-20, 19]`，值越小优先级越高 | 必填 |

| 常量                             | 说明 |
|:-------------------------------|:---|
| `Swoole\Process::PRIO_PROCESS` | 表示操作对象是单个进程。这是最常用的默认类型。 |
| `Swoole\Process::PRIO_PGRP`                    | 表示操作对象是进程组。设置或获取时，会影响该组内的相关进程。 |
| `Swoole\Process::PRIO_USER`                    | 表示操作对象是指定用户拥有的所有进程。 |

**返回值**：成功返回 `true`，失败返回 `false`，可用 `swoole_errno` 和 `swoole_strerror` 获取错误码与错误信息。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    // 调低优先级（数值增大）无需特权，调高则需要相应权限
    var_dump($child->setPriority(Process::PRIO_PROCESS, 10));
});

$process->start();

Process::wait();
```

### getPriority

获取进程的优先级。

```php
public function getPriority(int $which): int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$which` | 优先级的作用范围，取值同 [setPriority](#setpriority) | 必填 |

**返回值**：返回当前优先级。

**示例**

```php
<?php
use Swoole\Process;

$process = new Process(function (Process $child) {
    $child->setPriority(Process::PRIO_PROCESS, 10);
    var_dump($child->getPriority(Process::PRIO_PROCESS));
});

$process->start();

Process::wait();
```
