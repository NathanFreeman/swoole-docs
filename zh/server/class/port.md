# Swoole\Server\Port

如果你已经阅读过[多端口监听](/zh/server/port.html)，会发现 `Swoole\Server\Port` 是 `Swoole` 服务器中实现单机多端口混合协议的核心类。它让你可以为一个异步服务器主服务添加多个额外的监听端口，并为每个端口独立设置协议解析规则和事件回调函数。

你不能直接 `new` 这个对象，而是通过主服务器的 [listen](/zh/server/methods.html#listen) 方法来创建。

## 方法

### on

为额外端口绑定专属的回调函数。这样，同一个 [worker](/zh/server/process_thread.html) 进程在处理不同端口的连接时，会执行不同的业务代码。

```php
public function on(string $event_name, callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event_name` | 事件名称 | 必填 |
| `$callback` | 设置事件回调函数 | 必填 |

| 该方法支持设置的事件 | 说明 |
| :--- | :--- |
| [connect](/zh/server/events.html#connect) | 客户端连接建立时触发 |
| [close](/zh/server/events.html#close) | 客户端连接关闭时触发 |
| [disconnect](/zh/server/events.html#disconnect) | WebSocket 连接断开时触发 |
| [receive](/zh/server/events.html#receive) | 接收 TCP 数据流时触发 |
| [packet](/zh/server/events.html#packet) | 接收 UDP 数据包时触发 |
| [message](/zh/server/events.html#message) | 接收 WebSocket 消息时触发 |
| [request](/zh/server/events.html#request) | 接收到 HTTP 请求时触发 |
| [handshake](/zh/server/events.html#handshake) | WebSocket 握手时触发 |
| [beforeHandshakeResponse](/zh/server/events.html#beforehandshakeresponse) | 发送 WebSocket 握手响应前触发 |
| [open](/zh/server/events.html#open) | WebSocket 握手成功后连接开启时触发 |

### set

为主端口和额外端口配置不同的通信协议。例如，主端口处理 `WebSocket`，额外端口处理 `TCP` 流式处理

```php
public function set(array $settings): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 设置服务器运行时的配置 | 必填 |

| 该方法支持的配置项                                                                      | 说明                                                                                                 |
|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| [backlog](/zh/server/setting.html#backlog)                                     | 控制 TCP 全连接队列（Accept Queue）的最大长度。                                                                   |
| [socket_buffer_size](/zh/server/setting.html#socket-buffer-size)               | 该配置控制着服务端向客户端发送数据的缓冲区大小                                                                            |
| [heartbeat_idle_time](/zh/server/setting.html#heartbeat-idle-time)             | 客户端 TCP 连接最大允许空闲的时间，单位为秒。表示一个客户端连接如果 heartbeat_idle_time 秒内未向服务器发送任何数据，此连接将被强制关闭。                      |
| [buffer_high_watermark](/zh/server/setting.html#buffer-high-watermark)         | 设置服务端和客户端的缓冲区的高水位线。它本身不直接限制内存大小，而是作为一个预警阈值。单位为字节                                                   |
| [buffer_low_watermark](/zh/server/setting.html#buffer-low-watermark)           | 设置服务端和客户端的缓冲区的低水位线。它本身不直接限制内存大小，而是作为一个预警阈值。单位为字节                                                   |
| [max_idle_time](/zh/server/setting.html#max-idle-time)                         | 该配置指定 TCP 连接的最大空闲时长。若连接在 max_idle_time 内未发生任何读写操作，底层将主动关闭该连接                                       |
| [open_tcp_nodelay](/zh/server/setting.html#open-tcp-nodelay)                   | 关闭 Nagle 算法，让小数据包能立刻被发送出去，而不是等待合并。                                                                 |
| [tcp_defer_accept](/zh/server/setting.html#tcp-defer-accept)                   | tcp_defer_accept 参数用于控制服务器在新建 TCP 连接时，是否延迟分配套接字和应用层资源                                              |
| [open_tcp_keepalive](/zh/server/setting.html#open-tcp-keepalive)               | 开启 TCP 的 KeepAlive 机制，让操作系统内核自动检测连接是否仍然有效，并自动清理已失效的连接。                                             |
| [tcp_keepidle](/zh/server/setting.html#tcp-keepidle)                           | TCP 连接在空闲多长时间后，系统内核才开始发送第一个 KeepAlive 探测包，检测这个连接是否还活着。                                             |
| [tcp_keepinterval](/zh/server/setting.html#tcp-keepinterval)                   | TCP KeepAlive 探测包的发送间隔。它决定了在第一次探测没有收到响应后，每隔多久重新发送一次探测包。                                            |
| [tcp_keepcount](/zh/server/setting.html#tcp-keepcount)                         | TCP KeepAlive 探测失败后，关闭连接前的最大重试次数。它决定了在收到探测包的响应之前，系统愿意尝试多少次。                                        |
| [tcp_user_timeout](/zh/server/setting.html#tcp-user-timeout)                   | 当发送方发送数据后，如果迟迟收不到对方的 ACK 确认，TCP 会按指数退避算法重传数据。累计重传时间一旦超过 tcp_user_timeout 的值，连接会被关闭。                  |
| [tcp_fastopen](/zh/server/setting.html#tcp-fastopen)                           | 开启 TCP 快速握手特性，它允许在三次握手过程中就携带应用数据，从而减少一个 RTT（往返时间）的延迟。                                              |
| [open_eof_check](/zh/server/setting.html#open-eof-check)                       | 此选项用于检测客户端发来的数据：仅当数据包结尾匹配指定分隔符（如 `\r\n`）时，底层才会停止接收数据；否则，数据将被持续拼接，直到超出缓存区限制或接收超时才会中止。                 |
| [open_eof_split](/zh/server/setting.html#open-eof-split)                       | 底层逐字节扫描数据流，每次遇到指定分隔符（如 `\r\n`）就自动切分并交付一个完整数据包                                                        |
| [package_eof](/zh/server/setting.html#package-eof)                             | 设置数据包指定分隔符。                                                                                        |
| [open_length_check](/zh/server/setting.html#open-length-check)                 | 启用数据包长度检测协议解析功能。                                                                                   |
| [package_length_type](/zh/server/setting.html#package-length-type)             | 指定长度字段的类型（如 'N' 表示 4 字节无符号长整型）。与 PHP 的 pack 函数一样。                                                  |
| [package_length_offset](/zh/server/setting.html#package-length-offset)         | 定位长度字段位置的核心参数。它告诉服务器：“长度字段这个值，存放在整个数据包的第几个字节”。                                                     |
| [package_body_offset](/zh/server/setting.html#package-body-offset-package-body-start)             | 定位包体数据起始位置的偏移量。告诉服务器：真正的业务数据（包体）从数据包的第几个字节开始。                                                      |
| [package_length_func](/zh/server/setting.html#package-length-func)             | 自定义一个 PHP 函数来告诉 Swoole 一个完整数据包究竟有多长。这个函数会接收当前接收到的部分数据（存储在一个缓冲区中），然后你需要在这个函数里实现你的核心逻辑：解析并返回整个数据包的长度。 |
| [package_max_length](/zh/server/setting.html#package-max-length)               | 设置能接收的最大数据包尺寸，单位为字节。                                                                               |
| [open_http_protocol](/zh/server/setting.html#open-http-protocol)               | 开启 HTTP 协议                                                                                         |
| [open_websocket_protocol](/zh/server/setting.html#open-websocket-protocol)     | 开启 WebSocket 协议                                                                                    |
| [open_http2_protocol](/zh/server/setting.html#open-http2-protocol)             | 开启 HTTP2 协议                                                                                        |
| [open_mqtt_protocol](/zh/server/setting.html#open-mqtt-protocol)               | 开启 MQTT 协议                                                                                         |
| [open_redis_protocol](/zh/server/setting.html#open-redis-protocol)             | 开启 Redis 协议                                                                                        |
| [ssl_compress](/zh/server/setting.html#ssl-compress)                           | 设置是否启用 SSL/TLS 压缩                                                                                  |
| [ssl_protocols](/zh/server/setting.html#ssl-protocols)                         | 设置 OpenSSL 隧道加密的协议                                                                                 |
| [ssl_verify_peer](/zh/server/setting.html#ssl-verify-peer)                     | 服务 SSL 设置验证对端证书                                                                                    |
| [ssl_allow_self_signed](/zh/server/setting.html#ssl-allow-self-signed)         | 允许自签名证书                                                                                            |
| [ssl_client_cert_file](/zh/server/setting.html#ssl-client-cert-file)           | 根证书，用于验证客户端证书                                                                                      |
| [ssl_cafile](/zh/server/setting.html#ssl-cafile)                               | 用来验证远端证书所用到的 CA 证书。本选项值为 CA 证书在本地文件系统的全路径及文件名。                                                                                            |
| [ssl_capath](/zh/server/setting.html#ssl-capath)                               | 如果未设置 ssl_cafile，或者 ssl_cafile 所指的文件不存在时，会在 ssl_capath 所指定的目录搜索适用的证书。该目录必须是已经经过哈希处理的证书目录。                                                                                            |
| [ssl_verify_depth](/zh/server/setting.html#ssl-verify-depth)                   | 如果证书链条层次太深，超过了本选项的设定值，则终止验证。                                                                        |
| [ssl_prefer_server_ciphers](/zh/server/setting.html#ssl-prefer-server-ciphers) | 决定当客户端（浏览器）和服务器建立加密连接时，由谁来选择使用哪种加密算法（密码套件）。                                                                               |
| [ssl_ciphers](/zh/server/setting.html#ssl-ciphers)                             | 设置 OpenSSL 加密算法，默认值为：`EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH`                                                                                   |
| [ssl_ecdh_curve](/zh/server/setting.html#ssl-ecdh-curve)                       | 专门控制 ECDH 密钥交换过程中所使用的椭圆曲线。                                                                         |
| [ssl_dhparam](/zh/server/setting.html#ssl-dhparam)                             | 用于指定 Diffie-Hellman (DH) 密钥交换所使用的强参数。当服务器使用老式的 DHE 加密套件时，这个指令告诉服务器应该使用哪个“大质数文件”来生成临时的会话密钥，从而保证安全性。                                                                     |
| [ssl_sni_certs](/zh/server/setting.html#ssl-sni-certs)                         | 设置 SNI (Server Name Identification) 证书。                                                             |

### getCallback

根据事件名，获取对应的回调函数。

```php
public function getCallback(string $event_name): \Closure|string|null|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event_name` | 事件回调名 | 必填 |

### getSocket

将端口的监听 `socket` 导出为 `sockets` 扩展的 `\Socket` 对象，用于对监听 `socket` 执行原生 `sockets` 操作。

```php
public function getSocket(): \Socket|false
```

**返回值**：成功返回 `\Socket` 对象，失败返回 `false`。

> [!NOTE]
> 需要编译 `Swoole` 时启用 `sockets` 扩展支持（[--enable-sockets](/zh/start/install.html#特殊与调试选项)）。自 `v6.1.2` 起底层通过 `dup()` 复制文件描述符后导出，关闭导出对象不会影响 `Swoole` 自身的监听 `socket`。

## 示例

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 1. 主端口配置：假设用于处理某种定长包
$server->set([
    'open_length_check' => true,
    'package_length_type' => 'C',
    'package_length_offset' => 100, // 假设第100字节是包长度的值
    'package_max_length' => 1000,  // 发送到9501端口的数据一定不会超过1000字节
]);

// 主端口接收事件
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9501 端口收到数据\n";
});

// 2. 监听子端口 9502
$port = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// 【关键】必须重写配置，否则 9502 也会使用上面的 package_length_type=C，package_length_offset=100和package_max_length=1000
$port->set([
    'open_length_check' => true,
    'package_length_type' => 'N',
    'package_length_offset' => 200, // 假设第200字节是包长度的值
    'package_max_length' => 800000, // 发送到9502端口的数据一定不会超过800000字节
]);

// 【关键】必须为子端口单独绑定事件，否则还是触发主端口的receive事件
$port->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9502 端口收到数据，使用不同的解析规则\n";
});

$server->start();
```