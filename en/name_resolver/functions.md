# Registration and Lookup

## swoole_name_resolver_add

Registers a name resolver, appending it to the end of the resolver list.

```php
function swoole_name_resolver_add(Swoole\NameResolver $resolver): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$resolver` | An object of `Swoole\NameResolver` or a subclass | Required |

**Return value**: Returns `true` on successful registration, `false` on failure.

> [!NOTE]
> If the given object is not an instance of `Swoole\NameResolver`, a warning is emitted and `false` is returned.

## swoole_name_resolver_remove

Removes a registered name resolver, matching by object identity.

```php
function swoole_name_resolver_remove(Swoole\NameResolver $resolver): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$resolver` | The same object passed at registration time | Required |

**Return value**: Returns `true` on successful removal, `false` on failure.

## swoole_name_resolver_lookup

Manually triggers a name resolution, querying all resolvers in registration order.

```php
function swoole_name_resolver_lookup(string $name, Swoole\NameResolver\Context $ctx): string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The name to resolve (a domain name or service name) | Required |
| `$ctx` | The resolution context, see [Context](/en/name_resolver/context.html) | Required |

**Return value**: Returns the `IP` address string on success (with a port appended when `withPort` is `true`); returns the empty string `''` on failure or termination.

**Example**

```php
<?php
$resolver = new class extends Swoole\NameResolver {
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }
    public function lookup(string $name) {
        return '127.0.0.2';
    }
};
swoole_name_resolver_add($resolver);

var_dump(swoole_name_resolver_lookup('localhost', new Swoole\NameResolver\Context()));            // '127.0.0.2'
var_dump(swoole_name_resolver_lookup('localhost', new Swoole\NameResolver\Context(AF_INET, true))); // '127.0.0.2'

swoole_name_resolver_remove($resolver);
```

## Registering via the name_resolver Option

Resolvers can also be registered in bulk through [Scheduler::set](/en/coroutine/scheduler.html#set) or [Server::set](/en/server/methods.html#set):

```php
<?php
$sch = new Co\Scheduler();
$sch->set([
    'name_resolver' => [
        new Swoole\NameResolver\Redis('redis://127.0.0.1:6379'),
    ],
]);
```

> [!NOTE]
> The option value must be an array of `Swoole\NameResolver` objects; they are registered in array order.