# 協程調度器

`Swoole\Coroutine\Scheduler` 是協程任務調度器，用於批量創建協程任務，並驅動事件循環直到所有任務執行完畢。常用的 [run() 函數](/zh-hant/coroutine/container.html#run-函數) 就是基於這個類封裝的。

> [!NOTE]
> Swoole 版本 >= `v4.4.0` 可用。別名 `Co\Scheduler`。該類爲 `final`，不可序列化、不可克隆。

## 方法

### add

添加一個協程任務到調度器。任務**不會立即執行**，調用 [start](#start) 時纔會統一創建並執行。

```php
public function add(callable $func, mixed ...$param): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$func` | 協程任務回調函數 | 必填 |
| `$param` | 傳遞給回調函數的可變參數 | 無 |

> [!WARNING]
> 在 `start` 之後調用 `add` 會產生警告，任務不會被添加。

### parallel

添加 `n` 個使用同一回調函數的協程任務。與 [add](#add) 的唯一區別是重複次數，所有協程在 `start` 時一次性全部創建，而不是分批等待。

```php
public function parallel(int $n, callable $func, mixed ...$param): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$n` | 協程任務數量，必須大於 `0`，否則拋出 `ValueError` | 必填 |
| `$func` | 協程任務回調函數 | 必填 |
| `$param` | 傳遞給回調函數的可變參數 | 無 |

### set

設置協程和全局運行時選項，與 [Server::set](/zh-hant/server/methods.html#set) 共用同一配置入口。

```php
public function set(array $settings): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$settings` | 選項數組，可用的鍵見下表 | 必填 |

常用的協程選項：

| 選項 | 說明 |
|:---|:---|
| `max_coroutine` / `max_coro_num` | 最大協程數量 |
| `hook_flags` | 一鍵協程化的函數類型掩碼，詳見 [一鍵協程化](/zh-hant/coroutine/hook.html) |
| `enable_deadlock_check` | 開啓協程死鎖檢測 |
| `enable_preemptive_scheduler` | 開啓搶佔式調度 |
| `c_stack_size` / `stack_size` | 協程 C 棧大小 |
| `name_resolver` | 名字解析器對象數組，詳見 [名字解析器](/zh-hant/name_resolver/overview.html) |

調度器專屬選項：

| 選項 | 說明 |
|:---|:---|
| `dns_cache_expire` | DNS 緩存過期時間，單位爲秒 |
| `dns_cache_capacity` | DNS 緩存容量 |
| `exit_condition` | 事件循環退出條件回調函數，無參數；返回 `false` 時阻止事件循環退出 |

同時也支持 `log_file`、`log_level`、`dns_server`、`socket_read_timeout` 等全局選項，與 [服務器配置](/zh-hant/server/setting.html) 中的同名項一致。

### getOptions

獲取已設置的協程選項。

```php
public function getOptions(): ?array
```

**返回值**：返回協程選項數組的副本；從未調用過 `set` 時返回 `null`。

### start

創建全部協程任務並啓動事件循環，**阻塞**直到所有協程退出。

```php
public function start(): bool
```

**返回值**：全部協程創建成功並執行完畢返回 `true`；沒有任務、協程創建失敗、重複調用 `start` 或事件循環初始化失敗時返回 `false`。

> [!TIP]
> `start` 結束後調度器會復位，可以再次 `add` 新任務並重新 `start`。但沒有任務時調用 `start` 會產生 `no coroutine task` 警告並返回 `false`。

## 與 run() 函數的關係

[run() 函數](/zh-hant/coroutine/container.html#run-函數) 就是 `Scheduler` 的封裝，等價於：

```php
<?php
function run(callable $fn, mixed ...$args): bool
{
    $s = new Swoole\Coroutine\Scheduler();
    $options = Swoole\Coroutine::getOptions();
    if (!isset($options['hook_flags'])) {
        $s->set(['hook_flags' => SWOOLE_HOOK_ALL]);
    }
    $s->add($fn, ...$args);
    return $s->start();
}
```

區別在於：`run()` 在未設置 `hook_flags` 時自動開啓全部協程化，而直接使用 `Scheduler` 時需要自行 `set`。

## 示例

```php
<?php
$sch = new Co\Scheduler();
$sch->set(['max_coroutine' => 100]);
$sch->parallel(10, function ($t, $n) {
    Co::sleep($t);
    echo "Co " . Co::getCid() . "\n";
}, 0.05, 'A');
$sch->start();
```