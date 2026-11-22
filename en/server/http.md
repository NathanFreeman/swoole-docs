# HTTP/HTTPS/HTTP2 Server

- To create an `HTTP`, `HTTPS`, or `HTTP2` server, simply instantiate a `Swoole\Http\Server` object. This is also the most widely used server type in the entire `Swoole` family.

- `Swoole\Http\Server`, [Swoole\Http\Request](/en/server/class/request.html), and [`Swoole\Http\Response`](/en/server/class/response.html) together form a complete HTTP server. The [Request object](/en/server/class/request.html) encapsulates the client's request information, while the [Response object](/en/server/class/response.html) is used to return responses to the client. The following examples show their simple usage.

> [!NOTE]
> `Swoole\Http\Server` is a subclass of [`Swoole\Server`](/en/server/tcp_udp.html).

## Examples

### Example 1: Creating a Simple HTTP Server

Listen on port `9501` of `127.0.0.1` on the server to implement a basic HTTP server:

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

**Testing the server**

Open another terminal and send an HTTP request using `curl`:

```bash
curl http://127.0.0.1:9501/?name=Swoole
```

You will see the terminal output:

```
<h1>Hello Swoole</h1>
```

### Example 2: Creating a Simple HTTPS Server

Listen on port `443` of `127.0.0.1` on the server to implement a basic HTTPS server:

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_SOCK_TCP | SWOOLE_SSL);
// Set the SSL certificate
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

**Testing the server**

Open another terminal and send an HTTPS request using `curl`:

```bash
curl -k https://127.0.0.1/?name=Swoole
```

You will see the terminal output:

```
<h1>Hello Swoole</h1>
```

> [!IMPORTANT]
> An `HTTPS` server requires [`--enable-openssl`](/en/start/install.html#general-feature-options) to be enabled when compiling `Swoole`. Since `Swoole 6.2`, support for `openssl` is built in by default.

### Example 3: Creating a Simple HTTP2 Server

Listen on port `443` of `127.0.0.1` on the server to implement a basic HTTP2 server:

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
  'open_http2_protocol' => true  // Enable this to parse the http2 protocol
]);
$http->on('request', function(Request $request, Response $response) {
  $name = $request->get['name'];
  $response->end("<h1>Hello $name</h1>");
});

$http->start();
```

**Testing the server**

Open another terminal and send an HTTP2 request using `curl`:

```bash
curl -k https://127.0.0.1/
```

You will see the terminal output:

```
<h1>Hello Swoole</h1>
```

> [!IMPORTANT]
> An `HTTPS` server requires `--enable-openssl` and [`--enable-http2`](/en/start/install.html#general-feature-options) to be enabled when compiling `Swoole`. Since `Swoole 5.0`, support for `http2` is built in by default. Since `Swoole 6.2`, support for `openssl` is built in by default.

## Nginx + Swoole

Message formats in the networking world vary endlessly, while `Swoole`'s built-in `HTTP` protocol support implements only the basic features, which are sufficient for common application scenarios.

Therefore, **it is recommended to use `Swoole` only as an application server**, focusing on handling dynamic requests, and to place `Nginx` in front of it as a proxy server responsible for more complex web server duties such as serving static resources and load balancing.

The following is a simple `Nginx` proxy configuration example:

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

With this architecture, you can leverage both `Nginx`'s powerful network handling capabilities and `Swoole`'s high-performance dynamic request handling at the same time.