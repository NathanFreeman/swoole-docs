# Context

`Swoole\NameResolver\Context` is the name resolution context object. It specifies the desired `IP` family and whether the resolution result includes a port.

> [!NOTE]
> `Context` is not serializable, not cloneable, and does not allow dynamically unsetting properties.

## __construct

```php
public function __construct(int $family = AF_INET, bool $withPort = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$family` | The desired `IP` family, typically `AF_INET` (`IPv4`) or `AF_INET6` (`IPv6`) | `AF_INET` |
| `$withPort` | When `true`, the resolution result includes a port; the client's `connect` overrides the target port with the resolved port | `false` |

**Port formats**

- `IPv4`: `ip:port`, for example `127.0.0.2:8080`.
- `IPv6`: coroutine `Socket` internally uses the `ip@port` form to separate the address and port.

> [!WARNING]
> Do not reuse the same `Context` object to resolve different names. When a resolver returns a [Cluster](/en/name_resolver/cluster.html), the `Context` caches that cluster and pops nodes one by one; while nodes remain, calling `swoole_name_resolver_lookup` again does not re-query the resolver but keeps consuming the old cluster. Use a new `Context` for each different name.

**Example**

```php
<?php
use Swoole\NameResolver\Context;

$ctx = new Context(AF_INET, true);
$addr = swoole_name_resolver_lookup('my-service', $ctx);
var_dump($addr); // e.g. '127.0.0.2:8080'
```