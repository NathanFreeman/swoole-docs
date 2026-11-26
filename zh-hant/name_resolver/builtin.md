# 內置解析器

Swoole 內置了 `Redis`、`Nacos`、`Consul` 三種名字解析器，均繼承 [Swoole\NameResolver](/zh-hant/name_resolver/resolver.html)。

> [!NOTE]
> 構造參數 `$url` 必須包含 scheme 和 host；host 不是合法 `IP` 時會在構造時解析爲 `IP`。`$prefix` 會拼接到服務名前。

## Redis

```php
public function __construct($url, $prefix = 'swoole:service:')
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$url` | `Redis` 地址，支持 `tcp`/`redis`/`rediss` 協議；未指定端口時默認 `6379` | 必填 |
| `$prefix` | 服務名前綴 | `'swoole:service:'` |

服務節點存儲在 `Redis` 集合中，鍵名爲 `$prefix . $name`，成員格式爲 `ip:port`。

| 方法 | 說明 |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | 通過 `sAdd` 寫入節點 |
| `leave(string $name, string $ip, int $port): bool` | 通過 `sRem` 移除節點 |
| `getCluster(string $name): ?Cluster` | 通過 `sMembers` 讀取節點並構造 [Cluster](/zh-hant/name_resolver/cluster.html) |

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

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$url` | `Nacos` 地址，例如 `http://127.0.0.1:8848` | 必填 |
| `$prefix` | 服務名前綴 | `'swoole_service_'` |

通過 `Nacos` 的 `/nacos/v1/ns/instance` 接口註冊、摘除和查詢節點。

| 方法 | 說明 |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | 註冊節點；`$options` 支持 `weight`（默認 `100`）、`encoding`（默認 `utf-8`）、`namespaceId`（默認 `public`） |
| `leave(string $name, string $ip, int $port): bool` | 摘除節點 |
| `getCluster(string $name): ?Cluster` | 查詢實例列表並構造 [Cluster](/zh-hant/name_resolver/cluster.html) |

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

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$url` | `Consul` 地址，例如 `http://127.0.0.1:8500` | 必填 |
| `$prefix` | 服務名前綴 | `'swoole_service_'` |

通過 `Consul` 的 `/v1/agent/service/register`、`/v1/agent/service/deregister` 和 `/v1/catalog/service` 接口操作節點。

| 方法 | 說明 |
|:---|:---|
| `join(string $name, string $ip, int $port, array $options = []): bool` | 註冊節點；`$options` 支持 `weight`（默認 `100`） |
| `leave(string $name, string $ip, int $port): bool` | 摘除節點 |
| `enableMaintenanceMode(string $name, string $ip, int $port): bool` | 將節點置爲維護模式 |
| `getCluster(string $name): ?Cluster` | 查詢服務目錄並構造 [Cluster](/zh-hant/name_resolver/cluster.html) |

**示例**

```php
<?php
$resolver = new Swoole\NameResolver\Consul('http://127.0.0.1:8500');
swoole_name_resolver_add($resolver);
```