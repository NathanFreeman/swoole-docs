# 协程调度器

`Swoole\Coroutine\Scheduler` 是协程任务调度器，用于批量创建协程任务，并驱动事件循环直到所有任务执行完毕。常用的 [run() 函数](/zh/coroutine/container.html#run-函数) 就是基于这个类封装的。

> [!NOTE]
> Swoole 版本 >= `v4.4.0` 可用。别名 `Co\Scheduler`。该类为 `final`，不可序列化、不可克隆。

## 方法

### add

添加一个协程任务到调度器。任务**不会立即执行**，调用 [start](#start) 时才会统一创建并执行。

```php
public function add(callable $func, mixed ...$param): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$func` | 协程任务回调函数 | 必填 |
| `$param` | 传递给回调函数的可变参数 | 无 |

> [!WARNING]
> 在 `start` 之后调用 `add` 会产生警告，任务不会被添加。

### parallel

添加 `n` 个使用同一回调函数的协程任务。与 [add](#add) 的唯一区别是重复次数，所有协程在 `start` 时一次性全部创建，而不是分批等待。

```php
public function parallel(int $n, callable $func, mixed ...$param): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$n` | 协程任务数量，必须大于 `0`，否则抛出 `ValueError` | 必填 |
| `$func` | 协程任务回调函数 | 必填 |
| `$param` | 传递给回调函数的可变参数 | 无 |

### set

设置协程和全局运行时选项，与 [Server::set](/zh/server/methods.html#set) 共用同一配置入口。

```php
public function set(array $settings): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | 选项数组，可用的键见下表 | 必填 |

常用的协程选项：

| 选项 | 说明 |
|:---|:---|
| `max_coroutine` / `max_coro_num` | 最大协程数量 |
| `hook_flags` | 一键协程化的函数类型掩码，详见 [一键协程化](/zh/coroutine/hook.html) |
| `enable_deadlock_check` | 开启协程死锁检测 |
| `enable_preemptive_scheduler` | 开启抢占式调度 |
| `c_stack_size` / `stack_size` | 协程 C 栈大小 |
| `name_resolver` | 名字解析器对象数组，详见 [名字解析器](/zh/name_resolver/overview.html) |

调度器专属选项：

| 选项 | 说明 |
|:---|:---|
| `dns_cache_expire` | DNS 缓存过期时间，单位为秒 |
| `dns_cache_capacity` | DNS 缓存容量 |
| `exit_condition` | 事件循环退出条件回调函数，无参数；返回 `false` 时阻止事件循环退出 |

同时也支持 `log_file`、`log_level`、`dns_server`、`socket_read_timeout` 等全局选项，与 [服务器配置](/zh/server/setting.html) 中的同名项一致。

### getOptions

获取已设置的协程选项。

```php
public function getOptions(): ?array
```

**返回值**：返回协程选项数组的副本；从未调用过 `set` 时返回 `null`。

### start

创建全部协程任务并启动事件循环，**阻塞**直到所有协程退出。

```php
public function start(): bool
```

**返回值**：全部协程创建成功并执行完毕返回 `true`；没有任务、协程创建失败、重复调用 `start` 或事件循环初始化失败时返回 `false`。

> [!TIP]
> `start` 结束后调度器会复位，可以再次 `add` 新任务并重新 `start`。但没有任务时调用 `start` 会产生 `no coroutine task` 警告并返回 `false`。

## 与 run() 函数的关系

[run() 函数](/zh/coroutine/container.html#run-函数) 就是 `Scheduler` 的封装，等价于：

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

区别在于：`run()` 在未设置 `hook_flags` 时自动开启全部协程化，而直接使用 `Scheduler` 时需要自行 `set`。

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