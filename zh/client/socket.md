# Socket协程客户端

- `Swoole\Coroutine\Socket` 是 `Swoole` 提供的协程版底层 `Socket` 客户端/服务器类，用于在协程环境中直接操作 `TCP`、`UDP` 和
  `Unix Socket` 等传输层协议。

## 方法

### __construct

构造方法。构造 `Swoole\Coroutine\Socket` 对象。

```php
public function __construct(int $domain, int $type, int $protocol = IPPROTO_IP)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$domain` | 协议域【可使用 `AF_INET`、`AF_INET6`、`AF_UNIX`】 | 必填 |
| `$type` | 类型【可使用 `SOCK_STREAM`、`SOCK_DGRAM`、`SOCK_RAW`】 | 必填 |
| `$protocol` | 协议【可使用 `IPPROTO_TCP`、`IPPROTO_UDP`、`IPPROTO_STCP`、`IPPROTO_TIPC`，`0`】 | `IPPROTO_IP` |

### bind

绑定地址和端口。

```php
public function bind(string $address, int $port = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$address` | 绑定的地址【如 `0.0.0.0`、`127.0.0.1`】 | 必填 |
| `$port` | 绑定的端口【默认为 `0`，系统会随机绑定一个可用端口，可使用 [getsockname](/zh/client/socket.html#getsockname) 方法得到系统分配的 `port`】 | `0` |

**返回值**：绑定成功返回 `true`；绑定失败返回 `false`，请检查 `errCode` 属性获取失败原因。

### listen

开始监听。

```php
public function listen(int $backlog = 512): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$backlog` | 监听队列的长度【系统底层使用 `epoll` 实现了异步 `IO`，不存在阻塞，因此 `backlog` 的重要程度并不高】 | `512` |

**返回值**：绑定成功返回 `true`；绑定失败返回 `false`，请检查 `errCode` 属性获取失败原因。

> [!WARNING]
> 如果应用中存在阻塞或耗时逻辑，`accept` 接受连接不及时，新创建的连接就会堆积在 `backlog` 监听队列中，如超出 `backlog` 长度，服务就会拒绝新的连接进入

### accept

接受客户端发起的连接

```php
public function accept(float $timeout = 0): Socket|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时【设置超时参数后，底层会设置定时器，在规定的时间没有客户端连接到来，`accept` 方法将返回 `false`】；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：超时或 `accept` 系统调用报错时返回 `false`，可使用 `errCode` 属性获取错误码，其中超时错误码为 `ETIMEDOUT`；成功返回客户端连接的 `socket`，类型同样为 `Swoole\Coroutine\Socket` 对象。可对其执行 `send`、`recv`、`close` 等操作

### connect

连接到目标服务器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 目标服务器的地址【如 `127.0.0.1`、`192.168.1.100`、`/tmp/php-fpm.sock`、`www.baidu.com` 等，可以传入 `IP` 地址、`Unix Socket` 路径或域名。若为域名，底层会自动进行异步的 `DNS` 解析，不会引起阻塞】 | 必填 |
| `$port` | 目标服务器端口【`Socket` 的 `domain` 为 `AF_INET`、`AF_INET6` 时必须设置端口】 | `0` |
| `$timeout` | 设置超时时间【底层会设置定时器，在规定的时间内未能建立连接，`connect` 将返回 `false`】；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：超时或 `connect` 系统调用报错时返回 `false`，可使用 `errCode` 属性获取错误码，其中超时错误码为 `ETIMEDOUT`；成功返回 `true`。

### checkLiveness

通过系统调用检查连接是否存活 (在异常断开时无效, 仅能侦测到对端正常 close 下的连接断开)

```php
public function checkLiveness(): bool
```

**返回值**：连接存活时返回 `true`, 否则返回 `false`。

### getBoundCid

如果该 `Socket` 已被某个协程绑定，返回绑定它的协程 ID。

```php
public function getBoundCid(int $event): int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event` | 读写事件；其它值：[`SWOOLE_EVENT_READ`](/zh/event.html#常量) 表示读事件，`SWOOLE_EVENT_WRITE` 表示写事件 | 必填 |

**返回值**：成功返回当前绑定的协程 ID，没有绑定任何协程返回 `0`。

### peek

预览内核接收缓冲区中的数据，而不会从缓冲区中移除这些数据。

```php
public function peek(int $length = 65536): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 指定用于拷贝预览到的数据的内存大小 (注意：这里会分配内存, 过大的长度可能会导致内存耗尽)；值单位：字节 | `65536` |

**返回值**：预览成功返回数据；预览失败返回 `false`，并设置 `errCode` 属性

> [!TIP]
> 这意味着后续再调用 `recv()` 时，依然可以读到这些被 `peek` 过的内容。

### recv

用于从对端读取数据的核心方法。

```php
public function recv(int $length = 65536, float $timeout = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 指定用于接收数据的内存大小 (注意：这里会分配内存, 过大的长度可能会导致内存耗尽)；值单位：字节 | `65536` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回实际数据；接收失败返回 `false`，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`

> [!TIP]
> 与 `peek()` 不同，`recv()` 会从内核接收缓冲区中移除已读取的数据。

### send

向对端发送数据。

```php
public function send(string $data, float $timeout = 0): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 要发送的数据内容【可以为文本或二进制数据】 | 必填 |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：发送成功返回写入的字节数，**请注意实际写入的数据可能小于 `$data` 参数的长度**，应用层代码需要对比返回值与 `strlen($data)` 是否相等来判断是否发送完成；发送失败返回 `false`，并设置 `errCode` 属性。

**注意**

- `send` 方法会立即执行 `send` 系统调用发送数据，当 `send` 系统调用返回错误 `EAGAIN` 时，底层将自动监听可写事件，并挂起当前协程，等待可写事件触发时，重新执行 `send` 系统调用发送数据，并唤醒该协程。
- 如果 `send` 过快，`recv` 过慢最终会导致操作系统缓冲区写满，当前协程挂起在 send 方法，可以适当调大缓冲区，[/proc/sys/net/core/wmem_max和SO_SNDBUF](https://stackoverflow.com/questions/21856517/whats-the-practical-limit-on-the-size-of-single-packet-transmitted-over-domain)

### readVector

分段接收数据，它会一次性尝试读取数据来填充你指定的多个缓冲区，但读取的总字节数取决于内核缓冲区中当前立即可用的数据量。**尽力而为，读多少是多少**。

```php
public function readVector(array $io_vector, float $timeout = 0): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$io_vector` | 期望接收到的分段数据大小；值单位：字节 | 必填 |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回的分段数据；接收失败返回空数组，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`。

> [!TIP]
> `readVector` 方法会立即执行 `readv` 系统调用读取数据，当 `readv` 系统调用返回错误 `EAGAIN` 时，底层将自动监听可读事件，并挂起当前协程，等待可读事件触发时，重新执行 `readv` 系统调用读取数据，并唤醒该协程。

### readVectorAll

分段接收数据。它会持续读取，直到将所有请求的缓冲区都完全填满，或者发生连接关闭、超时等错误。**确保完整，不读够不罢休**。

```php
public function readVectorAll(array $io_vector, float $timeout = 0): false|array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$io_vector` | 期望接收到的分段数据大小；值单位：字节 | 必填 |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回的分段数据；接收失败返回空数组，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`。

> [!WARNING]
> `readVectorAll` 方法会立即执行多次 `readv` 系统调用读取数据，当 `readv` 系统调用返回错误 `EAGAIN` 时，底层将自动监听可读事件，并挂起当前协程，等待可读事件触发时，重新执行 `readv` 系统调用读取数据, 直到数据读取完成或遇到错误, 唤醒对应协程。

### writeVector

分段发送数据。它会一次性尝试将你提供的多个数据块写入 `Socket` 发送缓冲区，但实际写入的总字节数取决于内核发送缓冲区当前剩余的空间大小。**一次性写入，能写多少写多少**。

```php
public function writeVector(array $io_vector, float $timeout = 0): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$io_vector` | 期望发送的分段数据；值单位：字节 | 必填 |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：发送成功返回写入的字节数，**请注意实际写入的数据可能小于 `$io_vector` 参数的总长度**，应用层代码需要对比返回值与 `$io_vector` 参数的总长度是否相等来判断是否发送完成；发送失败返回 `false`，并设置 `errCode` 属性。

> [!TIP]
> `writeVector` 方法会立即执行 `writev` 系统调用发送数据，当 `writev` 系统调用返回错误 `EAGAIN` 时，底层将自动监听可写事件，并挂起当前协程，等待可写事件触发时，重新执行 `writev` 系统调用发送数据，并唤醒该协程。

### writeVectorAll

向对端发送数据。它会持续写入，直到将所有指定的数据块全部写入发送缓冲区，或者发生连接关闭、超时等错误。**持续写入，不写完不罢休**。

```php
public function writeVectorAll(array $io_vector, float $timeout = 0): false|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$io_vector` | 期望发送的分段数据；值单位：字节 | 必填 |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：`writeVectorAll` 会保证数据全部发送成功，但是 `writeVectorAll` 期间对端有可能将连接断开，此时可能发送成功了部分数据，返回值会返回这个成功数据的长度，应用层代码需要对比返回值与 `$io_vector` 参数的总长度是否相等来判断是否发送完成，根据业务需求是否需要续传；发送失败返回 `false`，并设置 `errCode` 属性。

### sendFile

发送文件给服务端。

```php
public function sendFile(string $file, int $offset = 0, int $length = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$file` | 文件路径 | 必填 |
| `$offset` | 文件偏移量 | `0`，从头开始发送 |
| `$length` | 发送的数据大小 | `0`，表示全部发送 |

**返回值**：发送成功返回 `true`，发送失败返回 `false`，并设置 `errCode` 属性。

### recvAll

接收数据。与 `recv` 不同的是, `recvAll` 会尽可能完整地接收响应长度的数据, 直到接收完成或遇到错误失败。

```php
public function recvAll(int $length = 65536, float $timeout = 0): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 期望接收到的数据大小 (注意：这里会分配内存, 过大的长度可能会导致内存耗尽)；值单位：字节 | `65536` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回实际数据, 并且返回的字符串长度和参数长度一致；接收失败返回 `false`，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`。

### sendAll

向对端发送数据。

```php
public function sendAll(string $data, float $timeout = 0): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 要发送的数据内容【可以为文本或二进制数据】 | 必填 |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：`sendAll` 会保证数据全部发送成功，但是 `sendAll` 期间对端有可能将连接断开，此时可能发送成功了部分数据，返回值会返回这个成功数据的长度，应用层代码需要对比返回值与 `strlen($data)` 是否相等来判断是否发送完成，根据业务需求是否需要续传；发送失败返回 `false`，并设置 `errCode` 属性。

### recvPacket

对于已通过 `setProtocol` 方法设置协议的 Socket 对象, 可调用此方法接收一个完整的协议数据包。

```php
public function recvPacket(float $timeout = 0): false|string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回一个完整协议数据包；接收失败返回 `false`，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`。

### recvLine

用于解决 [socket_read](https://www.php.net/manual/en/function.socket-read.php) 的兼容性问题。

```php
public function recvLine(int $length = 65536, float $timeout = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 指定用于接收数据的内存大小 (注意：这里会分配内存, 过大的长度可能会导致内存耗尽)；值单位：字节 | `65536` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回实际数据；接收失败返回 `false`，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`

### recvWithBuffer

用于解决使用 `recv(1)` 逐字节接收时产生大量系统调用问题。

```php
public function recvWithBuffer(int $length = 65536, float $timeout = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$length` | 指定用于接收数据的内存大小 (注意：这里会分配内存, 过大的长度可能会导致内存耗尽)；值单位：字节 | `65536` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：接收成功返回实际数据；接收失败返回 `false`，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`

### recvfrom

是专门为 `UDP` 协议设计的接收数据方法。

```php
public function recvfrom(mixed &$peername, float $timeout = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `&$peername` | 对端地址和端口，引用类型。【函数成功返回时会设置为数组，包括 `address` 和 `port` 两个元素】 | 必填 |
| `$timeout` | 设置超时时间【在规定的时间内未返回数据，`recvfrom` 方法会返回 `false`】；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | 参考客户端超时规则 |

**返回值**：成功接收数据，返回数据内容，并设置 `$peername` 为数组；失败返回 `false`，并设置 `errCode` 属性，不修改 `$peername` 的内容

### sendto

专为 `UDP` 协议设计的方法，用于向指定的目标地址和端口发送数据。

```php
public function sendto(string $address, int $port, string $data): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$address` | 目标主机的 `IP` 地址或 `unixSocket` 路径【`sendto` 不支持域名，使用 `AF_INET` 或 `AF_INET6` 时，必须传入合法的 `IP` 地址，否则发送会返回失败】 | 必填 |
| `$port` | 目标主机的端口【发送广播时可以为 `0`】 | 必填 |
| `$data` | 发送的数据【可以为文本或二进制内容，请注意 `SOCK_DGRAM` 发送包的最大长度为 `64K`】 | 必填 |

**返回值**：发送成功返回发送的字节数；发送失败返回 `false`，并设置 `errCode` 属性。

> [!TIP]
> 此方法没有协程调度，底层会立即调用 `sendto` 向目标主机发送数据。此方法不会监听可写，`sendto` 可能会因为缓存区已满而返会
> `false`，需要自行处理，或者使用 `send` 方法。

### setOption

直接对底层的 `socket` 句柄进行配置，本质上，是对操作系统底层的 `setsockopt` 函数的封装。

```php
public function setOption(int $level, int $opt_name, mixed $opt_value): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$level` | 指定选项所在的协议级别 | 必填 |
| `$opt_name` | 具体要修改哪个参数，比如 `SO_REUSEADDR` | 必填 |
| `$opt_value` | 选项的值 【可以是 `int`、`bool`、`string`、`array`。根据 `level` 和 `optname` 决定。】 | 必填 |

**返回值**：操作成功返回 `true`，发送失败返回 `false`，并设置 `errCode` 属性。

### getOption

读取底层 `socket` 句柄上各种配置参数的当前值。

```php
public function getOption(int $level, int $opt_name): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$level` | 指定选项所在的协议级别 | 必填 |
| `$opt_name` | 可用的套接字选项与 [socket_get_option()](https://www.php.net/manual/zh/function.socket-get-option.php) 函数的套接字选项相同 | 必填 |

**返回值**：返回对应属性的值。

### setProtocol

使 `socket` 获得协议处理能力。

```php
public function setProtocol(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 协议配置信息 | 必填 |

**返回值**：操作成功返回 `true`，发送失败返回 `false`，并设置 `errCode` 属性。

| 参数                                                                     | 说明                                                                                      |
|------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| open_ssl                                                               | 开启ssl连接                                                                                 |
| [ssl_cert_file](/zh/server/setting.html#ssl-cert-file-ssl-key-file)    | 设置SSL隧道加密                                                                               |
| [ssl_key_file](/zh/server/setting.html#ssl-cert-file-ssl-key-file)     | 设置SSL隧道加密                                                                               |
| [open_eof_check](/zh/server/setting.html#open-eof-check)               | 此选项用于检测客户端发来的数据：仅当数据包`结尾`匹配指定分隔符`（如 \r\n）`时，底层才会停止接收数据；否则，数据将被持续拼接，直到超出缓存区限制或接收超时才会中止。  |
| [open_eof_split](/zh/server/setting.html#open-eof-split)               | 底层逐字节扫描数据流，每次遇到指定分隔符`（如 \r\n）`就自动切分并交付一个完整数据包给[worker进程](/zh/server/process_thread.html#worker)。 |
| [open_http2_protocol](/zh/server/setting.html#open-http2-protocol)     | 启用`http2`协议报文解析。                                                                        |
| [open_mqtt_protocol](/zh/server/setting.html#open-mqtt-protocol)       | 启用`mqtt`协议报文解析。                                                                         |
| open_fastcgi_protocol                                                  | 是否开启 `fastcgi` 协议解析                                                                     |
| [open_length_check](/zh/server/setting.html#open-length-check)         | 启用数据包长度检测协议解析功能。                                                                        |
| [package_eof](/zh/server/setting.html#package-eof)                     | 设置数据包指定分隔符                                                                              |
| [package_length_type](/zh/server/setting.html#package-length-type)     | 指定长度字段的类型（如 'N' 表示 4 字节无符号长整型）。与 `PHP` 的 `pack` 函数一样。告诉服务器：长度字段占几个字节，以及这些字节的排列顺序（字节序）。  |
| [package_length_offset](/zh/server/setting.html#package-length-offset) | 定位长度字段位置的核心参数。它告诉服务器：“长度字段这个值，存放在整个数据包的第几个字节”                                           |
| [package_body_offset](/zh/server/setting.html#package-body-offset-package-body-start)     | 位包体数据起始位置的偏移量。告诉服务器：真正的业务数据（包体）从数据包的第几个字节开始。                                            |
| [package_length_func](/zh/server/setting.html#package-length-func)     | 自定义一个 `PHP` 函数来告诉 `Swoole`一个完整数据包究竟有多长。                                                 |
| [package_max_length](/zh/server/setting.html#package-max-length)       | 设置能接收的最大数据包尺寸，单位为字节。默认值：`2M` 即 `2 * 1024 * 1024`，最小值为`64K`。                             |

### sslHandshake

其核心作用是为一个已经建立好的普通 `TCP` 连接，在运行时动态地启用 `SSL/TLS` 加密。

```php
public function sslHandshake(): bool
```

**返回值**：操作成功返回 `true`，发送失败返回 `false`，并设置 `errCode` 属性。

### shutdown

优雅地关闭 `socket` 的读写能力。它允许你独立地关闭发送通道或接收通道，而不是像 `close()` 那样直接彻底销毁整个连接

```php
public function shutdown(int $how = SHUT_RDWR): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$how` | 如何关闭连接；其它值：`SHUT_WR` 只关闭写端，`SHUT_RD` 只关闭读端。 | `SHUT_RDWR` 同时关闭读写 |

**返回值**：操作成功返回 `true`，发送失败返回 `false`，并设置 `errCode` 属性。

### close

关闭 `Socket`。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，发送失败返回 `false`，并设置 `errCode` 属性。

### cancel

取消监听指定事件的协程。以读事件为例：若此 `Socket` 的读操作已导致协程 A 挂起，调用本方法将立即唤醒协程 A，并取消其未完成的读操作。

```php
public function cancel(int $event = SWOOLE_EVENT_READ): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event` | 读写事件；其它值：`SWOOLE_EVENT_WRITE` 写事件 | `SWOOLE_EVENT_READ` 读事件 |

**返回值**：操作成功返回 `true`，发送失败返回 `false`。

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

### isClosed

`Socket` 是否已关闭。

```php
public function isClosed(): bool
```

**返回值**：已经关闭返回 `true`，否则返回 `false`。

### import

将 `resource` 资源转化成 `Swoole\Coroutine\Socket` 对象。

```php
public static function import($stream): Swoole\Coroutine\Socket | false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$stream` | PHP 的 resource 资源 | 必填 |

**返回值**：操作成功返回 `Swoole\Coroutine\Socket` 对象，发送失败返回 `false`。
