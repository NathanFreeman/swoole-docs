# Custom Resolver

`Swoole\NameResolver` is an abstract base class. Extend it and implement the three abstract methods `join`, `leave`, and `getCluster` to register a custom name resolver; you can also override `lookup` directly to take over the resolution logic.

## __construct

```php
public function __construct($url, protected $prefix = 'swoole_service_')
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$url` | The registry URL, which must contain a scheme and host, e.g. `http://127.0.0.1:8500` | Required |
| `$prefix` | The service name prefix, prepended to names during registration and lookup | `'swoole_service_'` |

> [!NOTE]
> The URL is validated at construction time; if the host is not a valid `IP`, it is resolved to an `IP` first. A custom resolver that only performs resolution and does not connect to a registry may override the constructor.

## join

Abstract method that registers a service node with the registry.

```php
abstract public function join(string $name, string $ip, int $port, array $options = []): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The service name | Required |
| `$ip` | The node `IP` | Required |
| `$port` | The node port | Required |
| `$options` | Extra options, interpreted by the subclass | `[]` |

**Return value**: Returns `true` on successful registration, `false` on failure.

## leave

Abstract method that removes a service node from the registry.

```php
abstract public function leave(string $name, string $ip, int $port): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The service name | Required |
| `$ip` | The node `IP` | Required |
| `$port` | The node port | Required |

**Return value**: Returns `true` on successful removal, `false` on failure.

## getCluster

Abstract method that queries the node cluster for a service name.

```php
abstract public function getCluster(string $name): ?Swoole\NameResolver\Cluster
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The service name | Required |

**Return value**: Returns a [Cluster](/en/name_resolver/cluster.html) object; returns `null` when no nodes are available.

## withFilter

Sets a name filter and returns `$this` for chaining.

```php
public function withFilter(callable $fn): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fn` | The filter callback, receiving the name string; the base `lookup` processes the name only when it returns `true` | Required |

**Return value**: Returns the current resolver object.

## getFilter

Gets the configured filter callback.

```php
public function getFilter(): mixed
```

**Return value**: Returns the filter callback; returns `null` when none is set.

## hasFilter

Checks whether a filter is configured.

```php
public function hasFilter(): bool
```

**Return value**: Returns `true` if a filter is set, `false` otherwise.

## lookup

Performs name resolution. The base class provides a default implementation: it checks the filter first, then calls `getCluster` to obtain the cluster.

```php
public function lookup(string $name): Swoole\NameResolver\Cluster|string|false|null
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The name to resolve | Required |

**Return value contract**

| Return value | Meaning |
|:---|:---|
| A `Swoole\NameResolver\Cluster` object | A multi-node cluster; the underlying layer pops nodes randomly by weight and tries them one by one until exhausted |
| A non-empty `IP` string | The final resolution result, which must be a valid `IP`; a port may be appended when `withPort` is `true` |
| `''` (empty string) | Terminates resolution; subsequent resolvers are not queried |
| `false` / `null` | Skips this resolver and tries the next one; if all come up empty, falls back to ordinary `DNS` |

> [!WARNING]
> The underlying layer only treats `Cluster` objects and strings as valid resolution results; any other return type is treated as a skip. A custom `lookup` should not return a node array — for a single node, return the `IP` string directly or a `Cluster` containing one node.

> [!TIP]
> When no filter is set, exceptions thrown by registry failures are swallowed by the underlying layer and it falls back to `DNS`, avoiding impact on ordinary domain resolution; when a filter is set, exceptions are rethrown as-is.

**Example**

```php
<?php
$resolver = new class extends Swoole\NameResolver {
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }
    public function lookup(string $name) {
        if ($name === 'my-service') {
            return '127.0.0.2';
        }
        return null; // try the next resolver or fall back to DNS
    }
};
swoole_name_resolver_add($resolver);
```