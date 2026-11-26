# 注册与调用

## swoole_name_resolver_add

注册一个名字解析器，追加到解析器列表末尾。

```php
function swoole_name_resolver_add(Swoole\NameResolver $resolver): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$resolver` | `Swoole\NameResolver` 或其子类的对象 | 必填 |

**返回值**：注册成功返回 `true`，失败返回 `false`。

> [!NOTE]
> 传入对象不是 `Swoole\NameResolver` 实例时会产生警告并返回 `false`。

## swoole_name_resolver_remove

移除一个已注册的名字解析器，按对象同一性匹配。

```php
function swoole_name_resolver_remove(Swoole\NameResolver $resolver): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$resolver` | 注册时传入的同一个对象 | 必填 |

**返回值**：移除成功返回 `true`，失败返回 `false`。

## swoole_name_resolver_lookup

手动触发一次名字解析，按注册顺序查询所有解析器。

```php
function swoole_name_resolver_lookup(string $name, Swoole\NameResolver\Context $ctx): string
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 要解析的名字（域名或服务名） | 必填 |
| `$ctx` | 解析上下文，见 [Context](/zh/name_resolver/context.html) | 必填 |

**返回值**：解析成功返回 `IP` 地址字符串（`withPort` 为 `true` 时附带端口）；解析失败或终止时返回空字符串 `''`。

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

## 通过 name_resolver 选项注册

也可以在 [Scheduler::set](/zh/coroutine/scheduler.html#set) 或 [Server::set](/zh/server/methods.html#set) 中批量注册：

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
> 选项值必须是 `Swoole\NameResolver` 对象数组，底层会按数组顺序依次注册。