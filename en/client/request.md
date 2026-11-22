# Swoole\Coroutine\Http2\Request

`Swoole\Coroutine\Http2\Request` is a request builder in `Swoole` designed specifically for the `HTTP/2 client`. Its core purpose is to let you define each part of a request (such as the URL path, headers, body, etc.) by setting its properties before calling the [send](/en/client/http2.html#send) method.

> [!TIP]
> This object is passed as the argument to the [send](/en/client/http2.html#send) method of the [HTTP2 Coroutine Client](/en/client/http2.html); for the corresponding object on the response side, see [Swoole\Coroutine\Http2\Response](/en/client/response.html).

## Properties

### path

The request path. It must start with `/`, for example `/api/user` or `/index.html`. It may include `Query` parameters, such as `/api/user?id=123`.

```php
public string $path = '/';
```

### method

The HTTP method.

```php
public string $method = 'GET';
```

### headers

The HTTP request headers.

```php
public ?array $headers = null;
```

### cookies

The HTTP request `cookies`.

```php
public ?array $cookies = null;
```

### data

The request body. A string is sent as-is; an array is automatically encoded in `application/x-www-form-urlencoded` format.

```php
public string $data = '';
```

### pipeline

Whether to enable streaming send mode. Defaults to `false`. When `true`, the `HTTP/2` stream stays open and data can be sent in chunks via [write](/en/client/http2.html#write).

```php
public bool $pipeline = false;
```

### usePipelineRead

Whether to enable pipeline read mode. Defaults to `false`. When `true`, receiving the response can begin immediately after the request is sent (without waiting for all data to be sent), which suits bidirectional streaming scenarios.

```php
public bool $usePipelineRead = false;
```

## Examples

```php
<?php
use Swoole\Coroutine\Http2\Request;
use Swoole\Coroutine\Http2\Client;
use function Swoole\Coroutine\run;

run(function () {
    $domain = 'www.zhihu.com';
    $cli = new Client($domain, 443, true);
    $cli->set([
        'timeout' => -1,
        'ssl_host_name' => $domain
    ]);
    $cli->connect();
    $req = new Request();
    $req->method = 'POST';
    $req->path = '/api/v4/answers/300000000/voters';
    $req->headers = [
        'host' => $domain,
        'user-agent' => 'Chrome/49.0.2587.3',
        'accept' => 'text/html,application/xhtml+xml,application/xml',
        'accept-encoding' => 'gzip'
    ];
    $req->data = '{"type":"up"}';
    $cli->send($req);
    $response = $cli->recv();
    var_dump(assert(json_decode($response->data)->error->code === 10002));
    $cli->close();
});
```

## Notes

- The two properties `pipeline` and `usePipelineRead` have similar names but different purposes, and are easy to confuse:
  - `pipeline` is for the sending side (write operations): it keeps the stream open after the request is sent, so [write](/en/client/http2.html#write) can be called multiple times.
  - `usePipelineRead` is for receiving multiple chunks of server-pushed data or bidirectional communication: [read](/en/client/http2.html#read) can be called immediately after the request is sent, without waiting for data sending to complete.

**Example**

- Basic request (no pipeline):

```php
<?php
$req = new Request();
$req->path = '/api/user';
$req->method = 'GET';
$req->headers = ['host' => 'example.com'];

$streamId = $client->send($req);
$response = $client->recv();
```

- Enabling `pipeline` (sending data in chunks):

```php
<?php
$req = new Request();
$req->path = '/upload';
$req->method = 'POST';
$req->headers = ['host' => 'example.com'];
$req->pipeline = true;  // Enable streaming send

$streamId = $client->send($req);

// Send data in chunks
$client->write($streamId, 'first data chunk');
$client->write($streamId, 'second data chunk');
$client->write($streamId, 'last data chunk', true);  // true means sending is complete

$response = $client->recv();
```

- Enabling `usePipelineRead` (bidirectional communication):

```php
<?php
$req = new Request();
$req->path = '/subscribe';
$req->method = 'GET';
$req->headers = ['host' => 'example.com'];
$req->usePipelineRead = true;  // Enable pipeline read

$streamId = $client->send($req);

// Start receiving server-pushed data immediately
while (true) {
    $response = $client->read();
    if (!$response || $response->errCode > 0) {
        break;
    }
    // Process the received data
    echo $response->data;
}
```