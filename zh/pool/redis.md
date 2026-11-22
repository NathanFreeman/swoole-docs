# Redis 连接池

`Swoole\Database\RedisPool` 在通用连接池之上封装了 Redis 连接池，继承自 [`ConnectionPool`](/zh/pool/common.html#connectionpool)，因此 `withConnection`、`fill`、`close` 可以直接使用，行为与通用连接池一致。

## RedisPool

### __construct

创建 Redis 连接池。

```php
public function __construct(Swoole\Database\RedisConfig $config, int $size = self::DEFAULT_SIZE)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$config` | Redis 配置对象，见 [RedisConfig](#redisconfig) | 必填 |
| `$size` | 连接池容量 | `64` |

构造时不使用代理类，池中存放的就是原生 `Redis` 对象。连接建立后依次执行认证、选择数据库、设置 Redis 选项。

### get

从连接池中获取一个 Redis 连接。

```php
public function get(float $timeout = -1)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 等待连接的超时时间，单位为秒，支持浮点型；`0` 或负数表示不限时 | `-1`，永不超时 |

**返回值**：返回原生的 `Redis` 对象，没有代理层；超时返回 `false`。

### put

归还 Redis 连接。

```php
public function put(mixed $connection): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$connection` | 要归还的 `Redis` 对象；传 `null` 表示连接已损坏，需要丢弃并新建补位 | 必填 |

归还时会把处于 MULTI 或 pipeline 模式的连接恢复为普通模式，避免下一个借用者的命令被排队而不是执行（例如一个从未 `exec()` 的事务）。无法恢复的连接会被丢弃并新建补位。

> [!WARNING]
> 连接自身不上报的状态不会被重置：未用 `EXEC` / `DISCARD` / `UNWATCH` 结束的 `WATCH`，以及用 `select()` 切换过的数据库，都会留给下一个借用者。

## RedisConfig

Redis 连接配置。所有 `with*` 方法都返回 `$this`，可以链式调用。每个配置项都有对应的 `get*` 读取方法，返回当前配置值。

### withHost

设置 Redis 服务器地址，不设置时为 `127.0.0.1`。

```php
public function withHost(string $host): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 服务器地址 | 必填 |

**返回值**：返回 `$this`。

### withPort

设置 Redis 服务器端口，不设置时为 `6379`。

```php
public function withPort(int $port): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$port` | 服务器端口 | 必填 |

**返回值**：返回 `$this`。

### withTimeout

设置连接超时时间，不设置时为 `0.0`。

```php
public function withTimeout(float $timeout): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 连接超时时间，单位为秒，`0.0` 表示不超时 | 必填 |

**返回值**：返回 `$this`。

### withReadTimeout

设置读取超时时间，不设置时为 `0.0`。

```php
public function withReadTimeout(float $read_timeout): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$read_timeout` | 读取超时时间，单位为秒，`0.0` 表示不超时 | 必填 |

**返回值**：返回 `$this`。

### withRetryInterval

设置连接重试间隔，不设置时为 `0`。

```php
public function withRetryInterval(int $retry_interval): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$retry_interval` | 重试间隔，单位为毫秒 | 必填 |

**返回值**：返回 `$this`。

### withReserved

设置 phpredis `connect()` 的保留参数，不设置时为 `''`。

```php
public function withReserved(string $reserved): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$reserved` | 保留参数 | 必填 |

**返回值**：返回 `$this`。

> [!WARNING]
> 当前版本建立连接时不会把这个值传给 phpredis（`persistent_id` 固定为 `null`，因为池化连接不应是持久连接），设置它没有实际效果。

### withAuth

设置认证密码，不设置时为 `''`。

```php
public function withAuth(string|array $auth): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$auth` | 密码字符串，或 `[用户名, 密码]` 形式的数组 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 值为空时不执行认证。

### withDbIndex

设置数据库编号，不设置时为 `0`。

```php
public function withDbIndex(int $dbIndex): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$dbIndex` | 数据库编号 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 编号为 `0` 时不执行 `select()`。

### withOption

设置单个 Redis 选项。

```php
public function withOption(int $option, mixed $value): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$option` | 选项常量，如 `Redis::OPT_SERIALIZER` | 必填 |
| `$value` | 选项值 | 必填 |

**返回值**：返回 `$this`。

> [!TIP]
> 可多次调用来累加选项，每次只影响传入的那一个键。

### setOptions

整体设置 Redis 选项。

```php
public function setOptions(array $options): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$options` | 以选项常量为键的数组，**整体覆盖**此前通过 `withOption` 设置的全部选项 | 必填 |

**返回值**：返回 `$this`。

## 使用示例

```php
<?php
declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Database\RedisConfig;
use Swoole\Database\RedisPool;
use Swoole\Runtime;
use function Swoole\Coroutine\run;

const N = 1024;

Runtime::enableCoroutine();
$s = microtime(true);
run(function () {
    $pool = new RedisPool((new RedisConfig)
        ->withHost('127.0.0.1')
        ->withPort(6379)
        ->withAuth('')
        ->withDbIndex(0)
        ->withTimeout(1)
    );
    for ($n = N; $n--;) {
        Coroutine::create(function () use ($pool) {
            $redis = $pool->get();
            $result = $redis->set('foo', 'bar');
            if (!$result) {
                throw new RuntimeException('Set failed');
            }
            $result = $redis->get('foo');
            if ($result !== 'bar') {
                throw new RuntimeException('Get failed');
            }
            $pool->put($redis);
        });
    }
});
$s = microtime(true) - $s;
echo 'Use ' . $s . 's for ' . (N * 2) . ' queries' . PHP_EOL;
```