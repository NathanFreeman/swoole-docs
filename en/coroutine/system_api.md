# System Methods

## Namespace

`Swoole\Coroutine\System`

## Methods

### gethostbyname

Resolves a domain name to an IP address. Coroutine scheduling is performed automatically at the underlying level.

```php
public static function gethostbyname(string $domain, int $family = AF_INET, float $timeout = -1): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$domain` | Domain name | Required |
| `$family` | Address family. `AF_INET` returns an `IPv4` address; `AF_INET6` returns an `IPv6` address | `AF_INET` |
| `$timeout` | Timeout in seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `-1` |

**Return value**: Returns the `IP` address of the domain name on success, or `false` on failure. Use `swoole_last_error` to get the error information.

**Example**

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
> If `swoole` is compiled with `--enable-c-ares`, domain `IP` lookups are not made async through the thread pool but through the `c-ares` library, which offers better performance.

### dnsLookup

Domain name address lookup. Unlike [`gethostbyname`](#gethostbyname), `dnsLookup` is implemented directly on `UDP` client network communication rather than using the `gethostbyname` function provided by `libc`.

```php
public static function dnsLookup(string $domain, float $timeout = 5, int $type = AF_INET): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$domain` | Domain name | Required |
| `$timeout` | Timeout in seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `5` |
| `$type` | Address family. `AF_INET` resolves `IPv4` addresses; `AF_INET6` resolves `IPv6` addresses | `AF_INET` |

**Return value**: Returns the corresponding `IP` address on successful resolution, or `false` on failure. Use `swoole_last_error` to get the error information.

**Common errors**

- `SWOOLE_ERROR_DNSLOOKUP_RESOLVE_FAILED`: The domain name cannot be resolved; the query failed.
- `SWOOLE_ERROR_DNSLOOKUP_RESOLVE_TIMEOUT`: Resolution timed out. The `DNS` server may be faulty and unable to return a result within the given time.

**Example**

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
> Available since Swoole `4.4.3+`. The underlying implementation reads `/etc/resolv.conf` to obtain the `DNS` server address. The `$type` parameter is available since Swoole `4.7`; before that, only `AF_INET` (`IPv4`) resolution was supported.

> [!TIP]
> The global function `swoole_async_dns_lookup_coro()` is an alias of this method, with identical parameters.

### exec

Executes a `shell` command, with coroutine scheduling performed automatically at the underlying level.

```php
public static function exec(string $command, bool $get_error_stream = false): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$command` | The `shell` command to execute | Required |
| `$get_error_stream` | Whether to fully capture all output of the command execution | `false` |

**Return value**: Returns `false` on failure. On success returns an array containing the process exit status code, signal, and output content.

**Example**

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

Puts the current coroutine to sleep. Equivalent to `PHP`'s `sleep` function, except that `Swoole\Coroutine\System::sleep` performs coroutine scheduling automatically at the underlying level.

```php
public static function sleep(float $seconds): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$seconds` | Sleep duration in seconds, with a minimum granularity of milliseconds (`0.001` seconds). Must be greater than `0` and no more than one day (`86400` seconds) | Required |

**Return value**: Returns `true` on success; returns `false` on failure or when the coroutine is canceled by [cancel](/en/coroutine/coroutine_api.html#cancel).

**Example**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    System::sleep(1.5);
});
```

### getaddrinfo

Performs DNS resolution to query the `IP` addresses of a domain name.

```php
public static function getaddrinfo(string $domain, int $family = AF_INET, int $socktype = SOCK_STREAM, int $protocol = STREAM_IPPROTO_TCP, ?string $service = null, float $timeout = -1): array|bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$domain` | Domain name | Required |
| `$family` | Address family. `AF_INET` returns an `IPv4` address; `AF_INET6` returns an `IPv6` address | `AF_INET` |
| `$socktype` | Protocol type; options include `SOCK_DGRAM`, `SOCK_RAW` | `SOCK_STREAM` |
| `$protocol` | Protocol; options include `STREAM_IPPROTO_UDP`, `STREAM_IPPROTO_STCP`, `STREAM_IPPROTO_TIPC`, `0` | `STREAM_IPPROTO_TCP` |
| `$service` | Service name | `null` |
| `$timeout` | Timeout in seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `-1` |

**Return value**: On success returns an array of multiple `IP` addresses; returns `false` on failure.

**Example**

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

Gets file system information.

```php
public static function statvfs(string $path): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | File path | Required |

**Return value**: On success returns data containing the file information; otherwise returns `false`.

**Example**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\System;
run(function () {
    var_dump(System::statvfs('/'));
});
```

### readFile

Reads a file in coroutine style.

```php
public static function readFile(string $filename, int $flags = 0): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | File name | Required |
| `$flags` | Whether to use a file lock; currently only the `LOCK_EX` option is supported | `0`, meaning no file lock |

> [!NOTE]
> The underlying implementation sets a shared lock while reading the file. Other coroutines can still read the file but cannot write to it.

**Return value**: Returns the string content on success, or `false` on failure. Use `swoole_last_error` to get the error information.

> [!WARNING]
> The `readFile` method has no size limit; the content read is stored in memory, so reading very large files may consume excessive memory.

**Example**

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

Writes a file in coroutine style.

```php
public static function writeFile(string $filename, string $fileContent, int $flags = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | File name. Must be writable; the file is created automatically if it does not exist. Returns `false` immediately if opening the file fails | Required |
| `$fileContent` | Content to write to the file; up to `4M` can be written | Required |
| `$flags` | Write options. By default the current file content is cleared; use `FILE_APPEND` to append to the end of the file | `0` |

> [!NOTE]
> `$flags` also supports `LOCK_EX`, which places an exclusive lock on the file during writing to prevent other coroutines from reading or writing it. Multiple options can be combined with bitwise OR `|`, such as `FILE_APPEND | LOCK_EX`.

**Return value**: Returns the number of bytes written on success, `false` on failure.

**Example**

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

Waits for or returns the status of a child process created by `fork`, similar to [pcntl_wait](https://www.php.net/manual/zh/function.pcntl-wait.php), with coroutine scheduling implemented at the underlying level.

```php
public static function wait(float $timeout = -1): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout. A negative value means never time out. In seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `-1` |

**Return value**: On success returns an array containing the child process's `PID`, exit status code, and the signal that `KILL`ed it; returns `false` on failure.

**Example**

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
> After each child process starts, the parent process must dispatch a coroutine to call `wait()` or [`waitPid()`](#waitpid) to reap it; otherwise the child process becomes a zombie process and wastes operating system process resources.

> [!NOTE]
> For a detailed introduction to the `Swoole\Process` process class, see [Swoole\Process](/en/process/process.html).

### waitPid

Basically the same as the [`wait`](#wait) method above, except that this method can wait for a specific process.

```php
public static function waitPid(int $pid = -1, float $timeout = -1): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$pid` | Process ID. `-1` means any process, equivalent to the `wait` method; other values can be any natural number | `-1` |
| `$timeout` | Timeout. A negative value means never time out. In seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `-1` |

**Return value**: On success returns an array containing the child process's `PID`, exit status code, and the signal that `KILL`ed it; returns `false` on failure.

**Example**

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
> After each child process starts, the parent process must dispatch a coroutine to call [`wait()`](#wait) or `waitPid()` to reap it; otherwise the child process becomes a zombie process and wastes operating system process resources.

> [!NOTE]
> For a detailed introduction to the `Swoole\Process` process class, see [Swoole\Process](/en/process/process.html).

### waitSignal

Coroutine version of a signal listener. The underlying implementation yields the current coroutine's `CPU` to simulate a blocking operation. Similar to the [pcntl_signal](https://www.php.net/manual/zh/function.pcntl-signal.php) function.

```php
public static function waitSignal(int|array $signo, float $timeout = -1): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$signo` | Signal type; you can use the `SIG` family of constants, such as `SIGTERM`, `SIGUSR1`, etc. | Required |
| `$timeout` | Timeout. A negative value means never time out. In seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `-1` |

**Return value**: Returns the signal number when a signal is received; returns `false` if no signal is received before the timeout.

**Example**

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

Coroutine version of an IO event listener that blocks the current coroutine until readable or writable events are triggered. Similar to [Swoole\Event::add()](/en/event.html#add).

```php
public static function waitEvent(mixed $socket, int $events = SWOOLE_EVENT_READ, float $timeout = -1): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor; any type that can be converted to an fd, such as a Socket object or resource | Required |
| `$events` | Event type; see the note below the table for possible values | `SWOOLE_EVENT_READ`, listens for read events |
| `$timeout` | Timeout. A negative value means never time out. In seconds, with a minimum granularity of milliseconds (`0.001` seconds) | `-1` |

> [!NOTE]
> `$events` can be set to [`SWOOLE_EVENT_WRITE`](/en/event.html#constants) to listen for write events, or `SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE` to listen for both read and write events.

**Return value**: Returns the sum of the triggered event types (possibly multiple bits), related to the value passed in the `$events` parameter. Returns `false` on failure; use `swoole_last_error` to get the error information.

**Example**

```php
<?php
use Swoole\Coroutine\System;
use function Swoole\Coroutine\run;

run(function () {
    $client = stream_socket_client('tcp://www.qq.com:80', $errno, $errstr, 30);
    $events = System::waitEvent($client, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE);
    assert($events === SWOOLE_EVENT_WRITE);
    fwrite($client, "GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");
    $events = System::waitEvent($client, SWOOLE_EVENT_READ);
    assert($events === SWOOLE_EVENT_READ);
    $response = fread($client, 8192);
    echo $response;
});
```