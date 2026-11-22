# Redis 連接池

`Swoole\Database\RedisPool` 在通用連接池之上封裝了 Redis 連接池，繼承自 [`ConnectionPool`](/zh-hant/pool/common.html#connectionpool)，因此 `withConnection`、`fill`、`close` 可以直接使用，行爲與通用連接池一致。

## RedisPool

### __construct

創建 Redis 連接池。

```php
public function __construct(Swoole\Database\RedisConfig $config, int $size = self::DEFAULT_SIZE)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$config` | Redis 配置對象，見 [RedisConfig](#redisconfig) | 必填 |
| `$size` | 連接池容量 | `64` |

構造時不使用代理類，池中存放的就是原生 `Redis` 對象。連接建立後依次執行認證、選擇數據庫、設置 Redis 選項。

### get

從連接池中獲取一個 Redis 連接。

```php
public function get(float $timeout = -1)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 等待連接的超時時間，單位爲秒，支持浮點型；`0` 或負數表示不限時 | `-1`，永不超時 |

**返回值**：返回原生的 `Redis` 對象，沒有代理層；超時返回 `false`。

### put

歸還 Redis 連接。

```php
public function put(mixed $connection): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$connection` | 要歸還的 `Redis` 對象；傳 `null` 表示連接已損壞，需要丟棄並新建補位 | 必填 |

歸還時會把處於 MULTI 或 pipeline 模式的連接恢復爲普通模式，避免下一個借用者的命令被排隊而不是執行（例如一個從未 `exec()` 的事務）。無法恢復的連接會被丟棄並新建補位。

> [!WARNING]
> 連接自身不上報的狀態不會被重置：未用 `EXEC` / `DISCARD` / `UNWATCH` 結束的 `WATCH`，以及用 `select()` 切換過的數據庫，都會留給下一個借用者。

## RedisConfig

Redis 連接配置。所有 `with*` 方法都返回 `$this`，可以鏈式調用。每個配置項都有對應的 `get*` 讀取方法，返回當前配置值。

### withHost

設置 Redis 服務器地址，不設置時爲 `127.0.0.1`。

```php
public function withHost(string $host): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 服務器地址 | 必填 |

**返回值**：返回 `$this`。

### withPort

設置 Redis 服務器端口，不設置時爲 `6379`。

```php
public function withPort(int $port): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$port` | 服務器端口 | 必填 |

**返回值**：返回 `$this`。

### withTimeout

設置連接超時時間，不設置時爲 `0.0`。

```php
public function withTimeout(float $timeout): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 連接超時時間，單位爲秒，`0.0` 表示不超時 | 必填 |

**返回值**：返回 `$this`。

### withReadTimeout

設置讀取超時時間，不設置時爲 `0.0`。

```php
public function withReadTimeout(float $read_timeout): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$read_timeout` | 讀取超時時間，單位爲秒，`0.0` 表示不超時 | 必填 |

**返回值**：返回 `$this`。

### withRetryInterval

設置連接重試間隔，不設置時爲 `0`。

```php
public function withRetryInterval(int $retry_interval): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$retry_interval` | 重試間隔，單位爲毫秒 | 必填 |

**返回值**：返回 `$this`。

### withReserved

設置 phpredis `connect()` 的保留參數，不設置時爲 `''`。

```php
public function withReserved(string $reserved): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$reserved` | 保留參數 | 必填 |

**返回值**：返回 `$this`。

> [!WARNING]
> 當前版本建立連接時不會把這個值傳給 phpredis（`persistent_id` 固定爲 `null`，因爲池化連接不應是持久連接），設置它沒有實際效果。

### withAuth

設置認證密碼，不設置時爲 `''`。

```php
public function withAuth(string|array $auth): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$auth` | 密碼字符串，或 `[用戶名, 密碼]` 形式的數組 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 值爲空時不執行認證。

### withDbIndex

設置數據庫編號，不設置時爲 `0`。

```php
public function withDbIndex(int $dbIndex): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$dbIndex` | 數據庫編號 | 必填 |

**返回值**：返回 `$this`。

> [!NOTE]
> 編號爲 `0` 時不執行 `select()`。

### withOption

設置單個 Redis 選項。

```php
public function withOption(int $option, mixed $value): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$option` | 選項常量，如 `Redis::OPT_SERIALIZER` | 必填 |
| `$value` | 選項值 | 必填 |

**返回值**：返回 `$this`。

> [!TIP]
> 可多次調用來累加選項，每次隻影響傳入的那一個鍵。

### setOptions

整體設置 Redis 選項。

```php
public function setOptions(array $options): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$options` | 以選項常量爲鍵的數組，**整體覆蓋**此前通過 `withOption` 設置的全部選項 | 必填 |

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