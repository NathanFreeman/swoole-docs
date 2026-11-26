# Cluster

`Swoole\NameResolver\Cluster` 是节点容器，不是解析器。解析器 `lookup` 返回 `Cluster` 时，底层会按权重随机弹出节点并逐个尝试，实现故障转移。

## add

添加一个节点。

```php
public function add(string $host, int $port, int $weight = 100): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 节点 `IP`，必须是合法 `IP` 地址 | 必填 |
| `$port` | 节点端口，范围 `0-65535` | 必填 |
| `$weight` | 权重，范围 `0-100` | `100` |

> [!WARNING]
> `host` 不是合法 `IP`、`port` 或 `weight` 超出范围时抛出 `Swoole\Exception`。

## pop

随机弹出一个节点，弹出后不再放回。

```php
public function pop(): array|false
```

**返回值**：返回节点数组 `['host' => IP, 'port' => 端口, 'weight' => 权重]`；集群为空时返回 `false`。

## count

返回剩余节点数量。

```php
public function count(): int
```

**返回值**：剩余节点数量。

**示例**

```php
<?php
use Swoole\NameResolver\Cluster;

$cluster = new Cluster();
$cluster->add('127.0.0.2', 8080, 100);
$cluster->add('127.0.0.3', 8080, 50);

var_dump($cluster->count()); // int(2)
var_dump($cluster->pop());   // 随机一个节点
var_dump($cluster->count()); // int(1)
```