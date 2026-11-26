# 系統方法

## 命名空間

`Swoole\Coroutine\System`

## 方法

### gethostbyname

將域名解析爲 IP。底層自動進行協程調度。

```php
public static function gethostbyname(string $domain, int $family = AF_INET, float $timeout = -1): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$domain` | 域名 | 必填 |
| `$family` | 域族，`AF_INET` 表示返回 `IPv4` 地址，使用 `AF_INET6` 時返回 `IPv6` 地址 | `AF_INET` |
| `$timeout` | 超時時間，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `-1` |

**返回值**：成功返回域名對應的 `IP` 地址，失敗返回 `false`，可使用 `swoole_last_error` 獲取錯誤信息。

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
> 如果編譯 `swoole` 指定了 `--enable-c-ares`，查詢域名 `IP` 將不會通過線程池實現異步，而是通過 `c-ares` 庫實現異步查詢。性能較好。

### dnsLookup

域名地址查詢。與 [`gethostbyname`](#gethostbyname) 不同，`dnsLookup` 直接基於 `UDP` 客戶端網絡通信實現，而不是使用 `libc` 提供的 `gethostbyname` 函數。

```php
public static function dnsLookup(string $domain, float $timeout = 5, int $type = AF_INET): string|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$domain` | 域名 | 必填 |
| `$timeout` | 超時時間，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `5` |
| `$type` | 域族，`AF_INET` 表示解析 `IPv4` 地址，`AF_INET6` 表示解析 `IPv6` 地址 | `AF_INET` |

**返回值**：解析成功返回對應的 `IP` 地址，失敗返回 `false`，可使用 `swoole_last_error` 獲取錯誤信息。

**常見錯誤**

- `SWOOLE_ERROR_DNSLOOKUP_RESOLVE_FAILED`：此域名無法解析，查詢失敗。
- `SWOOLE_ERROR_DNSLOOKUP_RESOLVE_TIMEOUT`：解析超時，`DNS` 服務器可能存在故障，無法在規定時間內返回結果。

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
> Swoole `4.4.3+` 可用，底層會讀取 `/etc/resolv.conf` 獲取 `DNS` 服務器地址。`$type` 參數自 Swoole `4.7` 起可用，在此之前僅支持 `AF_INET`（`IPv4`）解析。

> [!TIP]
> 全局函數 `swoole_async_dns_lookup_coro()` 是該方法的別名，參數完全一致。

### exec

執行一條 `shell` 命令，底層自動執行協程調度。

```php
public static function exec(string $command, bool $get_error_stream = false): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$command` | 要執行的 `shell` 指令 | 必填 |
| `$get_error_stream` | 是否完整捕獲命令執行的所有輸出 | `false` |

**返回值**：執行失敗返回 `false`，執行成功返回數組，包含了進程退出的狀態碼、信號、輸出內容。

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

將當前協程睡眠。相當於 `PHP` 的 `sleep` 函數，不同的是 `Swoole\Coroutine\System::sleep` 底層會自動協程調度。

```php
public static function sleep(float $seconds): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$seconds` | 睡眠的時間，單位爲秒，最小精度爲毫秒（`0.001` 秒），必須大於 `0`，最大不得超過一天時間（`86400` 秒） | 必填 |

**返回值**：操作成功返回 `true`，操作失敗或者協程被 [cancel](/zh-hant/coroutine/coroutine_api.html#cancel) 取消時返回 `false`。

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

進行 DNS 解析，查詢域名對應的 `IP` 地址。

```php
public static function getaddrinfo(string $domain, int $family = AF_INET, int $socktype = SOCK_STREAM, int $protocol = STREAM_IPPROTO_TCP, ?string $service = null, float $timeout = -1): array|bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$domain` | 域名 | 必填 |
| `$family` | 域族，`AF_INET` 表示返回 `IPv4` 地址，使用 `AF_INET6` 時返回 `IPv6` 地址 | `AF_INET` |
| `$socktype` | 協議類型，可選 `SOCK_DGRAM`、`SOCK_RAW` | `SOCK_STREAM` |
| `$protocol` | 協議，可選 `STREAM_IPPROTO_UDP`、`STREAM_IPPROTO_STCP`、`STREAM_IPPROTO_TIPC`、`0` | `STREAM_IPPROTO_TCP` |
| `$service` | 服務名 | `null` |
| `$timeout` | 超時時間，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `-1` |

**返回值**：成功返回多個 `IP` 地址組成的數組，失敗返回 `false`。

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

獲取文件系統信息。

```php
public static function statvfs(string $path): false|array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 文件路徑 | 必填 |

**返回值**：成功返回一個包含文件信息的數據，否則返回 `false`。

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

協程方式讀取文件。

```php
public static function readFile(string $filename, int $flags = 0): false|string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 文件名 | 必填 |
| `$flags` | 是否使用文件鎖，目前僅支持 `LOCK_EX` 選項 | `0`，表示不使用文件鎖 |

> [!NOTE]
> 底層在讀取文件時會設置爲共享鎖，其他協程仍然可以讀取文件，但無法寫入文件。

**返回值**：讀取成功返回字符串內容，讀取失敗返回 `false`，可使用 `swoole_last_error` 獲取錯誤信息。

> [!WARNING]
> `readFile` 方法沒有尺寸限制，讀取的內容會存放在內存中，因此讀取超大文件時可能會佔用過多內存。

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

協程方式寫入文件。

```php
public static function writeFile(string $filename, string $fileContent, int $flags = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 文件名，必須有可寫權限，文件不存在會自動創建，打開文件失敗會立即返回 `false` | 必填 |
| `$fileContent` | 寫入到文件的內容，最大可寫入 `4M` | 必填 |
| `$flags` | 寫入的選項，默認會清空當前文件內容，可以使用 `FILE_APPEND` 表示追加到文件末尾 | `0` |

> [!NOTE]
> `$flags` 還支持 `LOCK_EX`，寫入時會對文件加獨佔鎖，防止其他協程讀寫此文件。多個選項可使用按位或 `|` 連接，如 `FILE_APPEND | LOCK_EX`。

**返回值**：寫入成功返回寫入的字節數，寫入失敗返回 `false`。

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

等待或返回 `fork` 的子進程狀態，類似於 [pcntl_wait](https://www.php.net/manual/zh/function.pcntl-wait.php)，底層會實現協程調度。

```php
public static function wait(float $timeout = -1): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 超時時間，負數表示永不超時，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `-1` |

**返回值**：操作成功會返回一個數組，包含子進程的 `PID`、退出狀態碼、被哪種信號 `KILL`，失敗返回 `false`。

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
> 每個子進程啓動後，父進程都必須派遣一個協程調用 `wait()` 或 [`waitPid()`](#waitpid) 進行回收，否則子進程會變成殭屍進程，會浪費操作系統的進程資源。

> [!NOTE]
> `Swoole\Process` 進程類的詳細介紹見 [Swoole\Process](/zh-hant/process/process.html)。

### waitPid

和上述 [`wait`](#wait) 方法基本一致，不同的是此方法可以指定等待特定的進程。

```php
public static function waitPid(int $pid = -1, float $timeout = -1): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$pid` | 進程 ID，`-1` 表示任意進程，此時等價於 `wait` 方法；其它值可爲任意自然數 | `-1` |
| `$timeout` | 超時時間，負數表示永不超時，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `-1` |

**返回值**：操作成功會返回一個數組，包含子進程的 `PID`、退出狀態碼、被哪種信號 `KILL`，失敗返回 `false`。

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
> 每個子進程啓動後，父進程都必須派遣一個協程調用 [`wait()`](#wait) 或 `waitPid()` 進行回收，否則子進程會變成殭屍進程，會浪費操作系統的進程資源。

> [!NOTE]
> `Swoole\Process` 進程類的詳細介紹見 [Swoole\Process](/zh-hant/process/process.html)。

### waitSignal

協程版本信號監聽器，底層會讓出當前協程的 `CPU` 模擬阻塞操作。類似於 [pcntl_signal](https://www.php.net/manual/zh/function.pcntl-signal.php) 函數。

```php
public static function waitSignal(int|array $signo, float $timeout = -1): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$signo` | 信號類型，可使用 `SIG` 系列常量，如 `SIGTERM`、`SIGUSR1` 等 | 必填 |
| `$timeout` | 超時時間，負數表示永不超時，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `-1` |

**返回值**：收到信號返回信號編號，超時未收到信號返回 `false`。

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

協程版本的 IO 事件監聽器，會阻塞當前協程直到可讀可寫觸發。類似於 [Swoole\Event::add()](/zh-hant/event.html#add)。

```php
public static function waitEvent(mixed $socket, int $events = SWOOLE_EVENT_READ, float $timeout = -1): int|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符，任何可以轉化爲 fd 的類型，如 Socket 對象、資源等 | 必填 |
| `$events` | 事件類型，可選值見表格下方說明 | `SWOOLE_EVENT_READ`，監聽讀事件 |
| `$timeout` | 超時時間，負數表示永不超時，單位爲秒，最小精度爲毫秒（`0.001` 秒） | `-1` |

> [!NOTE]
> `$events` 可傳入 [`SWOOLE_EVENT_WRITE`](/zh-hant/event.html#常量) 監聽寫事件，或使用 `SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE` 同時監聽讀寫事件。

**返回值**：返回觸發的事件類型的和（可能是多個位），和參數 `$events` 傳入的值有關。失敗返回 `false`，可以使用 `swoole_last_error` 獲取錯誤信息。

**示例**

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
