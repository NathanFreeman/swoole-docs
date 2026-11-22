# Event Polling

- `Swoole` provides interfaces for directly operating the underlying `epoll/kqueue/poll/select` event loop. You can add `socket`s created by other extensions, `socket`s created by PHP's `stream/socket` extensions, etc., into `Swoole`'s event polling.

## Methods

### add

Adds a `socket` to the underlying event polling.

```php
public static function add(mixed $socket, ?callable $readCallback = null, ?callable $writeCallback = null, int $events = SWOOLE_EVENT_READ): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor, `stream` resource, `sockets` resource, or `object` | Required |
| `$readCallback` | Readable event callback function, triggered when this `$socket` becomes readable | `null` |
| `$writeCallback` | Writable event callback function, triggered when this `$socket` becomes writable | `null` |
| `$events` | Mask of event types. `SWOOLE_EVENT_READ` listens for readable events, `SWOOLE_EVENT_WRITE` listens for writable events, `SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` listens for both readable and writable events | `SWOOLE_EVENT_READ` |

**Return value**: Returns the file descriptor in `$socket` on success, `false` on failure; use `swoole_last_error()` to get the error code.

**Example**

```php
<?php
$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Swoole\Event::add($fp, function($fp) {
    $resp = fread($fp, 8192);
    //After the socket is processed, remove the socket from the epoll events
    Swoole\Event::del($fp);
    fclose($fp);
});
echo "Finish\n";  //Swoole\Event::add does not block the process; this line executes sequentially
```

> [!TIP]
> After adding a `socket` to event listening with `Swoole\Event::add`, the underlying layer automatically sets the `socket` to non-blocking mode.
>
> A `$socket` that has already been added cannot be added again; adding the same `$socket` repeatedly throws an error. You can use `Swoole\Event::set()` to modify the callback functions and event types corresponding to a `$socket`.

### set

Modifies the callback functions and event mask of a `$socket` already in the event polling.

```php
public static function set(mixed $socket, ?callable $readCallback = null, ?callable $writeCallback = null, int $events = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor, `stream` resource, `sockets` resource, or `object` | Required |
| `$readCallback` | When `$readCallback` is `null`, the set callback function is not modified; otherwise the readable event callback function is changed to `$readCallback` | `null` |
| `$writeCallback` | When `$writeCallback` is `null`, the set callback function is not modified; otherwise the writable event callback function is changed to `$writeCallback` | `null` |
| `$events` | Mask of event types<br>`SWOOLE_EVENT_READ`: listen only for readable events, and stop listening for writable events.<br>`SWOOLE_EVENT_WRITE`: listen only for writable events, and stop listening for readable events.<br>`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE`: listen for both readable and writable events. | `0` |

**Return value**: Returns `true` on success, `false` on failure; use `swoole_last_error()` to get the error code.

**Example**

```php
<?php
$fp = stream_socket_client("tcp://www.qq.com:80", $errno, $errstr, 30);
fwrite($fp,"GET / HTTP/1.1\r\nHost: www.qq.com\r\n\r\n");

Swoole\Event::add($fp, null, null, 0);

Swoole\Event::set($fp, function($fp) {
    $resp = fread($fp, 8192);
    //After the socket is processed, remove the socket from the epoll events
    Swoole\Event::del($fp);
    fclose($fp);
}, null, SWOOLE_EVENT_READ);

echo "Finish\n";
```

> [!TIP]
> When `$events` is set to `0`, even if neither `$readCallback` nor `$writeCallback` is `null`, the underlying layer only stores the callback function information and does not trigger any event callbacks.
>
> If you need to change the event types being listened for, you can use:
>
> ```php
> Swoole\Event::set($fd, null, null, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE);
> ```
>
> The underlying layer will then re-trigger readable and writable events (if the file descriptor is in a readable/writable state).

> [!WARNING]
> If `$socket` is not in the event polling, it reports `socket[%d] is not found in the reactor`.
>
> Note that if the `SWOOLE_EVENT_READ` event is listened for but `$readCallback` is not currently set, the underlying layer directly returns `false` and the addition fails. The same applies to `SWOOLE_EVENT_WRITE`.

### isset

Checks whether the passed `$socket` has been added to event listening.

```php
public static function isset(mixed $socket, int $events = SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor, `stream` resource, `sockets` resource, or `object` | Required |
| `$events` | The event types to check | `SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` |

**Return value**: Returns `true` if it exists, `false` if it does not exist.

**Example**

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
var_dump(Event::isset($fp, SWOOLE_EVENT_READ)); //returns true
var_dump(Event::isset($fp, SWOOLE_EVENT_WRITE)); //returns false
var_dump(Event::isset($fp, SWOOLE_EVENT_READ | SWOOLE_EVENT_WRITE)); //returns true
```

### del

Removes the specified `$socket` from the event polling.

```php
public static function del(mixed $socket): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor, `stream` resource, `sockets` resource, or `object` | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> You must use `Swoole\Event::del` to remove event listening before the `close` operation on `$socket`, otherwise a memory leak may occur.

### write

Makes data sending on `stream/sockets` resources **asynchronous**. When the buffer is full or `EAGAIN` is returned, Swoole's underlying layer adds the data to a send queue and listens for writability. When writable, Swoole's underlying layer writes automatically.

```php
public static function write(mixed $socket, string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor, `stream` resource, `sockets` resource, or `object` | Required |
| `$data` | The data to send | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

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
> If you keep writing to `$socket` and the peer does not read fast enough, the `$socket` buffer fills up. `Swoole`'s underlying layer stores the data in a memory buffer until a writable event triggers and it is automatically written to `$socket`.
>
> If the memory buffer also fills up, `Swoole`'s underlying layer throws a `socket#%d output buffer overflow` error.

### wait

Starts the event polling.

```php
public static function wait()
```

**Example**

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
> Place this function at the end of the PHP program.

### defer

Executes the specified function after the current event polling iteration ends and before the next event polling iteration begins.

```php
public static function defer(callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$callback` | Callback function; must be callable. The callback function accepts no parameters; you can use the `use` syntax of anonymous functions to pass parameters into the callback function | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Event;

Event::defer(function() {
    echo 'EventLoop' . PHP_EOL;
});
```

> [!TIP]
> If the callback function continues to call `Swoole\Event::defer` to add new tasks, those tasks will still finish executing within the current event loop iteration.

### cycle

Defines a callback function that will be executed **before the start** / **after the end** of each event loop iteration.

```php
public static function cycle(?callable $callback, bool $before = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$callback` | Callback function; must be callable. The callback function accepts no parameters; you can use the `use` syntax of anonymous functions to pass parameters into the callback function | Required |
| `$before` | `true` means execute before the event polling starts | `false` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Event;
Event::cycle(function() {
    echo 'EventLoop' . PHP_EOL;
});
```

### dispatch

Starts the event polling.

```php
public static function dispatch(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Event;

while(true) {
    Event::dispatch();
}
```

> [!TIP]
> Unlike `Swoole\Event::wait()`, which keeps looping internally, `Swoole\Event::dispatch()` returns after a single execution, so a `while(true)` is needed to keep the loop running.

> [!IMPORTANT]
> This function is used for compatibility with frameworks such as `Amp`. Such frameworks need to control the `Reactor` event loop themselves internally; if `Swoole\Event::wait()` is used directly, `Swoole`'s underlying layer holds control indefinitely and cannot return it to the framework.

### Callback Function Signatures

The callback function signatures of `Swoole\Event::add()` and `Swoole\Event::set()`.

```php
function(mixed $socket) {}
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$socket` | File descriptor, `stream` resource, `sockets` resource, or `object` | Required |

## Others

### Constants

| Event type                                   | Description|
|----------------------------------------|---|
|`SWOOLE_EVENT_READ`                     | Listen for readable events|
|`SWOOLE_EVENT_WRITE`                    | Listen for writable events|
|`SWOOLE_EVENT_READ \| SWOOLE_EVENT_WRITE` | Listen for readable or writable events|

### Event Priority

1. Signal handler callback functions set via [`Swoole\Process::signal`](/en/process/process.html#signal)
2. Timer callback functions set via [`Swoole\Timer::tick`](/en/timer.html#tick) and [`Swoole\Timer::after`](/en/timer.html#after)
3. Deferred functions set via `Swoole\Event::defer`
4. Cycle callback functions set via `Swoole\Event::cycle`

### Supported Resource Types

| Type | Description                                                                            |
|------|-------------------------------------------------------------------------------|
| int | File descriptor, such as [`Swoole\Client->$sock`](/en/client/sync.html#sock), [`Swoole\Process->$pipe`](/en/process/process.html#pipe), or another valid fd              |
| stream resource | Resources created by functions such as `stream_socket_client()`, `fsockopen()`, etc.                            |
| sockets resource | Resources created by `socket_create()` from the `sockets` extension (requires compiling `Swoole` with the [`--enable-sockets`](/en/start/install.html#special-and-debug-options) option) |
| object | `Swoole\Process` or `Swoole\Client` objects; the underlying layer automatically converts them to a Unix Socket or client connection Socket      |

> [!WARNING]
> Reading and writing regular files is not applicable to event listening here. In `Linux`, once a file is opened it is always in a readable and writable state, so using event polling on it is ineffective and meaningless.