# Coroutine Hooks

The underlying `PHP` `I/O` functions (such as `sleep` and `pdo_mysql`) are **synchronous blocking** by default. Calling them inside a coroutine degrades it to synchronous blocking and loses concurrency.

`Swoole` implements coroutine `I/O` by **replacing native PHP functions**: with just one line of code, synchronous blocking `I/O` is automatically converted into asynchronous non-blocking `I/O` that coroutines can schedule — the so-called **one-click coroutineization**.

## Methods

### enableCoroutine

Automatically converts `PHP`'s native synchronous blocking `I/O` functions into asynchronous non-blocking mode scheduled by coroutines.

```php
Swoole\Runtime::enableCoroutine(int $flags = SWOOLE_HOOK_ALL): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$flags` | Which types of functions to hook; combine with `\|`, e.g. `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | `SWOOLE_HOOK_ALL` |

**Return value**: `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(); // defaults to SWOOLE_HOOK_ALL
run(function () {
    go(function () {
        sleep(1);
        echo "coroutine A done\n";
    });
    go(function () {
        sleep(1);
        echo "coroutine B done\n";
    });
});
// The two sleeps run concurrently; total time is about 1 second instead of 2
```

> [!TIP]
> Async servers can use [hook_flags](/en/server/setting.html#hook-flags) for one-click coroutineization; the functionality is exactly the same as `enableCoroutine`.

### setHookFlags

Equivalent to `enableCoroutine`; sets the hook flags of the current runtime.

```php
Swoole\Runtime::setHookFlags(int $flags): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$flags` | Which types of functions to hook; combine with `\|` | Required |

**Return value**: `true` on success, `false` on failure.

**Example**

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

Gets the function types currently hooked in the runtime.

```php
Swoole\Runtime::getHookFlags(): int
```

**Return value**: an `int` bitmask of the function types currently hooked.

> [!WARNING]
> Flags that fail to be hooked are cleared, so the result may differ from the argument passed when enabling hooks.

## Supported Hook Options

The following options are all values of `$flags` and can be combined with `|`, e.g. `SWOOLE_HOOK_TCP | SWOOLE_HOOK_SLEEP`.

| Flag | What it hooks |
|:---|:---|
| `SWOOLE_HOOK_ALL` | Everything (automatically excludes the uncompiled `curl` variant) |
| `SWOOLE_HOOK_TCP` | `TCP` streams: `Redis`, `pdo_mysql`, `mysqli`, and the `stream` family |
| `SWOOLE_HOOK_UDP` | `UDP` streams |
| `SWOOLE_HOOK_UNIX` | `unix socket` streams |
| `SWOOLE_HOOK_UDG` | `unix dgram socket` streams |
| `SWOOLE_HOOK_SSL` | `ssl socket` streams |
| `SWOOLE_HOOK_TLS` | `tls socket` streams |
| `SWOOLE_HOOK_STREAM_FUNCTION` | The [stream](https://www.php.net/manual/en/ref.stream.php) family (alias `SWOOLE_HOOK_STREAM_SELECT`) |
| `SWOOLE_HOOK_FILE` | Disk file functions `fopen`, `fread`, `file_get_contents`, etc. |
| `SWOOLE_HOOK_STDIO` | Standard input/output (`STDIO`) operations |
| `SWOOLE_HOOK_SLEEP` | `sleep`, `usleep`, `time_nanosleep`, `time_sleep_until` |
| `SWOOLE_HOOK_PROC` | The [proc](https://www.php.net/manual/en/function.proc-open.php) family |
| `SWOOLE_HOOK_BLOCKING_FUNCTION` | `gethostbyname`, `exec`, `shell_exec` |
| `SWOOLE_HOOK_CURL` | The `curl` extension (early compatibility implementation; prefer `SWOOLE_HOOK_NATIVE_CURL`) |
| `SWOOLE_HOOK_NATIVE_CURL` | The `curl` extension (based on `libcurl`, requires `--enable-swoole-curl`) |
| `SWOOLE_HOOK_NET_FUNCTION` | `gethostbyname`, `gethostbynamel`, `mail`, `dns_check_record`, `checkdnsrr`, `dns_get_mx`, `getmxrr`, `dns_get_record`, `gethostbyaddr` |
| `SWOOLE_HOOK_MONGODB` | The `MongoDB` client (requires `swoole >= 6.2`, `enable_library=On`); see [MongoDB](/en/coroutine/mongodb.html) |
| `SWOOLE_HOOK_SOCKETS` | The [sockets extension](https://www.php.net/manual/en/book.sockets.php) family |
| `SWOOLE_HOOK_PDO_PGSQL` | [pdo_pgsql](https://www.php.net/manual/en/ref.pdo-pgsql.php) (requires compile support) |
| `SWOOLE_HOOK_PDO_ODBC` | [pdo_odbc](https://www.php.net/manual/en/ref.pdo-odbc.php) (requires compile support) |
| `SWOOLE_HOOK_PDO_ORACLE` | [pdo_oci](https://www.php.net/manual/en/ref.pdo-oci.php) (requires compile support) |
| `SWOOLE_HOOK_PDO_SQLITE` | [pdo_sqlite](https://www.php.net/manual/en/ref.pdo-sqlite.php) (requires compile support) |
| `SWOOLE_HOOK_PDO_FIREBIRD` | [pdo_firebird](https://www.php.net/manual/en/ref.pdo-firebird.php) (requires compile support) |

### SWOOLE_HOOK_ALL

Hooks all of `PHP`'s native synchronous blocking `I/O` functions.

> [!NOTE]
> `SWOOLE_HOOK_ALL` automatically excludes the `curl` variant that is not compiled: with `--enable-swoole-curl` it includes `SWOOLE_HOOK_NATIVE_CURL` and excludes `SWOOLE_HOOK_CURL`, and vice versa. The two are mutually exclusive and never both active. `SWOOLE_HOOK_ALL` also does not include `SWOOLE_HOOK_MONGODB`; it must be OR-ed in explicitly.

### SWOOLE_HOOK_TCP

Hooks `TCP Socket` streams, including extensions such as `Redis`, `pdo_mysql`, and `mysqli`, as well as the commonly used `php` [stream](https://www.php.net/streams) family of functions.

### SWOOLE_HOOK_UNIX

Hooks `unix socket` streams.

**Example**

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
        // Wait for connections to be established
    }
});
```

### SWOOLE_HOOK_UDP

Hooks `udp socket` streams.

**Example**

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
        // Wait for connections to be established
    }
});
```

### SWOOLE_HOOK_UDG

Hooks `unix dgram socket` streams.

**Example**

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
        // Wait for connections to be established
    }
});
```

> [!TIP]
> A `unix dgram socket` (Unix datagram socket) is an inter-process communication (IPC) mechanism on Unix/Linux systems.

### SWOOLE_HOOK_SSL

Hooks `ssl socket` streams.

**Example**

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

Hooks the sleep functions `sleep`, `usleep`, `time_nanosleep`, and `time_sleep_until`.

> [!NOTE]
> The underlying timer has a minimum granularity of `1ms`. When using high-precision sleep functions such as `usleep` with a duration below `1ms`, the `usleep system call` is used directly, which may cause a very brief sleep-induced block.

**Example**

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
// Prints 2 first, then 1 about one second later
```

### SWOOLE_HOOK_FILE

Hooks `PHP standard library functions` that operate on disk files, such as `fopen`, `fread`, and `file_get_contents`.

**Example**

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
> After hooking file operations, all file operations become asynchronous and non-blocking, including `autoload` and `include`. If these occur at a coroutine scheduling point, they may cause unexpected problems; in that case you can disable the file hook option.

```php
<?php
// Enable all hook options except the file hook
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
```

> [!TIP]
> After disabling the file hook option, you can use [readFile](/en/coroutine/system_api.html#readfile) and [writeFile](/en/coroutine/system_api.html#writefile) for asynchronous file reads and writes.

Versions after Swoole `6.1` introduce the `async.file` file protocol. Reading and writing files with the `async.file` prefix hooks file I/O directly without specifying `SWOOLE_HOOK_FILE`.

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
run(function () {
    # This is an async file stream; all reads and writes on this resource are asynchronous and non-blocking
    $fp = fopen("async.file:///tmp/test.txt", "w+");
    fwrite($fp, "Hello World\n");
    fdatasync($fp);
    fclose($fp);
});
```

> [!IMPORTANT]
> The `flock` file-locking operation cannot be hooked via `SWOOLE_HOOK_FILE`; its hooking is controlled by `SWOOLE_HOOK_STDIO`.

### SWOOLE_HOOK_STREAM_FUNCTION

Hooks the [stream](https://www.php.net/manual/en/ref.stream.php) family of functions.

> [!NOTE]
> `SWOOLE_HOOK_STREAM_SELECT` is a backward-compatibility alias of `SWOOLE_HOOK_STREAM_FUNCTION`; the two are equivalent.

**Example**

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

Hooks the [proc](https://www.php.net/manual/en/function.proc-open.php) family of functions.

**Example**

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

Hooks the blocking functions `gethostbyname`, `exec`, and `shell_exec`.

**Example**

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
// The two commands run concurrently; total time is about 1 second
```

### SWOOLE_HOOK_CURL

Hooks the [curl extension](https://www.php.net/manual/en/book.curl.php) family of functions.

> [!TIP]
> `SWOOLE_HOOK_CURL` is not based on `libcurl`; some `curl` features are unsupported. It is an early compatibility product — use [`SWOOLE_HOOK_NATIVE_CURL`](#swoole-hook-native-curl) instead. See that section for the example.

### SWOOLE_HOOK_NATIVE_CURL

Hooks the [curl extension](https://www.php.net/manual/en/book.curl.php) family of functions.

**Example**

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
> `SWOOLE_HOOK_NATIVE_CURL` is based on `libcurl` and supports all `curl` features. It has higher priority than [`SWOOLE_HOOK_CURL`](#swoole-hook-curl) and is mutually exclusive with it — they cannot be enabled at the same time.

> [!IMPORTANT]
> `SWOOLE_HOOK_NATIVE_CURL` requires `--enable-swoole-curl` when compiling `swoole`, and `php` and `swoole` must use the same version of `libcurl`.

### SWOOLE_HOOK_NET_FUNCTION

Hooks the network-related blocking functions `gethostbyname`, `gethostbynamel`, `mail`, `dns_check_record`, `checkdnsrr`, `dns_get_mx`, `getmxrr`, `dns_get_record`, and `gethostbyaddr`.

### SWOOLE_HOOK_MONGODB

Hooks the `MongoDB` client.

> [!IMPORTANT]
> Available in `swoole 6.2` and later, and requires setting `swoole.enable_library=On` in the `php.ini` configuration file. `SWOOLE_HOOK_ALL` **does not include** `SWOOLE_HOOK_MONGODB`; it must be OR-ed in explicitly.

> [!WARNING]
> Objects created by `RemoteObject` must not be shared between coroutines. Such objects do not support concurrent calls and can only be used within a single coroutine. When a `RemoteObject` object is destroyed, the object on the remote server is destroyed as well.

For the full installation, server/client examples, and the usage of `Swoole\MongoDB\Client` and `RemoteObject`, see [MongoDB Coroutinization](/en/coroutine/mongodb.html).

## Compile-Time Coroutinization: FTP and SSH2

`FTP` and `SSH2` coroutinization differs from the `SWOOLE_HOOK_*` options above: there is **no runtime switch**. Instead, the native `PHP` extension functions are replaced at `Swoole` compile time.

| Compile option | Description |
|:---|:---|
| `--enable-swoole-ftp` | Enables coroutinization of the `ftp` functions, replacing the native `ext-ftp` |
| `--with-swoole-ssh2` | Enables coroutinization of the `ssh2` functions, replacing the native `ext-ssh2`; requires `libssh2 >= 1.9.0` |

> [!NOTE]
> Available since Swoole `v6.2.0`. `ssh2_send_signal` requires `libssh2 >= 1.11`. See [Build Options](/en/start/install.html#build-options) for details.

> [!WARNING]
> **Mutually exclusive** with the native extensions: when these features are enabled, `PHP`'s `ext-ftp` and `ext-ssh2` extensions must be disabled, otherwise `Swoole` cannot be loaded.

**Behavior**

- When `ftp_*` / `ssh2_*` functions are called inside a coroutine, the underlying `I/O` is automatically coroutinized and does not block the event loop.
- When called outside a coroutine, they automatically fall back to ordinary synchronous blocking system calls, behaving like the native extensions.
- Function signatures match the native extensions (`PHP 8.1+` style; `FTP` connections are `FTP\Connection` objects). `ssh2` additionally provides functions not present in the native extension, such as `ssh2_disconnect`, `ssh2_set_timeout`, `ssh2_keepalive_config`, and `ssh2_keepalive_send`, but does **not** provide `ssh2_poll`.

**Example**

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