# 一鍵協程化

雖然 `Swoole` 提供了協程這一強大特性，能夠使業務代碼保持同步寫法，又能提高併發能力。但由於 `PHP` 底層的 `I/O` 函數（例如 sleep，pdo_mysql）等默認都是**同步阻塞**的，一旦在協程中調用這些函數，整體的異步非阻塞能力就會被降級，導致協程退化爲同步阻塞模式。

針對這一問題，**Swoole 開發組**轉變了實現思路，**採用替換原生 PHP 函數**的方式來構建**協程 I/O** 能力。只需添加一行代碼，就能將原本**同步阻塞的 I/O** 操作自動轉換爲可被協程調度的**異步 I/O**，實現所謂的**一鍵協程化**。

## 方法

### enableCoroutine

一鍵將 `PHP` 原生的同步阻塞 `I/O` 函數自動轉換爲協程調度的異步非阻塞模式。

```php
Swoole\Runtime::enableCoroutine(int $flags = SWOOLE_HOOK_ALL): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$flags` | 要對哪些類型的函數進行協程化，可以通過 `\|` 組合多種類型，例如 `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | `SWOOLE_HOOK_ALL` |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

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
> 異步服務器可以通過 [hook_flags](/zh-hant/server/setting.html#hook-flags) 來一鍵將 `PHP` 原生的同步阻塞 `I/O` 函數自動轉換爲協程調度的異步非阻塞模式。功能和 `enableCoroutine` 完全一致。

### setHookFlags

一鍵將 `PHP` 原生的同步阻塞 `I/O` 函數自動轉換爲協程調度的異步非阻塞模式。

```php
Swoole\Runtime::setHookFlags(int $flags): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$flags` | 要對哪些類型的函數進行協程化，可以通過 `\|` 組合多種類型，例如 `SWOOLE_HOOK_TCP \| SWOOLE_HOOK_SLEEP` | 必填 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

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

獲取當前 PHP 運行時環境中，被協程化的函數類型。

```php
Swoole\Runtime::getHookFlags(): int
```

**返回值**：返回 `int` 類型的標誌位，即當前被協程化的函數類型。

> [!WARNING]
> 由於未協程化成功的標誌位會被清除，返回結果可能會與開啓協程化時傳入的參數不一致。

## 支持的協程化選項

下列選項都是 `$flags` 參數的取值，可通過 `|` 組合使用，例如 `SWOOLE_HOOK_TCP | SWOOLE_HOOK_SLEEP`。

### SWOOLE_HOOK_ALL

協程化全部 `PHP` 原生的同步阻塞 `I/O` 函數爲異步非阻塞。

### SWOOLE_HOOK_TCP

協程化 `TCP Socket` 類型的流（stream），包括 `Redis`，`pdo_mysql`，`mysqli` 等擴展和常用的 `php` 的 [stream](https://www.php.net/streams) 系列的函數，都可以被協程化。

### SWOOLE_HOOK_UNIX

協程化 `unix socket` 類型的流（stream）。

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
        // 等待連接建立
    }
});
```

### SWOOLE_HOOK_UDP

協程化 `udp socket` 類型的流（stream）。

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
        // 等待連接建立
    }
});
```

### SWOOLE_HOOK_UDG

協程化 `unix dgram socket` 類型的流（stream）。

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
        // 等待連接建立
    }
});
```

> [!TIP]
> `unix dgram socket`（Unix 數據報套接字）是 Unix/Linux 系統上的一種進程間通信（IPC）機制。

### SWOOLE_HOOK_SSL

協程化 `ssl socket` 類型的流（stream）。

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

協程化 `sleep`、`usleep`、`time_nanosleep` 和 `time_sleep_until` 這些睡眠函數。

> [!NOTE]
> 由於底層的定時器最小粒度是 `1ms`，因此使用 `usleep` 等高精度睡眠函數時，如果設置爲低於 `1ms`，將直接使用 `usleep 系統調用`。可能會引起非常短暫的睡眠阻塞。

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

協程化 `fopen`，`fread`，`file_get_contents` 等關於操作磁盤文件的 `PHP標準庫函數`。

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
> 由於協程化文件操作後，所有文件操作都會變成異步非阻塞的，包括 `autoload` 和 `include` 等操作，如果這些操作發生在協程調度點上，可能會引起不可預期的問題，這時可關閉文件協程化的選項。

```php
<?php
// 開啓除了文件協程化之外的所有協程選項
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
```

> [!TIP]
> 關閉文件協程化選項後，可以使用 [readFile](/zh-hant/coroutine/system_api.html#readfile) 和 [writeFile](/zh-hant/coroutine/system_api.html#writefile) 來實現文件異步讀寫。

在 Swoole 6.1 之後的版本引入了 `async.file` 文件協議，通過讀寫 `async.file` 前綴的文件，可以在不指定 `SWOOLE_HOOK_FILE` 的情況下，直接協程化文件讀寫操作。

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);
run(function () {
    # 這是一個異步文件流，所有對此資源的讀寫操作都是異步非阻塞的
    $fp = fopen("async.file:///tmp/test.txt", "w+");
    fwrite($fp, "Hello World\n");
    fdatasync($fp);
    fclose($fp);
});
```

> [!IMPORTANT]
> `flock` 文件鎖操作不能通過 `SWOOLE_HOOK_FILE` 協程化，而是由 `SWOOLE_HOOK_STDIO` 控制其協程化。

### SWOOLE_HOOK_STREAM_FUNCTION

協程化 [stream](https://www.php.net/manual/en/ref.stream.php) 系列函數。

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

協程化 [proc](https://www.php.net/manual/en/function.proc-open.php) 系列函數。

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

協程化 [curl 擴展](https://www.php.net/manual/en/book.curl.php) 系列函數。

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
> `SWOOLE_HOOK_CURL` 不是基於 `libcurl` 實現對 `curl` 擴展的協程化，有些 `curl` 功能不支持，屬於早期的兼容產品，請使用 [`SWOOLE_HOOK_NATIVE_CURL`](#swoole-hook-native-curl) 代替它。

### SWOOLE_HOOK_NATIVE_CURL

協程化 [curl 擴展](https://www.php.net/manual/en/book.curl.php) 系列函數。

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
> `SWOOLE_HOOK_NATIVE_CURL` 基於 `libcurl` 實現對 `curl` 擴展的協程化，支持全部的 `curl` 功能，優先級比 [`SWOOLE_HOOK_CURL`](#swoole-hook-curl) 高，而且和 `SWOOLE_HOOK_CURL` 爲互斥關係，不能同時開啓。

> [!IMPORTANT]
> `SWOOLE_HOOK_NATIVE_CURL` 需要編譯 `swoole` 時開啓 `--enable-swoole-curl`，而且 `php` 和 `swoole` 必須使用相同版本的 `libcurl`。

### SWOOLE_HOOK_NET_FUNCTION

協程化 `gethostbyname`，`gethostbynamel`，`mail`，`dns_check_record`，`checkdnsrr`，`dns_get_mx`，`getmxrr`，`dns_get_record` 和 `gethostbyaddr` 網絡請求相關的阻塞函數。

### SWOOLE_HOOK_MONGODB

協程化 `MongoDB` 客戶端。

> [!IMPORTANT]
> `swoole 6.2` 以上版本可用，並且需要在 `php.ini` 配置文件設置 `swoole.enable_library=On` 纔可以使用。

安裝擴展與依賴包：

```shell
# 先安裝mongodb擴展和mongodb/mongodb包
pecl install mongodb
composer require mongodb/mongodb
```

啓動 RemoteObject 服務端：

```php
<?php
// 先啓動 RemoteObject 服務端
use Swoole\RemoteObject\Server;

require __DIR__ . '/vendor/autoload.php';
$server = new Server(options: [
    'worker_num' => 2,
    'server_mode' => SWOOLE_THREAD, // 默認使用SWOOLE_THREAD模式運行服務，使用 ps aux 查看時只有一個進程，相比SWOOLE_BASE和SWOOLE_PROCESS更加優雅
    'enable_coroutine' => false, // 連接池本身使用同步阻塞的mongodb擴展，是不需要協程環境的，因此需將enable_coroutine設置爲false
    'bootstrap' => __FILE__,
    'pid_file' => __DIR__ . '/server.pid'
]);

$server->start();
```

創建 RemoteObject 客戶端：

```php
<?php
// 創建RemoteObject客戶端
use Swoole\Runtime;
use Swoole\RemoteObject\Client;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Client('127.0.0.1', 9567);  // 連接服務端
    $mongo = $client->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->myDatabase->users;
    
    // 插入單條數據
    $result = $collection->insertOne([
        'name' => '張三',
        'email' => 'zhangsan@example.com',
        'age' => 25,
        'created_at' => $client->create(\MongoDB\BSON\UTCDateTime::class), // 部分數據字段是需要構造MongoDB數據對象，也必須使用$client->create()創建
    ]);
});
```

> [!WARNING]
> 禁止協程之間共享由 `RemoteObject` 創建的對象，該對象不支持併發調用，僅可在一個協程內使用。當 `RemoteObject` 對象銷燬時，遠端服務器的對象也會同樣被銷燬。

### 其他選項一覽

以下選項同樣通過 `$flags` 傳入，說明見表格。

| 名稱 | 說明 |
|:---|:---|
| `SWOOLE_HOOK_TLS` | 協程化 `tls socket` 類型的流（stream） |
| `SWOOLE_HOOK_SOCKETS` | 協程化 [sockets 擴展](https://www.php.net/manual/en/book.sockets.php) 系列函數 |
| `SWOOLE_HOOK_STDIO` | 將標準輸入輸出（STDIO）操作協程化 |
| `SWOOLE_HOOK_PDO_PGSQL` | 協程化 [pdo_pgsql 擴展](https://www.php.net/manual/en/ref.pdo-pgsql.php) |
| `SWOOLE_HOOK_PDO_ODBC` | 協程化 [pdo_odbc 擴展](https://www.php.net/manual/en/ref.pdo-odbc.php) |
| `SWOOLE_HOOK_PDO_ORACLE` | 協程化 [pdo_oci 擴展](https://www.php.net/manual/en/ref.pdo-oci.php) |
| `SWOOLE_HOOK_PDO_SQLITE` | 協程化 [pdo_sqlite 擴展](https://www.php.net/manual/en/ref.pdo-sqlite.php) |
| `SWOOLE_HOOK_PDO_FIREBIRD` | 協程化 [pdo_firebird 擴展](https://www.php.net/manual/en/ref.pdo-firebird.php) |

## 編譯期協程化：FTP 與 SSH2

`FTP` 和 `SSH2` 的協程化與上述 `SWOOLE_HOOK_*` 選項不同：**沒有運行時開關**，而是在編譯 `Swoole` 時直接替換 `PHP` 原生擴展的函數實現。

| 編譯選項 | 說明 |
|:---|:---|
| `--enable-swoole-ftp` | 啓用 `ftp` 函數的協程化，替換原生 `ext-ftp` |
| `--with-swoole-ssh2` | 啓用 `ssh2` 函數的協程化，替換原生 `ext-ssh2`，依賴 `libssh2 >= 1.9.0` |

> [!NOTE]
> Swoole 版本 >= `v6.2.0` 可用。`ssh2_send_signal` 需要 `libssh2 >= 1.11`。詳見 [編譯選項詳解](/zh-hant/start/install.html#編譯選項詳解)。

> [!WARNING]
> 與原生擴展**互斥**：啓用這兩項特性時，必須禁用 `PHP` 的 `ext-ftp`、`ext-ssh2` 擴展，否則無法加載 `Swoole`。

**行爲**

- 在協程內調用 `ftp_*`、`ssh2_*` 函數時，底層 `I/O` 自動協程化，不會阻塞事件循環。
- 在協程外調用時，自動回退爲普通的同步阻塞系統調用，行爲與原生擴展一致。
- 函數簽名與原生擴展保持一致（`PHP 8.1+` 風格，`FTP` 連接爲 `FTP\Connection` 對象）；`ssh2` 額外提供了 `ssh2_disconnect`、`ssh2_set_timeout`、`ssh2_keepalive_config`、`ssh2_keepalive_send` 等原生擴展沒有的函數，但**不提供** `ssh2_poll`。

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
