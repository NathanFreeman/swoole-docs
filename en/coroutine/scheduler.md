# Coroutine Scheduler

`Swoole\Coroutine\Scheduler` is a coroutine task scheduler. It creates coroutine tasks in batches and drives the event loop until all tasks have finished. The commonly used [run() function](/en/coroutine/container.html#the-run-function) is a wrapper around this class.

> [!NOTE]
> Available since Swoole `v4.4.0`. Alias: `Co\Scheduler`. The class is `final` and cannot be serialized or cloned.

## Methods

### add

Adds a coroutine task to the scheduler. The task is **not executed immediately**; all tasks are created and executed together when [start](#start) is called.

```php
public function add(callable $func, mixed ...$param): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$func` | The coroutine task callback | Required |
| `$param` | Variadic arguments passed to the callback | None |

> [!WARNING]
> Calling `add` after `start` produces a warning and the task is not added.

### parallel

Adds `n` coroutine tasks that share the same callback. The only difference from [add](#add) is the repetition count; all coroutines are created at once when `start` is called, not in batches.

```php
public function parallel(int $n, callable $func, mixed ...$param): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$n` | Number of coroutine tasks, must be greater than `0`, otherwise a `ValueError` is thrown | Required |
| `$func` | The coroutine task callback | Required |
| `$param` | Variadic arguments passed to the callback | None |

### set

Sets coroutine and global runtime options. Shares the same configuration entry point as [Server::set](/en/server/methods.html#set).

```php
public function set(array $settings): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Options array, available keys are listed below | Required |

Common coroutine options:

| Option | Description |
|:---|:---|
| `max_coroutine` / `max_coro_num` | Maximum number of coroutines |
| `hook_flags` | Function-type mask for one-click coroutinization, see [Coroutine Hooks](/en/coroutine/hook.html) |
| `enable_deadlock_check` | Enable coroutine deadlock detection |
| `enable_preemptive_scheduler` | Enable the preemptive scheduler |
| `c_stack_size` / `stack_size` | Coroutine C stack size |
| `name_resolver` | Array of name resolver objects, see [Name Resolver](/en/name_resolver/overview.html) |

Scheduler-specific options:

| Option | Description |
|:---|:---|
| `dns_cache_expire` | DNS cache expiration time, in seconds |
| `dns_cache_capacity` | DNS cache capacity |
| `exit_condition` | Event-loop exit condition callback, takes no arguments; returning `false` prevents the event loop from exiting |

Global options such as `log_file`, `log_level`, `dns_server`, and `socket_read_timeout` are also supported, identical to the entries of the same name in [Server Configuration](/en/server/setting.html).

### getOptions

Gets the coroutine options that have been set.

```php
public function getOptions(): ?array
```

**Return value**: Returns a copy of the coroutine options array; returns `null` if `set` has never been called.

### start

Creates all coroutine tasks and starts the event loop, **blocking** until every coroutine has exited.

```php
public function start(): bool
```

**Return value**: Returns `true` when all coroutines were created successfully and have finished; returns `false` when there are no tasks, coroutine creation fails, `start` is called again while running, or event-loop initialization fails.

> [!TIP]
> After `start` finishes, the scheduler is reset, so you can `add` new tasks and call `start` again. Calling `start` with no tasks produces a `no coroutine task` warning and returns `false`.

## Relationship with the run() Function

The [run() function](/en/coroutine/container.html#the-run-function) is a wrapper around `Scheduler`, equivalent to:

```php
<?php
function run(callable $fn, mixed ...$args): bool
{
    $s = new Swoole\Coroutine\Scheduler();
    $options = Swoole\Coroutine::getOptions();
    if (!isset($options['hook_flags'])) {
        $s->set(['hook_flags' => SWOOLE_HOOK_ALL]);
    }
    $s->add($fn, ...$args);
    return $s->start();
}
```

The difference: `run()` automatically enables full coroutinization when `hook_flags` has not been set, while using `Scheduler` directly requires you to call `set` yourself.

## Example

```php
<?php
$sch = new Co\Scheduler();
$sch->set(['max_coroutine' => 100]);
$sch->parallel(10, function ($t, $n) {
    Co::sleep($t);
    echo "Co " . Co::getCid() . "\n";
}, 0.05, 'A');
$sch->start();
```