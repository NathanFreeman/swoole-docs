# Swoole\WebSocket\Frame

`Swoole\WebSocket\Frame` is the object used in `Swoole` to represent a `WebSocket` data frame. After a `WebSocket` connection is established, the client and server exchange messages via "frames". You can think of a frame as a `package` that encapsulates the content and metadata of a single communication.

This object usually appears as a parameter in the server's [`message`](/en/server/events.html#message) event callback. When the server receives a message from a client, a `Frame` object is created automatically, and you can use it to obtain the message content and client information.

## Properties

### fd

The file descriptor of the current connection.

```php
public int $fd
```

### data

The body content of the message, usually text or binary data sent by the client.

```php
public string $data
```

### opcode

The data type, indicating whether `data` is text, binary, or a control frame.

```php
public int $opcode
```

### flags

The attributes of the frame.

```php
public int $flags
```

### finish

Whether the frame is complete. If a large message is split into multiple frames for sending, the `finish` of the last frame is `true`.

```php
public bool $finish
```

> [!IMPORTANT]
> Since `Swoole` automatically handles receiving and reassembling continuation frames at the underlying layer, the `Swoole\WebSocket\Frame` object delivered in the callback is always complete, and its `$finish` property is always `true`.

## Methods

### pack

Packs data into a `WebSocket` packet.

```php
public static function pack(\Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | Message content | Required |
| `$opcode` | Specifies the format of the data content being sent; text by default. When sending binary content, the `$opcode` parameter must be set to `SWOOLE_WEBSOCKET_OPCODE_BINARY` (other value: `SWOOLE_WEBSOCKET_OPCODE_BINARY`) | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | The attributes of the frame | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**Return value**: Returns the packed `WebSocket` packet.

**Example**

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    $data = new Frame();
    $data->data = 'Hello World';
    $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    $data->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
    $data->finish = true;
    $server->send($frame->fd, Frame::pack($data));
});
$server->start();
```

### unpack

Unpacks a `WebSocket` packet into a `Swoole\WebSocket\Frame` object.

```php
public static function unpack(string $data): \Swoole\WebSocket\Frame
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to unpack | Required |

**Return value**: Returns the unpacked `Swoole\WebSocket\Frame` object.

**Example**

```php
<?php
use Swoole\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    $frame = Frame::unpack($data);
    var_dump($frame instanceof Frame);
    $server->send($fd, $data);
});
$server->start();
```