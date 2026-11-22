# HTTP/HTTPS/HTTP2 服務器

- 要創建一個 `HTTP`、`HTTPS` 或 `HTTP2` 服務器，只需實例化 `Swoole\Http\Server` 對象即可。這也是 `Swoole` 全系列服務器中使用最廣泛的一種。

- `Swoole\Http\Server`、[Swoole\Http\Request](/zh-hant/server/class/request.html) 和 [`Swoole\Http\Response`](/zh-hant/server/class/response.html) 三者共同構成了一個完整的 HTTP 服務器。其中，[Request 對象](/zh-hant/server/class/request.html) 封裝了客戶端的請求信息，[Response 對象](/zh-hant/server/class/response.html) 則用於向客戶端返回響應。以下示例展示了它們的簡單用法。

> [!NOTE]
> `Swoole\Http\Server` 是 [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 的子類。

## 示例

### 示例1：創建一個簡單的 HTTP 服務器

在服務器上監聽 `127.0.0.1` 的 `9501` 端口，實現一個基本的 HTTP 服務器：

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

**測試服務器**

打開另一個終端，使用 `curl` 發送 HTTP 請求：

```bash
curl http://127.0.0.1:9501/?name=Swoole
```

我們會看到終端會輸出：

```
<h1>Hello Swoole</h1>
```

### 示例2：創建一個簡單的 HTTPS 服務器

在服務器上監聽 `127.0.0.1` 的 `443` 端口，實現一個基本的 HTTPS 服務器：

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// 設置SSL證書
$http->set([
  'ssl_cert_file' =>  '/server.crt', 
  'ssl_key_file' =>  '/server.key',
]);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

**測試服務器**

打開另一個終端，使用 `curl` 發送 HTTPS 請求：

```bash
curl -k https://127.0.0.1/?name=Swoole
```

我們會看到終端會輸出：

```
<h1>Hello Swoole</h1>
```

> [!IMPORTANT]
> `HTTPS` 服務器需要在編譯 `Swoole` 的時候開啓 [`--enable-openssl`](/zh-hant/start/install.html#通用功能選項)。`Swoole 6.2` 開始，已經默認內置對 `openssl` 的支持。

### 示例3：創建一個簡單的 HTTP2 服務器

在服務器上監聽 `127.0.0.1` 的 `443` 端口，實現一個基本的 HTTP2 服務器：

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// 設置SSL證書
$http->set([
  'ssl_cert_file' => '/server.crt',
  'ssl_key_file' => '/server.key',
  'open_http2_protocol' => true  // 開啓這個以便於解析http2協議
]);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

**測試服務器**

打開另一個終端，使用 `curl` 發送 HTTP2 請求：

```bash
curl -k "https://127.0.0.1/?name=Swoole"
```

我們會看到終端會輸出：

```
<h1>Hello Swoole</h1>
```

> [!IMPORTANT]
> `HTTPS` 服務器需要在編譯 `Swoole` 的時候開啓 `--enable-openssl` 和 [`--enable-http2`](/zh-hant/start/install.html#通用功能選項)。`Swoole 5.0` 開始，已經默認內置對 `http2` 的支持。`Swoole 6.2` 開始，已經默認內置對 `openssl` 的支持。

## Nginx + Swoole

網絡世界中的報文格式千變萬化，而 `Swoole` 內置的 `HTTP` 協議支持僅實現了基礎功能，能夠滿足常規應用場景。

因此，**建議將 `Swoole` 僅作爲應用服務器**，專注於處理動態請求；而在其前端增加 `Nginx` 作爲代理服務器，負責處理靜態資源、負載均衡等更復雜的 Web 服務器職責。

以下是一個簡單的 `Nginx` 代理配置示例：

```nginx
server {
    listen 80;
    server_name swoole.test;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_pass http://127.0.0.1:9501;
    }
}
```

通過這樣的架構，可以同時發揮 `Nginx` 強大的網絡處理能力與 `Swoole` 高性能的動態請求處理能力。
