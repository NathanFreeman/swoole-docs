# 函数

Swoole 除了类方法之外，还提供了一些全局函数，用于获取系统信息、处理错误码、维护 MIME 类型表、零拷贝反序列化等。这些函数均以 `swoole_` 为前缀，无需创建对象即可直接调用。

## 系统信息

### swoole_version

获取 Swoole 扩展的版本号，如 `6.0.0`。

```php
function swoole_version(): string
```

**返回值**：版本号字符串，与常量 `SWOOLE_VERSION` 的值相同。

**示例**

```php
var_dump(SWOOLE_VERSION); // 常量 SWOOLE_VERSION 同样表示 Swoole 扩展版本
var_dump(swoole_version());
/**
返回值：
string(6) "1.9.23"
string(6) "1.9.23"
**/
```

### swoole_cpu_num

获取本机 CPU 核数。

```php
function swoole_cpu_num(): int
```

**返回值**：CPU 核数。常用于设置 `worker_num` 等参数。

**示例**

```shell
php -r "echo swoole_cpu_num();"
```

## 错误处理

### swoole_errno

获取最近一次系统调用的错误码，等同于 C/C++ 的 `errno` 变量。

```php
function swoole_errno(): int
```

**返回值**：错误码整数。错误码的值与操作系统有关，可使用 [`swoole_strerror`](#swoole-strerror) 将错误码转换为错误信息。

### swoole_last_error

获取最近一次 Swoole 底层的错误码。

```php
function swoole_last_error(): int
```

**返回值**：Swoole 底层错误码整数。可使用 `swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE)` 将错误码转换为错误信息。

**示例**

```php
var_dump(swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE));
```

### swoole_strerror

将错误码转换成错误信息。

```php
function swoole_strerror(int $errno, int $error_type = SWOOLE_STRERROR_SYSTEM): string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$errno` | 错误码 | 必填 |
| `$error_type` | 错误码类型，见下表 | `SWOOLE_STRERROR_SYSTEM`（`0`） |

`$error_type` 可用的常量：

| 常量 | 值 | 说明 |
|:---|:---|:---|
| `SWOOLE_STRERROR_SYSTEM` | `0` | 标准的 Unix Errno，由系统调用错误产生，如 `EAGAIN`、`ETIMEDOUT` 等 |
| `SWOOLE_STRERROR_GAI` | `1` | `getaddrinfo` 错误码，由 DNS 操作产生 |
| `SWOOLE_STRERROR_DNS` | `2` | DNS 解析错误码（`hstrerror`） |
| `SWOOLE_STRERROR_SWOOLE` | `9` | Swoole 底层错误码，使用 [`swoole_last_error`](#swoole-last-error) 得到 |

> [!NOTE]
> 当 `$errno` 落在 Swoole 底层错误码区间（`500` 起）时，即使未指定 `SWOOLE_STRERROR_SWOOLE`，也会自动按 Swoole 错误码处理。

**返回值**：错误信息字符串。

**示例**

```php
var_dump(swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE));
```

### swoole_clear_error

清除 Swoole 底层的最后一次错误码（将 [`swoole_last_error`](#swoole-last-error) 重置为 `0`）。

```php
function swoole_clear_error(): void
```

> [!NOTE]
> Swoole 版本 >= `v4.6.0` 可用。

### swoole_error_log

输出一条指定等级的日志到 Swoole 日志中。

```php
function swoole_error_log(int $level, string $msg): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$level` | 日志等级，见 [log_level](/zh/server/setting.html#log-level) | 必填 |
| `$msg` | 日志内容 | 必填 |

> [!NOTE]
> Swoole 版本 >= `v4.5.8` 可用。

### swoole_error_log_ex

写入指定等级和错误码的日志。

```php
function swoole_error_log_ex(int $level, int $error, string $msg): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$level` | 日志等级，见 [log_level](/zh/server/setting.html#log-level) | 必填 |
| `$error` | Swoole 错误码 | 必填 |
| `$msg` | 日志内容 | 必填 |

> [!NOTE]
> Swoole 版本 >= `v4.8.1` 可用。

### swoole_ignore_error

忽略指定错误码的错误日志，设置后该错误码对应的日志将不再输出。

```php
function swoole_ignore_error(int $error): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$error` | 要忽略的 Swoole 错误码 | 必填 |

> [!NOTE]
> Swoole 版本 >= `v4.8.1` 可用。

## 网络信息

### swoole_get_local_ip

获取本机所有网络接口的 IP 地址。

```php
function swoole_get_local_ip(int $family = AF_INET): array
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$family` | 地址族，`AF_INET` 表示 IPv4，`AF_INET6` 表示 IPv6 | `AF_INET` |

**返回值**：以网络接口名称为键、IP 地址为值的关联数组，如 `array("eth0" => "192.168.1.100")`；获取失败返回 `false`。

**示例**

```php
// 获取本机所有网络接口的 IP 地址
$list = swoole_get_local_ip();
print_r($list);
/**
返回值
Array
(
      [eno1] => 10.10.28.228
      [br-1e72ecd47449] => 172.20.0.1
      [docker0] => 172.17.0.1
)
**/
```

> [!NOTE]
> - 默认只返回 IPv4 地址，传入 `AF_INET6` 可获取 IPv6 地址；返回结果会过滤掉本地 loopback 地址（如 `127.0.0.1`）。
> - 此函数会实时调用系统接口（Linux 下为 `getifaddrs`）获取接口信息，底层无缓存。

### swoole_get_local_mac

获取本机网卡的 MAC 地址。

```php
function swoole_get_local_mac(): array
```

**返回值**：以网络接口名称为键、MAC 地址为值的关联数组；获取失败或平台不支持时返回 `false`。

**示例**

```php
var_dump(swoole_get_local_mac());
/**
返回值：
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
> 返回结果会过滤掉 loopback 接口。

### swoole_clear_dns_cache

清除 Swoole 内置的 DNS 缓存，对协程 DNS 查询（如 [`Co\System::gethostbyname`](/zh/coroutine/system_api.html#gethostbyname)）有效。

```php
function swoole_clear_dns_cache(): void
```

## 进程管理

### swoole_set_process_name

设置进程的名称。修改进程名称后，通过 `ps` 命令看到的将不再是 `php your_file.php`，而是设定的字符串。

```php
function swoole_set_process_name(string $process_name): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$process_name` | 新的进程名称 | 必填 |

**返回值**：设置成功返回 `true`；当前环境不存在 `cli_set_process_title` 函数时（非 CLI 模式）返回 `false` 并抛出警告。

此函数与 PHP 5.5 提供的 `cli_set_process_title` 功能相同，内部实现即委托给 `cli_set_process_title`，可用于 PHP 5.2 之上的任意版本。

**示例**

```php
swoole_set_process_name("swoole server");
```

为 Swoole Server 重命名各个进程名称：

- 在 [onStart](/zh/server/events.html#start) 回调中修改主进程名称
- 在 [onManagerStart](/zh/server/events.html#managerstart) 回调中修改管理进程（`manager`）的名称
- 在 [onWorkerStart](/zh/server/events.html#workerstart) 回调中修改 Worker 进程名称

> [!WARNING]
> 低版本 Linux 内核和 Mac OSX 不支持进程重命名。

## MIME 类型

以下函数用于增删查改 Swoole 内置的 MIME 类型表，HTTP 服务器发送静态文件时会根据文件后缀从该表中获取 `Content-Type`。

### swoole_mime_type_add

添加新的 MIME 类型到内置的 MIME 类型表上。

```php
function swoole_mime_type_add(string $suffix, string $mime_type): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$suffix` | 文件后缀名，如 `html` | 必填 |
| `$mime_type` | MIME 类型，如 `text/html` | 必填 |

**返回值**：添加成功返回 `true`；后缀已存在时返回 `false`，不会覆盖原有类型。需要覆盖时请使用 [`swoole_mime_type_set`](#swoole-mime-type-set)。

### swoole_mime_type_set

设置某个后缀对应的 MIME 类型，后缀不存在时会自动添加，已存在时直接覆盖。

```php
function swoole_mime_type_set(string $suffix, string $mime_type): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$suffix` | 文件后缀名，如 `html` | 必填 |
| `$mime_type` | MIME 类型，如 `text/html` | 必填 |

### swoole_mime_type_delete

删除某个后缀对应的 MIME 类型。

```php
function swoole_mime_type_delete(string $suffix): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$suffix` | 文件后缀名 | 必填 |

**返回值**：删除成功返回 `true`；后缀不存在时返回 `false`。

### swoole_mime_type_get

获取文件名对应的 MIME 类型。

```php
function swoole_mime_type_get(string $filename): string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 文件名，函数内部会提取其后缀进行查找 | 必填 |

**返回值**：对应的 MIME 类型字符串；后缀不存在时返回 `application/octet-stream`。

### swoole_mime_type_exists

判断文件名对应的 MIME 类型是否存在。

```php
function swoole_mime_type_exists(string $filename): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 文件名，函数内部会提取其后缀进行查找 | 必填 |

**返回值**：存在返回 `true`，不存在返回 `false`。

### swoole_mime_type_list

列出内置 MIME 类型表中的所有 MIME 类型。

```php
function swoole_mime_type_list(): array
```

**返回值**：索引数组，元素为 MIME 类型字符串（不包含后缀键名）。

## 零拷贝反序列化

### swoole_substr_unserialize

零拷贝 PHP 反序列化，直接从字符串的指定区间反序列化数据，避免 `substr` 产生的字符串拷贝。除 `$offset` 和 `$length` 以外，其他参数和 `unserialize` 一致。

```php
function swoole_substr_unserialize(string $str, int $offset, int $length = 0, array $options = []): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$str` | 包含序列化数据的字符串 | 必填 |
| `$offset` | 起始偏移量，支持负数（表示从字符串末尾向前计算） | 必填 |
| `$length` | 反序列化的数据长度，小于等于 `0` 或超出剩余长度时取到字符串末尾 | `0` |
| `$options` | 选项数组，与 `unserialize` 的 `options` 参数一致 | `[]` |

**返回值**：反序列化后的值；字符串为空或偏移量非法时返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v4.5.6` 可用。

**示例**

```php
$val = serialize('hello');
$str = pack('N', strlen($val)) . $val . "\r\n";
$l = strlen($str) - 6;
var_dump(unserialize(substr($str, 4, $l)));
var_dump(swoole_substr_unserialize($str, 4, $l));
```

### swoole_substr_json_decode

零拷贝 JSON 解码，直接从字符串的指定区间解码 JSON 数据，避免 `substr` 产生的字符串拷贝。除 `$offset` 和 `$length` 以外，其他参数和 `json_decode` 一致。

```php
function swoole_substr_json_decode(string $str, int $offset, int $length = 0, bool $associative = false, int $depth = 512, int $flags = 0): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$str` | 包含 JSON 数据的字符串 | 必填 |
| `$offset` | 起始偏移量，支持负数（表示从字符串末尾向前计算） | 必填 |
| `$length` | 解码的数据长度，小于等于 `0` 或超出剩余长度时取到字符串末尾 | `0` |
| `$associative` | 为 `true` 时将 JSON 对象解码为关联数组；传 `null` 时由 `$flags` 中的 `JSON_OBJECT_AS_ARRAY` 决定 | `false` |
| `$depth` | 最大递归深度 | `512` |
| `$flags` | JSON 解码选项，与 `json_decode` 的 `flags` 参数一致 | `0` |

**返回值**：解码后的值；字符串为空或偏移量非法时返回 `null` 并抛出警告。

> [!NOTE]
> Swoole 版本 >= `v4.5.6` 可用，从 `v4.5.7` 版本开始需要在编译时增加 [--enable-swoole-json](/zh/start/install.html#编译选项详解) 参数启用，Swoole 5 起默认启用。

**示例**

```php
$val = json_encode(['hello' => 'swoole']);
$str = pack('N', strlen($val)) . $val . "\r\n";
$l = strlen($str) - 6;
var_dump(json_decode(substr($str, 4, $l), true));
var_dump(swoole_substr_json_decode($str, 4, $l, true));
```

## 异步与协程

### swoole_async_set

设置异步 IO 和协程相关的全局选项，必须在事件循环创建之前调用（通常在脚本启动阶段），且只能在主线程调用。

```php
function swoole_async_set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 选项数组，可用的键见下表 | 必填 |

可用的选项：

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `enable_coroutine` | 开关内置协程，详见 [enable_coroutine](/zh/server/setting.html#enable-coroutine) | 无 |
| `enable_signalfd` | 开启和关闭 `signalfd` 特性的使用 | 无 |
| `aio_core_worker_num` | 设置 AIO 最小线程数 | 无 |
| `aio_worker_num` | 设置 AIO 最大线程数 | 无 |
| `thread_num` / `min_thread_num` | 设置 AIO 最小线程数，与 `aio_core_worker_num` 等价 | 无 |
| `max_thread_num` | 设置 AIO 最大线程数，与 `aio_worker_num` 等价 | 无 |
| `aio_max_wait_time` | AIO 任务的最大等待时间 | 无 |
| `aio_max_idle_time` | AIO 线程的最大空闲时间 | 无 |
| `wait_signal` | 存在信号监听器时 Reactor 不会退出 | 无 |
| `dns_cache_refresh_time` | DNS 缓存刷新时间 | 无 |
| `dns_lookup_random` | DNS 解析存在多个结果时随机返回其中一个 | 无 |
| `use_async_resolver` | 使用异步 DNS 解析器 | 无 |
| `iouring_entries` | io_uring 提交队列条目数，需编译时启用 [--enable-iouring](/zh/start/install.html#编译选项详解) | 无 |
| `iouring_workers` | io_uring worker 数量，需编译时启用 `--enable-iouring` | 无 |
| `iouring_flag` | io_uring 创建标志，需编译时启用 `--enable-iouring` | 无 |

**返回值**：设置成功返回 `true`；事件循环已创建时抛出 `Swoole\Exception`，提示无法再修改设置。

**示例**

```php
swoole_async_set([
    'thread_num' => 4,
    'max_thread_num' => 16,
]);
```

> [!NOTE]
> AIO 相关选项的更多说明见 [异步文件处理](/zh/file_async.html)。

### swoole_coroutine_socketpair

协程版本的 `socket_create_pair`，创建一对相互连接的协程 Socket。

```php
function swoole_coroutine_socketpair(int $domain, int $type, int $protocol): array|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$domain` | 协议族，如 `AF_UNIX`、`AF_INET` | 必填 |
| `$type` | Socket 类型，如 `SOCK_STREAM`、`SOCK_DGRAM` | 必填 |
| `$protocol` | 协议，如 `IPPROTO_IP` | 必填 |

**返回值**：成功返回包含两个 [`Swoole\Coroutine\Socket`](/zh/client/socket.html) 对象的数组，失败返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v4.6.0` 可用。

**示例**

```php
Co\run(function () {
    $pair = swoole_coroutine_socketpair(AF_UNIX, SOCK_STREAM, 0);
    [$a, $b] = $pair;
    $a->send('hello');
    var_dump($b->recv());
});
```