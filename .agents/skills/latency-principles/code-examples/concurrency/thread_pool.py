#!/usr/bin/env python3
"""
Thread Pool Sizing using Little's Law

Demonstrates how to correctly size a thread pool using:
    L = λ × W

Where:
    L = Average concurrency (number of threads)
    λ = Throughput (requests/second)
    W = Average latency per request (seconds)
"""

import time
import threading
from dataclasses import dataclass


def main():
    print("=" * 60)
    print("THREAD POOL SIZING WITH LITTLE'S LAW")
    print("=" * 60)

    # Scenario: Web server
    target_throughput = 1000  # requests per second
    avg_latency_ms = 50  # ms per request

    # Little's Law: L = λ × W
    required_concurrency = int(target_throughput * (avg_latency_ms / 1000))

    print(f"\n## Target System")
    print(f"  Target throughput: {target_throughput} req/s")
    print(f"  Avg request latency: {avg_latency_ms}ms")
    print(f"\n  Required concurrency (L = λ × W):")
    print(
        f"  L = {target_throughput} × {avg_latency_ms / 1000} = {required_concurrency} threads"
    )

    print("\n## Little's Law Application")
    print("-" * 60)
    print("""
The formula L = λ × W tells us:
- If you want 1000 req/s at 50ms latency = 50 concurrent requests
- If you have only 25 threads, throughput caps at 500 req/s
- If you have 100 threads but only 50ms work, you waste resources

Finding the sweet spot:
- Too few threads  → Requests queue → Higher latency
- Too many threads → Context switching overhead → Higher latency

Quick reference table:
""")

    # Print quick reference
    print(f"{'Throughput':>12} {'Latency':>10} {'Threads':>10}")
    print("-" * 35)
    for throughput in [100, 500, 1000, 2000]:
        for latency in [10, 50, 100]:
            threads = int(throughput * latency / 1000)
            if threads <= 100:
                print(f"{throughput:>10} req/s {latency:>8}ms {threads:>10}")

    print("\n## Practical Example")
    print("-" * 60)
    print("""
Suppose your /api/users endpoint:
- Currently handles 200 req/s
- Each request takes 100ms CPU time
- Using 10 threads

Current: 10 threads × 10 req/s/thread = 100 req/s (bottlenecked!)

Little's Law: Need 200 × 0.1 = 20 threads for 200 req/s

With 20 threads:
- Latency stays at ~100ms
- Throughput increases to 200 req/s

With 50 threads:
- Same 200 req/s (throughput limited)
- BUT: More context switching → latency increases to ~150ms

Conclusion: Size threads to match throughput × latency
""")


if __name__ == "__main__":
    main()
