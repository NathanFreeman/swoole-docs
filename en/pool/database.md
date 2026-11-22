# Database Connection Pool

The `Swoole\Database` namespace provides higher-level wrappers for database connection pools and object proxies, with automatic reconnection on disconnect. Each database consists of three parts: a config class, a proxy class, and a pool class:

| Database | Config class | Proxy class | Pool class |
|:---|:---|:---|:---|
| PDO | [`PDOConfig`](#pdoconfig) | `PDOProxy` | [`PDOPool`](#pdopool) |
| Mysqli | [`MysqliConfig`](#mysqliconfig) | `MysqliProxy` | [`MysqliPool`](#mysqlipool) |
| Redis | [`RedisConfig`](/en/pool/redis.html#redisconfig) | None | [`RedisPool`](/en/pool/redis.html#redispool) |

All three pool classes extend [`ConnectionPool`](/en/pool/common.html#connectionpool), so `withConnection`, `fill`, and `close` can be used directly, with the same behavior as the general-purpose pool.

> [!TIP]
> The [DB component](https://github.com/simple-swoole/db) of the [Simps framework](https://simps.io) is built on top of Database and implements automatic connection return, transactions, and more. You can refer to it or use it directly; see the [Simps documentation](https://simps.io/#/zh-cn/database/mysql).

## PDOPool

### __construct

Creates a PDO connection pool.

```php
public function __construct(Swoole\Database\PDOConfig $config, int $size = self::DEFAULT_SIZE)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$config` | PDO config object, see [PDOConfig](#pdoconfig) | Required |
| `$size` | Pool capacity | `64` |

The constructor sets `PDOProxy` as the proxy class, so the pool stores proxy objects of `PDO` rather than `PDO` itself.

### get

Gets a PDO connection from the pool.

```php
public function get(float $timeout = -1)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout for waiting for a connection, in seconds; floats are supported; `0` or a negative value means no time limit | `-1`, never times out |

**Return value**: returns a `Swoole\Database\PDOProxy` object, used exactly like `PDO`; returns `false` on timeout.

> [!NOTE]
> On each checkout, the proxy resets its own transaction-tracking state, so flags left over from the previous borrower do not affect this borrow's reconnection decisions.

### put

Returns a PDO connection.

```php
public function put(mixed $connection): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$connection` | The `PDOProxy` object to return; passing `null` means the connection is broken and must be discarded and replaced with a new one | Required |

On return, any unfinished transaction on the connection is rolled back first, so the next borrower is not inside a transaction it never started from its very first statement; for MySQL and Oracle, autocommit is also restored to the configured value (enabled by default).

Connections that fail cleanup are discarded and replaced with new ones; if the replacement cannot be created either, creation and failure reporting are left to the next `get`.

> [!NOTE]
> Transactions here are whatever the driver reports. `pdo_mysql` and `pdo_pgsql` recognize manually started transactions (such as `exec('BEGIN')`); `pdo_sqlite` recognizes them since PHP 8.4 or when using Swoole's coroutine SQLite; other drivers only recognize transactions started with `beginTransaction()`.

## MysqliPool

### __construct

Creates a Mysqli connection pool.

```php
public function __construct(Swoole\Database\MysqliConfig $config, int $size = self::DEFAULT_SIZE)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$config` | Mysqli config object, see [MysqliConfig](#mysqliconfig) | Required |
| `$size` | Pool capacity | `64` |

The constructor sets `MysqliProxy` as the proxy class. Throws `Swoole\Database\MysqliException` when the connection fails.

### get

Gets a Mysqli connection from the pool.

```php
public function get(float $timeout = -1)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout for waiting for a connection, in seconds; floats are supported; `0` or a negative value means no time limit | `-1`, never times out |

**Return value**: returns a `Swoole\Database\MysqliProxy` object, used exactly like `mysqli`; returns `false` on timeout.

> [!NOTE]
> Like [PDOPool](#pdopool), the proxy resets its transaction-tracking state on each checkout.

### put

Returns a Mysqli connection.

```php
public function put(mixed $connection): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$connection` | The `MysqliProxy` object to return; passing `null` means the connection is broken and must be discarded and replaced with a new one | Required |

Transaction cleanup and connection replacement behave the same as `put` in [PDOPool](#pdopool).

## PDOConfig

PDO connection configuration. All `with*` methods return `$this` and can be chained; see [Usage Examples](#usage-examples). Every config item has a corresponding `get*` reader method (such as `getHost()`, `getPort()`) that returns the current value.

### withDriver

Sets the PDO driver name; defaults to `mysql` when not set.

```php
public function withDriver(string $driver): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$driver` | PDO driver name, such as `mysql`, `pgsql`, `oci`, `sqlite` | Required |

**Return value**: returns `$this`.

> [!NOTE]
> When the driver is `sqlite`, pass the database file path to [`withDbname`](#withdbname). `:memory:` in-memory databases and temporary databases are not supported, because each connection would open its own separate database, defeating the purpose of the pool.

### withHost

Sets the database server address; defaults to `127.0.0.1` when not set.

```php
public function withHost(string $host): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Server address | Required |

**Return value**: returns `$this`.

### withPort

Sets the database server port; defaults to `3306` when not set.

```php
public function withPort(int $port): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$port` | Server port | Required |

**Return value**: returns `$this`.

### withUnixSocket

Sets the Unix Socket path; defaults to `null` when not set.

```php
public function withUnixSocket(?string $unixSocket): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$unixSocket` | Unix Socket file path; `null` or an empty string means not used | Required |

**Return value**: returns `$this`.

> [!NOTE]
> Once a valid Unix Socket path is set, host and port are no longer used in the DSN.

### withDbname

Sets the database name; defaults to `test` when not set.

```php
public function withDbname(string $dbname): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$dbname` | Database name; when the driver is `sqlite`, this is the database file path | Required |

**Return value**: returns `$this`.

### withCharset

Sets the connection charset; defaults to `utf8mb4` when not set.

```php
public function withCharset(string $charset): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$charset` | Charset name | Required |

**Return value**: returns `$this`.

### withUsername

Sets the login username; defaults to `root` when not set.

```php
public function withUsername(string $username): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$username` | Username | Required |

**Return value**: returns `$this`.

### withPassword

Sets the login password; defaults to `root` when not set.

```php
public function withPassword(string $password): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$password` | Password | Required |

**Return value**: returns `$this`.

### withOptions

Sets the driver options passed to the `PDO` constructor; defaults to `[]` when not set.

```php
public function withOptions(array $options): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$options` | Options array keyed by `PDO::ATTR_*` constants; replaces existing settings entirely | Required |

**Return value**: returns `$this`.

### getAvailableDrivers

Gets the list of currently supported drivers.

```php
public static function getAvailableDrivers(): array
```

**Return value**: returns an array of driver names, currently `['mysql']`.

## MysqliConfig

Mysqli connection configuration. All `with*` methods return `$this` and can be chained. Every config item has a corresponding `get*` reader method that returns the current value.

### withHost

Sets the database server address; defaults to `127.0.0.1` when not set.

```php
public function withHost(string $host): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Server address | Required |

**Return value**: returns `$this`.

### withPort

Sets the database server port; defaults to `3306` when not set.

```php
public function withPort(int $port): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$port` | Server port | Required |

**Return value**: returns `$this`.

### withUnixSocket

Sets the Unix Socket path; defaults to `null` when not set.

```php
public function withUnixSocket(?string $unixSocket): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$unixSocket` | Unix Socket file path, passed as the last argument of `mysqli::real_connect()` | Required |

**Return value**: returns `$this`.

### withDbname

Sets the database name; defaults to `test` when not set.

```php
public function withDbname(string $dbname): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$dbname` | Database name | Required |

**Return value**: returns `$this`.

### withCharset

Sets the connection charset; defaults to `utf8mb4` when not set.

```php
public function withCharset(string $charset): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$charset` | Charset name, applied via `mysqli::set_charset()` after the connection succeeds | Required |

**Return value**: returns `$this`.

### withUsername

Sets the login username; defaults to `root` when not set.

```php
public function withUsername(string $username): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$username` | Username | Required |

**Return value**: returns `$this`.

### withPassword

Sets the login password; defaults to `root` when not set.

```php
public function withPassword(string $password): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$password` | Password | Required |

**Return value**: returns `$this`.

### withOptions

Sets connection options; defaults to `[]` when not set.

```php
public function withOptions(array $options): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$options` | Options array keyed by `MYSQLI_OPT_*` constants; replaces existing settings entirely | Required |

**Return value**: returns `$this`.

> [!NOTE]
> These options are set one by one via `mysqli::set_opt()` **before** `real_connect()`, so only options that can be set before connecting are allowed.

## Usage Examples

### PDO

```php
<?php
declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Database\PDOConfig;
use Swoole\Database\PDOPool;
use Swoole\Runtime;
use function Swoole\Coroutine\run;

const N = 1024;

Runtime::enableCoroutine();
$s = microtime(true);
run(function () {
    $pool = new PDOPool((new PDOConfig)
        ->withHost('127.0.0.1')
        ->withPort(3306)
        // ->withUnixSocket('/tmp/mysql.sock')
        ->withDbname('test')
        ->withCharset('utf8mb4')
        ->withUsername('root')
        ->withPassword('root')
    );
    for ($n = N; $n--;) {
        Coroutine::create(function () use ($pool) {
            $pdo = $pool->get();
            $statement = $pdo->prepare('SELECT ? + ?');
            if (!$statement) {
                throw new RuntimeException('Prepare failed');
            }
            $a = mt_rand(1, 100);
            $b = mt_rand(1, 100);
            $result = $statement->execute([$a, $b]);
            if (!$result) {
                throw new RuntimeException('Execute failed');
            }
            $result = $statement->fetchAll();
            if ($a + $b !== (int)$result[0][0]) {
                throw new RuntimeException('Bad result');
            }
            $pool->put($pdo);
        });
    }
});
$s = microtime(true) - $s;
echo 'Use ' . $s . 's for ' . N . ' queries' . PHP_EOL;
```

### Mysqli

```php
<?php
declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Database\MysqliConfig;
use Swoole\Database\MysqliPool;
use Swoole\Runtime;
use function Swoole\Coroutine\run;

const N = 1024;

Runtime::enableCoroutine();
$s = microtime(true);
run(function () {
    $pool = new MysqliPool((new MysqliConfig)
        ->withHost('127.0.0.1')
        ->withPort(3306)
        // ->withUnixSocket('/tmp/mysql.sock')
        ->withDbname('test')
        ->withCharset('utf8mb4')
        ->withUsername('root')
        ->withPassword('root')
    );
    for ($n = N; $n--;) {
        Coroutine::create(function () use ($pool) {
            $mysqli = $pool->get();
            $statement = $mysqli->prepare('SELECT ? + ?');
            if (!$statement) {
                throw new RuntimeException('Prepare failed');
            }
            $a = mt_rand(1, 100);
            $b = mt_rand(1, 100);
            if (!$statement->bind_param('dd', $a, $b)) {
                throw new RuntimeException('Bind param failed');
            }
            if (!$statement->execute()) {
                throw new RuntimeException('Execute failed');
            }
            if (!$statement->bind_result($result)) {
                throw new RuntimeException('Bind result failed');
            }
            if (!$statement->fetch()) {
                throw new RuntimeException('Fetch failed');
            }
            if ($a + $b !== (int)$result) {
                throw new RuntimeException('Bad result');
            }
            while ($statement->fetch()) {
                continue;
            }
            $pool->put($mysqli);
        });
    }
});
$s = microtime(true) - $s;
echo 'Use ' . $s . 's for ' . N . ' queries' . PHP_EOL;
```

## Notes

> [!WARNING]
> MySQL reconnection can automatically restore most of the connection context (fetch mode, attributes already set, prepared Statements, etc.), but context such as transactions cannot be restored. If a connection drops while inside a transaction, an exception is thrown; evaluate the reliability of reconnection for your own use case.