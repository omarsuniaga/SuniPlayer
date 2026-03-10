# Code Examples

This directory contains implementations of key latency optimization techniques from "Latency: Reduce delay in software systems" by Pekka Enberg.

## Structure

```
code-examples/
├── README.md
├── caching/
│   ├── README.md
│   ├── cache_aside.py      # Cache-aside pattern
│   ├── lru_cache.py        # LRU implementation
│   └── ring_buffer.py      # Ring buffer for SPSC
├── concurrency/
│   ├── README.md
│   ├── thread_pool.py      # Thread pool with Little's Law
│   └── producer_consumer.py # Wait-free queue pattern
└── serialization/
    ├── README.md
    ├── benchmark.py        # JSON vs Protobuf benchmark
    └── flatbuffers_example.py
```

## Usage

Each subdirectory contains:
- `README.md`: Explains the technique and its latency impact
- Code examples in Python (and Rust where noted)

### Running Examples

```bash
# Caching examples
cd caching
python cache_aside.py

# Latency constants calculator
cd ../scripts
python latency_constants.py

# Diagnostic checklist
python diagnose_latency.py
```

## Key Techniques Covered

### Caching
- Cache-aside, Read-through, Write-through, Write-behind
- LRU, LFU, FIFO eviction policies
- Ring buffers for lock-free communication

### Concurrency
- Thread pool sizing using Little's Law
- Wait-free single-producer single-consumer (SPSC) queues
- Event-driven architecture patterns

### Serialization
- JSON vs Protocol Buffers vs FlatBuffers benchmark
- Zero-copy techniques
