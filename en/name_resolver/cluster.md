# Cluster

`Swoole\NameResolver\Cluster` is a node container, not a resolver. When a resolver's `lookup` returns a `Cluster`, the underlying layer pops nodes randomly by weight and tries them one by one, providing failover.

## add

Adds a node.

```php
public function add(string $host, int $port, int $weight = 100): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | The node `IP`, which must be a valid `IP` address | Required |
| `$port` | The node port, in the range `0-65535` | Required |
| `$weight` | The weight, in the range `0-100` | `100` |

> [!WARNING]
> Throws `Swoole\Exception` when `host` is not a valid `IP`, or `port`/`weight` is out of range.

## pop

Pops a random node; popped nodes are not put back.

```php
public function pop(): array|false
```

**Return value**: Returns the node array `['host' => IP, 'port' => port, 'weight' => weight]`; returns `false` when the cluster is empty.

## count

Returns the number of remaining nodes.

```php
public function count(): int
```

**Return value**: The number of remaining nodes.

**Example**

```php
<?php
use Swoole\NameResolver\Cluster;

$cluster = new Cluster();
$cluster->add('127.0.0.2', 8080, 100);
$cluster->add('127.0.0.3', 8080, 50);

var_dump($cluster->count()); // int(2)
var_dump($cluster->pop());   // a random node
var_dump($cluster->count()); // int(1)
```