# Data Patterns for Low Latency

Optimizing data storage and access is often the highest-leverage activity for reducing latency. This reference covers strategies for placing, copying, and slicing data.

## 1. Colocation
Bringing data closer to computation to minimize signal propagation delay.

### Internode (Distributed Systems)
- **Geographical**: Host data in the same region as the user (e.g., AWS us-east-1 for East Coast users).
- **Edge Computing**: Move compute to the edge (CDNs, Cloudflare Workers) to process data near the user.
- **CDNs**: Cache static assets and dynamic content geographically close to users.

### Intranode (Single Machine)
- **Network Stack**:
  - **Kernel-bypass**: Use DPDK or XDP/eBPF to process packets in userspace or hardware, bypassing OS kernel overhead.
  - **Interrupt Affinity**: Pin NIC interrupts to specific CPU cores to avoid context switching costs.
- **Memory Topology (NUMA)**: Ensure threads access memory attached to their local CPU socket. Remote memory access is significantly slower.

## 2. Replication
Maintaining multiple copies of data for availability and lower read latency.

### Replication Strategies
- **Single-Leader**: One node accepts writes; others replicate. Simple but write-limited.
- **Multi-Leader**: Multiple nodes accept writes. Lower write latency (local writes) but requires conflict resolution.
- **Leaderless**: Any node accepts writes (e.g., Dynamo-style). Lowest latency but requires quorum consistency adjustments.

### Consistency Models
- **Strong Consistency (Linearizability)**: Illusion of one data copy. High latency due to coordination (waiting for acks).
- **Eventual Consistency**: Replicas converge over time. Lowest latency but allows stale reads.
- **Causal Consistency**: Guarantees order of causally related events. Middle ground.

### State Machine Replication
- Uses consensus algorithms (Raft, Paxos, VSR) to keep replicas in sync.
- **Trade-off**: Trades latency for fault tolerance (requires majority quorum).

## 3. Partitioning (Sharding)
Slicing data into smaller, independent chunks to reduce contention and increase concurrency.

### Physical Strategies
- **Horizontal (Sharding)**: Split rows into different tables/nodes (e.g., Users 1-1000 on Node A). Best for OLTP.
- **Vertical**: Split columns into different storage (e.g., separating "Blob" columns from metadata). Best for OLAP/Analytics.
- **Hybrid**: Combine both (e.g., vertical partition first, then horizontally shard the columns).

### Logical Strategies
- **Functional**: Separate by business domain (e.g., Catalog vs. Orders).
- **Geographical**: Partition by user location (e.g., EU users in Frankfurt).
- **Time-based**: Partition by time (e.g., Logs per day). Useful for time-series.

### Request Routing
- **Direct**: Client knows topology and calls partition directly (Fastest, high coupling).
- **Proxy**: Client calls proxy, which routes to partition (Extra hop, decoupled).
- **Forward**: Client calls any node, node forwards if it doesn't own the data (P2P).

### Mitigating Imbalance
- **Hot Partitions**: Caused by poor key choice or "celebrity" records. Use better hashing or over-partitioning.
- **Skewed Workloads**: Temporal skew (Black Friday). Requires overprovisioning or dynamic splitting.

## 4. Caching
Temporary storage of expensive-to-fetch data.

### Strategies
- **Cache-Aside**: App reads cache; on miss, app reads DB and updates cache. (Robust, but stale data risk).
- **Read-Through**: App reads cache; on miss, cache reads DB. (Simplifies app, transparent).
- **Write-Through**: Write to cache; cache writes to DB synchronously. (Safe, high write latency).
- **Write-Behind**: Write to cache; cache writes to DB asynchronously. (Fastest writes, risk of data loss).

### Replacement Policies
- **LRU (Least Recently Used)**: Good for temporal locality.
- **LFU (Least Frequently Used)**: Good for stable popularity distributions.
- **FIFO/SIEVE**: Low overhead, often outperforms LRU in practice.

### Advanced
- **Materialized Views**: Precomputed query results stored as tables. incremental updates hide complex query latency.
- **Memoization**: Caching function results (e.g., in-memory map of input->output).
