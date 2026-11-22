# 通道

`Swoole\Coroutine\Channel` 是一个用于协程间通信的高性能数据结构，可以直接把它理解成协程间专用的消息队列。

- 通道与 `PHP` 的 `Array` 类似，仅占用内存，没有其他额外的资源申请，所有操作均为内存操作，无 `IO` 消耗。
- 底层使用 `PHP` 引用计数实现，无内存拷贝。即使是传递巨大字符串或数组也不会产生额外性能消耗。
- 通道使用本地内存，不同的进程之间内存是隔离的。只能在同一进程的不同协程内进行 [`push`](#push) 和 [`pop`](#pop) 操作。

## 属性

### capacity

当前通道容量。

```php
public int $capacity
```

### errCode

最近一次操作的错误码。

```php
public int $errCode
```

| 错误码 | 含义 |
|:---|:---|
| `SWOOLE_CHANNEL_OK` | 操作成功 |
| `SWOOLE_CHANNEL_TIMEOUT` | 操作超时 |
| `SWOOLE_CHANNEL_CLOSED` | 通道已关闭 |
| `SWOOLE_CHANNEL_CANCELED` | 被 [cancel](/zh/coroutine/coroutine_api.html#cancel) 取消了当前操作 |

## 方法

### __construct

创建一个通道。

```php
public function __construct(int $capacity = 1)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$capacity` | 通道容量，必须为大于或等于 `1` 的整数 | `1` |

> [!TIP]
> 当通道中的数据量等于 `$capacity` 时，通道已满。下一个协程写入数据会触发协程切换，直到通道的数据被消费了才能继续写入。

### push

向通道中写入数据。

```php
public function push(mixed $data, float $timeout = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 写入的数据，可以是任意类型的 PHP 变量，包括匿名函数和资源 | 必填 |
| `$timeout` | 超时时间，单位为秒，支持浮点型（`1.5` 表示 `1s` + `500ms`） | `-1`，永不超时 |

**返回值**：执行成功返回 `true`；通道被关闭时执行失败返回 `false`，可使用 [`$channel->errCode`](#errcode) 得到错误码。

> [!NOTE]
> 为避免产生歧义，请勿向通道中写入 `null` 和 `false`。

> [!TIP]
> 在通道已满的情况下，`push` 会挂起当前协程。在约定的时间内，如果没有任何消费者消费数据就会发生超时，底层会恢复当前协程，`push` 调用立即返回 `false`，写入失败。

### pop

从通道中读取数据。

```php
public function pop(float $timeout = -1): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 超时时间，单位为秒，支持浮点型（`1.5` 表示 `1s` + `500ms`） | `-1`，永不超时 |

**返回值**：可以是任意类型的 PHP 变量，包括匿名函数和资源；通道被关闭时执行失败返回 `false`。

> [!TIP]
> 在通道为空的情况下，`pop` 会挂起当前协程。在约定的时间内，如果没有任何生产者生产数据就会发生超时，底层会恢复当前协程，`pop` 调用立即返回 `false`，读取失败。

### stats

获取通道的状态。

```php
public function stats(): array
```

**返回值**：返回一个数组，缓冲通道包含以下几项信息。

| key | 含义 |
|:---|:---|
| `consumer_num` | 等待消费（`pop`）的协程数量 |
| `producer_num` | 等待生产（`push`）的协程数量 |
| `queue_num` | 通道中的数据数量 |

### close

关闭通道，并唤醒所有等待读写通道的协程。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

> [!TIP]
> 关闭后会唤醒所有生产者协程，`push` 方法返回 `false`；同时唤醒所有消费者协程，`pop` 方法返回 `false`。

### length

获取通道中的待消费数据数量。

```php
public function length(): int
```

**返回值**：通道中的待消费数据数量。

### isEmpty

判断当前通道是否为空。

```php
public function isEmpty(): bool
```

**返回值**：通道为空返回 `true`，否则返回 `false`。

### isFull

判断当前通道是否已满。

```php
public function isFull(): bool
```

**返回值**：通道已满返回 `true`，否则返回 `false`。

## 示例

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\Channel;
use function Swoole\Coroutine\run;

run(function () {
    $channel = new Channel(1);
    Coroutine::create(function () use ($channel) {
        for ($i = 0; $i < 10; $i++) {
            Coroutine::sleep(1.0);
            $channel->push(['rand' => rand(1000, 9999), 'index' => $i]);
            echo "{$i}\n";
        }
    });
    Coroutine::create(function () use ($channel) {
        while (1) {
            $data = $channel->pop(2.0);
            if ($data) {
                var_dump($data);
            } else {
                assert($channel->errCode === SWOOLE_CHANNEL_TIMEOUT);
                break;
            }
        }
    });
});
```

## 注意

在异步服务器中使用 `Channel` 时，必须在 [start](/zh/server/methods.html#start) 方法执行之前创建好 `Channel` 对象，并通过 `use` 语法引用该对象。

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\Channel;

$channel = new Channel(100);
$server = new Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => 4,
    'enable_coroutine' => true
]);

$server->on('request', function (Request $request, Response $response) use ($channel) {

});

$server->start();
```
