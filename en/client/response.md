# Swoole\Coroutine\Http2\Response

`Swoole\Coroutine\Http2\Response` is the object returned by the `Swoole` coroutine `HTTP/2` client after successfully receiving a response from the server, used to carry and parse the response data.

> [!TIP]
> This object is returned by the [recv](/en/client/http2.html#recv) and [read](/en/client/http2.html#read) methods of the [HTTP2 Coroutine Client](/en/client/http2.html); for the corresponding object on the request side, see [Swoole\Coroutine\Http2\Request](/en/client/request.html).

## Properties

### streamId

The current `HTTP2` stream ID.

```php
public int $streamId = 0;
```

### errCode

The error code.

```php
public int $errCode = 0;
```

### statusCode

The HTTP status code.

```php
public int $statusCode = 0;
```

### pipeline

Whether streaming send mode is enabled. Defaults to `false`. When `true`, the `HTTP/2` stream stays open.

```php
public bool $pipeline = false;
```

### headers

The HTTP headers returned by the server.

```php
public array $headers = [];
```

### set_cookie_headers

The raw, unprocessed `Set-Cookie` header contents returned by the server, which include extra attributes such as `domain` and `path`.

```php
public array $set_cookie_headers = [];
```

### cookies

An array of `Cookie` values set by the server via `Set-Cookie` headers.

```php
public array $cookies = [];
```

### data

The main response body content returned by the server.

```php
public string $data = '';
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