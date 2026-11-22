# HTTP Coroutine Server

- `Swoole\Coroutine\Http\Server` is a lightweight, high-performance `HTTP` server implemented by `Swoole` on top of coroutines. Its biggest feature: **it allows developers to write synchronous, sequential code while achieving the high-concurrency performance of non-blocking I/O**. Under the hood, coroutines automatically suspend and resume, yielding the CPU while waiting for I/O, so a **single process can support massive numbers of connections**.

## Methods

### __construct

Create an `HTTP` coroutine server.

```php
public function __construct(string $host, int $port = 0, bool $ssl = false, bool $reuse_port = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | The IP address to listen on | Required |
| `$port` | The port to listen on, in the range `0~65535` | `0` (randomly listens on a free port) |
| `$ssl` | Whether to enable `SSL/TLS` tunnel encryption; can be set to `true` | `false` |
| `$reuse_port` | Whether to enable the port reuse feature; when enabled, multiple services can share one port; can be set to `true` | `false` |

### set

Set the runtime configuration of the `HTTP` coroutine server.

```php
public function set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Runtime configuration of the `HTTP` coroutine server | Required |

**Return value**: Returns `true` on success and `false` on failure.

### handle

Register a callback function to handle HTTP requests under the path indicated by the `$pattern` parameter.

```php
public function handle(string $pattern, callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$pattern` | Sets the `URL` path [such as `/index.html`; note that `http://domain` cannot be passed here] | Required |
| `$callback` | Callback function | Required |

**`$callback` function signature**

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$request` | The `HTTP` request object, holding information about the `HTTP` client request, including `GET`, `POST`, `COOKIE`, `Header`, etc. | Required |
| `$response` | The `HTTP` response object; call this object's methods to send the `HTTP` response | Required |

> [!WARNING]
> - The callback function must be set before [start](/en/server/coroutine/http.html#start) is executed.
> - After the server establishes a connection, it automatically creates a coroutine to execute `$callback` and handle the `HTTP` request.
> - For a `KeepAlive` persistent connection, the child coroutine keeps looping to accept new requests without exiting. Otherwise, it stops accepting requests, exits, and closes the connection.
> - When `$pattern` is set to the same path, the new setting overrides the old one. If no handler is set for the `/` root path and the requested path matches no `$pattern`, Swoole returns a `404` error.
> - `$pattern` uses string matching; wildcards and regular expressions are not supported, and matching is case-insensitive. The matching algorithm is prefix matching — for example, the url `/test111` matches the `/test` rule; once matched, matching stops and later configurations are ignored. Setting a handler for the `/` root path is recommended.

### start

Start the `HTTP` coroutine server.

```php
public function start(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

### shutdown

Shut down the `HTTP` coroutine server.

```php
public function shutdown(): void
```

## Examples

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Process;
use Swoole\Process\Pool;
use function Swoole\Coroutine\run;

$pool = new Pool(5);
$pool->set(['enable_coroutine' => true]); // Coroutines must be enabled
$pool->on('workerStart', function (Pool $pool, $workerId) {
    // $reuse_port must be set to true; otherwise multiple processes cannot listen on the same port
    $server = new Server('127.0.0.1', 9502, false, true);
    $server->handle('/', function (Request $request, Response $response) {
        $response->end("<h1>Index</h1>");
    });
    $server->handle('/test', function (Request $request, Response $response) {
        $response->end("<h1>Test</h1>");
    });
    $server->handle('/stop', function (Request $request, Response $response) use ($server) {
        $response->end("<h1>Stop</h1>");
        $server->shutdown(); // After the coroutine server exits, the child process also exits and is restarted by the master process
    });
    $server->start();
});

$pool->start();
```

## Notes

- `Swoole\Coroutine\Http\Server` runs as a **single process** by default and cannot fully utilize multi-core CPUs. For deployment in multi-core environments, it is recommended to combine it with [`Swoole\Process\Pool`](/en/process/pool.html) for multi-process management.
- `Swoole\Coroutine\Http\Server` has built-in support for `HTTP2`; there is no need to manually specify [open_http2_protocol](/en/server/setting.html#open-http2-protocol) as with the [HTTP2 server](/en/server/http.html).