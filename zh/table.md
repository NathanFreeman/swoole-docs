# 高性能共享内存

- 由于在多进程模式下存在进程内存隔离，在进程内修改 `global` 全局变量和超全局变量时，是无法映射到其他进程的。
- 因此 `Swoole` 提供了高性能共享内存 `Swoole\Table`，`Swoole\Table` 是一个基于共享内存和锁实现的超高性能，并发数据结构。用于解决多进程数据共享和同步加锁问题。它的内存容量不受 `PHP` 的 `memory_limit` 控制。

## 属性

### size

`Swoole\Table` 实例在创建时设置的最大行数（即 `table` 的容量上限）。

```php
public int $size
```

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();

echo $table->size; // 输出1024
```

### memorySize

获取实际占用内存的尺寸，单位为字节。

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

`Swoole\Table` 的构造函数，用于创建内存表对象。

```php
public function __construct(int $table_size, float $conflict_proportion = 0.2)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$size` | 指定表格的最大行数，如果 `$size` 不是为 `2` 的 `N` 次方，如 `1024`、`8192`、`65536` 等，底层会自动调整为接近的一个数字，如果小于 `1024` 则默认成 `1024`，即 `1024` 是最小值。从 `v4.4.6` 版本开始最小值为 `64`。 | 必填 |
| `$conflictProportion` | 哈希冲突的最大比例。其它值：最小为 `0.2`，最大为 `1` | `0.2`（即 `20%`） |

**容量计算**

- 如果 `$size` 不是为 `2` 的 `N` 次方，如 `1024`、`8192`、`65536` 等，底层会自动调整为接近的一个数字，如果小于 `1024` 则默认成 `1024`，即 `1024` 是最小值。从 `v4.4.6` 版本开始最小值为 `64`。
- `Table` 占用的内存总数为 (`HashTable结构体长度` + `KEY长度64字节` + `$size值`) * (`1 + $conflict_proportion值作为hash冲突`) * (`列尺寸`)。
- 如果你的数据 `Key` 和 Hash 冲突率超过 `20%`，预留的冲突内存块容量不足，`set` 新的数据就会报 `Unable to allocate memory` 错误，并返回 `false`，存储失败，此时需要调大 `$size` 值并重启服务。
- 在内存足够的情况下尽量将此值设置的大一些。

> [!IMPORTANT]
> 由于 `Swoole\Table` 底层是建立在共享内存之上，所以无法动态扩容。所以 `$size` 必须在创建前自己计算设置好，`Swoole\Table` 能存储的最大行数与 `$size` 正相关，但不完全一致，如 `$size` 为 `1024` 实际可存储的行数**小于** `1024`，如果 `$size` 过大，机器内存不足 `Swoole\Table` 会创建失败。

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### column

向内存表追加一列（数据列）。

```php
public function column(string $name, int $type, int $size = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 指定字段的名称 | 必填 |
| `$type` | 指定字段类型。其它值：`Swoole\Table::TYPE_INT`、`Swoole\Table::TYPE_FLOAT`、`Swoole\Table::TYPE_STRING` | 必填 |
| `$size` | 指定字符串字段的最大长度【`Swoole\Table::TYPE_STRING` 类型的字段必须指定 `$size`】。值单位：字节 | `0` |

**返回值**：`true` 表示操作成功，`false` 表示操作失败。

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('key', Swoole\Table::TYPE_STRING, 128);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### create

定义内存表的结构后，执行 `create` 方法向操作系统申请内存并创建表。

```php
public function create(): bool
```

**返回值**：`true` 表示操作成功，系统内存不足，申请失败返回 `false`。

> [!TIP]
> - 调用 `create` 方法之前不能使用 `set`、`get` 等数据读写操作方法。
> - 调用 `create` 方法之后不能使用 `column` 方法添加新字段。

**示例**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('key', Swoole\Table::TYPE_STRING, 128);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### set

往内存表添加一行新数据。

```php
public function set(string $key, array $value): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，非 `二进制` 安全，必须为 `字符串` 类型，不得传入 `二进制` 数据。 | 必填 |
| `$value` | 数据的 `value` | 必填 |

**返回值**：`true` 表示操作成功，`false` 表示操作失败。

> [!TIP]
> - 可以设置全部字段的值，也可以只设置部分字段。
> - 如果 `$value` 中的传入字符串长度超过了列定义时设定的最大尺寸，底层为了内存对齐，会按照 8 的整数倍自动截断数据。

> [!IMPORTANT]
> 相同的 `$key` 对应同一行数据，如果 `set` 同一个 `key`，会覆盖上一次的数据，`key` 最大长度不得超过 63 个字节。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

// $value数组的键名必须与column定义的列名完全一致
$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
```

### add

插入一行新数据，仅当 `key` 不存在时写入，`key` 已存在时不做任何修改。

```php
public function add(string $key, array $values): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据，最大长度不得超过 63 个字节。 | 必填 |
| `$values` | 数据的 `value`，键名为 `column` 定义的列名 | 必填 |

**返回值**：插入成功返回 `true`；`key` 已存在或内存不足时返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!TIP]
> - 可以只传入部分列，未指定的列使用默认值（`int`/`float` 为 `0`，`string` 为空字符串）；也可以传入空数组，仅创建一行默认值数据。
> - 与 [`set`](#set) 的区别：`set` 在 `key` 存在时会覆盖原有数据，`add` 则直接返回 `false`，不会覆盖。
> - 操作是原子的，多个进程/线程并发 `add` 同一个 `key` 时只有一个会成功。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

var_dump($table->add('zzz', ['name' => '张三', 'age' => 20])); // true
var_dump($table->add('zzz', ['name' => '李四', 'age' => 30])); // false，key 已存在，数据不会被覆盖
```

### update

更新已存在的数据，仅当 `key` 存在时写入，`key` 不存在时不做任何修改。

```php
public function update(string $key, array $values): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据，最大长度不得超过 63 个字节。 | 必填 |
| `$values` | 要更新的列和值，键名为 `column` 定义的列名 | 必填 |

**返回值**：更新成功返回 `true`；`key` 不存在时返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!TIP]
> - 可以只更新部分列，未指定的列保持原值不变。
> - 与 [`set`](#set) 的区别：`set` 在 `key` 不存在时会创建新行，`update` 则直接返回 `false`，不会创建。
> - 操作是原子的。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20]);
var_dump($table->update('zzz', ['age' => 21])); // true，仅更新 age 列，name 保持不变
var_dump($table->update('not_exists', ['age' => 21])); // false，key 不存在
```

### cmpset

比较并设置（Compare-And-Set）：仅当 `key` 存在，且 `$expected` 中指定的所有列的值与当前数据完全一致时，才写入 `$values`。

```php
public function cmpset(string $key, array $expected, array $values): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据，最大长度不得超过 63 个字节。 | 必填 |
| `$expected` | 期望值数组，键名为列名；仅比较其中指定的列，不能为空数组 | 必填 |
| `$values` | 比较成功后要写入的列和值，可以只包含部分列 | 必填 |

**返回值**：比较成功并完成写入返回 `true`；`key` 不存在或任一列的值与期望不符时返回 `false`，数据不会被修改。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!IMPORTANT]
> - `$expected` 不能为空数组，键名必须为已定义的列名，否则抛出警告并返回 `false`。
> - 比较和写入在行锁保护下完成，整个过程是原子的，可用于实现乐观锁：并发修改时只有一个进程/线程能成功。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('version', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'version' => 1]);
// 仅当 version 仍为 1 时才写入
var_dump($table->cmpset('zzz', ['version' => 1], ['name' => '李四', 'version' => 2])); // true
var_dump($table->cmpset('zzz', ['version' => 1], ['name' => '王五', 'version' => 3])); // false，version 已变化
```

### get

获取指定 `key` 对应的数据。

```php
public function get(string $key, ?string $field = null): array|false|string|float|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`【必须为字符串类型】 | 必填 |
| `$field` | 当指定了 `$field` 时仅返回该字段的值，而不是整个记录 | `null` |

**返回值**：当 `$key` 不存在时返回 `false`，否则成功时返回整个 `记录数组`；若额外指定了 `$field` 参数，则仅返回该字段的值。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();


$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
echo $table->get('zzz', 'name');
```

### getdel

获取指定 `key` 对应的数据，并同时删除该行，读取和删除是原子操作。

```php
public function getdel(string $key, ?string $field = null): array|false|string|float|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据。 | 必填 |
| `$field` | 当指定了 `$field` 时仅返回该字段的值，而不是整个记录 | `null` |

**返回值**：成功时返回整个记录数组，若指定了 `$field` 则仅返回该字段的值，同时该行被删除；`key` 不存在时返回 `false`。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!TIP]
> - 与先 [`get`](#get) 再 [`del`](#del) 不同，`getdel` 在行锁保护下一次完成，不会与其他进程/线程的读写交错，适合「取出即消费」的场景。
> - 指定的 `$field` 不存在时返回 `false`，且不会删除该行。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20]);
var_dump($table->getdel('zzz')); // 返回整行数据，同时删除该行
var_dump($table->get('zzz')); // false，数据已被删除
```

### del

根据指定的 `key`，删除对应的数据。

```php
public function del(string $key): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据。 | 必填 |

**返回值**：成功删除返回 `true`，`$key` 对应的数据不存在，将返回 `false`

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->del('zzz');
```

### cmpdel

比较并删除（Compare-And-Delete）：仅当 `key` 存在，且 `$expected` 中指定的所有列的值与当前数据完全一致时，才删除该行。

```php
public function cmpdel(string $key, array $expected): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据，最大长度不得超过 63 个字节。 | 必填 |
| `$expected` | 期望值数组，键名为列名；仅比较其中指定的列，不能为空数组 | 必填 |

**返回值**：比较成功并完成删除返回 `true`；`key` 不存在或任一列的值与期望不符时返回 `false`，数据不会被删除。

> [!NOTE]
> Swoole 版本 >= `v6.3` 可用。

> [!IMPORTANT]
> - `$expected` 不能为空数组，键名必须为已定义的列名，否则抛出警告并返回 `false`。
> - 比较和删除在行锁保护下完成，整个过程是原子的，多个进程/线程并发 `cmpdel` 同一行时只有一个会成功。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('version', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'version' => 1]);
var_dump($table->cmpdel('zzz', ['version' => 2])); // false，version 不匹配，不删除
var_dump($table->cmpdel('zzz', ['version' => 1])); // true，匹配并删除
```

### exists

判断指定的 `key` 是否存在。

```php
public function exists(string $key): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`，必须为字符串类型，不得传入二进制数据。 | 必填 |

**返回值**：`true` 表示数据存在，`false` 表示数据不存在。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->exists('zzz');
```

### incr

将 `Swoole\Table::TYPE_INT` 或者 `Swoole\Table::TYPE_FLOAT` 类型的值原子自增。

```php
public function incr(string $key, string $column, int|float $incrby = 1): float|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`【如果 `$key` 对应的行不存在，默认列的值为 `0`】 | 必填 |
| `$column` | 指定列名【仅支持 `Swoole\Table::TYPE_INT` 和 `Swoole\Table::TYPE_FLOAT` 字段】 | 必填 |
| `$incrby` | 增量【如果列为 `int`，`$incrby` 必须为 `int` 型，如果列为 `float` 型，`$incrby` 必须为 `float` 类型】 | `1` |

**返回值**：返回自增后的结果

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->incr('zzz', 'age', 2);
```

### decr

将 `Swoole\Table::TYPE_INT` 或者 `Swoole\Table::TYPE_FLOAT` 类型的值原子递减。

```php
public function decr(string $key, string $column, int|float $decrby = 1): float|int
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 数据的 `key`【如果 `$key` 对应的行不存在，默认列的值为 `0`】 | 必填 |
| `$column` | 指定列名【仅支持 `Swoole\Table::TYPE_INT` 和 `Swoole\Table::TYPE_FLOAT` 字段】 | 必填 |
| `$decrby` | 递减量【如果列为 `int`，`$decrby` 必须为 `int` 型，如果列为 `float` 型，`$decrby` 必须为 `float` 类型】 | `1` |

**返回值**：返回递减后的结果。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->decr('zzz', 'age', 2);
```

### count

返回内存表中存在的记录数。

```php
public function count(): int
```

**返回值**：返回内存表中存在的记录数。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => '王五', 'age' => 30, 'gender' => 1]);
echo $table->count();
```

### destroy

销毁整张内存表。

```php
public function destroy(): bool
```

**返回值**：`true` 表示操作成功，`false` 表示操作失败。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->destroy();
```

### getSize

`Swoole\Table` 实例在创建时设置的最大行数（即 `table` 的容量上限）。

```php
public function getSize(): int
```

**返回值**：返回 `Swoole\Table` 实例在创建时设置的最大行数（即 `table` 的容量上限）。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
echo $table->getSize();
```

### getMemorySize

获取实际占用内存的尺寸，单位为字节。

```php
public function getMemorySize(): int
```

**返回值**：返回获取实际占用内存的尺寸，单位为字节。

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => '王五', 'age' => 20, 'gender' => 1]);
$table->set('yyy', ['name' => '赵二', 'age' => 20, 'gender' => 1]);
echo $table->getMemorySize();
```

### stats

获取内存表状态。

```php
public function stats(): false|array
```

**返回值**：内存表不存在返回 `false`，否则返回一个 `array`。

| key                   | 含义       |
|:----------------------|:---------|
| `num`                 | 数量       |
| `conflict_count`      | 哈希冲突次数   |
| `conflict_max_level`  | 最大哈希冲突层级 |
| `insert_count`        | 插入次数     |
| `update_count`        | 更新次数     |
| `delete_count`        | 删除次数     |
| `available_slice_num` | 可用切片数量   |
| `total_slice_num`     | 切片总数     |

**示例**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => '张三', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => '王五', 'age' => 20, 'gender' => 1]);
$table->set('yyy', ['name' => '赵二', 'age' => 20, 'gender' => 1]);
var_dump($table->stats());
```

## 注意

- `Swoole\Table` 适用于 `多进程` 环境下的轻量级数据共享，但不支持自动扩容。
- 在 `多线程` 环境下，推荐优先使用[并发容器](/zh/thread/container.html)实现数据共享，该类容器支持自动扩容，可灵活应对动态变化的数据量。
- 上述 `多进程` 与 `多线程` 的共享方式在服务重启后数据均会丢失。若需要持久化存储且不希望在重启后丢失数据，建议使用 `Redis`、`Memcache`、`MySQL` 等外部存储组件。
- 不要使用数组方式读写 `Swoole\Table`，一定要使用文档中提供的 API 来进行操作。
- `Swoole\Table` 类实现了 [Iterator（迭代器）接口](https://www.php.net/manual/zh/class.iterator.php) 和 [Countable接口](https://www.php.net/manual/zh/class.countable.php)，可以使用 `foreach` 进行遍历。
- 请勿在遍历期间 `Swoole\Table` 进行删除操作（可将所有 `key` 取出后进行删除）。
- 应用代码无需加锁，`Swoole\Table` 内置行锁自旋锁，所有操作均是 `多线程 / 多进程` 安全。用户层完全不需要考虑数据同步问题。


