# Swoole\Coroutine\Http2\Request

`Swoole\Coroutine\Http2\Request` 是 `Swoole` 中专门为 `HTTP/2 客户端` 设计的请求构建器。它的核心作用是让你在调用 [send](/zh/client/http2.html#send) 方法前，通过设置它的属性来定义请求的各个部分（如 URL 路径、Header、Body 等）。

> [!TIP]
> 本对象作为参数传给 [HTTP2协程客户端](/zh/client/http2.html) 的 [send](/zh/client/http2.html#send) 方法；响应侧的对应对象见 [Swoole\Coroutine\Http2\Response](/zh/client/response.html)。

## 属性

### path

请求路径，必须以 `/` 开头，例如 `/api/user`、`/index.html`。可以包含 `Query` 参数，如 `/api/user?id=123`。

```php
public string $path = '/';
```

### method

HTTP 方法。

```php
public string $method = 'GET';
```

### headers

HTTP 请求头

```php
public ?array $headers = null;
```

### cookies

HTTP 请求 `cookies`。

```php
public ?array $cookies = null;
```

### data

请求主体。字符串则直接发送；数组会被自动编码为 `application/x-www-form-urlencoded` 格式。

```php
public string $data = '';
```

### pipeline

是否启用流式发送模式。默认 `false`。为 `true` 时保持 `HTTP/2` 流打开，可通过 [write](/zh/client/http2.html#write) 分块发送数据。

```php
public bool $pipeline = false;
```

### usePipelineRead

是否启用管道读取模式。默认 `false`。为 `true` 时允许在发送请求后立即开始接收响应（而不必等待数据全部发送完毕），适用于双向流通信场景。

```php
public bool $usePipelineRead = false;
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

## 注意

- `pipeline` 和 `usePipelineRead` 这两个属性名称相似但作用不同，容易混淆：
  - `pipeline` 用于发送端（写操作），发送请求后保持流打开，可多次调用 [write](/zh/client/http2.html#write) 写入。
  - `usePipelineRead` 用于需要接收服务器推送的多块数据或双向通信，发送请求后立即可以调用 [read](/zh/client/http2.html#read) 接收，不必等待数据发送完成。

**示例**

- 基本请求（无 pipeline）：

```php
<?php
$req = new Request();
$req->path = '/api/user';
$req->method = 'GET';
$req->headers = ['host' => 'example.com'];

$streamId = $client->send($req);
$response = $client->recv();
```

- 启用 `pipeline`（分块发送数据）：

```php
<?php
$req = new Request();
$req->path = '/upload';
$req->method = 'POST';
$req->headers = ['host' => 'example.com'];
$req->pipeline = true;  // 启用流式发送

$streamId = $client->send($req);

// 分块发送数据
$client->write($streamId, '第一批数据块');
$client->write($streamId, '第二批数据块');
$client->write($streamId, '最后一批数据块', true);  // true 表示发送完毕

$response = $client->recv();
```

- 启用 `usePipelineRead`（双向通信）：

```php
<?php
$req = new Request();
$req->path = '/subscribe';
$req->method = 'GET';
$req->headers = ['host' => 'example.com'];
$req->usePipelineRead = true;  // 启用管道读取

$streamId = $client->send($req);

// 立即开始接收服务器推送的数据
while (true) {
    $response = $client->read();
    if (!$response || $response->errCode > 0) {
        break;
    }
    // 处理接收到的数据
    echo $response->data;
}
```


