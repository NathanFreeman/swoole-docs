# 通道

`Swoole\Coroutine\Channel` 是一個用於協程間通信的高性能數據結構，可以直接把它理解成協程間專用的消息隊列。

- 通道與 `PHP` 的 `Array` 類似，僅佔用內存，沒有其他額外的資源申請，所有操作均爲內存操作，無 `IO` 消耗。
- 底層使用 `PHP` 引用計數實現，無內存拷貝。即使是傳遞巨大字符串或數組也不會產生額外性能消耗。
- 通道使用本地內存，不同的進程之間內存是隔離的。只能在同一進程的不同協程內進行 [`push`](#push) 和 [`pop`](#pop) 操作。

## 屬性

### capacity

當前通道容量。

```php
public int $capacity
```

### errCode

最近一次操作的錯誤碼。

```php
public int $errCode
```

| 錯誤碼 | 含義 |
|:---|:---|
| `SWOOLE_CHANNEL_OK` | 操作成功 |
| `SWOOLE_CHANNEL_TIMEOUT` | 操作超時 |
| `SWOOLE_CHANNEL_CLOSED` | 通道已關閉 |
| `SWOOLE_CHANNEL_CANCELED` | 被 [cancel](/zh-hant/coroutine/coroutine_api.html#cancel) 取消了當前操作 |

## 方法

### __construct

創建一個通道。

```php
public function __construct(int $capacity = 1)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$capacity` | 通道容量，必須爲大於或等於 `1` 的整數 | `1` |

> [!TIP]
> 當通道中的數據量等於 `$capacity` 時，通道已滿。下一個協程寫入數據會觸發協程切換，直到通道的數據被消費了才能繼續寫入。

### push

向通道中寫入數據。

```php
public function push(mixed $data, float $timeout = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$data` | 寫入的數據，可以是任意類型的 PHP 變量，包括匿名函數和資源 | 必填 |
| `$timeout` | 超時時間，單位爲秒，支持浮點型（`1.5` 表示 `1s` + `500ms`） | `-1`，永不超時 |

**返回值**：執行成功返回 `true`；通道被關閉時執行失敗返回 `false`，可使用 [`$channel->errCode`](#errcode) 得到錯誤碼。

> [!NOTE]
> 爲避免產生歧義，請勿向通道中寫入 `null` 和 `false`。

> [!TIP]
> 在通道已滿的情況下，`push` 會掛起當前協程。在約定的時間內，如果沒有任何消費者消費數據就會發生超時，底層會恢復當前協程，`push` 調用立即返回 `false`，寫入失敗。

### pop

從通道中讀取數據。

```php
public function pop(float $timeout = -1): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 超時時間，單位爲秒，支持浮點型（`1.5` 表示 `1s` + `500ms`） | `-1`，永不超時 |

**返回值**：可以是任意類型的 PHP 變量，包括匿名函數和資源；通道被關閉時執行失敗返回 `false`。

> [!TIP]
> 在通道爲空的情況下，`pop` 會掛起當前協程。在約定的時間內，如果沒有任何生產者生產數據就會發生超時，底層會恢復當前協程，`pop` 調用立即返回 `false`，讀取失敗。

### stats

獲取通道的狀態。

```php
public function stats(): array
```

**返回值**：返回一個數組，緩衝通道包含以下幾項信息。

| key | 含義 |
|:---|:---|
| `consumer_num` | 等待消費（`pop`）的協程數量 |
| `producer_num` | 等待生產（`push`）的協程數量 |
| `queue_num` | 通道中的數據數量 |

### close

關閉通道，並喚醒所有等待讀寫通道的協程。

```php
public function close(): bool
```

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

> [!TIP]
> 關閉後會喚醒所有生產者協程，`push` 方法返回 `false`；同時喚醒所有消費者協程，`pop` 方法返回 `false`。

### length

獲取通道中的待消費數據數量。

```php
public function length(): int
```

**返回值**：通道中的待消費數據數量。

### isEmpty

判斷當前通道是否爲空。

```php
public function isEmpty(): bool
```

**返回值**：通道爲空返回 `true`，否則返回 `false`。

### isFull

判斷當前通道是否已滿。

```php
public function isFull(): bool
```

**返回值**：通道已滿返回 `true`，否則返回 `false`。

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

在異步服務器中使用 `Channel` 時，必須在 [start](/zh-hant/server/methods.html#start) 方法執行之前創建好 `Channel` 對象，並通過 `use` 語法引用該對象。

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
