# Swoole\Http\Response

- `Swoole\Http\Response` 是 Swoole 中用于 **HTTP 服务端** 的对象，主要负责向客户端发送 HTTP 响应。
- 你可以把它理解为：当 `Swoole` 服务器收到请求后，会自动创建一个 `Response` 对象，你用这个对象的方法来控制返回给浏览器的内容（状态码、Header、Body 等）。

## 属性

### fd

当前连接的文件描述符。

```php
public int $fd
```

### socket

使用 [create 方法](/zh/server/class/response.html#create) 创建新的 `Response` 对象时候，如果第一个参数传入的是 [`Swoole\Coroutine\Socket`](/zh/client/socket.html) 对象时，会用这个属性保存这个对象。

```php
public Swoole\Coroutine\Socket $socket
```

### header

`HTTP` 响应头数组。

```php
public array $header
```

> [!TIP]
> 设置响应头有两种等效方式：一是调用 [header 方法](/zh/server/class/response.html#header-1)，二是直接给 `header` 属性赋值。

### cookie

`HTTP` 响应 `cookie` 数组。

```php
public array $cookie
```

> [!TIP]
> 设置 `cookie` 有两种等效方式：一是调用 [cookie 方法](/zh/server/class/response.html#cookie-1) 或者 [rawcookie](/zh/server/class/response.html#rawcookie)，二是直接给 `cookie` 属性赋值。

### trailer

保存 `HTTP` 响应的主体 `（Body）` 之后追加额外的头信息 `（Trailer Header）`。

```php
public array $trailer
```

> [!TIP]
> 设置 `$trailer` 有两种等效方式：一是调用 [trailer 方法](/zh/server/class/response.html#trailer-1)，二是直接给 `trailer` 属性赋值。

## 方法

### write

将 `HTTP` 响应内容分块发送给客户端，支持流式传输，适用于大文件下发或实时数据推送等场景。

```php
public function write(string $content): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$content` | 要发送的数据内容，最大长度不得超过 `2M`，受 `buffer_output_size` 配置项控制 | 必填 |

**返回值**：调用成功，返回 `true`，调用失败或连接上下文不存在，返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $response->write('Hello ');
    $response->write('World!');
    $response->end(); // 结束传输
});
$server->start();
```

> [!WARNING]
> - 使用 `write` 分段发送数据后，[end](/zh/server/class/response.html#end) 方法将不接受任何参数，调用 `end` 只是会发送一个长度为 `0` 的 `Chunk` 表示数据传输完毕。
> - 如果通过 [header 方法](/zh/server/class/response.html#header-1) 设置了 `Content-Length`，然后又调用这个方法，`Swoole` 会忽略 `Content-Length` 的设置，并抛出一个警告。
> - `Http2` 不能使用这个函数，否则会抛出一个警告。
> - 如果客户端支持响应压缩，`write` 会强制关闭压缩。

### end

发送 `Http` 响应体，并结束请求处理。

```php
public function end(?string $content = null): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$content` | 要发送的数据内容，最大长度不得超过 `2M`，受 `buffer_output_size` 配置项控制 | `null` |

**返回值**：调用成功，返回 `true`，调用失败或连接上下文不存在，返回 `false`。

**示例**

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

发送文件到客户端。

```php
public function sendfile(Swoole\SendFile|string $filename, int $offset = 0, int $length = 0, bool $delete_file = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 要发送的文件名称，或一个 [Swoole\SendFile](/zh/server/class/send_file.html) 对象。文件不存在或没有访问权限时 `sendfile` 会失败 | 必填 |
| `$offset` | 上传文件的偏移量，可以指定从文件的中间部分开始传输数据，此特性可用于支持断点续传 | `0` |
| `$length` | 发送数据的尺寸 | 文件的尺寸 |
| `$delete_file` | 发送任务结束时是否自动删除文件。`v6.3.0` 版本之后可用 | `false` |

**返回值**：调用成功，返回 `true`，调用失败或连接上下文不存在，返回 `false`。

**示例**

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
> - 底层无法推断要发送文件的 MIME 格式，因此需要应用代码指定 `Content-Type`。
> - 调用 `sendfile` 前不得使用 `write` 方法发送 `Http-Chunk`。
> - 调用 `sendfile` 后底层会自动执行 `end`。
> - `sendfile` 不支持 `gzip` 压缩。
> - `$filename` 为 [Swoole\SendFile](/zh/server/class/send_file.html) 对象时，不得再传入 `$offset`、`$length`、`$delete_file` 参数，否则抛出 `ValueError`，发送选项以对象属性为准。
> - `$delete_file` 为 `true` 时，文件在发送任务结束时自动删除，包括发送失败或连接提前关闭的情况，适用于「先生成临时文件再发送」的场景。

### redirect

发送 `Http` 重定向跳转。调用此方法会自动 `end` 发送并结束响应。

```php
public function redirect(string $location, int $http_code = 302): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$location` | 跳转的新地址，作为 `Location` 头进行发送 | 必填 |
| `$http_code` | 状态码，默认为 `302` 临时跳转，传入 `301` 表示永久跳转 | `302` |

**返回值**：调用成功，返回 `true`，调用失败或连接上下文不存在，返回 `false`。

**示例**

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

`HTTP` 响应携带的 `COOKIE` 信息，格式为键值对数组。

```php
public function cookie(\Swoole\Http\Cookie|string $name_or_object, string $value = '', int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httponly = false, string $samesite = '', string $priority = '', bool $partitioned = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name_or_object` | `Cookie` 的 `Key` | 必填 |
| `$value` | `Cookie` 的 `value` | `''` |
| `$expires` | `Cookie` 的过期时间 | `0`，不过期 |
| `$path` | 规定 Cookie 的服务器路径 | `/` |
| `$domain` | 规定 Cookie 的域名 | `''` |
| `$secure` | 规定是否通过安全的 HTTPS 连接来传输 Cookie | `false` |
| `$httponly` | 是否允许浏览器的 JavaScript 访问带有 HttpOnly 属性的 Cookie，`true` 表示不允许，`false` 表示允许 | `false` |
| `$samesite` | 限制第三方 Cookie，从而减少安全风险，可选值为 `Strict`，`Lax`，`None` | `''` |
| `$priority` | Cookie 优先级，当 Cookie 数量超过规定，低优先级的会先被删除，可选值为 `Low`，`Medium`，`High` | `''` |
| `$partitioned` | 让第三方 `Cookie` 不再跨所有网站通用，而是绑定到它最初被设置时所在的那个特定网站（即“顶级站点”），从而在保留必要功能的同时，有效阻止跨站跟踪；其它值：`true` | `false` |

**返回值**：设置失败，返回 `false`，设置成功，返回 `true`。

**示例**

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
> - `cookie` 设置必须在 [end](/zh/server/class/response.html#end) 方法之前。
> - `Swoole` 会自动对 `$value` 进行 `urlencode` 编码，可使用 `rawcookie()` 方法关闭对 `$value` 的编码处理。
> - `Swoole` 允许设置多个相同 `$key` 的 `COOKIE`。
> - 推荐使用 [Swoole\Http\Cookie](/zh/server/class/cookie.html) 作为方法的第一个入参，这样设置起来简单，不用再设置方法的剩余参数。

### rawcookie

设置 `HTTP` 响应的 `cookie` 信息，但是不对 `value` 进行编码处理。

```php
public function rawcookie(\Swoole\Http\Cookie|string $name_or_object, string $value = '', int $expires = 0, string $path = '/', string $domain = '', bool $secure = false, bool $httponly = false, string $samesite = '', string $priority = '', bool $partitioned = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | `Cookie` 的 `Key` | 必填 |
| `$value` | `Cookie` 的 `value` | `''` |
| `$expires` | `Cookie` 的过期时间 | `0`，不过期 |
| `$path` | 规定 Cookie 的服务器路径 | `/` |
| `$domain` | 规定 Cookie 的域名 | `''` |
| `$secure` | 规定是否通过安全的 HTTPS 连接来传输 Cookie | `false` |
| `$httponly` | 是否允许浏览器的 JavaScript 访问带有 HttpOnly 属性的 Cookie，`true` 表示不允许，`false` 表示允许 | `false` |
| `$samesite` | 限制第三方 Cookie，从而减少安全风险，可选值为 `Strict`，`Lax`，`None` | `''` |
| `$priority` | Cookie 优先级，当 Cookie 数量超过规定，低优先级的会先被删除，可选值为 `Low`，`Medium`，`High` | `''` |
| `$partitioned` | 让第三方 `Cookie` 不再跨所有网站通用，而是绑定到它最初被设置时所在的那个特定网站（即“顶级站点”），从而在保留必要功能的同时，有效阻止跨站跟踪；其它值：`true` | `false` |

**返回值**：设置失败，返回 `false`，设置成功，返回 `true`。

**示例**

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
> - `rawcookie` 设置必须在 [end](/zh/server/class/response.html#end) 方法之前。
> - `Swoole` 允许设置多个相同 `$key` 的 `COOKIE`。
> - 推荐使用 [Swoole\Http\Cookie](/zh/server/class/cookie.html) 作为方法的第一个入参，这样设置起来简单，不用再设置方法的剩余参数。

### header

`HTTP` 响应的头部信息。类型为数组，所有 `key` 均为小写。

```php
public function header(string $key, string|array $value, bool $format = true): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | `HTTP` 头的 `Key` | 必填 |
| `$value` | `HTTP` 头的 `value` | 必填 |
| `$format` | 是否需要对 `Key` 进行 `HTTP` 约定格式化，默认 `true` 会自动格式化 | `true` |

**返回值**：设置失败，返回 `false`，设置成功，返回 `true`。

**示例**

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
> - `header` 设置必须在 `end` 方法之前。
> - `$key` 必须完全符合 `HTTP` 的约定，每个单词首字母大写，不得包含中文，下划线或者其他特殊字符，`$value` 不能为空。
> - 支持重复设置相同 `$key` 的 `HTTP` 头，并且 `$value` 支持多种类型，如 `array`、`object`、`int`、`float`，底层会进行 `toString` 转换，并且会移除末尾的空格以及换行。
> - 如果客户端设置了 `Accept-Encoding`，那么服务端不能设置 `Content-Length` 响应，`Swoole` 检测到这种情况会忽略 `Content-Length` 的值，并且抛出一个警告。
> - 设置了 `Content-Length` 响应不能调用 [write](/zh/server/class/response.html#write)，`Swoole` 检测到这种情况会忽略 `Content-Length` 的值，并且抛出一个警告。

### isWritable

判断 `Swoole\Http\Response` 对象是否已结束（`end`）或已分离（`detach`）。

```php
public function isWritable(): bool
```

**返回值**：`Swoole\Http\Response` 对象未结束或者未分离返回 `true`，否则返回 `false`。

**示例**

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

设置 `HTTP` 响应状态码。别名是 `setStatusCode`。

```php
public function status(int $http_code, string $reason = ''): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$http_code` | 设置 `HttpCode` | 必填 |
| `$reason` | 状态码原因 | `''` |

**返回值**：设置失败，返回 `false`，设置成功，返回 `true`。

**示例**

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
> - `status` 设置必须在 [end](/zh/server/class/response.html#end) 方法之前。
> - 如果只传入了第一个参数 `$http_code`，必须为合法的 `HttpCode`，如 `200`、`502`、`301`、`404` 等，否则会设置为 `200` 状态码。
> - 如果设置了第二个参数 `$reason`，`$http_code` 可以为任意的数值，包括未定义的 `HttpCode`，如 `499`。

### detach

分离响应对象。使用此方法后，`Swoole\Http\Response` 对象销毁时不会自动执行 [end](/zh/server/class/response.html#end) 方法，与 [create](/zh/server/class/response.html#create) 配合使用。

```php
public function detach(): bool
```

**返回值**：调用成功，返回 `true`，调用失败或连接上下文不存在，返回 `false`。

**示例**

- 跨进程响应。

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

- 某些特殊的场景下，需要对客户端发送特殊的响应内容。

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

构造新的 `Swoole\Http\Response` 对象。

```php
public static function create(object|array|int $server = -1, int $fd = -1): Response|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$server` | [`Swoole\Server`](/zh/server/tcp_udp.html) 或者 `Swoole\Coroutine\Socket` 对象，数组或者文件描述符 | `-1` |
| `$fd` | 文件描述符。如果参数 `$server` 是 `Swoole\Server` 对象，`$fd` 是必填的 | `-1` |

**返回值**：调用成功返回一个新的 `Swoole\Http\Response` 对象，调用失败返回 `false`。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\Socket;

$http = new Server('0.0.0.0', 9501);
$http->on('request', function (Request $request, Response $response) use ($http) {
    $response->detach();  // 必须执行detach
    $newResponse = Response::create($response->fd);  // 可以传入文件描述符来创建新的Response对象
    $newResponse = Response::create($http);  // 可以传入`Swoole\Server`或者它的子类来创建新的Response对象
    $newResponse = Response::create([$http, $response]);  // 可以传入数组，第一个是`Swoole\Server`或者它的子类，第二个是Response对象
    
    $socket = new Socket(AF_INET, SOCK_STREAM, IPPROTO_IP);
    $socket->connect('127.0.0.1', 9501);
    $newResponse = Response::create($socket); // 可以传入 Swoole\Coroutine\Socket 对象来创建新的 Response 对象
    $newResponse->end('Hello World');
});

$http->start();
```

### upgrade

将 `Http` 协程服务器升级为 `WebSocket` 协程服务器。

```php
public function upgrade(): bool
```

**返回值**：调用成功返回 `true`，调用失败返回 `false`。

> [!IMPORTANT]
> 只能在 [HTTP/WebSocket 协程服务器](/zh/server/coroutine/http.html) 使用。

### push

`WebSocket` 协程服务器发送数据给客户端。

```php
public function push(\Swoole\WebSocket\Frame|string $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 要发送的数据内容 | 必填 |
| `$opcode` | 指定发送数据内容的格式，默认为文本；发送二进制内容 `$opcode` 参数需要设置为 `SWOOLE_WEBSOCKET_OPCODE_BINARY`；其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY`，`SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 标志位；其它值：`SWOOLE_WEBSOCKET_FLAG_RSV1`，`SWOOLE_WEBSOCKET_FLAG_RSV2`，`SWOOLE_WEBSOCKET_FLAG_RSV3`，`SWOOLE_WEBSOCKET_FLAG_MASK`，`SWOOLE_WEBSOCKET_FLAG_COMPRESS` | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**支持的 opcode**

| 常量名 | 中文含义 | 说明 |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_OPCODE_TEXT` | 文本帧 | 承载 UTF-8 文本数据 |
| `SWOOLE_WEBSOCKET_OPCODE_BINARY` | 二进制帧 | 承载二进制数据 |
| `SWOOLE_WEBSOCKET_OPCODE_CONTINUATION` | 延续帧 | 用于分片消息的后续帧 |
| `SWOOLE_WEBSOCKET_OPCODE_CLOSE` | 关闭帧 | 表示连接关闭 |
| `SWOOLE_WEBSOCKET_OPCODE_PING` | Ping 帧 | 心跳检测请求 |
| `SWOOLE_WEBSOCKET_OPCODE_PONG` | Pong 帧 | 心跳检测响应 |

**支持的 flags**

| 常量名 | 中文含义 | 说明 |
|--------|----------|------|
| `SWOOLE_WEBSOCKET_FLAG_FIN` | 完成标志 | 表示当前帧是否为消息的最后一帧 |
| `SWOOLE_WEBSOCKET_FLAG_RSV1` | RSV1 标志 | 扩展协议预留位 1，通常用于压缩（如 Per-Message Deflate） |
| `SWOOLE_WEBSOCKET_FLAG_RSV2` | RSV2 标志 | 扩展协议预留位 2 |
| `SWOOLE_WEBSOCKET_FLAG_RSV3` | RSV3 标志 | 扩展协议预留位 3 |
| `SWOOLE_WEBSOCKET_FLAG_MASK` | 掩码标志 | 表示数据负载是否使用了掩码（客户端到服务端的数据必须设置） |
| `SWOOLE_WEBSOCKET_FLAG_COMPRESS` | 压缩标志 | 表示当前帧的数据是否被压缩（通常与 RSV1 配合使用） |

**示例**

- 发送单个数据帧，不压缩

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

- 发送压缩后的数据帧

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
        'websocket_compression' => true  // 开启帧压缩
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

- 发送连续帧，不压缩

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
        // 发送连续帧，
        $data = new Frame();
        
        for ($i = 0; $i < 100; $i++) {
          $data->data = base64_encode(random_bytes(200));
          if ($i == 0) {
            // 第一个帧需要设置成SWOOLE_WEBSOCKET_OPCODE_TEXT或者SWOOLE_WEBSOCKET_OPCODE_BINARY
            $data->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
          } else {
            // 后续的帧需要设置成SWOOLE_WEBSOCKET_OPCODE_CONTINUATION
            $data->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
          }
          
          $data->finish = $i == 99;  // 除了最后一个帧设置为true之外，其他必须为false
          $response->push($data);
        }
    });
    $server->start();
});
```

- 先压缩数据，再发送连续帧

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
        'websocket_compression' => true  // 开启帧压缩
    ]);
    $server->handle('/', function(Request $request, Response $response) {
        $response->upgrade();
        $data1 = bin2hex(random_bytes(10 * 1024));
        $data2 = bin2hex(random_bytes(20 * 2048));
        $data3 = bin2hex(random_bytes(40 * 4096));
    
        $context = deflate_init(ZLIB_ENCODING_RAW);
        // 由于底层并不知道数据帧压缩后需要拆分成多少块，所以这一步需要使用者自己实现
        // 第一个帧需要手动设置finish为false，flags为SWOOLE_WEBSOCKET_FLAG_COMPRESS和SWOOLE_WEBSOCKET_FLAG_RSV1，并且不能设置SWOOLE_WEBSOCKET_FLAG_FIN，表明这是一个压缩数据帧
        $frame = new Frame();
        $frame->data = deflate_add($context, $data1, ZLIB_SYNC_FLUSH);
        $frame->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
        $frame->flags = SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1;
        $frame->finish = false;
        $response->push($frame);
        
        // 剩余的连续帧需要设置opcode为SWOOLE_WEBSOCKET_OPCODE_CONTINUATION，且flags为0，finish为false
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $frame->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
        $frame->flags = 0;
        $frame->finish = false;
        $response->push($frame);
        
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $response->push($frame);
        $frame->data = deflate_add($context, $data2, ZLIB_SYNC_FLUSH);
        $response->push($frame);
        
        // 最后一个连续帧需要设置finish为true，flags为SWOOLE_WEBSOCKET_FLAG_FIN，表明数据已经发送完毕
        $frame->data = deflate_add($context, $data3, ZLIB_SYNC_FLUSH);
        $frame->flags = SWOOLE_WEBSOCKET_FLAG_FIN;
        $frame->finish = true;
        $response->push($frame);
    });
    $server->start();
});
```

- 发送控制帧（`ping`，`pong` 和 `close`）

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
> - 只能在 [HTTP/WebSocket 协程服务器](/zh/server/coroutine/http.html) 使用。
> - 当使用 [`Swoole\WebSocket\Frame`](/zh/server/class/frame.html) 和 [`Swoole\WebSocket\CloseFrame`](/zh/server/class/close_frame.html) 时，请通过对象的**属性**来设置 `$data`、`$opcode` 和 `$flags`，**方法参数**中的这三个值将被忽略。

### recv

接收 `WebSocket` 客户端发送的数据。

```php
public function recv(float $timeout = 0): \Swoole\WebSocket\Frame|false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 超时时间 | `0`，不超时 |

**返回值**：操作成功返回 `Swoole\WebSocket\Frame` 对象，连接已经关闭返回空字符串，操作失败返回 `false`。

**示例**

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
> 只能在 [HTTP/WebSocket 协程服务器](/zh/server/coroutine/http.html) 使用。

### close

关闭 `WebSocket` 连接。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

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
> - 此方法会直接切断 `TCP` 连接，不会发送关闭帧。
> - 只能在 [HTTP/WebSocket 协程服务器](/zh/server/coroutine/http.html) 使用。

### disconnect

断开 `WebSocket` 连接。该方法会发送一个关闭帧，然后优雅关闭连接。

```php
public function disconnect(int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$code` | 关闭连接的状态码，根据 `RFC6455`，对于应用程序关闭连接状态码，取值范围为 `1000` 或 `4000-4999` 之间 | `SWOOLE_WEBSOCKET_CLOSE_NORMAL` |
| `$reason` | 关闭连接的原因，`utf-8` 格式字符串，字节长度不超过 `125` | 无 |

**返回值**：发送成功返回 `true`，发送失败或状态码非法时返回 `false`。

**示例**

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
> - 请使用 `disconnect` 来关闭 `WebSocket` 连接，该方法会自动发送 `close` 关闭帧给客户端并关闭连接。
> - 只能在 [HTTP/WebSocket 协程服务器](/zh/server/coroutine/http.html) 使用。

**支持的状态码**

| 状态码常量                                     | 中文说明                                      |
|-------------------------------------------|-------------------------------------------|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL             | **正常关闭** - 连接已完成工作，正常结束                   |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY         | **正在离开** - 端点离开（如浏览器跳转或关闭页面）              |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR     | **协议错误** - 端点收到不符合 WebSocket 协议的数据        |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR         | **数据类型错误** - 收到无法处理的数据类型（如端点只接收文本却收到二进制）  |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR       | **状态码无效** - 预期收到状态码但未收到（实际不发送此码，用于应用）     |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL           | **异常关闭** - 连接非预期断开（如没收到关闭帧就断开，不主动发送）      |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR      | **消息格式错误** - 收到不符合规范的消息（如 UTF-8 编码错误）     |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR       | **违反策略** - 消息违反服务器策略（通用拒绝原因）              |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG    | **消息过大** - 消息长度超出端点愿意处理的范围                |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING  | **缺少扩展** - 客户端期望服务器协商特定扩展，但服务器未提供（客户端专用）  |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR       | **服务器内部错误** - 服务器遇到异常情况无法完成请求             |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER    | **稍后重试** - 服务器临时过载或维护中，建议稍后再连             |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY        | **网关错误** - 网关或代理收到无效的上游响应   |
| SWOOLE_WEBSOCKET_CLOSE_TLS                | **TLS 握手失败** - TLS 握手未完成就关闭（不主动发送）        |

### ping

`WebSocket` 发送心跳包给客户端。

```php
public function ping(string $data = ''): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | `ping` 帧需要携带的数据 | `''` |

**返回值**：发送成功返回 `true`，发送失败返回 `false`。

**示例**

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
> - 除非设置 [open_websocket_pong_frame](/zh/server/setting.html#open-websocket-pong-frame) 为 `true`，否则客户端发送的 `pong` 帧会被底层自动处理。
> - 只能在 [HTTP/WebSocket 协程服务器](/zh/server/coroutine/http.html) 使用。

### goaway

向客户端发送 `GOAWAY` 帧，通知客户端连接即将关闭，并允许优雅地处理完已存在的请求。

```php
public function goaway(int $error_code = SWOOLE_HTTP2_ERROR_NO_ERROR, string $debug_data = ''): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$error_code` | `HTTP/2` 错误码，用于说明关闭连接的原因 | `SWOOLE_HTTP2_ERROR_NO_ERROR` |
| `$debug_data` | 可选的调试数据，会包含在发送的 `GOAWAY` 数据包中 | `''` |

**返回值**：发送成功返回 `true`，发送失败返回 `false`。

**示例**

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
    'open_http2_protocol' => true  // 必须开启 HTTP/2
]);

$server->on('request', function(Request $request, Response $response) {
    // 发送 GOAWAY 帧通知客户端关闭连接
    $response->goaway(SWOOLE_HTTP2_ERROR_NO_ERROR, 'Server shutting down');
    $response->end('Goodbye!');
});

$server->start();
```

| 常量名 | 中文定义 |
| :--- | :--- |
| SWOOLE_HTTP2_ERROR_NO_ERROR | 没有错误（通常用于优雅地关闭连接） |
| SWOOLE_HTTP2_ERROR_PROTOCOL_ERROR | 协议错误（检测到未特别指定的协议错误） |
| SWOOLE_HTTP2_ERROR_INTERNAL_ERROR | 内部错误（端点遇到意外的内部错误） |
| SWOOLE_HTTP2_ERROR_FLOW_CONTROL_ERROR | 流量控制错误（对端违反了流量控制协议） |
| SWOOLE_HTTP2_ERROR_SETTINGS_TIMEOUT | 设置超时（发送了 SETTINGS 帧但未及时收到响应） |
| SWOOLE_HTTP2_ERROR_STREAM_CLOSED | 流关闭（在流半关闭之后收到了一个帧） |
| SWOOLE_HTTP2_ERROR_FRAME_SIZE_ERROR | 帧大小错误（收到的帧的大小无效或超过最大尺寸） |
| SWOOLE_HTTP2_ERROR_REFUSED_STREAM | 被拒绝的流（在执行任何应用处理之前拒绝了该流） |
| SWOOLE_HTTP2_ERROR_CANCEL | 取消（表明不再需要指定的流） |
| SWOOLE_HTTP2_ERROR_COMPRESSION_ERROR | 压缩错误（无法为连接维护报头压缩的上下文） |
| SWOOLE_HTTP2_ERROR_CONNECT_ERROR | 连接错误（为某个连接请求建立的连接被重置或异常关闭） |
| SWOOLE_HTTP2_ERROR_ENHANCE_YOUR_CALM | 提高你的稳定性（检测到远端表现出可能产生过大负载的行为） |
| SWOOLE_HTTP2_ERROR_INADEQUATE_SECURITY | 安全性不够（底层传输存在不满足最低安全需求的属性） |
| SWOOLE_HTTP2_ERROR_HTTP_1_1_REQUIRED | 需要 HTTP/1.1（要求使用 HTTP/1.1 而不是 HTTP/2） |

> [!TIP]
> 只能在 [HTTP2 服务器](/zh/server/http.html) 使用。

### trailer

用于在 `HTTP` 响应的主体 `（Body）` 之后追加额外的头信息 `（Trailer Header）`。它通常用于在生成并发送完动态内容后，补充一些元数据（如内容校验值、签名或 gRPC 状态码）。

```php
public function trailer(string $key, string $value): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | `HTTP` 头的键名 | 必填 |
| `$value` | `HTTP` 头的值 | 必填 |

**返回值**：发送成功返回 `true`，发送失败返回 `false`。

**示例**

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
> - 重复设置相同 `$key` 的 Trailer 会**覆盖**之前的值。
> - 响应体很大且需边生成边发送时，可在最后附加 `Content-MD5` 或 `Digest` 头进行完整性校验。
