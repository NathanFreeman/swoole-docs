# Swoole\Coroutine\Http2\Response

`Swoole\Coroutine\Http2\Response` 是 `Swoole` 协程 `HTTP/2` 客户端在成功收到服务器的响应后，返回的一个用于承载和解析响应数据的对象。

> [!TIP]
> 本对象由 [HTTP2协程客户端](/zh/client/http2.html) 的 [recv](/zh/client/http2.html#recv) 和 [read](/zh/client/http2.html#read) 方法返回；请求侧的对应对象见 [Swoole\Coroutine\Http2\Request](/zh/client/request.html)。

## 属性

### streamId

当前 `HTTP2` 流 ID。

```php
public int $streamId = 0;
```

### errCode

错误码。

```php
public int $errCode = 0;
```

### statusCode

HTTP 状态码。

```php
public int $statusCode = 0;
```

### pipeline

是否启用流式发送模式。默认 `false`。为 `true` 时保持 `HTTP/2` 流打开。

```php
public bool $pipeline = false;
```

### headers

服务器返回的 HTTP 头部信息。

```php
public array $headers = [];
```

### set_cookie_headers

服务器返回的、未经处理的原始 `Set-Cookie` 头内容，其中会包含 `domain`、`path` 等额外属性。

```php
public array $set_cookie_headers = [];
```

### cookies

服务器通过 `Set-Cookie` 头设置的 `Cookie` 值数组。

```php
public array $cookies = [];
```

### data

服务器返回的响应体主体内容。

```php
public string $data = '';
```

## 示例

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
