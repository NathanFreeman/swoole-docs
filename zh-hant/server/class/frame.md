# Swoole\WebSocket\Frame

`Swoole\WebSocket\Frame` 是 `Swoole` 中用於表示 `WebSocket` 數據幀的對象。在 `WebSocket` 連接建立後，客戶端和服務器之間通過“幀”（Frame）來傳遞消息，你可以把它理解爲一個 `包裹`，裏面封裝了一次通信的具體內容和元信息。

這個對象通常在服務器的 [`message`](/zh-hant/server/events.html#message) 事件回調中作爲參數出現。當服務器收到客戶端發來的消息時，會自動創建一個 `Frame` 對象，你可以通過它來獲取消息內容和客戶端信息。

## 屬性

### fd

當前連接的文件描述符

```php
public int $fd
```

### data

消息的正文內容，通常是客戶端發送的文本或二進制數據

```php
public string $data
```

### opcode

數據類型，用於指示 `data` 是文本、二進制還是控制幀。

```php
public int $opcode
```

### flags

幀的屬性。

```php
public int $flags
```

### finish

幀是否完整。如果一條大消息被拆分成多個幀發送，最後一個幀的 `finish` 爲 `true`。

```php
public bool $finish
```

> [!IMPORTANT]
> 由於 `Swoole` 底層已自動處理連續幀的接收與拼接，因此回調中交付的 `Swoole\WebSocket\Frame` 對象始終是完整的，其 `$finish` 屬性恆爲 `true`。

## 方法

### pack

將數據打包成一個 `WebSocket` 數據包。

```php
public static function pack(\Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 消息內容 | 必填 |
| `$opcode` | 指定發送數據內容的格式，默認爲文本。發送二進制內容時 `$opcode` 參數需要設置爲 `SWOOLE_WEBSOCKET_OPCODE_BINARY`（其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY`） | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 幀的屬性 | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：返回打包好的 `WebSocket` 數據包。

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

將 `WebSocket` 數據包解包成 `Swoole\WebSocket\Frame` 對象。

```php
public static function unpack(string $data): \Swoole\WebSocket\Frame
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 需要解包的數據 | 必填 |

**返回值**：返回解包好的 `Swoole\WebSocket\Frame` 對象。

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
