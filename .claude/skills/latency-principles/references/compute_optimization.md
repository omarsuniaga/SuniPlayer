# Compute Optimization for Low Latency

Reducing the latency of the actual processing logic.

## 1. Eliminating Work
The fastest code is code that doesn't run.

### Algorithmic Complexity
- **Target**: Replace O(n^2) or O(n) algorithms with O(log n) or O(1).
- **Data Structures**: Use HashMaps (O(1)) or Trees (O(log n)) instead of linear scans.

### Serialization
- **Avoid JSON**: Parsing text is expensive.
- **Use Binary Formats**: Protocol Buffers (protobuf) or FlatBuffers.
- **Zero-Copy**: FlatBuffers allows accessing data without a parsing/unpacking step.

### Memory Management
- **Avoid Dynamic Allocation**: `malloc`/`new` involves lock contention and fragmentation.
  - **Solution**: Object pooling, Ring buffers, Stack allocation.
- **Garbage Collection (GC)**:
  - **Tuning**: Size heaps to avoid GC during critical paths.
  - **Zero-Allocation**: Write critical hot paths to allocate zero memory to avoid triggering GC.
- **OS Overhead**:
  - **System Calls**: Expensive (context switch). Batch operations (e.g., `sendmmsg` vs `sendmsg`).
  - **Thread-per-Core**: Pin threads to cores to avoid scheduler latency and preserve CPU cache locality.

## 2. Wait-Free Synchronization
Traditional locking (Mutex/Semaphores) puts threads to sleep, causing expensive OS context switches (~µs latency).

### Problems with Locks
- **Convoying**: Threads pile up waiting for a lock.
- **Priority Inversion**: Low-priority thread holds lock needed by high-priority thread.
- **Deadlocks**: System halt due to circular dependencies.

### Wait-Free Techniques
- **Atomics**: Use hardware instructions (`CAS`, `fetch_add`) instead of OS locks.
- **Memory Barriers**:
  - **Acquire/Release**: Enforce ordering without full memory fences.
- **Data Structures**:
  - **Ring Buffer (SPSC)**: Single-Producer Single-Consumer queues can be implemented wait-free with just memory barriers (no heavy atomic RMW).
  - **Hazard Pointers / RCU**: For safe memory reclamation without locking.

## 3. Concurrency Models
Structuring execution to handle multiple tasks efficiently.

### Models
- **Threads**: OS-managed. Good for parallelism, expensive context switching.
- **Fibers/Coroutines**: Userspace cooperative multitasking. Very low context switch cost.
- **Event-Driven**: Single thread processing events (epoll/io_uring). No context switching, high cache locality.
- **Actor Model**: Shared-nothing, message-passing. Good for scalability, but message passing overhead exists.

### Parallelism Types
- **Data Parallelism**: Same operation on different data (SIMD, GPU).
- **Task Parallelism**: Different operations running concurrently.

### Database Concurrency
- **MVCC (Multiversion Concurrency Control)**: Readers don't block writers. Snapshots allow consistent reads without locking the table.
- **Isolation Levels**: Relaxing serializability (to Snapshot or Read Committed) reduces locking overhead significantly.
