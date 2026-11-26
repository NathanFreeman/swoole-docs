# 註冊與調用

## swoole_name_resolver_add

註冊一個名字解析器，追加到解析器列表末尾。

```php
function swoole_name_resolver_add(Swoole\NameResolver $resolver): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$resolver` | `Swoole\NameResolver` 或其子類的對象 | 必填 |

**返回值**：註冊成功返回 `true`，失敗返回 `false`。

> [!NOTE]
> 傳入對象不是 `Swoole\NameResolver` 實例時會產生警告並返回 `false`。

## swoole_name_resolver_remove

移除一個已註冊的名字解析器，按對象同一性匹配。

```php
function swoole_name_resolver_remove(Swoole\NameResolver $resolver): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$resolver` | 註冊時傳入的同一個對象 | 必填 |

**返回值**：移除成功返回 `true`，失敗返回 `false`。

## swoole_name_resolver_lookup

手動觸發一次名字解析，按註冊順序查詢所有解析器。

```php
function swoole_name_resolver_lookup(string $name, Swoole\NameResolver\Context $ctx): string
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 要解析的名字（域名或服務名） | 必填 |
| `$ctx` | 解析上下文，見 [Context](/zh-hant/name_resolver/context.html) | 必填 |

**返回值**：解析成功返回 `IP` 地址字符串（`withPort` 爲 `true` 時附帶端口）；解析失敗或終止時返回空字符串 `''`。

**示例**

```php
<?php
$resolver = new class extends Swoole\NameResolver {
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }
    public function lookup(string $name) {
        return '127.0.0.2';
    }
};
swoole_name_resolver_add($resolver);

var_dump(swoole_name_resolver_lookup('localhost', new Swoole\NameResolver\Context()));            // '127.0.0.2'
var_dump(swoole_name_resolver_lookup('localhost', new Swoole\NameResolver\Context(AF_INET, true))); // '127.0.0.2'

swoole_name_resolver_remove($resolver);
```

## 通過 name_resolver 選項註冊

也可以在 [Scheduler::set](/zh-hant/coroutine/scheduler.html#set) 或 [Server::set](/zh-hant/server/methods.html#set) 中批量註冊：

```php
<?php
$sch = new Co\Scheduler();
$sch->set([
    'name_resolver' => [
        new Swoole\NameResolver\Redis('redis://127.0.0.1:6379'),
    ],
]);
```

> [!NOTE]
> 選項值必須是 `Swoole\NameResolver` 對象數組，底層會按數組順序依次註冊。