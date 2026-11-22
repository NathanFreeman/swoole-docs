# HTTP2协程客户端

`Swoole\Coroutine\Http2\Client` 是 `Swoole` 扩展提供的一个高性能、协程驱动的 `HTTP/2` 客户端。它让你能在 `PHP` 中通过协程，以非阻塞、同步代码的方式连接 `HTTP/2` 服务器。

## 属性

### errCode

最后一次操作的错误码。成功时为 0，失败时为具体的错误代码。

```php
public int $errCode = 0;
```

### errMsg

最后一次操作的错误信息。

```php
public string $errMsg = '';
```

### sock

`Socket` 文件描述符。未连接时值为 `-1`，连接成功后为实际的 `socket fd`。

```php
public int $sock = -1;
```

### type

客户端类型标识

```php
public int $type = 0;
```

### setting

通过 [set](/zh/client/http2.html#set) 方法设置的客户端配置选项只读数组。未设置任何配置时为 `null`。

```php
public array $setting = null;
```

### socket

`Socket` 资源对象。允许直接操作底层的 `socket` 资源。

```php
public ?\Socket $socket = null;
```

### connected

连接状态。`true` 表示当前已连接到服务器，`false` 表示未连接。

```php
public bool $connected = false;
```

### host

远程服务器的主机地址。在构造函数中设置的 IP 地址或域名。

```php
public ?string $host = null;
```

### port

远程服务器的端口号。构造函数中设置的端口。

```php
public int $port = 0;
```

### ssl

`SSL/TLS` 加密标志。`true` 表示启用了 `SSL` 连接，`false` 表示未启用。

```php
public bool $ssl = false;
```

### serverLastStreamId

服务器端最后使用的 `Stream ID`。用于跟踪 `HTTP/2` 连接中服务器端发起的最后一个流标识符，在处理服务器推送或检测连接状态时有用

```php
public int $serverLastStreamId = 0;
```

## 方法

### __construct

构造函数。

```php
public function __construct(string $host, int $port = 80, bool $open_ssl = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 目标主机的 IP 地址【`$host` 如果为域名底层需要进行一次 `DNS` 查询】 | 必填 |
| `$port` | 目标端口【`Http` 一般为 `80` 端口，`Https` 一般为 `443` 端口】 | `80` |
| `$open_ssl` | 是否开启 `TLS/SSL` 隧道加密【`https` 网站必须设置为 `true`】；其它值：`true` | `false` |

### set

设置客户端参数，如超时时间、并发流限制等。

```php
public function set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 客户端配置 | 必填 |

**返回值**：执行成功返回 `true`，操作失败返回 `false`。

**支持的配置**

| 配置项                     | 正确说明                                                                                  | 示例值                                                                   |
|:------------------------|:--------------------------------------------------------------------------------------|:----------------------------------------------------------------------|
| `timeout`               | **全局超时**（秒），统一控制连接、读取、写入的超时时间。优先级低于 `connect_timeout`、`read_timeout`、`write_timeout`。 | `0.5`                                                                 |
| `connect_timeout`       | **连接超时**（秒），单独控制 TCP 握手阶段的超时时间。                                                       | `1.0`                                                                 |
| `read_timeout`          | **读取超时**（秒），单独控制 `recv()` 等待数据的超时时间。                                                  | `0.5`                                                                 |
| `write_timeout`         | **写入超时**（秒），单独控制 `send()` 发送数据的超时时间。                                                  | `0.5`                                                                 |
| `bind_address`          | 多网卡环境下，强制绑定本地 IP 地址。需与 `bind_port` 同时使用。                                              | `'192.168.1.100'`                                                     |
| `bind_port`             | 强制绑定本地端口号。需与 `bind_address` 同时使用。                                                     | `9501`                                                                |
| [`socket_buffer_size`](/zh/server/setting.html#socket-buffer-size)    | 发送缓冲区总大小（字节）。                                                                         | `1024 * 1024 * 2`                                                     |
| [`open_tcp_nodelay`](/zh/server/setting.html#open-tcp-nodelay)      | 关闭 Nagle 算法，小数据包立即发送，不等待合并。                                                           | `true`                                                                |
| `socks5_host`           | SOCKS5 代理服务器 IP 或域名。                                                                  | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 代理服务器端口。                                                                       | `1080`                                                                |
| `socks5_username`       | SOCKS5 代理认证用户名（可选）。                                                                   | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 代理认证密码（可选）。                                                                    | `'123456'`                                                            |
| `http_proxy_host`       | HTTP 代理服务器 IP 或域名。                                                                    | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP 代理服务器端口。                                                                         | `8080`                                                                |
| `http_proxy_username`   | HTTP 代理认证用户名（可选）。                                                                     | `'admin'`                                                             |
| `http_proxy_password`   | HTTP 代理认证密码（可选）。                                                                      | `'123456'`                                                            |
| `open_ssl`              | 启用 SSL/TLS 加密（等同于在构造函数中使用 `SWOOLE_SSL` 标志）。                                           | `true`                                                                |
| [`open_http2_protocol`](/zh/server/setting.html#open-http2-protocol)   | 启用 HTTP/2 协议支持（需在 SSL 之上使用）。                                                          | `true`                                                                |
| [`open_eof_check`](/zh/server/setting.html#open-eof-check)        | 启用 EOF 边界检测，仅当数据包结尾匹配分隔符时才停止接收。                                                       | `true`                                                                |
| [`open_eof_split`](/zh/server/setting.html#open-eof-split)        | 启用 EOF 自动切分，逐字节扫描并按分隔符切分完整数据包。                                                        | `true`                                                                |
| [`package_eof`](/zh/server/setting.html#package-eof)           | 指定 EOF 分隔符。                                                                           | `"\r\n"`                                                              |
| `open_fastcgi_protocol` | 启用 FastCGI 协议解析。                                                                      | `true`                                                                |
| [`open_mqtt_protocol`](/zh/server/setting.html#open-mqtt-protocol)    | 启用 MQTT 协议解析。                                                                         | `true`                                                                |
| [`open_length_check`](/zh/server/setting.html#open-length-check)     | 启用长度检测协议解析。                                                                           | `true`                                                                |
| [`package_length_type`](/zh/server/setting.html#package-length-type)   | 长度字段类型，与 `pack()` 函数一致，如 `'N'` 表示 4 字节无符号长整型。                                         | `'N'`                                                                 |
| [`package_length_offset`](/zh/server/setting.html#package-length-offset) | 长度字段在数据包中的起始偏移量（字节）。                                                                  | `0`                                                                   |
| [`package_body_offset`](/zh/server/setting.html#package-body-offset-package-body-start)   | 包体数据在数据包中的起始偏移量（字节）。                                                                  | `4`                                                                   |
| [`package_length_func`](/zh/server/setting.html#package-length-func)   | 自定义长度解析函数，返回完整数据包的长度。                                                                 | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/zh/server/setting.html#package-max-length)    | 最大可接收数据包大小（字节）。                                                                       | `8192`                                                                |
| [`ssl_protocols`](/zh/server/setting.html#ssl-protocols)         | 允许的 SSL/TLS 协议版本。                                                                     | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/zh/server/setting.html#ssl-compress)          | 是否启用 SSL/TLS 压缩。                                                                      | `false`                                                               |
| [`ssl_cert_file`](/zh/server/setting.html#ssl-cert-file-ssl-key-file)         | 客户端证书文件路径（双向验证时使用）。                                                                   | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/zh/server/setting.html#ssl-cert-file-ssl-key-file)          | 客户端私钥文件路径（双向验证时使用）。                                                                   | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | 私钥文件密码（若已加密）。                                                                         | `'pass123'`                                                           |
| `ssl_host_name`         | SNI 域名，用于服务端返回正确的 SSL 证书。                                                             | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/zh/server/setting.html#ssl-verify-peer)       | 是否验证对端证书。                                                                             | `true`                                                                |
| [`ssl_allow_self_signed`](/zh/server/setting.html#ssl-allow-self-signed) | 是否允许自签名证书。                                                                            | `true`                                                                |
| [`ssl_cafile`](/zh/server/setting.html#ssl-cafile)            | CA 证书文件路径，用于验证对端证书签名。                                                                 | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/zh/server/setting.html#ssl-capath)            | CA 证书目录路径（需为哈希目录），`ssl_cafile` 未设置或无效时使用。                                             | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/zh/server/setting.html#ssl-verify-depth)      | 证书链验证的最大深度，超过则终止验证。                                                                   | `5`                                                                   |
| [`ssl_ciphers`](/zh/server/setting.html#ssl-ciphers)           | 设置 OpenSSL 加密算法套件。                                                                    | `'ECDHE-RSA-AES128-GCM-SHA256'`                                       |
| [`ssl_ecdh_curve`](/zh/server/setting.html#ssl-ecdh-curve)        | 控制 ECDH 密钥交换所使用的椭圆曲线。                                                                 | `'secp256r1'`                                                         |
| `ssl_grease`            | 启用 TLS GREASE（防僵化）扩展，增强与不标准服务端的兼容，只适用于谷歌的`BoringSSL`。                                 | `true`                                                                |

### connect

连接到目标服务器。

```php
public function connect(): bool
```

**返回值**：连接成功，返回 `true`；连接失败，返回 `false`，请检查 `errCode` 属性获取错误码。

### stats

获取流状态。

```php
public function stats(string $key = ''): array|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 指定的 key | `''` |

**返回值**：指定 `$key` 则返回特定值，否则返回数组。

### isStreamExist

判断指定的流是否存在。

```php
public function isStreamExist(int $streamId): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$streamId` | 指定的流 id。 | 必填 |

**返回值**：流存在返回 `true`，不存在返回 `false`。

### send

向服务器发送请求，底层会自动建立一个 `Http2` 的 `stream`。可以同时发起多个请求。

```php
public function send(\Swoole\Coroutine\Http2\Request $request): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$request` | 发送 [Swoole\Coroutine\Http2\Request](/zh/client/request.html) 对象 | 必填 |

**返回值**：成功返回流的编号，编号为从 `1` 开始自增的奇数；失败返回 `false`。

### write

向服务器发送更多数据帧，可以多次调用向同一个 `stream` 写入数据帧。

```php
public function write(int $streamId, mixed $data, bool $end = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$streamId` | 流编号，由 `send` 方法返回 | 必填 |
| `$data` | 数据帧的内容，可以为字符串或数组 | 必填 |
| `$end` | 是否关闭流；其它值：`true` | `false` |

**返回值**：执行成功返回 `true`，操作失败返回 `false`。

> [!WARNING]
> 如果要使用 `write` 分段发送数据帧，必须在 `send` 请求时将 [`$request->pipeline`](/zh/client/request.html#pipeline) 设置为 `true`。
> 当发送 `end` 为 `true` 的数据帧之后，流将关闭，之后不能再调用 `write` 向此 `stream` 发送数据。

### recv

接收请求。

```php
public function recv(float $timeout = 0): \Swoole\Coroutine\Http2\Response|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：成功后返回 [Swoole\Coroutine\Http2\Response](/zh/client/response.html) 对象。

### read

和 `recv()` 基本一致, 区别在于对于 `pipeline` 类型的响应, `read` 可以分多次读取, 每次读取到部分的内容以节省内存或是尽快地接收到推送信息，而 `recv` 总是将所有帧拼接成一个完整响应后才会返回。

```php
public function read(float $timeout = 0): \Swoole\Coroutine\Http2\Response|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时时间，参考客户端超时规则；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：成功后返回 [Swoole\Coroutine\Http2\Response](/zh/client/response.html) 对象。

### ping

用于测量来自发送方的最小往返时间，以及确定空闲连接是否仍然有效。

```php
public function ping(): bool
```

**返回值**：执行成功返回 `true`，操作失败返回 `false`。

### goaway

向服务端发送 `GOAWAY` 帧，通知服务端连接即将关闭，并允许优雅地处理完已存在的请求。

```php
public function goaway(int $error_code = SWOOLE_HTTP2_ERROR_NO_ERROR, string $debug_data = ''): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$error_code` | `HTTP/2` 错误码，用于说明关闭连接的原因 | `SWOOLE_HTTP2_ERROR_NO_ERROR` |
| `$debug_data` | 可选的调试数据，会包含在发送的 `GOAWAY` 数据包中 | `''` |

**返回值**：发送成功返回 `true`，发送失败返回 `false`。

| 常量名                                    | 中文定义                                  |
|:---------------------------------------|:--------------------------------------|
| SWOOLE_HTTP2_ERROR_NO_ERROR            | 没有错误（通常用于优雅地关闭连接）                     |
| SWOOLE_HTTP2_ERROR_PROTOCOL_ERROR      | 协议错误（检测到未特别指定的协议错误）                   |
| SWOOLE_HTTP2_ERROR_INTERNAL_ERROR      | 内部错误（端点遇到意外的内部错误）                     |
| SWOOLE_HTTP2_ERROR_FLOW_CONTROL_ERROR  | 流量控制错误（对端违反了流量控制协议）                   |
| SWOOLE_HTTP2_ERROR_SETTINGS_TIMEOUT    | 设置超时（发送了 SETTINGS 帧但未及时收到响应）          |
| SWOOLE_HTTP2_ERROR_STREAM_CLOSED       | 流关闭（在流半关闭之后收到了一个帧）                    |
| SWOOLE_HTTP2_ERROR_FRAME_SIZE_ERROR    | 帧大小错误（收到的帧的大小无效或超过最大尺寸）               |
| SWOOLE_HTTP2_ERROR_REFUSED_STREAM      | 被拒绝的流（在执行任何应用处理之前拒绝了该流）               |
| SWOOLE_HTTP2_ERROR_CANCEL              | 取消（表明不再需要指定的流）                        |
| SWOOLE_HTTP2_ERROR_COMPRESSION_ERROR   | 压缩错误（无法为连接维护报头压缩的上下文）                 |
| SWOOLE_HTTP2_ERROR_CONNECT_ERROR       | 连接错误（为某个连接请求建立的连接被重置或异常关闭）            |
| SWOOLE_HTTP2_ERROR_ENHANCE_YOUR_CALM   | 提高你的稳定性（检测到远端表现出可能产生过大负载的行为）          |
| SWOOLE_HTTP2_ERROR_INADEQUATE_SECURITY | 安全性不够（底层传输存在不满足最低安全需求的属性）             |
| SWOOLE_HTTP2_ERROR_HTTP_1_1_REQUIRED   | 需要 HTTP/1.1（要求使用 HTTP/1.1 而不是 HTTP/2） |

### close

关闭连接。

```php
public function close(): bool
```

**返回值**：执行成功返回 `true`，操作失败返回 `false`。

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

