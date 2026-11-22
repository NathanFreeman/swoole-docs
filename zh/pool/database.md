# 数据库连接池

`Swoole\Database` 命名空间提供了数据库连接池和对象代理的高级封装，支持自动断线重连。每种数据库由配置类、代理类、连接池类三部分组成：

| 数据库 | 配置类 | 代理类 | 连接池类 |
|:---|:---|:---|:---|
| PDO | [`PDOConfig`](#pdoconfig) | `PDOProxy` | [`PDOPool`](#pdopool) |
| Mysqli | [`MysqliConfig`](#mysqliconfig) | `MysqliProxy` | [`MysqliPool`](#mysqlipool) |
| Redis | [`RedisConfig`](/zh/pool/redis.html#redisconfig) | 无 | [`RedisPool`](/zh/pool/redis.html#redispool) |

三个连接池类都继承自 [`ConnectionPool`](/zh/pool/common.html#connectionpool)，因此 `withConnection`、`fill`、`close` 可以直接使用，行为与通用连接池一致。

> [!TIP]
> [Simps 框架](https://simps.io) 的 [DB 组件](https://github.com/simple-swoole/db) 基于 Database 封装，实现了自动归还连接、事务等功能，可以参考或直接使用，详见 [Simps 文档](https://simps.io/#/zh-cn/database/mysql)。

## PDOPool

### __construct

创建 PDO 连接池。

```php
public function __construct(Swoole\Database\PDOConfig $config, int $size = self::DEFAULT_SIZE)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$config` | PDO 配置对象，见 [PDOConfig](#pdoconfig) | 必填 |
| `$size` | 连接池容量 | `64` |

构造时会把 `PDOProxy` 设为代理类，因此池中存放的是 `PDO` 的代理对象而不是 `PDO` 本身。

### get

从连接池中获取一个 PDO 连接。

```php
public function get(float $timeout = -1)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 等待连接的超时时间，单位为秒，支持浮点型；`0` 或负数表示不限时 | `-1`，永不超时 |

**返回值**：返回 `Swoole\Database\PDOProxy` 对象，用法与 `PDO` 一致；超时返回 `false`。

> [!NOTE]
> 每次取出时代理会重置自身的事务跟踪状态，避免上一次借用遗留的标记影响本次的断线重连判断。

### put

归还 PDO 连接。

```php
public function put(mixed $connection): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$connection` | 要归还的 `PDOProxy` 对象；传 `null` 表示连接已损坏，需要丢弃并新建补位 | 必填 |

归还时会先回滚连接上未结束的事务，避免下一个借用者从第一条语句起就处在一个自己没开启的事务里；MySQL 和 Oracle 还会把 autocommit 恢复为配置中的值（默认开启）。

清理失败的连接会被丢弃并新建补位；若新连接也建不出来，则留给下一次 `get` 去创建并报告失败。

> [!NOTE]
> 这里的事务以驱动报告的为准。`pdo_mysql` 和 `pdo_pgsql` 能识别手工开启的事务（如 `exec('BEGIN')`），`pdo_sqlite` 在 PHP 8.4 起或使用 Swoole 协程 SQLite 时也能识别；其他驱动只识别 `beginTransaction()` 开启的事务。

## MysqliPool

### __construct

创建 Mysqli 连接池。

```php
public function __construct(Swoole\Database\MysqliConfig $config, int $size = self::DEFAULT_SIZE)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$config` | Mysqli 配置对象，见 [MysqliConfig](#mysqliconfig) | 必填 |
| `$size` | 连接池容量 | `64` |

构造时会把 `MysqliProxy` 设为代理类。连接失败时抛出 `Swoole\Database\MysqliException`。

### get

从连接池中获取一个 Mysqli 连接。

```php
public function get(float $timeout = -1)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 等待连接的超时时间，单位为秒，支持浮点型；`0` 或负数表示不限时 | `-1`，永不超时 |

**返回值**：返回 `Swoole\Database\MysqliProxy` 对象，用法与 `mysqli` 一致；超时返回 `false`。

> [!NOTE]
> 与 [PDOPool](#pdopool) 一样，每次取出时代理会重置事务跟踪状态。

### put

归还 Mysqli 连接。

```php
public function put(mixed $connection): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$connection` | 要归还的 `MysqliProxy` 对象；传 `null` 表示连接已损坏，需要丢弃并新建补位 | 必填 |

事务清理和连接替换行为与 [PDOPool](#pdopool) 的 `put` 相同。

## PDOConfig

PDO 连接配置。所有 `with*` 方法都返回 `$this`，可以链式调用，用法见[使用示例](#使用示例)。每个配置项都有对应的 `get*` 读取方法（如 `getHost()`、`getPort()`），返回当前配置值。

### withDriver

设置 PDO 驱动名，不设置时为 `mysql`。

```php
public function withDriver(string $driver): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$driver` | PDO 驱动名，如 `mysql`、`pgsql`、`oci`、`sqlite` | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 驱动为 `sqlite` 时，[`withDbname`](#withdbname) 传数据库文件路径。不支持 `:memory:` 内存库和临时库，因为每个连接会连到各自独立的库，连接池失去意义。

### withHost

设置数据库服务器地址，不设置时为 `127.0.0.1`。

```php
public function withHost(string $host): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 服务器地址 | 必填 |

**返回值**：返回 `$this`。

### withPort

设置数据库服务器端口，不设置时为 `3306`。

```php
public function withPort(int $port): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$port` | 服务器端口 | 必填 |

**返回值**：返回 `$this`。

### withUnixSocket

设置 Unix Socket 路径，不设置时为 `null`。

```php
public function withUnixSocket(?string $unixSocket): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$unixSocket` | Unix Socket 文件路径，传 `null` 或空字符串表示不使用 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 设置了有效的 Unix Socket 路径后，DSN 中不再使用 host 和 port。

### withDbname

设置数据库名，不设置时为 `test`。

```php
public function withDbname(string $dbname): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$dbname` | 数据库名；驱动为 `sqlite` 时是数据库文件路径 | 必填 |

**返回值**：返回 `$this`。

### withCharset

设置连接字符集，不设置时为 `utf8mb4`。

```php
public function withCharset(string $charset): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$charset` | 字符集名称 | 必填 |

**返回值**：返回 `$this`。

### withUsername

设置登录用户名，不设置时为 `root`。

```php
public function withUsername(string $username): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$username` | 用户名 | 必填 |

**返回值**：返回 `$this`。

### withPassword

设置登录密码，不设置时为 `root`。

```php
public function withPassword(string $password): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$password` | 密码 | 必填 |

**返回值**：返回 `$this`。

### withOptions

设置传给 `PDO` 构造函数的驱动选项，不设置时为 `[]`。

```php
public function withOptions(array $options): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$options` | 以 `PDO::ATTR_*` 常量为键的选项数组，整体覆盖已有设置 | 必填 |

**返回值**：返回 `$this`。

### getAvailableDrivers

获取当前支持的驱动列表。

```php
public static function getAvailableDrivers(): array
```

**返回值**：返回驱动名数组，当前为 `['mysql']`。

## MysqliConfig

Mysqli 连接配置。所有 `with*` 方法都返回 `$this`，可以链式调用。每个配置项都有对应的 `get*` 读取方法，返回当前配置值。

### withHost

设置数据库服务器地址，不设置时为 `127.0.0.1`。

```php
public function withHost(string $host): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 服务器地址 | 必填 |

**返回值**：返回 `$this`。

### withPort

设置数据库服务器端口，不设置时为 `3306`。

```php
public function withPort(int $port): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$port` | 服务器端口 | 必填 |

**返回值**：返回 `$this`。

### withUnixSocket

设置 Unix Socket 路径，不设置时为 `null`。

```php
public function withUnixSocket(?string $unixSocket): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$unixSocket` | Unix Socket 文件路径，作为 `mysqli::real_connect()` 的最后一个参数传入 | 必填 |

**返回值**：返回 `$this`。

### withDbname

设置数据库名，不设置时为 `test`。

```php
public function withDbname(string $dbname): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$dbname` | 数据库名 | 必填 |

**返回值**：返回 `$this`。

### withCharset

设置连接字符集，不设置时为 `utf8mb4`。

```php
public function withCharset(string $charset): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$charset` | 字符集名称，连接成功后通过 `mysqli::set_charset()` 设置 | 必填 |

**返回值**：返回 `$this`。

### withUsername

设置登录用户名，不设置时为 `root`。

```php
public function withUsername(string $username): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$username` | 用户名 | 必填 |

**返回值**：返回 `$this`。

### withPassword

设置登录密码，不设置时为 `root`。

```php
public function withPassword(string $password): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$password` | 密码 | 必填 |

**返回值**：返回 `$this`。

### withOptions

设置连接选项，不设置时为 `[]`。

```php
public function withOptions(array $options): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$options` | 以 `MYSQLI_OPT_*` 常量为键的选项数组，整体覆盖已有设置 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 这些选项在 `real_connect()` **之前**通过 `mysqli::set_opt()` 逐个设置，因此只能放连接前可设的选项。

## 使用示例

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

## 注意事项

> [!WARNING]
> MySQL 断线重连可自动恢复大部分连接上下文（fetch 模式、已设置的 attribute、已编译的 Statement 等），但事务等上下文无法恢复。若处于事务中的连接断开，将会抛出异常，请自行评估重连的可靠性。