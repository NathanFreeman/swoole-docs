# General-Purpose Connection Pool

Since `v4.4.13`, Swoole provides a built-in coroutine connection pool. Coroutines handle requests concurrently, and [multiple coroutines sharing one client connection causes data corruption](/en/coroutine/others.html#do-not-share-connections), while creating a new connection for every request is too expensive. A connection pool reuses a batch of connections: coroutines borrow one when needed and return it when done.

The built-in connection pool has two layers:

- `Swoole\ConnectionPool`: a general-purpose connection pool, automatically scheduled via a [channel](/en/coroutine/channel.html), accepting any constructor — the subject of this page.
- `Swoole\Database`: pools built on top of the general-purpose pool, with automatic reconnection on disconnect; see [Database Connection Pool](/en/pool/database.html) (PDO, Mysqli) and [Redis Connection Pool](/en/pool/redis.html).

## ConnectionPool

### __construct

Creates a connection pool.

```php
public function __construct(callable $constructor, int $size = self::DEFAULT_SIZE, ?string $proxy = null)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$constructor` | Constructor; each call must return a **new** connection object | Required |
| `$size` | Pool capacity, i.e. the maximum number of connections that can exist at the same time | `64` (`ConnectionPool::DEFAULT_SIZE`) |
| `$proxy` | Proxy class name; when provided, connection objects are wrapped as instances of this class | `null`, no wrapping |

> [!NOTE]
> The pool does not create connections in advance. They are created on demand on the first [`get`](#get), up to `$size`. To fill the pool ahead of time, call [`fill`](#fill).

### get

Gets a connection from the pool.

```php
public function get(float $timeout = -1)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout for waiting for a connection, in seconds; floats are supported (`1.5` means `1s` + `500ms`); `0` or a negative value means no time limit | `-1`, never times out |

**Return value**: returns a connection object; returns `false` on timeout, if the pool is closed while waiting, or if the current coroutine is canceled via [cancel](/en/coroutine/coroutine_api.html#cancel). Calling it after the pool is closed throws a `RuntimeException`.

> [!NOTE]
> When there is no idle connection and the count has not reached `$size`, `get` first creates a new connection; once `$size` is reached, it suspends the current coroutine and waits for another coroutine to return one via [`put`](#put).

### put

Returns a connection to the pool.

```php
public function put(mixed $connection): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$connection` | The connection object to return; passing `null` indicates the currently borrowed connection is broken | Required |

> [!IMPORTANT]
> Borrowed connections must be returned. A `get` without a matching `put` keeps the connection counted as occupied; after this accumulates `$size` times, `get` will never obtain a connection again. Use [`withConnection`](#withconnection) to return connections automatically.

> [!NOTE]
> When `null` is passed, the underlying layer decrements the connection count and immediately creates a new connection as a replacement, which is how broken, non-reusable connections are discarded.

### withConnection

Borrows a connection and hands it to a callback; the connection is returned automatically when the callback finishes (whether it returns normally or throws).

```php
public function withConnection(callable $callback, float $timeout = -1): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$callback` | Callback that receives the borrowed connection object as its only argument | Required |
| `$timeout` | Timeout for waiting for a connection, in seconds; `0` or a negative value means no time limit | `-1`, never times out |

**Return value**: returns the return value of `$callback`. Throws a `RuntimeException` if no connection can be obtained.

> [!WARNING]
> The callback must not call `put` itself, nor keep using the connection after the callback returns — including objects bound to it (such as a Statement, a generator, or another coroutine) — because the connection now belongs to another coroutine.

> [!TIP]
> Calling `withConnection` on the same pool from inside the callback requires a second idle connection, otherwise it waits forever; set a `$timeout` for the inner call.

### fill

Creates connections in advance, filling the pool up to `$size`.

```php
public function fill(): void
```

Has no effect if the pool is already closed.

### close

Closes the connection pool.

```php
public function close(): void
```

Closing wakes up all coroutines waiting in [`get`](#get); they receive `false`. After closing, `get` throws a `RuntimeException`, while `put` and `fill` simply return.

## Notes

> [!IMPORTANT]
> If a connection object becomes unusable due to an error, call `$pool->put(null)` to return an empty connection; the underlying layer discards it and creates a replacement, keeping the pool's connection count balanced.

> [!NOTE]
> The pool object itself can be shared across coroutines — that is exactly its purpose; but a connection borrowed from it may only be used by one coroutine at a time and must be returned when done.