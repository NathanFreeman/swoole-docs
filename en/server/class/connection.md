# Swoole\Coroutine\Server\Connection

When a [TCP/UDP coroutine server](/en/server/coroutine/tcp_udp.html) receives a request and triggers the callback, a `Swoole\Coroutine\Server\Connection` object is passed in. You can use this object to handle the current request and obtain its related information.

## Methods

### recv

Receives data. If protocol handling is configured, a complete packet is returned each time.

```php
public function recv(float $timeout = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout in seconds; supports floats, e.g. `1.5` means `1s`+`500ms` | `0` |

**Return value**: On success, returns a complete protocol packet; on failure, returns `false` and sets the `errCode` property; on timeout, the error code is `ETIMEDOUT`.

### send

Sends data.

```php
public function send(string $data): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data content to send; can be text or binary data | Required |

**Return value**: `send` guarantees that all data is sent successfully, but the peer may disconnect during `send`, in which case only part of the data may have been sent; the return value is the length of the successfully sent data. Application code should compare the return value with `strlen($data)` to determine whether sending completed, and decide whether to resume sending based on business needs. Returns `false` on failure.

### close

Closes the connection.

```php
public function close(): bool
```

### exportSocket

Gets the [`Socket`](/en/client/socket.html) object of the current connection, allowing you to call more low-level methods.

```php
public function exportSocket(): Swoole\Coroutine\Socket
```