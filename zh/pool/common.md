# 通用连接池

Swoole 从 `v4.4.13` 版本开始提供内置协程连接池。协程是并发处理请求的，[多个协程共用一个客户端连接会导致数据错乱](/zh/coroutine/others.html#禁止共享连接)，而每个请求都新建连接开销又太大。连接池复用一批连接，协程用时借出、用完归还。

内置连接池分两层：

- `Swoole\ConnectionPool`：通用连接池，基于 [通道](/zh/coroutine/channel.html) 自动调度，支持传入任意构造器，即本页介绍的内容。
- `Swoole\Database`：在通用连接池之上封装的连接池，带自动断线重连，见 [数据库连接池](/zh/pool/database.html)（PDO、Mysqli）和 [Redis 连接池](/zh/pool/redis.html)。

## ConnectionPool

### __construct

创建一个连接池。

```php
public function __construct(callable $constructor, int $size = self::DEFAULT_SIZE, ?string $proxy = null)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$constructor` | 构造器，每次被调用时须返回一个**新的**连接对象 | 必填 |
| `$size` | 连接池容量，即最多同时存在多少个连接 | `64`（`ConnectionPool::DEFAULT_SIZE`） |
| `$proxy` | 代理类名，传入后连接对象会被包装成该类的实例 | `null`，不包装 |

> [!NOTE]
> 连接池不会预先创建连接，第一次 [`get`](#get) 时才按需创建，直到达到 `$size`。想提前建满可以调用 [`fill`](#fill)。

### get

从连接池中获取一个连接。

```php
public function get(float $timeout = -1)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 等待连接的超时时间，单位为秒，支持浮点型（`1.5` 表示 `1s` + `500ms`）；`0` 或负数表示不限时 | `-1`，永不超时 |

**返回值**：返回一个连接对象；超时、等待期间连接池被关闭、或当前协程被 [cancel](/zh/coroutine/coroutine_api.html#cancel) 取消时返回 `false`。连接池已关闭时调用会抛出 `RuntimeException`。

> [!NOTE]
> 池中没有空闲连接且数量未达 `$size` 时，`get` 会先创建一个新连接；已达 `$size` 则挂起当前协程，等待其他协程 [`put`](#put) 归还。

### put

把连接归还给连接池。

```php
public function put(mixed $connection): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$connection` | 要归还的连接对象；传 `null` 表示当前借出的连接已损坏 | 必填 |

> [!IMPORTANT]
> 借出的连接必须归还。`get` 之后没有 `put`，这个连接会一直被计数占用；累计达到 `$size` 次后，`get` 将再也拿不到连接。用 [`withConnection`](#withconnection) 可以自动归还。

> [!NOTE]
> 传 `null` 时底层会把连接计数减一并立即新建一个连接补位，用于丢弃已损坏、不可重用的连接。

### withConnection

借出一个连接交给回调使用，回调结束（正常返回或抛出异常）后自动归还。

```php
public function withConnection(callable $callback, float $timeout = -1): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$callback` | 回调，接收借出的连接对象作为唯一参数 | 必填 |
| `$timeout` | 等待连接的超时时间，单位为秒；`0` 或负数表示不限时 | `-1`，永不超时 |

**返回值**：返回 `$callback` 的返回值。拿不到连接时抛出 `RuntimeException`。

> [!WARNING]
> 回调内不得自行调用 `put`，也不得在回调返回后继续使用该连接、或绑定在它上面的对象（如 Statement、生成器、另一个协程）——连接此时已属于其他协程。

> [!TIP]
> 回调内再调用同一个池的 `withConnection` 需要第二个空闲连接，否则会一直等待，请给内层调用设置 `$timeout`。

### fill

提前创建连接，把连接池填充到 `$size` 个。

```php
public function fill(): void
```

连接池已关闭时调用无效果。

### close

关闭连接池。

```php
public function close(): void
```

关闭时会唤醒所有正在 [`get`](#get) 中等待的协程，它们会得到 `false`。关闭后再调用 `get` 会抛出 `RuntimeException`，`put` 和 `fill` 则直接返回。

## 注意事项

> [!IMPORTANT]
> 若连接对象出现异常不可重用，需要调用 `$pool->put(null)` 归还一个空连接，底层会丢弃它并新建补位，以保证连接池的数量平衡。

> [!NOTE]
> 连接池对象本身可以跨协程共享，这正是它的用途；但从中借出的连接同一时刻只能被一个协程使用，用完必须归还。