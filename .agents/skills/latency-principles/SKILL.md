---
name: latency-principles
description: "Comprehensive guide for diagnosing, optimizing, and hiding latency in software systems. Use when: (1) Debugging slow performance, (2) Designing low-latency architectures (HFT, Real-time systems), (3) Optimizing Data/Compute layers, or (4) Learning about latency theory (Little's Law, Amdahl's Law, Tail Latency, Coordinated Omission)."
---

# Latency Principles

Based on "Latency: Reduce delay in software systems" by Pekka Enberg (Manning, 2026).

This skill provides a systematic framework for minimizing delay in software systems, covering the entire stack from Physics and Hardware to Application Architecture and User Experience.

## Quick Decision Guide

| Symptom | Probable Cause | Recommended Strategy |
|---------|----------------|----------------------|
| **High Avg Latency** | Sequential processing / Slow I/O | **Concurrency** (Async I/O) or **Partitioning** |
| **High Tail Latency (p99)** | Lock contention / GC / Neighbor noise | **Wait-free Sync** (Atomics) or **Request Hedging** |
| **Network Slowness** | Distance / Protocol overhead | **Colocation** (Edge) or **Binary Serialization** (Protobuf) |
| **Database Load** | Hot keys / Complex queries | **Caching** (Read-through) or **Materialized Views** |
| **Slow Writes** | ACID guarantees / Indexing | **Write-Behind Caching** or **Sharding** |
| **"It feels slow"** | UI blocking on network | **Optimistic Updates** or **Prefetching** |

---

## Part 1: Fundamentals (Start Here)
Core theory and diagnostic approaches.

- **[references/principles.md](references/principles.md)**: Definitions of Little's Law, Amdahl's Law, Tail Latency, Compounding Latency, and Latency Distribution.
- **[references/diagnostic_checklist.md](references/diagnostic_checklist.md)**: Step-by-step checklist for identifying bottlenecks across Hardware, OS, and Runtime.

---

## Part 2: Data Layer
Optimizing storage and access patterns.

**Problem**: Database queries slow, network round-trips killing performance, throughput low.

**[references/data_patterns.md](references/data_patterns.md)** covers:
- **Colocation**: Moving code to data (Edge, Kernel-bypass, NUMA awareness)
- **Partitioning**: Sharding strategies (Horizontal, Vertical, Functional)
- **Caching**: Strategies (Cache-aside, Read-through, Write-behind) and Eviction policies (LRU, LFU, FIFO)
- **Replication**: Consistency models (Strong vs Eventual) and topologies (Single-leader, Multi-leader, Leaderless)

---

## Part 3: Compute Layer
Optimizing processing logic and synchronization.

**Problem**: High CPU usage, lock contention, GC pauses, slow algorithms.

**[references/compute_optimization.md](references/compute_optimization.md)** covers:
- **Eliminating Work**: Better algorithms, Zero-copy serialization (FlatBuffers), Object pooling
- **Wait-Free Sync**: Atomics, Memory barriers, Ring Buffers, Lock-free structures
- **Concurrency**: Thread-per-core, Coroutines, Event-driven, Actor model

---

## Part 4: Hiding Latency
When you can't make it faster, make it feel faster.

**Problem**: Backend cannot be made faster, but user experience feels sluggish.

**[references/hiding_latency.md](references/hiding_latency.md)** covers:
- **Asynchronous Processing**: Event loops, Non-blocking I/O, Request Hedging, Request Batching
- **Predictive Techniques**: Prefetching (Sequential, Spatial, Semantic), Optimistic UI updates, Speculative execution

---

## Bundled Resources

### Scripts
Use these for diagnostics and quick calculations:
- **[scripts/diagnose_latency.py](scripts/diagnose_latency.py)**: Interactive diagnostic checklist runner
- **[scripts/latency_constants.py](scripts/latency_constants.py)**: Latency constants for ballpark calculations

### Code Examples
See **[code-examples/](code-examples/)** for implementations of key techniques from the book.

---

## Latency Constants (Quick Reference)

| Operation | Time | Order |
|-----------|------|-------|
| CPU cycle (3 GHz) | 0.3 ns | 10⁻¹ |
| L1 cache access | 1 ns | 10⁰ |
| DRAM access | 100 ns | 10² |
| NVMe disk access | 10 μs | 10⁴ |
| SSD disk access | 100 μs | 10⁵ |
| Network NYC → London | 60 ms | 10⁷ |

### Human Perception
| Perception | Time |
|------------|------|
| Immediate (no delay perceived) | < 100 ms |
| Instant (feels fast) | < 1 s |
| Slow | > 10 s |
