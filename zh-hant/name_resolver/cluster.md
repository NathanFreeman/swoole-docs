# Cluster

`Swoole\NameResolver\Cluster` 是節點容器，不是解析器。解析器 `lookup` 返回 `Cluster` 時，底層會按權重隨機彈出節點並逐個嘗試，實現故障轉移。

## add

添加一個節點。

```php
public function add(string $host, int $port, int $weight = 100): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$host` | 節點 `IP`，必須是合法 `IP` 地址 | 必填 |
| `$port` | 節點端口，範圍 `0-65535` | 必填 |
| `$weight` | 權重，範圍 `0-100` | `100` |

> [!WARNING]
> `host` 不是合法 `IP`、`port` 或 `weight` 超出範圍時拋出 `Swoole\Exception`。

## pop

隨機彈出一個節點，彈出後不再放回。

```php
public function pop(): array|false
```

**返回值**：返回節點數組 `['host' => IP, 'port' => 端口, 'weight' => 權重]`；集羣爲空時返回 `false`。

## count

返回剩餘節點數量。

```php
public function count(): int
```

**返回值**：剩餘節點數量。

**示例**

```php
<?php
use Swoole\NameResolver\Cluster;

$cluster = new Cluster();
$cluster->add('127.0.0.2', 8080, 100);
$cluster->add('127.0.0.3', 8080, 50);

var_dump($cluster->count()); // int(2)
var_dump($cluster->pop());   // 隨機一個節點
var_dump($cluster->count()); // int(1)
```