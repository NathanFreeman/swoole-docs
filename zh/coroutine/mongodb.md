# MongoDB 协程化

`mongodb` 扩展是同步阻塞的，无法像 `PDO`、`Redis` 那样直接 hook 它的函数。Swoole 的做法是换掉客户端类：把 `MongoDB\Client` 变成代理类 `Swoole\MongoDB\Client`，真正的驱动对象跑在一个独立的常驻进程里，代理通过 Unix Socket 把每次调用转发过去。协程只在等待 socket 响应时让出，MongoDB 操作因此不再阻塞整个进程。

> [!IMPORTANT]
> 使用前提：`swoole` ≥ `6.2`、`PHP` ≥ `8.2`、`php.ini` 中 `swoole.enable_library=On`（默认开启，设为 `Off` 时 `SWOOLE_HOOK_MONGODB` 会被直接丢弃）；设置 hook 必须在主线程且尚未创建任何子线程时进行；客户端的构造与调用都必须在协程内。

## 完整示例

下面这个脚本可以直接保存运行：连接 MongoDB、批量写入、建索引、查询更新、upsert、分页、聚合统计、捕获异常，最后清理数据，每一步都打印结果。

**准备一个 MongoDB**（已有可跳过）：

```shell
docker run -d --name mongo -p 27017:27017 mongo:7
```

**装依赖**：

```shell
pecl install mongodb
composer require mongodb/mongodb
```

**保存为 `demo.php`**：

```php
<?php
declare(strict_types=1);

use Swoole\RemoteObject\Exception;
use function Swoole\Coroutine\run;

// SWOOLE_HOOK_ALL 不包含 SWOOLE_HOOK_MONGODB，必须显式或上去
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    // 必须在协程内 new。typeMap 让文档以纯数组返回，否则每个字段都是一次远程调用
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );

    // 选库选集合，库和集合不存在时会在第一次写入时自动创建
    $articles = $client->selectCollection('demo', 'articles');

    // 从干净状态开始，脚本可以反复运行
    $articles->deleteMany([]);

    $inserted = $articles->insertMany([
        ['title' => '协程入门', 'tag' => 'php', 'views' => 120],
        ['title' => '连接池实践', 'tag' => 'php', 'views' => 340],
        ['title' => 'MQTT 服务器', 'tag' => 'iot', 'views' => 80],
        ['title' => 'HTTP 服务', 'tag' => 'php', 'views' => 560],
        ['title' => '定时器', 'tag' => 'php', 'views' => 45],
    ]);
    echo '1. 写入 ', count($inserted->getInsertedIds()), " 条\n";

    echo '2. 索引 ', $articles->createIndex(['views' => -1]), "\n";

    $one = $articles->findOne(['title' => '协程入门']);
    echo '3. 查到 ', $one['title'], ' views=', $one['views'], "\n";
    $articles->updateOne(['title' => '协程入门'], ['$inc' => ['views' => 1]]);

    // upsert：匹配不到就插入一条
    $articles->updateOne(
        ['title' => '线程池'],
        ['$set' => ['tag' => 'php', 'views' => 0]],
        ['upsert' => true]
    );
    echo '4. 现有 ', $articles->countDocuments(), " 条\n";

    // php 标签按 views 倒序，取第 2 页、每页 2 条；排除 _id 省掉一次远程调用
    $page = $articles->find(['tag' => 'php'], [
        'projection' => ['_id' => 0, 'title' => 1, 'views' => 1],
        'sort' => ['views' => -1],
        'skip' => 2,
        'limit' => 2,
    ])->toArray();
    echo "5. 第 2 页：\n";
    foreach ($page as $row) {
        echo '   ', $row['title'], ' ', $row['views'], "\n";
    }

    // 聚合管道整个数组一次发过去，在服务端算完再一次性传回
    $stats = $articles->aggregate([
        ['$group' => ['_id' => '$tag', 'total' => ['$sum' => '$views'], 'count' => ['$sum' => 1]]],
        ['$sort' => ['total' => -1]],
    ])->toArray();
    echo "6. 聚合：\n";
    foreach ($stats as $row) {
        echo '   ', $row['_id'], ' total=', $row['total'], ' count=', $row['count'], "\n";
    }

    // 服务端抛出的异常统一包装成 Swoole\RemoteObject\Exception
    try {
        $articles->insertOne(['_id' => 'dup']);
        $articles->insertOne(['_id' => 'dup']);
    } catch (Exception $e) {
        echo '7. 捕获 ', $e->getRemoteClass(), ' code=', $e->getRemoteCode(), "\n";
    }

    echo '8. 删除 ', $articles->deleteMany([])->getDeletedCount(), " 条\n";
});
```

**运行**：

```shell
php demo.php
```

预期输出：

```text
1. 写入 5 条
2. 索引 views_-1
3. 查到 协程入门 views=120
4. 现有 6 条
5. 第 2 页：
   协程入门 121
   定时器 45
6. 聚合：
   php total=1066 count=5
   iot total=80 count=1
7. 捕获 MongoDB\Driver\Exception\BulkWriteException code=11000
8. 删除 7 条
```

> [!NOTE]
> 首次运行会多花几秒：Swoole 要自动拉起常驻的服务端进程，`mongodb/mongodb` 没装时还会先执行一次 `composer require`。之后的运行不再有这段开销。

> [!TIP]
> 把 `new Swoole\MongoDB\Client(...)` 换成 `new MongoDB\Client(...)` 效果完全一样，前提是 Composer 的自动加载没有先把原生 `MongoDB\Client` 加载进来，原因见[工作原理](#工作原理)。

## 工作原理

整个过程分三步：

- **注册类别名**：开启 [`SWOOLE_HOOK_MONGODB`](#swoole-hook-mongodb) 后，Swoole 把 `MongoDB\Client` 注册为 `Swoole\MongoDB\Client` 的别名，原有代码里的 `new MongoDB\Client(...)` 一行不改就变成协程版。
- **转发调用**：代理类自己不连接 MongoDB，它把方法调用、属性读写、数组访问、遍历序列化后发给远程对象服务（remote object server）。
- **独立进程执行**：服务端持有真正的 `\MongoDB\Client`，阻塞的驱动调用发生在那里，结果再序列化回来。

服务端在第一次使用时自动启动并常驻，不需要手工部署；要自己接管时见[自定义服务端](#自定义服务端)。

> [!WARNING]
> `SWOOLE_HOOK_ALL` **不包含** `SWOOLE_HOOK_MONGODB`，必须显式按位或上去：`SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB`。

> [!NOTE]
> 别名只在 `MongoDB\Client` 这个类**尚未被加载**时注册。如果先 `require vendor/autoload.php` 且项目里装了 `mongodb/mongodb`，`new MongoDB\Client(...)` 拿到的仍是原生阻塞客户端，这时必须显式写 `new Swoole\MongoDB\Client(...)`。

## 安装依赖

```shell
pecl install mongodb
composer require mongodb/mongodb
```

`mongodb` 扩展装在当前 PHP 上即可，自动启动的服务端进程用的就是 `PHP_BINARY`。

> [!NOTE]
> `mongodb/mongodb` 库没装也可以：首次启动服务端时，Swoole 会在服务端工作目录里自动执行 `composer require mongodb/mongodb`。这要求 `composer` 在 `PATH` 中且能访问网络，否则请自己先装好。

## SWOOLE_HOOK_MONGODB

协程化 `MongoDB` 客户端的 hook 标志，值为 `1 << 22`。

```php
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);
```

开启后 `MongoDB\Client` 成为 [`Client`](#client) 的别名。也可以不依赖别名，直接实例化 `Swoole\MongoDB\Client`，两者完全等价。

> [!NOTE]
> 这个标志只负责注册类别名和触发服务端的依赖安装，不会 hook `mongodb` 扩展的任何函数。直接使用 `MongoDB\Driver\Manager` 等底层类仍然是阻塞的。

## Client

`Swoole\MongoDB\Client` 是 `MongoDB\Client` 的协程代理。它只声明了 [`__construct`](#construct)，其余调用全部由 `Swoole\RemoteObject\ProxyTrait` 转发到远端的真实对象，所以原生 `MongoDB\Client` 的 API（`selectDatabase`、`selectCollection`、`listDatabases`、用 `__get` 取库等）都能照常使用。

### __construct

创建一个 MongoDB 协程客户端，同时在服务端创建对应的 `\MongoDB\Client` 对象。

```php
public function __construct(?string $uri = self::DEFAULT_URI, array $uriOptions = [], array $driverOptions = [])
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$uri` | 连接串，格式与原生 `MongoDB\Client` 完全一致 | `'mongodb://127.0.0.1/'`（`Client::DEFAULT_URI`） |
| `$uriOptions` | 连接串选项，会覆盖 `$uri` 里的同名查询参数 | `[]` |
| `$driverOptions` | 驱动选项，例如 `typeMap`，见[调用转发](#调用转发) | `[]` |

> [!NOTE]
> 构造即发起一次远程调用，因此必须在协程内 `new`。构造失败抛出 [`Swoole\RemoteObject\Exception`](#异常)。

### 调用转发

代理对象上的每一种操作都是一次进程间往返：

| 写法 | 实际发生的事 |
|:---|:---|
| `$client->selectCollection('demo', 'users')` | 转发方法调用，返回的 `Collection` 也是一个远程代理 |
| `$client->demo` | 转发属性读取，等价于 `selectDatabase('demo')` |
| `$collection->insertOne([...])` | 参数数组序列化后发送，返回的 `InsertOneResult` 是远程代理 |
| `$document['name']` | 转发数组访问，一次往返 |
| `foreach ($cursor as $document)` | `rewind`、`valid`、`current`、`key`、`next` 各是一次往返 |
| `count($cursor)` | 转发 `count` 调用，一次往返 |

**返回值规则**：服务端返回的标量和数组按值传回本地；返回的对象（包括数组里嵌套的对象）不会传回，而是登记在服务端并包装成一个新的远程代理。

> [!TIP]
> 批量读数据时把 `typeMap` 设为 `array`，文档就以纯数组形式一次传回，不会产生成百上千个远程代理，写法见[完整示例](#完整示例)。

> [!WARNING]
> 遍历大结果集代价很高：`foreach` 每走一步是一次往返，读每个字段又是一次。优先用 `find(...)->toArray()` 配合 `typeMap`，让服务端一次把整个数组传回。

### 对象生命周期

- 本地代理对象销毁时，远端对象随之释放；释放请求会攒批（16 个）或延迟 `100ms` 由定时器发出，不是立即同步执行。
- 客户端连接关闭时，服务端释放这条连接上创建的全部对象。
- 长期持有代理对象会让远端对象和连接一直不释放，不需要手动释放，也不要把它塞进跨请求的全局容器。

## RemoteObject 客户端

`Swoole\RemoteObject\Client` 是代理背后的传输层。直接用 `MongoDB\Client` 时不需要碰它；要构造 BSON 对象、调用远端函数、或连接自己部署的服务端时才用到。

### create

在服务端创建一个对象，返回它的本地代理。

```php
public function create(string $class, mixed ...$args): RemoteObject
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$class` | 要在服务端实例化的类名 | 必填 |
| `...$args` | 传给该类构造函数的参数 | 无 |

**返回值**：返回一个 `Swoole\RemoteObject` 代理对象，之后对它的调用都会转发到服务端的那个实例。用法见[构造 BSON 对象](#构造-bson-对象)。

### call

在服务端调用一个全局函数。

```php
public function call(string $fn, mixed ...$args): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fn` | 函数名 | 必填 |
| `...$args` | 传给该函数的参数 | 无 |

**返回值**：返回函数在服务端的执行结果，结果是对象时同样包装成远程代理。用法见[远端函数与探活](#远端函数与探活)。

> [!NOTE]
> 函数在服务端进程里执行，参数和返回值都要能序列化，闭包传不过去。

### ping

检测服务端是否可用。

```php
public function ping(): bool
```

无参数。

**返回值**：服务端正常应答返回 `true`，请求失败或抛出异常返回 `false`。用法见[远端函数与探活](#远端函数与探活)。

## 自定义服务端

默认服务端由 Swoole 自动启动：工作目录是 `HOME`（取不到时用 `sys_get_temp_dir()`）下的 `.swoole`，以守护进程方式监听 Unix Socket `remote-object-server.sock`，默认线程模式、`128` 个工作线程（不支持 `SWOOLE_THREAD` 时退回 `SWOOLE_BASE`、`8` 个），目录里同时留下 `remote-object-server.php`、`.pid`、`.log`、`.lock` 四个文件。

需要独立部署、改成 TCP 监听、或加鉴权时，自己启动服务端。

### 启动服务端

```php
<?php
use Swoole\RemoteObject\Server;

require __DIR__ . '/vendor/autoload.php';

$server = new Server(options: [
    'worker_num' => 2,
    'server_mode' => SWOOLE_THREAD, // 线程模式，ps aux 只看到一个进程，比 SWOOLE_BASE / SWOOLE_PROCESS 更优雅
    'enable_coroutine' => false, // 服务端跑的是同步阻塞的 mongodb 扩展，不需要协程环境
    'bootstrap' => __FILE__,
    'pid_file' => __DIR__ . '/server.pid',
]);

$server->start();
```

`Server` 的构造签名是 `__construct(string $host = '127.0.0.1', int $port = self::DEFAULT_PORT, array $options = [])`，`DEFAULT_PORT` 为 `9567`，不传 `$host`、`$port` 时监听 TCP `9567`。`options` 里除了上面几项，还可以传：

- `api_key`：鉴权密钥，客户端必须带相同的 `api_key`，否则服务端回 `403`。
- `allowed_classes`、`allowed_functions`：白名单数组，限制 [`create`](#create) 能实例化的类和 [`call`](#call) 能调用的函数；不传则不限制。
- 其余键原样交给 `Swoole\Server::set`，例如 `log_file`、`dispatch_mode`。

> [!IMPORTANT]
> `server_mode` 用 `SWOOLE_PROCESS` 时，`dispatch_mode` 必须是 `SWOOLE_DISPATCH_FDMOD` 且不能设 `dispatch_func`，否则构造直接抛异常。远程对象绑定在连接上，换一种分发方式会找不到对象。

### 连接服务端

```php
<?php
use Swoole\RemoteObject\Client;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Client('127.0.0.1', 9567);
    $mongo = $client->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->myDatabase->users;

    $collection->insertOne([
        'name' => '张三',
        'email' => 'zhangsan@example.com',
        'age' => 25,
        'created_at' => $client->create(MongoDB\BSON\UTCDateTime::class, time() * 1000),
    ]);
    echo "inserted\n";
});
```

连 Unix Socket 时把第一个参数换成 `'unix://' . $dir . '/remote-object-server.sock'` 即可。服务端设了 `api_key` 时，客户端第三个参数传 `['api_key' => '...']`。

> [!NOTE]
> 也可以不写这段代码，用[库选项](#库选项)里的 `mongodb_remote_object_client` 把自己创建的 `Client` 注入给 `Swoole\MongoDB\Client`，这样业务代码继续用 `new MongoDB\Client(...)`。

## 库选项

库选项是内置库的全局配置，用下面两个函数读写，必须在第一次使用 MongoDB 客户端**之前**设置。

### swoole_library_set_option

设置单个库选项。

```php
function swoole_library_set_option(string $key, mixed $value): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 选项名，见[选项一览](#选项一览) | 必填 |
| `$value` | 选项值 | 必填 |

**返回值**：无返回值。

**示例**

```php
<?php
use function Swoole\Coroutine\run;

// 必须在第一次使用 MongoDB 客户端之前设置
swoole_library_set_option('default_remote_object_server_dir', '/data/swoole');
swoole_library_set_option('default_remote_object_server_verbose', true);

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
    echo 'count: ', $client->selectCollection('demo', 'users')->countDocuments(), "\n";
});
```

目录不存在时会自动递归创建，但父路径必须可写——服务端要在里面建 socket、pid、log、lock 并安装 Composer 依赖。开启 `verbose` 后启动过程会打印到标准输出，便于排查首次启动失败。

### swoole_library_set_options

一次性设置全部库选项。

```php
function swoole_library_set_options(array $options): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$options` | 选项名到选项值的映射 | 必填 |

**返回值**：无返回值。

> [!WARNING]
> 这是**整体覆盖**而不是合并，之前用 `swoole_library_set_option` 设过的选项会被清掉。

对应的读取函数是 `swoole_library_get_option(string $key): mixed`（取单个，不存在返回 `null`）和 `swoole_library_get_options(): array`（取全部）。

**示例**

```php
<?php
use function Swoole\Coroutine\run;

swoole_library_set_option('default_remote_object_server_verbose', true);

// 整体覆盖：上面设的 verbose 被清掉
swoole_library_set_options([
    'default_remote_object_server_dir' => '/data/swoole',
    'default_remote_object_server_worker_num' => 32,
]);
var_dump(swoole_library_get_option('default_remote_object_server_verbose'));

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
    echo 'count: ', $client->selectCollection('demo', 'users')->countDocuments(), "\n";
});
```

`var_dump` 输出 `NULL`，不是 `bool(false)`：被覆盖掉的选项是「不存在」，读取时返回 `null`，服务端再按[选项一览](#选项一览)里的默认值处理。

### 选项一览

| 选项 | 说明 | 默认值 |
|:---|:---|:---|
| `default_remote_object_server_dir` | 服务端工作目录，socket、pid、log、lock 与自动安装的 Composer 依赖都放这里 | `HOME` 下的 `.swoole`，取不到 `HOME` 时用 `sys_get_temp_dir()` |
| `default_remote_object_server_verbose` | 是否把服务端启动过程打印到标准输出 | `false` |
| `default_remote_object_server_worker_num` | 服务端工作线程数 | `128`，不支持 `SWOOLE_THREAD` 时为 `8` |
| `default_remote_object_server_options` | 直接指定服务端 `options` 数组，设了它就不再套用上面两项的默认值 | 空 |
| `mongodb_remote_object_client` | 指定 `Swoole\MongoDB\Client` 使用的 `Swoole\RemoteObject\Client` 实例 | `null`，用默认服务端 |

## 异常

服务端抛出的异常不会原样传回，而是包装成 `Swoole\RemoteObject\Exception`（继承 `RuntimeException`），消息带 `Server Error: ` 前缀。原始异常的类名和错误码用下面两个方法取。

### getRemoteClass

```php
public function getRemoteClass(): ?string
```

无参数。

**返回值**：返回服务端捕获的异常类名，例如 `MongoDB\Driver\Exception\ConnectionTimeoutException`；错误来自服务端自身（如非法请求、api key 不对）时返回 `null`。

### getRemoteCode

```php
public function getRemoteCode(): int|string|null
```

无参数。

**返回值**：返回服务端异常的原始错误码，可能是整数也可能是字符串；错误来自服务端自身时返回 `null`。

> [!NOTE]
> `getCode()` 只在原始码是整数时才等于它，字符串码（例如 PDO 的 SQLSTATE）会被置为 `0`，所以判断远端错误类型要用 `getRemoteClass()` 和 `getRemoteCode()`。

## 注意事项

- **别名可能不生效**：先加载了 Composer 的 `mongodb/mongodb` 再开 hook，`MongoDB\Client` 就还是原生阻塞类，见[工作原理](#工作原理)。
- **必须在协程内**：协程外构造或调用会触发 `API must be called in the coroutine` 致命错误。
- **同一实例串行**：一个 `Client` 的远程调用被通道锁排队，并发场景每协程各建一个，或用[连接池与 HTTP 服务](#连接池与-http-服务)里的池化写法。
- **回调传不过去**：接收 `callable` 的远程方法（如 `MongoDB\Driver\Session::withTransaction()`）会在本地抛 `Serialization of 'Closure' is not allowed`，见[使用示例](#使用示例)。
- **BSON 对象仍是代理**：`_id`、`UTCDateTime` 这类值传回本地是远程代理，`json_encode` 得不到内容，用 `projection` 排除或 `(string)` 显式转换（一次额外往返）。
- **别在本地引用库的类常量**：`MongoDB\Collection::RETURN_DOCUMENT_AFTER` 这类常量要求本地加载了 `mongodb/mongodb`，而依赖可能只装在服务端工作目录里，直接写值（如 `['returnDocument' => 2]`）更稳；`MongoDB\Client::class` 不受影响，`::class` 不触发自动加载。
- **服务端是常驻守护进程**：改了服务端代码或依赖不会自动生效，按 `.pid` 文件里的进程号停掉它，下次使用时会重新拉起。
- **首次启动可能较慢**：要自动执行 `composer require mongodb/mongodb` 并等待 socket 就绪，之后的调用不再有这段开销。
- **代理对象不能跨业务进程传递**：序列化后只有服务端能把它还原成真实对象；传到另一个 PHP 业务进程时找不到对应的客户端，再调用会抛 `This remote object is not bound to a client`。

## 使用示例

完整流程见[完整示例](#完整示例)，下面按场景拆分。所有示例都假设 MongoDB 监听在 `127.0.0.1:27017`，且已按[安装依赖](#安装依赖)装好扩展与库，每个脚本都可以单独存成 `.php` 文件运行。

> [!WARNING]
> 接收回调的远程方法不能用，典型的是 `MongoDB\Driver\Session::withTransaction(callable $callback)`。参数要 `serialize()` 后跨进程发送，闭包无法序列化，本地就会抛出 `Serialization of 'Closure' is not allowed`。事务改用[事务](#事务)里的显式写法。在本地协程里执行的回调不受影响，例如[连接池与 HTTP 服务](#连接池与-http-服务)中的 `withConnection`。

### 列出数据库

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new MongoDB\Client('mongodb://127.0.0.1:27017');
    foreach ($client->listDatabases() as $database) {
        echo $database->getName(), ': ', $database->getSizeOnDisk(), " bytes\n";
    }
});
```

### 增删改查

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    // typeMap 让文档以纯数组返回，避免每个字段都变成一次远程调用
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );
    $collection = $client->selectCollection('demo', 'users');

    $insertResult = $collection->insertOne([
        'name' => '张三',
        'email' => 'zhangsan@example.com',
        'age' => 25,
    ]);
    echo 'inserted: ', $insertResult->getInsertedId(), "\n";

    $document = $collection->findOne(['name' => '张三']);
    echo 'email: ', $document['email'], "\n";

    $updateResult = $collection->updateOne(['name' => '张三'], ['$set' => ['age' => 26]]);
    echo 'modified: ', $updateResult->getModifiedCount(), "\n";

    echo 'count: ', $collection->countDocuments(['name' => '张三']), "\n";

    foreach ($collection->find(['age' => ['$gte' => 18]])->toArray() as $row) {
        echo $row['name'], ' ', $row['age'], "\n";
    }

    $deleteResult = $collection->deleteOne(['name' => '张三']);
    echo 'deleted: ', $deleteResult->getDeletedCount(), "\n";
});
```

### 事务

`startSession()` 返回的会话是一个远程代理，把它放进选项数组传回去时，服务端会还原成同一个真实会话对象，因此事务可以跨多次调用保持。

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );
    $accounts = $client->selectCollection('demo', 'accounts');
    $accounts->deleteMany([]);
    $accounts->insertMany([
        ['name' => 'a', 'balance' => 100],
        ['name' => 'b', 'balance' => 0],
    ]);

    $session = $client->startSession();
    $session->startTransaction();
    try {
        $accounts->updateOne(['name' => 'a'], ['$inc' => ['balance' => -30]], ['session' => $session]);
        $accounts->updateOne(['name' => 'b'], ['$inc' => ['balance' => 30]], ['session' => $session]);
        $session->commitTransaction();
        echo "committed\n";
    } catch (Throwable $e) {
        $session->abortTransaction();
        echo 'aborted: ', $e->getMessage(), "\n";
    }

    foreach ($accounts->find([], ['sort' => ['name' => 1]])->toArray() as $row) {
        echo $row['name'], ' ', $row['balance'], "\n";
    }
});
```

输出：

```text
committed
a 70
b 30
```

> [!IMPORTANT]
> 事务要求 MongoDB 是副本集或分片集群，单机 `mongod` 不支持，`startTransaction()` 会直接抛异常。本地验证可以先用 `mongod --replSet rs0` 启动再执行一次 `rs.initiate()`。

> [!WARNING]
> 不要改成 `$session->withTransaction(function () { ... })`，闭包传不过去，原因见[使用示例](#使用示例)开头的说明。

### 构造 BSON 对象

`MongoDB\BSON\UTCDateTime` 这类值对象用 [`create`](#create) 在服务端构造，再作为参数传给集合方法。

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $remote = swoole_get_default_remote_object_client();
    $mongo = $remote->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->selectCollection('demo', 'events');

    $collection->insertOne([
        'name' => 'login',
        'created_at' => $remote->create(MongoDB\BSON\UTCDateTime::class, time() * 1000),
    ]);
    echo "inserted\n";
});
```

> [!NOTE]
> `swoole_get_default_remote_object_client()` 返回一个连接默认服务端的 [`Swoole\RemoteObject\Client`](#remoteobject-客户端)，每次调用都是新实例。

### 协程并发

同一个 `Client` 实例内部有一把通道锁，它的远程调用是**串行**的：多个协程共用一个实例不会出错，但会排队。要真正并发，每个协程各自创建客户端。

```php
<?php
use Swoole\Coroutine\WaitGroup;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\defer;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $wg = new WaitGroup();
    $counts = [];
    foreach (['users', 'orders', 'logs'] as $name) {
        $wg->add();
        go(function () use ($wg, $name, &$counts) {
            defer(fn () => $wg->done());
            $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
            $counts[$name] = $client->selectCollection('demo', $name)->countDocuments();
        });
    }
    $wg->wait();
    foreach ($counts as $name => $count) {
        echo $name, ': ', $count, "\n";
    }
});
```

[等待组](/zh/coroutine/waitGroup.html) 用来等三个协程都写完再输出。

### 连接池与 HTTP 服务

每个协程各建一个客户端才能并发，但每次请求都新建连接又太贵。用[通用连接池](/zh/pool/common.html)把客户端池化：池里每个 `Swoole\MongoDB\Client` 各有一条到服务端的连接，借出期间独占，请求之间就是真并发。

```php
<?php
use Swoole\ConnectionPool;
use Swoole\Coroutine\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $pool = new ConnectionPool(function () {
        return new Swoole\MongoDB\Client(
            'mongodb://127.0.0.1:27017',
            [],
            ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
        );
    }, 16);

    // 先备一条数据，方便验证
    $pool->withConnection(function ($client) {
        $users = $client->selectCollection('demo', 'users');
        $users->deleteMany([]);
        $users->insertOne(['name' => '张三', 'email' => 'zhangsan@example.com', 'age' => 25]);
    });

    $server = new Server('127.0.0.1', 9501, false);
    $server->handle('/', function (Request $request, Response $response) use ($pool) {
        $name = $request->get['name'] ?? '张三';
        // 回调在本地协程里执行，不会被序列化；正常返回或抛异常都会自动归还连接
        $user = $pool->withConnection(function ($client) use ($name) {
            return $client->selectCollection('demo', 'users')
                ->findOne(['name' => $name], ['projection' => ['_id' => 0]]);
        });
        $response->header('Content-Type', 'application/json; charset=utf-8');
        $response->end(json_encode($user ?? [], JSON_UNESCAPED_UNICODE));
    });
    $server->start();
});
```

另开一个终端验证：

```shell
curl 'http://127.0.0.1:9501/?name=张三'
```

返回 `{"name":"张三","email":"zhangsan@example.com","age":25}`；查不到时返回 `{}`。

> [!NOTE]
> 池容量就是同时能执行的 MongoDB 调用数上限，超出的请求会在 `withConnection` 里排队。回调内不要再向同一个池借第二个连接，需要嵌套时给它设超时，规则见 [`withConnection`](/zh/pool/common.html#withconnection)。

> [!TIP]
> 这里必须用 `projection` 排除 `_id`，否则文档里的 `ObjectId` 会变成远程代理，`json_encode` 只会得到 `{}`。确实要输出 id 时写 `(string) $document['_id']`，那是一次额外往返。

### 远端函数与探活

不经过 MongoDB，直接用传输层在服务端进程里执行函数。

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $remote = swoole_get_default_remote_object_client();
    var_dump($remote->ping());
    echo 'local pid: ', getmypid(), "\n";
    echo 'remote pid: ', $remote->call('getmypid'), "\n";
    echo 'server os: ', $remote->call('php_uname', 's'), "\n";
});
```

`ping()` 输出 `bool(true)`，两个进程号不同——这就是「调用发生在另一个进程」最直接的证据，`server os` 是服务端所在机器的系统名（如 `Linux`）。

> [!WARNING]
> 自动启动的默认服务端不设白名单，[`call`](#call) 能调用服务端的任意全局函数。对外暴露或自己部署时，用[自定义服务端](#自定义服务端)的 `allowed_functions`、`allowed_classes` 收紧，并配上 `api_key`。