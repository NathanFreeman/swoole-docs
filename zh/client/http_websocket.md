# HTTP协程客户端

- `Swoole\Coroutine\Http\Client` 是 `Swoole` 提供的协程版 `HTTP/HTTPS` 客户端，用于在协程环境中发起 `HTTP` 和 `WebSocket` 请求
- 只支持 `gzip` 报文压缩（需依赖 `zlib` 库）。

## 属性

### socket

当前连接 `fd` 对应的 [`Swoole\Coroutine\Socket`](/zh/client/socket.html) 对象，以便执行更底层的操作。

```php
public Swoole\Coroutine\Socket $socket;
```

### errCode

最近一次操作的错误码。

```php
public int $errCode = 0;
```

### errMsg

最近一次操作的错误信息。

```php
public string $errMsg = '';
```

### connected

当前客户端是否已经连接上服务端。

```php
public bool $connected = false;
```

### host

服务端地址。

```php
public string $host;
```

### port

服务端端口。

```php
public int $port;
```

### ssl

是否开启 `ssl` 连接。

```php
public bool $ssl;
```

### setting

当前客户端的连接配置。

```php
public array $setting;
```

### requestMethod

当前 `HTTP` 客户端请求方法。

```php
public string $requestMethod;
```

### requestHeaders

当前 `HTTP` 客户端请求头。

```php
public array $requestHeaders;
```

### requestBody

当前 `HTTP` 客户端请求包体。

```php
public array $requestBody;
```

### uploadFiles

当前 `HTTP` 客户端上传文件。

```php
public array $uploadFiles;
```

### downloadFile

从服务端下载的文件。

```php
public array $downloadFile;
```

### downloadOffset

从服务端下载的文件的偏移量。

```php
public int $downloadOffset;
```

### statusCode

当前请求状态码。

```php
public int $statusCode;
```

### headers

`HTTP` 服务端的响应头。

```php
public array headers;
```

### set_cookie_headers

`HTTP` 服务端的原生响应 `cookie`。

```php
public array $set_cookie_headers;
```

**示例**

```php
["set_cookie_headers"]=>
  array(4) {
    [0]=>
    string(129) "BAIDUID=CE62AAD88DC35A8ED32959FE69170AD6:FG=1; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [1]=>
    string(125) "BIDUPSID=CE62AAD88DC35A8ED32959FE69170AD6; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [2]=>
    string(99) "PSTM=1779953245; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [3]=>
    string(150) "BAIDUID=CE62AAD88DC35A8EC30AC4C975C8B357:FG=1; max-age=31536000; expires=Fri, 28-May-27 07:27:25 GMT; domain=.baidu.com; path=/; version=1; comment=bd"
```

### cookies

`HTTP` 服务端的响应 `cookie`。

```php
public array $cookies;
```

**示例**

```php
["cookies"]=>
  array(3) {
    ["BAIDUID"]=>
    string(37) "CE62AAD88DC35A8EC30AC4C975C8B357:FG=1"
    ["BIDUPSID"]=>
    string(32) "CE62AAD88DC35A8ED32959FE69170AD6"
    ["PSTM"]=>
    string(10) "1779953245"
  }
```

> [!TIP]
> 与 `set_cookie_headers` 的区别是，`set_cookie_headers` 不会将 `cookie` 转化键值对数组。

### body

`HTTP` 响应的包体内容。

```php
public string $body = '';
```

## 方法

### __construct

构造函数，创建一个 `HTTP`/`WebSocket` 客户端。

```php
public function __construct(string $host, int $port = 0, bool $ssl = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 目标服务器主机地址【可以为IP或域名，底层自动进行域名解析，若是本地UNIXSocket则应以形如 `unix://tmp/your_file.sock` 的格式填写；若是域名不需要填写协议头 `http://` 或 `https://`】 | 必填 |
| `$port` | 目标服务器主机端口 | `0` |
| `$ssl` | 是否启用 `SSL/TLS` 隧道加密，如果目标服务器是 https 必须设置 `$ssl` 参数为 `true` | `false` |

### set

设置 `HTTP`/`WebSocket` 客户端运行时配置。

```php
public function set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | `HTTP`/`WebSocket` 客户端运行时配置 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**支持的配置**

| 配置项                         | 正确说明                                                                                  | 示例值                                                                   |
|:----------------------------|:--------------------------------------------------------------------------------------|:----------------------------------------------------------------------|
| `max_retries`               | 设置连接失败时的最大重试次数。                                                                       | `3`                                                                   |
| `defer`                     | 启用延迟收包模式。请求发出后不立即等待响应，协程可以处理其他任务，稍后再通过 `recv()` 获取结果，提升并发能力。                          | `true`                                                                |
| `lowercase_header`          | 将 HTTP 响应头部的键名全部转换为小写。                                                                | `true`                                                                |
| `keep_alive`                | 启用 HTTP 持久连接，复用同一个 TCP 连接发送多个请求，提高效率。                                                 | `true`                                                                |
| [`http_compression`](/zh/server/setting.html#http-compression)          | 启用 HTTP 请求压缩（如 gzip），减少传输数据量。                                                         | `true`                                                                |
| `body_decompression`        | 启用后，自动对服务器返回的压缩响应体（如 gzip 内容）进行解压。                                                    | `true`                                                                |
| `write_func`                | 自定义数据发送函数的回调。                                                                         | `function($client, $data) { /* ... */ }`                              |
| [`websocket_subprotocol`](/zh/server/setting.html#websocket-subprotocol)     | 设置 WebSocket 握手时希望使用的子协议。                                                             | `'chat'`                                                              |
| `websocket_mask`            | 设置是否对 WebSocket 帧数据应用掩码。根据 RFC 标准，客户端发送的数据必须掩码，默认为 `true`。                            | `true`                                                                |
| [`websocket_compression`](/zh/server/setting.html#websocket-compression)     | 启用 WebSocket 消息压缩。需服务端支持，且依赖 `zlib` 库。                                                | `true`                                                                |
| [`open_websocket_ping_frame`](/zh/server/setting.html#open-websocket-ping-frame) | 开启后，服务端发来的 Ping 帧不再由底层自动回复 Pong，而是通过 `recv()` 返回给使用者自行处理（Swoole 6.1+ 底层默认自动处理控制帧）。 | `true`                                                                |
| [`open_websocket_pong_frame`](/zh/server/setting.html#open-websocket-pong-frame) | 开启后，服务端发来的 Pong 帧不再由底层自动处理，而是通过 `recv()` 返回给使用者自行处理（Swoole 6.1+ 底层默认自动处理控制帧）。 | `true`                                                                |
| `timeout`                   | **全局超时**（秒），统一控制连接、读取、写入的超时时间。优先级低于 `connect_timeout`、`read_timeout`、`write_timeout`。 | `0.5`                                                                 |
| `connect_timeout`           | **连接超时**（秒），单独控制 TCP 握手阶段的超时时间。                                                       | `1.0`                                                                 |
| `read_timeout`              | **读取超时**（秒），单独控制等待数据的超时时间。                                                            | `0.5`                                                                 |
| `write_timeout`             | **写入超时**（秒），单独控制发送数据的超时时间。                                                            | `0.5`                                                                 |
| `bind_address`              | 多网卡环境下，强制绑定本地 IP 地址。需与 `bind_port` 同时使用。                                              | `'192.168.1.100'`                                                     |
| `bind_port`                 | 强制绑定本地端口号。需与 `bind_address` 同时使用。                                                     | `9501`                                                                |
| [`socket_buffer_size`](/zh/server/setting.html#socket-buffer-size)        | 发送缓冲区总大小（字节）。                                                                         | `1024 * 1024 * 2`                                                     |
| [`open_tcp_nodelay`](/zh/server/setting.html#open-tcp-nodelay)          | 关闭 Nagle 算法，小数据包立即发送，不等待合并。                                                           | `true`                                                                |
| `socks5_host`               | SOCKS5 代理服务器 IP 或域名。                                                                  | `'192.168.1.1'`                                                       |
| `socks5_port`               | SOCKS5 代理服务器端口。                                                                       | `1080`                                                                |
| `socks5_username`           | SOCKS5 代理认证用户名（可选）。                                                                   | `'admin'`                                                             |
| `socks5_password`           | SOCKS5 代理认证密码（可选）。                                                                    | `'123456'`                                                            |
| `http_proxy_host`           | HTTP 代理服务器 IP 或域名。                                                                    | `'192.168.1.1'`                                                       |
| `http_proxy_port`           | HTTP 代理服务器端口。                                                                         | `8080`                                                                |
| `http_proxy_username`       | HTTP 代理认证用户名（可选）。                                                                     | `'admin'`                                                             |
| `http_proxy_password`       | HTTP 代理认证密码（可选）。                                                                      | `'123456'`                                                            |
| [`open_http2_protocol`](/zh/server/setting.html#open-http2-protocol)       | 启用 HTTP/2 协议支持（需在 SSL 之上使用）。                                                          | `true`                                                                |
| [`open_eof_check`](/zh/server/setting.html#open-eof-check)            | 启用 EOF 边界检测，仅当数据包结尾匹配分隔符时才停止接收。                                                       | `true`                                                                |
| [`open_eof_split`](/zh/server/setting.html#open-eof-split)            | 启用 EOF 自动切分，逐字节扫描并按分隔符切分完整数据包。                                                        | `true`                                                                |
| [`package_eof`](/zh/server/setting.html#package-eof)               | 指定 EOF 分隔符。                                                                           | `"\r\n"`                                                              |
| `open_fastcgi_protocol`     | 启用 FastCGI 协议解析。                                                                      | `true`                                                                |
| [`open_mqtt_protocol`](/zh/server/setting.html#open-mqtt-protocol)        | 启用 MQTT 协议解析。                                                                         | `true`                                                                |
| [`open_length_check`](/zh/server/setting.html#open-length-check)         | 启用长度检测协议解析。                                                                           | `true`                                                                |
| [`package_length_type`](/zh/server/setting.html#package-length-type)       | 长度字段类型，与 `pack()` 函数一致，如 `'N'` 表示 4 字节无符号长整型。                                         | `'N'`                                                                 |
| [`package_length_offset`](/zh/server/setting.html#package-length-offset)     | 长度字段在数据包中的起始偏移量（字节）。                                                                  | `0`                                                                   |
| [`package_body_offset`](/zh/server/setting.html#package-body-offset-package-body-start)       | 包体数据在数据包中的起始偏移量（字节）。                                                                  | `4`                                                                   |
| [`package_length_func`](/zh/server/setting.html#package-length-func)       | 自定义长度解析函数，返回完整数据包的长度。                                                                 | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/zh/server/setting.html#package-max-length)        | 最大可接收数据包大小（字节）。                                                                       | `8192`                                                                |
| [`ssl_protocols`](/zh/server/setting.html#ssl-protocols)             | 允许的 SSL/TLS 协议版本。                                                                     | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/zh/server/setting.html#ssl-compress)              | 是否启用 SSL/TLS 压缩。                                                                      | `false`                                                               |
| [`ssl_cert_file`](/zh/server/setting.html#ssl-cert-file-ssl-key-file)             | 客户端证书文件路径（双向验证时使用）。                                                                   | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/zh/server/setting.html#ssl-cert-file-ssl-key-file)              | 客户端私钥文件路径（双向验证时使用）。                                                                   | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`            | 私钥文件密码（若已加密）。                                                                         | `'pass123'`                                                           |
| `ssl_host_name`             | SNI 域名，用于服务端返回正确的 SSL 证书。                                                             | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/zh/server/setting.html#ssl-verify-peer)           | 是否验证对端证书。                                                                             | `true`                                                                |
| [`ssl_allow_self_signed`](/zh/server/setting.html#ssl-allow-self-signed)     | 是否允许自签名证书。                                                                            | `true`                                                                |
| [`ssl_cafile`](/zh/server/setting.html#ssl-cafile)                | CA 证书文件路径，用于验证对端证书签名。                                                                 | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/zh/server/setting.html#ssl-capath)                | CA 证书目录路径（需为哈希目录），`ssl_cafile` 未设置或无效时使用。                                             | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/zh/server/setting.html#ssl-verify-depth)          | 证书链验证的最大深度，超过则终止验证。                                                                   | `5`                                                                   |
| [`ssl_ciphers`](/zh/server/setting.html#ssl-ciphers)               | 设置 OpenSSL 加密算法套件。                                                                    | `'ECDHE-RSA-AES128-GCM-SHA256'`                                       |
| [`ssl_ecdh_curve`](/zh/server/setting.html#ssl-ecdh-curve)            | 控制 ECDH 密钥交换所使用的椭圆曲线。                                                                 | `'secp256r1'`                                                         |
| `ssl_grease`                | 启用 TLS GREASE（防僵化）扩展，增强与不标准服务端的兼容，只适用于谷歌的`BoringSSL`。                                 | `true`                                                                |

### setDefer

开启延迟收包模式。

```php
public function setDefer(bool $defer = true): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$defer` | 是否开启延迟收包模式。其它值：`false` | `true` |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 创建多个客户端并发请求
    $clients = [];
    for ($i = 0; $i < 5; $i++) {
        $cli = new Client('127.0.0.1', 80);
        $cli->setHeaders([
            'Host' => 'localhost',
            'User-Agent' => 'Chrome/49.0.2587.3',
        ]);
        $cli->set(['timeout' => 2]);
        
        // 开启 defer 模式（只发包，不收包）
        $cli->setDefer(true);
        $cli->get('/api/user/' . $i);
        
        $clients[] = $cli;
    }
    
    // 批量收包
    $results = [];
    foreach ($clients as $cli) {
        $cli->recv();      // 等待并接收响应
        $results[] = $cli->body;
    }
    
    $client->close();
});
```

> [!WARNING]
> `setDefer` 将 `发送请求` 和 `接收响应` 拆分成两个步骤，必须要通过 [recv](/zh/client/http_websocket.html#recv) 获取响应

### getDefer

判断当前请求是否开启了延迟收包模式。

```php
public function getDefer(): bool
```

**返回值**：`true` 表示开启了延迟收包模式，`false` 表示关闭延迟收包。

### setMethod

设置 `HTTP` 客户端请求方法。仅在当前请求有效，发送请求后会立刻清除 method 设置。

```php
public function setMethod(string $method): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$method` | 设置请求方法 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

### setHeaders

设置 `HTTP` 客户端请求头。

```php
public function setHeaders(array $headers): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$headers` | 设置请求头 【必须为键值对应的数组，底层会自动映射为 `$key`: `$value` 格式的 `HTTP` 标准头格式】 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

### setBasicAuth

设置 `HTTP` 基础认证（Basic Authentication）。

```php
public function setBasicAuth(string $username, string $password): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$username` | `HTTP Basic Auth` 的用户名 | 必填 |
| `$password` | `HTTP Basic Auth` 的密码 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 设置请求头
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
    ]);
    
    // 设置超时时间
    $client->set(['timeout' => 2]);
    
    // 设置 Basic Auth
    $client->setBasicAuth('user', 'pass');
    
    // 发起请求
    $client->get('/user');
    
    echo $client->body;
    $client->close();
});
```

### setCookies

设置 `HTTP` 客户端请求 `Cookie`。

```php
public function setCookies(array $cookies): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$cookies` | 设置 `COOKIE` 【必须为键值对应数组】 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**注意**

- 设置的 `cookie` 会在客户端对象存活期间会持续保存。
- 重复调用 `setCookies` 方法，会覆盖当前的 `cookie` 状态，这会丢弃之前服务器端下发的 `cookie` 以及之前主动设置的 `cookie`。
- `cookie` 的值将会被进行 `urlencode` 编码, 若想保持原始信息, 请自行用 `setHeaders` 设置名为 `Cookie` 的请求头。

### setData

设置 `HTTP` 请求体 `（body）` 数据。

```php
public function setData(array|string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 设置请求的包体 | 必填 |

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
    ]);
    
    $client->set(['timeout' => 1]);
    
    // 使用数组设置数据
    $client->setData(['msg' => 'Hello', 'from' => 'Swoole']);
    
    // 执行请求（需配合 setMethod 使用）
    $client->setMethod('POST');
    $status = $client->execute('/index');
    
    echo $status . "\n";
    var_dump($client->body);
    
    $client->close();
});
```

**注意**

- 设置 `$data` 且未设置 `$method` 时，底层会自动将请求方式设为 `POST`。
- 若 `$data` 为数组，且 `Content-Type` 为 `application/x-www-form-urlencoded` 格式，底层会自动执行 `http_build_query` 进行编码。
- 若通过 `addFile` 或 `addData` 启用了 `multipart/form-data` 格式：
    - 当 `$data` 为字符串时，将被忽略（因为字符串无法与 `multipart/form-data` 格式兼容）；
    - 当 `$data` 为数组时，底层会以 `multipart/form-data` 格式将数组中的字段逐个追加到请求中。

### addFile

`HTTP` 客户端中用于上传文件，支持 `multipart/form-data` 格式的文件上传。

```php
public function addFile(string $path, string $name, ?string $type = null, ?string $filename = null, int $offset = 0, int $length = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 要上传的本地文件路径 | 必填 |
| `$name` | 表单的名称【必选参数，对应服务端 `$_FILES['name']`】 | 必填 |
| `$type` | 文件的 `MIME` 格式，【可选参数，底层会根据文件的扩展名自动推断】（原文记作 `$mimeType`） | `null` |
| `$filename` | 文件名称【可选参数】 | `basename($path)` |
| `$offset` | 上传文件的偏移量【可选参数，可以指定从文件的中间部分开始传输数据。此特性可用于支持断点续传。】 | `0` |
| `$length` | 发送数据的尺寸【可选参数】 | 默认为整个文件的尺寸 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 设置请求头（Content-Type 会自动变为 multipart/form-data）
    $client->setHeaders([
        'Host' => 'localhost',
    ]);
    
    // 添加上传文件
    $client->addFile('/home/test/1.jpg', 'img1');           // 表单字段名为 img1
    $client->addFile('/home/test/2.jpg', 'img2');           // 可上传多个文件
    
    // 发起 POST 请求
    $client->post('/upload.php', []);
    // 或使用 execute
    // $client->setMethod('POST');
    // $client->execute('/upload.php');
    
    echo $client->body;
    $client->close();
});
```

### addData

`HTTP` 客户端中用于上传内存数据的方法，与 `addFile` 类似，但它允许将 `字符串内容` 作为 `虚拟文件` 进行上传（支持 `multipart/form-data` 格式）

```php
public function addData(string $data, string $name, ?string $type = null, ?string $filename = null, int $offset = 0, int $length = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 数据内容【必选参数，最大长度不得超过 `buffer_output_size`】 | 必填 |
| `$name` | 表单的名称【必选参数，对应服务端 `$_FILES['name']`】 | 必填 |
| `$type` | 文件的 `MIME` 格式【可选参数，默认为 `application/octet-stream`】（原文记作 `$mimeType`） | `null` |
| `$filename` | 文件名称【可选参数，默认为 `$name`】 | `null` |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 准备要上传的内存数据（例如动态生成的图片、JSON字符串等）
    $imageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // 将内存数据作为文件上传
    $client->addData($imageData, 'test.png', 'image_file', 'image/png');
    
    // 发起 POST 请求
    $client->post('/upload.php', []);
    
    echo $client->body;
    $client->close();
});
```

### execute

执行 `HTTP` 请求的核心方法。

```php
public function execute(string $path): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 请求路径 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 设置请求头
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
    ]);
    
    // 设置超时
    $client->set(['timeout' => 5]);
    
    // 执行 GET 请求
    $client->setMethod('GET');
    $client->execute('/api/users');
    
    // 检查结果
    if ($client->statusCode == 200) {
        echo $client->body;
    } else {
        echo "Error: " . $client->statusCode;
    }
    
    $client->close();
});
```

### getsockname

获取客户端本地 `Socket` 地址信息。

```php
public function getsockname(): array|false
```

**返回值**：操作成功返回一个数组，包含客户端信息，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('www.baidu.com', 80);
    
    // 发起请求
    $client->get('/');
    
    // 获取本地 Socket 地址信息
    $localAddr = $client->getsockname();
    
    if ($localAddr) {
        echo "本地 IP: " . $localAddr['address'] . "\n";
        echo "本地端口: " . $localAddr['port'] . "\n";
    }
    
    $client->close();
});
```

| key     | 含义      |
|---------|---------|
| address | 客户端地址   |
| port    | 客户端监听端口 |

### getpeername

用于获取远端服务端 `Socket` 地址信息的方法。

```php
public function getpeername(): array|false
```

**返回值**：操作成功返回一个数组，包含服务端信息，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('www.baidu.com', 80);
    
    // 发起请求
    $client->get('/');
    
    // 获取远端 Socket 地址信息
    $remoteAddr = $client->getpeername();
    
    if ($remoteAddr) {
        echo "远端 IP: " . $remoteAddr['address'] . "\n";
        echo "远端端口: " . $remoteAddr['port'] . "\n";
    }
    
    $client->close();
});
```

| key     | 含义      |
|---------|---------|
| address | 服务端地址   |
| port    | 服务端监听端口 |

### get

`HTTP` 客户端发起 `GET` 请求。

```php
public function get(string $path): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 请求路径 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 设置通用请求头
    $client->setHeaders([
        'User-Agent' => 'Swoole Client',
    ]);
    
    // 发起 GET 请求
    $success = $client->get('/get?a=1&b=2');
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->body . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
}); 
```

### post

`HTTP` 客户端发起 `POST` 请求。

```php
public function post(string $path, mixed $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 请求路径 | 必填 |
| `$data` | 需要提交的数据 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 设置通用请求头
    $client->setHeaders([
        'Content-Type' => 'application/json',
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    ]);
    
    $data = ['name' => 'John', 'age' => 25];
    $success = $client->post('/post', json_encode($data));
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->body . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
});
```

> [!TIP]
> 如果 `$data` 是数组，底层会自动设置 `Content-Type` 为 `application/x-www-form-urlencoded`。

### download

从远程服务器下载文件。

```php
public function download(string $path, string $filename, int $offset = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 请求的 `URL` 路径 | 必填 |
| `$filename` | 指定下载内容写入的文件路径【会自动写入到 `downloadFile` 属性】 | 必填 |
| `$offset` | 指定写入文件的偏移量【此选项可用于支持断点续传，可配合 `HTTP` 头 `Range:bytes=$offset` 实现】 | `0` |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 设置通用请求头
    $client->setHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    ]);
    
    $client->download('/images/swoole.svg', '/home/swoole.svg');
    $client->close();
});
```

> [!IMPORTANT]
> `$offset` 为 `0` 时若文件已存在，底层会自动清空此文件。

### getBody

获取 `HTTP` 响应的包体内容。

```php
public function getBody(): false|string
```

**返回值**：操作成功返回 `响应的包体内容`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 设置通用请求头
    $client->setHeaders([
        'User-Agent' => 'Swoole Client',
    ]);
    
    // 发起 GET 请求
    $success = $client->get('/get?a=1&b=2');
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->getBody() . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
}); 
```

### getHeaders

返回 `HTTP` 响应的头信息。

```php
public function getHeaders(): null|array|false
```

**返回值**：操作成功返回一个数组，里面包含 `HTTP` 响应的头信息，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // 发起 GET 请求
    $client->get('/get');
    
    // 获取响应头
    $headers = $client->getHeaders();
    
    if ($headers) {
        echo "=== 响应头信息 ===\n";
        foreach ($headers as $key => $value) {
            echo "$key: $value\n";
        }
    } else {
        echo "获取响应头失败\n";
    }
    
    $client->close();
});
```

### getCookies

获取服务器返回的 `Cookie` 信息。

```php
public function getCookies(): null|array|false
```

**返回值**：操作成功返回一个数组，里面包含 `HTTP` 响应的头信息，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('example.com', 80);
    
    // 发起请求
    $client->get('/login');
    
    // 获取服务器返回的 Cookie
    $cookies = $client->getCookies();
    
    if ($cookies) {
        echo "=== 服务器返回的 Cookie ===\n";
        foreach ($cookies as $name => $value) {
            echo "$name = $value\n";
        }
    } else {
        echo "未收到任何 Cookie\n";
    }
    
    $client->close();
});
```

### getStatusCode

获取服务器响应的 `HTTP` 状态码。

```php
public function getStatusCode(): false|int
```

**返回值**：操作成功返回响应的 `HTTP` 状态码，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    $client->get('/get');
    
    // 获取状态码
    $statusCode = $client->getStatusCode();
    
    if ($statusCode === 200) {
        echo "请求成功\n";
        echo "响应内容: " . $client->body . "\n";
    } else {
        echo "请求失败，状态码: $statusCode\n";
    }
    
    $client->close();
});
```

### getHeaderOut

获取实际发送给 `服务端` 的原始请求头（`Raw Request Headers`）。

```php
public function getHeaderOut(): false|string
```

**返回值**：操作成功返回原始请求头，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
        'Accept-Encoding' => 'gzip',
    ]);
    $client->get('/get');
    
    // 获取状态码
    $statusCode = $client->getStatusCode();
    
    // 获取原始请求头
    var_dump($client->getHeaderOut());
    
    $client->close();
});
```

### getPeerCert

获取服务端 `SSL/TLS` 证书信息。

```php
public function getPeerCert(): false|string
```

**返回值**：操作成功返回 `X.509` 证书信息，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 第三个参数设置为 true 以启用 SSL/TLS
    $client = new Client('www.baidu.com', 443, true);
    
    $client->setHeaders([
        'Host' => 'www.baidu.com',
        'User-Agent' => 'Swoole Client',
    ]);
    
    $client->set(['timeout' => 10]);
    
    $client->get('/');
    
    // 获取服务端证书信息
    $cert = $client->getPeerCert();
    
    if ($cert !== false) {
        echo "证书获取成功\n";
        
        // 需要配合 openssl 扩展解析证书内容
        $certInfo = openssl_x509_parse($cert);
        print_r($certInfo);
    } else {
        echo "获取证书失败\n";
    }
    
    $client->close();
});
```

### upgrade

将 `HTTP` 连接升级为 `WebSocket` 连接。

```php
public function upgrade(string $path): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 设置 `URL` 路径【如 `/`，注意这里不能传入 `http://domain`】 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 创建 HTTP 客户端
    $client = new Client('127.0.0.1', 9501);
    
    // 升级为 WebSocket 连接
    $ret = $client->upgrade('/websocket');
    
    if (!$ret) {
        echo "WebSocket 握手失败，HTTP 状态码: " . $client->statusCode . "\n";
        $client->close();
        return;
    }
    
    echo "WebSocket 连接成功！\n";
    
    // 发送消息
    $client->push("Hello WebSocket!");
    
    // 接收消息
    $response = $client->recv();
    if ($response && $response->data) {
        echo "收到: " . $response->data . "\n";
    }
    
    // 优雅关闭
    $client->disconnect();
});
```

> [!WARNING]
> 某些情况下请求虽然是成功的，`upgrade` 返回了 `true`，但服务器并未设置 `HTTP` 状态码为 `101`，而是 `200` 或 `403` ，这说明服务器拒绝了握手请求。

### push

向 `WebSocket` 服务器推送消息。

```php
public function push(mixed $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 要发送的数据内容【默认为 `UTF-8` 文本格式，如果为其他格式编码或二进制数据，请使用 [`SWOOLE_WEBSOCKET_OPCODE_BINARY`](/zh/server/methods.html#push)】 | 必填 |
| `$opcode` | 操作码；其它值：`SWOOLE_WEBSOCKET_OPCODE_BINARY` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | 操作类型 | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**返回值**：发送成功，返回 `true`；连接不存在、已关闭、未完成 `WebSocket`，发送失败返回 `false`。

### recv

接收 `HTTP` 或者 `WebSocket` 服务器消息。

```php
public function recv(float $timeout = 0): Swoole\WebSocket\Frame|string|bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时时间。值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：

- `WebSocket` 客户端：操作成功返回 [`Swoole\WebSocket\Frame`](/zh/server/class/frame.html) 对象，连接关闭返回空字符串，操作失败返回 `false`。
- `HTTP` 客户端：操作成功返回 `true`，连接关闭返回空字符串，操作失败返回 `false`。

**示例**

- `HTTP` 客户端。

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 创建多个客户端并发请求
    $clients = [];
    for ($i = 0; $i < 5; $i++) {
        $cli = new Client('127.0.0.1', 80);
        $cli->setHeaders([
            'Host' => 'localhost',
            'User-Agent' => 'Chrome/49.0.2587.3',
        ]);
        $cli->set(['timeout' => 2]);
        
        // 开启 defer 模式（只发包，不收包）
        $cli->setDefer(true);
        $cli->get('/api/user/' . $i);
        
        $clients[] = $cli;
    }
    
    // 批量收包
    $results = [];
    foreach ($clients as $cli) {
        $cli->recv();      // 等待并接收响应
        $results[] = $cli->body;
    }
    
    $client->close();
});
```

- `WebSocket` 客户端。

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 创建 HTTP 客户端
    $client = new Client('127.0.0.1', 9501);
    
    // 升级为 WebSocket 连接
    $ret = $client->upgrade('/websocket');
    
    if (!$ret) {
        echo "WebSocket 握手失败，HTTP 状态码: " . $client->statusCode . "\n";
        $client->close();
        return;
    }
    
    echo "WebSocket 连接成功！\n";
    
    // 发送消息
    $client->push("Hello WebSocket!");
    
    // 接收消息
    $response = $client->recv();
    if ($response && $response->data) {
        echo "收到: " . $response->data . "\n";
    }
    
    // 优雅关闭
    $client->disconnect();
});
```

**注意**

- `HTTP` 客户端需要配合 [setDefer](/zh/client/http_websocket.html#setdefer) 使用，只有设置了 `setDefer`，才能使用 `recv` 接收到服务端数据。
- `HTTP` 客户端执行 `recv` 成功之后，会将响应体保存在当前的 [body](/zh/client/http_websocket.html#body) 属性中，可以通过 [body](/zh/client/http_websocket.html#body) 属性或者 [getBody](/zh/client/http_websocket.html#getbody) 方法获取。

### close

关闭连接。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // 设置请求头
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
    ]);
    
    // 设置超时
    $client->set(['timeout' => 5]);
    
    // 执行 GET 请求
    $client->setMethod('GET');
    $client->execute('/api/users');
    
    // 检查结果
    if ($client->statusCode == 200) {
        echo $client->body;
    } else {
        echo "Error: " . $client->statusCode;
    }
    
    $client->close();
});
```

### ping

发送 `WebSocket` 心跳包。

```php
public function ping(string $data = ""): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 心跳包数据内容 | 空字符串 |

**返回值**：发送成功返回 `true`；连接不存在、已关闭、未完成 `WebSocket`，发送失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use Swoole\WebSocket\Frame;
use function Swoole\Coroutine\run;

run(function () {
    $client = new Client('127.0.0.1', 9501);
    $client->upgrade('/');  // 先升级为 WebSocket 连接

    // 发送 Ping
    $client->ping('Hello');
    $client->disconnect();
    $client->close();
});
```

> [!WARNING]
> 底层会自动处理服务端发送的 `pong` 控制帧，如果想要手动处理 `pong` 控制帧的话，可以通过 [set](/zh/client/http_websocket.html#set) 方法设置 `open_websocket_pong_frame` 为 `true`。

### disconnect

关闭当前 `WebSocket` 连接。

```php
public function disconnect(int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$code` | 错误码 | [`SWOOLE_WEBSOCKET_CLOSE_NORMAL`](/zh/server/methods.html#disconnect) |
| `$reason` | 关闭原因 | 空字符串 |

**返回值**：关闭成功返回 `true`；连接不存在、已关闭、未完成 `WebSocket`，关闭失败返回 `false`。

**示例**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // 创建客户端并连接到 WebSocket 服务端
    $client = new Client('127.0.0.1', 9501);
    
    // 升级为 WebSocket 连接
    $ret = $client->upgrade('/');
    
    if (!$ret) {
        echo "WebSocket 握手失败\n";
        return;
    }
    
    echo "WebSocket 连接成功！\n";
    
    // 发送消息
    $client->push("Hello WebSocket!");
    echo "发送: Hello WebSocket!\n";
    
    // 接收回复
    $response = $client->recv();
    if ($response && $response->data) {
        echo "收到回复: {$response->data}\n";
    }
    
    // 继续发送几条消息
    for ($i = 1; $i <= 3; $i++) {
        $msg = "消息第 {$i} 条";
        $client->push($msg);
        echo "发送: {$msg}\n";
        
        $resp = $client->recv();
        if ($resp && $resp->data) {
            echo "收到回复: {$resp->data}\n";
        }
        
        Coroutine::sleep(1);
    }
    
    // ===== 关键：使用 disconnect() 优雅关闭连接 =====
    echo "\n准备优雅断开连接...\n";
    $client->disconnect();
    echo "已调用 disconnect()，发送了关闭帧\n";
    
    // 验证连接状态
    if ($client->isConnected()) {
        echo "连接仍然存在\n";
    } else {
        echo "连接已断开\n";
    }
});
```

> [!WARNING]
> 和 [close](/zh/client/http_websocket.html#close) 不同的是，`disconnect` 会发送一个 `WebSocket` 关闭帧给 `WebSocket` 服务端实现优雅关闭。
