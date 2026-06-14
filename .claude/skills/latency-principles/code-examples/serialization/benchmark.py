#!/usr/bin/env python3
"""
Serialization Benchmark: JSON vs MessagePack vs Protobuf

Compares serialization latency for different formats.
Note: This uses pure Python implementations for demonstration.
For production, use compiled implementations (orjson, protobuf).

Latency impact of serialization:
- JSON: Slowest, but human-readable
- MessagePack: Binary, ~2-3x faster than JSON
- Protobuf: Schema-based, ~5-10x faster than JSON
- FlatBuffers: Zero-copy, ~10-100x faster (requires schema)
"""

import json
import time
import random
import string
from typing import Any, Dict, List


def generate_test_data(num_records: int = 1000) -> List[Dict[str, Any]]:
    """Generate test data similar to a typical API response."""
    data = []
    for i in range(num_records):
        data.append(
            {
                "id": i,
                "username": "".join(random.choices(string.ascii_lowercase, k=10)),
                "email": f"user{i}@example.com",
                "active": random.choice([True, False]),
                "created_at": "2024-01-15T10:30:00Z",
                "profile": {
                    "name": f"User {i}",
                    "bio": "Lorem ipsum " * 5,
                    "avatar_url": f"https://example.com/avatars/{i}.jpg",
                },
                "tags": ["python", "performance", "optimization"][
                    : random.randint(1, 3)
                ],
                "stats": {
                    "posts": random.randint(0, 1000),
                    "followers": random.randint(0, 10000),
                    "following": random.randint(0, 5000),
                },
            }
        )
    return data


class SerializationBenchmark:
    """Benchmark different serialization formats."""

    def __init__(self, data: List[Dict]):
        self.data = data
        self.encoded: Dict[str, bytes] = {}

    def encode_json(self) -> bytes:
        """Encode using JSON."""
        return json.dumps(self.data).encode("utf-8")

    def decode_json(self, payload: bytes) -> Any:
        """Decode JSON."""
        return json.loads(payload.decode("utf-8"))

    def run_benchmark(
        self, name: str, encode_fn, decode_fn, iterations: int = 100
    ) -> Dict:
        """Run a benchmark iteration."""
        # Encode
        encode_times = []
        for _ in range(iterations):
            start = time.perf_counter()
            encoded = encode_fn()
            encode_times.append(time.perf_counter() - start)

        # Store encoded
        self.encoded[name] = encoded

        # Decode
        decode_times = []
        for _ in range(iterations):
            start = time.perf_counter()
            decoded = decode_fn(encoded)
            decode_times.append(time.perf_counter() - start)

        # Calculate stats
        import statistics

        return {
            "name": name,
            "size_bytes": len(encoded),
            "encode_avg_ms": statistics.mean(encode_times) * 1000,
            "decode_avg_ms": statistics.mean(decode_times) * 1000,
            "total_latency_ms": (
                statistics.mean(encode_times) + statistics.mean(decode_times)
            )
            * 1000,
        }

    def print_results(self):
        """Print benchmark results."""
        print("\n## Results")
        print("-" * 70)
        print(f"{'Format':<15} {'Size':>8} {'Encode':>10} {'Decode':>10} {'Total':>10}")
        print("-" * 70)

        for result in self.results:
            print(
                f"{result['name']:<15} "
                f"{result['size_bytes']:>7,} B "
                f"{result['encode_avg_ms']:>9.2f}ms "
                f"{result['decode_avg_ms']:>9.2f}ms "
                f"{result['total_latency_ms']:>9.2f}ms"
            )


def main():
    print("=" * 70)
    print("SERIALIZATION BENCHMARK")
    print("=" * 70)

    # Generate test data
    print("\nGenerating test data...")
    data = generate_test_data(100)
    print(f"Generated {len(data)} records")

    # Estimate JSON size
    json_size = len(json.dumps(data))
    print(f"Estimated JSON size: {json_size:,} bytes ({json_size / 1024:.1f} KB)")

    benchmark = SerializationBenchmark(data)

    # Run JSON benchmark
    print("\nRunning JSON benchmark...")
    results = []

    result = benchmark.run_benchmark(
        "JSON", benchmark.encode_json, benchmark.decode_json, iterations=500
    )
    results.append(result)

    # Try MessagePack if available
    try:
        import msgpack

        def encode_msgpack():
            return msgpack.packb(data, use_bin_type=True)

        def decode_msgpack(payload):
            return msgpack.unpackb(payload, raw=False)

        print("Running MessagePack benchmark...")
        result = benchmark.run_benchmark(
            "MessagePack", encode_msgpack, decode_msgpack, iterations=500
        )
        results.append(result)
    except ImportError:
        print("\nMessagePack not installed. Install with: pip install msgpack")

    # Try orjson if available (faster JSON)
    try:
        import orjson

        def encode_orjson():
            return orjson.dumps(data)

        def decode_orjson(payload):
            return orjson.loads(payload)

        print("Running orjson benchmark...")
        result = benchmark.run_benchmark(
            "orjson (fast JSON)", encode_orjson, decode_orjson, iterations=500
        )
        results.append(result)
    except ImportError:
        print("\norjson not installed. Install with: pip install orjson")

    # Print results
    print("\n" + "=" * 70)
    print("BENCHMARK RESULTS")
    print("=" * 70)

    print(f"\n{'Format':<20} {'Size':>10} {'Encode':>10} {'Decode':>10} {'Total':>10}")
    print("-" * 70)

    for r in results:
        print(
            f"{r['name']:<20} "
            f"{r['size_bytes']:>9,} B "
            f"{r['encode_avg_ms']:>9.2f}ms "
            f"{r['decode_avg_ms']:>9.2f}ms "
            f"{r['total_latency_ms']:>9.2f}ms"
        )

    # Compare
    if len(results) > 1:
        baseline = results[0]
        print("\n## Speedup vs JSON")
        for r in results[1:]:
            speedup = baseline["total_latency_ms"] / r["total_latency_ms"]
            size_ratio = r["size_bytes"] / baseline["size_bytes"]
            print(f"  {r['name']}: {speedup:.1f}x faster, {size_ratio:.1%} size")

    print("\n" + "=" * 70)
    print("KEY INSIGHTS")
    print("=" * 70)
    print("""
1. Binary formats (MessagePack, Protobuf) are faster to parse
2. orjson is a drop-in JSON replacement with significant speedup
3. For ultra-low latency, consider FlatBuffers (zero-copy)
4. Schema evolution is easier with Protobuf/FlatBuffers

Latency savings accumulate:
- 10K requests/sec saving 1ms each = 10 seconds saved per second
""")


if __name__ == "__main__":
    main()
