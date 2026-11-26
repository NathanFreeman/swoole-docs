# 一键协程化

`PHP` 底层的 `I/O` 函数（如 `sleep`、`pdo_mysql`）默认是**同步阻塞**的，在协程中调用会让协程退化为同步阻塞，失去并发能力。

`Swoole` 通过**替换原生 PHP 函数**实现协程 `I/O`：只需一行代码，就能把同步阻塞的 `I/O` 自动转换为可被协程调度的异步非阻塞 `I/O`，即**一键协程化**。

## 方法

### enableCoroutine

将 `PHP` 原生的同步阻塞 `I/O` 函数自动转换为协程调度的异步非阻塞模式。

```php
Swoole\Runtime::enableCoroutine(int $flags = SWOOLE_HOOK_ALL): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$flags` | 要协程化的函数类型，可用 `\|` 组合，例如 `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | `SWOOLE_HOOK_ALL` |

**返回值**：成功返回 `true`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(); // 默认 SWOOLE_HOOK_ALL
run(function () {
    go(function () {
        sleep(1);
        echo "协程 A 完成\n";
    });
    go(function () {
        sleep(1);
        echo "协程 B 完成\n";
    });
});
// 两个 sleep 并发执行，总耗时约 1 秒而非 2 秒
```

> [!TIP]
> 异步服务器可通过 [hook_flags](/zh/server/setting.html#hook-flags) 一键协程化，功能与 `enableCoroutine` 完全一致。

### setHookFlags

功能与 `enableCoroutine` 一致，用于设置当前运行时的协程化标志位。

```php
Swoole\Runtime::setHookFlags(int $flags): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$flags` | 要协程化的函数类型，可用 `\|` 组合 | 必填 |

**返回值**：成功返回 `true`，失败返回 `false`。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::setHookFlags(SWOOLE_HOOK_SLEEP | SWOOLE_HOOK_FILE);
run(function () {
    go(function () {
        sleep(1);
        echo file_get_contents(__FILE__);
    });
});
```

### getHookFlags

获取当前运行时被协程化的函数类型。

```php
Swoole\Runtime::getHookFlags(): int
```

**返回值**：`int` 标志位，即当前被协程化的函数类型。

> [!WARNING]
> 未协程化成功的标志位会被清除，返回结果可能与开启时传入的参数不一致。

## 支持的协程化选项

下列选项都是 `$flags` 的取值，可通过 `|` 组合，例如 `SWOOLE_HOOK_TCP | SWOOLE_HOOK_SLEEP`。

| 标志位 | 协程化对象 |
|:---|:---|
| `SWOOLE_HOOK_ALL` | 全部（自动排除未编译的 `curl` 变体） |
| `SWOOLE_HOOK_TCP` | `TCP` 流：`Redis`、`pdo_mysql`、`mysqli` 及 `stream` 系列函数 |
| `SWOOLE_HOOK_UDP` | `UDP` 流 |
| `SWOOLE_HOOK_UNIX` | `unix socket` 流 |
| `SWOOLE_HOOK_UDG` | `unix dgram socket` 流 |
| `SWOOLE_HOOK_SSL` | `ssl socket` 流 |
| `SWOOLE_HOOK_TLS` | `tls socket` 流 |
| `SWOOLE_HOOK_STREAM_FUNCTION` | [stream](https://www.php.net/manual/en/ref.stream.php) 系列函数（别名 `SWOOLE_HOOK_STREAM_SELECT`） |
| `SWOOLE_HOOK_FILE` | 磁盘文件函数 `fopen`、`fread`、`file_get_contents` 等 |
| `SWOOLE_HOOK_STDIO` | 标准输入输出（`STDIO`）操作 |
| `SWOOLE_HOOK_SLEEP` | `sleep`、`usleep`、`time_nanosleep`、`time_sleep_until` |
| `SWOOLE_HOOK_PROC` | [proc](https://www.php.net/manual/en/function.proc-open.php) 系列函数 |
| `SWOOLE_HOOK_BLOCKING_FUNCTION` | `gethostbyname`、`exec`、`shell_exec` |
| `SWOOLE_HOOK_CURL` | `curl` 扩展（早期兼容实现，建议用 `SWOOLE_HOOK_NATIVE_CURL`） |
| `SWOOLE_HOOK_NATIVE_CURL` | `curl` 扩展（基于 `libcurl`，需 `--enable-swoole-curl`） |
| `SWOOLE_HOOK_NET_FUNCTION` | `gethostbyname`、`gethostbynamel`、`mail`、`dns_check_record`、`checkdnsrr`、`dns_get_mx`、`getmxrr`、`dns_get_record`、`gethostbyaddr` |
| `SWOOLE_HOOK_MONGODB` | `MongoDB` 客户端（需 `swoole >= 6.2`、`enable_library=On`），详见 [MongoDB](/zh/coroutine/mongodb.html) |
| `SWOOLE_HOOK_SOCKETS` | [sockets 扩展](https://www.php.net/manual/en/book.sockets.php) 系列函数 |
| `SWOOLE_HOOK_PDO_PGSQL` | [pdo_pgsql](https://www.php.net/manual/en/ref.pdo-pgsql.php)（需编译支持） |
| `SWOOLE_HOOK_PDO_ODBC` | [pdo_odbc](https://www.php.net/manual/en/ref.pdo-odbc.php)（需编译支持） |
| `SWOOLE_HOOK_PDO_ORACLE` | [pdo_oci](https://www.php.net/manual/en/ref.pdo-oci.php)（需编译支持） |
| `SWOOLE_HOOK_PDO_SQLITE` | [pdo_sqlite](https://www.php.net/manual/en/ref.pdo-sqlite.php)（需编译支持） |
| `SWOOLE_HOOK_PDO_FIREBIRD` | [pdo_firebird](https://www.php.net/manual/en/ref.pdo-firebird.php)（需编译支持） |

### SWOOLE_HOOK_ALL

协程化全部 `PHP` 原生同步阻塞 `I/O` 函数。

> [!NOTE]
> `SWOOLE_HOOK_ALL` 会自动排除当前未编译的 `curl` 变体：开启 `--enable-swoole-curl` 时包含 `SWOOLE_HOOK_NATIVE_CURL`、排除 `SWOOLE_HOOK_CURL`，反之亦然。两者互斥，不会同时生效。此外 `SWOOLE_HOOK_ALL` 不包含 `SWOOLE_HOOK_MONGODB`，需显式按位或上去。

### SWOOLE_HOOK_TCP

协程化 `TCP Socket` 类型的流（stream），包括 `Redis`、`pdo_mysql`、`mysqli` 等扩展和常用的 `php` [stream](https://www.php.net/streams) 系列函数。

### SWOOLE_HOOK_UNIX

协程化 `unix socket` 类型的流（stream）。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_UNIX);
run(function () {
    $socket = stream_socket_server(
        'unix://swoole.sock',
        $errno,
        $errstr,
        STREAM_SERVER_BIND | STREAM_SERVER_LISTEN
    );
    if (!$socket) {
        echo "$errstr ($errno)" . PHP_EOL;
        exit(1);
    }
    while (stream_socket_accept($socket)) {
        // 等待连接建立
    }
});
```

### SWOOLE_HOOK_UDP

协程化 `udp socket` 类型的流（stream）。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_UDP);

run(function () {
    $socket = stream_socket_server(
        'udp://0.0.0.0:6666',
        $errno,
        $errstr,
        STREAM_SERVER_BIND
    );
    if (!$socket) {
        echo "$errstr ($errno)" . PHP_EOL;
        exit(1);
    }
    while (stream_socket_recvfrom($socket, 1, 0)) {
        // 等待连接建立
    }
});
```

### SWOOLE_HOOK_UDG

协程化 `unix dgram socket` 类型的流（stream）。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_UDG);

run(function () {
    $socket = stream_socket_server(
        'udg://swoole.sock',
        $errno,
        $errstr,
        STREAM_SERVER_BIND
    );
    if (!$socket) {
        echo "$errstr ($errno)" . PHP_EOL;
        exit(1);
    }
    while (stream_socket_recvfrom($socket, 1, 0)) {
        // 等待连接建立
    }
});
```

> [!TIP]
> `unix dgram socket`（Unix 数据报套接字）是 Unix/Linux 系统上的一种进程间通信（IPC）机制。

### SWOOLE_HOOK_SSL

协程化 `ssl socket` 类型的流（stream）。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_SSL);

run(function () {
    $host = 'host.domain.tld';
    $port = 1234;
    $timeout = 10;
    $cert = '/path/to/your/certchain/certchain.pem';
    $context = stream_context_create(
        array(
            'ssl' => array(
                'local_cert' => $cert,
            )
        )
    );
    if ($fp = stream_socket_client(
        'ssl://' . $host . ':' . $port,
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $context
    )) {
        echo "connected\n";
    } else {
        echo "ERROR: $errno - $errstr \n";
    }
});
```

### SWOOLE_HOOK_SLEEP

协程化 `sleep`、`usleep`、`time_nanosleep` 和 `time_sleep_until` 这些睡眠函数。

> [!NOTE]
> 底层定时器最小粒度是 `1ms`，使用 `usleep` 等高精度睡眠函数时若设置低于 `1ms`，将直接使用 `usleep 系统调用`，可能引起非常短暂的睡眠阻塞。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_SLEEP);

run(function () {
    go(function () {
        sleep(1);
        echo '1' . PHP_EOL;
    });
    go(function () {
        echo '2' . PHP_EOL;
    });
});
// 先输出 2，约 1 秒后输出 1
```

### SWOOLE_HOOK_FILE

协程化 `fopen`、`fread`、`file_get_contents` 等操作磁盘文件的 `PHP标准库函数`。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_FILE);
run(function () {
    echo file_get_contents(__FILE__);
});
```

> [!WARNING]
> 协程化文件操作后，所有文件操作都变成异步非阻塞，包括 `autoload` 和 `include`。若这些操作发生在协程调度点上，可能引起不可预期的问题，这时可关闭文件协程化选项。

```php
<?php
// 开启除了文件协程化之外的所有协程选项
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
```

> [!TIP]
> 关闭文件协程化选项后，可使用 [readFile](/zh/coroutine/system_api.html#readfile) 和 [writeFile](/zh/coroutine/system_api.html#writefile) 实现文件异步读写。

Swoole `6.1` 之后引入了 `async.file` 文件协议，读写 `async.file` 前缀的文件可在不指定 `SWOOLE_HOOK_FILE` 的情况下直接协程化文件读写。

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
run(function () {
    # 这是一个异步文件流，所有对此资源的读写操作都是异步非阻塞的
    $fp = fopen("async.file:///tmp/test.txt", "w+");
    fwrite($fp, "Hello World\n");
    fdatasync($fp);
    fclose($fp);
});
```

> [!IMPORTANT]
> `flock` 文件锁操作不能通过 `SWOOLE_HOOK_FILE` 协程化，而是由 `SWOOLE_HOOK_STDIO` 控制其协程化。

### SWOOLE_HOOK_STREAM_FUNCTION

协程化 [stream](https://www.php.net/manual/en/ref.stream.php) 系列函数。

> [!NOTE]
> `SWOOLE_HOOK_STREAM_SELECT` 是 `SWOOLE_HOOK_STREAM_FUNCTION` 的向后兼容别名，两者等价。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_STREAM_FUNCTION);

run(function () {
    $fp1 = stream_socket_client("tcp://www.baidu.com:80", $errno, $errstr, 30);
    $fp2 = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
    if (!$fp1) {
        echo "$errstr ($errno) \n";
    } else {
        fwrite($fp1, "GET / HTTP/1.0\r\nHost: www.baidu.com\r\nUser-Agent: curl/7.58.0\r\nAccept: */*\r\n\r\n");
        $r_array = [$fp1, $fp2];
        $w_array = $e_array = null;
        $n = stream_select($r_array, $w_array, $e_array, 10);
        $html = '';
        while (!feof($fp1)) {
            $html .= fgets($fp1, 1024);
        }
        fclose($fp1);
    }
});
```

### SWOOLE_HOOK_PROC

协程化 [proc](https://www.php.net/manual/en/function.proc-open.php) 系列函数。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_PROC);

run(function () {
    $descriptorspec = array(
        0 => array("pipe", "r"),  // stdin, child process read from it
        1 => array("pipe", "w"),  // stdout, child process write to it
    );
    $process = proc_open('php', $descriptorspec, $pipes);
    if (is_resource($process)) {
        fwrite($pipes[0], 'I am process');
        fclose($pipes[0]);

        while (!feof($pipes[1])) {
            echo fread($pipes[1], 1024);
        }

        fclose($pipes[1]);
        $return_value = proc_close($process);
        echo "command returned $return_value" . PHP_EOL;
    }
});
```

### SWOOLE_HOOK_BLOCKING_FUNCTION

协程化 `gethostbyname`、`exec`、`shell_exec` 这几个阻塞函数。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_BLOCKING_FUNCTION);
run(function () {
    go(function () {
        echo shell_exec('sleep 1 && echo A');
    });
    go(function () {
        echo shell_exec('sleep 1 && echo B');
    });
});
// 两条命令并发执行，总耗时约 1 秒
```

### SWOOLE_HOOK_CURL

协程化 [curl 扩展](https://www.php.net/manual/en/book.curl.php) 系列函数。

> [!TIP]
> `SWOOLE_HOOK_CURL` 不是基于 `libcurl` 实现，有些 `curl` 功能不支持，属于早期兼容产品，请使用 [`SWOOLE_HOOK_NATIVE_CURL`](#swoole-hook-native-curl) 代替它。示例见该节。

### SWOOLE_HOOK_NATIVE_CURL

协程化 [curl 扩展](https://www.php.net/manual/en/book.curl.php) 系列函数。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_NATIVE_CURL);

run(function () {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.xinhuanet.com/");
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($ch);
    curl_close($ch);
    var_dump($result);
});
```

> [!TIP]
> `SWOOLE_HOOK_NATIVE_CURL` 基于 `libcurl` 实现，支持全部 `curl` 功能，优先级比 [`SWOOLE_HOOK_CURL`](#swoole-hook-curl) 高，且两者互斥，不能同时开启。

> [!IMPORTANT]
> `SWOOLE_HOOK_NATIVE_CURL` 需要编译 `swoole` 时开启 `--enable-swoole-curl`，而且 `php` 和 `swoole` 必须使用相同版本的 `libcurl`。

### SWOOLE_HOOK_NET_FUNCTION

协程化 `gethostbyname`、`gethostbynamel`、`mail`、`dns_check_record`、`checkdnsrr`、`dns_get_mx`、`getmxrr`、`dns_get_record` 和 `gethostbyaddr` 网络请求相关的阻塞函数。

### SWOOLE_HOOK_MONGODB

协程化 `MongoDB` 客户端。

> [!IMPORTANT]
> `swoole 6.2` 以上版本可用，并且需要在 `php.ini` 配置文件设置 `swoole.enable_library=On` 才可以使用。`SWOOLE_HOOK_ALL` **不包含** `SWOOLE_HOOK_MONGODB`，必须显式按位或上去。

> [!WARNING]
> 禁止协程之间共享由 `RemoteObject` 创建的对象，该对象不支持并发调用，仅可在一个协程内使用。当 `RemoteObject` 对象销毁时，远端服务器的对象也会同样被销毁。

完整的安装、服务端/客户端示例与 `Swoole\MongoDB\Client`、`RemoteObject` 用法见 [MongoDB 协程化](/zh/coroutine/mongodb.html)。

## 编译期协程化：FTP 与 SSH2

`FTP` 和 `SSH2` 的协程化与上述 `SWOOLE_HOOK_*` 选项不同：**没有运行时开关**，而是在编译 `Swoole` 时直接替换 `PHP` 原生扩展的函数实现。

| 编译选项 | 说明 |
|:---|:---|
| `--enable-swoole-ftp` | 启用 `ftp` 函数的协程化，替换原生 `ext-ftp` |
| `--with-swoole-ssh2` | 启用 `ssh2` 函数的协程化，替换原生 `ext-ssh2`，依赖 `libssh2 >= 1.9.0` |

> [!NOTE]
> Swoole 版本 >= `v6.2.0` 可用。`ssh2_send_signal` 需要 `libssh2 >= 1.11`。详见 [编译选项详解](/zh/start/install.html#编译选项详解)。

> [!WARNING]
> 与原生扩展**互斥**：启用这两项特性时，必须禁用 `PHP` 的 `ext-ftp`、`ext-ssh2` 扩展，否则无法加载 `Swoole`。

**行为**

- 在协程内调用 `ftp_*`、`ssh2_*` 函数时，底层 `I/O` 自动协程化，不会阻塞事件循环。
- 在协程外调用时，自动回退为普通的同步阻塞系统调用，行为与原生扩展一致。
- 函数签名与原生扩展保持一致（`PHP 8.1+` 风格，`FTP` 连接为 `FTP\Connection` 对象）；`ssh2` 额外提供了 `ssh2_disconnect`、`ssh2_set_timeout`、`ssh2_keepalive_config`、`ssh2_keepalive_send` 等原生扩展没有的函数，但**不提供** `ssh2_poll`。

**示例**

```php
<?php
Co\run(function () {
    $ssh = ssh2_connect('127.0.0.1', 22);
    ssh2_auth_password($ssh, 'user', 'password');
    $stream = ssh2_exec($ssh, 'echo "hello"');
    stream_set_blocking($stream, true);
    echo stream_get_contents($stream);
});
```