# Context

`Swoole\NameResolver\Context` 是名字解析的上下文对象，用于指定期望的 `IP` 族，以及解析结果是否附带端口。

> [!NOTE]
> `Context` 不可序列化、不可克隆，也不能动态 unset 属性。

## __construct

```php
public function __construct(int $family = AF_INET, bool $withPort = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$family` | 期望的 `IP` 族，通常使用 `AF_INET`（`IPv4`）或 `AF_INET6`（`IPv6`） | `AF_INET` |
| `$withPort` | 为 `true` 时解析结果附带端口；客户端 `connect` 时会用解析出的端口覆盖目标端口 | `false` |

**端口格式**

- `IPv4`：`ip:port`，例如 `127.0.0.2:8080`。
- `IPv6`：协程 `Socket` 内部使用 `ip@port` 形式分隔地址和端口。

> [!WARNING]
> 同一个 `Context` 对象不要用于解析不同的名字。解析器返回 [Cluster](/zh/name_resolver/cluster.html) 时，`Context` 会缓存该集群并逐个弹出节点；节点未耗尽时再次调用 `swoole_name_resolver_lookup` 不会重新查询解析器，而是继续消费旧集群。每次解析不同名字请使用新的 `Context`。

**示例**

```php
<?php
use Swoole\NameResolver\Context;

$ctx = new Context(AF_INET, true);
$addr = swoole_name_resolver_lookup('my-service', $ctx);
var_dump($addr); // 形如 '127.0.0.2:8080'
```