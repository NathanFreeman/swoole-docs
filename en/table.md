# High-Performance Shared Memory

- Because process memory is isolated in multi-process mode, modifications to `global` variables and superglobal variables within one process cannot be mapped to other processes.
- Therefore `Swoole` provides the high-performance shared memory `Swoole\Table`. `Swoole\Table` is an ultra-high-performance concurrent data structure implemented with shared memory and locks. It is used to solve data sharing and synchronized locking problems across multiple processes. Its memory capacity is not controlled by PHP's `memory_limit`.

## Properties

### size

The maximum number of rows set when the `Swoole\Table` instance was created (i.e., the capacity limit of the `table`).

```php
public int $size
```

**Example**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();

echo $table->size; // Outputs 1024
```

### memorySize

Gets the size of memory actually occupied, in bytes.

```php
public int $memorySize
```

**Example**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();

echo $table->memorySize;
```

## Methods

### __construct

The constructor of `Swoole\Table`, used to create a memory table object.

```php
public function __construct(int $table_size, float $conflict_proportion = 0.2)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$size` | Specifies the maximum number of rows of the table. If `$size` is not a power of `2`, such as `1000`, `5000`, `60000`, etc., the underlying layer automatically adjusts it to a nearby number. If it is less than `1024`, it defaults to `1024`, i.e., `1024` is the minimum. Starting from `v4.4.6`, the minimum is `64`. | Required |
| `$conflictProportion` | The maximum proportion of hash conflicts. Other values: minimum `0.2`, maximum `1` | `0.2` (i.e., `20%`) |

**Capacity calculation**

- If `$size` is not a power of `2`, such as `1000`, `5000`, `60000`, etc., the underlying layer automatically adjusts it to a nearby number. If it is less than `1024`, it defaults to `1024`, i.e., `1024` is the minimum. Starting from `v4.4.6`, the minimum is `64`.
- The total memory occupied by a `Table` is (`HashTable struct size` + `KEY length of 64 bytes` + `$size value`) * (`1 + $conflict_proportion value for hash conflicts`) * (`column size`).
- If the hash conflict rate of your data `Key`s exceeds `20%`, the reserved conflict memory blocks are insufficient. `set`ting new data will report an `Unable to allocate memory` error and return `false`, and the storage fails. In this case, you need to increase the `$size` value and restart the service.
- Set this value as large as possible when memory is sufficient.

> [!IMPORTANT]
> Because `Swoole\Table` is built on shared memory at the underlying level, it cannot be expanded dynamically. Therefore `$size` must be calculated and set by yourself before creation. The maximum number of rows `Swoole\Table` can store is positively correlated with `$size` but not exactly equal to it; for example, when `$size` is `1024`, the actual number of storable rows is **less than** `1024`. If `$size` is too large and the machine has insufficient memory, `Swoole\Table` creation will fail.

**Example**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### column

Appends a column (data column) to the memory table.

```php
public function column(string $name, int $type, int $size = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | Specifies the name of the field | Required |
| `$type` | Specifies the field type. Other values: `Swoole\Table::TYPE_INT`, `Swoole\Table::TYPE_FLOAT`, `Swoole\Table::TYPE_STRING` | Required |
| `$size` | Specifies the maximum length of a string field [fields of type `Swoole\Table::TYPE_STRING` must specify `$size`]. Unit: bytes | `0` |

**Return value**: `true` indicates the operation succeeded, `false` indicates the operation failed.

**Example**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('key', Swoole\Table::TYPE_STRING, 128);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### create

After defining the structure of the memory table, call the `create` method to request memory from the operating system and create the table.

```php
public function create(): bool
```

**Return value**: `true` indicates the operation succeeded; if system memory is insufficient and the allocation fails, it returns `false`.

> [!TIP]
> - Before calling the `create` method, data read/write methods such as `set` and `get` cannot be used.
> - After calling the `create` method, the `column` method cannot be used to add new fields.

**Example**

```php
<?php
$table = new Swoole\Table(1024);
$table->column('key', Swoole\Table::TYPE_STRING, 128);
$table->column('value', Swoole\Table::TYPE_INT);
$table->create();
```

### set

Adds a new row of data to the memory table.

```php
public function set(string $key, array $value): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Not `binary` safe; must be of `string` type; `binary` data must not be passed. | Required |
| `$value` | The `value` of the data | Required |

**Return value**: `true` indicates the operation succeeded, `false` indicates the operation failed.

> [!TIP]
> - You can set the values of all fields, or only some of the fields.
> - If a string passed in `$value` exceeds the maximum size set in the column definition, the underlying layer automatically truncates the data to a multiple of 8 for memory alignment.

> [!IMPORTANT]
> The same `$key` corresponds to the same row of data. `set`ting the same `key` overwrites the previous data. The maximum length of `key` must not exceed 63 bytes.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

// The keys of the $value array must exactly match the column names defined by column
$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
```

### add

Inserts a new row of data, writing only when the `key` does not exist; nothing is modified if the `key` already exists.

```php
public function add(string $key, array $values): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. The maximum length must not exceed 63 bytes. | Required |
| `$values` | The `value` of the data, keyed by the column names defined via `column` | Required |

**Return value**: Returns `true` on successful insertion; returns `false` if the `key` already exists or memory is exhausted.

> [!NOTE]
> Available since Swoole `v6.3`.

> [!TIP]
> - You may pass only some of the columns; unspecified columns take their default values (`0` for `int`/`float`, an empty string for `string`). An empty array is also allowed, creating a row of default values.
> - Difference from [`set`](#set): `set` overwrites the existing data when the `key` exists, while `add` simply returns `false` without overwriting.
> - The operation is atomic: when multiple processes/threads concurrently `add` the same `key`, only one succeeds.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

var_dump($table->add('zzz', ['name' => 'John', 'age' => 20])); // true
var_dump($table->add('zzz', ['name' => 'Jane', 'age' => 30])); // false, the key exists and the data is not overwritten
```

### update

Updates existing data, writing only when the `key` exists; nothing is modified if the `key` does not exist.

```php
public function update(string $key, array $values): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. The maximum length must not exceed 63 bytes. | Required |
| `$values` | The columns and values to update, keyed by the column names defined via `column` | Required |

**Return value**: Returns `true` on successful update; returns `false` if the `key` does not exist.

> [!NOTE]
> Available since Swoole `v6.3`.

> [!TIP]
> - You may update only some of the columns; unspecified columns keep their current values.
> - Difference from [`set`](#set): `set` creates a new row when the `key` does not exist, while `update` simply returns `false` without creating one.
> - The operation is atomic.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20]);
var_dump($table->update('zzz', ['age' => 21])); // true, only the age column is updated; name is unchanged
var_dump($table->update('not_exists', ['age' => 21])); // false, the key does not exist
```

### cmpset

Compare-And-Set: writes `$values` only when the `key` exists and every column specified in `$expected` exactly matches the current data.

```php
public function cmpset(string $key, array $expected, array $values): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. The maximum length must not exceed 63 bytes. | Required |
| `$expected` | The expected values, keyed by column name; only the specified columns are compared. Must not be an empty array | Required |
| `$values` | The columns and values to write if the comparison succeeds; may contain only some of the columns | Required |

**Return value**: Returns `true` when the comparison succeeds and the write completes; returns `false` if the `key` does not exist or any column differs from the expected value, leaving the data unmodified.

> [!NOTE]
> Available since Swoole `v6.3`.

> [!IMPORTANT]
> - `$expected` must not be an empty array, and its keys must be defined column names; otherwise a warning is emitted and `false` is returned.
> - The comparison and the write are performed under the row lock, making the whole operation atomic. This can be used to implement optimistic locking: only one process/thread succeeds among concurrent modifications.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('version', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'version' => 1]);
// Write only if version is still 1
var_dump($table->cmpset('zzz', ['version' => 1], ['name' => 'Jane', 'version' => 2])); // true
var_dump($table->cmpset('zzz', ['version' => 1], ['name' => 'Bob', 'version' => 3])); // false, version has changed
```

### get

Gets the data corresponding to the specified `key`.

```php
public function get(string $key, ?string $field = null): array|false|string|float|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data [must be of string type] | Required |
| `$field` | When `$field` is specified, only the value of that field is returned instead of the entire record | `null` |

**Return value**: Returns `false` when `$key` does not exist; otherwise returns the entire `record array` on success. If the `$field` parameter is additionally specified, only the value of that field is returned.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();


$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
echo $table->get('zzz', 'name');
```

### getdel

Gets the data corresponding to the specified `key` and deletes the row at the same time; the read and the delete form a single atomic operation.

```php
public function getdel(string $key, ?string $field = null): array|false|string|float|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. | Required |
| `$field` | When `$field` is specified, only the value of that field is returned instead of the entire record | `null` |

**Return value**: On success, returns the entire record array (or only the value of `$field` if specified) and deletes the row; returns `false` if the `key` does not exist.

> [!NOTE]
> Available since Swoole `v6.3`.

> [!TIP]
> - Unlike calling [`get`](#get) followed by [`del`](#del), `getdel` completes in one step under the row lock and cannot interleave with reads/writes from other processes/threads — suited to "take-and-consume" scenarios.
> - If the specified `$field` does not exist, `false` is returned and the row is not deleted.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20]);
var_dump($table->getdel('zzz')); // Returns the whole row and deletes it at the same time
var_dump($table->get('zzz')); // false, the data has been deleted
```

### del

Deletes the data corresponding to the specified `key`.

```php
public function del(string $key): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. | Required |

**Return value**: Returns `true` on successful deletion; returns `false` if the data corresponding to `$key` does not exist

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->del('zzz');
```

### cmpdel

Compare-And-Delete: deletes the row only when the `key` exists and every column specified in `$expected` exactly matches the current data.

```php
public function cmpdel(string $key, array $expected): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. The maximum length must not exceed 63 bytes. | Required |
| `$expected` | The expected values, keyed by column name; only the specified columns are compared. Must not be an empty array | Required |

**Return value**: Returns `true` when the comparison succeeds and the deletion completes; returns `false` if the `key` does not exist or any column differs from the expected value, leaving the data undeleted.

> [!NOTE]
> Available since Swoole `v6.3`.

> [!IMPORTANT]
> - `$expected` must not be an empty array, and its keys must be defined column names; otherwise a warning is emitted and `false` is returned.
> - The comparison and the deletion are performed under the row lock, making the whole operation atomic: when multiple processes/threads concurrently `cmpdel` the same row, only one succeeds.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('version', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'version' => 1]);
var_dump($table->cmpdel('zzz', ['version' => 2])); // false, version does not match; nothing is deleted
var_dump($table->cmpdel('zzz', ['version' => 1])); // true, matches and deletes
```

### exists

Checks whether the specified `key` exists.

```php
public function exists(string $key): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data. Must be of string type; binary data must not be passed. | Required |

**Return value**: `true` indicates the data exists, `false` indicates the data does not exist.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->exists('zzz');
```

### incr

Atomically increments a value of type `Swoole\Table::TYPE_INT` or `Swoole\Table::TYPE_FLOAT`.

```php
public function incr(string $key, string $column, int|float $incrby = 1): float|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data [if the row corresponding to `$key` does not exist, the column value defaults to `0`] | Required |
| `$column` | Specifies the column name [only `Swoole\Table::TYPE_INT` and `Swoole\Table::TYPE_FLOAT` fields are supported] | Required |
| `$incrby` | The increment [if the column is `int`, `$incrby` must be of type `int`; if the column is `float`, `$incrby` must be of type `float`] | `1` |

**Return value**: Returns the result after incrementing

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->incr('zzz', 'age', 2);
```

### decr

Atomically decrements a value of type `Swoole\Table::TYPE_INT` or `Swoole\Table::TYPE_FLOAT`.

```php
public function decr(string $key, string $column, int|float $decrby = 1): float|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` of the data [if the row corresponding to `$key` does not exist, the column value defaults to `0`] | Required |
| `$column` | Specifies the column name [only `Swoole\Table::TYPE_INT` and `Swoole\Table::TYPE_FLOAT` fields are supported] | Required |
| `$decrby` | The decrement [if the column is `int`, `$decrby` must be of type `int`; if the column is `float`, `$decrby` must be of type `float`] | `1` |

**Return value**: Returns the result after decrementing.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->decr('zzz', 'age', 2);
```

### count

Returns the number of records in the memory table.

```php
public function count(): int
```

**Return value**: Returns the number of records in the memory table.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => 'Mike', 'age' => 30, 'gender' => 1]);
echo $table->count();
```

### destroy

Destroys the entire memory table.

```php
public function destroy(): bool
```

**Return value**: `true` indicates the operation succeeded, `false` indicates the operation failed.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->destroy();
```

### getSize

The maximum number of rows set when the `Swoole\Table` instance was created (i.e., the capacity limit of the `table`).

```php
public function getSize(): int
```

**Return value**: Returns the maximum number of rows set when the `Swoole\Table` instance was created (i.e., the capacity limit of the `table`).

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
echo $table->getSize();
```

### getMemorySize

Gets the size of memory actually occupied, in bytes.

```php
public function getMemorySize(): int
```

**Return value**: Returns the size of memory actually occupied, in bytes.

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => 'Mike', 'age' => 20, 'gender' => 1]);
$table->set('yyy', ['name' => 'Tom', 'age' => 20, 'gender' => 1]);
echo $table->getMemorySize();
```

### stats

Gets the status of the memory table.

```php
public function stats(): false|array
```

**Return value**: Returns `false` if the memory table does not exist; otherwise returns an `array`.

| key                   | Meaning       |
|:----------------------|:---------|
| `num`                 | Count       |
| `conflict_count`      | Number of hash conflicts   |
| `conflict_max_level`  | Maximum hash conflict level |
| `insert_count`        | Number of inserts     |
| `update_count`        | Number of updates     |
| `delete_count`        | Number of deletions     |
| `available_slice_num` | Number of available slices   |
| `total_slice_num`     | Total number of slices     |

**Example**

```php
<?php
use Swoole\Table;
$table = new Table(1024);
$table->column('name', Swoole\Table::TYPE_STRING, 128);
$table->column('age', Swoole\Table::TYPE_INT);
$table->column('gender', Swoole\Table::TYPE_INT);
$table->create();

$table->set('zzz', ['name' => 'John', 'age' => 20, 'gender' => 1]);
$table->set('xxx', ['name' => 'Mike', 'age' => 20, 'gender' => 1]);
$table->set('yyy', ['name' => 'Tom', 'age' => 20, 'gender' => 1]);
var_dump($table->stats());
```

## Using in an asynchronous server

`Swoole\Table` must be created before `$server->start()`. An asynchronous server forks multiple `worker` processes at startup; a `Table` created before `start()` is inherited by all `worker` processes, so every process reads and writes the same shared memory. If it is created inside the `onWorkerStart` callback, each `worker` process creates its own independent table, and data cannot be shared between processes.

The following example uses `Swoole\Table` to count the total number of requests handled by all `worker` processes:

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Table;

// Must be created before $server->start(), so all worker processes share the same table
$table = new Table(1024);
$table->column('count', Table::TYPE_INT);
$table->create();

$server = new Server('127.0.0.1', 9501);
$server->set(['worker_num' => 4]);

$server->on('request', function (Request $request, Response $response) use ($table) {
    // incr is atomic, concurrent counting from multiple worker processes never loses updates
    $total = $table->incr('total', 'count');
    $table->incr($request->server['request_uri'], 'count');
    $response->end("total requests: {$total}\n");
});

$server->start();
```

## Notes

- `Swoole\Table` is suitable for lightweight data sharing in `multi-process` environments, but does not support automatic expansion.
- In `multi-thread` environments, it is recommended to prefer [concurrent containers](/en/thread/container.html) for data sharing; such containers support automatic expansion and can flexibly handle dynamically changing data volumes.
- Data shared via the `multi-process` and `multi-thread` approaches above is lost after the service restarts. If you need persistent storage and do not want to lose data after restarts, use external storage components such as `Redis`, `Memcache`, or `MySQL`.
- Do not read or write `Swoole\Table` using array syntax; always use the APIs provided in this documentation to operate on it.
- The `Swoole\Table` class implements the [Iterator interface](https://www.php.net/manual/zh/class.iterator.php) and the [Countable interface](https://www.php.net/manual/zh/class.countable.php), so it can be traversed with `foreach`.
- Do not perform delete operations on `Swoole\Table` during traversal (you can collect all `key`s first and then delete them).
- Application code does not need locking. `Swoole\Table` has built-in row-level spinlocks, and all operations are `multi-thread / multi-process` safe. Users do not need to consider data synchronization at all.