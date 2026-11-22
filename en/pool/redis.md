# Redis Connection Pool

`Swoole\Database\RedisPool` wraps a Redis connection pool on top of the general-purpose pool. It extends [`ConnectionPool`](/en/pool/common.html#connectionpool), so `withConnection`, `fill`, and `close` can be used directly, with the same behavior as the general-purpose pool.

## RedisPool

### __construct

Creates a Redis connection pool.

```php
public function __construct(Swoole\Database\RedisConfig $config, int $size = self::DEFAULT_SIZE)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$config` | Redis config object, see [RedisConfig](#redisconfig) | Required |
| `$size` | Pool capacity | `64` |

The constructor uses no proxy class; the pool stores native `Redis` objects. After a connection is established, authentication, database selection, and Redis option setup are performed in order.

### get

Gets a Redis connection from the pool.

```php
public function get(float $timeout = -1)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout for waiting for a connection, in seconds; floats are supported; `0` or a negative value means no time limit | `-1`, never times out |

**Return value**: returns a native `Redis` object with no proxy layer; returns `false` on timeout.

### put

Returns a Redis connection.

```php
public function put(mixed $connection): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$connection` | The `Redis` object to return; passing `null` means the connection is broken and must be discarded and replaced with a new one | Required |

On return, connections in MULTI or pipeline mode are restored to normal mode, so the next borrower's commands are executed instead of queued (for example, a transaction that was never `exec()`-ed). Connections that cannot be restored are discarded and replaced with new ones.

> [!WARNING]
> State the connection itself does not report is not reset: a `WATCH` not ended with `EXEC` / `DISCARD` / `UNWATCH`, and a database switched via `select()`, are both left to the next borrower.

## RedisConfig

Redis connection configuration. All `with*` methods return `$this` and can be chained. Every config item has a corresponding `get*` reader method that returns the current value.

### withHost

Sets the Redis server address; defaults to `127.0.0.1` when not set.

```php
public function withHost(string $host): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Server address | Required |

**Return value**: returns `$this`.

### withPort

Sets the Redis server port; defaults to `6379` when not set.

```php
public function withPort(int $port): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$port` | Server port | Required |

**Return value**: returns `$this`.

### withTimeout

Sets the connection timeout; defaults to `0.0` when not set.

```php
public function withTimeout(float $timeout): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Connection timeout in seconds; `0.0` means no timeout | Required |

**Return value**: returns `$this`.

### withReadTimeout

Sets the read timeout; defaults to `0.0` when not set.

```php
public function withReadTimeout(float $read_timeout): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$read_timeout` | Read timeout in seconds; `0.0` means no timeout | Required |

**Return value**: returns `$this`.

### withRetryInterval

Sets the connection retry interval; defaults to `0` when not set.

```php
public function withRetryInterval(int $retry_interval): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$retry_interval` | Retry interval in milliseconds | Required |

**Return value**: returns `$this`.

### withReserved

Sets the reserved parameter of phpredis `connect()`; defaults to `''` when not set.

```php
public function withReserved(string $reserved): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$reserved` | Reserved parameter | Required |

**Return value**: returns `$this`.

> [!WARNING]
> The current version does not pass this value to phpredis when connecting (`persistent_id` is fixed to `null`, because pooled connections should not be persistent), so setting it has no actual effect.

### withAuth

Sets the authentication password; defaults to `''` when not set.

```php
public function withAuth(string|array $auth): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$auth` | A password string, or an array in the form `[username, password]` | Required |

**Return value**: returns `$this`.

> [!NOTE]
> Authentication is skipped when the value is empty.

### withDbIndex

Sets the database index; defaults to `0` when not set.

```php
public function withDbIndex(int $dbIndex): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$dbIndex` | Database index | Required |

**Return value**: returns `$this`.

> [!NOTE]
> `select()` is not executed when the index is `0`.

### withOption

Sets a single Redis option.

```php
public function withOption(int $option, mixed $value): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$option` | Option constant, such as `Redis::OPT_SERIALIZER` | Required |
| `$value` | Option value | Required |

**Return value**: returns `$this`.

> [!TIP]
> Call it multiple times to accumulate options; each call only affects the one key passed in.

### setOptions

Sets Redis options as a whole.

```php
public function setOptions(array $options): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$options` | Array keyed by option constants; **replaces entirely** all options previously set via `withOption` | Required |

**Return value**: returns `$this`.

## Usage Examples

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