# Swoole\Coroutine\Http2\Request

`Swoole\Coroutine\Http2\Request` 是 `Swoole` 中專門爲 `HTTP/2 客戶端` 設計的請求構建器。它的核心作用是讓你在調用 [send](/zh-hant/client/http2.html#send) 方法前，通過設置它的屬性來定義請求的各個部分（如 URL 路徑、Header、Body 等）。

> [!TIP]
> 本對象作爲參數傳給 [HTTP2協程客戶端](/zh-hant/client/http2.html) 的 [send](/zh-hant/client/http2.html#send) 方法；響應側的對應對象見 [Swoole\Coroutine\Http2\Response](/zh-hant/client/response.html)。

## 屬性

### path

請求路徑，必須以 `/` 開頭，例如 `/api/user`、`/index.html`。可以包含 `Query` 參數，如 `/api/user?id=123`。

```php
public string $path = '/';
```

### method

HTTP 方法。

```php
public string $method = 'GET';
```

### headers

HTTP 請求頭

```php
public ?array $headers = null;
```

### cookies

HTTP 請求 `cookies`。

```php
public ?array $cookies = null;
```

### data

請求主體。字符串則直接發送；數組會被自動編碼爲 `application/x-www-form-urlencoded` 格式。

```php
public string|array $data = '';
```

### pipeline

是否啓用流式發送模式。默認 `false`。爲 `true` 時保持 `HTTP/2` 流打開，可通過 [write](/zh-hant/client/http2.html#write) 分塊發送數據。

```php
public bool $pipeline = false;
```

### usePipelineRead

是否啓用管道讀取模式。默認 `false`。爲 `true` 時允許在發送請求後立即開始接收響應（而不必等待數據全部發送完畢），適用於雙向流通信場景。

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

- `pipeline` 和 `usePipelineRead` 這兩個屬性名稱相似但作用不同，容易混淆：
  - `pipeline` 用於發送端（寫操作），發送請求後保持流打開，可多次調用 [write](/zh-hant/client/http2.html#write) 寫入。
  - `usePipelineRead` 用於需要接收服務器推送的多塊數據或雙向通信，發送請求後立即可以調用 [read](/zh-hant/client/http2.html#read) 接收，不必等待數據發送完成。

**示例**

- 基本請求（無 pipeline）：

```php
<?php
$req = new Request();
$req->path = '/api/user';
$req->method = 'GET';
$req->headers = ['host' => 'example.com'];

$streamId = $client->send($req);
$response = $client->recv();
```

- 啓用 `pipeline`（分塊發送數據）：

```php
<?php
$req = new Request();
$req->path = '/upload';
$req->method = 'POST';
$req->headers = ['host' => 'example.com'];
$req->pipeline = true;  // 啓用流式發送

$streamId = $client->send($req);

// 分塊發送數據
$client->write($streamId, '第一批數據塊');
$client->write($streamId, '第二批數據塊');
$client->write($streamId, '最後一批數據塊', true);  // true 表示發送完畢

$response = $client->recv();
```

- 啓用 `usePipelineRead`（雙向通信）：

```php
<?php
$req = new Request();
$req->path = '/subscribe';
$req->method = 'GET';
$req->headers = ['host' => 'example.com'];
$req->usePipelineRead = true;  // 啓用管道讀取

$streamId = $client->send($req);

// 立即開始接收服務器推送的數據
while (true) {
    $response = $client->read();
    if (!$response || $response->errCode > 0) {
        break;
    }
    // 處理接收到的數據
    echo $response->data;
}
```


