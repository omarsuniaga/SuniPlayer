# Latency Principles

Based on "Latency: Reduce delay in software systems" by Pekka Enberg.

## 1. Definition
Latency is the time delay between a cause and its observed effect.
- **Service Time**: Time to process a request.
- **Wait Time**: Time a request waits in queues.
- **Response Time**: Service Time + Wait Time.

## 2. Laws of Latency

### Little's Law
Connects latency, throughput, and concurrency.
`Concurrency (L) = Throughput (λ) * Average Latency (W)`

- **Implication**: To increase throughput without increasing latency, you must increase concurrency (parallelism). If concurrency is fixed, increasing throughput increases latency (queuing).
- **Caveat**: Assumes independent mean throughput/latency. Real systems often see latency rise with throughput due to contention.

### Amdahl's Law
Quantifies theoretical speedup from parallelization.
`Speedup(N) = 1 / ((1 - P) + (P / N))`
- `P`: Parallel portion of the program.
- `N`: Number of processors.
- **Implication**: Speedup is limited by the serial portion (`1 - P`). Diminishing returns kick in quickly.

## 3. Latency Distribution
Average latency hides the truth.
- **Tail Latency**: High percentiles (p95, p99, p99.9, Max).
- **The Tail at Scale**: In systems with high fanout (parallel sub-requests), the probability of a user experiencing tail latency increases dramatically.
  - Probability of request > T = `1 - (1 - p)^N` where `p` is probability of single node > T, and `N` is fanout.

## 4. Sources of Latency
- **Physics**: Speed of light (distance between components).
- **Hardware**:
  - **CPU Caches**: L1 (1ns) vs DRAM (100ns). Cache misses cause variance.
  - **SMT (Hyperthreading)**: Shared resources can cause contention. Disable for ultra-low latency.
  - **Power Saving**: Frequency scaling (CPU sleeping) adds wakeup latency.
- **Virtualization**:
  - **Hypervisor Overhead**: Scheduling, exit/entry costs.
  - **Noisy Neighbors**: Resource contention in cloud.
- **Operating System**:
  - **Context Switching**: Saving/restoring thread state (~µs).
  - **Interrupts**: CPU stops to handle hardware events.
  - **Scheduler**: Queuing delays when waking up threads.
- **Runtimes (Managed)**:
  - **GC**: Stop-the-world pauses.
  - **JIT**: Compilation during execution causes spikes.

## 5. Compounding Latency
- **Serial Compounding**: Latency adds up (`L_total = L1 + L2 + ...`). Optimization requires improving individual steps.
- **Parallel Compounding**: Latency is determined by the slowest path (`L_total = max(L1, L2, ...)`). High fanout increases tail latency risk.

## 6. Trade-offs
- **Latency vs Throughput**: Batching improves throughput but increases per-item latency.
- **Latency vs Energy**: Polling lowers latency but wastes energy. Sleeping saves energy but adds wakeup latency.
