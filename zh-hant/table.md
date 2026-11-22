# 高性能共享內存

- 由於在多進程模式下存在進程內存隔離，在進程內修改 `global` 全局變量和超全局變量時，是無法映射到其他進程的。
- 因此 `Swoole` 提供了高性能共享內存 `Swoole\Table`，`Swoole\Table` 是一個基於共享內存和鎖實現的超高性能，併發數據結構。用於解決多進程數據共享和同步加鎖問題。它的內存容量不受 `PHP` 的 `memory_limit` 控制。

## 屬性

### size

`Swoole\Table` 實例在創建時設置的最大行數（即 `table` 的容量上限）。

```php
public int $size
```

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();

echo $table->size; // 輸出1024
```

### memorySize

獲取實際佔用內存的尺寸，單位爲字節。

```php
public int $memorySize
```

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();

echo $table->memorySize;
```

## 方法

### __construct

`Swoole\Table` 的構造函數，用於創建內存表對象。

```php
public function __construct(int $table_size, float $conflict_proportion = 0.2)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$size` | 指定表格的最大行數，如果 `$size` 不是爲 `2` 的 `N` 次方，如 `1000`、`5000`、`60000` 等，底層會自動調整爲接近的一個數字，如果小於 `1024` 則默認成 `1024`，即 `1024` 是最小值。從 `v4.4.6` 版本開始最小值爲 `64`。 | 必填 |
| `$conflictProportion` | 哈希衝突的最大比例。其它值：最小爲 `0.2`，最大爲 `1` | `0.2`（即 `20%`） |

**容量計算**

- 如果 `$size` 不是爲 `2` 的 `N` 次方，如 `1000`、`5000`、`60000` 等，底層會自動調整爲接近的一個數字，如果小於 `1024` 則默認成 `1024`，即 `1024` 是最小值。從 `v4.4.6` 版本開始最小值爲 `64`。
- `Table` 佔用的內存總數爲 (`HashTable結構體長度` + `KEY長度64字節` + `$size值`) * (`1 + $conflict_proportion值作爲hash衝突`) * (`列尺寸`)。
- 如果你的數據 `Key` 和 Hash 衝突率超過 `20%`，預留的衝突內存塊容量不足，`set` 新的數據就會報 `Unable to allocate memory` 錯誤，並返回 `false`，存儲失敗，此時需要調大 `$size` 值並重啓服務。
- 在內存足夠的情況下儘量將此值設置的大一些。

> [!IMPORTANT]
> 由於 `Swoole\Table` 底層是建立在共享內存之上，所以無法動態擴容。所以 `$size` 必須在創建前自己計算設置好，`Swoole\Table` 能存儲的最大行數與 `$size` 正相關，但不完全一致，如 `$size` 爲 `1024` 實際可存儲的行數**小於** `1024`，如果 `$size` 過大，機器內存不足 `Swoole\Table` 會創建失敗。

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### column

向內存表追加一列（數據列）。

```php
public function column(string $name, int $type, int $size = 0): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 指定字段的名稱 | 必填 |
| `$type` | 指定字段類型。其它值：`Swoole\Table::TYPE_INT`、`Swoole\Table::TYPE_FLOAT`、`Swoole\Table::TYPE_STRING` | 必填 |
| `$size` | 指定字符串字段的最大長度【`Swoole\Table::TYPE_STRING` 類型的字段必須指定 `$size`】。值單位：字節 | `0` |

**返回值**：`true` 表示操作成功，`false` 表示操作失敗。

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('key', Swoole\Table::TYPE_STRING, 128);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### create

定義內存表的結構後，執行 `create` 方法向操作系統申請內存並創建表。

```php
public function create(): bool
```

**返回值**：`true` 表示操作成功，系統內存不足，申請失敗返回 `false`。

> [!TIP]
> - 調用 `create` 方法之前不能使用 `set`、`get` 等數據讀寫操作方法。
> - 調用 `create` 方法之後不能使用 `column` 方法添加新字段。

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('key', Swoole\Table::TYPE_STRING, 128);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### set

往內存表添加一行新數據。

```php
public function set(string $key, array $value): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，非 `二進制` 安全，必須爲 `字符串` 類型，不得傳入 `二進制` 數據。 | 必填 |
| `$value` | 數據的 `value` | 必填 |

**返回值**：`true` 表示操作成功，`false` 表示操作失敗。

> [!TIP]
> - 可以設置全部字段的值，也可以只設置部分字段。
> - 如果 `$value` 中的傳入字符串長度超過了列定義時設定的最大尺寸，底層爲了內存對齊，會按照 8 的整數倍自動截斷數據。

> [!IMPORTANT]
> 相同的 `$key` 對應同一行數據，如果 `set` 同一個 `key`，會覆蓋上一次的數據，`key` 最大長度不得超過 63 個字節。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

// $value數組的鍵名必須與column定義的列名完全一致
$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
```

### add

插入一行新數據，僅當 `key` 不存在時寫入，`key` 已存在時不做任何修改。

```php
public function add(string $key, array $values): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據，最大長度不得超過 63 個字節。 | 必填 |
| `$values` | 數據的 `value`，鍵名爲 `column` 定義的列名 | 必填 |

**返回值**：插入成功返回 `true`；`key` 已存在或內存不足時返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!TIP]
> - 可以只傳入部分列，未指定的列使用默認值（`int`/`float` 爲 `0`，`string` 爲空字符串）；也可以傳入空數組，僅創建一行默認值數據。
> - 與 [`set`](#set) 的區別：`set` 在 `key` 存在時會覆蓋原有數據，`add` 則直接返回 `false`，不會覆蓋。
> - 操作是原子的，多個進程/線程併發 `add` 同一個 `key` 時只有一個會成功。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

var_dump($table->add('zzz', ['name' => '張三', 'age' => 20])); // true
var_dump($table->add('zzz', ['name' => '李四', 'age' => 30])); // false，key 已存在，數據不會被覆蓋
```

### update

更新已存在的數據，僅當 `key` 存在時寫入，`key` 不存在時不做任何修改。

```php
public function update(string $key, array $values): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據，最大長度不得超過 63 個字節。 | 必填 |
| `$values` | 要更新的列和值，鍵名爲 `column` 定義的列名 | 必填 |

**返回值**：更新成功返回 `true`；`key` 不存在時返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!TIP]
> - 可以只更新部分列，未指定的列保持原值不變。
> - 與 [`set`](#set) 的區別：`set` 在 `key` 不存在時會創建新行，`update` 則直接返回 `false`，不會創建。
> - 操作是原子的。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20]);
var_dump($table->update('zzz', ['age' => 21])); // true，僅更新 age 列，name 保持不變
var_dump($table->update('not_exists', ['age' => 21])); // false，key 不存在
```

### cmpset

比較並設置（Compare-And-Set）：僅當 `key` 存在，且 `$expected` 中指定的所有列的值與當前數據完全一致時，才寫入 `$values`。

```php
public function cmpset(string $key, array $expected, array $values): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據，最大長度不得超過 63 個字節。 | 必填 |
| `$expected` | 期望值數組，鍵名爲列名；僅比較其中指定的列，不能爲空數組 | 必填 |
| `$values` | 比較成功後要寫入的列和值，可以只包含部分列 | 必填 |

**返回值**：比較成功並完成寫入返回 `true`；`key` 不存在或任一列的值與期望不符時返回 `false`，數據不會被修改。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!IMPORTANT]
> - `$expected` 不能爲空數組，鍵名必須爲已定義的列名，否則拋出警告並返回 `false`。
> - 比較和寫入在行鎖保護下完成，整個過程是原子的，可用於實現樂觀鎖：併發修改時只有一個進程/線程能成功。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('version', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'version' => 1]);
// 僅當 version 仍爲 1 時才寫入
var_dump($table->cmpset('zzz', ['version' => 1], ['name' => '李四', 'version' => 2])); // true
var_dump($table->cmpset('zzz', ['version' => 1], ['name' => '王五', 'version' => 3])); // false，version 已變化
```

### get

獲取指定 `key` 對應的數據。

```php
public function get(string $key, ?string $field = null): array|false|string|float|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`【必須爲字符串類型】 | 必填 |
| `$field` | 當指定了 `$field` 時僅返回該字段的值，而不是整個記錄 | `null` |

**返回值**：當 `$key` 不存在時返回 `false`，否則成功時返回整個 `記錄數組`；若額外指定了 `$field` 參數，則僅返回該字段的值。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();


$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
echo $table->get('zzz', 'name');
```

### getdel

獲取指定 `key` 對應的數據，並同時刪除該行，讀取和刪除是原子操作。

```php
public function getdel(string $key, ?string $field = null): array|false|string|float|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據。 | 必填 |
| `$field` | 當指定了 `$field` 時僅返回該字段的值，而不是整個記錄 | `null` |

**返回值**：成功時返回整個記錄數組，若指定了 `$field` 則僅返回該字段的值，同時該行被刪除；`key` 不存在時返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!TIP]
> - 與先 [`get`](#get) 再 [`del`](#del) 不同，`getdel` 在行鎖保護下一次完成，不會與其他進程/線程的讀寫交錯，適合「取出即消費」的場景。
> - 指定的 `$field` 不存在時返回 `false`，且不會刪除該行。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20]);
var_dump($table->getdel('zzz')); // 返回整行數據，同時刪除該行
var_dump($table->get('zzz')); // false，數據已被刪除
```

### del

根據指定的 `key`，刪除對應的數據。

```php
public function del(string $key): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據。 | 必填 |

**返回值**：成功刪除返回 `true`，`$key` 對應的數據不存在，將返回 `false`

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->del('zzz');
```

### cmpdel

比較並刪除（Compare-And-Delete）：僅當 `key` 存在，且 `$expected` 中指定的所有列的值與當前數據完全一致時，才刪除該行。

```php
public function cmpdel(string $key, array $expected): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據，最大長度不得超過 63 個字節。 | 必填 |
| `$expected` | 期望值數組，鍵名爲列名；僅比較其中指定的列，不能爲空數組 | 必填 |

**返回值**：比較成功並完成刪除返回 `true`；`key` 不存在或任一列的值與期望不符時返回 `false`，數據不會被刪除。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!IMPORTANT]
> - `$expected` 不能爲空數組，鍵名必須爲已定義的列名，否則拋出警告並返回 `false`。
> - 比較和刪除在行鎖保護下完成，整個過程是原子的，多個進程/線程併發 `cmpdel` 同一行時只有一個會成功。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('version', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'version' => 1]);
var_dump($table->cmpdel('zzz', ['version' => 2])); // false，version 不匹配，不刪除
var_dump($table->cmpdel('zzz', ['version' => 1])); // true，匹配並刪除
```

### exists

判斷指定的 `key` 是否存在。

```php
public function exists(string $key): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`，必須爲字符串類型，不得傳入二進制數據。 | 必填 |

**返回值**：`true` 表示數據存在，`false` 表示數據不存在。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->exists('zzz');
```

### incr

將 `Swoole\Table::TYPE_INT` 或者 `Swoole\Table::TYPE_FLOAT` 類型的值原子自增。

```php
public function incr(string $key, string $column, int|float $incrby = 1): float|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`【如果 `$key` 對應的行不存在，默認列的值爲 `0`】 | 必填 |
| `$column` | 指定列名【僅支持 `Swoole\Table::TYPE_INT` 和 `Swoole\Table::TYPE_FLOAT` 字段】 | 必填 |
| `$incrby` | 增量【如果列爲 `int`，`$incrby` 必須爲 `int` 型，如果列爲 `float` 型，`$incrby` 必須爲 `float` 類型】 | `1` |

**返回值**：返回自增後的結果

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->incr('zzz', 'age', 2);
```

### decr

將 `Swoole\Table::TYPE_INT` 或者 `Swoole\Table::TYPE_FLOAT` 類型的值原子遞減。

```php
public function decr(string $key, string $column, int|float $decrby = 1): float|int
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 數據的 `key`【如果 `$key` 對應的行不存在，默認列的值爲 `0`】 | 必填 |
| `$column` | 指定列名【僅支持 `Swoole\Table::TYPE_INT` 和 `Swoole\Table::TYPE_FLOAT` 字段】 | 必填 |
| `$decrby` | 遞減量【如果列爲 `int`，`$decrby` 必須爲 `int` 型，如果列爲 `float` 型，`$decrby` 必須爲 `float` 類型】 | `1` |

**返回值**：返回遞減後的結果。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->decr('zzz', 'age', 2);
```

### count

返回內存表中存在的記錄數。

```php
public function count(): int
```

**返回值**：返回內存表中存在的記錄數。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => '王五', 'age' => 30, 'gender' => 1]);
echo $table->count();
```

### destroy

銷燬整張內存表。

```php
public function destroy(): bool
```

**返回值**：`true` 表示操作成功，`false` 表示操作失敗。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->destroy();
```

### getSize

`Swoole\Table` 實例在創建時設置的最大行數（即 `table` 的容量上限）。

```php
public function getSize(): int
```

**返回值**：返回 `Swoole\Table` 實例在創建時設置的最大行數（即 `table` 的容量上限）。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
echo $table->getSize();
```

### getMemorySize

獲取實際佔用內存的尺寸，單位爲字節。

```php
public function getMemorySize(): int
```

**返回值**：返回獲取實際佔用內存的尺寸，單位爲字節。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => '王五', 'age' => 20, 'gender' => 1]);
$table->set('yyy', ['name' => '趙二', 'age' => 20, 'gender' => 1]);
echo $table->getMemorySize();
```

### stats

獲取內存表狀態。

```php
public function stats(): false|array
```

**返回值**：內存表不存在返回 `false`，否則返回一個 `array`。

| key                   | 含義       |
|:----------------------|:---------|
| `num`                 | 數量       |
| `conflict_count`      | 哈希衝突次數   |
| `conflict_max_level`  | 最大哈希衝突層級 |
| `insert_count`        | 插入次數     |
| `update_count`        | 更新次數     |
| `delete_count`        | 刪除次數     |
| `available_slice_num` | 可用切片數量   |
| `total_slice_num`     | 切片總數     |

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '張三', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => '王五', 'age' => 20, 'gender' => 1]);
$table->set('yyy', ['name' => '趙二', 'age' => 20, 'gender' => 1]);
var_dump($table->stats());
```

## 注意

- `Swoole\Table` 適用於 `多進程` 環境下的輕量級數據共享，但不支持自動擴容。
- 在 `多線程` 環境下，推薦優先使用[併發容器](/zh-hant/thread/container.html)實現數據共享，該類容器支持自動擴容，可靈活應對動態變化的數據量。
- 上述 `多進程` 與 `多線程` 的共享方式在服務重啓後數據均會丟失。若需要持久化存儲且不希望在重啓後丟失數據，建議使用 `Redis`、`Memcache`、`MySQL` 等外部存儲組件。
- 不要使用數組方式讀寫 `Swoole\Table`，一定要使用文檔中提供的 API 來進行操作。
- `Swoole\Table` 類實現了 [Iterator（迭代器）接口](https://www.php.net/manual/zh/class.iterator.php) 和 [Countable接口](https://www.php.net/manual/zh/class.countable.php)，可以使用 `foreach` 進行遍歷。
- 請勿在遍歷期間 `Swoole\Table` 進行刪除操作（可將所有 `key` 取出後進行刪除）。
- 應用代碼無需加鎖，`Swoole\Table` 內置行鎖自旋鎖，所有操作均是 `多線程 / 多進程` 安全。用戶層完全不需要考慮數據同步問題。


