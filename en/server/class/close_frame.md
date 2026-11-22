# Swoole\WebSocket\CloseFrame

`Swoole\WebSocket\CloseFrame` is a special class in `Swoole` used to represent and manage the `close frame` of a `WebSocket` connection. Building on the regular [Swoole\WebSocket\Frame](/en/server/class/frame.html) class, it adds the "status code" and "reason" information needed when handling connection closure, allowing developers to gracefully handle or initiate the connection close process.

> [!WARNING]
> This class is rarely used. Please use the following methods to gracefully close a `WebSocket` connection.
>
> - For a `WebSocket` async server, use [disconnect](/en/server/methods.html#disconnect) to close the connection.
> - For a `WebSocket` coroutine server, use [disconnect](/en/server/class/response.html#disconnect) to close the connection.

## Properties

### opcode

The opcode. For a close frame, its value is fixed at `SWOOLE_WEBSOCKET_OPCODE_CLOSE`.

```php
public int $opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE
```

### code

The core property: an integer representing the status code of the connection closure.

```php
public int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL
```

**Supported status codes**

| Status code constant | Description |
|:---|:---|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL             | **Normal closure** - The connection has finished its work and ends normally |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY         | **Going away** - The endpoint is leaving (e.g., browser navigation or page close) |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR     | **Protocol error** - The endpoint received data that does not conform to the WebSocket protocol |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR         | **Data type error** - Received a data type that cannot be processed (e.g., an endpoint that only accepts text received binary) |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR       | **Invalid status code** - A status code was expected but not received (this code is not actually sent; used by applications) |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL           | **Abnormal closure** - The connection dropped unexpectedly (e.g., disconnected without receiving a close frame; not actively sent) |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR      | **Message format error** - Received a message that does not conform to the specification (e.g., UTF-8 encoding error) |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR       | **Policy violation** - The message violates server policy (a generic rejection reason) |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG    | **Message too big** - The message length exceeds what the endpoint is willing to process |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING  | **Missing extension** - The client expected the server to negotiate a specific extension, but the server did not provide it (client-only) |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR       | **Internal server error** - The server encountered an unexpected condition and could not complete the request |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER    | **Try again later** - The server is temporarily overloaded or under maintenance; reconnect later |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY        | **Bad gateway** - The gateway or proxy received an invalid response from upstream |
| SWOOLE_WEBSOCKET_CLOSE_TLS                | **TLS handshake failure** - Closed before the TLS handshake completed (not actively sent) |

### reason

The core property: a string providing the textual reason for the connection closure (UTF-8 encoded, no more than 125 bytes).

```php
public string $reason = ''
```

## Examples

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\WebSocket\CloseFrame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    $closeFrame = new CloseFrame();
    $closeFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE;
    $closeFrame->code = SWOOLE_WEBSOCKET_CLOSE_NORMAL;
    $server->push($frame->fd, $closeFrame);
    $server->close($frame->fd);
});
$server->start();
```