# 创建线程

`Swoole` 从 `6.0` 版本开始提供了多线程`Swoole\Thread`支持，可使用线程 `API` 来代替多进程。相比多进程，`Thread` 提供了更丰富的并发数据容器，在开发游戏服务器、通信服务器方面更方便。

## 使用条件

- `PHP` 必须为 `ZTS` 模式，编译 `PHP` 时需要加入 `--enable-zts`
- 编译 `Swoole` 时需要增加 `--enable-swoole-thread` 编译选项

### 查看是否开启线程支持

```shell
php -v
PHP 8.1.23 (cli) (built: Mar 20 2024 19:48:19) (ZTS)
Copyright (c) The PHP Group
Zend Engine v4.1.23, Copyright (c) Zend Technologies
```

`(ZTS)` 表示已启用线程安全。

```shell
php --ri swoole

swoole
Swoole => enabled
thread => enabled
```

`thread => enabled` 表示已开启多线程支持。

## 注意事项

### 资源隔离

`Swoole` 线程与 `Node.js Worker Thread` 是相似的，在子线程中会创建一个全新的 `ZendVM` 环境。子线程不会从父线程继承任何资源，因此在子线程中下列内容已被清空，需要重新创建或设置。

- 已加载的 `PHP` 文件，需要重新 `include/require` 加载
- 需要重新注册 `autoload` 函数
- 类、函数、常量，将被清空，需重新加载 `PHP` 文件创建
- 全局变量，例如 `$GLOBALS`、`$_GET/$_POST` 等，将被重置
- 类的静态属性、函数的静态变量，将重置为初始值
- 一些 `php.ini` 选项，例如 `error_reporting()` 需要在子线程中重新设置

### 不可用特性

在多线程模式下，下列特性仅支持在主线程中操作，不支持在子线程中使用：

- `swoole_async_set()` 修改线程参数
- [`Swoole\Runtime::enableCoroutine()`](/zh/coroutine/hook.html#enablecoroutine) 和 [`Swoole\Runtime::setHookFlags()`](/zh/coroutine/hook.html#sethookflags)
- 仅主线程可设置信号监听。[`Process::signal`](/zh/process/process.html#signal) 在工作线程中调用会直接返回 `true`，但监听不会生效；[`Coroutine\System::waitSignal()`](/zh/coroutine/system_api.html#waitsignal) 不能在子线程中使用
- 仅主线程可创建异步服务器，包括 [`Server`](/zh/server/tcp_udp.html)、[`Http\Server`](/zh/server/http.html)、[`WebSocket\Server`](/zh/server/websocket.html) 等不能在子线程中使用

除此之外，`Runtime Hook` 在多线程模式下开启后将无法关闭。

### 致命错误

当主线程退出时，若依然存在活跃的子线程，将抛出一个致命错误，退出的状态码为 `200`，错误信息如下：

```shell
Fatal Error: 2 active threads are running, cannot exit safely.
```

## 示例

### 创建多线程

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();
$c = 4;

// 主线程没有线程参数，$args 为 null
if (empty($args)) {
    // 主线程
    $threads = [];
    for ($i = 0; $i < $c; $i++) {
        $threads[] = new Thread(__FILE__, $i);
    }
    for ($i = 0; $i < $c; $i++) {
        $threads[$i]->join();
    }
} else {
    // 子线程
    echo "Thread #" . $args[0] . "\n";
    // 示例中循环 5 次后退出，主线程的 join() 才能返回；实际业务中可改为常驻循环
    for ($i = 0; $i < 5; $i++) {
        sleep(1);
        file_get_contents('https://www.baidu.com/');
    }
}
```

### 线程 + 服务端（异步风格）

- 所有工作进程将使用线程来运行，包括 `Worker`、`Task Worker`、`User Process`
- 新增 [`SWOOLE_THREAD`](/zh/server/process_thread.html#swoole-thread) 运行模式，启用后将使用线程代替进程运行
- 增加了 [`bootstrap`](/zh/server/setting.html#bootstrap) 和 [`init_arguments`](/zh/server/setting.html#init-arguments) 两项配置，用于设置工作线程的入口脚本文件、线程共享数据
- 必须在主线程中创建 [`Server`](/zh/server/tcp_udp.html)，可在回调函数中创建新的 `Thread` 执行其他任务
- [`Server::addProcess()`](/zh/server/methods.html#addprocess) 进程对象不支持标准输入输出重定向

```php
<?php
use Swoole\Process;
use Swoole\Thread;
use Swoole\Http\Server;

$http = new Server("0.0.0.0", 9503, SWOOLE_THREAD);
$http->set([
    'worker_num' => 2,
    'task_worker_num' => 3,
    'bootstrap' => __FILE__,
    // 通过 init_arguments 实现线程间的数据共享
    'init_arguments' => function () use ($http) {
        $map = new Swoole\Thread\Map();
        return [$map];
    }
]);

$http->on('Request', function ($req, $resp) use ($http) {
    $resp->end('hello world');
});

$http->on('pipeMessage', function ($http, $srcWorkerId, $msg) {
    echo "[worker#" . $http->getWorkerId() . "]\treceived pipe message[$msg] from " . $srcWorkerId . "\n";
});

$http->addProcess(new Process(function () {
    echo "user process, id=" . Thread::getId();
    sleep(2000);
}));

$http->on('Task', function ($server, $taskId, $srcWorkerId, $data) {
    var_dump($taskId, $srcWorkerId, $data);
    return ['result' => uniqid()];
});

$http->on('Finish', function ($server, $taskId, $data) {
    var_dump($taskId, $data);
});

$http->on('WorkerStart', function ($serv, $wid) {
    // 通过 Swoole\Thread::getArguments() 获取配置中的 init_arguments 传递的共享数据
    var_dump(Thread::getArguments(), $wid);
});

$http->on('WorkerStop', function ($serv, $wid) {
    var_dump('stop: T' . Thread::getId());
});

$http->start();
```

## 属性

### id

通过此对象属性获取子线程的 `ID`，该属性是 `int` 类型。

```php
public int $id
```

> [!NOTE]
> 此属性仅用在父线程，子线程无法获得 `$thread` 对象，应使用 [getId](#getid) 静态方法获取线程的 `ID`。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__, 1);
    var_dump($thread->id);
    $thread->join();
}
```

## 方法

### __construct

多线程构造方法。

```php
public function __construct(string $script_file, mixed ...$args)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$script_file` | 线程启动后要执行的文件 | 必填 |
| `$args` | 主线程传递给子线程的共享数据，在子线程中可使用 [getArguments](#getarguments) 获取，可变参数 | 无 |

> [!WARNING]
> 线程创建失败会抛出 `Swoole\Exception`，可以通过 `try catch` 捕获它。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    // 主线程：创建子线程并传递共享数据
    $thread = new Thread(__FILE__, 'child thread');
    $thread->join();
} else {
    // 子线程
    var_dump($args);
}
```

### join

主线程等待子线程退出。若子线程仍在运行，`join()` 会阻塞，直到子线程退出。

```php
public function join(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    // 主线程
    $thread = new Thread(__FILE__);
    // 阻塞等待子线程退出
    var_dump($thread->join());
} else {
    // 子线程
    sleep(1);
    echo "child thread is finished\n";
}
```

### joinable

检查子线程是否可被 `join()`，有两种情况此方法返回 `false`：

1. 线程执行了 `detach()`，无法使用 `join()` 等待线程退出
2. 线程已退出，并且执行了 `join()` 回收了线程

```php
public function joinable(): bool
```

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    var_dump($thread->joinable());

    $thread->join();
    // 线程已退出并被 join() 回收，不再可 join
    var_dump($thread->joinable());
}
```

### getExitStatus

获取子线程的退出状态码。

```php
public function getExitStatus(): int
```

**返回值**：返回子线程的退出状态码。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    $thread->join();
    var_dump($thread->getExitStatus());
}
```

### getResult

获取线程的返回值。

```php
public function getResult(): mixed
```

**返回值**：返回线程返回值反序列化后的全新副本；线程没有返回值、抛出异常或提前 `exit` 时返回 `null`。

> [!NOTE]
> Swoole 版本 >= `v6.3.0` 可用，且仅在 `PHP >= 8.4` 时生效（`PHP 8.2`/`8.3` 始终返回 `null`）。

> [!WARNING]
> 线程未结束时调用会抛出 `Error`，必须先 [join](#join)。线程结束后可以反复安全调用。与 [getExitStatus](#getexitstatus) 的区别：`getExitStatus` 返回退出状态码，用于区分线程成功与失败；`getResult` 返回业务数据。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    $thread = new Thread(__FILE__, 'child');
    $thread->join();
    var_dump($thread->getResult()); // string(5) "hello"
} else {
    // 子线程脚本的返回值会被序列化保存
    return 'hello';
}
```

### isAlive

检查是否存活，无论线程是否执行了 `detach()` 或 `join()`，始终可以调用此函数。

```php
public function isAlive(): bool
```

**返回值**：返回 `true` 表示线程存活，返回 `false` 表示线程已退出。

> [!NOTE]
> 此方法不会引起阻塞。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    var_dump($thread->isAlive());

    $thread->join();
    var_dump($thread->isAlive());
} else {
    sleep(1);
}
```

### detach

使子线程脱离主线程的掌控，不再需要 `join()` 等待线程退出。

```php
public function detach(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

> [!WARNING]
> 主线程退出前必须等待所有子线程结束，否则将触发[致命错误](#致命错误)。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    // 脱离后不再需要 join()
    var_dump($thread->detach());

    // detach() 之后仍可调用 isAlive() 等待线程结束
    while ($thread->isAlive()) {
        sleep(1);
    }
} else {
    sleep(3);
}
```

### getArguments

静态方法，获取由主线程使用 `new Swoole\Thread()` 时传递过来的共享数据，在子线程中调用。

```php
public static function getArguments(): ?array
```

**返回值**：子线程中返回父线程传递过来的共享数据；主线程没有线程参数，返回 `null`。

> [!NOTE]
> 主线程不会有任何线程参数，可以通过判断线程参数是否为空来分辨父子线程，让它们执行不同的逻辑。

**示例**

```php
<?php
use Swoole\Thread;

// 如果是主线程，$args 为空；如果是子线程，$args 不为空
$args = Thread::getArguments();

if (empty($args)) {
    // 主线程，传递线程参数
    $thread = new Thread(__FILE__, 'child thread');
    echo "main thread\n";
    $thread->join();
} else {
    // 子线程，输出 ['child thread']
    var_dump($args);
}
```

### getId

静态方法，获取当前线程的 `ID`。

```php
public static function getId(): int
```

**返回值**：返回 `int` 类型的整数，表示当前线程的 `id`。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    echo "main thread id: " . Thread::getId() . "\n";
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    echo "child thread id: " . Thread::getId() . "\n";
}
```

### getInfo

静态方法，获取当前多线程环境的信息。

```php
public static function getInfo(): array
```

**返回值**：返回数组，信息如下：

- `is_main_thread`：当前的线程是否为主线程
- `is_shutdown`：线程是否已关闭
- `thread_num`：当前活跃的线程数量

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    var_dump(Thread::getInfo());
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    var_dump(Thread::getInfo());
}
```

### activeCount

静态方法，获取当前活跃的线程数量。

```php
public static function activeCount(): int
```

**返回值**：返回 `int` 类型的整数，表示当前活跃的线程数量，此方法返回值始终为大于或等于 `1` 的整数。

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $threads = [new Thread(__FILE__), new Thread(__FILE__)];

    var_dump(Thread::activeCount());

    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    sleep(1);
}
```

### yield

静态方法，让出当前线程的执行时间片。调用后当前线程会被挂起，等待操作系统调度器优先执行其他线程，等待下一个周期时重新分配时间片给当前线程。

```php
public static function yield(): void
```

**示例**

```php
<?php
use Swoole\Thread;

if (empty(Thread::getArguments())) {
    $thread = new Thread(__FILE__);
    $thread->join();
} else {
    for ($i = 0; $i < 100; $i++) {
        // 让出时间片，等待调度器优先执行其他线程
        Thread::yield();
    }
}
```

### getPriority

静态方法，获取当前线程调度的信息。

```php
public static function getPriority(): array
```

**返回值**：返回数组，信息如下：

- `policy`：线程调度策略
- `priority`：线程的调度优先级

**示例**

```php
<?php
use Swoole\Thread;

var_dump(Thread::getPriority());
```

### setPriority

静态方法，设置当前线程调度优先级和策略。

```php
public static function setPriority(int $priority, int $policy = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$priority` | 设置线程调度优先级 | 必填 |
| `$policy` | 设置线程调度优先策略，其它值为 [`Thread::SCHED_*`](#常量) 相关常量 | `-1`，表示不调整调度策略 |

**返回值**：成功返回 `true`；失败返回 `false`，使用 `swoole_last_error()` 获取错误信息。

> [!WARNING]
> 仅 `root` 用户可以调整，非 `root` 用户调用将被拒绝。

> [!NOTE]
> `SCHED_BATCH`、`SCHED_ISO`、`SCHED_IDLE`、`SCHED_DEADLINE` 仅在 `Linux` 系统下可用。
>
> `SCHED_FIFO`、`SCHED_RR` 策略的线程一般为实时线程，优先级高于普通线程，可获得更多的 `CPU` 时间片。

**示例**

```php
<?php
use Swoole\Thread;

// 仅调整优先级，不调整调度策略，需要 root 权限
var_dump(Thread::setPriority(10));

// 同时指定调度策略
var_dump(Thread::setPriority(10, Thread::SCHED_RR));
```

### getAffinity

静态方法，获取当前线程 `CPU` 亲缘性。

```php
public static function getAffinity(): array
```

**返回值**：返回数组，元素为 `CPU` 核数，例如 `[0, 1, 3, 4]` 表示此线程将被调度到 `CPU` 的 `0/1/3/4` 核心运行。

**示例**

```php
<?php
use Swoole\Thread;

var_dump(Thread::getAffinity());
```

### setAffinity

静态方法，设置当前线程 `CPU` 亲缘性。

```php
public static function setAffinity(array $cpu_set): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cpu_set` | `CPU` 核心的列表，例如 `[0, 1, 3, 4]` | 必填 |

**返回值**：成功返回 `true`；失败返回 `false`，使用 `swoole_last_error()` 获取错误信息。

**示例**

```php
<?php
use Swoole\Thread;

// 将当前线程绑定到 0、1 两个 CPU 核心上运行
var_dump(Thread::setAffinity([0, 1]));
var_dump(Thread::getAffinity());
```

### setName

静态方法，设置当前线程的名称。在使用 `ps` 和 `gdb` 等工具查看和调试时，提供更友好的显示方式。

```php
public static function setName(string $name): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 线程名称 | 必填 |

**返回值**：成功返回 `true`；失败返回 `false`，使用 `swoole_last_error()` 获取错误信息。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

if (empty($args)) {
    // 主线程
    Thread::setName('Master Thread');

    $threads = [];
    for ($i = 0; $i < 4; $i++) {
        $threads[] = new Thread(__FILE__, $i);
    }
    foreach ($threads as $thread) {
        $thread->join();
    }
} else {
    // 子线程
    Thread::setName('Worker Thread ' . $args[0]);
    sleep(60);
}
```

设置后可使用 `ps` 查看线程名称：

```shell
$ ps aux|grep -v grep|grep pool.php
swoole   2226813  0.1  0.1 423860 49024 pts/6    Sl+  17:38   0:00 php pool.php

$ ps -T -p 2226813
    PID    SPID TTY          TIME CMD
2226813 2226813 pts/6    00:00:00 Master Thread
2226813 2226814 pts/6    00:00:00 Worker Thread 0
2226813 2226815 pts/6    00:00:00 Worker Thread 1
2226813 2226816 pts/6    00:00:00 Worker Thread 2
2226813 2226817 pts/6    00:00:00 Worker Thread 3
```

### getNativeId

获取线程的系统 `ID`，将返回一个整数，类似于进程的 `PID`。

```php
public static function getNativeId(): int
```

**返回值**：返回线程的系统 `ID`。

此函数在 `Linux` 系统会调用 `gettid()` 系统调用，获取操作系统线程 `ID`，是一个短整数。线程销毁后此 `ID` 可能会被操作系统复用。

此 `ID` 可以用于 `gdb`、`strace` 调试，例如 `gdb -p $tid`。另外还可以读取 `/proc/{PID}/task/{ThreadNativeId}` 获取线程的执行信息。

**示例**

```php
<?php
use Swoole\Thread;

$args = Thread::getArguments();

// 主线程没有线程参数，$args 为 null，通过这种方式判断主线程和子线程
if (empty($args)) {
    echo "main thread native id: " . Thread::getNativeId() . "\n";
    $thread = new Thread(__FILE__, 1);
    $thread->join();
} else {
    echo "child thread native id: " . Thread::getNativeId() . "\n";
}
```

## 常量

| 常量 | 说明 |
|:---|:---|
| `Thread::HARDWARE_CONCURRENCY` | 硬件并发线程数量，一般为 `CPU` 核数 |
| `Thread::API_NAME` | 线程 `API` 名称，例如 `POSIX Threads` |
| `Thread::SCHED_OTHER` | 默认的分时调度策略，非实时。由公平调度器按 `nice` 值（`-20 ~ 19`）分配 `CPU` 时间，适用于绝大多数普通任务 |
| `Thread::SCHED_FIFO` | 实时策略，先进先出，优先级取值 `1 ~ 99`。线程会一直运行，直到主动阻塞、让出 `CPU`，或被更高优先级的实时线程抢占，同优先级之间不轮换 |
| `Thread::SCHED_RR` | 实时策略，时间片轮转，优先级取值 `1 ~ 99`。与 `SCHED_FIFO` 基本相同，但同优先级的线程会按时间片轮流运行 |
| `Thread::SCHED_BATCH` | 非实时策略，面向长时间占用 `CPU` 的批处理任务。调度器将其视为非交互任务，不给予唤醒抢占上的优待，优先级同样由 `nice` 值决定 |
| `Thread::SCHED_ISO` | 等时（isochronous）策略，让非特权用户也能获得接近实时的低延迟，同时限制其 `CPU` 占用上限。主线内核仅预留了策略编号而未实现，只有 `-ck` / `MuQSS` 补丁内核支持 |
| `Thread::SCHED_IDLE` | 非实时策略，优先级比 `nice` 值为 `19` 的普通任务还低，只在 `CPU` 空闲时运行，且不受 `nice` 值影响 |
| `Thread::SCHED_DEADLINE` | 实时策略，优先级高于 `SCHED_FIFO` / `SCHED_RR`。按最早截止时间优先（`EDF`）调度，保证线程在每个周期内获得指定的运行时间预算；预算、截止时间与周期需通过 `sched_setattr()` 设置，仅靠优先级参数无法完整配置 |

> [!WARNING]
> `SCHED_FIFO`、`SCHED_RR`、`SCHED_DEADLINE` 属于实时策略，线程只要处于可运行状态就会抢占普通线程。若实时线程中出现死循环或长时间不阻塞的计算，同一 `CPU` 核心上的其他线程乃至系统服务都可能得不到调度。

**示例**

```php
<?php
use Swoole\Thread;

var_dump(Thread::HARDWARE_CONCURRENCY, Thread::API_NAME);
```

## 数据类型

这里列出了可以在线程间传递和共享的数据类型。

### 基础类型

`null`、`bool`、`int`、`float` 类型变量，内存尺寸小于 `16 Bytes`，作为值进行传递。

### 字符串

对字符串进行**内存拷贝**，存储到 `ArrayList`、`Queue`、`Map`。

### Socket 资源

**支持的类型列表**

- [`Co\Socket`](/zh/client/socket.html)
- `PHP Stream`
- `PHP Socket(ext-sockets)`，需开启 `--enable-sockets` 编译参数

**不支持的类型**

- [`Swoole\Client`](/zh/client/sync.html)
- [`Swoole\Server`](/zh/server/tcp_udp.html)
- [`Swoole\Coroutine\Client`](/zh/client/tcp_udp.html)
- [`Swoole\Coroutine\Http\Client`](/zh/client/http_websocket.html)
- `pdo` 连接
- `redis` 连接
- 其他的特殊 `Socket` 资源类型

**资源复制**

- 在写入时将进行 `dup(fd)` 操作，与原有资源分离，互不影响，对原有的资源进行 `close` 操作不会影响到新的资源
- 在读取时进行 `dup(fd)` 操作，在读取的子线程 `VM` 内构建新的 `Socket` 资源
- 在删除时进行 `close(fd)` 操作，释放文件句柄

这意味着 `Socket` 资源会存在 `3` 次引用计数，分别是：

- `Socket` 资源初始创建时所在的线程
- `ArrayList`、`Queue`、`Map` 容器
- 读取 `ArrayList`、`Queue`、`Map` 容器的子线程

当没有任何线程或容器持有此资源，引用计数减为 `0` 时，`Socket` 资源才会被真正地释放。引用计数不为 `0`，即使执行了 `close` 操作，也不会关闭连接，不会影响其他线程或数据容器持有的 `Socket` 资源。

若希望忽略引用计数，直接关闭 `Socket`，可使用 `shutdown()` 方法，例如：

- `stream_socket_shutdown()`
- [`Socket::shutdown()`](/zh/client/socket.html#shutdown)
- `socket_shutdown()`

> [!WARNING]
> `shutdown` 操作将影响所有线程持有的 `Socket` 资源，执行后将不再可用，无法执行 `read/write` 操作。

### 数组

使用 `array_is_list()` 进行判断数组的类型，若为数字索引数组则转为 `ArrayList`，关联索引数组转为 `Map`。

- 将会遍历整个数组，将元素插入到 `ArrayList` 或 `Map` 中
- 支持多维数组，递归遍历多维数组转为嵌套结构的 `ArrayList` 或 `Map`

**示例**

```php
<?php
use Swoole\Thread\Map;

$array = [
    'a' => random_int(1, 999999999999999999),
    'b' => random_bytes(128),
    'c' => uniqid(),
    'd' => time(),
    'e' => [
        'key' => 'value',
        'hello' => 'world',
    ],
];

$map = new Map($array);

// $map['e'] 是一个新的 Map 对象，包含两个元素 key、hello，值为 'value' 和 'world'
var_dump($map['e']);
```

### 对象

**线程资源对象**

`Thread\Lock`、`Thread\Atomic`、`Thread\ArrayList`、`Thread\Map` 等线程资源对象，可直接存储到 `ArrayList`、`Queue`、`Map` 中。此操作仅仅是将对象的引用存储到容器中，不会进行对象的拷贝。

将对象写入到 `ArrayList` 或 `Map` 时，只是对线程资源增加一次引用计数，不会拷贝。当对象的引用计数为 `0` 时，会被释放。

**示例**

```php
<?php
use Swoole\Thread;

$map = new Thread\Map();
$lock = new Thread\Lock(); // 当前引用计数为 1
$map['lock'] = $lock; // 当前引用计数为 2
unset($map['lock']); // 当前引用计数为 1
unset($lock); // 当前引用计数为 0，Lock 对象被释放
```

支持列表：

- [`Thread\Lock`](/zh/lock.html#命名空间)
- [`Thread\Atomic`](/zh/atomic.html)
- [`Thread\Atomic\Long`](/zh/atomic.html)
- [`Thread\Barrier`](/zh/thread/barrier.html)
- [`Thread\ArrayList`](/zh/thread/container.html#arraylist)
- [`Thread\Map`](/zh/thread/container.html#map)
- [`Thread\Queue`](/zh/thread/container.html#queue)

> [!WARNING]
> 请注意 `Thread` 线程对象，不可序列化也不可传递，仅在父线程中可用。

**普通 PHP 对象**

将在写入时自动序列化，读取时反序列化。请注意若对象包含不可序列化类型，将会抛出异常。
