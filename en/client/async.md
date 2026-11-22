# Async Callback Client

[Swoole\Client](/en/client/sync.html) supports both synchronous blocking and asynchronous non-blocking modes. When the second constructor parameter `$async` is set to `true`, the client runs in asynchronous non-blocking mode and supports `TCP/UDP/UnixSocket`. In this mode, data is handled through event callbacks rather than synchronous waiting.

## Methods

### __construct

Constructor

```php
public function __construct(int $type, bool $async = false, string $id = '')
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$type` | The connection type [supports `SWOOLE_SOCK_TCP`, `SWOOLE_SOCK_TCP6`, `SWOOLE_SOCK_UDP`, `SWOOLE_SOCK_UDP6`] | Required |
| `$async` | Whether to enable asynchronous non-blocking mode; must be set to `true` for the usage on this page | `false` |
| `$id` | The `key` used for persistent connections [by default `IP:PORT` is used as the `key`; with the same `key`, even if you `new` twice only one TCP connection is used] | `IP:PORT` |

### on

Registers an event callback function.

```php
public function on(string $event, callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event` | Callback event name, case-insensitive | Required |
| `$callback` | Callback function | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Supported events**

| Event          | Trigger                          | Callback parameters                                  |
|:--------------|:------------------------------|:--------------------------------------|
| `connect`     | Fired when the client successfully connects to the server.               | `$cli` (the client object instance).                     |
| `receive`     | Fired when the client receives data from the server.            | `$cli` (the client object instance), `$data` (the received data content). |
| `error`       | Fired when a network error occurs on the client (such as connect timeout or connection refused).     | `$cli` (the client object instance).                     |
| `close`       | Fired when the client connection is closed.                  | `$cli` (the client object instance).                     |
| `bufferFull`  | Fired when the output buffer is full and reaches the high watermark (typically used for flow control). | `$cli` (the client object instance).                     |
| `bufferEmpty` | Fired when all data in the output buffer has been sent and it drops to the low watermark.      | `$cli` (the client object instance).                     |

**Example**

```php
<?php
use Swoole\Client;

$client = new Client(SWOOLE_SOCK_TCP, true);

$client->on('connect', function(Client $client) {
});

$client->on('receive', function(Client $client, string $data) {
});

$client->on('error', function(Client $client) {
});

$client->on('close', function(Client $client) {
});

$client->on('bufferFull', function(Client $client) {
});

$client->on('bufferEmpty', function(Client $client) {
});
```

> [!WARNING]
> Calling the `on` method repeatedly overwrites the previous setting.
> Must be called before the `connect` method is executed.

### connect

Connects to the server.

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Server address [supports automatic async domain name resolution; `$host` can be a domain name directly] | Required |
| `$port` | Server port | `0` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | `0.5` |
| `$flag` | For a `UDP client`, setting `$flag = 1` "binds" the connection to the `$host` and `$port` specified in the `connect` method. From then on it only receives packets from this specific IP and port and discards data from all other sources. This lets you simulate "connection"-like behavior on UDP, a `connectionless` protocol; for a `TCP client`, setting `$flag = 1` enables non-blocking mode, after which this `fd` becomes async IO and `connect` returns immediately. | `0` |

**Return value**: Returns `true` on success. Returns `false` on failure — check the [`errCode`](/en/client/sync.html#errcode) property for the failure reason.

### enableSSL

Dynamically enables `SSL/TLS` encryption, generally used for `startTLS` clients: plaintext data is sent first after the connection is established, then encrypted transmission is enabled.

```php
public function enableSSL(?callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$callback` | Callback function | Required |

**Return value**: Returns `true` on success. Returns `false` on failure — check the `errCode` property for the failure reason.

> [!WARNING]
> When establishing an encrypted connection directly with `SWOOLE_SSL`, it must be called before the `connect` method is executed; when using `startTLS` (sending plaintext data first after the connection is established), call it after `connect`.

### pause

Temporarily stops receiving data; after the call, the client is removed from the event loop and data receive events no longer fire.

```php
public function pause(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

### resume

Resumes receiving data; after the call, the client is added back to the event loop.

```php
public function resume(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

## Examples

```php
<?php
use Swoole\Client;
// Create an async TCP client
$client = new Client(SWOOLE_SOCK_TCP, true);

// Register event callback functions
$client->on("connect", function(Client $cli) {
    echo "Connected successfully\n";
    $cli->send("Hello, Server!\n"); // Send data after the connection succeeds
});

$client->on("receive", function(Client $cli, $data){
    echo "Received server data: " . $data . "\n";
    // After receiving data, you can continue processing here or close the connection
    // $cli->close();
});

$client->on("error", function(Client $cli){
    // You can get the error code via $cli->errCode; the connect timeout error code is ETIMEOUT
    echo "Connection failed\n";
});

$client->on("close", function(Client $cli){
    echo "Connection closed\n";
});

// Initiate the connection; the third parameter is the timeout (seconds)
$client->connect('127.0.0.1', 9501, 0.5);
```