# 使用示例

三个可直接运行的例子，覆盖自定义解析、`Redis` 服务发现和多节点负载均衡。

> [!NOTE]
> 名字解析只在协程客户端连接**非 `IP` 的主机名**时触发；连接 `127.0.0.1` 这类字面 `IP` 不会走解析器。

## 示例一：自定义解析器把服务名映射到固定地址

适合用服务名代替硬编码 `IP` 的内部调用。

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
        // 只解析 user_service，其它名字返回 null 交回 DNS
        return $name === 'user_service' ? '127.0.0.1' : null;
    }
}
swoole_name_resolver_add(new StaticResolver());

Co\run(function () {
    // 用服务名连接，端口仍由自己指定
    $cli = new Co\Http\Client('user_service', 9501);
    $cli->get('/');
    echo $cli->body;
    $cli->close();
});
```

## 示例二：Redis 服务发现（服务端注册 + 客户端按名字连接）

`server.php`：启动时把自己注册进 `Redis`，退出时摘除。

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

// 注册节点：服务名 user_service -> 127.0.0.1:9501
$resolver->join('user_service', '127.0.0.1', 9501);
$server->start();
```

`client.php`：只认识服务名，不需要知道真实 `IP` 和端口。

```php
<?php
swoole_name_resolver_add(new Swoole\NameResolver\Redis('redis://127.0.0.1:6379'));

Co\run(function () {
    // 端口传 0：端口也交给解析器决定（否则默认 80/443）
    $cli = new Co\Http\Client('user_service', 0);
    $cli->get('/');
    echo $cli->body;   // hello from user_service
    $cli->close();
});
```

> [!TIP]
> `Co\Http\Client` 端口传 `0` 时底层会开启 `withPort`，解析器返回的节点端口（这里是 `9501`）覆盖默认端口；端口传具体值时只解析 `IP`，端口仍用你传的值。

> [!NOTE]
> 端口随解析返回只对 `Co\Http\Client` 的 `port = 0` 生效。`Co\Socket`、`Co\Client` 等需要自行用 [swoole_name_resolver_lookup](/zh/name_resolver/functions.html#swoole-name-resolver-lookup) 配合 `new Swoole\NameResolver\Context(AF_INET, true)` 取回 `IP:端口` 再连接。

## 示例三：Cluster 多节点负载均衡

返回 [Cluster](/zh/name_resolver/cluster.html) 时，底层每次解析随机取一个节点，实现负载均衡。

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
    // 三次请求会随机落到不同节点
    for ($i = 0; $i < 3; $i++) {
        $cli = new Co\Http\Client('user_service', 0);
        $cli->get('/');
        echo $cli->body;
        $cli->close();
    }
});
```

> [!NOTE]
> 底层缓存返回的 `Cluster` 并每次 `pop()` 一个节点（随机、不放回），节点取空后再次调用 `lookup` 重建；配合 `Co\Http\Client` 的 `max_retries` 可在请求失败时重新解析、换节点重试。