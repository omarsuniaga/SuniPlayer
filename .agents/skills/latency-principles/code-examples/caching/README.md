# Caching Examples

Techniques for reducing data access latency through caching.

## Patterns Covered

### Cache-Aside (Lazy Loading)
Application manages cache directly. On cache miss, app loads from DB and populates cache.

**Latency Impact**: Eliminates repeated expensive DB queries.

**Trade-offs**: 
- Cache miss latency = DB query + cache write (2x latency on miss)
- Stale data possible
- Cache-aside is robust but requires app logic

### Read-Through
Cache automatically loads from DB on miss.

**Latency Impact**: Cleaner code, but first request still slow.

**Trade-offs**:
- Simpler app code
- Cache handles loading (can use async)
- Same stale data risk

### Write-Behind (Write-Back)
Write to cache immediately, async write to DB.

**Latency Impact**: Fastest write path.

**Trade-offs**:
- Risk of data loss on crash
- Requires durability guarantees

### Ring Buffer (SPSC)
Single-Producer Single-Consumer queue for lock-free communication.

**Latency Impact**: Near-zero latency communication between threads.

**Trade-offs**:
- Fixed size (can drop if full)
- Only works for specific patterns

## Usage

```bash
python cache_aside.py
python lru_cache.py
python ring_buffer.py
```
