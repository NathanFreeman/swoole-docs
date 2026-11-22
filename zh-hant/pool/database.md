# 數據庫連接池

`Swoole\Database` 命名空間提供了數據庫連接池和對象代理的高級封裝，支持自動斷線重連。每種數據庫由配置類、代理類、連接池類三部分組成：

| 數據庫 | 配置類 | 代理類 | 連接池類 |
|:---|:---|:---|:---|
| PDO | [`PDOConfig`](#pdoconfig) | `PDOProxy` | [`PDOPool`](#pdopool) |
| Mysqli | [`MysqliConfig`](#mysqliconfig) | `MysqliProxy` | [`MysqliPool`](#mysqlipool) |
| Redis | [`RedisConfig`](/zh-hant/pool/redis.html#redisconfig) | 無 | [`RedisPool`](/zh-hant/pool/redis.html#redispool) |

三個連接池類都繼承自 [`ConnectionPool`](/zh-hant/pool/common.html#connectionpool)，因此 `withConnection`、`fill`、`close` 可以直接使用，行爲與通用連接池一致。

> [!TIP]
> [Simps 框架](https://simps.io) 的 [DB 組件](https://github.com/simple-swoole/db) 基於 Database 封裝，實現了自動歸還連接、事務等功能，可以參考或直接使用，詳見 [Simps 文檔](https://simps.io/#/zh-cn/database/mysql)。

## PDOPool

### __construct

創建 PDO 連接池。

```php
public function __construct(Swoole\Database\PDOConfig $config, int $size = self::DEFAULT_SIZE)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$config` | PDO 配置對象，見 [PDOConfig](#pdoconfig) | 必填 |
| `$size` | 連接池容量 | `64` |

構造時會把 `PDOProxy` 設爲代理類，因此池中存放的是 `PDO` 的代理對象而不是 `PDO` 本身。

### get

從連接池中獲取一個 PDO 連接。

```php
public function get(float $timeout = -1)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 等待連接的超時時間，單位爲秒，支持浮點型；`0` 或負數表示不限時 | `-1`，永不超時 |

**返回值**：返回 `Swoole\Database\PDOProxy` 對象，用法與 `PDO` 一致；超時返回 `false`。

> [!NOTE]
> 每次取出時代理會重置自身的事務跟蹤狀態，避免上一次借用遺留的標記影響本次的斷線重連判斷。

### put

歸還 PDO 連接。

```php
public function put(mixed $connection): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$connection` | 要歸還的 `PDOProxy` 對象；傳 `null` 表示連接已損壞，需要丟棄並新建補位 | 必填 |

歸還時會先回滾連接上未結束的事務，避免下一個借用者從第一條語句起就處在一個自己沒開啓的事務裏；MySQL 和 Oracle 還會把 autocommit 恢復爲配置中的值（默認開啓）。

清理失敗的連接會被丟棄並新建補位；若新連接也建不出來，則留給下一次 `get` 去創建並報告失敗。

> [!NOTE]
> 這裏的事務以驅動報告的爲準。`pdo_mysql` 和 `pdo_pgsql` 能識別手工開啓的事務（如 `exec('BEGIN')`），`pdo_sqlite` 在 PHP 8.4 起或使用 Swoole 協程 SQLite 時也能識別；其他驅動只識別 `beginTransaction()` 開啓的事務。

## MysqliPool

### __construct

創建 Mysqli 連接池。

```php
public function __construct(Swoole\Database\MysqliConfig $config, int $size = self::DEFAULT_SIZE)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$config` | Mysqli 配置對象，見 [MysqliConfig](#mysqliconfig) | 必填 |
| `$size` | 連接池容量 | `64` |

構造時會把 `MysqliProxy` 設爲代理類。連接失敗時拋出 `Swoole\Database\MysqliException`。

### get

從連接池中獲取一個 Mysqli 連接。

```php
public function get(float $timeout = -1)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 等待連接的超時時間，單位爲秒，支持浮點型；`0` 或負數表示不限時 | `-1`，永不超時 |

**返回值**：返回 `Swoole\Database\MysqliProxy` 對象，用法與 `mysqli` 一致；超時返回 `false`。

> [!NOTE]
> 與 [PDOPool](#pdopool) 一樣，每次取出時代理會重置事務跟蹤狀態。

### put

歸還 Mysqli 連接。

```php
public function put(mixed $connection): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$connection` | 要歸還的 `MysqliProxy` 對象；傳 `null` 表示連接已損壞，需要丟棄並新建補位 | 必填 |

事務清理和連接替換行爲與 [PDOPool](#pdopool) 的 `put` 相同。

## PDOConfig

PDO 連接配置。所有 `with*` 方法都返回 `$this`，可以鏈式調用，用法見[使用示例](#使用示例)。每個配置項都有對應的 `get*` 讀取方法（如 `getHost()`、`getPort()`），返回當前配置值。

### withDriver

設置 PDO 驅動名，不設置時爲 `mysql`。

```php
public function withDriver(string $driver): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$driver` | PDO 驅動名，如 `mysql`、`pgsql`、`oci`、`sqlite` | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 驅動爲 `sqlite` 時，[`withDbname`](#withdbname) 傳數據庫文件路徑。不支持 `:memory:` 內存庫和臨時庫，因爲每個連接會連到各自獨立的庫，連接池失去意義。

### withHost

設置數據庫服務器地址，不設置時爲 `127.0.0.1`。

```php
public function withHost(string $host): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 服務器地址 | 必填 |

**返回值**：返回 `$this`。

### withPort

設置數據庫服務器端口，不設置時爲 `3306`。

```php
public function withPort(int $port): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$port` | 服務器端口 | 必填 |

**返回值**：返回 `$this`。

### withUnixSocket

設置 Unix Socket 路徑，不設置時爲 `null`。

```php
public function withUnixSocket(?string $unixSocket): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$unixSocket` | Unix Socket 文件路徑，傳 `null` 或空字符串表示不使用 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 設置了有效的 Unix Socket 路徑後，DSN 中不再使用 host 和 port。

### withDbname

設置數據庫名，不設置時爲 `test`。

```php
public function withDbname(string $dbname): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$dbname` | 數據庫名；驅動爲 `sqlite` 時是數據庫文件路徑 | 必填 |

**返回值**：返回 `$this`。

### withCharset

設置連接字符集，不設置時爲 `utf8mb4`。

```php
public function withCharset(string $charset): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$charset` | 字符集名稱 | 必填 |

**返回值**：返回 `$this`。

### withUsername

設置登錄用戶名，不設置時爲 `root`。

```php
public function withUsername(string $username): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$username` | 用戶名 | 必填 |

**返回值**：返回 `$this`。

### withPassword

設置登錄密碼，不設置時爲 `root`。

```php
public function withPassword(string $password): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$password` | 密碼 | 必填 |

**返回值**：返回 `$this`。

### withOptions

設置傳給 `PDO` 構造函數的驅動選項，不設置時爲 `[]`。

```php
public function withOptions(array $options): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$options` | 以 `PDO::ATTR_*` 常量爲鍵的選項數組，整體覆蓋已有設置 | 必填 |

**返回值**：返回 `$this`。

### getAvailableDrivers

獲取當前支持的驅動列表。

```php
public static function getAvailableDrivers(): array
```

**返回值**：返回驅動名數組，當前爲 `['mysql']`。

## MysqliConfig

Mysqli 連接配置。所有 `with*` 方法都返回 `$this`，可以鏈式調用。每個配置項都有對應的 `get*` 讀取方法，返回當前配置值。

### withHost

設置數據庫服務器地址，不設置時爲 `127.0.0.1`。

```php
public function withHost(string $host): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 服務器地址 | 必填 |

**返回值**：返回 `$this`。

### withPort

設置數據庫服務器端口，不設置時爲 `3306`。

```php
public function withPort(int $port): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$port` | 服務器端口 | 必填 |

**返回值**：返回 `$this`。

### withUnixSocket

設置 Unix Socket 路徑，不設置時爲 `null`。

```php
public function withUnixSocket(?string $unixSocket): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$unixSocket` | Unix Socket 文件路徑，作爲 `mysqli::real_connect()` 的最後一個參數傳入 | 必填 |

**返回值**：返回 `$this`。

### withDbname

設置數據庫名，不設置時爲 `test`。

```php
public function withDbname(string $dbname): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$dbname` | 數據庫名 | 必填 |

**返回值**：返回 `$this`。

### withCharset

設置連接字符集，不設置時爲 `utf8mb4`。

```php
public function withCharset(string $charset): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$charset` | 字符集名稱，連接成功後通過 `mysqli::set_charset()` 設置 | 必填 |

**返回值**：返回 `$this`。

### withUsername

設置登錄用戶名，不設置時爲 `root`。

```php
public function withUsername(string $username): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$username` | 用戶名 | 必填 |

**返回值**：返回 `$this`。

### withPassword

設置登錄密碼，不設置時爲 `root`。

```php
public function withPassword(string $password): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$password` | 密碼 | 必填 |

**返回值**：返回 `$this`。

### withOptions

設置連接選項，不設置時爲 `[]`。

```php
public function withOptions(array $options): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$options` | 以 `MYSQLI_OPT_*` 常量爲鍵的選項數組，整體覆蓋已有設置 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 這些選項在 `real_connect()` **之前**通過 `mysqli::set_opt()` 逐個設置，因此只能放連接前可設的選項。

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

## 注意事項

> [!WARNING]
> MySQL 斷線重連可自動恢復大部分連接上下文（fetch 模式、已設置的 attribute、已編譯的 Statement 等），但事務等上下文無法恢復。若處於事務中的連接斷開，將會拋出異常，請自行評估重連的可靠性。