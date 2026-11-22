# Socket Coroutine Client

- `Swoole\Coroutine\Socket` is the coroutine version of the low-level `Socket` client/server class provided by `Swoole`, used to operate transport-layer protocols such as `TCP`, `UDP`, and
  `Unix Socket` directly in a coroutine environment.

## Methods

### __construct

Constructor. Constructs a `Swoole\Coroutine\Socket` object.

```php
public function __construct(int $domain, int $type, int $protocol = IPPROTO_IP)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$domain` | Protocol domain [can use `AF_INET`, `AF_INET6`, `AF_UNIX`] | Required |
| `$type` | Type [can use `SOCK_STREAM`, `SOCK_DGRAM`, `SOCK_RAW`] | Required |
| `$protocol` | Protocol [can use `IPPROTO_TCP`, `IPPROTO_UDP`, `IPPROTO_STCP`, `IPPROTO_TIPC`, `0`] | `IPPROTO_IP` |

### bind

Binds an address and port.

```php
public function bind(string $address, int $port = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$address` | Address to bind [e.g. `0.0.0.0`, `127.0.0.1`] | Required |
| `$port` | Port to bind [defaults to `0`, in which case the system randomly binds an available port; use the [getsockname](/en/client/socket.html#getsockname) method to obtain the `port` assigned by the system] | `0` |

**Return value**: Returns `true` on successful binding; returns `false` on failure — check the `errCode` property for the failure reason.

### listen

Starts listening.

```php
public function listen(int $backlog = 512): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$backlog` | Length of the listen queue [the underlying layer implements async `IO` with `epoll` and never blocks, so `backlog` is not particularly important] | `512` |

**Return value**: Returns `true` on successful listening; returns `false` on failure — check the `errCode` property for the failure reason.

> [!WARNING]
> If the application contains blocking or time-consuming logic and `accept` does not accept connections in time, newly created connections pile up in the `backlog` listen queue. Once the `backlog` length is exceeded, the service rejects new incoming connections.

### accept

Accepts a connection initiated by a client.

```php
public function accept(float $timeout = 0): Socket|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout [when a timeout is set, the underlying layer sets a timer; if no client connection arrives within the specified time, the `accept` method returns `false`]; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns `false` on timeout or when the `accept` system call reports an error; use the `errCode` property to get the error code, where the timeout error code is `ETIMEDOUT`. On success, returns the client connection's `socket`, which is also a `Swoole\Coroutine\Socket` object. You can perform operations such as `send`, `recv`, and `close` on it.

### connect

Connects to the target server.

```php
public function connect(string $host, int $port = 0, float $timeout = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Address of the target server [e.g. `127.0.0.1`, `192.168.1.100`, `/tmp/php-fpm.sock`, `www.baidu.com`, etc.; you can pass an `IP` address, a `Unix Socket` path, or a domain name. For a domain name, the underlying layer automatically performs async `DNS` resolution without blocking] | Required |
| `$port` | Port of the target server [the port must be set when the `Socket`'s `domain` is `AF_INET` or `AF_INET6`] | `0` |
| `$timeout` | Sets the timeout [the underlying layer sets a timer; if the connection cannot be established within the specified time, `connect` returns `false`]; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns `false` on timeout or when the `connect` system call reports an error; use the `errCode` property to get the error code, where the timeout error code is `ETIMEDOUT`. Returns `true` on success.

### checkLiveness

Checks whether the connection is alive via a system call (ineffective on abnormal disconnects; it can only detect a connection closed by a normal close from the peer).

```php
public function checkLiveness(): bool
```

**Return value**: Returns `true` if the connection is alive, otherwise `false`.

### getBoundCid

If this `Socket` has been bound by a coroutine, returns the ID of the coroutine that bound it.

```php
public function getBoundCid(int $event): int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event` | Read/write event; other values: [`SWOOLE_EVENT_READ`](/en/event.html#constants) for the read event, `SWOOLE_EVENT_WRITE` for the write event | Required |

**Return value**: On success, returns the ID of the currently bound coroutine; returns `0` if no coroutine is bound.

### peek

Previews the data in the kernel receive buffer without removing it from the buffer.

```php
public function peek(int $length = 65536): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Size of the memory used to copy the previewed data (note: memory is allocated here; an excessively large length may exhaust memory); unit: bytes | `65536` |

**Return value**: Returns the data on a successful preview; returns `false` on failure and sets the `errCode` property.

> [!TIP]
> This means a subsequent call to `recv()` can still read the content that was `peek`ed.

### recv

The core method for reading data from the peer.

```php
public function recv(int $length = 65536, float $timeout = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Size of the memory used to receive data (note: memory is allocated here; an excessively large length may exhaust memory); unit: bytes | `65536` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns the actual data on success; returns `false` on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

> [!TIP]
> Unlike `peek()`, `recv()` removes the read data from the kernel receive buffer.

### send

Sends data to the peer.

```php
public function send(string $data, float $timeout = 0): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data content to send [can be text or binary data] | Required |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: On success, returns the number of bytes written. **Note that the data actually written may be less than the length of the `$data` parameter**; application code must compare the return value with `strlen($data)` to determine whether sending is complete. Returns `false` on failure and sets the `errCode` property.

**Notes**

- The `send` method immediately executes the `send` system call to send data. When the `send` system call returns the error `EAGAIN`, the underlying layer automatically listens for the writable event and suspends the current coroutine. When the writable event fires, it re-executes the `send` system call to send data and resumes the coroutine.
- If `send` is too fast and `recv` too slow, the operating system buffer eventually fills up and the current coroutine is suspended in the send method. You can enlarge the buffer as appropriate, [/proc/sys/net/core/wmem_max and SO_SNDBUF](https://stackoverflow.com/questions/21856517/whats-the-practical-limit-on-the-size-of-single-packet-transmitted-over-domain)

### readVector

Receives data in segments. It attempts a single read to fill the multiple buffers you specify, but the total number of bytes read depends on how much data is immediately available in the kernel buffer at that moment. **Best effort — read as much as is available**.

```php
public function readVector(array $io_vector, float $timeout = 0): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$io_vector` | Sizes of the segmented data expected to be received; unit: bytes | Required |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns the segmented data on success; returns an empty array on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

> [!TIP]
> The `readVector` method immediately executes the `readv` system call to read data. When the `readv` system call returns the error `EAGAIN`, the underlying layer automatically listens for the readable event and suspends the current coroutine. When the readable event fires, it re-executes the `readv` system call to read data and resumes the coroutine.

### readVectorAll

Receives data in segments. It keeps reading until all requested buffers are completely filled, or an error such as connection close or timeout occurs. **Guarantees completeness — never stops until enough is read**.

```php
public function readVectorAll(array $io_vector, float $timeout = 0): false|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$io_vector` | Sizes of the segmented data expected to be received; unit: bytes | Required |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns the segmented data on success; returns an empty array on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

> [!WARNING]
> The `readVectorAll` method immediately executes the `readv` system call multiple times to read data. When the `readv` system call returns the error `EAGAIN`, the underlying layer automatically listens for the readable event and suspends the current coroutine. When the readable event fires, it re-executes the `readv` system call to read data, until reading is complete or an error occurs, then resumes the corresponding coroutine.

### writeVector

Sends data in segments. It attempts a single write of the multiple data blocks you provide into the `Socket` send buffer, but the total number of bytes actually written depends on the space currently remaining in the kernel send buffer. **One-shot write — write as much as fits**.

```php
public function writeVector(array $io_vector, float $timeout = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$io_vector` | The segmented data to send; unit: bytes | Required |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: On success, returns the number of bytes written. **Note that the data actually written may be less than the total length of the `$io_vector` parameter**; application code must compare the return value with the total length of the `$io_vector` parameter to determine whether sending is complete. Returns `false` on failure and sets the `errCode` property.

> [!TIP]
> The `writeVector` method immediately executes the `writev` system call to send data. When the `writev` system call returns the error `EAGAIN`, the underlying layer automatically listens for the writable event and suspends the current coroutine. When the writable event fires, it re-executes the `writev` system call to send data and resumes the coroutine.

### writeVectorAll

Sends data to the peer. It keeps writing until all specified data blocks have been written into the send buffer, or an error such as connection close or timeout occurs. **Keeps writing — never stops until everything is written**.

```php
public function writeVectorAll(array $io_vector, float $timeout = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$io_vector` | The segmented data to send; unit: bytes | Required |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: `writeVectorAll` guarantees that all data is sent successfully, but the peer may disconnect during `writeVectorAll`, in which case only part of the data may have been sent successfully. The return value is the length of the successfully sent data; application code must compare the return value with the total length of the `$io_vector` parameter to determine whether sending is complete and decide, based on business needs, whether to resume the transfer. Returns `false` on failure and sets the `errCode` property.

### sendFile

Sends a file to the server.

```php
public function sendFile(string $file, int $offset = 0, int $length = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$file` | File path | Required |
| `$offset` | File offset | `0`, send from the beginning |
| `$length` | Size of the data to send | `0`, meaning send everything |

**Return value**: Returns `true` on success; returns `false` on failure and sets the `errCode` property.

### recvAll

Receives data. Unlike `recv`, `recvAll` receives the full requested length of data as completely as possible, until reception is complete or an error occurs.

```php
public function recvAll(int $length = 65536, float $timeout = 0): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Size of the data expected to be received (note: memory is allocated here; an excessively large length may exhaust memory); unit: bytes | `65536` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns the actual data on success, and the length of the returned string matches the length parameter; returns `false` on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

### sendAll

Sends data to the peer.

```php
public function sendAll(string $data, float $timeout = 0): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data content to send [can be text or binary data] | Required |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: `sendAll` guarantees that all data is sent successfully, but the peer may disconnect during `sendAll`, in which case only part of the data may have been sent successfully. The return value is the length of the successfully sent data; application code must compare the return value with `strlen($data)` to determine whether sending is complete and decide, based on business needs, whether to resume the transfer. Returns `false` on failure and sets the `errCode` property.

### recvPacket

For a Socket object whose protocol has been configured via the `setProtocol` method, this method can be called to receive one complete protocol packet.

```php
public function recvPacket(float $timeout = 0): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns one complete protocol packet on success; returns `false` on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

### recvLine

Used to solve the compatibility problem of [socket_read](https://www.php.net/manual/en/function.socket-read.php).

```php
public function recvLine(int $length = 65536, float $timeout = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Size of the memory used to receive data (note: memory is allocated here; an excessively large length may exhaust memory); unit: bytes | `65536` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns the actual data on success; returns `false` on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

### recvWithBuffer

Used to solve the problem of excessive system calls when receiving byte by byte with `recv(1)`.

```php
public function recvWithBuffer(int $length = 65536, float $timeout = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Size of the memory used to receive data (note: memory is allocated here; an excessively large length may exhaust memory); unit: bytes | `65536` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: Returns the actual data on success; returns `false` on failure and sets the `errCode` property; on receive timeout, the error code is `ETIMEDOUT`.

### recvfrom

A data-receiving method designed specifically for the `UDP` protocol.

```php
public function recvfrom(mixed &$peername, float $timeout = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `&$peername` | The peer's address and port, passed by reference. [On successful return, it is set to an array containing the two elements `address` and `port`] | Required |
| `$timeout` | Sets the timeout [if no data arrives within the specified time, the `recvfrom` method returns `false`]; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | See client timeout rules |

**Return value**: On successfully receiving data, returns the data content and sets `$peername` to an array; on failure, returns `false` and sets the `errCode` property without modifying the contents of `$peername`.

### sendto

A method designed specifically for the `UDP` protocol, used to send data to a specified target address and port.

```php
public function sendto(string $address, int $port, string $data): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$address` | The target host's `IP` address or `unixSocket` path [`sendto` does not support domain names; when using `AF_INET` or `AF_INET6`, a valid `IP` address must be passed, otherwise sending fails] | Required |
| `$port` | The target host's port [can be `0` when sending a broadcast] | Required |
| `$data` | The data to send [can be text or binary content; note that the maximum packet length for `SOCK_DGRAM` is `64K`] | Required |

**Return value**: Returns the number of bytes sent on success; returns `false` on failure and sets the `errCode` property.

> [!TIP]
> This method involves no coroutine scheduling; the underlying layer immediately calls `sendto` to send data to the target host. This method does not listen for writability, and `sendto` may return
> `false` because the buffer is full — handle this yourself, or use the `send` method instead.

### setOption

Configures the underlying `socket` handle directly; essentially a wrapper around the operating system's `setsockopt` function.

```php
public function setOption(int $level, int $opt_name, mixed $opt_value): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$level` | Specifies the protocol level of the option | Required |
| `$opt_name` | Which parameter to modify, e.g. `SO_REUSEADDR` | Required |
| `$opt_value` | The option's value [can be `int`, `bool`, `string`, or `array`, depending on `level` and `optname`.] | Required |

**Return value**: Returns `true` on success; returns `false` on failure and sets the `errCode` property.

### getOption

Reads the current values of various configuration parameters on the underlying `socket` handle.

```php
public function getOption(int $level, int $opt_name): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$level` | Specifies the protocol level of the option | Required |
| `$opt_name` | The available socket options are the same as those of the [socket_get_option()](https://www.php.net/manual/zh/function.socket-get-option.php) function | Required |

**Return value**: Returns the value of the corresponding property.

### setProtocol

Gives the `socket` protocol processing capabilities.

```php
public function setProtocol(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Protocol configuration | Required |

**Return value**: Returns `true` on success; returns `false` on failure and sets the `errCode` property.

| Parameter                                                                     | Description                                                                                      |
|------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| open_ssl                                                               | Enable SSL connections                                                                                 |
| [ssl_cert_file](/en/server/setting.html#ssl-cert-file-ssl-key-file)    | Configure SSL tunnel encryption                                                                               |
| [ssl_key_file](/en/server/setting.html#ssl-cert-file-ssl-key-file)     | Configure SSL tunnel encryption                                                                               |
| [open_eof_check](/en/server/setting.html#open-eof-check)               | This option inspects data sent by the client: the underlying layer stops receiving only when the packet's `end` matches the specified delimiter `(such as \r\n)`; otherwise data keeps being appended until the buffer limit is exceeded or the receive times out.  |
| [open_eof_split](/en/server/setting.html#open-eof-split)               | The underlying layer scans the data stream byte by byte, and each time it encounters the specified delimiter `(such as \r\n)` it automatically splits and delivers a complete packet to the [worker process](/en/server/process_thread.html#worker). |
| [open_http2_protocol](/en/server/setting.html#open-http2-protocol)     | Enable `http2` protocol packet parsing.                                                                        |
| [open_mqtt_protocol](/en/server/setting.html#open-mqtt-protocol)       | Enable `mqtt` protocol packet parsing.                                                                         |
| open_fastcgi_protocol                                                  | Whether to enable `fastcgi` protocol parsing                                                                     |
| [open_length_check](/en/server/setting.html#open-length-check)         | Enable packet length checking protocol parsing.                                                                        |
| [package_eof](/en/server/setting.html#package-eof)                     | Set the packet delimiter                                                                              |
| [package_length_type](/en/server/setting.html#package-length-type)     | Specifies the type of the length field (e.g. 'N' for a 4-byte unsigned long integer). Same as `PHP`'s `pack` function. Tells the server how many bytes the length field occupies and the byte order of those bytes.  |
| [package_length_offset](/en/server/setting.html#package-length-offset) | The core parameter for locating the length field. It tells the server: "the length field value is stored at this byte offset in the whole packet."                                           |
| [package_body_offset](/en/server/setting.html#package-body-offset-package-body-start)     | The offset of the packet body's starting position. Tells the server at which byte of the packet the actual business data (the body) begins.                                            |
| [package_length_func](/en/server/setting.html#package-length-func)     | Define a custom `PHP` function to tell `Swoole` exactly how long a complete packet is.                                                 |
| [package_max_length](/en/server/setting.html#package-max-length)       | Sets the maximum receivable packet size, in bytes. Default: `2M`, i.e. `2 * 1024 * 1024`; minimum `64K`.                             |

### sslHandshake

Its core purpose is to dynamically enable `SSL/TLS` encryption at runtime on an already established plain `TCP` connection.

```php
public function sslHandshake(): bool
```

**Return value**: Returns `true` on success; returns `false` on failure and sets the `errCode` property.

### shutdown

Gracefully shuts down the `socket`'s read/write capabilities. It lets you close the send channel or the receive channel independently, instead of destroying the entire connection outright like `close()`.

```php
public function shutdown(int $how = SHUT_RDWR): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$how` | How to close the connection; other values: `SHUT_WR` closes only the write end, `SHUT_RD` closes only the read end. | `SHUT_RDWR` closes both read and write |

**Return value**: Returns `true` on success; returns `false` on failure and sets the `errCode` property.

### close

Closes the `Socket`.

```php
public function close(): bool
```

**Return value**: Returns `true` on success; returns `false` on failure and sets the `errCode` property.

### cancel

Cancels the coroutine listening for the specified event. Taking the read event as an example: if a read operation on this `Socket` has suspended coroutine A, calling this method immediately resumes coroutine A and cancels its pending read operation.

```php
public function cancel(int $event = SWOOLE_EVENT_READ): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event` | Read/write event; other values: `SWOOLE_EVENT_WRITE` write event | `SWOOLE_EVENT_READ` read event |

**Return value**: Returns `true` on success; returns `false` on failure.

### getsockname

Used to get the local IP address and port.

```php
public function getsockname(): false|array
```

**Return value**: On success, returns an array containing `address` and `port`; on failure, returns `false` and sets the `errCode` property.

### getpeername

Used to get the IP address and port of the connection's peer (i.e. the remote end).

```php
public function getpeername(): false|array
```

**Return value**: On success, returns an array containing `address` and `port`; on failure, returns `false` and sets the `errCode` property.

### isClosed

Whether the `Socket` has been closed.

```php
public function isClosed(): bool
```

**Return value**: Returns `true` if already closed, otherwise `false`.

### import

Converts a `resource` into a `Swoole\Coroutine\Socket` object.

```php
public static function import($stream): Swoole\Coroutine\Socket | false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$stream` | A PHP resource | Required |

**Return value**: Returns a `Swoole\Coroutine\Socket` object on success; returns `false` on failure.