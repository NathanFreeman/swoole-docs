# 一键协程化

虽然 `Swoole` 提供了协程这一强大特性，能够使业务代码保持同步写法，又能提高并发能力。但由于 `PHP` 底层的 `I/O` 函数（例如 sleep，pdo_mysql）等默认都是**同步阻塞**的，一旦在协程中调用这些函数，整体的异步非阻塞能力就会被降级，导致协程退化为同步阻塞模式。

针对这一问题，**Swoole 开发组**转变了实现思路，**采用替换原生 PHP 函数**的方式来构建**协程 I/O** 能力。只需添加一行代码，就能将原本**同步阻塞的 I/O** 操作自动转换为可被协程调度的**异步 I/O**，实现所谓的**一键协程化**。

## 方法

### enableCoroutine

一键将 `PHP` 原生的同步阻塞 `I/O` 函数自动转换为协程调度的异步非阻塞模式。

```php
Swoole\Runtime::enableCoroutine(int $flags = SWOOLE_HOOK_ALL): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$flags` | 要对哪些类型的函数进行协程化，可以通过 `\|` 组合多种类型，例如 `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | `SWOOLE_HOOK_ALL` |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

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
> 异步服务器可以通过 [hook_flags](/zh/server/setting.html#hook-flags) 来一键将 `PHP` 原生的同步阻塞 `I/O` 函数自动转换为协程调度的异步非阻塞模式。功能和 `enableCoroutine` 完全一致。

### setHookFlags

一键将 `PHP` 原生的同步阻塞 `I/O` 函数自动转换为协程调度的异步非阻塞模式。

```php
Swoole\Runtime::setHookFlags(int $flags): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$flags` | 要对哪些类型的函数进行协程化，可以通过 `\|` 组合多种类型，例如 `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

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

获取当前 PHP 运行时环境中，被协程化的函数类型。

```php
Swoole\Runtime::getHookFlags(): int
```

**返回值**：返回 `int` 类型的标志位，即当前被协程化的函数类型。

> [!WARNING]
> 由于未协程化成功的标志位会被清除，返回结果可能会与开启协程化时传入的参数不一致。

## 支持的协程化选项

下列选项都是 `$flags` 参数的取值，可通过 `|` 组合使用，例如 `SWOOLE_HOOK_TCP | SWOOLE_HOOK_SLEEP`。

### SWOOLE_HOOK_ALL

协程化全部 `PHP` 原生的同步阻塞 `I/O` 函数为异步非阻塞。

### SWOOLE_HOOK_TCP

协程化 `TCP Socket` 类型的流（stream），包括 `Redis`，`pdo_mysql`，`mysqli` 等扩展和常用的 `php` 的 [stream](https://www.php.net/streams) 系列的函数，都可以被协程化。

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
> 由于底层的定时器最小粒度是 `1ms`，因此使用 `usleep` 等高精度睡眠函数时，如果设置为低于 `1ms`，将直接使用 `usleep 系统调用`。可能会引起非常短暂的睡眠阻塞。

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
```

### SWOOLE_HOOK_FILE

协程化 `fopen`，`fread`，`file_get_contents` 等关于操作磁盘文件的 `PHP标准库函数`。

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
> 由于协程化文件操作后，所有文件操作都会变成异步非阻塞的，包括 `autoload` 和 `include` 等操作，如果这些操作发生在协程调度点上，可能会引起不可预期的问题，这时可关闭文件协程化的选项。

```php
<?php
// 开启除了文件协程化之外的所有协程选项
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
```

> [!TIP]
> 关闭文件协程化选项后，可以使用 [readFile](/zh/coroutine/system_api.html#readfile) 和 [writeFile](/zh/coroutine/system_api.html#writefile) 来实现文件异步读写。

在 Swoole 6.1 之后的版本引入了 `async.file` 文件协议，通过读写 `async.file` 前缀的文件，可以在不指定 `SWOOLE_HOOK_FILE` 的情况下，直接协程化文件读写操作。

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

### SWOOLE_HOOK_CURL

协程化 [curl 扩展](https://www.php.net/manual/en/book.curl.php) 系列函数。

**示例**

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
> `SWOOLE_HOOK_CURL` 不是基于 `libcurl` 实现对 `curl` 扩展的协程化，有些 `curl` 功能不支持，属于早期的兼容产品，请使用 [`SWOOLE_HOOK_NATIVE_CURL`](#swoole-hook-native-curl) 代替它。

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
> `SWOOLE_HOOK_NATIVE_CURL` 基于 `libcurl` 实现对 `curl` 扩展的协程化，支持全部的 `curl` 功能，优先级比 [`SWOOLE_HOOK_CURL`](#swoole-hook-curl) 高，而且和 `SWOOLE_HOOK_CURL` 为互斥关系，不能同时开启。

> [!IMPORTANT]
> `SWOOLE_HOOK_NATIVE_CURL` 需要编译 `swoole` 时开启 `--enable-swoole-curl`，而且 `php` 和 `swoole` 必须使用相同版本的 `libcurl`。

### SWOOLE_HOOK_NET_FUNCTION

协程化 `gethostbyname`，`gethostbynamel`，`mail`，`dns_check_record`，`checkdnsrr`，`dns_get_mx`，`getmxrr`，`dns_get_record` 和 `gethostbyaddr` 网络请求相关的阻塞函数。

### SWOOLE_HOOK_MONGODB

协程化 `MongoDB` 客户端。

> [!IMPORTANT]
> `swoole 6.2` 以上版本可用，并且需要在 `php.ini` 配置文件设置 `swoole.enable_library=On` 才可以使用。

安装扩展与依赖包：

```shell
# 先安装mongodb扩展和mongodb/mongodb包
pecl install mongodb
composer require mongodb/mongodb
```

启动 RemoteObject 服务端：

```php
<?php
// 先启动 RemoteObject 服务端
use Swoole\RemoteObject\Server;

require __DIR__ . '/vendor/autoload.php';
$server = new Server(options: [
    'worker_num' => 2,
    'server_mode' => SWOOLE_THREAD, // 默认使用SWOOLE_THREAD模式运行服务，使用 ps aux 查看时只有一个进程，相比SWOOLE_BASE和SWOOLE_PROCESS更加优雅
    'enable_coroutine' => false, // 连接池本身使用同步阻塞的mongodb扩展，是不需要协程环境的，因此需将enable_coroutine设置为false
    'bootstrap' => __FILE__,
    'pid_file' => __DIR__ . '/server.pid'
]);

$server->start();
```

创建 RemoteObject 客户端：

```php
<?php
// 创建RemoteObject客户端
use Swoole\Runtime;
use Swoole\RemoteObject\Client;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Client('127.0.0.1', 9567);  // 连接服务端
    $mongo = $client->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->myDatabase->users;
    
    // 插入单条数据
    $result = $collection->insertOne([
        'name' => '张三',
        'email' => 'zhangsan@example.com',
        'age' => 25,
        'created_at' => $client->create(\MongoDB\BSON\UTCDateTime::class), // 部分数据字段是需要构造MongoDB数据对象，也必须使用$client->create()创建
    ]);
});
```

> [!WARNING]
> 禁止协程之间共享由 `RemoteObject` 创建的对象，该对象不支持并发调用，仅可在一个协程内使用。当 `RemoteObject` 对象销毁时，远端服务器的对象也会同样被销毁。

### 其他选项一览

以下选项同样通过 `$flags` 传入，说明见表格。

| 名称 | 说明 |
|:---|:---|
| `SWOOLE_HOOK_TLS` | 协程化 `tls socket` 类型的流（stream） |
| `SWOOLE_HOOK_SOCKETS` | 协程化 [sockets 扩展](https://www.php.net/manual/en/book.sockets.php) 系列函数 |
| `SWOOLE_HOOK_STDIO` | 将标准输入输出（STDIO）操作协程化 |
| `SWOOLE_HOOK_PDO_PGSQL` | 协程化 [pdo_pgsql 扩展](https://www.php.net/manual/en/ref.pdo-pgsql.php) |
| `SWOOLE_HOOK_PDO_ODBC` | 协程化 [pdo_odbc 扩展](https://www.php.net/manual/en/ref.pdo-odbc.php) |
| `SWOOLE_HOOK_PDO_ORACLE` | 协程化 [pdo_oci 扩展](https://www.php.net/manual/en/ref.pdo-oci.php) |
| `SWOOLE_HOOK_PDO_SQLITE` | 协程化 [pdo_sqlite 扩展](https://www.php.net/manual/en/ref.pdo-sqlite.php) |
| `SWOOLE_HOOK_PDO_FIREBIRD` | 协程化 [pdo_firebird 扩展](https://www.php.net/manual/en/ref.pdo-firebird.php) |
