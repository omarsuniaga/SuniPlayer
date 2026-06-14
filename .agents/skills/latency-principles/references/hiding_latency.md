# Hiding Latency

Techniques to mask latency when it cannot be reduced further.

## 1. Asynchronous Processing
Performing operations in the background to keep the main path responsive.

### The Event Loop
- **Mechanism**: A central loop polls for I/O events (using `epoll`/`kqueue`/`io_uring`) and dispatches handlers.
- **Benefit**: Handles thousands of connections on a single thread without blocking.

### Patterns
- **I/O Multiplexing**: Monitoring multiple sockets simultaneously.
- **Request Batching**: Grouping multiple small requests into one network packet (trades latency for throughput, but hides round-trip costs).
- **Request Hedging**: Sending the same request to multiple replicas and using the first response. (Great for cutting tail latency).
- **Buffered I/O**: Accumulating writes in memory before flushing to disk.

### Managing Concurrency
- **Backpressure**: Signal producers to slow down when consumers are overwhelmed. Prevents queue buildup (which causes latency).
- **Graceful Degradation**: Drop low-priority work under load to preserve latency for critical tasks.

## 2. Predictive Techniques
Guessing the future to perform work before it is requested.

### Prefetching
Loading data into cache/memory before the user asks for it.
- **Sequential**: Prefetch `n+1` when `n` is accessed.
- **Spatial**: Prefetch nearby data (e.g., adjacent map tiles).
- **Semantic**: Prefetch based on user intent (e.g., load "Checkout" resources when user hovers over "Buy").

### Optimistic Updates
Updating the UI immediately while the server processes the request in the background.
- **Mechanism**: Apply change to local model -> Update UI -> Send to Server.
- **Reconciliation**: If server fails, rollback the change and notify user.
- **Benefit**: User perceives zero latency.

### Speculative Execution
Executing a task that *might* be needed.
- **Branch Prediction**: CPU does this automatically.
- **Application Level**: Start calculating search results while user is still typing. If they finish typing the predicted query, results are instant. If not, discard work.

### Resource Pre-allocation
- **Connection Pooling**: Keep DB connections open to avoid handshake latency.
- **Object Pooling**: Keep memory allocated to avoid `malloc` latency.
- **Prewarming**: Spin up lambdas/VMs before traffic spikes (based on historical patterns).
