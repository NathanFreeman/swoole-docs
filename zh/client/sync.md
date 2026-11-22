# 同步阻塞客户端

`Swoole` 提供了 `Swoole\Client` 对 `TCP/UDP/Unix Socket` 客户端的封装，只需通过 `new Swoole\Client()` 即可使用。

相比传统的 PHP `streams` 系列函数，`Client` 具有以下显著优势：

- **超时控制更灵活**：`stream` 函数的默认超时时间较长，若对端响应缓慢，可能导致请求长时间阻塞；而 `Client`
  支持更精细的超时设置，便于业务控制。
- **突破 8192 字节缓冲区限制**：`stream` 的 `fread` 默认缓冲区仅为 8192 字节，无法高效处理 UDP 大包；`Client`
  则无此限制，可顺畅收发大数据包。
- **支持 [`waitall`](#recv) 一次读取完整包**：在已知包长度的场景下，`Client` 可通过 `waitall` 一次性读取完整数据，无需像 `stream`
  那样循环调用 `fread`，简化编码并提升效率。
- **支持 UDP Connect**：`Client` 支持 UDP 连接绑定，可有效避免 UDP 通信中常见的“串包”问题，提升数据准确性。
- **纯 C 实现，性能更优**：`Client` 是专为 Socket 处理优化的纯 C 扩展，内部逻辑简洁高效；而 `stream` 函数功能复杂、层次较多，性能开销相对更大。
- **支持多客户端并发管理**：配合 `swoole_client_select` 函数，可轻松实现对多个 `Client` 实例的并发控制，便于构建高并发网络客户端。

综上，`Swoole\Client` 在易用性、性能、包处理能力和并发管理方面均优于传统 `streams`，尤其适用于对稳定性和性能有较高要求的网络通信场景。

## 属性

### errCode

最近一次操作的错误码。

```php
public int $errCode = 0;
```

### sock

当前连接的文件描述符。

```php
public int $sock = 0;
```

### reuse

是否重用当前连接。

```php
public bool $reuse = false;
```

### reuseCount

当前连接重用次数。

```php
public int $reuseCount = 0;
```

### type

当前连接类型。

```php
public int $type = 0;
```

### id

构造函数启用长连接指定的 `key`。

```php
public string $id = '';
```

### setting

当前客户端运行配置。

```php
public ?array $setting;
```

## 方法

### __construct

创建一个 `Swoole\Client` 的对象。

```php
public function __construct(int $type, bool $async = false, string $id = '')
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$type` | 表示连接的类型【支持 `SWOOLE_SOCK_TCP`、`SWOOLE_SOCK_TCP6`、`SWOOLE_SOCK_UDP`、`SWOOLE_SOCK_UDP6`】。 | 必填 |
| `$async` | 同步阻塞模式，只能设置为 `false`。 | `false` |
| `$id` | 用于长连接的 `key`【默认使用 `IP:PORT` 作为 `key`。相同的 `key`，即使 new 两次也只用一个 TCP 连接】 | `IP:PORT` |

**长连接**

- 加入 `SWOOLE_KEEP` 标志后，表示开启长连接。此时，所创建的 `TCP` 连接在 `PHP` 请求结束或调用 [close](/zh/client/sync.html#close) 方法时，并不会被关闭，而是会被保留以供复用。当再次调用 [connect](/zh/client/sync.html#connect) 时，将优先复用之前已建立的连接。
- 默认情况下，长连接以 `IP:PORT` 作为键值进行存储与复用。你也可以通过第 `3` 个参数，手动指定自定义的键值。

```php
<?php
use Swoole\Client;
$client = new Client(SWOOLE_SOCK_TCP | SWOOLE_KEEP); // 开启长连接
```

> [!WARNING]
> 在协程环境下使用此 `Swoole\Client` 会导致退化为同步阻塞环境。

### set

设置客户端运行配置。

```php
public function set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 客户端运行时配置 | 必填 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

**支持的配置项**

| 配置项                     | 说明                           | 示例值                                                                   |
|:------------------------|:-----------------------------|:----------------------------------------------------------------------|
| [`open_eof_check`](/zh/server/setting.html#open-eof-check)        | 启用 EOF 边界检测，数据包结尾匹配分隔符时才停止接收 | `true`                                                                |
| [`open_eof_split`](/zh/server/setting.html#open-eof-split)        | 启用 EOF 自动切分，逐字节扫描并按分隔符切分数据包  | `true`                                                                |
| [`package_eof`](/zh/server/setting.html#package-eof)           | 指定 EOF 分隔符                   | `"\r\n"`                                                              |
| [`open_length_check`](/zh/server/setting.html#open-length-check)     | 启用长度检测协议解析                   | `true`                                                                |
| [`package_length_type`](/zh/server/setting.html#package-length-type)   | 长度字段类型，与 `pack` 函数一致         | `'N'`（4字节无符号长整型）                                                      |
| [`package_length_offset`](/zh/server/setting.html#package-length-offset) | 长度字段在数据包中的起始偏移量（字节）          | `0`                                                                   |
| [`package_body_offset`](/zh/server/setting.html#package-body-offset-package-body-start)   | 包体数据在数据包中的起始偏移量（字节）          | `4`                                                                   |
| [`package_length_func`](/zh/server/setting.html#package-length-func)   | 自定义长度解析函数，返回完整数据包长度          | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/zh/server/setting.html#package-max-length)    | 最大可接收数据包大小（字节）               | `8192`                                                                |
| [`open_mqtt_protocol`](/zh/server/setting.html#open-mqtt-protocol)    | 启用 MQTT 协议解析                 | `true`                                                                |
| [`socket_buffer_size`](/zh/server/setting.html#socket-buffer-size)    | 发送缓冲区总大小（字节）                 | `1024 * 1024 * 2`                                                     |
| [`buffer_high_watermark`](/zh/server/setting.html#buffer-high-watermark) | 高水位线阈值（字节）                   | `1024 * 1024`                                                         |
| [`buffer_low_watermark`](/zh/server/setting.html#buffer-low-watermark)  | 低水位线阈值（字节）                   | `512 * 1024`                                                          |
| `bind_address`          | 多网卡环境下强制绑定的本地 IP 地址          | `'192.168.1.100'`                                                     |
| `bind_port`             | 强制绑定的本地端口号                   | `9501`                                                                |
| [`open_tcp_nodelay`](/zh/server/setting.html#open-tcp-nodelay)      | 关闭 Nagle 算法，小数据包立即发送         | `true`                                                                |
| `socks5_host`           | SOCKS5 代理 IP 或域名             | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 代理端口                  | `1080`                                                                |
| `socks5_username`       | SOCKS5 代理认证用户名               | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 代理认证密码                | `'123456'`                                                            |
| `http_proxy_host`       | HTTP 代理 IP 或域名               | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP 代理端口                    | `8080`                                                                |
| `http_proxy_username`   | HTTP 代理认证用户名                 | `'admin'`                                                             |
| `http_proxy_password`   | HTTP 代理认证密码                  | `'123456'`                                                            |
| [`ssl_protocols`](/zh/server/setting.html#ssl-protocols)         | 允许的 SSL/TLS 协议版本             | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/zh/server/setting.html#ssl-compress)          | 是否启用 SSL/TLS 压缩              | `false`                                                               |
| [`ssl_cert_file`](/zh/server/setting.html#ssl-cert-file-ssl-key-file)         | 客户端证书文件路径（双向验证）              | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/zh/server/setting.html#ssl-cert-file-ssl-key-file)          | 客户端私钥文件路径（双向验证）              | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | 私钥文件密码（若已加密）                 | `'pass123'`                                                           |
| `ssl_host_name`         | SNI 域名，用于服务端返回正确证书           | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/zh/server/setting.html#ssl-verify-peer)       | 是否验证对端证书                     | `true`                                                                |
| [`ssl_allow_self_signed`](/zh/server/setting.html#ssl-allow-self-signed) | 是否允许自签名证书                    | `true`                                                                |
| [`ssl_cafile`](/zh/server/setting.html#ssl-cafile)            | CA 证书文件路径                    | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/zh/server/setting.html#ssl-capath)            | CA 证书目录路径（需为哈希目录）            | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/zh/server/setting.html#ssl-verify-depth)      | 证书链验证的最大深度                   | `5`                                                                   |

> [!TIP]
> 必须在 [connect函数](/zh/client/sync.html#connect) 执行之前调用。

### connect

连接服务器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 服务器地址【支持自动异步解析域名，`$host` 可直接传入域名】 | 必填 |
| `$port` | 服务器端口 | `0` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s` + `500ms`】 | `0.5` |
| `$flag` | `UDP客户端` 设置 `$flag = 1` 时，连接会被“绑定”到 `connect` 方法中指定的 `$host` 和 `$port`。此后，它将只接收来自这个特定 IP 和端口的数据包，并丢弃所有其他来源的数据。这可以让你在 UDP 这种 `无连接` 协议上，模拟出一个类似“连接”的行为；`TCP客户端` 设置 `$flag = 1` 时，表示设置为非阻塞模式，之后此 `fd` 会变成异步 IO，`connect` 会立即返回。如果将 `$flag` 设置为 `1`，那么在 `send/recv` 前必须使用 [swoole_client_select](/zh/client/sync.html#swoole-client-select) 来检测是否可以读写。 | `0` |

**返回值**：成功返回 `true`。失败返回 `false`，请检查 `errCode` 属性获取失败原因。

**注意**

- 如果 `$flag` 为 `0`，`connect` 方法会阻塞，直到连接成功并返回 `true`。这时候就可以向服务器端发送数据或者收取数据了。
- `connect` 失败后如果希望重连一次，必须先进行 [close](/zh/client/sync.html#close) 关闭旧的 `socket`，否则会返回 `EINPROGRESS` 错误，因为当前的 `socket` 正在连接服务器，客户端并不知道是否连接成功，所以无法再次执行 `connect`。调用 `close` 会关闭当前的 `socket`，底层重新创建新的 `socket` 来进行连接。

### recv

从服务器端接收数据。

```php
public function recv(int $size = 65536, int $flag = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$size` | 接收数据的缓存区最大长度【此参数不要设置过大，否则会占用较大内存】 | `65536` |
| `$flag` | 用于控制接收行为的标志位，可以组合使用。 | `0` |

**返回值**：成功收到数据返回字符串；连接关闭返回空字符串；失败返回 `false`，并设置 `$client->errCode` 属性。

**$flag 参数支持的可选常量**

| 常量                            | 说明                                                                             |
|-------------------------------|--------------------------------------------------------------------------------|
| `Swoole\Client::MSG_WAITALL`  | 等待所有数据。recv 会一直阻塞，直到接收到的数据长度达到 $size 参数指定的字节数。注意：该常量的数值在不同文档中有差异，使用时建议直接使用常量名。 |
| `Swoole\Client::MSG_DONTWAIT` | 非阻塞模式。如果当前没有数据可读，recv 会立即返回，而不是阻塞等待。                                           |
| `Swoole\Client::MSG_PEEK`     | 窥视数据。查看数据但不从接收缓冲区中移除。再次调用 recv 时，仍然可以读到相同的数据。                                  |
| `Swoole\Client::MSG_OOB`      | 接收带外数据。用于处理TCP紧急数据。                                                            |

### send

发送数据到远程服务器，必须在建立连接后，才可向对端发送数据。

```php
public function send(string $data, int $flag = 0): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 发送内容【支持二进制数据】 | 必填 |

**返回值**：成功发送，返回已发数据长度，失败返回 `false`，并设置 `errCode` 属性。

**注意**

- 如果未执行 [connect](/zh/client/sync.html#connect)，调用 `send` 会触发警告。
- 发送的数据没有长度限制，太多数据会导致缓存区 塞满，程序会阻塞等待可写

### sendfile

发送文件到服务器，本函数是基于 `sendfile` 操作系统调用实现

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 指定要发送文件的路径 | 必填 |
| `$offset` | 上传文件的偏移量【可以指定从文件的中间部分开始传输数据。此特性可用于支持断点续传。】 | `0` |
| `$length` | 发送数据的尺寸【默认为整个文件的尺寸】 | `0` |

**返回值**：执行成功返回 `true`，如果传入的文件不存在，将返回 `false`。

> [!WARNING]
> `sendfile` 会一直阻塞直到整个文件发送完毕或者发生致命错误。

### sendto

向任意 `IP:PORT` 的主机发送 `UDP` 数据包，仅支持 `SWOOLE_SOCK_UDP/SWOOLE_SOCK_UDP6` 类型

```php
public function sendto(string $ip, int $port, string $data): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$ip` | 目标主机的 `IP` 地址，支持 `IPv4/IPv6` | 必填 |
| `$port` | 目标主机的端口 | 必填 |
| `$data` | 要发送的数据内容【不得超过 `64K`】 | 必填 |

**返回值**：执行成功返回 `true`，否则返回 `false`

### enableSSL

动态开启 SSL 隧道加密。

```php
public function enableSSL(): bool
```

**返回值**：执行成功返回 `true`，否则返回 `false`

> [!IMPORTANT]
> 只有在编译 `swoole` 时开启了 `--enable-openssl` 才能使用该函数。但是 `Swoole 6.2.0` 已经默认支持 `openssl`。

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
public function verifyPeerCert(): bool
```

**返回值**：验证成功返回 `true`，否则返回 `false`

> [!IMPORTANT]
> 只有在编译 `swoole` 时开启了 `--enable-openssl` 才能使用该函数。但是 `Swoole 6.2.0` 已经默认支持 `openssl`。

### isConnected

返回客户端的连接状态。

```php
public function isConnected(): bool
```

**返回值**：返回 `true`，表示当前已连接到服务器，返回 `false`，表示当前未连接到服务器。

### getsockname

用于获取客户端 socket 的本地 host:port。

```php
public function getsockname(): array|false
```

**返回值**：操作成功返回一个数组，否则返回 `false`。

**返回值结构如下**

| 参数名  | 类型     | 说明      |
|------|--------|---------|
| host | string | 客户端IP地址 |
| port | int    | 客户端端口号  |

### getpeername

获取对端 `socket` 的 IP 地址和端口。

```php
public function getpeername(): array|false
```

**返回值**：操作成功返回一个数组，否则返回 `false`。

**返回结构如下**

| 参数名  | 类型     | 说明      |
|------|--------|---------|
| host | string | 对端（服务器）IP地址 |
| port | int    | 对端（服务器）端口号  |

### close

关闭连接。

```php
public function close(bool $force = false): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$force` | 强制关闭连接，可以用于关闭指定 `SWOOLE_KEEP` 标志位的长连接。 | `false` |

**返回值**：操作成功返回 `true`，否则返回 `false`。

**注意**

- 启用 `SWOOLE_KEEP` 长连接后，close 调用的第一个参数要设置为 `true` 表示强行销毁长连接。
- 当一个连接被 `close` 后不要再次发起 `connect`。正确的做法是销毁当前的 `Swoole\Client`，重新创建一个 `Swoole\Client` 并发起新的连接。

### shutdown

关闭客户端

```php
public function shutdown(int $how): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$how` | 设置如何关闭客户端 | 必填 |

**返回值**：操作成功返回 `true`，否则返回 `false`。

**支持的方式有：**

| 类型                         | 说明     |
|----------------------------|--------|
| `Swoole\Client::SHUT_RDWR` | 关闭读写   |
| `Swoole\Client::SHUT_RD`   | 只关闭读操作 |
| `Swoole\Client::SHUT_WR`   | 只关闭写操作 |

### getSocket

获取底层的 `socket` 句柄，返回的对象为 `sockets` 资源句柄。

```php
public function getSocket(): \Socket|false
```

**返回值**：操作成功返回 `Socket` 对象，否则返回 `false`。

> [!IMPORTANT]
> 此方法需要依赖 `php sockets` 扩展，并且编译时需要开启 [--enable-sockets](/zh/start/install.html#编译选项详解) 选项。

### swoole_client_select

用于在同步阻塞的 Swoole 客户端中，同时监控一个或多个连接的状态变化，比如是否有数据可读、是否可写、或者是否发生了错误。

```php
function swoole_client_select(?array &$read, ?array &$write, ?array &$except, ?float $timeout = 0.5): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `&$read` | 存放需要监听是否可读的客户端对象数组。函数返回后，此数组会被修改，只保留那些真正可读的客户端。 | 必填 |
| `&$write` | 存放需要监听是否可写的客户端对象数组。函数返回后，此数组会被修改，只保留那些真正可写的客户端。 | 必填 |
| `&$except` | 存放需要监听是否发生错误的客户端对象数组。函数返回后，此数组会被修改，只保留那些发生错误的客户端。 | 必填 |
| `$timeout` | 超时时间，单位为秒。 | `0.5` |

**返回值**：调用成功返回事件的数量，并修改 `&$read`、`&$write`、`&$except` 数组；返回 `0` 表示在规定的时间内没有任何 `IO` 可用，`select` 调用已超时；失败返回 `false`。

**示例**

```php
<?php

use Swoole\Client;

$clients = array();

for($i=0; $i< 20; $i++) {
    $client = new Client(SWOOLE_SOCK_TCP, SWOOLE_SOCK_SYNC); //同步阻塞
    $ret = $client->connect('127.0.0.1', 9501, 0.5, 0);
    if(!$ret) {
        echo "Connect Server fail.errCode=".$client->errCode;
    } else {
        $client->send("HELLO WORLD\n");
        $clients[$client->sock] = $client;
    }
}

while (!empty($clients)) {
    $write = $error = array();
    $read = array_values($clients);
    $n = swoole_client_select($read, $write, $error, 0.6);
    if ($n > 0) {
        foreach ($read as $index => $c) {
            echo "Recv #{$c->sock}: " . $c->recv() . "\n";
            unset($clients[$c->sock]);
        }
    }
}
```

## 示例

```php
<?php
use Swoole\Client;
$client = new Client(SWOOLE_SOCK_TCP);
if (!$client->connect('127.0.0.1', 9501, -1)) {
    exit("connect failed. Error: {$client->errCode}\n");
}
$client->send("hello world\n");
echo $client->recv();
$client->close();
```
