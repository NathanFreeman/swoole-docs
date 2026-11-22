# 事件轮询

- `Swoole` 提供了直接操作底层 `epoll/kqueue/poll/select` 事件循环的接口。可将其他扩展创建的 `socket`，`PHP` 代码中 `stream/socket` 扩展创建的 `socket` 等加入到 `Swoole` 的事件轮询中。

## 方法

### add

将一个 `socket` 加入到底层的事件轮询中。

```php
public static function add(mixed $socket, ?callable $readCallback = null, ?callable $writeCallback = null, int $events = SWOOLE_EVENT_READ): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 资源、`sockets` 资源、`object` 对象 | 必填 |
| `$readCallback` | 可读事件回调函数，当此 `$socket` 可读时触发该函数 | `null` |
| `$writeCallback` | 可写事件回调函数，当此 `$socket` 可写时触发该函数 | `null` |
| `$events` | 事件类型的掩码，`SWOOLE_EVENT_READ` 监听可读事件，`SWOOLE_EVENT_WRITE` 监听可写事件，`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` 同时监听可读可写事件 | `SWOOLE_EVENT_READ` |

**返回值**：返回 `$socket` 中的文件描述符表示成功，返回 `false` 表示失败，请使用 `swoole_last_error()` 获取错误码。

**示例**

```php
<?php
$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Swoole\Event::add($fp, function($fp) {
    $resp = fread($fp, 8192);
    //socket处理完成后，从epoll事件中移除socket
    Swoole\Event::del($fp);
    fclose($fp);
});
echo "Finish\n";  //Swoole\Event::add 不会阻塞进程，这行代码会顺序执行
```

> [!TIP]
> 使用 `Swoole\Event::add` 将 `socket` 加入到事件监听后，底层会自动将该 `socket` 设置为非阻塞模式。
>
> 已添加过的 `$socket` 不能重复添加，重复添加同一个 `$socket` 会抛出错误。可以使用 `Swoole\Event::set()` 修改 `$socket` 对应的回调函数和事件类型。

### set

修改已在事件轮询中的 `$socket` 的回调函数及事件掩码。

```php
public static function set(mixed $socket, ?callable $readCallback = null, ?callable $writeCallback = null, int $events = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 资源、`sockets` 资源、`object` 对象 | 必填 |
| `$readCallback` | `$readCallback` 为 `null` 时，表示不对设置的回调函数进行修改，否则将可读事件回调函数修改为 `$readCallback` | `null` |
| `$writeCallback` | `$writeCallback` 为 `null` 时，表示不对设置的回调函数进行修改，否则将可写事件回调函数修改为 `$writeCallback` | `null` |
| `$events` | 事件类型的掩码<br>`SWOOLE_EVENT_READ`：仅监听可读事件，同时停止监听可写事件。<br>`SWOOLE_EVENT_WRITE`：仅监听可写事件，同时停止监听可读事件。<br>`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE`：同时监听可读和可写事件。 | `0` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失败，请使用 `swoole_last_error()` 获取错误码。

**示例**

```php
<?php
$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Swoole\Event::add($fp, null, null, 0);

Swoole\Event::set($fp, function($fp) {
    $resp = fread($fp, 8192);
    //socket处理完成后，从epoll事件中移除socket
    Swoole\Event::del($fp);
    fclose($fp);
}, null, SWOOLE_EVENT_READ);

echo "Finish\n";
```

> [!TIP]
> 当 `$events` 设置为 `0` 时，即使 `$readCallback` 和 `$writeCallback` 都不为 `null`，底层也只会保存回调函数的信息，而不会触发任何事件回调。
>
> 如果需要修改监听的事件类型，可以使用：
>
> ```php
> Swoole\Event::set($fd, null, null, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE);
> ```
>
> 此时底层会重新触发可读可写事件（如果文件描述符处于可读可写状态）。

> [!WARNING]
> 如果 `$socket` 不存在事件轮询中，会提示 `socket[%d] is not found in the reactor`。
>
> 注意如果监听了 `SWOOLE_EVENT_READ` 事件，而当前并未设置 `$readCallback`，底层会直接返回 `false`，添加失败。`SWOOLE_EVENT_WRITE` 同理。

### isset

检测传入的 `$socket` 是否已加入了事件监听。

```php
public static function isset(mixed $socket, int $events = SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 资源、`sockets` 资源、`object` 对象 | 必填 |
| `$events` | 检测的事件类型 | `SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` |

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

从事件轮询删除指定的 `$socket`。

```php
public static function del(mixed $socket): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 资源、`sockets` 资源、`object` 对象 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

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
> 必须在 `$socket` 的 `close` 操作前使用 `Swoole\Event::del` 移除事件监听，否则可能会产生内存泄漏。

### write

将 `stream/sockets` 资源的数据发送变成**异步**的，当缓冲区满了或者返回 `EAGAIN`，Swoole 底层会将数据加入到发送队列，并监听可写。可写时 Swoole 底层会自动写入。

```php
public static function write(mixed $socket, string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 资源、`sockets` 资源、`object` 对象 | 必填 |
| `$data` | 需要发送的数据 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Event;

$fp = stream_socket_client('tcp://127.0.0.1:9501');

Event::add($fp, function($fp) {
     echo fread($fp);
});

$data = str_repeat('A', 1024 * 1024 * 2);
Event::write($fp, $data);
```

> [!TIP]
> 持续写入 `$socket` 如果对端读取不够快，那 `$socket` 缓存区会塞满。`Swoole` 底层会将数据存到内存缓存区中，直到可写事件触发再自动写入 `$socket`。
>
> 如果内存缓存区也被写满了，此时 `Swoole` 底层会抛出 `socket#%d output buffer overflow` 错误。

### wait

启动事件轮询。

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
> 请将此函数放置于 PHP 程序末尾。

### defer

在当前事件轮询结束后，下一个事件轮询开始前执行指定函数。

```php
public static function defer(callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$callback` | 回调函数，必须是可以调用的。回调函数不接受任何参数，可以使用匿名函数的 use 语法传递参数到回调函数中 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Event;

Event::defer(function() {
    echo 'EventLoop' . PHP_EOL;
});
```

> [!TIP]
> 回调函数中如果继续执行 `Swoole\Event::defer` 添加新的任务，这些任务仍然会在本轮事件循环内执行完成。

### cycle

定义一个回调函数，该函数将在每轮事件循环**开始前** / **结束后**执行。

```php
public static function cycle(?callable $callback, bool $before = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$callback` | 回调函数，必须是可以调用的。回调函数不接受任何参数，可以使用匿名函数的 use 语法传递参数到回调函数中 | 必填 |
| `$before` | `true` 表示在事件轮询开始前执行 | `false` |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Event;
Event::cycle(function() {
    echo 'EventLoop' . PHP_EOL;
});
```

### dispatch

启动事件轮询。

```php
public static function dispatch(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Event;

while(true) {
    Event::dispatch();
}
```

> [!TIP]
> 与 `Swoole\Event::wait()` 不同的是，`Swoole\Event::wait()` 在内部保持了循环操作，而 `Swoole\Event::dispatch()` 执行一次就会返回，所以需要一个 `while(true)` 保持循环。

> [!IMPORTANT]
> 此函数用于兼容 `Amp` 等框架。这类框架需要在内部自行控制 `Reactor` 的事件循环；若直接使用 `Swoole\Event::wait()`，`Swoole` 底层会一直持有控制权，无法交还给框架。

### 回调函数签名

`Swoole\Event::add()` 和 `Swoole\Event::set()` 的回调函数签名。

```php
function(mixed $socket) {}
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$socket` | 文件描述符、`stream` 资源、`sockets` 资源、`object` 对象 | 必填 |

## 其他

### 常量

| 事件类型                                   | 说明|
|----------------------------------------|---|
|`SWOOLE_EVENT_READ`                     | 监听可读事件|
|`SWOOLE_EVENT_WRITE`                    | 监听可写事件|
|`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` | 监听可读或可写事件|

### 事件优先级

1. 通过 [`Swoole\Process::signal`](/zh/process/process.html#signal) 设置的信号处理回调函数
2. 通过 [`Swoole\Timer::tick`](/zh/timer.html#tick) 和 [`Swoole\Timer::after`](/zh/timer.html#after) 设置的定时器回调函数
3. 通过 `Swoole\Event::defer` 设置的延迟执行函数
4. 通过 `Swoole\Event::cycle` 设置的周期回调函数

### 可监听的资源类型

| 类型 | 说明                                                                            |
|------|-------------------------------------------------------------------------------|
| int | 文件描述符，如 [`Swoole\Client->$sock`](/zh/client/sync.html#sock)、[`Swoole\Process->$pipe`](/zh/process/process.html#pipe) 或其他有效的 fd              |
| stream 资源 | 通过 `stream_socket_client()`、`fsockopen()` 等函数创建的资源                            |
| sockets 资源 | 由 `sockets` 扩展中 `socket_create()` 创建的资源（需编译 `Swoole` 时添加 [`--enable-sockets`](/zh/start/install.html#特殊与调试选项) 选项） |
| object | `Swoole\Process` 或 `Swoole\Client` 对象，底层会自动转换为 Unix Socket 或客户端连接 Socket      |

> [!WARNING]
> 普通文件的读写不适用于此处的事件监听。因为在 `Linux` 中，文件一旦打开便始终处于可读可写状态，此时使用事件轮询是无效且没有意义的。