# Serialization Examples

Techniques for reducing serialization/deserialization latency.

## Patterns Covered

### JSON vs Binary Formats
JSON is human-readable but slow to parse. Binary formats like Protocol Buffers and FlatBuffers are faster.

**Latency Comparison** (typical):
- JSON parse: ~1-5ms per 10KB
- Protobuf parse: ~0.1-0.5ms per 10KB (10x faster)
- FlatBuffers: ~0.01-0.05ms per 10KB (100x faster, zero-copy)

### Zero-Copy
FlatBuffers allows accessing serialized data without unpacking.

**Latency Impact**: No allocation, no parsing step.

### Schema Evolution
Binary formats support schema evolution (adding fields without breaking old code).

## Usage

```bash
python benchmark.py
python flatbuffers_example.py  # Requires flatbuffers installed
```
