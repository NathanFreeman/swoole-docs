# Context

`Swoole\NameResolver\Context` 是**手动**调用 [swoole_name_resolver_lookup](/zh/name_resolver/functions.html#swoole-name-resolver-lookup) 时传入的第二个参数，告诉底层两件事：要 `IPv4` 还是 `IPv6`、解析结果要不要附带端口。

> [!TIP]
> 客户端自动 `connect` 域名时，底层会自己创建 `Context`，你通常不需要手动 `new`。例如 `Co\Http\Client` 端口传 `0` 时，底层自动把 `withPort` 设为 `true`。只有想「先解析出地址、再自己决定怎么连」时才需要手动构造 `Context`。

## 有什么用：withPort 对照

最典型的用途是配合 `Co\Socket` 这类需要自己拿到 `IP:端口` 的客户端。

```php
<?php
use Swoole\NameResolver\Context;

class ClusterResolver extends Swoole\NameResolver
{
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }

    public function lookup(string $name)
    {
        if ($name !== 'user_service') {
            return null;
        }
        $cluster = new Swoole\NameResolver\Cluster();
        $cluster->add('127.0.0.1', 9501);
        return $cluster;
    }
}
swoole_name_resolver_add(new ClusterResolver());

// 默认 withPort=false：只拿到 IP
var_dump(swoole_name_resolver_lookup('user_service', new Context()));              // '127.0.0.1'
// withPort=true：拿到 IP:端口
var_dump(swoole_name_resolver_lookup('user_service', new Context(AF_INET, true))); // '127.0.0.1:9501'

// 用带端口的结果手动连接
Co\run(function () {
    $addr = swoole_name_resolver_lookup('user_service', new Context(AF_INET, true));
    [$host, $port] = explode(':', $addr);
    $sock = new Co\Socket(AF_INET, SOCK_STREAM, 0);
    $sock->connect($host, (int) $port);
    $sock->send("GET / HTTP/1.0\r\n\r\n");
    echo $sock->recv();
    $sock->close();
});
```

> [!NOTE]
> `withPort` 只对返回 [Cluster](/zh/name_resolver/cluster.html) 的解析器生效（弹出节点时拼上端口）；解析器直接返回字符串时原样返回，端口由解析器自己决定。

## family

`$family` 取 `AF_INET`（`IPv4`）或 `AF_INET6`（`IPv6`），主要影响**所有解析器都落空时**的 `DNS` 回退记录类型（`A` / `AAAA`）。`PHP` 解析器自身返回的结果不受它约束。

## __construct

```php
public function __construct(int $family = AF_INET, bool $withPort = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$family` | 期望的 `IP` 族，`AF_INET` 或 `AF_INET6` | `AF_INET` |
| `$withPort` | 结果是否附带端口（仅对返回 `Cluster` 的解析器生效） | `false` |

**端口格式**

- `IPv4`：`ip:port`，例如 `127.0.0.1:9501`。
- `IPv6`：协程 `Socket` 内部用 `ip@port` 分隔地址和端口。

> [!WARNING]
> 同一个 `Context` 不要用于解析不同的名字。解析器返回 `Cluster` 时，`Context` 会缓存该集群并逐个弹出节点；节点未耗尽时再次 `lookup` 不会重新查询解析器，而是继续消费旧集群。解析不同名字请每次 `new` 新的 `Context`。

> [!NOTE]
> `Context` 不可序列化、不可克隆，也不能动态 unset 属性。