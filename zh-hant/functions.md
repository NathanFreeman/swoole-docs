# 函數

Swoole 除了類方法之外，還提供了一些全局函數，用於獲取系統信息、處理錯誤碼、維護 MIME 類型表、零拷貝反序列化等。這些函數均以 `swoole_` 爲前綴，無需創建對象即可直接調用。

## 系統信息

### swoole_version

獲取 Swoole 擴展的版本號，如 `6.0.0`。

```php
function swoole_version(): string
```

**返回值**：版本號字符串，與常量 `SWOOLE_VERSION` 的值相同。

**示例**

```php
var_dump(SWOOLE_VERSION); // 常量 SWOOLE_VERSION 同樣表示 Swoole 擴展版本
var_dump(swoole_version());
/**
返回值：
string(6) "1.9.23"
string(6) "1.9.23"
**/
```

### swoole_cpu_num

獲取本機 CPU 核數。

```php
function swoole_cpu_num(): int
```

**返回值**：CPU 核數。常用於設置 `worker_num` 等參數。

**示例**

```shell
php -r "echo swoole_cpu_num();"
```

## 錯誤處理

### swoole_errno

獲取最近一次系統調用的錯誤碼，等同於 C/C++ 的 `errno` 變量。

```php
function swoole_errno(): int
```

**返回值**：錯誤碼整數。錯誤碼的值與操作系統有關，可使用 [`swoole_strerror`](#swoole-strerror) 將錯誤碼轉換爲錯誤信息。

### swoole_last_error

獲取最近一次 Swoole 底層的錯誤碼。

```php
function swoole_last_error(): int
```

**返回值**：Swoole 底層錯誤碼整數。可使用 `swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE)` 將錯誤碼轉換爲錯誤信息。

**示例**

```php
var_dump(swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE));
```

### swoole_strerror

將錯誤碼轉換成錯誤信息。

```php
function swoole_strerror(int $errno, int $error_type = SWOOLE_STRERROR_SYSTEM): string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$errno` | 錯誤碼 | 必填 |
| `$error_type` | 錯誤碼類型，見下表 | `SWOOLE_STRERROR_SYSTEM`（`0`） |

`$error_type` 可用的常量：

| 常量 | 值 | 說明 |
|:---|:---|:---|
| `SWOOLE_STRERROR_SYSTEM` | `0` | 標準的 Unix Errno，由系統調用錯誤產生，如 `EAGAIN`、`ETIMEDOUT` 等 |
| `SWOOLE_STRERROR_GAI` | `1` | `getaddrinfo` 錯誤碼，由 DNS 操作產生 |
| `SWOOLE_STRERROR_DNS` | `2` | DNS 解析錯誤碼（`hstrerror`） |
| `SWOOLE_STRERROR_SWOOLE` | `9` | Swoole 底層錯誤碼，使用 [`swoole_last_error`](#swoole-last-error) 得到 |

> [!NOTE]
> 當 `$errno` 落在 Swoole 底層錯誤碼區間（`500` 起）時，即使未指定 `SWOOLE_STRERROR_SWOOLE`，也會自動按 Swoole 錯誤碼處理。

**返回值**：錯誤信息字符串。

**示例**

```php
var_dump(swoole_strerror(swoole_last_error(), SWOOLE_STRERROR_SWOOLE));
```

### swoole_clear_error

清除 Swoole 底層的最後一次錯誤碼（將 [`swoole_last_error`](#swoole-last-error) 重置爲 `0`）。

```php
function swoole_clear_error(): void
```

> [!NOTE]
> Swoole 版本 >= `v4.6.0` 可用。

### swoole_error_log

輸出一條指定等級的日誌到 Swoole 日誌中。

```php
function swoole_error_log(int $level, string $msg): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$level` | 日誌等級，見 [log_level](/zh-hant/server/setting.html#log-level) | 必填 |
| `$msg` | 日誌內容 | 必填 |

> [!NOTE]
> Swoole 版本 >= `v4.5.8` 可用。

### swoole_error_log_ex

寫入指定等級和錯誤碼的日誌。

```php
function swoole_error_log_ex(int $level, int $error, string $msg): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$level` | 日誌等級，見 [log_level](/zh-hant/server/setting.html#log-level) | 必填 |
| `$error` | Swoole 錯誤碼 | 必填 |
| `$msg` | 日誌內容 | 必填 |

> [!NOTE]
> Swoole 版本 >= `v4.8.1` 可用。

### swoole_ignore_error

忽略指定錯誤碼的錯誤日誌，設置後該錯誤碼對應的日誌將不再輸出。

```php
function swoole_ignore_error(int $error): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$error` | 要忽略的 Swoole 錯誤碼 | 必填 |

> [!NOTE]
> Swoole 版本 >= `v4.8.1` 可用。

## 網絡信息

### swoole_get_local_ip

獲取本機所有網絡接口的 IP 地址。

```php
function swoole_get_local_ip(int $family = AF_INET): array
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$family` | 地址族，`AF_INET` 表示 IPv4，`AF_INET6` 表示 IPv6 | `AF_INET` |

**返回值**：以網絡接口名稱爲鍵、IP 地址爲值的關聯數組，如 `array("eth0" => "192.168.1.100")`；獲取失敗返回 `false`。

**示例**

```php
// 獲取本機所有網絡接口的 IP 地址
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
> - 默認只返回 IPv4 地址，傳入 `AF_INET6` 可獲取 IPv6 地址；返回結果會過濾掉本地 loopback 地址（如 `127.0.0.1`）。
> - 此函數會實時調用系統接口（Linux 下爲 `getifaddrs`）獲取接口信息，底層無緩存。

### swoole_get_local_mac

獲取本機網卡的 MAC 地址。

```php
function swoole_get_local_mac(): array
```

**返回值**：以網絡接口名稱爲鍵、MAC 地址爲值的關聯數組；獲取失敗或平臺不支持時返回 `false`。

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
> 返回結果會過濾掉 loopback 接口。

### swoole_clear_dns_cache

清除 Swoole 內置的 DNS 緩存，對協程 DNS 查詢（如 [`Co\System::gethostbyname`](/zh-hant/coroutine/system_api.html#gethostbyname)）有效。

```php
function swoole_clear_dns_cache(): void
```

## 進程管理

### swoole_set_process_name

設置進程的名稱。修改進程名稱後，通過 `ps` 命令看到的將不再是 `php your_file.php`，而是設定的字符串。

```php
function swoole_set_process_name(string $process_name): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$process_name` | 新的進程名稱 | 必填 |

**返回值**：設置成功返回 `true`；當前環境不存在 `cli_set_process_title` 函數時（非 CLI 模式）返回 `false` 並拋出警告。

此函數與 PHP 5.5 提供的 `cli_set_process_title` 功能相同，內部實現即委託給 `cli_set_process_title`，可用於 PHP 5.2 之上的任意版本。

**示例**

```php
swoole_set_process_name("swoole server");
```

爲 Swoole Server 重命名各個進程名稱：

- 在 [onStart](/zh-hant/server/events.html#start) 回調中修改主進程名稱
- 在 [onManagerStart](/zh-hant/server/events.html#managerstart) 回調中修改管理進程（`manager`）的名稱
- 在 [onWorkerStart](/zh-hant/server/events.html#workerstart) 回調中修改 Worker 進程名稱

> [!WARNING]
> 低版本 Linux 內核和 Mac OSX 不支持進程重命名。

## MIME 類型

以下函數用於增刪查改 Swoole 內置的 MIME 類型表，HTTP 服務器發送靜態文件時會根據文件後綴從該表中獲取 `Content-Type`。

### swoole_mime_type_add

添加新的 MIME 類型到內置的 MIME 類型表上。

```php
function swoole_mime_type_add(string $suffix, string $mime_type): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$suffix` | 文件後綴名，如 `html` | 必填 |
| `$mime_type` | MIME 類型，如 `text/html` | 必填 |

**返回值**：添加成功返回 `true`；後綴已存在時返回 `false`，不會覆蓋原有類型。需要覆蓋時請使用 [`swoole_mime_type_set`](#swoole-mime-type-set)。

### swoole_mime_type_set

設置某個後綴對應的 MIME 類型，後綴不存在時會自動添加，已存在時直接覆蓋。

```php
function swoole_mime_type_set(string $suffix, string $mime_type): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$suffix` | 文件後綴名，如 `html` | 必填 |
| `$mime_type` | MIME 類型，如 `text/html` | 必填 |

### swoole_mime_type_delete

刪除某個後綴對應的 MIME 類型。

```php
function swoole_mime_type_delete(string $suffix): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$suffix` | 文件後綴名 | 必填 |

**返回值**：刪除成功返回 `true`；後綴不存在時返回 `false`。

### swoole_mime_type_get

獲取文件名對應的 MIME 類型。

```php
function swoole_mime_type_get(string $filename): string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 文件名，函數內部會提取其後綴進行查找 | 必填 |

**返回值**：對應的 MIME 類型字符串；後綴不存在時返回 `application/octet-stream`。

### swoole_mime_type_exists

判斷文件名對應的 MIME 類型是否存在。

```php
function swoole_mime_type_exists(string $filename): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 文件名，函數內部會提取其後綴進行查找 | 必填 |

**返回值**：存在返回 `true`，不存在返回 `false`。

### swoole_mime_type_list

列出內置 MIME 類型表中的所有 MIME 類型。

```php
function swoole_mime_type_list(): array
```

**返回值**：索引數組，元素爲 MIME 類型字符串（不包含後綴鍵名）。

## 零拷貝反序列化

### swoole_substr_unserialize

零拷貝 PHP 反序列化，直接從字符串的指定區間反序列化數據，避免 `substr` 產生的字符串拷貝。除 `$offset` 和 `$length` 以外，其他參數和 `unserialize` 一致。

```php
function swoole_substr_unserialize(string $str, int $offset, int $length = 0, array $options = []): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$str` | 包含序列化數據的字符串 | 必填 |
| `$offset` | 起始偏移量，支持負數（表示從字符串末尾向前計算） | 必填 |
| `$length` | 反序列化的數據長度，小於等於 `0` 或超出剩餘長度時取到字符串末尾 | `0` |
| `$options` | 選項數組，與 `unserialize` 的 `options` 參數一致 | `[]` |

**返回值**：反序列化後的值；字符串爲空或偏移量非法時返回 `false`。

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

零拷貝 JSON 解碼，直接從字符串的指定區間解碼 JSON 數據，避免 `substr` 產生的字符串拷貝。除 `$offset` 和 `$length` 以外，其他參數和 `json_decode` 一致。

```php
function swoole_substr_json_decode(string $str, int $offset, int $length = 0, bool $associative = false, int $depth = 512, int $flags = 0): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$str` | 包含 JSON 數據的字符串 | 必填 |
| `$offset` | 起始偏移量，支持負數（表示從字符串末尾向前計算） | 必填 |
| `$length` | 解碼的數據長度，小於等於 `0` 或超出剩餘長度時取到字符串末尾 | `0` |
| `$associative` | 爲 `true` 時將 JSON 對象解碼爲關聯數組；傳 `null` 時由 `$flags` 中的 `JSON_OBJECT_AS_ARRAY` 決定 | `false` |
| `$depth` | 最大遞歸深度 | `512` |
| `$flags` | JSON 解碼選項，與 `json_decode` 的 `flags` 參數一致 | `0` |

**返回值**：解碼後的值；字符串爲空或偏移量非法時返回 `null` 並拋出警告。

> [!NOTE]
> Swoole 版本 >= `v4.5.6` 可用，從 `v4.5.7` 版本開始需要在編譯時增加 [--enable-swoole-json](/zh-hant/start/install.html#編譯選項詳解) 參數啓用，Swoole 5 起默認啓用。

**示例**

```php
$val = json_encode(['hello' => 'swoole']);
$str = pack('N', strlen($val)) . $val . "\r\n";
$l = strlen($str) - 6;
var_dump(json_decode(substr($str, 4, $l), true));
var_dump(swoole_substr_json_decode($str, 4, $l, true));
```

## 哈希計算

### swoole_hashcode

計算字符串的哈希值，可用於用戶態的負載均衡分發、一致性哈希等場景。

```php
function swoole_hashcode(string $data, int $type = 0): false|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 要計算哈希的字符串 | 必填 |
| `$type` | 哈希算法：`0` 爲 `PHP` 內核字符串哈希（與數組鍵哈希一致，`64` 位系統下結果可能爲負數）；`1` 爲 `Jenkins one-at-a-time` 哈希（`32` 位無符號範圍）；其他值返回 `false` | `0` |

**返回值**：哈希值整數，`$type` 不合法時返回 `false`。

**示例**

```php
<?php
var_dump(swoole_hashcode('hello'));        // PHP 內核哈希
var_dump(swoole_hashcode('hello', 1));     // Jenkins one-at-a-time
```

## 異步與協程

### swoole_async_set

設置異步 IO 和協程相關的全局選項，必須在事件循環創建之前調用（通常在腳本啓動階段），且只能在主線程調用。

```php
function swoole_async_set(array $settings): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 選項數組，可用的鍵見下表 | 必填 |

可用的選項：

| 選項 | 說明 | 默認值 |
|:---|:---|:---|
| `enable_coroutine` | 開關內置協程，詳見 [enable_coroutine](/zh-hant/server/setting.html#enable-coroutine) | 無 |
| `enable_signalfd` | 開啓和關閉 `signalfd` 特性的使用 | 無 |
| `aio_core_worker_num` | 設置 AIO 最小線程數 | 無 |
| `aio_worker_num` | 設置 AIO 最大線程數 | 無 |
| `thread_num` / `min_thread_num` | 設置 AIO 最小線程數，與 `aio_core_worker_num` 等價 | 無 |
| `max_thread_num` | 設置 AIO 最大線程數，與 `aio_worker_num` 等價 | 無 |
| `aio_max_wait_time` | AIO 任務的最大等待時間 | 無 |
| `aio_max_idle_time` | AIO 線程的最大空閒時間 | 無 |
| `wait_signal` | 存在信號監聽器時 Reactor 不會退出 | 無 |
| `dns_cache_refresh_time` | DNS 緩存刷新時間 | 無 |
| `dns_lookup_random` | DNS 解析存在多個結果時隨機返回其中一個 | 無 |
| `use_async_resolver` | 使用異步 DNS 解析器 | 無 |
| `iouring_entries` | io_uring 提交隊列條目數，需編譯時啓用 [--enable-iouring](/zh-hant/start/install.html#編譯選項詳解) | 無 |
| `iouring_workers` | io_uring worker 數量，需編譯時啓用 `--enable-iouring` | 無 |
| `iouring_flag` | io_uring 創建標誌，需編譯時啓用 `--enable-iouring` | 無 |

**返回值**：設置成功返回 `true`；事件循環已創建時拋出 `Swoole\Exception`，提示無法再修改設置。

**示例**

```php
swoole_async_set([
    'thread_num' => 4,
    'max_thread_num' => 16,
]);
```

> [!NOTE]
> AIO 相關選項的更多說明見 [異步文件處理](/zh-hant/file_async.html)。

### swoole_coroutine_socketpair

協程版本的 `socket_create_pair`，創建一對相互連接的協程 Socket。

```php
function swoole_coroutine_socketpair(int $domain, int $type, int $protocol): array|false
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$domain` | 協議族，如 `AF_UNIX`、`AF_INET` | 必填 |
| `$type` | Socket 類型，如 `SOCK_STREAM`、`SOCK_DGRAM` | 必填 |
| `$protocol` | 協議，如 `IPPROTO_IP` | 必填 |

**返回值**：成功返回包含兩個 [`Swoole\Coroutine\Socket`](/zh-hant/client/socket.html) 對象的數組，失敗返回 `false`。

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