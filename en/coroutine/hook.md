# Coroutine Hooks

Although `Swoole` provides coroutines as a powerful feature that lets business code keep a synchronous style while improving concurrency, the underlying `PHP` `I/O` functions (such as sleep, pdo_mysql) are **synchronous blocking** by default. Once these functions are called inside a coroutine, the overall asynchronous non-blocking capability is degraded, and the coroutine falls back to synchronous blocking mode.

To solve this problem, the **Swoole development team** changed its implementation approach and built **coroutine I/O** capabilities by **replacing native PHP functions**. With just one line of code, originally **synchronous blocking I/O** operations are automatically converted into **asynchronous I/O** that can be scheduled by coroutines — the so-called **coroutine hooks** (one-click coroutineization).

## Methods

### enableCoroutine

Automatically converts `PHP`'s native synchronous blocking `I/O` functions into asynchronous non-blocking mode scheduled by coroutines, in one step.

```php
Swoole\Runtime::enableCoroutine(int $flags = SWOOLE_HOOK_ALL): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$flags` | Which types of functions to hook; multiple types can be combined with `\|`, for example `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | `SWOOLE_HOOK_ALL` |

**Return value**: Returns `true` on success and `false` on failure.

**Example**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine();
run(function() {
    $output = shell_exec('ls -al');
    echo $output;
});
```

> [!TIP]
> Async servers can use [hook_flags](/en/server/setting.html#hook-flags) to automatically convert `PHP`'s native synchronous blocking `I/O` functions into asynchronous non-blocking mode scheduled by coroutines in one step. The functionality is exactly the same as `enableCoroutine`.

### setHookFlags

Automatically converts `PHP`'s native synchronous blocking `I/O` functions into asynchronous non-blocking mode scheduled by coroutines, in one step.

```php
Swoole\Runtime::setHookFlags(int $flags): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$flags` | Which types of functions to hook; multiple types can be combined with `\|`, for example `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | Required |

**Return value**: Returns `true` on success and `false` on failure.

**Example**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::setHookFlags(SWOOLE_HOOK_ALL);
run(function() {
    $output = shell_exec('ls -al');
    echo $output;
});
```

### getHookFlags

Gets the function types that are currently hooked in the PHP runtime environment.

```php
Swoole\Runtime::getHookFlags(): int
```

**Return value**: Returns an `int` bitmask representing the function types that are currently hooked.

> [!WARNING]
> Since flags that fail to be hooked are cleared, the returned result may differ from the argument passed in when enabling hooks.

## Supported Hook Options

The following options are all values of the `$flags` parameter and can be combined with `|`, for example `SWOOLE_HOOK_TCP | SWOOLE_HOOK_SLEEP`.

### SWOOLE_HOOK_ALL

Hooks all of `PHP`'s native synchronous blocking `I/O` functions into asynchronous non-blocking mode.

### SWOOLE_HOOK_TCP

Hooks `TCP Socket` streams, including extensions such as `Redis`, `pdo_mysql`, and `mysqli`, as well as the commonly used `php` [stream](https://www.php.net/streams) family of functions — all can be hooked.

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
> Because the underlying timer has a minimum granularity of `1ms`, when using high-precision sleep functions such as `usleep` with a duration below `1ms`, the `usleep system call` is used directly. This may cause a very brief sleep-induced block.

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
> After hooking file operations, all file operations become asynchronous and non-blocking, including `autoload` and `include`. If these operations occur at a coroutine scheduling point, they may cause unexpected problems; in that case you can disable the file hook option.

```php
<?php
// Enable all hook options except the file hook
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
```

> [!TIP]
> After disabling the file hook option, you can use [readFile](/en/coroutine/system_api.html#readfile) and [writeFile](/en/coroutine/system_api.html#writefile) for asynchronous file reads and writes.

Versions after Swoole 6.1 introduce the `async.file` file protocol. By reading and writing files with the `async.file` prefix, file read/write operations can be hooked directly without specifying `SWOOLE_HOOK_FILE`.

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

### SWOOLE_HOOK_CURL

Hooks the [curl extension](https://www.php.net/manual/en/book.curl.php) family of functions.

**Example**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_CURL);

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
> `SWOOLE_HOOK_CURL` does not hook the `curl` extension based on `libcurl`. Some `curl` features are unsupported; it is an early compatibility product. Use [`SWOOLE_HOOK_NATIVE_CURL`](#swoole-hook-native-curl) instead.

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
> `SWOOLE_HOOK_NATIVE_CURL` hooks the `curl` extension based on `libcurl` and supports all `curl` features. It has higher priority than [`SWOOLE_HOOK_CURL`](#swoole-hook-curl) and is mutually exclusive with `SWOOLE_HOOK_CURL` — they cannot be enabled at the same time.

> [!IMPORTANT]
> `SWOOLE_HOOK_NATIVE_CURL` requires `--enable-swoole-curl` when compiling `swoole`, and `php` and `swoole` must use the same version of `libcurl`.

### SWOOLE_HOOK_NET_FUNCTION

Hooks the network-related blocking functions `gethostbyname`, `gethostbynamel`, `mail`, `dns_check_record`, `checkdnsrr`, `dns_get_mx`, `getmxrr`, `dns_get_record`, and `gethostbyaddr`.

### SWOOLE_HOOK_MONGODB

Hooks the `MongoDB` client.

> [!IMPORTANT]
> Available in `swoole 6.2` and later, and requires setting `swoole.enable_library=On` in the `php.ini` configuration file.

Install the extension and dependency package:

```shell
# First install the mongodb extension and the mongodb/mongodb package
pecl install mongodb
composer require mongodb/mongodb
```

Start the RemoteObject server:

```php
<?php
// Start the RemoteObject server first
use Swoole\RemoteObject\Server;

require __DIR__ . '/vendor/autoload.php';
$server = new Server(options: [
    'worker_num' => 2,
    'server_mode' => SWOOLE_THREAD, // Runs the service in SWOOLE_THREAD mode by default; ps aux shows only one process, which is more elegant than SWOOLE_BASE and SWOOLE_PROCESS
    'enable_coroutine' => false, // The connection pool itself uses the synchronous blocking mongodb extension and does not need a coroutine environment, so enable_coroutine must be set to false
    'bootstrap' => __FILE__,
    'pid_file' => __DIR__ . '/server.pid'
]);

$server->start();
```

Create the RemoteObject client:

```php
<?php
// Create the RemoteObject client
use Swoole\Runtime;
use Swoole\RemoteObject\Client;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Client('127.0.0.1', 9567);  // Connect to the server
    $mongo = $client->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->myDatabase->users;
    
    // Insert a single document
    $result = $collection->insertOne([
        'name' => 'Zhang San',
        'email' => 'zhangsan@example.com',
        'age' => 25,
        'created_at' => $client->create(\MongoDB\BSON\UTCDateTime::class), // Some data fields require constructing MongoDB data objects, which must also be created with $client->create()
    ]);
});
```

> [!WARNING]
> Objects created by `RemoteObject` must not be shared between coroutines. Such objects do not support concurrent calls and can only be used within a single coroutine. When a `RemoteObject` object is destroyed, the object on the remote server is destroyed as well.

### Other Options Overview

The following options are also passed via `$flags`; see the table for descriptions.

| Name | Description |
|:---|:---|
| `SWOOLE_HOOK_TLS` | Hooks `tls socket` streams |
| `SWOOLE_HOOK_SOCKETS` | Hooks the [sockets extension](https://www.php.net/manual/en/book.sockets.php) family of functions |
| `SWOOLE_HOOK_STDIO` | Hooks standard input/output (STDIO) operations |
| `SWOOLE_HOOK_PDO_PGSQL` | Hooks the [pdo_pgsql extension](https://www.php.net/manual/en/ref.pdo-pgsql.php) |
| `SWOOLE_HOOK_PDO_ODBC` | Hooks the [pdo_odbc extension](https://www.php.net/manual/en/ref.pdo-odbc.php) |
| `SWOOLE_HOOK_PDO_ORACLE` | Hooks the [pdo_oci extension](https://www.php.net/manual/en/ref.pdo-oci.php) |
| `SWOOLE_HOOK_PDO_SQLITE` | Hooks the [pdo_sqlite extension](https://www.php.net/manual/en/ref.pdo-sqlite.php) |
| `SWOOLE_HOOK_PDO_FIREBIRD` | Hooks the [pdo_firebird extension](https://www.php.net/manual/en/ref.pdo-firebird.php) |