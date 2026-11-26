# Name Resolver

`Swoole\NameResolver` is used for custom domain name resolution and service discovery. When a coroutine client connects to a domain name, the registered name resolvers are queried in registration order first, and the resolver decides the actual `IP` and port to connect to; if no resolver produces a result, it falls back to ordinary `DNS` resolution.

> [!NOTE]
> The `name_resolver` option is available since Swoole `v5.0.0`.

## How It Works

- The only resolution entry point is coroutine [Socket::connect](/en/client/socket.html#connect). All clients based on coroutine `Socket` (`TCP`, `HTTP`, `Redis`, etc.) go through the name resolvers when connecting to a domain name; with [SWOOLE_HOOK_TCP](/en/coroutine/hook.html#swoole-hook-tcp) enabled, native streams are converted to coroutine `Socket` as well and are indirectly affected by the resolvers.
- Multiple resolvers are queried in **registration order**; the first one returning a non-empty result wins.
- The resolver list is thread-local; `PHP` resolvers are automatically cleared at request shutdown.

> [!TIP]
> [System::gethostbyname](/en/coroutine/system_api.html#gethostbyname) itself does not go through the name resolvers — it is the fallback implementation used when all resolvers come up empty.

## Subpages

- [Usage Examples](/en/name_resolver/examples.html): three complete examples — custom resolution, `Redis` service discovery, and `Cluster` load balancing.
- [Registration and Lookup](/en/name_resolver/functions.html): `swoole_name_resolver_add`, `swoole_name_resolver_remove`, `swoole_name_resolver_lookup`, and the `name_resolver` option.
- [Context](/en/name_resolver/context.html): the resolution context, controlling the `IP` family and whether a port is included.
- [Custom Resolver](/en/name_resolver/resolver.html): methods of the `Swoole\NameResolver` abstract class and the `lookup` return value contract.
- [Cluster](/en/name_resolver/cluster.html): a node container used to return a set of failover-capable nodes.
- [Built-in Resolvers](/en/name_resolver/builtin.html): the `Redis`, `Nacos`, and `Consul` resolvers.