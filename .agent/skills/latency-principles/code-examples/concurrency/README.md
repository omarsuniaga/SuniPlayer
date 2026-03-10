# Concurrency Examples

Techniques for maximizing processing throughput while minimizing latency.

## Patterns Covered

### Thread Pool Sizing (Little's Law)
Using Little's Law (L = λ × W) to size thread pools correctly.

**Formula**: `Concurrency = Throughput × Latency`

**Example**:
- Target throughput: 1000 req/s
- Average latency per request: 50ms
- Required concurrency: 1000 × 0.05 = 50 threads

**Latency Impact**: Correctly sized pools prevent queuing (major source of latency).

### Wait-Free Queues (SPSC)
Single-Producer Single-Consumer ring buffers for lock-free communication.

**Latency Impact**: No locks = no blocking = predictable low latency.

### Event-Driven Architecture
Single thread handling many connections via epoll/kqueue/io_uring.

**Latency Impact**: No thread-per-request overhead, excellent for I/O-bound work.

## Usage

```bash
python thread_pool.py
python producer_consumer.py
```
