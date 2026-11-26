# Context

`Swoole\NameResolver\Context` is the second argument you pass when **manually** calling [swoole_name_resolver_lookup](/en/name_resolver/functions.html#swoole-name-resolver-lookup). It tells the underlying layer two things: whether you want `IPv4` or `IPv6`, and whether the result should include the port.

> [!TIP]
> When a client automatically `connect`s to a domain name, the underlying layer creates its own `Context`, so you usually do not need to `new` one yourself. For example, when `Co\Http\Client` is given port `0`, the underlying layer automatically sets `withPort` to `true`. You only construct a `Context` manually when you want to "resolve the address first, then decide how to connect yourself".

## What It Is For: withPort Compared

The most typical use is with clients like `Co\Socket` that need to obtain `IP:port` themselves.

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

// Default withPort=false: only the IP
var_dump(swoole_name_resolver_lookup('user_service', new Context()));              // '127.0.0.1'
// withPort=true: IP:port
var_dump(swoole_name_resolver_lookup('user_service', new Context(AF_INET, true))); // '127.0.0.1:9501'

// Connect manually using the result with the port
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
> `withPort` only takes effect for resolvers that return a [Cluster](/en/name_resolver/cluster.html) (the port is appended when a node is popped). When a resolver returns a string directly, it is returned as-is and the port is up to the resolver.

## family

`$family` is `AF_INET` (`IPv4`) or `AF_INET6` (`IPv6`). It mainly affects the `DNS` fallback record type (`A` / `AAAA`) **when all resolvers come up empty**. The result returned by a `PHP` resolver itself is not constrained by it.

## __construct

```php
public function __construct(int $family = AF_INET, bool $withPort = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$family` | The desired `IP` family, `AF_INET` or `AF_INET6` | `AF_INET` |
| `$withPort` | Whether the result includes the port (only for resolvers returning a `Cluster`) | `false` |

**Port format**

- `IPv4`: `ip:port`, e.g. `127.0.0.1:9501`.
- `IPv6`: coroutine `Socket` internally uses `ip@port` to separate the address and port.

> [!WARNING]
> Do not reuse the same `Context` to resolve different names. When a resolver returns a `Cluster`, the `Context` caches that cluster and pops nodes one by one; while nodes remain, calling `lookup` again does not re-query the resolver but keeps consuming the old cluster. Use a fresh `Context` for each different name.

> [!NOTE]
> `Context` is not serializable, not cloneable, and its properties cannot be dynamically unset.