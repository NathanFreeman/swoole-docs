# Swoole\WebSocket\Frame

`Swoole\WebSocket\Frame` 是 `Swoole` 中用于表示 `WebSocket` 数据帧的对象。在 `WebSocket` 连接建立后，客户端和服务器之间通过“帧”（Frame）来传递消息，你可以把它理解为一个 `包裹`，里面封装了一次通信的具体内容和元信息。

这个对象通常在服务器的 [`message`](/zh/server/events.html#message) 事件回调中作为参数出现。当服务器收到客户端发来的消息时，会自动创建一个 `Frame` 对象，你可以通过它来获取消息内容和客户端信息。

## 属性

### fd

当前连接的文件描述符

```php
public int $fd
```

### data

消息的正文内容，通常是客户端发送的文本或二进制数据

```php
public string $data
```

### opcode

数据类型，用于指示 `data` 是文本、二进制还是控制帧。

```php
public int $opcode
```

### flags

帧的属性。

```php
public int $flags
```

### finish

帧是否完整。如果一条大消息被拆分成多个帧发送，最后一个帧的 `finish` 为 `true`。

```php
public bool $finish
```

> [!IMPORTANT]
> 由于 `Swoole` 底层已自动处理连续帧的接收与拼接，因此回调中交付的 `Swoole\WebSocket\Frame` 对象始终是完整的，其 `$finish` 属性恒为 `true`。

## 方法

### pack

将数据打包成一个 `WebSocket` 数据包。

```php
public static function pack(\Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 消息内容 | 必填 |
| `$opcode` | 指定发送数据内容的格式，默认为文本。发送二进制内容时 `$opcode` 参数需要设置为 `SWOOLE_WEBSOCKET_OPCODE_BINARY`（其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY`） | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 帧的属性 | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：返回打包好的 `WebSocket` 数据包。

**示例**

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

将 `WebSocket` 数据包解包成 `Swoole\WebSocket\Frame` 对象。

```php
public static function unpack(string $data): \Swoole\WebSocket\Frame
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 需要解包的数据 | 必填 |

**返回值**：返回解包好的 `Swoole\WebSocket\Frame` 对象。

**示例**

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
