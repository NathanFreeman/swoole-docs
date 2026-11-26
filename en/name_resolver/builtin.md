# Built-in Resolvers

Swoole provides three built-in name resolvers — `Redis`, `Nacos`, and `Consul` — all extending [Swoole\NameResolver](/en/name_resolver/resolver.html).

> [!NOTE]
> The constructor parameter `$url` must contain a scheme and host; if the host is not a valid `IP`, it is resolved to an `IP` at construction time. `$prefix` is prepended to service names.

## Redis

```php
public function __construct($url, $prefix = 'swoole:service:')
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$url` | The `Redis` URL, supporting the `tcp`/`redis`/`rediss` schemes; defaults to port `6379` when no port is given | Required |
| `$prefix` | The service name prefix | `'swoole:service:'` |

Service nodes are stored in a `Redis` set whose key is `$prefix . $name`, with members formatted as `ip:port`.

| Method | Description |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | Writes the node via `sAdd` |
| `leave(string $name, string $ip, int $port): bool` | Removes the node via `sRem` |
| `getCluster(string $name): ?Cluster` | Reads nodes via `sMembers` and builds a [Cluster](/en/name_resolver/cluster.html) |

**Example**

```php
<?php
$resolver = new Swoole\NameResolver\Redis('redis://127.0.0.1:6379');
swoole_name_resolver_add($resolver);
```

## Nacos

```php
public function __construct($url, $prefix = 'swoole_service_')
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$url` | The `Nacos` URL, e.g. `http://127.0.0.1:8848` | Required |
| `$prefix` | The service name prefix | `'swoole_service_'` |

Nodes are registered, removed, and queried through the `Nacos` `/nacos/v1/ns/instance` API.

| Method | Description |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | Registers a node; `$options` supports `weight` (default `100`), `encoding` (default `utf-8`), and `namespaceId` (default `public`) |
| `leave(string $name, string $ip, int $port): bool` | Removes a node |
| `getCluster(string $name): ?Cluster` | Queries the instance list and builds a [Cluster](/en/name_resolver/cluster.html) |

**Example**

```php
<?php
$resolver = new Swoole\NameResolver\Nacos('http://127.0.0.1:8848');
swoole_name_resolver_add($resolver);
```

## Consul

```php
public function __construct($url, $prefix = 'swoole_service_')
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$url` | The `Consul` URL, e.g. `http://127.0.0.1:8500` | Required |
| `$prefix` | The service name prefix | `'swoole_service_'` |

Nodes are managed through the `Consul` `/v1/agent/service/register`, `/v1/agent/service/deregister`, and `/v1/catalog/service` APIs.

| Method | Description |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | Registers a node; `$options` supports `weight` (default `100`) |
| `leave(string $name, string $ip, int $port): bool` | Removes a node |
| `enableMaintenanceMode(string $name, string $ip, int $port): bool` | Puts a node into maintenance mode |
| `getCluster(string $name): ?Cluster` | Queries the service catalog and builds a [Cluster](/en/name_resolver/cluster.html) |

**Example**

```php
<?php
$resolver = new Swoole\NameResolver\Consul('http://127.0.0.1:8500');
swoole_name_resolver_add($resolver);
```