# 系统方法

## 命名空间

`Swoole\Coroutine\System`

## 方法

### gethostbyname

将域名解析为 IP。底层自动进行协程调度。

```php
public static function gethostbyname(string $domain, int $family = AF_INET, float $timeout = -1): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$domain` | 域名 | 必填 |
| `$family` | 域族，`AF_INET` 表示返回 `IPv4` 地址，使用 `AF_INET6` 时返回 `IPv6` 地址 | `AF_INET` |
| `$timeout` | 超时时间，单位为秒，最小精度为毫秒（`0.001` 秒） | `-1` |

**返回值**：成功返回域名对应的 `IP` 地址，失败返回 `false`，可使用 `swoole_last_error` 获取错误信息。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    $ip = System::gethostbyname("www.baidu.com", AF_INET, 0.5);
    echo $ip;
});
```

> [!TIP]
> 如果编译 `swoole` 指定了 `--enable-c-ares`，查询域名 `IP` 将不会通过线程池实现异步，而是通过 `c-ares` 库实现异步查询。性能较好。

### dnsLookup

域名地址查询。与 [`gethostbyname`](#gethostbyname) 不同，`dnsLookup` 直接基于 `UDP` 客户端网络通信实现，而不是使用 `libc` 提供的 `gethostbyname` 函数。

```php
public static function dnsLookup(string $domain, float $timeout = 5, int $type = AF_INET): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$domain` | 域名 | 必填 |
| `$timeout` | 超时时间，单位为秒，最小精度为毫秒（`0.001` 秒） | `5` |
| `$type` | 域族，`AF_INET` 表示解析 `IPv4` 地址，`AF_INET6` 表示解析 `IPv6` 地址 | `AF_INET` |

**返回值**：解析成功返回对应的 `IP` 地址，失败返回 `false`，可使用 `swoole_last_error` 获取错误信息。

**常见错误**

- `SWOOLE_ERROR_DNSLOOKUP_RESOLVE_FAILED`：此域名无法解析，查询失败。
- `SWOOLE_ERROR_DNSLOOKUP_RESOLVE_TIMEOUT`：解析超时，`DNS` 服务器可能存在故障，无法在规定时间内返回结果。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    $ip = System::dnsLookup("www.baidu.com");
    echo $ip;
});
```

> [!NOTE]
> Swoole `4.4.3+` 可用，底层会读取 `/etc/resolv.conf` 获取 `DNS` 服务器地址。`$type` 参数自 Swoole `4.7` 起可用，在此之前仅支持 `AF_INET`（`IPv4`）解析。

### exec

执行一条 `shell` 命令，底层自动执行协程调度。

```php
public static function exec(string $command, bool $get_error_stream = false): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$command` | 要执行的 `shell` 指令 | 必填 |
| `$get_error_stream` | 是否完整捕获命令执行的所有输出 | `false` |

**返回值**：执行失败返回 `false`，执行成功返回数组，包含了进程退出的状态码、信号、输出内容。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    $result = System::exec('ls -al');
    var_dump($result);
});
```

### sleep

将当前协程睡眠。相当于 `PHP` 的 `sleep` 函数，不同的是 `Swoole\Coroutine\System::sleep` 底层会自动协程调度。

```php
public static function sleep(float $seconds): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$seconds` | 睡眠的时间，单位为秒，最小精度为毫秒（`0.001` 秒），必须大于 `0`，最大不得超过一天时间（`86400` 秒） | 必填 |

**返回值**：操作成功返回 `true`，操作失败或者协程被 [cancel](/zh/coroutine/coroutine_api.html#cancel) 取消时返回 `false`。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    System::sleep(1.5);
});
```

### getaddrinfo

进行 DNS 解析，查询域名对应的 `IP` 地址。

```php
public static function getaddrinfo(string $domain, int $family = AF_INET, int $socktype = SOCK_STREAM, int $protocol = STREAM_IPPROTO_TCP, ?string $service = null, float $timeout = -1): array|bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$domain` | 域名 | 必填 |
| `$family` | 域族，`AF_INET` 表示返回 `IPv4` 地址，使用 `AF_INET6` 时返回 `IPv6` 地址 | `AF_INET` |
| `$socktype` | 协议类型，可选 `SOCK_DGRAM`、`SOCK_RAW` | `SOCK_STREAM` |
| `$protocol` | 协议，可选 `STREAM_IPPROTO_UDP`、`STREAM_IPPROTO_STCP`、`STREAM_IPPROTO_TIPC`、`0` | `STREAM_IPPROTO_TCP` |
| `$service` | 服务名 | `null` |
| `$timeout` | 超时时间，单位为秒，最小精度为毫秒（`0.001` 秒） | `-1` |

**返回值**：成功返回多个 `IP` 地址组成的数组，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\System;
use function Swoole\Coroutine\run;

run(function () {
    $ip_list = System::getaddrinfo('www.baidu.com', AF_INET);
    var_dump($ip_list);
});
```

### statvfs

获取文件系统信息。

```php
public static function statvfs(string $path): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 文件路径 | 必填 |

**返回值**：成功返回一个包含文件信息的数据，否则返回 `false`。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    var_dump(System::statvfs('/'));
});
```

### readFile

协程方式读取文件。

```php
public static function readFile(string $filename, int $flags = 0): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 文件名 | 必填 |
| `$flags` | 是否使用文件锁，目前仅支持 `LOCK_EX` 选项 | `0`，表示不使用文件锁 |

> [!NOTE]
> 底层在读取文件时会设置为共享锁，其他协程仍然可以读取文件，但无法写入文件。

**返回值**：读取成功返回字符串内容，读取失败返回 `false`，可使用 `swoole_last_error` 获取错误信息。

> [!WARNING]
> `readFile` 方法没有尺寸限制，读取的内容会存放在内存中，因此读取超大文件时可能会占用过多内存。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;

$filename = __DIR__ . "/defer_client.php";

run(function () use ($filename){
    $r = Swoole\Coroutine\System::readFile($filename);
    var_dump($r);
});
```

### writeFile

协程方式写入文件。

```php
public static function writeFile(string $filename, string $fileContent, int $flags = 0): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 文件名，必须有可写权限，文件不存在会自动创建，打开文件失败会立即返回 `false` | 必填 |
| `$fileContent` | 写入到文件的内容，最大可写入 `4M` | 必填 |
| `$flags` | 写入的选项，默认会清空当前文件内容，可以使用 `FILE_APPEND` 表示追加到文件末尾 | `0` |

> [!NOTE]
> `$flags` 还支持 `LOCK_EX`，写入时会对文件加独占锁，防止其他协程读写此文件。多个选项可使用按位或 `|` 连接，如 `FILE_APPEND | LOCK_EX`。

**返回值**：写入成功返回 `true`，写入失败返回 `false`。

**示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;

$filename = __DIR__ . "/defer_client.php";
run(function () use ($filename)
{
    $w = System::writeFile($filename, "hello swoole!");
    var_dump($w);
});
```

### wait

等待或返回 `fork` 的子进程状态，类似于 [pcntl_wait](https://www.php.net/manual/zh/function.pcntl-wait.php)，底层会实现协程调度。

```php
public static function wait(float $timeout = -1): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 超时时间，负数表示永不超时，单位为秒，最小精度为毫秒（`0.001` 秒） | `-1` |

**返回值**：操作成功会返回一个数组，包含子进程的 `PID`、退出状态码、被哪种信号 `KILL`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\System;
use Swoole\Process;
use function Swoole\Coroutine\run;

$process = new Process(function () {
    echo 'Hello Swoole';
});
$process->start();

run(function () use ($process) {
    $status = System::wait();
    assert($status['pid'] === $process->pid);
    var_dump($status);
});
```

> [!WARNING]
> 每个子进程启动后，父进程都必须派遣一个协程调用 `wait()` 或 [`waitPid()`](#waitpid) 进行回收，否则子进程会变成僵尸进程，会浪费操作系统的进程资源。

> [!NOTE]
> `Swoole\Process` 进程类的详细介绍见 [Swoole\Process](/zh/process/process.html)。

### waitPid

和上述 [`wait`](#wait) 方法基本一致，不同的是此方法可以指定等待特定的进程。

```php
public static function waitPid(int $pid = -1, float $timeout = -1): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$pid` | 进程 ID，`-1` 表示任意进程，此时等价于 `wait` 方法；其它值可为任意自然数 | `-1` |
| `$timeout` | 超时时间，负数表示永不超时，单位为秒，最小精度为毫秒（`0.001` 秒） | `-1` |

**返回值**：操作成功会返回一个数组，包含子进程的 `PID`、退出状态码、被哪种信号 `KILL`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\System;
use Swoole\Process;
use function Swoole\Coroutine\run;

$process = new Process(function () {
    echo 'Hello Swoole';
});
$process->start();

run(function () use ($process) {
    $status = System::waitPid($process->pid);
    var_dump($status);
});
```

> [!WARNING]
> 每个子进程启动后，父进程都必须派遣一个协程调用 [`wait()`](#wait) 或 `waitPid()` 进行回收，否则子进程会变成僵尸进程，会浪费操作系统的进程资源。

> [!NOTE]
> `Swoole\Process` 进程类的详细介绍见 [Swoole\Process](/zh/process/process.html)。

### waitSignal

协程版本信号监听器，底层会让出当前协程的 `CPU` 模拟阻塞操作。类似于 [pcntl_signal](https://www.php.net/manual/zh/function.pcntl-signal.php) 函数。

```php
public static function waitSignal(int|array $signo, float $timeout = -1): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$signo` | 信号类型，可使用 `SIG` 系列常量，如 `SIGTERM`、`SIGKILL` 等 | 必填 |
| `$timeout` | 超时时间，负数表示永不超时，单位为秒，最小精度为毫秒（`0.001` 秒） | `-1` |

**返回值**：收到信号返回 `true`，超时未收到信号返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\System;
use Swoole\Process;
use function Swoole\Coroutine\run;

$process = new Process(function () {
    run(function () {
        $bool = System::waitSignal(SIGUSR1);
        var_dump($bool);
    });
});
$process->start();
sleep(1);
Process::kill($process->pid, SIGUSR1);
```

### waitEvent

协程版本的信号监听器，会阻塞当前协程直到可读可写触发。类似于 [Swoole\Event::add()](/zh/event.html#add)。

```php
public static function waitEvent(mixed $socket, int $events = SWOOLE_EVENT_READ, float $timeout = -1): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符，任何可以转化为 fd 的类型，如 Socket 对象、资源等 | 必填 |
| `$events` | 事件类型，可选值见表格下方说明 | `SWOOLE_EVENT_READ`，监听读事件 |
| `$timeout` | 超时时间，负数表示永不超时，单位为秒，最小精度为毫秒（`0.001` 秒） | `-1` |

> [!NOTE]
> `$events` 可传入 [`SWOOLE_EVENT_WRITE`](/zh/event.html#常量) 监听写事件，或使用 `SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE` 同时监听读写事件。

**返回值**：返回触发的事件类型的和（可能是多个位），和参数 `$events` 传入的值有关。失败返回 `false`，可以使用 `swoole_last_error` 获取错误信息。

**示例**

```php
<?php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    $client = stream_socket_client('tcp://www.qq.com:80', $errno, $errstr, 30);
    $events = Coroutine::waitEvent($client, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE);
    assert($events === SWOOLE_EVENT_WRITE);
    fwrite($client, "GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");
    $events = Coroutine::waitEvent($client, SWOOLE_EVENT_READ);
    assert($events === SWOOLE_EVENT_READ);
    $response = fread($client, 8192);
    echo $response;
});
```
