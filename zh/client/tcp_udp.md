# TCP/UDP客户端

`Swoole\Coroutine\Client` 是对底层 `Socket` 的协程化封装，旨在为 `TCP`、`UDP` 及 `Unix Socket` 协议提供统一的客户端编程接口。使用时，创建 `Swoole\Coroutine\Client` 对象即可开始构建网络请求。

## 方法

### __construct

构造函数

```php
public function __construct(int $type)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$type` | 表示连接的类型。 | 必填 |

**支持的类型**

| 常量                        | 协议族         | 传输协议    | 套接字类型           | 通信范围         | 主要特点与适用场景                                                        |
|:--------------------------|:------------|:--------|:----------------|:-------------|:-----------------------------------------------------------------|
| **`SWOOLE_SOCK_TCP`**     | IPv4        | TCP     | 流式（SOCK_STREAM） | 跨网络（局域网/互联网） | **最常用**。面向连接、可靠、有序。适用于 HTTP、HTTPS、MySQL、Redis 等绝大多数网络服务。         |
| **`SWOOLE_SOCK_TCP6`**    | IPv6        | TCP     | 流式（SOCK_STREAM） | 跨网络（IPv6 网络） | 功能与 TCP 相同，但使用 IPv6 地址。适用于需要 IPv6 支持的现代网络环境。                     |
| **`SWOOLE_SOCK_UDP`**     | IPv4        | UDP     | 数据报（SOCK_DGRAM） | 跨网络（局域网/互联网） | 无连接、不可靠但速度快。适用于 DNS 查询、音视频流、实时游戏、物联网设备等场景。                       |
| **`SWOOLE_SOCK_UDP6`**    | IPv6        | UDP     | 数据报（SOCK_DGRAM） | 跨网络（IPv6 网络） | 功能与 UDP 相同，但使用 IPv6 地址。                                          |
| **`SWOOLE_UNIX_STREAM`**  | Unix Domain | 本地进程间通信 | 流式（SOCK_STREAM） | **仅限本机**     | 面向连接、可靠的本地 IPC。速度极快，不经过网络栈。常用于同一机器上高性能服务间的通信（如 Nginx 与 PHP-FPM）。 |
| **`SWOOLE_UNIX_DGRAM`**   | Unix Domain | 本地进程间通信 | 数据报（SOCK_DGRAM） | **仅限本机**     | 无连接的本地 IPC。同样高速，适用于本机内对可靠性要求不高的快速数据交换。                           |

> [!TIP]
> `SWOOLE_UNIX_STREAM` / `SWOOLE_UNIX_DGRAM` 与 [`SWOOLE_SOCK_UNIX_STREAM` / `SWOOLE_SOCK_UNIX_DGRAM`](/zh/server/properties.html#type) 是同一组常量的两种写法，值相同，可互换使用。

### set

设置客户端参数。

```php
public function set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 客户端配置 | 必填 |

**返回值**：执行成功返回 `true`，操作失败返回 `false`。

**支持的配置项**

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

连接服务器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 服务器地址【支持自动异步解析域名，`$host` 可直接传入域名】 | 必填 |
| `$port` | 服务器端口 | `0` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | `0.5` |
| `$flag` | `UDP客户端` 设置 `$flag = 1` 时，连接会被“绑定”到 `connect` 方法中指定的 `$host` 和 `$port`。此后，它将只接收来自这个特定 IP 和端口的数据包，并丢弃所有其他来源的数据。这可以让你在 UDP 这种 `无连接` 协议上，模拟出一个类似“连接”的行为。<br>`TCP客户端` 设置 `$flag = 1` 时，表示设置为非阻塞模式，之后此 `fd` 会变成异步 IO，`connect` 会立即返回。如果将 `$flag` 设置为 `1`，那么在 `send/recv` 前必须使用 [swoole_client_select](/zh/client/sync.html#swoole-client-select) 来检测是否可以读写。 | `0` |

**返回值**：成功返回 `true`。失败返回 `false`，请检查 `errCode` 属性获取失败原因。

### recv

从服务器端接收数据。

```php
public function recv(float $timeout = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | `0` |

**返回值**：操作成功返回字符串，连接已关闭返回空字符串，返回 `false` 表示操作失败，请检查 `$client->errCode`。

### peek

从内核接收缓冲区中读取数据，但并不从缓冲区中移除这些数据。

```php
public function peek(int $length = 65535): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 获取的数据长度 | `65535` |

**返回值**：操作成功返回字符串，连接已被关闭 `peek` 会返回空字符串，缓存区为空时返回 `false`，请检查 `$client->errCode`。

> [!WARNING]
> `peek` 方法是非阻塞的，它会立即返回。
> 你可以把它理解成一次“偷看”或“预览”，这让你可以在不消费数据的情况下，先检查一下缓冲区里有什么内容。

### send

发送数据。

```php
public function send(string $data, float $timeout = 0): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 为发送的数据，必须为字符串类型，支持二进制数据 | 必填 |
| `$timeout` | 超时事件。 | `0` |

**返回值**：发送成功返回写入 `Socket` 缓存区的字节数，底层会尽可能地将所有数据发出。如果返回的字节数与传入的 `$data` 长度不同，可能是 `Socket` 已被对端关闭，再下一次调用 `send` 或 `recv` 时将返回对应的错误码。发送失败返回 false，可以使用 `$client->errCode` 获取错误原因。

### sendfile

将客户端上的一个文件直接发送给已连接的 `TCP` 服务端

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 指定要发送文件的路径 | 必填 |
| `$offset` | 上传文件的偏移量【可以指定从文件的中间部分开始传输数据。此特性可用于支持断点续传。】 | `0` |
| `$length` | 发送数据的尺寸【默认为整个文件的尺寸】 | `0` |

**返回值**：执行成功返回 `true`，如果传入的文件不存在，将返回 `false`。

### sendto

专门为 `UDP` 协议设计的方法，用于向指定的 `IP` 和 `端口` 发送数据。

```php
public function sendto(string $address, int $port, string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$address` | 目标地址。 | 必填 |
| `$port` | 目标端口。 | 必填 |
| `$data` | 需要发送的数据。 | 必填 |

**返回值**：成功时返回 `true`。失败时返回 `false`，可以通过 `$client->errCode` 获取错误码。

### recvfrom

专门为 `UDP` 协议准备的方法，用来接收数据并“顺便”获取发送方的地址信息。

```php
public function recvfrom(int $length, mixed &$address, mixed &$port = 0): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 接收的数据长度 | 必填 |
| `&$address` | 这是一个引用参数，调用后会被赋值为发送方的 IP 地址。 | 必填 |
| `&$port` | 这也是一个引用参数，调用后会被赋值为发送方的端口。 | `0` |

**返回值**：操作成功时返回接收到的数据字符串。如果服务器关闭了连接，返回空字符串。如果发生错误（如超时），返回 `false`，此时可以通过 `$client->errCode` 获取具体的错误码。

### enableSSL

动态开启 SSL 隧道加密。

```php
public function enableSSL(): bool
```

**返回值**：执行成功返回 `true`，否则返回 `false`

> [!IMPORTANT]
> 只有在编译 `swoole` 时开启了 [--enable-openssl](/zh/start/install.html#编译选项详解) 才能使用该函数。但是 `Swoole 6.2.0` 已经默认支持 `openssl`。

### getPeerCert

获取服务器端证书信息。

```php
public function getPeerCert(): string|bool
```

**返回值**：成功返回一个 `X509` 证书字符串信息，失败返回 `false`。

> [!IMPORTANT]
> 只有在编译 `swoole` 时开启了 `--enable-openssl` 才能使用该函数。但是 `Swoole 6.2.0` 已经默认支持 `openssl`。

### verifyPeerCert

验证服务器端证书。

```php
public function verifyPeerCert(bool $allow_self_signed = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$allow_self_signed` | 是否允许自签名证书；其它值：`true` | `false` 不允许自签名证书 |

**返回值**：操作成功返回 `true`，发送失败返回 `false`。

> [!IMPORTANT]
> 只有在编译 `swoole` 时开启了 `--enable-openssl` 才能使用该函数。但是 `Swoole 6.2.0` 已经默认支持 `openssl`。

### exportSocket

将当前连接导出为 [`Swoole\Coroutine\Socket`](/zh/client/socket.html) 对象，可调用更底层的方法。

```php
public function exportSocket(): Swoole\Coroutine\Socket
```

**返回值**：返回当前连接的 `Coroutine\Socket` 对象。

### isConnected

返回客户端的连接状态。

```php
public function isConnected(): bool
```

**返回值**：返回 `true`，表示当前已连接到服务器，返回 `false`，表示当前未连接到服务器。

### getsockname

方法用于获取本地的 IP 地址和端口。

```php
public function getsockname(): false|array
```

**返回值**：调用成功返回，包含 `address` 和 `port` 的数组；调用失败返回 `false`，并设置 `errCode` 属性

### getpeername

用于获取连接的对端（即远程端）的 IP 地址和端口。

```php
public function getpeername(): false|array
```

**返回值**：调用成功返回，包含 `address` 和 `port` 的数组；调用失败返回 `false`，并设置 `errCode` 属性

### close

关闭客户端。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，否则返回 `false`。


