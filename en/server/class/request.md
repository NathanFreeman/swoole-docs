# Swoole\Http\Request

The `Swoole\Http\Request` request object encapsulates the information of the `HTTP` request initiated by the client, including key content such as `GET` parameters, `POST` data, `Cookie`, and `Header`.

## Properties

### fd

The client file descriptor of the current request, an integer of type `int`.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->fd);
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

### streamId

HTTP/2 can transmit multiple requests and responses simultaneously over a single `TCP` connection; each independent "request-response" interaction is called a stream. `streamId` is the ID used to distinguish these different streams.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// Set the SSL certificate
$http->set([
  'ssl_cert_file' => '/server.crt',
  'ssl_key_file' => '/server.key',
  'open_http2_protocol' => true  // Enable this to parse the HTTP/2 protocol
]);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->streamId);
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start();
```

### header

The header information of the `HTTP` request. The type is an array, and all `key`s are lowercase.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->header['server'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### server

Server information related to the `HTTP` request, equivalent to `PHP`'s `$_SERVER` array. It contains information such as the `HTTP` request method, `URL` path, and client `IP`.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $method = $request->server['request_method'];
  $response->end("<h1>Hello $method</h1>");
});

$http->start(); 
```

**Parameter information**

| Key | Description |
|:---|:---|
| `query_string` | The `GET` parameter string of the request (e.g. `id=1&cid=2`); omitted if it does not exist |
| `request_method` | The HTTP request method (e.g. `GET`, `POST`) |
| `request_uri` | The request path without `GET` parameters (e.g. `/favicon.ico`) |
| `path_info` | Same as `request_uri` |
| `request_time` | The timestamp (in seconds) when the request started being processed.<br>In [`SWOOLE_PROCESS`](/en/server/process_thread.html#swoole-process) mode, because of the `dispatch` step, it may lag behind the actual packet reception time; the deviation is more noticeable under high load. The precise reception time can be obtained from `last_time` in [`$server->getClientInfo()`](/en/server/methods.html#getclientinfo) |
| `request_time_float` | The microsecond-level timestamp when the request started being processed, of type `float` (e.g. `1576220199.2725`) |
| `server_protocol` | The server protocol version: `HTTP/1.0`, `HTTP/1.1`, or `HTTP/2` |
| `server_port` | The port the server listens on |
| `remote_port` | The client port |
| `remote_addr` | The client IP address |
| `server_addr` | The address of the server network interface that received the request; this key exists only in Swoole 6.2+ |
| `master_time` | The time of the last communication on the connection |

### cookie

The `COOKIE` information carried by the `HTTP` request, equivalent to `$_COOKIE` in `PHP`, in array format.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->cookie['name'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### get

The `GET` parameters of the `HTTP` request, equivalent to `$_GET` in `PHP`, in array format.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### post

The `POST` parameters of the `HTTP` request, equivalent to `$_POST` in `PHP`, in array format.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->post['name'] ?? 'Swoole';
  $response->end("<h1>Hello $name</h1>");
});

$http->start(); 
```

### files

Uploaded file information, a two-dimensional array keyed by the `form` name. Identical to `PHP`'s `$_FILES`. The maximum file size must not exceed the value set by [package_max_length](/en/server/setting.html#package-max-length). Because Swoole consumes memory while parsing the message, the larger the message, the greater the memory usage; therefore do not use `Swoole\Http\Server` to handle large file uploads, or design a resumable upload feature yourself.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->files);
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

**Parameter information**

| Key | Description |
|:---|:---|
| `name` | The file name passed by the browser during upload |
| `type` | The MIME type |
| `tmp_name` | The uploaded temporary file, whose name starts with `/tmp/swoole.upfile` |
| `error` | The error code |
| `size` | The uploaded file size |

## Methods

### getContent

- Gets the raw HTTP request body, mainly used to handle `POST` request types other than `application/x-www-form-urlencoded` (such as `application/json`, `text/xml`, etc.).
- This method is equivalent to `fopen('php://input')` in PHP.

```php
Swoole\Http\Request->getContent(): string|false
```

**Return value**: On success, returns the raw request body string; if the connection of the current request context no longer exists, returns `false`.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump(json_decode($request->getContent(), true));
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

- Open a new terminal and use `curl` to send an `application/json` request.

```shell
curl -X POST 127.0.0.1:9501 -H "Content-Type: application/json" -d '{"name":"Andrew","age":25}'
```

- The output in the server terminal is

```shell
array(2) {
  ["name"]=>
  string(6) "Andrew"
  ["age"]=>
  int(25)
}
```

> [!NOTE]
> Available in Swoole version >= `v4.5.0`; in lower versions you can use the alias `rawContent` (this alias will be kept permanently, i.e. backward compatible).

### getData

Gets the complete raw `Http` request message. Note that it cannot be used under `Http2`.

```php
Swoole\Http\Request->getData(): string|false
```

**Return value**: On success, returns the message; returns `false` if the context connection does not exist or in `Http2` mode.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $protocol = $request->getData();
  echo $protocol . PHP_EOL;
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```

- Open a new terminal and use `curl` to send an `application/json` request.

```shell
curl -X POST 127.0.0.1:9501 -H "Content-Type: application/json" -d '{"name":"Andrew","age":25}'
```

- The output is.

```shell
POST / HTTP/1.1
Host: 127.0.0.1:9501
User-Agent: curl/8.5.0
Accept: */*
Content-Type: application/json
Content-Length: 26

{"name":"Andrew","age":25}
```

### create

Creates a `Swoole\Http\Request` object.

```php
Swoole\Http\Request::create(array $options = []): Swoole\Http\Request
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$options` | Optional parameters used to configure the `Request` object; available keys are listed in the table below | `[]` |

**Available configuration options for `$options`**

| Parameter | Description | Default |
|:---|:---|:---|
| `parse_cookie` | Whether to parse cookies | `true` |
| `parse_body` | Whether to parse the HTTP body | `true` |
| `parse_files` | Whether to parse uploaded files | `true` |
| `enable_compression` | Whether to enable compression | `false` (if the server does not support compressed messages) |
| `compression_level` | Compression level (1-9); a higher value yields smaller output but consumes more CPU | `1` |
| `upload_tmp_dir` | The temporary storage directory for uploaded files | `/tmp` |

**Return value**: Returns a `Swoole\Http\Request` object.

**Example: parsing an HTTP message**

Suppose you have a raw HTTP message and need to extract key information from it; you can do it like this:

```php
<?php
use Swoole\Http\Request;

$protocol = "POST / HTTP/1.1\r\nHost: 127.0.0.1:9501\r\nUser-Agent: curl/8.5.0\r\nAccept: */*\r\nContent-Type: application/json\r\nContent-Length: 26\r\n\r\n{\"name\":\"Andrew\",\"age\":25}";

$request = Request::create(['parse_body' => true]);
$request->parse($protocol);
$data = $request->getContent();
echo $data;
```

### parse

Parses an `HTTP` message.

```php
Swoole\Http\Request->parse(string $data): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The message to parse | Required |

**Return value**: On success, returns the length of the parsed message; returns `false` if the connection context does not exist or the context has already ended.

**Example**

```php
<?php
use Swoole\Http\Request;

$protocol1 = "POST / HTTP/1.1\r\nHost: 127.0.0.1:9501\r\nUser-Agent: curl/8.5.0\r\nAccept: */*\r\n";
$protocol2 = "Content-Type: application/json\r\nContent-Length: 26\r\n\r\n";
$protocol3 = "{\"name\":\"Andrew\",\"age\":25}";

$request = Request::create(['parse_body' => true]);
$request->parse($protocol1);
$request->parse($protocol2);
$request->parse($protocol3);
$data = $request->getContent();
echo $data;
```

> [!WARNING]
> Only `HTTP/1.1` messages can be parsed; `HTTPS` and `HTTP2` messages cannot be parsed.

> [!NOTE]
> A complete `HTTP` message can be split into multiple fragments and parsed by calling the `parse` method multiple times. The underlying layer automatically maintains the parsing state, concatenates the newly passed data with the previously unparsed data, and continues parsing from where the last parse was interrupted.

### isCompleted

Checks whether the current `HTTP` request packet has been parsed to the end.

```php
Swoole\Http\Request->isCompleted(): bool
```

**Return value**: `true` means the end has been reached; `false` means the connection context has ended or the end has not been reached.

**Example**

```php
<?php
use Swoole\Http\Request;

$data = "GET /index.html?hello=world&test=2123 HTTP/1.1\r\n";
$data .= "Host: 127.0.0.1\r\n";
$data .= "Connection: keep-alive\r\n";
$data .= "Pragma: no-cache\r\n";
$data .= "Cache-Control: no-cache\r\n";
$data .= "Upgrade-Insecure-Requests: \r\n";
$data .= "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36\r\n";
$data .= "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9\r\n";
$data .= "Accept-Encoding: gzip, deflate, br\r\n";
$data .= "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ja;q=0.6\r\n";
$data .= "Cookie: env=pretest; phpsessid=fcccs2af8673a2f343a61a96551c8523d79ea; username=hantianfeng\r\n";

/** @var Request $req */
$req = Request::create(['parse_cookie' => false]);
var_dump($req);

var_dump($req->isCompleted());
var_dump($req->parse($data));

var_dump($req->parse("\r\n"));
var_dump($req->isCompleted());

var_dump($req);
// Cookie parsing is disabled, so this will be null
var_dump($req->cookie);
```

### getMethod

Gets the request method of the current `HTTP` request.

```php
Swoole\Http\Request->getMethod(): string|false
```

**Return value**: On success, returns the request method in uppercase; `false` means the connection context does not exist.

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  var_dump($request->getMethod());
  $response->end("<h1>Hello Swoole</h1>");
});

$http->start(); 
```