# 併發容器

`Swoole\Thread` 提供了 3 種安全的併發容器：[`Thread\ArrayList`](#arraylist)、[`Thread\Map`](#map)、[`Thread\Queue`](#queue)。可作爲線程參數傳遞給子線程，讀寫時在其他線程是可見的。

> [!NOTE]
> 需要 `Swoole` 版本 >= `v6.0`，且已開啓多線程支持，詳見[創建線程](/zh-hant/thread/create.html#使用條件)。

## 特性

- `Map`、`ArrayList`、`Queue` 會自動分配內存，不需要像 [Table](/zh-hant/table.html) 那樣固定分配。

- 底層會自動加鎖，是線程安全的。

- 必須在線程創建前將 `Map`、`ArrayList`、`Queue` 對象作爲線程參數傳遞給子線程。

- 可傳遞的變量類型參考[數據類型](/zh-hant/thread/create.html#數據類型)。

- 均不支持迭代器：`ArrayList` 可使用 `toArray()` 來代替，`Map` 可使用 `keys()`、`values()`、`toArray()` 來代替，`Queue` 底層使用了 `C++ std::queue`，僅支持先進先出操作。

- `Thread\ArrayList` 和 `Thread\Map` 實現了 `ArrayAccess` 和 `Countable` 接口，可以直接作爲數組操作。

## ArrayList

併發的 `ArrayList` 結構，僅支持數字索引下標操作，非數字將進行一次強制轉換操作。

- 增加或修改：`$list[$index] = $value`
- 刪除：`unset($list[$index])`
- 讀取：`$value = $list[$index]`
- 獲取長度：`count($list)`

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\ArrayList;

$args = Thread::getArguments();

if (empty($args)) {
    // 主線程：容器必須在創建線程前作爲參數傳入
    $list = new ArrayList();
    $thread = new Thread(__FILE__, $list);

    sleep(1);
    $list[] = uniqid();
    $thread->join();
} else {
    // 子線程
    $list = $args[0];
    sleep(2);
    // 主線程 1 秒後寫入的元素，在子線程中可見
    var_dump($list[0]);
}
```

> [!WARNING]
> 刪除操作會引起 `ArrayList` 批量前移操作，例如 `ArrayList` 有 `1000` 個元素，當 `unset($list[4])` 時，將需要 `$list[5:999]` 進行批量遷移操作，填補刪除 `$list[4]` 產生的空位。但不會深度複製元素，僅移動其指針。
>
> 若 `ArrayList` 較大時，刪除靠前的元素，可能會消耗較多的 `CPU` 資源。

### __construct

安全併發容器 `ArrayList` 構造函數。

```php
public function __construct(?array $values = null)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$values` | 遍歷數組將數組中的值添加到 `ArrayList` 中。只接受 `list` 類型的數組，不接受關聯數組，否則將拋出異常 | `null` |

> [!TIP]
> 關聯數組需使用 `array_values()` 轉換爲 `list` 類型的數組。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b', 'c']);

// 關聯數組須先轉換爲 list 類型
$assoc = new ArrayList(array_values(['k1' => 1, 'k2' => 2]));

var_dump($list->count(), $assoc->count());
```

### incr

使 `ArrayList` 中的數據安全地自增，支持浮點型或整型，若對其他類型進行自增操作，將會自動轉爲整型，初始化爲 `0`，再進行自增操作。

```php
public function incr(int $index, mixed $value = 1): int|float
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$index` | 索引數字，必須是有效的索引地址，否則會拋出異常 | 必填 |
| `$value` | 需要自增的值 | `1` |

**返回值**：返回自增後的值。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([10, 'x']);

var_dump($list->incr(0, 5));
// 非數值元素自動轉爲整型 0，再自增 1
var_dump($list->incr(1));
```

### decr

使 `ArrayList` 中的數據安全地自減，支持浮點型或整型，若對其他類型進行自減操作，將會自動轉爲整型，初始化爲 `0`，再進行自減操作。

```php
public function decr(int $index, mixed $value = 1): int|float
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$index` | 索引數字，必須是有效的索引地址，否則會拋出異常 | 必填 |
| `$value` | 需要自減的值 | `1` |

**返回值**：返回自減後的值。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([10, 'x']);

var_dump($list->decr(0, 5));
// 非數值元素自動轉爲整型 0，再自減 1
var_dump($list->decr(1));
```

### count

獲取 `ArrayList` 元素數量。

```php
public function count(): int
```

**返回值**：返回 `ArrayList` 中的元素數量。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);

var_dump($list->count());
// 實現了 Countable 接口，也可以直接使用 count()
var_dump(count($list));
```

### toArray

將 `ArrayList` 轉換爲數組。

```php
public function toArray(): array
```

**返回值**：返回 `ArrayList` 中的所有元素。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);

// 不支持迭代器，遍歷前先轉換爲數組
foreach ($list->toArray() as $index => $value) {
    echo "{$index}: {$value}\n";
}
```

### clean

清空所有元素。

```php
public function clean(): void
```

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);
$list->clean();

var_dump($list->count());
```

### sort

對容器內的元素進行排序。與 `PHP` 的 `sort()` 函數的行爲是一致的。

```php
public function sort(): void
```

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([3, 1, 2]);
$list->sort();

var_dump($list->toArray());
```

### find

查找第一個與給定值相等的元素，返回其整數下標。

```php
public function find(mixed $value): int|null
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$value` | 要查找的值 | 必填 |

**返回值**：命中返回第一個匹配元素的整數下標，找不到返回 `null`。

> [!NOTE]
> Swoole 版本 >= `v6.0.0` 可用。比較是嚴格的：類型必須相同，整數、浮點數、字符串按值相等，`bool`/`null` 僅匹配同值，數組和對象一律不匹配。查找期間持有讀鎖，線程安全。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b', 'c']);
var_dump($list->find('b')); // int(1)
var_dump($list->find('z')); // NULL
```

## Map

併發的 `Map` 結構，實現了 `ArrayAccess` 和 `Countable` 接口。

- 增加或修改：`$map[$key] = $value`
- 刪除：`unset($map[$key])`
- 讀取：`$value = $map[$key]`
- 獲取長度：`count($map)`

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Map;

$args = Thread::getArguments();

if (empty($args)) {
    // 主線程：容器必須在創建線程前作爲參數傳入
    $map = new Map();
    $thread = new Thread(__FILE__, $map);

    sleep(1);
    $map['test'] = uniqid();
    $thread->join();
} else {
    // 子線程
    $map = $args[0];
    sleep(2);
    // 主線程 1 秒後寫入的元素，在子線程中可見
    var_dump($map['test']);
}
```

### __construct

安全併發容器 `Map` 構造函數。

```php
public function __construct(?array $values = null)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$values` | 遍歷數組將鍵值對添加到 `Map` 中，保留原有的 `key`。多維數組會遞歸轉爲嵌套的 `Map` 或 `ArrayList`，詳見[數組](/zh-hant/thread/create.html#數組) | `null` |

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map(['a' => 1, 'b' => 2]);

var_dump($map->count());
```

### add

向 `Map` 中寫入數據。

```php
public function add(mixed $key, mixed $value): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 需要添加的 `key` | 必填 |
| `$value` | 需要添加的值 | 必填 |

**返回值**：如果 `$key` 已存在，返回 `false`，否則返回 `true` 表示添加成功。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

var_dump($map->add('test', 1));
// key 已存在，添加失敗
var_dump($map->add('test', 2));
```

### update

更新 `Map` 中的數據。

```php
public function update(mixed $key, mixed $value): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 需要修改的 `key` | 必填 |
| `$value` | 需要修改的值 | 必填 |

**返回值**：如果 `$key` 不存在，返回 `false`，否則返回 `true` 表示更新成功。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map->add('test', 1);

var_dump($map->update('test', 2));
// key 不存在，更新失敗
var_dump($map->update('none', 3));
```

### incr

使 `Map` 中的數據安全地自增，支持浮點型或整型，若對其他類型進行自增操作，將會自動轉爲整型，初始化爲 `0`，再進行自增操作。

```php
public function incr(mixed $key, mixed $value = 1): int|float
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 需要自增的 `key`，如果不存在則自動創建，並初始化爲 `0` | 必填 |
| `$value` | 需要自增的值 | `1` |

**返回值**：返回自增後的值。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

// key 不存在時自動創建並初始化爲 0
var_dump($map->incr('count'));
var_dump($map->incr('count', 1.5));
```

### decr

使 `Map` 中的數據安全地自減，支持浮點型或整型，若對其他類型進行自減操作，將會自動轉爲整型，初始化爲 `0`，再進行自減操作。

```php
public function decr(mixed $key, mixed $value = 1): int|float
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 需要自減的 `key`，如果不存在則自動創建，並初始化爲 `0` | 必填 |
| `$value` | 需要自減的值 | `1` |

**返回值**：返回自減後的值。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

// key 不存在時自動創建並初始化爲 0
var_dump($map->decr('count'));
var_dump($map->decr('count', 1.5));
```

### count

獲取元素數量。

```php
public function count(): int
```

**返回值**：返回 `Map` 中的元素數量。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->count());
// 實現了 Countable 接口，也可以直接使用 count()
var_dump(count($map));
```

### keys

返回所有 `key`。

```php
public function keys(): array
```

**返回值**：返回 `Map` 所有的 `key`。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->keys());
```

### values

返回所有 `value`。

```php
public function values(): array
```

**返回值**：返回 `Map` 所有的 `value`。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->values());
```

### toArray

將 `Map` 轉換爲數組。

```php
public function toArray(): array
```

**返回值**：返回 `Map` 中的所有元素。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;

// 不支持迭代器，遍歷前先轉換爲數組
foreach ($map->toArray() as $key => $value) {
    echo "{$key}: {$value}\n";
}
```

### clean

清空所有元素。

```php
public function clean(): void
```

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map->clean();

var_dump($map->count());
```

### sort

對容器內的元素進行排序。底層會保存 `key` 與 `value` 的映射關係，僅對 `value` 進行排序。與 `PHP` 的 `asort()` 函數的行爲是一致的。

```php
public function sort(): void
```

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['b'] = 2;
$map['a'] = 1;

// 按 value 升序排序，key 與 value 的映射關係保持不變
$map->sort();

var_dump($map->keys(), $map->values());
```

### find

查找第一個與給定值相等的元素，返回其鍵名。

```php
public function find(mixed $value): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$value` | 要查找的值 | 必填 |

**返回值**：命中返回第一個匹配元素的鍵（字符串鍵或整數索引），找不到返回 `null`。

> [!NOTE]
> Swoole 版本 >= `v6.0.0` 可用。比較規則與 [ArrayList::find](#find) 相同：類型必須相同，整數、浮點數、字符串按值相等，數組和對象一律不匹配。查找期間持有讀鎖，線程安全。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;
var_dump($map->find(2)); // string(1) "b"
var_dump($map->find(3)); // NULL
```

## Queue

併發的 `Queue` 結構，是一個先進先出的數據結構，只能壓入、彈出元素，不能隨機訪問元素。

`Thread\Queue` 內置了線程條件變量，可在 `push`/`pop` 操作中喚醒、等待其他線程。

**常量**

| 常量 | 說明 |
|:---|:---|
| `Queue::NOTIFY_ONE` | 喚醒一個線程 |
| `Queue::NOTIFY_ALL` | 喚醒所有線程 |

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Queue;

$args = Thread::getArguments();
$c = 4;
$n = 128;

if (empty($args)) {
    // 主線程：4 個消費者線程，128 條任務
    $threads = [];
    $queue = new Queue();
    for ($i = 0; $i < $c; $i++) {
        $threads[] = new Thread(__FILE__, $i, $queue);
    }

    while ($n--) {
        $queue->push(base64_encode(random_bytes(16)), Queue::NOTIFY_ONE);
        usleep(random_int(10000, 100000));
    }

    // 爲每個消費者線程壓入一條空數據，作爲退出信號
    $n = $c;
    while ($n--) {
        $queue->push('', Queue::NOTIFY_ONE);
    }

    for ($i = 0; $i < $c; $i++) {
        $threads[$i]->join();
    }
    var_dump($queue->count());
} else {
    // 子線程：阻塞讀取，直到取到退出信號
    $queue = $args[1];
    while (1) {
        $job = $queue->pop(-1);
        if (!$job) {
            break;
        }
        var_dump($job);
    }
}
```

### __construct

安全併發容器 `Queue` 構造函數。

```php
public function __construct()
```

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();

$queue->push('job-1');
var_dump($queue->count());
```

### push

向隊列尾部中寫入數據。

```php
public function push(mixed $value, int $notify = 0): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$value` | 寫入的數據內容 | 必填 |
| `$notify` | 是否通知等待讀取數據的線程。`Queue::NOTIFY_ONE` 喚醒一個線程，`Queue::NOTIFY_ALL` 喚醒所有線程 | `0`，不會喚醒任何線程 |

> [!WARNING]
> 爲避免產生歧義，請勿向隊列中寫入 `null` 和 `false`。

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();

// 默認不喚醒任何等待的線程
$queue->push('job-1');
// 寫入後喚醒一個正在 pop() 上等待的線程
$queue->push('job-2', Queue::NOTIFY_ONE);
// 寫入後喚醒所有正在 pop() 上等待的線程
$queue->push('job-3', Queue::NOTIFY_ALL);
```

### pop

從隊列頭部中提取數據。

```php
public function pop(float $timeout = 0): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 超時時間。不爲 `0` 時，表示當隊列爲空時在 `$timeout` 秒內等待生產者 `push()` 數據，爲負數時表示永不超時 | `0`，表示不等待 |

**返回值**：返回隊列頭部數據。`$timeout` 爲 `0` 時，隊列爲空立即返回 `null`；大於 `0` 時，等待超時後返回 `null`。

> [!NOTE]
> 使用 `Queue::NOTIFY_ALL` 喚醒所有線程時，只有一個線程可以獲得 `push()` 操作寫入的數據。

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');

// 先進先出，取出隊頭元素
var_dump($queue->pop());
// 隊列爲空且不等待，直接返回 null
var_dump($queue->pop());
// 隊列爲空時最多等待 1 秒；傳入負數表示永不超時
var_dump($queue->pop(1));
```

### count

獲取隊列元素數量。

```php
public function count(): int
```

**返回值**：返回隊列數量。

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');
$queue->push('job-2');

var_dump($queue->count());
```

### clean

清空所有元素。

```php
public function clean(): void
```

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');
$queue->clean();

var_dump($queue->count());
```
