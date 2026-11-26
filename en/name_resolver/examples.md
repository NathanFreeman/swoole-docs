# Usage Examples

Three runnable examples covering custom resolution, `Redis` service discovery, and multi-node load balancing.

> [!NOTE]
> Name resolution only triggers when a coroutine client connects to a **non-IP hostname**; connecting to a literal IP such as `127.0.0.1` bypasses the resolvers.

## Example 1: Map a Service Name to a Fixed Address

Useful for internal calls that use a service name instead of a hardcoded IP.

```php
<?php
class StaticResolver extends Swoole\NameResolver
{
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }

    public function lookup(string $name)
    {
        // Only resolve user_service; return null for other names to fall back to DNS
        return $name === 'user_service' ? '127.0.0.1' : null;
    }
}
swoole_name_resolver_add(new StaticResolver());

Co\run(function () {
    // Connect by service name; the port is still specified by you
    $cli = new Co\Http\Client('user_service', 9501);
    $cli->get('/');
    echo $cli->body;
    $cli->close();
});
```

## Example 2: Redis Service Discovery (Server Registers + Client Connects by Name)

`server.php`: register itself into `Redis` on startup and remove itself on shutdown.

```php
<?php
$resolver = new Swoole\NameResolver\Redis('redis://127.0.0.1:6379');
swoole_name_resolver_add($resolver);

$server = new Swoole\Http\Server('0.0.0.0', 9501);
$server->on('request', function ($req, $resp) {
    $resp->end("hello from user_service\n");
});
$server->on('shutdown', function () use ($resolver) {
    $resolver->leave('user_service', '127.0.0.1', 9501);
});

// Register the node: service name user_service -> 127.0.0.1:9501
$resolver->join('user_service', '127.0.0.1', 9501);
$server->start();
```

`client.php`: knows only the service name, not the real IP or port.

```php
<?php
swoole_name_resolver_add(new Swoole\NameResolver\Redis('redis://127.0.0.1:6379'));

Co\run(function () {
    // Port 0: let the resolver decide the port too (otherwise defaults to 80/443)
    $cli = new Co\Http\Client('user_service', 0);
    $cli->get('/');
    echo $cli->body;   // hello from user_service
    $cli->close();
});
```

> [!TIP]
> When `Co\Http\Client` is given port `0`, the underlying layer enables `withPort`, so the node port returned by the resolver (`9501` here) overrides the default port. With a concrete port, only the IP is resolved and your port is kept.

> [!NOTE]
> Resolving the port along with the address only applies to `Co\Http\Client` with `port = 0`. For `Co\Socket`, `Co\Client`, etc., call [swoole_name_resolver_lookup](/en/name_resolver/functions.html#swoole-name-resolver-lookup) yourself with `new Swoole\NameResolver\Context(AF_INET, true)` to get `IP:port`, then connect.

## Example 3: Load Balancing with a Cluster

When you return a [Cluster](/en/name_resolver/cluster.html), the underlying layer picks a random node on each resolution, achieving load balancing.

```php
<?php
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
        $cluster->add('127.0.0.1', 9502);
        $cluster->add('127.0.0.1', 9503);
        return $cluster;
    }
}
swoole_name_resolver_add(new ClusterResolver());

Co\run(function () {
    // The three requests land on random nodes
    for ($i = 0; $i < 3; $i++) {
        $cli = new Co\Http\Client('user_service', 0);
        $cli->get('/');
        echo $cli->body;
        $cli->close();
    }
});
```

> [!NOTE]
> The underlying layer caches the returned `Cluster` and `pop()`s one node per resolution (random, without replacement); once exhausted it calls `lookup` again to rebuild. Combined with `Co\Http\Client`'s `max_retries`, a failed request re-resolves and retries on another node.