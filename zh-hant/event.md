# 事件輪詢

- `Swoole` 提供了直接操作底層 `epoll/kqueue/poll/select` 事件循環的接口。可將其他擴展創建的 `socket`，`PHP` 代碼中 `stream/socket` 擴展創建的 `socket` 等加入到 `Swoole` 的事件輪詢中。

## 方法

### add

將一個 `socket` 加入到底層的事件輪詢中。

```php
public static function add(mixed $socket, ?callable $readCallback = null, ?callable $writeCallback = null, int $events = SWOOLE_EVENT_READ): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 資源、`sockets` 資源、`object` 對象 | 必填 |
| `$readCallback` | 可讀事件回調函數，當此 `$socket` 可讀時觸發該函數 | `null` |
| `$writeCallback` | 可寫事件回調函數，當此 `$socket` 可寫時觸發該函數 | `null` |
| `$events` | 事件類型的掩碼，`SWOOLE_EVENT_READ` 監聽可讀事件，`SWOOLE_EVENT_WRITE` 監聽可寫事件，`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` 同時監聽可讀可寫事件 | `SWOOLE_EVENT_READ` |

**返回值**：返回 `true` 表示成功，返回 `false` 表示失敗，請使用 `swoole_last_error()` 獲取錯誤碼。

**示例**

```php
<?php
$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Swoole\Event::add($fp, function($fp) {
    $resp = fread($fp, 8192);
    //socket處理完成後，從epoll事件中移除socket
    Swoole\Event::del($fp);
    fclose($fp);
});
echo "Finish\n";  //Swoole\Event::add 不會阻塞進程，這行代碼會順序執行
```

> [!TIP]
> 使用 `Swoole\Event::add` 將 `socket` 加入到事件監聽後，底層會自動將該 `socket` 設置爲非阻塞模式。
>
> 已添加過的 `$socket` 不能重複添加，重複添加同一個 `$socket` 會拋出錯誤。可以使用 `Swoole\Event::set()` 修改 `$socket` 對應的回調函數和事件類型。

### set

修改已在事件輪詢中的 `$socket` 的回調函數及事件掩碼。

```php
public static function set(mixed $socket, ?callable $readCallback = null, ?callable $writeCallback = null, int $events = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 資源、`sockets` 資源、`object` 對象 | 必填 |
| `$readCallback` | `$readCallback` 爲 `null` 時，表示不對設置的回調函數進行修改，否則將可讀事件回調函數修改爲 `$readCallback` | `null` |
| `$writeCallback` | `$writeCallback` 爲 `null` 時，表示不對設置的回調函數進行修改，否則將可寫事件回調函數修改爲 `$writeCallback` | `null` |
| `$events` | 事件類型的掩碼<br>`SWOOLE_EVENT_READ`：僅監聽可讀事件，同時停止監聽可寫事件。<br>`SWOOLE_EVENT_WRITE`：僅監聽可寫事件，同時停止監聽可讀事件。<br>`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE`：同時監聽可讀和可寫事件。 | `0` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失敗，請使用 `swoole_last_error()` 獲取錯誤碼。

**示例**

```php
<?php
$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Swoole\Event::add($fp, null, null, 0);

Swoole\Event::set($fp, function($fp) {
    $resp = fread($fp, 8192);
    //socket處理完成後，從epoll事件中移除socket
    Swoole\Event::del($fp);
    fclose($fp);
}, null, SWOOLE_EVENT_READ);

echo "Finish\n";
```

> [!TIP]
> 當 `$events` 設置爲 `0` 時，即使 `$readCallback` 和 `$writeCallback` 都不爲 `null`，底層也只會保存回調函數的信息，而不會觸發任何事件回調。
>
> 如果需要修改監聽的事件類型，可以使用：
>
> ```php
> Swoole\Event::set($fd, null, null, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE);
> ```
>
> 此時底層會重新觸發可讀可寫事件（如果文件描述符處於可讀可寫狀態）。

> [!WARNING]
> 如果 `$socket` 不存在事件輪詢中，會提示 `socket[%d] is not found in the reactor`。
>
> 注意如果監聽了 `SWOOLE_EVENT_READ` 事件，而當前並未設置 `$readCallback`，底層會直接返回 `false`，添加失敗。`SWOOLE_EVENT_WRITE` 同理。

### isset

檢測傳入的 `$socket` 是否已加入了事件監聽。

```php
public static function isset(mixed $socket, int $events = SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 資源、`sockets` 資源、`object` 對象 | 必填 |
| `$events` | 檢測的事件類型 | `SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` |

**返回值**：返回 `true` 表示存在，返回 `false` 表示不存在。

**示例**

```php
<?php
use Swoole\Event;

$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Event::add($fp, function($fp) {
    $resp = fread($fp, 8192);
    Swoole\Event::del($fp);
    fclose($fp);
}, null, SWOOLE_EVENT_READ);
var_dump(Event::isset($fp, SWOOLE_EVENT_READ)); //返回 true
var_dump(Event::isset($fp, SWOOLE_EVENT_WRITE)); //返回 false
var_dump(Event::isset($fp, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE)); //返回 true
```

### del

從事件輪詢刪除指定的 `$socket`。

```php
public static function del(mixed $socket): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 資源、`sockets` 資源、`object` 對象 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Event;

$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Event::add($fp, function($fp) {
    $resp = fread($fp, 8192);
    Swoole\Event::del($fp);
    fclose($fp);
}, null, SWOOLE_EVENT_READ);
```

> [!WARNING]
> 必須在 `$socket` 的 `close` 操作前使用 `Swoole\Event::del` 移除事件監聽，否則可能會產生內存泄漏。

### write

將 `stream/sockets` 資源的數據發送變成**異步**的，當緩衝區滿了或者返回 `EAGAIN`，Swoole 底層會將數據加入到發送隊列，並監聽可寫。可寫時 Swoole 底層會自動寫入。

```php
public static function write(mixed $socket, string $data): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 資源、`sockets` 資源、`object` 對象 | 必填 |
| `$data` | 需要發送的數據 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Event;

$fp = stream_socket_client('tcp://127.0.0.1:9501');

Event::add($fp, function($fp) {
     echo fread($fp, 8192);
});

$data = str_repeat('A', 1024 * 1024 * 2);
Event::write($fp, $data);
```

> [!TIP]
> 持續寫入 `$socket` 如果對端讀取不夠快，那 `$socket` 緩存區會塞滿。`Swoole` 底層會將數據存到內存緩存區中，直到可寫事件觸發再自動寫入 `$socket`。
>
> 如果內存緩存區也被寫滿了，此時 `Swoole` 底層會拋出 `socket#%d output buffer overflow` 錯誤。

### wait

啓動事件輪詢。

```php
public static function wait()
```

**示例**

```php
<?php
use Swoole\Timer;
use Swoole\Event;

Timer::tick(1000, function () {
    echo "hello\n";
});

Event::wait();
```

> [!IMPORTANT]
> 請將此函數放置於 PHP 程序末尾。

### defer

在當前事件輪詢結束後，下一個事件輪詢開始前執行指定函數。

```php
public static function defer(callable $callback): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$callback` | 回調函數，必須是可以調用的。回調函數不接受任何參數，可以使用匿名函數的 use 語法傳遞參數到回調函數中 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Event;

Event::defer(function() {
    echo 'EventLoop' . PHP_EOL;
});
```

> [!TIP]
> 回調函數中如果繼續執行 `Swoole\Event::defer` 添加新的任務，這些任務仍然會在本輪事件循環內執行完成。

### cycle

定義一個回調函數，該函數將在每輪事件循環**開始前** / **結束後**執行。

```php
public static function cycle(?callable $callback, bool $before = false): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$callback` | 回調函數，必須是可以調用的。回調函數不接受任何參數，可以使用匿名函數的 use 語法傳遞參數到回調函數中 | 必填 |
| `$before` | `true` 表示在事件輪詢開始前執行 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Event;
Event::cycle(function() {
    echo 'EventLoop' . PHP_EOL;
});
```

### dispatch

啓動事件輪詢。

```php
public static function dispatch(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Event;

while(true) {
    Event::dispatch();
}
```

> [!TIP]
> 與 `Swoole\Event::wait()` 不同的是，`Swoole\Event::wait()` 在內部保持了循環操作，而 `Swoole\Event::dispatch()` 執行一次就會返回，所以需要一個 `while(true)` 保持循環。

> [!IMPORTANT]
> 此函數用於兼容 `Amp` 等框架。這類框架需要在內部自行控制 `Reactor` 的事件循環；若直接使用 `Swoole\Event::wait()`，`Swoole` 底層會一直持有控制權，無法交還給框架。

### exit

退出事件循環。清除全部定時器，並停止正在運行的事件循環，[wait](#wait) 會隨之返回。

```php
public static function exit(): void
```

**示例**

```php
<?php
use Swoole\Event;
use Swoole\Timer;

Timer::tick(1000, function () {
    echo "hello\n";
    Event::exit(); // 第一次觸發後退出事件循環
});

Event::wait();
echo "Finish\n";
```

### rshutdown

請求關閉階段的事件循環收尾函數，`Swoole` 會自動將其註冊爲 `PHP` 的 `shutdown` 函數，一般無需手動調用。

```php
public static function rshutdown(): void
```

> [!NOTE]
> 在 `shutdown` 函數中依賴事件循環等待的行爲已被標記爲廢棄（`Event::wait() in shutdown function is deprecated`），請儘量在腳本主體內完成事件循環。

### 回調函數簽名

`Swoole\Event::add()` 和 `Swoole\Event::set()` 的回調函數簽名。

```php
function(mixed $socket) {}
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 資源、`sockets` 資源、`object` 對象 | 必填 |

## 其他

### 常量

| 事件類型                                   | 說明|
|----------------------------------------|---|
|`SWOOLE_EVENT_READ`                     | 監聽可讀事件|
|`SWOOLE_EVENT_WRITE`                    | 監聽可寫事件|
|`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` | 監聽可讀或可寫事件|

### 別名

除面向對象風格的命名外，同時提供函數式風格的別名，參數完全一致。

| 面向對象 | 函數式風格 |
|:---|:---|
| `Swoole\Event::add()` | `swoole_event_add()` |
| `Swoole\Event::set()` | `swoole_event_set()` |
| `Swoole\Event::isset()` | `swoole_event_isset()` |
| `Swoole\Event::del()` | `swoole_event_del()` |
| `Swoole\Event::write()` | `swoole_event_write()` |
| `Swoole\Event::wait()` | `swoole_event_wait()` |
| `Swoole\Event::defer()` | `swoole_event_defer()` |
| `Swoole\Event::cycle()` | `swoole_event_cycle()` |
| `Swoole\Event::dispatch()` | `swoole_event_dispatch()` |
| `Swoole\Event::exit()` | `swoole_event_exit()` |
| `Swoole\Event::rshutdown()` | `swoole_event_rshutdown()` |

### 事件優先級

1. 通過 [`Swoole\Process::signal`](/zh-hant/process/process.html#signal) 設置的信號處理回調函數
2. 通過 [`Swoole\Timer::tick`](/zh-hant/timer.html#tick) 和 [`Swoole\Timer::after`](/zh-hant/timer.html#after) 設置的定時器回調函數
3. 通過 `Swoole\Event::defer` 設置的延遲執行函數
4. 通過 `Swoole\Event::cycle` 設置的週期回調函數

### 可監聽的資源類型

| 類型 | 說明                                                                            |
|------|-------------------------------------------------------------------------------|
| int | 文件描述符，如 [`Swoole\Client->$sock`](/zh-hant/client/sync.html#sock)、[`Swoole\Process->$pipe`](/zh-hant/process/process.html#pipe) 或其他有效的 fd              |
| stream 資源 | 通過 `stream_socket_client()`、`fsockopen()` 等函數創建的資源                            |
| sockets 資源 | 由 `sockets` 擴展中 `socket_create()` 創建的資源（需編譯 `Swoole` 時添加 [`--enable-sockets`](/zh-hant/start/install.html#特殊與調試選項) 選項） |
| object | `Swoole\Process` 或 `Swoole\Client` 對象，底層會自動轉換爲 Unix Socket 或客戶端連接 Socket      |

> [!WARNING]
> 普通文件的讀寫不適用於此處的事件監聽。因爲在 `Linux` 中，文件一旦打開便始終處於可讀可寫狀態，此時使用事件輪詢是無效且沒有意義的。