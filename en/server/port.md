# Multi-Port Listening

`Swoole` supports listening on multiple ports within a single service. Each port can independently configure its protocol (such as HTTP, TCP, or WebSocket) and SSL/TLS encryption, achieving protocol isolation and secure communication without starting multiple service processes.

## Listening on a New Port

`Swoole` listens on multiple ports via the [listen](/en/server/methods.html#listen) method. This method returns a [Swoole\Server\Port](/en/server/class/port.html) object. This means you can handle different protocols such as HTTP, TCP, and UDP at the same time, achieving efficient port reuse.

**Example**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// Listen on port 9502, plain TCP protocol
$port1 = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// Listen on port 9503, plain TCP protocol
$port2 = $server->listen("127.0.0.1", 9503, SWOOLE_SOCK_TCP);

// Listen on port 9504, plain TCP protocol
$port3 = $server->listen("127.0.0.1", 9504, SWOOLE_SOCK_TCP);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {

});

$server->start();
```

## Protocol Configuration and Event Callbacks

- When you add a new port via [listen](/en/server/methods.html#listen), it acts like a "clone": by default it inherits the main port's protocol configuration (such as `HTTP` or `WebSocket`) and event callbacks. Suppose the main port is configured as an `HTTP` service; if the newly listened port is not explicitly configured, it directly inherits the main port's `HTTP` protocol settings and automatically runs in HTTP service mode.

- If you want the new port to handle a different protocol (for example, the main port is `HTTP` and the new port is `TCP`), you must explicitly call [on](/en/server/class/port.html#on) and [set](/en/server/class/port.html#set) to change the protocol configuration and rebind the events.

**Example 1: TCP port configuration override. The main port 9501 is TCP, and the sub-port 9502 is also TCP, but with different handling logic and packet length rules.**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 1. Main port configuration: assume it handles some fixed-length packets
$server->set([
    'open_length_check' => true,
    'package_length_type' => 'C',
    'package_length_offset' => 100, // Assume byte 100 holds the packet length value
    'package_max_length' => 1000,  // Data sent to port 9501 will never exceed 1000 bytes
]);

// Main port receive event
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "Port 9501 received data\n";
});

// 2. Listen on sub-port 9502
$port = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// [Key] The configuration must be overridden; otherwise 9502 also uses package_length_type=C, package_length_offset=100 and package_max_length=1000 above
$port->set([
    'open_length_check' => true,
    'package_length_type' => 'N',
    'package_length_offset' => 200, // Assume byte 200 holds the packet length value
    'package_max_length' => 800000, // Data sent to port 9502 will never exceed 800000 bytes
]);

// [Key] Events must be bound separately for the sub-port; otherwise the main port's receive event is still triggered
$port->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "Port 9502 received data, using different parsing rules\n";
});

$server->start();
```

**Example 2: The main port 9501 is an HTTP service, and you want to add port 9502 dedicated to TCP pass-through.**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501);

// Main port HTTP logic
$server->on('request', function(Request $request, Response $response) {
    $response->end("Hello HTTP");
});

// Listen on sub-port 9502
$port = $server->listen('127.0.0.1', 9502, SWOOLE_SOCK_TCP);

// [Key step 1] Reset the protocol configuration
// Without this step, data received on port 9502 would be parsed as HTTP requests, causing failures
$port->set([
    'open_http_protocol' => false, // Disable the HTTP protocol
    // TCP-related options such as open_length_check can be added here
]);

// [Key step 2] Bind the receive event on the $port object
// Note: it cannot be written in $server->on('receive'), because the main server is in HTTP mode and does not support receive
$port->on('receive', function($server, $fd, $reactorId, $data) {
    $server->send($fd, "TCP Port 9502 received: $data");
});

$server->start();
```

## Limitations of Mixing Protocols

> [!TIP]
> [`Swoole\Http\Server`](/en/server/http.html) is implemented by inheriting from [`Swoole\Server`](/en/server/tcp_udp.html), and [`Swoole\WebSocket\Server`](/en/server/websocket.html) is implemented by inheriting from `Swoole\Http\Server`. Therefore, if you create a plain `TCP` server, you cannot add an `HTTP` or `WebSocket` sub-port to it via the [listen](/en/server/methods.html#listen) method.

```php
// The request event of an HTTP server
function (Swoole\Http\Request $request, Swoole\Http\Response $response)

// The message event of a WebSocket server
function (Swoole\WebSocket\Server $server, Swoole\WebSocket\Frame $frame)
```

As the two function signatures above show, if you listen for the `WebSocket` protocol on a new port other than the main server via `Swoole\Server`, when the [message event](/en/server/events.html#message) is triggered, the callback expects an object of type `Swoole\WebSocket\Server`. However, the main server's type is `Swoole\Server`, and what is actually passed in is a `Swoole\Server` object, causing an error due to a parameter type mismatch.

Although the current [request event](/en/server/events.html#request) does not require a `$server` parameter, considering future API extensibility, later versions may introduce dedicated methods for `Swoole\Http\Server`, at which point a similar type inconsistency would occur.

Therefore, it is **forbidden** for a parent class (`Swoole\Server`) to listen for a subclass server (such as `Swoole\WebSocket\Server` or `Swoole\Http\Server`) on a new port. Instead, it is recommended that the subclass listen for a parent-class server on the new port, ensuring callback parameter types are always correct.

**Incorrect example**

```php
<?php
use Swoole\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\WebSocket\Server as WebsocketServer;
use Swoole\WebSocket\Frame;


// Create a TCP server
$server = new Server('127.0.0.1', 9501);  // Main port listens for TCP
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Hello TCP!!!";
});

// Attempt to listen for the HTTP protocol on sub-port 9502 — invalid
$port1 = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);
$port1->set([
  'open_http_protocol' => true,
  'package_max_length' => 800000,
]);
$port1->on('request', function(Request $request, Response $response) {
  echo "Hello HTTP!!!";
});

// Attempt to listen for the Websocket protocol on sub-port 9503 — invalid
$port2 = $server->listen("127.0.0.1", 9503, SWOOLE_SOCK_TCP);
$port2->set([
  'open_websocket_protocol' => true,
  'package_max_length' => 800000,
]);
$port2->on('message', function (WebsocketServer $server,  Frame $frame) {
  echo "Hello Websocket!!!";
});

$server->start();
```

**Correct approach**

- Scenario: your main functionality is `HTTP/WebSocket`, but you also want to provide a simple TCP management interface.
- Solution: create the `HTTP or WebSocket` server first, then add a `TCP` sub-port via [listen](/en/server/methods.html#listen).

```php
<?php
use Swoole\Server as TcpServer;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// Start an HTTP server first
$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

// Listen for a TCP server
$port = $http->listen('127.0.0.1', 9502, SWOOLE_TCP);
// Reset the protocol configuration inherited from the HTTP server
$port->set(['open_http_protocol' => false]); 
// Re-register the event listener
$port->on('receive', function(TcpServer $server, int $fd, int $reactorId, string $data) {

});

$http->start();
```

| Main server type | Can add HTTP sub-port | Can add WebSocket sub-port | Can add TCP sub-port |
|------------|-------------------|-------------------------|-------------------|
| TCP        | ❌ No | ❌ No | ✅ Yes |
| HTTP       | ✅ Yes | ❌ No | ✅ Yes |
| WebSocket  | ✅ Yes | ✅ Yes | ✅ Yes |