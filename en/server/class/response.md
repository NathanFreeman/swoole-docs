# Swoole\Http\Response

- `Swoole\Http\Response` is the object used for the **HTTP server** in Swoole, mainly responsible for sending HTTP responses to the client.
- You can think of it this way: when the `Swoole` server receives a request, it automatically creates a `Response` object, and you use this object's methods to control the content returned to the browser (status code, headers, body, etc.).

## Properties

### fd

The file descriptor of the current connection.

```php
public int $fd
```

### socket

When creating a new `Response` object with the [create method](/en/server/class/response.html#create), if the first argument passed is a [`Swoole\Coroutine\Socket`](/en/client/socket.html) object, this property stores that object.

```php
public Swoole\Coroutine\Socket $socket
```

### header

The `HTTP` response header array.

```php
public array $header
```

> [!TIP]
> There are two equivalent ways to set response headers: one is to call the [header method](/en/server/class/response.html#header-1), and the other is to assign directly to the `header` property.

### cookie

The `HTTP` response `cookie` array.

```php
public array $cookie
```

> [!TIP]
> There are two equivalent ways to set a `cookie`: one is to call the [cookie method](/en/server/class/response.html#cookie-1) or [rawcookie](/en/server/class/response.html#rawcookie), and the other is to assign directly to the `cookie` property.

### trailer

Stores additional header information `(Trailer Header)` appended after the body `(Body)` of the `HTTP` response.

```php
public array $trailer
```

> [!TIP]
> There are two equivalent ways to set `$trailer`: one is to call the [trailer method](/en/server/class/response.html#trailer-1), and the other is to assign directly to the `trailer` property.

## Methods

### write

Sends the `HTTP` response content to the client in chunks, supporting streaming; suitable for scenarios such as serving large files or pushing real-time data.

```php
public function write(string $content): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$content` | The data content to send; the maximum length must not exceed `2M`, controlled by the `buffer_output_size` configuration option | Required |

**Return value**: Returns `true` on success; returns `false` on failure or if the connection context does not exist.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->write('Hello ');
    $response->write('World!');
    $response->end(); // End the transfer
});
$server->start();
```

> [!WARNING]
> - After sending data in segments with `write`, the [end](/en/server/class/response.html#end) method will not accept any arguments; calling `end` only sends a `Chunk` of length `0` to indicate that the data transfer is complete.
> - If `Content-Length` was set via the [header method](/en/server/class/response.html#header-1) and then this method is called, `Swoole` ignores the `Content-Length` setting and emits a warning.
> - `Http2` cannot use this function; otherwise a warning is emitted.
> - If the client supports response compression, `write` forcibly disables compression.

### end

Sends the `Http` response body and ends the request handling.

```php
public function end(?string $content = null): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$content` | The data content to send; the maximum length must not exceed `2M`, controlled by the `buffer_output_size` configuration option | `null` |

**Return value**: Returns `true` on success; returns `false` on failure or if the connection context does not exist.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->end('Hello World');
});
$server->start();
```

### sendfile

Sends a file to the client.

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | The name of the file to send; `sendfile` fails if the file does not exist or is not accessible | Required |
| `$offset` | The offset of the file to upload; you can specify starting the transfer from the middle of the file, which can be used to support resumable transfers | `0` |
| `$length` | The size of the data to send | The size of the file |

**Return value**: Returns `true` on success; returns `false` on failure or if the connection context does not exist.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->sendfile(__FILE__);
});
$server->start();
```

> [!WARNING]
> - The underlying layer cannot infer the MIME type of the file to send, so the application code must specify `Content-Type`.
> - The `write` method must not be used to send an `Http-Chunk` before calling `sendfile`.
> - After `sendfile` is called, the underlying layer automatically executes `end`.
> - `sendfile` does not support `gzip` compression.

### redirect

Sends an `Http` redirect. Calling this method automatically calls `end` to send and finish the response.

```php
public function redirect(string $location, int $http_code = 302): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$location` | The new address to redirect to, sent as the `Location` header | Required |
| `$http_code` | The status code; defaults to `302` temporary redirect, pass `301` for a permanent redirect | `302` |

**Return value**: Returns `true` on success; returns `false` on failure or if the connection context does not exist.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->redirect("https://www.baidu.com");
});
$server->start();
```

### cookie

The `COOKIE` information carried by the `HTTP` response, in key-value array format.

```php
public function cookie(\Swoole\Http\Cookie|string $name_or_object, string $value = '', int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httponly = false, string $samesite = '', string $priority = '', bool $partitioned = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name_or_object` | The `Key` of the `Cookie` | Required |
| `$value` | The `value` of the `Cookie` | `''` |
| `$expires` | The expiration time of the `Cookie` | `0`, never expires |
| `$path` | Specifies the server path of the cookie | `/` |
| `$domain` | Specifies the domain of the cookie | `''` |
| `$secure` | Specifies whether the cookie is transmitted only over a secure HTTPS connection | `false` |
| `$httponly` | Whether the browser's JavaScript is allowed to access the cookie with the HttpOnly attribute; `true` means not allowed, `false` means allowed | `false` |
| `$samesite` | Restricts third-party cookies to reduce security risks; possible values are `Strict`, `Lax`, `None` | `''` |
| `$priority` | The cookie priority; when the number of cookies exceeds the limit, low-priority ones are deleted first; possible values are `Low`, `Medium`, `High` | `''` |
| `$partitioned` | Makes a third-party `Cookie` no longer shared across all websites, but bound to the specific site where it was originally set (the "top-level site"), effectively preventing cross-site tracking while preserving necessary functionality; other value: `true` | `false` |

**Return value**: Returns `false` if setting fails; returns `true` if setting succeeds.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Http\Cookie;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $cookie = new Cookie();
    $cookie->withName('key1')
        ->withValue('val1')
        ->withExpires(time() + 84600)
        ->withPath('/')
        ->withDomain('id.test.com')
        ->withSecure(true)
        ->withHttpOnly(true)
        ->withSameSite('None')
        ->withPriority('High')
        ->withPartitioned(true);
            
    $response->cookie($cookie);
    $response->cookie('key2', 'value2', time() + 84600, '/', '', true, true, 'None', 'High', true);
    $response->end('Hello World');
});
$server->start();
```

> [!IMPORTANT]
> - `cookie` must be set before the [end](/en/server/class/response.html#end) method.
> - `Swoole` automatically applies `urlencode` encoding to `$value`; you can use the `rawcookie()` method to disable encoding of `$value`.
> - `Swoole` allows setting multiple `COOKIE`s with the same `$key`.
> - It is recommended to use [Swoole\Http\Cookie](/en/server/class/cookie.html) as the first argument of the method; this makes configuration simpler without having to set the remaining arguments.

### rawcookie

Sets the `cookie` information of the `HTTP` response, but does not encode the `value`.

```php
public function rawcookie(\Swoole\Http\Cookie|string $name_or_object, string $value = '', int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httponly = false, string $samesite = '', string $priority = '', bool $partitioned = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The `Key` of the `Cookie` | Required |
| `$value` | The `value` of the `Cookie` | `''` |
| `$expires` | The expiration time of the `Cookie` | `0`, never expires |
| `$path` | Specifies the server path of the cookie | `/` |
| `$domain` | Specifies the domain of the cookie | `''` |
| `$secure` | Specifies whether the cookie is transmitted only over a secure HTTPS connection | `false` |
| `$httponly` | Whether the browser's JavaScript is allowed to access the cookie with the HttpOnly attribute; `true` means not allowed, `false` means allowed | `false` |
| `$samesite` | Restricts third-party cookies to reduce security risks; possible values are `Strict`, `Lax`, `None` | `''` |
| `$priority` | The cookie priority; when the number of cookies exceeds the limit, low-priority ones are deleted first; possible values are `Low`, `Medium`, `High` | `''` |
| `$partitioned` | Makes a third-party `Cookie` no longer shared across all websites, but bound to the specific site where it was originally set (the "top-level site"), effectively preventing cross-site tracking while preserving necessary functionality; other value: `true` | `false` |

**Return value**: Returns `false` if setting fails; returns `true` if setting succeeds.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Http\Cookie;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $cookie = new Cookie();
    $cookie->withName('key1')
        ->withValue('val1')
        ->withExpires(time() + 84600)
        ->withPath('/')
        ->withDomain('id.test.com')
        ->withSecure(true)
        ->withHttpOnly(true)
        ->withSameSite('None')
        ->withPriority('High')
        ->withPartitioned(true);
            
    $response->rawcookie($cookie);
    $response->rawcookie('key2', 'value2', time() + 84600, '/', '', true, true, 'None', 'High', true);
    $response->end('Hello World');
});
$server->start();
```

> [!IMPORTANT]
> - `rawcookie` must be set before the [end](/en/server/class/response.html#end) method.
> - `Swoole` allows setting multiple `COOKIE`s with the same `$key`.
> - It is recommended to use [Swoole\Http\Cookie](/en/server/class/cookie.html) as the first argument of the method; this makes configuration simpler without having to set the remaining arguments.

### header

The header information of the `HTTP` response. The type is an array, and all `key`s are lowercase.

```php
public function header(string $key, string|array $value, bool $format = true): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `Key` of the `HTTP` header | Required |
| `$value` | The `value` of the `HTTP` header | Required |
| `$format` | Whether to format the `Key` according to `HTTP` conventions; the default `true` formats it automatically | `true` |

**Return value**: Returns `false` if setting fails; returns `true` if setting succeeds.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->header('Content-Type', 'text/html');
    $response->end("Hello World");
});
$server->start();
```

> [!WARNING]
> - `header` must be set before the `end` method.
> - `$key` must fully comply with `HTTP` conventions: each word capitalized, no Chinese characters, underscores, or other special characters; `$value` cannot be empty.
> - Setting the same `$key` repeatedly is supported, and `$value` supports multiple types such as `array`, `object`, `int`, `float`; the underlying layer performs a `toString` conversion and removes trailing spaces and newlines.
> - If the client sets `Accept-Encoding`, the server must not set a `Content-Length` response; when `Swoole` detects this, it ignores the `Content-Length` value and emits a warning.
> - After setting a `Content-Length` response, [write](/en/server/class/response.html#write) must not be called; when `Swoole` detects this, it ignores the `Content-Length` value and emits a warning.

### isWritable

Checks whether the `Swoole\Http\Response` object has been ended (`end`) or detached (`detach`).

```php
public function isWritable(): bool
```

**Return value**: Returns `true` if the `Swoole\Http\Response` object has not been ended or detached; otherwise returns `false`.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) {
    var_dump($response->isWritable()); // true
    $response->end('hello');
    var_dump($response->isWritable()); // false
    $response->setStatusCode(403); // http response is unavailable (maybe it has been ended or detached)
});

$http->start();
```

### status

Sets the `HTTP` response status code. The alias is `setStatusCode`.

```php
public function status(int $http_code, string $reason = ''): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$http_code` | Sets the `HttpCode` | Required |
| `$reason` | The reason phrase of the status code | `''` |

**Return value**: Returns `false` if setting fails; returns `true` if setting succeeds.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) {
    $response->setStatusCode(200);
    $response->end('hello');
});

$http->start();
```

> [!IMPORTANT]
> - `status` must be set before the [end](/en/server/class/response.html#end) method.
> - If only the first argument `$http_code` is passed, it must be a valid `HttpCode`, such as `200`, `502`, `301`, `404`, etc.; otherwise the status code is set to `200`.
> - If the second argument `$reason` is set, `$http_code` can be any numeric value, including undefined `HttpCode`s such as `499`.

### detach

Detaches the response object. After using this method, the `Swoole\Http\Response` object will not automatically execute the [end](/en/server/class/response.html#end) method when it is destroyed; used together with [create](/en/server/class/response.html#create).

```php
public function detach(): bool
```

**Return value**: Returns `true` on success; returns `false` on failure or if the connection context does not exist.

**Example**

- Cross-process response.

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();
    $http->task((string) $response->fd);
});

$http->on('finish', function () {
      echo "task finish";
});

$http->on('task', function (Server $serv, int $task_id, int $worker_id, int $data) {
    var_dump($data);
    $resp = Response::create($data);
    $resp->end("in task");
    echo "async task\n";
});

$http->start();
```

- In certain special scenarios, you need to send special response content to the client.

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();
    $http->send($response->fd, "HTTP/1.1 200 OK\r\nServer: server\r\n\r\nHello World\n");
});

$http->start();
```

### create

Constructs a new `Swoole\Http\Response` object.

```php
public static function create(object|array|int $server = -1, int $fd = -1): Response|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$server` | A [`Swoole\Server`](/en/server/tcp_udp.html) or `Swoole\Coroutine\Socket` object, an array, or a file descriptor | `-1` |
| `$fd` | The file descriptor. If the `$server` argument is a `Swoole\Server` object, `$fd` is required | `-1` |

**Return value**: On success, returns a new `Swoole\Http\Response` object; on failure, returns `false`.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\Socket;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();  // detach must be executed
    $newResponse = Response::create($response->fd);  // You can pass a file descriptor to create a new Response object
    $newResponse = Response::create($http);  // You can pass a `Swoole\Server` or its subclass to create a new Response object
    $newResponse = Response::create([$http, $response]);  // You can pass an array: the first element is a `Swoole\Server` or its subclass, the second is a Response object
    
    $socket = new Socket(AF_INET, SOCK_STREAM, IPPROTO_IP);
    $socket->connect('127.0.0.1', 9501);
    $newResponse = Response::create($socket); // You can pass a Swoole\Coroutine\Socket object to create a new Response object
    $newResponse->end('Hello World');
});

$http->start();
```

### upgrade

Upgrades the `Http` coroutine server to a `WebSocket` coroutine server.

```php
public function upgrade(): bool
```

**Return value**: Returns `true` on success; returns `false` on failure.

> [!IMPORTANT]
> Can only be used with the [HTTP/WebSocket coroutine server](/en/server/coroutine/http.html).

### push

Sends data to the client from a `WebSocket` coroutine server.

```php
public function push(\Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data content to send | Required |
| `$opcode` | Specifies the format of the data content to send; defaults to text. To send binary content, the `$opcode` argument must be set to `SWOOLE_WEBSOCKET_OPCODE_BINARY`; other values: `SWOOLE_WEBSOCKET_OPCODE_BINARY`, `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | Flag bits; other values: `SWOOLE_WEBSOCKET_FLAG_RSV1`, `SWOOLE_WEBSOCKET_FLAG_RSV2`, `SWOOLE_WEBSOCKET_FLAG_RSV3`, `SWOOLE_WEBSOCKET_FLAG_MASK`, `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**Return value**: Returns `true` on success; returns `false` on failure.

**Supported opcodes**

| Constant | Meaning | Description |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_OPCODE_TEXT` | Text frame | Carries UTF-8 text data |
| `SWOOLE_WEBSOCKET_OPCODE_BINARY` | Binary frame | Carries binary data |
| `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | Continuation frame | Used for subsequent frames of a fragmented message |
| `SWOOLE_WEBSOCKET_OPCODE_CLOSE` | Close frame | Indicates the connection is closing |
| `SWOOLE_WEBSOCKET_OPCODE_PING` | Ping frame | Heartbeat detection request |
| `SWOOLE_WEBSOCKET_OPCODE_PONG` | Pong frame | Heartbeat detection response |

**Supported flags**

| Constant | Meaning | Description |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_FLAG_FIN` | Finish flag | Indicates whether the current frame is the last frame of the message |
| `SWOOLE_WEBSOCKET_FLAG_RSV1` | RSV1 flag | Reserved bit 1 for protocol extensions, usually used for compression (e.g. Per-Message Deflate) |
| `SWOOLE_WEBSOCKET_FLAG_RSV2` | RSV2 flag | Reserved bit 2 for protocol extensions |
| `SWOOLE_WEBSOCKET_FLAG_RSV3` | RSV3 flag | Reserved bit 3 for protocol extensions |
| `SWOOLE_WEBSOCKET_FLAG_MASK` | Mask flag | Indicates whether the data payload is masked (must be set for client-to-server data) |
| `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | Compression flag | Indicates whether the data of the current frame is compressed (usually used together with RSV1) |

**Example**

- Send a single data frame without compression

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data = new Frame();
        $data->data = 'Hello World';
        $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $data->finish = true;
        $response->push($data);
    });
    $server->start();
});
```

- Send a compressed data frame

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->set([
        'websocket_compression' => true  // Enable frame compression
    ]);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data = new Frame();
        $data->data = 'Hello World';
        $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $data->finish = true;
        $response->push($data);
    });
    $server->start();
});
```

- Send continuation frames without compression

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        // Send continuation frames,
        $data = new Frame();
        
        for ($i = 0; $i < 100; $i++) {
          $data->data = base64_encode(random_bytes(200));
          if ($i == 0) {
            // The first frame must be set to SWOOLE_WEBSOCKET_OPCODE_TEXT or SWOOLE_WEBSOCKET_OPCODE_BINARY
            $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
          } else {
            // Subsequent frames must be set to SWOOLE_WEBSOCKET_OPCODE_CONTINUATION
            $data->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
          }
          
          $data->finish = $i == 99;  // All frames except the last one must be false; only the last frame is set to true
          $response->push($data);
        }
    });
    $server->start();
});
```

- Compress the data first, then send continuation frames

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->set([
        'websocket_compression' => true  // Enable frame compression
    ]);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data1 = bin2hex(random_bytes(10 * 1024));
        $data2 = bin2hex(random_bytes(20 * 2048));
        $data3 = bin2hex(random_bytes(40 * 4096));
    
        $context = deflate_init(ZLIB_ENCODING_RAW);
        // Since the underlying layer does not know how many chunks the compressed data frame needs to be split into, this step must be implemented by the user
        // The first frame must manually set finish to false and flags to SWOOLE_WEBSOCKET_FLAG_COMPRESS and SWOOLE_WEBSOCKET_FLAG_RSV1, and must not set SWOOLE_WEBSOCKET_FLAG_FIN, indicating that this is a compressed data frame
        $frame = new Frame();
        $frame->data = deflate_add($context, $data1, ZLIB_SYNC_FLUSH);
        $frame->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $frame->flags = SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1;
        $frame->finish = false;
        $response->push($frame);
        
        // The remaining continuation frames must set opcode to SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, flags to 0, and finish to false
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $frame->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
        $frame->flags = 0;
        $frame->finish = false;
        $response->push($frame);
        
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $response->push($frame);
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $response->push($frame);
        
        // The last continuation frame must set finish to true and flags to SWOOLE_WEBSOCKET_FLAG_FIN, indicating that the data has been fully sent
        $frame->data = deflate_add($context, $data3, ZLIB_SYNC_FLUSH);
        $frame->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
        $frame->finish = true;
        $response->push($frame);
    });
    $server->start();
});
```

- Send control frames (`ping`, `pong`, and `close`)

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\WebSocket\CloseFrame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $pingFrame = new Frame;
        $pingFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_PING;
        $response->push($pingFrame);
        
        $pongFrame = new Frame;
        $pongFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_PONG;
        $response->push($pongFrame);
        
        $closeFrame = new CloseFrame();
        $closeFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE;
        $closeFrame->code = SWOOLE_WEBSOCKET_CLOSE_NORMAL;
        $response->push($closeFrame);
    });
    $server->start();
});
```

> [!WARNING]
> - Can only be used with the [HTTP/WebSocket coroutine server](/en/server/coroutine/http.html).
> - When using [`Swoole\WebSocket\Frame`](/en/server/class/frame.html) and [`Swoole\WebSocket\CloseFrame`](/en/server/class/close_frame.html), set `$data`, `$opcode`, and `$flags` through the object's **properties**; these three values in the **method arguments** are ignored.

### recv

Receives data sent by the `WebSocket` client.

```php
public function recv(float $timeout = 0): \Swoole\WebSocket\Frame|false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | The timeout duration | `0`, no timeout |

**Return value**: On success, returns a `Swoole\WebSocket\Frame` object; returns an empty string if the connection has been closed; returns `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                continue;
            }
            
            break;
        }
    });
    $server->start();
});
```

> [!TIP]
> Can only be used with the [HTTP/WebSocket coroutine server](/en/server/coroutine/http.html).

### close

Closes the `WebSocket` connection.

```php
public function close(): bool
```

**Return value**: Returns `true` on success; returns `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                continue;
            }
            
            $response->close();
        }
    });
    $server->start();
});
```

> [!WARNING]
> - This method directly cuts off the `TCP` connection without sending a close frame.
> - Can only be used with the [HTTP/WebSocket coroutine server](/en/server/coroutine/http.html).

### disconnect

Disconnects the `WebSocket` connection. This method sends a close frame and then closes the connection gracefully.

```php
public function disconnect(int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$code` | The status code for closing the connection; according to `RFC6455`, application close status codes range from `1000` or between `4000-4999` | `SWOOLE_WEBSOCKET_CLOSE_NORMAL` |
| `$reason` | The reason for closing the connection, a `utf-8` string no longer than `125` bytes | None |

**Return value**: Returns `true` if sending succeeds; returns `false` if sending fails or the status code is invalid.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                continue;
            }
            
            $response->disconnect();
        }
    });
    $server->start();
});
```

> [!WARNING]
> - Use `disconnect` to close a `WebSocket` connection; this method automatically sends a `close` frame to the client and closes the connection.
> - Can only be used with the [HTTP/WebSocket coroutine server](/en/server/coroutine/http.html).

**Supported status codes**

| Status code constant                      | Description                               |
|-------------------------------------------|-------------------------------------------|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL             | **Normal closure** - the connection has finished its work and ends normally |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY         | **Going away** - the endpoint is leaving (e.g. browser navigation or page close) |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR     | **Protocol error** - the endpoint received data that does not conform to the WebSocket protocol |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR         | **Data type error** - received a data type that cannot be processed (e.g. an endpoint that only accepts text received binary) |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR       | **Invalid status code** - a status code was expected but not received (this code is not actually sent; used by applications) |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL           | **Abnormal closure** - the connection dropped unexpectedly (e.g. dropped without receiving a close frame; not sent actively) |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR      | **Message format error** - received a message that does not conform to the specification (e.g. UTF-8 encoding errors) |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR       | **Policy violation** - the message violates server policy (a generic rejection reason) |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG    | **Message too big** - the message length exceeds what the endpoint is willing to process |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING  | **Missing extension** - the client expected the server to negotiate a specific extension, but the server did not offer it (client-only) |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR       | **Internal server error** - the server encountered an unexpected condition that prevented it from fulfilling the request |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER    | **Try again later** - the server is temporarily overloaded or under maintenance; reconnect later |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY        | **Bad gateway** - the gateway or proxy received an invalid upstream response |
| SWOOLE_WEBSOCKET_CLOSE_TLS                | **TLS handshake failure** - closed before the TLS handshake completed (not sent actively) |

### ping

Sends a `WebSocket` heartbeat packet to the client.

```php
public function ping(string $data = ''): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data carried by the `ping` frame | `''` |

**Return value**: Returns `true` if sending succeeds; returns `false` if sending fails.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9501);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
                $response->ping();
                continue;
            }
            
            $response->disconnect();
        }
    });
    $server->start();
});
```

> [!WARNING]
> - Unless [open_websocket_pong_frame](/en/server/setting.html#open-websocket-pong-frame) is set to `true`, `pong` frames sent by the client are handled automatically by the underlying layer.
> - Can only be used with the [HTTP/WebSocket coroutine server](/en/server/coroutine/http.html).

### goaway

Sends a `GOAWAY` frame to the client, notifying it that the connection is about to close and allowing existing requests to be processed gracefully.

```php
public function goaway(int $error_code = SWOOLE_HTTP2_ERROR_NO_ERROR, string $debug_data = ''): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$error_code` | The `HTTP/2` error code, used to explain the reason for closing the connection | `SWOOLE_HTTP2_ERROR_NO_ERROR` |
| `$debug_data` | Optional debug data, included in the `GOAWAY` packet sent | `''` |

**Return value**: Returns `true` if sending succeeds; returns `false` if sending fails.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9090, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
$server->set([
    'worker_num' => 1,
    'ssl_cert_file' =>  '/server.crt', 
    'ssl_key_file' =>  '/server.key',
    'open_http2_protocol' => true  // HTTP/2 must be enabled
]);

$server->on('request', function(Request $request, Response $response) {
    // Send a GOAWAY frame to notify the client to close the connection
    $response->goaway(SWOOLE_HTTP2_ERROR_NO_ERROR, 'Server shutting down');
    $response->end('Goodbye!');
});

$server->start();
```

| Constant | Definition |
| :--- | :--- |
| SWOOLE_HTTP2_ERROR_NO_ERROR | No error (usually used to close the connection gracefully) |
| SWOOLE_HTTP2_ERROR_PROTOCOL_ERROR | Protocol error (an unspecified protocol error was detected) |
| SWOOLE_HTTP2_ERROR_INTERNAL_ERROR | Internal error (the endpoint encountered an unexpected internal error) |
| SWOOLE_HTTP2_ERROR_FLOW_CONTROL_ERROR | Flow control error (the peer violated the flow control protocol) |
| SWOOLE_HTTP2_ERROR_SETTINGS_TIMEOUT | Settings timeout (a SETTINGS frame was sent but no response was received in time) |
| SWOOLE_HTTP2_ERROR_STREAM_CLOSED | Stream closed (a frame was received after the stream was half-closed) |
| SWOOLE_HTTP2_ERROR_FRAME_SIZE_ERROR | Frame size error (the received frame has an invalid size or exceeds the maximum size) |
| SWOOLE_HTTP2_ERROR_REFUSED_STREAM | Refused stream (the stream was refused before any application processing was performed) |
| SWOOLE_HTTP2_ERROR_CANCEL | Cancel (indicates that the specified stream is no longer needed) |
| SWOOLE_HTTP2_ERROR_COMPRESSION_ERROR | Compression error (unable to maintain the header compression context for the connection) |
| SWOOLE_HTTP2_ERROR_CONNECT_ERROR | Connect error (the connection established for a CONNECT request was reset or abnormally closed) |
| SWOOLE_HTTP2_ERROR_ENHANCE_YOUR_CALM | Enhance your calm (the remote peer was detected exhibiting behavior that may generate excessive load) |
| SWOOLE_HTTP2_ERROR_INADEQUATE_SECURITY | Inadequate security (the underlying transport has properties that do not meet minimum security requirements) |
| SWOOLE_HTTP2_ERROR_HTTP_1_1_REQUIRED | HTTP/1.1 required (HTTP/1.1 is required instead of HTTP/2) |

> [!TIP]
> Can only be used with the [HTTP2 server](/en/server/http.html).

### trailer

Used to append additional header information `(Trailer Header)` after the body `(Body)` of the `HTTP` response. It is typically used to add metadata (such as a content checksum, signature, or gRPC status code) after dynamic content has been generated and sent.

```php
public function trailer(string $key, string $value): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The key name of the `HTTP` header | Required |
| `$value` | The value of the `HTTP` header | Required |

**Return value**: Returns `true` if sending succeeds; returns `false` if sending fails.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9090);
$server->on('request', function(Request $request, Response $response) {
    $response->write('Hello, ');
    $response->write('World!');
    $response->trailer('Content-MD5', md5('Hello, World!'));
    $response->trailer('X-Process-Time', microtime(true));
    $response->end();
});

$server->start();
```

> [!WARNING]
> - Setting a trailer with the same `$key` repeatedly **overwrites** the previous value.
> - When the response body is large and needs to be sent as it is generated, a `Content-MD5` or `Digest` header can be appended at the end for integrity verification.