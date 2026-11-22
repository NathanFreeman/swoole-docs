# TCP/UDP Coroutine Server

- `Swoole\Coroutine\Server` is a lightweight, high-performance server implemented by `Swoole` on top of coroutines. Its biggest feature: **it allows developers to write synchronous, sequential code while achieving the high-concurrency performance of non-blocking I/O**. Under the hood, coroutines automatically suspend and resume, yielding the CPU while waiting for I/O, so a **single process can support massive numbers of connections**.
- The core difference from [Swoole\Server](/en/server/tcp_udp.html) lies in the programming model: `Swoole\Coroutine\Server` lets developers implement non-blocking logic with synchronous, sequential code, automatically handling coroutine suspension and resumption during IO waits, whereas `Swoole\Server` requires explicitly registering callback functions to handle IO results.
- Since `Swoole\Coroutine\Server` is single-process, it cannot fully utilize multi-core `CPU`s. For deployment in multi-core environments, it is recommended to combine it with **[`Swoole\Process\Pool`](/en/process/pool.html)** for multi-process management.

## Methods

### __construct

Create a TCP coroutine server.

```php
public function __construct(string $host, int $port = 0, bool $ssl = false, bool $reuse_port = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | The address to listen on | Required |
| `$port` | The port to listen on; if `0`, the operating system randomly assigns a port | `0` |
| `$ssl` | Whether to enable SSL encryption; can be set to `true` | `false` |
| `$reuse_port` | Whether to enable port reuse; can be set to `true` | `false` |

### set

Set the runtime configuration of the TCP coroutine server.

```php
public function set(array $setting): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$setting` | Server runtime configuration | Required |

### handle

Set the connection handler function.

```php
public function handle(callable $callback): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$callback` | The core handler function invoked when the server receives a connection. This callback is used to handle server requests | Required |

**Callback function signature**

```php
function (Swoole\Coroutine\Server\Connection $connection)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$connection` | The client connection object; see [here](/en/server/class/connection.html) for details | Required |

> [!IMPORTANT]
> You must set this function before starting the server. When a connection is established and the callback is invoked to handle requests, the server has already created a coroutine for you; there is no need to create one manually.

### start

Start the TCP coroutine server.

```php
public function start(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

### shutdown

Shut down the TCP coroutine server.

```php
public function shutdown(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

## Examples

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;
use Swoole\Coroutine\Server;
use Swoole\Coroutine\Server\Connection;

//Multi-process management module
$pool = new Process\Pool(2);
//Make every OnWorkerStart callback automatically create a coroutine
$pool->set(['enable_coroutine' => true]);
$pool->on('workerStart', function ($pool, $id) {
    //Every process listens on port 9501; reuse_port must be set to true here
    $server = new Server('127.0.0.1', 9501, false, true);

    //Shut down the service upon receiving signal 15
    Process::signal(SIGTERM, function () use ($server) {
        $server->shutdown();
    });

    //Receive a new connection request and automatically create a coroutine
    $server->handle(function (Connection $conn) {
        while (true) {
            //Receive data
            $data = $conn->recv(1);

            if ($data === '' || $data === false) {
                $errCode = swoole_last_error();
                $errMsg = socket_strerror($errCode);
                echo "errCode: {$errCode}, errMsg: {$errMsg}\n";
                $conn->close();
                break;
            }

            //Send data
            $conn->send('hello');

            Coroutine::sleep(1);
        }
    });

    //Start listening on the port
    $server->start();
});
$pool->start();
```