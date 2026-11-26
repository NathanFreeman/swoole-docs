# 自定义解析器

`Swoole\NameResolver` 是抽象基类。继承它并实现 `join`、`leave`、`getCluster` 三个抽象方法，即可注册自定义名字解析器；也可以直接覆盖 `lookup` 方法接管解析逻辑。

## __construct

```php
public function __construct($url, protected $prefix = 'swoole_service_')
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$url` | 注册中心地址，必须包含 scheme 和 host，例如 `http://127.0.0.1:8500` | 必填 |
| `$prefix` | 服务名前缀，注册和查询时都会拼接到名字前 | `'swoole_service_'` |

> [!NOTE]
> 构造时会校验 URL；host 不是合法 `IP` 时会先解析为 `IP`。仅做解析、不连接注册中心的自定义解析器可以覆盖构造函数。

## join

抽象方法，向注册中心注册一个服务节点。

```php
abstract public function join(string $name, string $ip, int $port, array $options = []): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 服务名 | 必填 |
| `$ip` | 节点 `IP` | 必填 |
| `$port` | 节点端口 | 必填 |
| `$options` | 额外选项，由子类自行解释 | `[]` |

**返回值**：注册成功返回 `true`，失败返回 `false`。

## leave

抽象方法，从注册中心摘除一个服务节点。

```php
abstract public function leave(string $name, string $ip, int $port): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 服务名 | 必填 |
| `$ip` | 节点 `IP` | 必填 |
| `$port` | 节点端口 | 必填 |

**返回值**：摘除成功返回 `true`，失败返回 `false`。

## getCluster

抽象方法，查询服务名对应的节点集群。

```php
abstract public function getCluster(string $name): ?Swoole\NameResolver\Cluster
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 服务名 | 必填 |

**返回值**：返回 [Cluster](/zh/name_resolver/cluster.html) 对象；没有可用节点时返回 `null`。

## withFilter

设置名字过滤器，链式返回自身。

```php
public function withFilter(callable $fn): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$fn` | 过滤回调，接收名字字符串；仅当返回 `true` 时基类 `lookup` 才处理该名字 | 必填 |

**返回值**：返回当前解析器对象。

## getFilter

获取已设置的过滤器回调。

```php
public function getFilter(): mixed
```

**返回值**：返回过滤器回调；未设置时返回 `null`。

## hasFilter

判断是否设置了过滤器。

```php
public function hasFilter(): bool
```

**返回值**：已设置过滤器返回 `true`，否则返回 `false`。

## lookup

执行名字解析。基类已提供默认实现：先检查过滤器，再调用 `getCluster` 获取集群。

```php
public function lookup(string $name): Swoole\NameResolver\Cluster|string|false|null
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | 要解析的名字 | 必填 |

**返回值契约**

| 返回值 | 含义 |
|:---|:---|
| `Swoole\NameResolver\Cluster` 对象 | 多节点集群，底层按权重随机弹出节点，逐个尝试直到耗尽 |
| 非空 `IP` 字符串 | 最终解析结果，必须是合法 `IP`；`withPort` 为 `true` 时可附带端口 |
| `''`（空字符串） | 终止解析，不再查询后续解析器 |
| `false` / `null` | 跳过本解析器，交给下一个；全部落空则回退普通 `DNS` |

> [!WARNING]
> 底层只把 `Cluster` 对象和字符串当作有效解析结果；返回其他类型会按跳过处理。自定义 `lookup` 不要返回节点数组，单节点请直接返回 `IP` 字符串或只含一个节点的 `Cluster`。

> [!TIP]
> 未设置过滤器时，注册中心故障抛出的异常会被底层吞掉并回退 `DNS`，避免影响普通域名解析；设置了过滤器则异常原样抛出。

**示例**

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
        return null; // 交给下一个解析器或回退 DNS
    }
};
swoole_name_resolver_add($resolver);
```