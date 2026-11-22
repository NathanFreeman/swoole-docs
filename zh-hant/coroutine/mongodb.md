# MongoDB 協程化

`mongodb` 擴展是同步阻塞的，無法像 `PDO`、`Redis` 那樣直接 hook 它的函數。Swoole 的做法是換掉客戶端類：把 `MongoDB\Client` 變成代理類 `Swoole\MongoDB\Client`，真正的驅動對象跑在一個獨立的常駐進程裏，代理通過 Unix Socket 把每次調用轉發過去。協程只在等待 socket 響應時讓出，MongoDB 操作因此不再阻塞整個進程。

> [!IMPORTANT]
> 使用前提：`swoole` ≥ `6.2`、`PHP` ≥ `8.2`、`php.ini` 中 `swoole.enable_library=On`（默認開啓，設爲 `Off` 時 `SWOOLE_HOOK_MONGODB` 會被直接丟棄）；設置 hook 必須在主線程且尚未創建任何子線程時進行；客戶端的構造與調用都必須在協程內。

## 完整示例

下面這個腳本可以直接保存運行：連接 MongoDB、批量寫入、建索引、查詢更新、upsert、分頁、聚合統計、捕獲異常，最後清理數據，每一步都打印結果。

**準備一個 MongoDB**（已有可跳過）：

```shell
docker run -d --name mongo -p 27017:27017 mongo:7
```

**裝依賴**：

```shell
pecl install mongodb
composer require mongodb/mongodb
```

**保存爲 `demo.php`**：

```php
<?php
declare(strict_types=1);

use Swoole\RemoteObject\Exception;
use function Swoole\Coroutine\run;

// SWOOLE_HOOK_ALL 不包含 SWOOLE_HOOK_MONGODB，必須顯式或上去
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    // 必須在協程內 new。typeMap 讓文檔以純數組返回，否則每個字段都是一次遠程調用
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );

    // 選庫選集合，庫和集合不存在時會在第一次寫入時自動創建
    $articles = $client->selectCollection('demo', 'articles');

    // 從乾淨狀態開始，腳本可以反覆運行
    $articles->deleteMany([]);

    $inserted = $articles->insertMany([
        ['title' => '協程入門', 'tag' => 'php', 'views' => 120],
        ['title' => '連接池實踐', 'tag' => 'php', 'views' => 340],
        ['title' => 'MQTT 服務器', 'tag' => 'iot', 'views' => 80],
        ['title' => 'HTTP 服務', 'tag' => 'php', 'views' => 560],
        ['title' => '定時器', 'tag' => 'php', 'views' => 45],
    ]);
    echo '1. 寫入 ', count($inserted->getInsertedIds()), " 條\n";

    echo '2. 索引 ', $articles->createIndex(['views' => -1]), "\n";

    $one = $articles->findOne(['title' => '協程入門']);
    echo '3. 查到 ', $one['title'], ' views=', $one['views'], "\n";
    $articles->updateOne(['title' => '協程入門'], ['$inc' => ['views' => 1]]);

    // upsert：匹配不到就插入一條
    $articles->updateOne(
        ['title' => '線程池'],
        ['$set' => ['tag' => 'php', 'views' => 0]],
        ['upsert' => true]
    );
    echo '4. 現有 ', $articles->countDocuments(), " 條\n";

    // php 標籤按 views 倒序，取第 2 頁、每頁 2 條；排除 _id 省掉一次遠程調用
    $page = $articles->find(['tag' => 'php'], [
        'projection' => ['_id' => 0, 'title' => 1, 'views' => 1],
        'sort' => ['views' => -1],
        'skip' => 2,
        'limit' => 2,
    ])->toArray();
    echo "5. 第 2 頁：\n";
    foreach ($page as $row) {
        echo '   ', $row['title'], ' ', $row['views'], "\n";
    }

    // 聚合管道整個數組一次發過去，在服務端算完再一次性傳回
    $stats = $articles->aggregate([
        ['$group' => ['_id' => '$tag', 'total' => ['$sum' => '$views'], 'count' => ['$sum' => 1]]],
        ['$sort' => ['total' => -1]],
    ])->toArray();
    echo "6. 聚合：\n";
    foreach ($stats as $row) {
        echo '   ', $row['_id'], ' total=', $row['total'], ' count=', $row['count'], "\n";
    }

    // 服務端拋出的異常統一包裝成 Swoole\RemoteObject\Exception
    try {
        $articles->insertOne(['_id' => 'dup']);
        $articles->insertOne(['_id' => 'dup']);
    } catch (Exception $e) {
        echo '7. 捕獲 ', $e->getRemoteClass(), ' code=', $e->getRemoteCode(), "\n";
    }

    echo '8. 刪除 ', $articles->deleteMany([])->getDeletedCount(), " 條\n";
});
```

**運行**：

```shell
php demo.php
```

預期輸出：

```text
1. 寫入 5 條
2. 索引 views_-1
3. 查到 協程入門 views=120
4. 現有 6 條
5. 第 2 頁：
   協程入門 121
   定時器 45
6. 聚合：
   php total=1066 count=5
   iot total=80 count=1
7. 捕獲 MongoDB\Driver\Exception\BulkWriteException code=11000
8. 刪除 7 條
```

> [!NOTE]
> 首次運行會多花幾秒：Swoole 要自動拉起常駐的服務端進程，`mongodb/mongodb` 沒裝時還會先執行一次 `composer require`。之後的運行不再有這段開銷。

> [!TIP]
> 把 `new Swoole\MongoDB\Client(...)` 換成 `new MongoDB\Client(...)` 效果完全一樣，前提是 Composer 的自動加載沒有先把原生 `MongoDB\Client` 加載進來，原因見[工作原理](#工作原理)。

## 工作原理

整個過程分三步：

- **註冊類別名**：開啓 [`SWOOLE_HOOK_MONGODB`](#swoole-hook-mongodb) 後，Swoole 把 `MongoDB\Client` 註冊爲 `Swoole\MongoDB\Client` 的別名，原有代碼裏的 `new MongoDB\Client(...)` 一行不改就變成協程版。
- **轉發調用**：代理類自己不連接 MongoDB，它把方法調用、屬性讀寫、數組訪問、遍歷序列化後發給遠程對象服務（remote object server）。
- **獨立進程執行**：服務端持有真正的 `\MongoDB\Client`，阻塞的驅動調用發生在那裏，結果再序列化回來。

服務端在第一次使用時自動啓動並常駐，不需要手工部署；要自己接管時見[自定義服務端](#自定義服務端)。

> [!WARNING]
> `SWOOLE_HOOK_ALL` **不包含** `SWOOLE_HOOK_MONGODB`，必須顯式按位或上去：`SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB`。

> [!NOTE]
> 別名只在 `MongoDB\Client` 這個類**尚未被加載**時註冊。如果先 `require vendor/autoload.php` 且項目裏裝了 `mongodb/mongodb`，`new MongoDB\Client(...)` 拿到的仍是原生阻塞客戶端，這時必須顯式寫 `new Swoole\MongoDB\Client(...)`。

## 安裝依賴

```shell
pecl install mongodb
composer require mongodb/mongodb
```

`mongodb` 擴展裝在當前 PHP 上即可，自動啓動的服務端進程用的就是 `PHP_BINARY`。

> [!NOTE]
> `mongodb/mongodb` 庫沒裝也可以：首次啓動服務端時，Swoole 會在服務端工作目錄裏自動執行 `composer require mongodb/mongodb`。這要求 `composer` 在 `PATH` 中且能訪問網絡，否則請自己先裝好。

## SWOOLE_HOOK_MONGODB

協程化 `MongoDB` 客戶端的 hook 標誌，值爲 `1 << 22`。

```php
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);
```

開啓後 `MongoDB\Client` 成爲 [`Client`](#client) 的別名。也可以不依賴別名，直接實例化 `Swoole\MongoDB\Client`，兩者完全等價。

> [!NOTE]
> 這個標誌只負責註冊類別名和觸發服務端的依賴安裝，不會 hook `mongodb` 擴展的任何函數。直接使用 `MongoDB\Driver\Manager` 等底層類仍然是阻塞的。

## Client

`Swoole\MongoDB\Client` 是 `MongoDB\Client` 的協程代理。它只聲明瞭 [`__construct`](#construct)，其餘調用全部由 `Swoole\RemoteObject\ProxyTrait` 轉發到遠端的真實對象，所以原生 `MongoDB\Client` 的 API（`selectDatabase`、`selectCollection`、`listDatabases`、用 `__get` 取庫等）都能照常使用。

### __construct

創建一個 MongoDB 協程客戶端，同時在服務端創建對應的 `\MongoDB\Client` 對象。

```php
public function __construct(?string $uri = self::DEFAULT_URI, array $uriOptions = [], array $driverOptions = [])
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$uri` | 連接串，格式與原生 `MongoDB\Client` 完全一致 | `'mongodb://127.0.0.1/'`（`Client::DEFAULT_URI`） |
| `$uriOptions` | 連接串選項，會覆蓋 `$uri` 裏的同名查詢參數 | `[]` |
| `$driverOptions` | 驅動選項，例如 `typeMap`，見[調用轉發](#調用轉發) | `[]` |

> [!NOTE]
> 構造即發起一次遠程調用，因此必須在協程內 `new`。構造失敗拋出 [`Swoole\RemoteObject\Exception`](#異常)。

### 調用轉發

代理對象上的每一種操作都是一次進程間往返：

| 寫法 | 實際發生的事 |
|:---|:---|
| `$client->selectCollection('demo', 'users')` | 轉發方法調用，返回的 `Collection` 也是一個遠程代理 |
| `$client->demo` | 轉發屬性讀取，等價於 `selectDatabase('demo')` |
| `$collection->insertOne([...])` | 參數數組序列化後發送，返回的 `InsertOneResult` 是遠程代理 |
| `$document['name']` | 轉發數組訪問，一次往返 |
| `foreach ($cursor as $document)` | `rewind`、`valid`、`current`、`key`、`next` 各是一次往返 |
| `count($cursor)` | 轉發 `count` 調用，一次往返 |

**返回值規則**：服務端返回的標量和數組按值傳回本地；返回的對象（包括數組裏嵌套的對象）不會傳回，而是登記在服務端並包裝成一個新的遠程代理。

> [!TIP]
> 批量讀數據時把 `typeMap` 設爲 `array`，文檔就以純數組形式一次傳回，不會產生成百上千個遠程代理，寫法見[完整示例](#完整示例)。

> [!WARNING]
> 遍歷大結果集代價很高：`foreach` 每走一步是一次往返，讀每個字段又是一次。優先用 `find(...)->toArray()` 配合 `typeMap`，讓服務端一次把整個數組傳回。

### 對象生命週期

- 本地代理對象銷燬時，遠端對象隨之釋放；釋放請求會攢批（16 個）或延遲 `100ms` 由定時器發出，不是立即同步執行。
- 客戶端連接關閉時，服務端釋放這條連接上創建的全部對象。
- 長期持有代理對象會讓遠端對象和連接一直不釋放，不需要手動釋放，也不要把它塞進跨請求的全局容器。

## RemoteObject 客戶端

`Swoole\RemoteObject\Client` 是代理背後的傳輸層。直接用 `MongoDB\Client` 時不需要碰它；要構造 BSON 對象、調用遠端函數、或連接自己部署的服務端時纔用到。

### create

在服務端創建一個對象，返回它的本地代理。

```php
public function create(string $class, mixed ...$args): RemoteObject
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$class` | 要在服務端實例化的類名 | 必填 |
| `...$args` | 傳給該類構造函數的參數 | 無 |

**返回值**：返回一個 `Swoole\RemoteObject` 代理對象，之後對它的調用都會轉發到服務端的那個實例。用法見[構造 BSON 對象](#構造-bson-對象)。

### call

在服務端調用一個全局函數。

```php
public function call(string $fn, mixed ...$args): mixed
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fn` | 函數名 | 必填 |
| `...$args` | 傳給該函數的參數 | 無 |

**返回值**：返回函數在服務端的執行結果，結果是對象時同樣包裝成遠程代理。用法見[遠端函數與探活](#遠端函數與探活)。

> [!NOTE]
> 函數在服務端進程裏執行，參數和返回值都要能序列化，閉包傳不過去。

### ping

檢測服務端是否可用。

```php
public function ping(): bool
```

無參數。

**返回值**：服務端正常應答返回 `true`，請求失敗或拋出異常返回 `false`。用法見[遠端函數與探活](#遠端函數與探活)。

## 自定義服務端

默認服務端由 Swoole 自動啓動：工作目錄是 `HOME`（取不到時用 `sys_get_temp_dir()`）下的 `.swoole`，以守護進程方式監聽 Unix Socket `remote-object-server.sock`，默認線程模式、`128` 個工作線程（不支持 `SWOOLE_THREAD` 時退回 `SWOOLE_BASE`、`8` 個），目錄裏同時留下 `remote-object-server.php`、`.pid`、`.log`、`.lock` 四個文件。

需要獨立部署、改成 TCP 監聽、或加鑑權時，自己啓動服務端。

### 啓動服務端

```php
<?php
use Swoole\RemoteObject\Server;

require __DIR__ . '/vendor/autoload.php';

$server = new Server(options: [
    'worker_num' => 2,
    'server_mode' => SWOOLE_THREAD, // 線程模式，ps aux 只看到一個進程，比 SWOOLE_BASE / SWOOLE_PROCESS 更優雅
    'enable_coroutine' => false, // 服務端跑的是同步阻塞的 mongodb 擴展，不需要協程環境
    'bootstrap' => __FILE__,
    'pid_file' => __DIR__ . '/server.pid',
]);

$server->start();
```

`Server` 的構造簽名是 `__construct(string $host = '127.0.0.1', int $port = self::DEFAULT_PORT, array $options = [])`，`DEFAULT_PORT` 爲 `9567`，不傳 `$host`、`$port` 時監聽 TCP `9567`。`options` 裏除了上面幾項，還可以傳：

- `api_key`：鑑權密鑰，客戶端必須帶相同的 `api_key`，否則服務端回 `403`。
- `allowed_classes`、`allowed_functions`：白名單數組，限制 [`create`](#create) 能實例化的類和 [`call`](#call) 能調用的函數；不傳則不限制。
- 其餘鍵原樣交給 `Swoole\Server::set`，例如 `log_file`、`dispatch_mode`。

> [!IMPORTANT]
> `server_mode` 用 `SWOOLE_PROCESS` 時，`dispatch_mode` 必須是 `SWOOLE_DISPATCH_FDMOD` 且不能設 `dispatch_func`，否則構造直接拋異常。遠程對象綁定在連接上，換一種分發方式會找不到對象。

### 連接服務端

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
        'name' => '張三',
        'email' => 'zhangsan@example.com',
        'age' => 25,
        'created_at' => $client->create(MongoDB\BSON\UTCDateTime::class, time() * 1000),
    ]);
    echo "inserted\n";
});
```

連 Unix Socket 時把第一個參數換成 `'unix://' . $dir . '/remote-object-server.sock'` 即可。服務端設了 `api_key` 時，客戶端第三個參數傳 `['api_key' => '...']`。

> [!NOTE]
> 也可以不寫這段代碼，用[庫選項](#庫選項)裏的 `mongodb_remote_object_client` 把自己創建的 `Client` 注入給 `Swoole\MongoDB\Client`，這樣業務代碼繼續用 `new MongoDB\Client(...)`。

## 庫選項

庫選項是內置庫的全局配置，用下面兩個函數讀寫，必須在第一次使用 MongoDB 客戶端**之前**設置。

### swoole_library_set_option

設置單個庫選項。

```php
function swoole_library_set_option(string $key, mixed $value): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$key` | 選項名，見[選項一覽](#選項一覽) | 必填 |
| `$value` | 選項值 | 必填 |

**返回值**：無返回值。

**示例**

```php
<?php
use function Swoole\Coroutine\run;

// 必須在第一次使用 MongoDB 客戶端之前設置
swoole_library_set_option('default_remote_object_server_dir', '/data/swoole');
swoole_library_set_option('default_remote_object_server_verbose', true);

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
    echo 'count: ', $client->selectCollection('demo', 'users')->countDocuments(), "\n";
});
```

目錄不存在時會自動遞歸創建，但父路徑必須可寫——服務端要在裏面建 socket、pid、log、lock 並安裝 Composer 依賴。開啓 `verbose` 後啓動過程會打印到標準輸出，便於排查首次啓動失敗。

### swoole_library_set_options

一次性設置全部庫選項。

```php
function swoole_library_set_options(array $options): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$options` | 選項名到選項值的映射 | 必填 |

**返回值**：無返回值。

> [!WARNING]
> 這是**整體覆蓋**而不是合併，之前用 `swoole_library_set_option` 設過的選項會被清掉。

對應的讀取函數是 `swoole_library_get_option(string $key): mixed`（取單個，不存在返回 `null`）和 `swoole_library_get_options(): array`（取全部）。

**示例**

```php
<?php
use function Swoole\Coroutine\run;

swoole_library_set_option('default_remote_object_server_verbose', true);

// 整體覆蓋：上面設的 verbose 被清掉
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

`var_dump` 輸出 `NULL`，不是 `bool(false)`：被覆蓋掉的選項是「不存在」，讀取時返回 `null`，服務端再按[選項一覽](#選項一覽)裏的默認值處理。

### 選項一覽

| 選項 | 說明 | 默認值 |
|:---|:---|:---|
| `default_remote_object_server_dir` | 服務端工作目錄，socket、pid、log、lock 與自動安裝的 Composer 依賴都放這裏 | `HOME` 下的 `.swoole`，取不到 `HOME` 時用 `sys_get_temp_dir()` |
| `default_remote_object_server_verbose` | 是否把服務端啓動過程打印到標準輸出 | `false` |
| `default_remote_object_server_worker_num` | 服務端工作線程數 | `128`，不支持 `SWOOLE_THREAD` 時爲 `8` |
| `default_remote_object_server_options` | 直接指定服務端 `options` 數組，設了它就不再套用上面兩項的默認值 | 空 |
| `mongodb_remote_object_client` | 指定 `Swoole\MongoDB\Client` 使用的 `Swoole\RemoteObject\Client` 實例 | `null`，用默認服務端 |

## 異常

服務端拋出的異常不會原樣傳回，而是包裝成 `Swoole\RemoteObject\Exception`（繼承 `RuntimeException`），消息帶 `Server Error: ` 前綴。原始異常的類名和錯誤碼用下面兩個方法取。

### getRemoteClass

```php
public function getRemoteClass(): ?string
```

無參數。

**返回值**：返回服務端捕獲的異常類名，例如 `MongoDB\Driver\Exception\ConnectionTimeoutException`；錯誤來自服務端自身（如非法請求、api key 不對）時返回 `null`。

### getRemoteCode

```php
public function getRemoteCode(): int|string|null
```

無參數。

**返回值**：返回服務端異常的原始錯誤碼，可能是整數也可能是字符串；錯誤來自服務端自身時返回 `null`。

> [!NOTE]
> `getCode()` 只在原始碼是整數時纔等於它，字符串碼（例如 PDO 的 SQLSTATE）會被置爲 `0`，所以判斷遠端錯誤類型要用 `getRemoteClass()` 和 `getRemoteCode()`。

## 注意事項

- **別名可能不生效**：先加載了 Composer 的 `mongodb/mongodb` 再開 hook，`MongoDB\Client` 就還是原生阻塞類，見[工作原理](#工作原理)。
- **必須在協程內**：協程外構造或調用會觸發 `API must be called in the coroutine` 致命錯誤。
- **同一實例串行**：一個 `Client` 的遠程調用被通道鎖排隊，併發場景每協程各建一個，或用[連接池與 HTTP 服務](#連接池與-http-服務)裏的池化寫法。
- **回調傳不過去**：接收 `callable` 的遠程方法（如 `MongoDB\Driver\Session::withTransaction()`）會在本地拋 `Serialization of 'Closure' is not allowed`，見[使用示例](#使用示例)。
- **BSON 對象仍是代理**：`_id`、`UTCDateTime` 這類值傳回本地是遠程代理，`json_encode` 得不到內容，用 `projection` 排除或 `(string)` 顯式轉換（一次額外往返）。
- **別在本地引用庫的類常量**：`MongoDB\Collection::RETURN_DOCUMENT_AFTER` 這類常量要求本地加載了 `mongodb/mongodb`，而依賴可能只裝在服務端工作目錄裏，直接寫值（如 `['returnDocument' => 2]`）更穩；`MongoDB\Client::class` 不受影響，`::class` 不觸發自動加載。
- **服務端是常駐守護進程**：改了服務端代碼或依賴不會自動生效，按 `.pid` 文件裏的進程號停掉它，下次使用時會重新拉起。
- **首次啓動可能較慢**：要自動執行 `composer require mongodb/mongodb` 並等待 socket 就緒，之後的調用不再有這段開銷。
- **代理對象不能跨業務進程傳遞**：序列化後只有服務端能把它還原成真實對象；傳到另一個 PHP 業務進程時找不到對應的客戶端，再調用會拋 `This remote object is not bound to a client`。

## 使用示例

完整流程見[完整示例](#完整示例)，下面按場景拆分。所有示例都假設 MongoDB 監聽在 `127.0.0.1:27017`，且已按[安裝依賴](#安裝依賴)裝好擴展與庫，每個腳本都可以單獨存成 `.php` 文件運行。

> [!WARNING]
> 接收回調的遠程方法不能用，典型的是 `MongoDB\Driver\Session::withTransaction(callable $callback)`。參數要 `serialize()` 後跨進程發送，閉包無法序列化，本地就會拋出 `Serialization of 'Closure' is not allowed`。事務改用[事務](#事務)裏的顯式寫法。在本地協程裏執行的回調不受影響，例如[連接池與 HTTP 服務](#連接池與-http-服務)中的 `withConnection`。

### 列出數據庫

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

### 增刪改查

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    // typeMap 讓文檔以純數組返回，避免每個字段都變成一次遠程調用
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );
    $collection = $client->selectCollection('demo', 'users');

    $insertResult = $collection->insertOne([
        'name' => '張三',
        'email' => 'zhangsan@example.com',
        'age' => 25,
    ]);
    echo 'inserted: ', $insertResult->getInsertedId(), "\n";

    $document = $collection->findOne(['name' => '張三']);
    echo 'email: ', $document['email'], "\n";

    $updateResult = $collection->updateOne(['name' => '張三'], ['$set' => ['age' => 26]]);
    echo 'modified: ', $updateResult->getModifiedCount(), "\n";

    echo 'count: ', $collection->countDocuments(['name' => '張三']), "\n";

    foreach ($collection->find(['age' => ['$gte' => 18]])->toArray() as $row) {
        echo $row['name'], ' ', $row['age'], "\n";
    }

    $deleteResult = $collection->deleteOne(['name' => '張三']);
    echo 'deleted: ', $deleteResult->getDeletedCount(), "\n";
});
```

### 事務

`startSession()` 返回的會話是一個遠程代理，把它放進選項數組傳回去時，服務端會還原成同一個真實會話對象，因此事務可以跨多次調用保持。

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

輸出：

```text
committed
a 70
b 30
```

> [!IMPORTANT]
> 事務要求 MongoDB 是副本集或分片集羣，單機 `mongod` 不支持，`startTransaction()` 會直接拋異常。本地驗證可以先用 `mongod --replSet rs0` 啓動再執行一次 `rs.initiate()`。

> [!WARNING]
> 不要改成 `$session->withTransaction(function () { ... })`，閉包傳不過去，原因見[使用示例](#使用示例)開頭的說明。

### 構造 BSON 對象

`MongoDB\BSON\UTCDateTime` 這類值對象用 [`create`](#create) 在服務端構造，再作爲參數傳給集合方法。

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
> `swoole_get_default_remote_object_client()` 返回一個連接默認服務端的 [`Swoole\RemoteObject\Client`](#remoteobject-客戶端)，每次調用都是新實例。

### 協程併發

同一個 `Client` 實例內部有一把通道鎖，它的遠程調用是**串行**的：多個協程共用一個實例不會出錯，但會排隊。要真正併發，每個協程各自創建客戶端。

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

[等待組](/zh-hant/coroutine/waitGroup.html) 用來等三個協程都寫完再輸出。

### 連接池與 HTTP 服務

每個協程各建一個客戶端才能併發，但每次請求都新建連接又太貴。用[通用連接池](/zh-hant/pool/common.html)把客戶端池化：池裏每個 `Swoole\MongoDB\Client` 各有一條到服務端的連接，借出期間獨佔，請求之間就是真併發。

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

    // 先備一條數據，方便驗證
    $pool->withConnection(function ($client) {
        $users = $client->selectCollection('demo', 'users');
        $users->deleteMany([]);
        $users->insertOne(['name' => '張三', 'email' => 'zhangsan@example.com', 'age' => 25]);
    });

    $server = new Server('127.0.0.1', 9501, false);
    $server->handle('/', function (Request $request, Response $response) use ($pool) {
        $name = $request->get['name'] ?? '張三';
        // 回調在本地協程裏執行，不會被序列化；正常返回或拋異常都會自動歸還連接
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

另開一個終端驗證：

```shell
curl 'http://127.0.0.1:9501/?name=張三'
```

返回 `{"name":"張三","email":"zhangsan@example.com","age":25}`；查不到時返回 `{}`。

> [!NOTE]
> 池容量就是同時能執行的 MongoDB 調用數上限，超出的請求會在 `withConnection` 裏排隊。回調內不要再向同一個池借第二個連接，需要嵌套時給它設超時，規則見 [`withConnection`](/zh-hant/pool/common.html#withconnection)。

> [!TIP]
> 這裏必須用 `projection` 排除 `_id`，否則文檔裏的 `ObjectId` 會變成遠程代理，`json_encode` 只會得到 `{}`。確實要輸出 id 時寫 `(string) $document['_id']`，那是一次額外往返。

### 遠端函數與探活

不經過 MongoDB，直接用傳輸層在服務端進程裏執行函數。

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

`ping()` 輸出 `bool(true)`，兩個進程號不同——這就是「調用發生在另一個進程」最直接的證據，`server os` 是服務端所在機器的系統名（如 `Linux`）。

> [!WARNING]
> 自動啓動的默認服務端不設白名單，[`call`](#call) 能調用服務端的任意全局函數。對外暴露或自己部署時，用[自定義服務端](#自定義服務端)的 `allowed_functions`、`allowed_classes` 收緊，並配上 `api_key`。