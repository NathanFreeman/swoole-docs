# Functions

In addition to class methods, Swoole provides a set of global functions for retrieving system information, handling error codes, maintaining the MIME type table, zero-copy deserialization, and more. These functions are all prefixed with `swoole_` and can be called directly without creating any object.

## System Information

### swoole_version

Gets the version number of the Swoole extension, such as `6.0.0`.

```php
function swoole_version(): string
```

**Return value**: The version string, identical to the value of the `SWOOLE_VERSION` constant.

**Example**

```php
var_dump(SWOOLE_VERSION); // The SWOOLE_VERSION constant also represents the Swoole extension version
var_dump(swoole_version());
/**
Output:
string(6) "1.9.23"
string(6) "1.9.23"
**/
```

### swoole_cpu_num

Gets the number of CPU cores on the machine.

```php
function swoole_cpu_num(): int
```

**Return value**: The number of CPU cores. Commonly used to configure parameters such as `worker_num`.

**Example**

```shell
php -r "echo swoole_cpu_num();"
```

## Error Handling

### swoole_errno

Gets the error code of the most recent system call, equivalent to the `errno` variable in C/C++.

```php
function swoole_errno(): int
```

**Return value**: The error code as an integer. Error code values are operating-system dependent; use [`swoole_strerror`](#swoole-strerror) to convert an error code into an error message.

### swoole_last_error

Gets the error code of the most recent Swoole internal error.

```php
function swoole_last_error(): int
```

**Return value**: The Swoole internal error code as an integer. Use `swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE)` to convert the error code into an error message.

**Example**

```php
var_dump(swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE));
```

### swoole_strerror

Converts an error code into an error message.

```php
function swoole_strerror(int $errno, int $error_type = SWOOLE_STRERROR_SYSTEM): string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$errno` | The error code | Required |
| `$error_type` | The error code type, see the table below | `SWOOLE_STRERROR_SYSTEM` (`0`) |

Available constants for `$error_type`:

| Constant | Value | Description |
|:---|:---|:---|
| `SWOOLE_STRERROR_SYSTEM` | `0` | Standard Unix errno produced by system call errors, such as `EAGAIN`, `ETIMEDOUT`, etc. |
| `SWOOLE_STRERROR_GAI` | `1` | `getaddrinfo` error codes produced by DNS operations |
| `SWOOLE_STRERROR_DNS` | `2` | DNS resolution error codes (`hstrerror`) |
| `SWOOLE_STRERROR_SWOOLE` | `9` | Swoole internal error codes, obtained via [`swoole_last_error`](#swoole-last-error) |

> [!NOTE]
> When `$errno` falls within the Swoole internal error code range (starting at `500`), it is automatically treated as a Swoole error code even if `SWOOLE_STRERROR_SWOOLE` is not specified.

**Return value**: The error message string.

**Example**

```php
var_dump(swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE));
```

### swoole_clear_error

Clears the last Swoole internal error code (resets [`swoole_last_error`](#swoole-last-error) to `0`).

```php
function swoole_clear_error(): void
```

> [!NOTE]
> Available since Swoole `v4.6.0`.

### swoole_error_log

Writes a log message at the specified level to the Swoole log.

```php
function swoole_error_log(int $level, string $msg): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$level` | The log level, see [log_level](/en/server/setting.html#log-level) | Required |
| `$msg` | The log message | Required |

> [!NOTE]
> Available since Swoole `v4.5.8`.

### swoole_error_log_ex

Writes a log message with the specified level and error code.

```php
function swoole_error_log_ex(int $level, int $error, string $msg): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$level` | The log level, see [log_level](/en/server/setting.html#log-level) | Required |
| `$error` | The Swoole error code | Required |
| `$msg` | The log message | Required |

> [!NOTE]
> Available since Swoole `v4.8.1`.

### swoole_ignore_error

Ignores error logs for the specified error code; once set, logs for that error code are no longer emitted.

```php
function swoole_ignore_error(int $error): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$error` | The Swoole error code to ignore | Required |

> [!NOTE]
> Available since Swoole `v4.8.1`.

## Network Information

### swoole_get_local_ip

Gets the IP addresses of all network interfaces on the machine.

```php
function swoole_get_local_ip(int $family = AF_INET): array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$family` | The address family: `AF_INET` for IPv4, `AF_INET6` for IPv6 | `AF_INET` |

**Return value**: An associative array keyed by network interface name with IP addresses as values, such as `array("eth0" => "192.168.1.100")`; returns `false` on failure.

**Example**

```php
// Get the IP addresses of all network interfaces on the machine
$list = swoole_get_local_ip();
print_r($list);
/**
Output:
Array
(
      [eno1] => 10.10.28.228
      [br-1e72ecd47449] => 172.20.0.1
      [docker0] => 172.17.0.1
)
**/
```

> [!NOTE]
> - By default only IPv4 addresses are returned; pass `AF_INET6` to get IPv6 addresses. Local loopback addresses (such as `127.0.0.1`) are filtered out.
> - This function queries interface information in real time via system calls (`getifaddrs` on Linux); there is no internal cache.

### swoole_get_local_mac

Gets the MAC addresses of the network interfaces on the machine.

```php
function swoole_get_local_mac(): array
```

**Return value**: An associative array keyed by network interface name with MAC addresses as values; returns `false` on failure or on unsupported platforms.

**Example**

```php
var_dump(swoole_get_local_mac());
/**
Output:
array(3) {
  ["eno1"]=>
  string(17) "64:00:6A:65:51:32"
  ["docker0"]=>
  string(17) "02:42:21:9B:12:05"
  ["vboxnet0"]=>
  string(17) "0A:00:27:00:00:00"
}
**/
```

> [!NOTE]
> Loopback interfaces are filtered out of the result.

### swoole_clear_dns_cache

Clears Swoole's built-in DNS cache, effective for coroutine DNS lookups such as [`Co\System::gethostbyname`](/en/coroutine/system_api.html#gethostbyname).

```php
function swoole_clear_dns_cache(): void
```

## Process Management

### swoole_set_process_name

Sets the process name. After renaming, the `ps` command shows the specified string instead of `php your_file.php`.

```php
function swoole_set_process_name(string $process_name): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$process_name` | The new process name | Required |

**Return value**: Returns `true` on success; returns `false` with a warning when the `cli_set_process_title` function does not exist in the current environment (non-CLI mode).

This function is equivalent to `cli_set_process_title` introduced in PHP 5.5 — internally it simply delegates to `cli_set_process_title` — and works on any PHP version above 5.2.

**Example**

```php
swoole_set_process_name("swoole server");
```

Renaming the individual processes of a Swoole Server:

- Rename the master process in the [onStart](/en/server/events.html#start) callback
- Rename the manager process in the [onManagerStart](/en/server/events.html#managerstart) callback
- Rename the worker processes in the [onWorkerStart](/en/server/events.html#workerstart) callback

> [!WARNING]
> Older Linux kernels and Mac OSX do not support process renaming.

## MIME Types

The following functions add, remove, query, and modify Swoole's built-in MIME type table. When the HTTP server serves static files, it looks up the `Content-Type` in this table by file suffix.

### swoole_mime_type_add

Adds a new MIME type to the built-in MIME type table.

```php
function swoole_mime_type_add(string $suffix, string $mime_type): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$suffix` | The file suffix, such as `html` | Required |
| `$mime_type` | The MIME type, such as `text/html` | Required |

**Return value**: Returns `true` on success; returns `false` if the suffix already exists, without overwriting the existing type. Use [`swoole_mime_type_set`](#swoole-mime-type-set) to overwrite.

### swoole_mime_type_set

Sets the MIME type for a suffix; the suffix is added automatically if it does not exist, and overwritten if it does.

```php
function swoole_mime_type_set(string $suffix, string $mime_type): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$suffix` | The file suffix, such as `html` | Required |
| `$mime_type` | The MIME type, such as `text/html` | Required |

### swoole_mime_type_delete

Deletes the MIME type associated with a suffix.

```php
function swoole_mime_type_delete(string $suffix): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$suffix` | The file suffix | Required |

**Return value**: Returns `true` on success; returns `false` if the suffix does not exist.

### swoole_mime_type_get

Gets the MIME type corresponding to a filename.

```php
function swoole_mime_type_get(string $filename): string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | The filename; the function extracts its suffix for the lookup | Required |

**Return value**: The corresponding MIME type string; returns `application/octet-stream` if the suffix does not exist.

### swoole_mime_type_exists

Checks whether a MIME type exists for the given filename.

```php
function swoole_mime_type_exists(string $filename): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | The filename; the function extracts its suffix for the lookup | Required |

**Return value**: Returns `true` if it exists, `false` otherwise.

### swoole_mime_type_list

Lists all MIME types in the built-in MIME type table.

```php
function swoole_mime_type_list(): array
```

**Return value**: An indexed array whose elements are MIME type strings (suffix keys are not included).

## Zero-Copy Deserialization

### swoole_substr_unserialize

Zero-copy PHP unserialization: deserializes data directly from a substring region, avoiding the string copy incurred by `substr`. Apart from `$offset` and `$length`, the parameters are identical to `unserialize`.

```php
function swoole_substr_unserialize(string $str, int $offset, int $length = 0, array $options = []): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$str` | The string containing the serialized data | Required |
| `$offset` | The starting offset; negative values count backward from the end of the string | Required |
| `$length` | The length of data to unserialize; values less than or equal to `0`, or exceeding the remaining length, extend to the end of the string | `0` |
| `$options` | Options array, identical to the `options` parameter of `unserialize` | `[]` |

**Return value**: The unserialized value; returns `false` if the string is empty or the offset is invalid.

> [!NOTE]
> Available since Swoole `v4.5.6`.

**Example**

```php
$val = serialize('hello');
$str = pack('N', strlen($val)) . $val . "\r\n";
$l = strlen($str) - 6;
var_dump(unserialize(substr($str, 4, $l)));
var_dump(swoole_substr_unserialize($str, 4, $l));
```

### swoole_substr_json_decode

Zero-copy JSON decoding: decodes JSON data directly from a substring region, avoiding the string copy incurred by `substr`. Apart from `$offset` and `$length`, the parameters are identical to `json_decode`.

```php
function swoole_substr_json_decode(string $str, int $offset, int $length = 0, bool $associative = false, int $depth = 512, int $flags = 0): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$str` | The string containing the JSON data | Required |
| `$offset` | The starting offset; negative values count backward from the end of the string | Required |
| `$length` | The length of data to decode; values less than or equal to `0`, or exceeding the remaining length, extend to the end of the string | `0` |
| `$associative` | When `true`, JSON objects are decoded as associative arrays; when `null`, the `JSON_OBJECT_AS_ARRAY` bit in `$flags` decides | `false` |
| `$depth` | The maximum recursion depth | `512` |
| `$flags` | JSON decoding options, identical to the `flags` parameter of `json_decode` | `0` |

**Return value**: The decoded value; returns `null` with a warning if the string is empty or the offset is invalid.

> [!NOTE]
> Available since Swoole `v4.5.6`. Since `v4.5.7` it must be enabled at compile time with the [--enable-swoole-json](/en/start/install.html#build-options) option; enabled by default since Swoole 5.

**Example**

```php
$val = json_encode(['hello' => 'swoole']);
$str = pack('N', strlen($val)) . $val . "\r\n";
$l = strlen($str) - 6;
var_dump(json_decode(substr($str, 4, $l), true));
var_dump(swoole_substr_json_decode($str, 4, $l, true));
```

## Hash Calculation

### swoole_hashcode

Computes the hash of a string, useful for user-space load-balancing dispatch, consistent hashing, and similar scenarios.

```php
function swoole_hashcode(string $data, int $type = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The string to hash | Required |
| `$type` | Hash algorithm: `0` is the `PHP` kernel string hash (same as the array-key hash; the result may be negative on `64`-bit systems); `1` is the `Jenkins one-at-a-time` hash (in the `32`-bit unsigned range); other values return `false` | `0` |

**Return value**: Returns the hash as an integer; returns `false` when `$type` is invalid.

**Example**

```php
<?php
var_dump(swoole_hashcode('hello'));        // PHP kernel hash
var_dump(swoole_hashcode('hello', 1));     // Jenkins one-at-a-time
```

## Async and Coroutine

### swoole_async_set

Sets global options for async IO and coroutines. Must be called before the event loop is created (typically during script startup), and only from the main thread.

```php
function swoole_async_set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | The options array; available keys are listed below | Required |

Available options:

| Option | Description | Default |
|:---|:---|:---|
| `enable_coroutine` | Enables or disables built-in coroutines, see [enable_coroutine](/en/server/setting.html#enable-coroutine) | None |
| `enable_signalfd` | Enables or disables the `signalfd` feature | None |
| `aio_core_worker_num` | Sets the minimum number of AIO threads | None |
| `aio_worker_num` | Sets the maximum number of AIO threads | None |
| `thread_num` / `min_thread_num` | Sets the minimum number of AIO threads, equivalent to `aio_core_worker_num` | None |
| `max_thread_num` | Sets the maximum number of AIO threads, equivalent to `aio_worker_num` | None |
| `aio_max_wait_time` | The maximum wait time for AIO tasks | None |
| `aio_max_idle_time` | The maximum idle time for AIO threads | None |
| `wait_signal` | The reactor will not exit while signal listeners exist | None |
| `dns_cache_refresh_time` | The DNS cache refresh time | None |
| `dns_lookup_random` | Returns a random result when DNS resolution yields multiple results | None |
| `use_async_resolver` | Uses the async DNS resolver | None |
| `iouring_entries` | The io_uring submission queue entry count; requires [--enable-iouring](/en/start/install.html#build-options) at compile time | None |
| `iouring_workers` | The number of io_uring workers; requires `--enable-iouring` at compile time | None |
| `iouring_flag` | io_uring creation flags; requires `--enable-iouring` at compile time | None |

**Return value**: Returns `true` on success; throws a `Swoole\Exception` if the event loop has already been created, indicating that settings can no longer be changed.

**Example**

```php
swoole_async_set([
    'thread_num' => 4,
    'max_thread_num' => 16,
]);
```

> [!NOTE]
> See [Async File Operations](/en/file_async.html) for more details on the AIO options.

### swoole_coroutine_socketpair

The coroutine version of `socket_create_pair`: creates a pair of connected coroutine sockets.

```php
function swoole_coroutine_socketpair(int $domain, int $type, int $protocol): array|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$domain` | The protocol family, such as `AF_UNIX`, `AF_INET` | Required |
| `$type` | The socket type, such as `SOCK_STREAM`, `SOCK_DGRAM` | Required |
| `$protocol` | The protocol, such as `IPPROTO_IP` | Required |

**Return value**: On success, an array containing two [`Swoole\Coroutine\Socket`](/en/client/socket.html) objects; returns `false` on failure.

> [!NOTE]
> Available since Swoole `v4.6.0`.

**Example**

```php
Co\run(function () {
    $pair = swoole_coroutine_socketpair(AF_UNIX, SOCK_STREAM, 0);
    [$a, $b] = $pair;
    $a->send('hello');
    var_dump($b->recv());
});
```