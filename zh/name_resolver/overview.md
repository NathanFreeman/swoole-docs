# 名字解析器

`Swoole\NameResolver` 用于自定义域名解析和服务发现。协程客户端连接域名时，会先按注册顺序查询名字解析器，由解析器决定实际连接的 `IP` 和端口；所有解析器都未给出结果时，回退到普通的 `DNS` 解析。

> [!NOTE]
> `name_resolver` 选项自 Swoole `v5.0.0` 起可用。

## 工作原理

- 解析的唯一入口是协程 [Socket::connect](/zh/client/socket.html#connect)。所有基于协程 `Socket` 的客户端（`TCP`、`HTTP`、`Redis` 等）连接域名时都会走名字解析器；开启 [SWOOLE_HOOK_TCP](/zh/coroutine/hook.html#swoole-hook-tcp) 后，原生 `stream` 也会转为协程 `Socket`，间接受解析器影响。
- 多个解析器按**注册顺序**依次查询，先返回非空结果者胜出。
- 解析器列表是线程本地的；`PHP` 解析器在请求结束时自动清除。

> [!TIP]
> [System::gethostbyname](/zh/coroutine/system_api.html#gethostbyname) 本身不走名字解析器，它就是解析器全部落空时的回退实现。

## 子页面

- [使用示例](/zh/name_resolver/examples.html)：自定义解析、`Redis` 服务发现、`Cluster` 负载均衡三个完整例子。
- [注册与调用](/zh/name_resolver/functions.html)：`swoole_name_resolver_add`、`swoole_name_resolver_remove`、`swoole_name_resolver_lookup` 和 `name_resolver` 选项。
- [Context](/zh/name_resolver/context.html)：解析上下文，控制 `IP` 族和是否附带端口。
- [自定义解析器](/zh/name_resolver/resolver.html)：`Swoole\NameResolver` 抽象类的方法与 `lookup` 返回值契约。
- [Cluster](/zh/name_resolver/cluster.html)：节点容器，用于返回一组可故障转移的节点。
- [内置解析器](/zh/name_resolver/builtin.html)：`Redis`、`Nacos`、`Consul` 解析器。