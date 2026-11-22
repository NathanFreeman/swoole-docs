# Coroutine

A `Swoole` coroutine is a lightweight **user-space thread**. You can think of it as a **subtask** inside a process, created and scheduled by the programmer rather than managed by the operating system.

Its core value is: **write synchronous-style code and get asynchronous non-blocking performance**, which is especially suitable for high-concurrency, `I/O`-intensive applications.

Coroutines permeate every aspect of the `Swoole` lifecycle. Fully understanding this concept early on lays the most solid foundation for learning all the core topics that follow.

## An Example

Imagine this scenario: you need to complete two tasks that each take **30 minutes** — **doing laundry** and **cooking**.

### Traditional Mode (Synchronous / Blocking)

It's like standing next to the washing machine: you must wait until the laundry is done before you start cooking.

- **Process**: wait for the laundry (30m) ➔ cook (30m)
- **Result**: **60 minutes** in total
- **Drawback**: one task must finish before the next can start, and the `CPU` sits completely idle while waiting — in a program, this corresponds to a process blocked on `I/O`, doing nothing at all

### Swoole Coroutine Mode

With the same two tasks, a different execution order achieves "time folding":

1. **Start the washing machine**: issue an `I/O` request.
2. **Immediately "suspend"** the laundry task and switch to the cooking task: this is a **coroutine switch**.
3. When the cooking is done, the laundry happens to be finished too; then **"resume"** the laundry task and hang the clothes out to dry.

**Result**: only **30 minutes** in total — efficiency is doubled outright.