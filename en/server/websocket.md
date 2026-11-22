# WebSocket Server

You can create a WebSocket server by instantiating `Swoole\WebSocket\Server`.

`Swoole\WebSocket\Server`, `Swoole\WebSocket\Frame`, and `Swoole\WebSocket\CloseFrame` together form the complete WebSocket server system.

Among them, the [Frame object](/en/server/class/frame.html) encapsulates the data frames sent by the client, while the [CloseFrame object](/en/server/class/close_frame.html) represents a close frame, used to handle connection-closing logic. The following is a simple example showing their basic usage.

> [!NOTE]
> `Swoole\WebSocket\Server` is a subclass of [`Swoole\Http\Server`](/en/server/http.html).

## Examples

### Example 1: Creating a Simple WebSocket Server

Listen on port `9501` of `127.0.0.1` on the server to implement a basic WebSocket server:

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $response = new Frame();
  $response->data = $frame->data;
  $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
  $response->finish = true;
  
  $server->push($frame->fd, $response);
});

$server->start();
```

**Testing the server**

Open another terminal and send a WebSocket request using `uwsc`:

```bash
uwsc ws://127.0.0.1:9501/
```

Type Hello Swoole and press Enter; you will see the terminal output:

```
Server message: 'Hello Swoole'
```

### Example 2: Creating a Simple WebSocket Server That Sends Continuation Frames

Listen on port `9501` of `127.0.0.1` on the server and send continuation frames to the client:

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $response = new Frame();
  
  for ($i = 0; $i < 100; $i++) {
    $response->data = base64_encode(random_bytes(200));
    if ($i == 0) {
      $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    } else {
      $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
    }
    
    $response->finish = $i == 99;
    $server->push($frame->fd, $response);
  }
});

$server->start();
```

**Testing the server**

Open another terminal and send a WebSocket request using `uwsc`:

```bash
uwsc ws://127.0.0.1:9501/
```

Type any message and press Enter; you will see the terminal output:

```
Server message: a large amount of random data
```

### Example 3: Handling HTTP Requests with a WebSocket Server

When starting a WebSocket service listening on `127.0.0.1:9501`, since `Swoole\WebSocket\Server` inherits from `Swoole\Http\Server`, the service can handle both WebSocket connections and ordinary HTTP requests at the same time.

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, $frame->data);
});

$server->on('request', function(Request $request, Response $response) {
  $response->end("<h1>Hello World</h1>");
});

$server->start();
```

**Testing the server**

Open another terminal and send an HTTP request using `curl`:

```bash
curl http://127.0.0.1:9501/
```

You will see the terminal output:

```
<h1>Hello Swoole</h1>
```