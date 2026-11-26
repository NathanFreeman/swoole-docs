# 内置解析器

Swoole 内置了 `Redis`、`Nacos`、`Consul` 三种名字解析器，均继承 [Swoole\NameResolver](/zh/name_resolver/resolver.html)。

> [!NOTE]
> 构造参数 `$url` 必须包含 scheme 和 host；host 不是合法 `IP` 时会在构造时解析为 `IP`。`$prefix` 会拼接到服务名前。

## Redis

```php
public function __construct($url, $prefix = 'swoole:service:')
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$url` | `Redis` 地址，支持 `tcp`/`redis`/`rediss` 协议；未指定端口时默认 `6379` | 必填 |
| `$prefix` | 服务名前缀 | `'swoole:service:'` |

服务节点存储在 `Redis` 集合中，键名为 `$prefix . $name`，成员格式为 `ip:port`。

| 方法 | 说明 |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | 通过 `sAdd` 写入节点 |
| `leave(string $name, string $ip, int $port): bool` | 通过 `sRem` 移除节点 |
| `getCluster(string $name): ?Cluster` | 通过 `sMembers` 读取节点并构造 [Cluster](/zh/name_resolver/cluster.html) |

**示例**

```php
<?php
$resolver = new Swoole\NameResolver\Redis('redis://127.0.0.1:6379');
swoole_name_resolver_add($resolver);
```

## Nacos

```php
public function __construct($url, $prefix = 'swoole_service_')
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$url` | `Nacos` 地址，例如 `http://127.0.0.1:8848` | 必填 |
| `$prefix` | 服务名前缀 | `'swoole_service_'` |

通过 `Nacos` 的 `/nacos/v1/ns/instance` 接口注册、摘除和查询节点。

| 方法 | 说明 |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | 注册节点；`$options` 支持 `weight`（默认 `100`）、`encoding`（默认 `utf-8`）、`namespaceId`（默认 `public`） |
| `leave(string $name, string $ip, int $port): bool` | 摘除节点 |
| `getCluster(string $name): ?Cluster` | 查询实例列表并构造 [Cluster](/zh/name_resolver/cluster.html) |

**示例**

```php
<?php
$resolver = new Swoole\NameResolver\Nacos('http://127.0.0.1:8848');
swoole_name_resolver_add($resolver);
```

## Consul

```php
public function __construct($url, $prefix = 'swoole_service_')
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$url` | `Consul` 地址，例如 `http://127.0.0.1:8500` | 必填 |
| `$prefix` | 服务名前缀 | `'swoole_service_'` |

通过 `Consul` 的 `/v1/agent/service/register`、`/v1/agent/service/deregister` 和 `/v1/catalog/service` 接口操作节点。

| 方法 | 说明 |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | 注册节点；`$options` 支持 `weight`（默认 `100`） |
| `leave(string $name, string $ip, int $port): bool` | 摘除节点 |
| `enableMaintenanceMode(string $name, string $ip, int $port): bool` | 将节点置为维护模式 |
| `getCluster(string $name): ?Cluster` | 查询服务目录并构造 [Cluster](/zh/name_resolver/cluster.html) |

**示例**

```php
<?php
$resolver = new Swoole\NameResolver\Consul('http://127.0.0.1:8500');
swoole_name_resolver_add($resolver);
```