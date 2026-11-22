# Swoole\Coroutine\Http2\Response

`Swoole\Coroutine\Http2\Response` 是 `Swoole` 協程 `HTTP/2` 客戶端在成功收到服務器的響應後，返回的一個用於承載和解析響應數據的對象。

> [!TIP]
> 本對象由 [HTTP2協程客戶端](/zh-hant/client/http2.html) 的 [recv](/zh-hant/client/http2.html#recv) 和 [read](/zh-hant/client/http2.html#read) 方法返回；請求側的對應對象見 [Swoole\Coroutine\Http2\Request](/zh-hant/client/request.html)。

## 屬性

### streamId

當前 `HTTP2` 流 ID。

```php
public int $streamId = 0;
```

### errCode

錯誤碼。

```php
public int $errCode = 0;
```

### statusCode

HTTP 狀態碼。

```php
public int $statusCode = 0;
```

### pipeline

是否啓用流式發送模式。默認 `false`。爲 `true` 時保持 `HTTP/2` 流打開。

```php
public bool $pipeline = false;
```

### headers

服務器返回的 HTTP 頭部信息。

```php
public array $headers = [];
```

### set_cookie_headers

服務器返回的、未經處理的原始 `Set-Cookie` 頭內容，其中會包含 `domain`、`path` 等額外屬性。

```php
public array $set_cookie_headers = [];
```

### cookies

服務器通過 `Set-Cookie` 頭設置的 `Cookie` 值數組。

```php
public array $cookies = [];
```

### data

服務器返回的響應體主體內容。

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
