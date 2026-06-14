#!/usr/bin/env python3
"""
Cache-Aside Pattern Example

Demonstrates the cache-aside (lazy loading) caching pattern.
On cache miss, loads from "database" and populates cache.

Latency comparison:
- Cache hit: ~0.1ms (memory access)
- Cache miss (with load): ~10ms (DB query + cache write)
"""

import time
import random
from typing import Optional, Dict, Any, Callable
from functools import wraps


class CacheAside:
    """Cache-aside cache implementation."""

    def __init__(self, db: Dict[str, Any], ttl: float = 60.0):
        self.cache: Dict[str, Any] = {}
        self.db = db
        self.ttl = ttl
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache or DB."""
        # Check cache
        if key in self.cache:
            value, expiry = self.cache[key]
            if time.time() < expiry:
                self.hits += 1
                return value
            else:
                # Expired
                del self.cache[key]

        # Cache miss - load from DB
        self.misses += 1
        if key in self.db:
            value = self.db[key]
            # Populate cache
            self.cache[key] = (value, time.time() + self.ttl)
            return value
        return None

    def invalidate(self, key: str) -> None:
        """Invalidate cache entry."""
        if key in self.cache:
            del self.cache[key]

    def stats(self) -> Dict[str, Any]:
        """Return cache statistics."""
        total = self.hits + self.misses
        hit_rate = self.hits / total if total > 0 else 0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1%}",
            "size": len(self.cache),
        }


def simulate_db_query(latency_ms: float = 10.0) -> Callable:
    """Decorator to simulate DB query latency."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            time.sleep(latency_ms / 1000)  # Simulate DB latency
            return func(*args, **kwargs)

        return wrapper

    return decorator


@simulate_db_query(5.0)  # Simulate 5ms DB query
def fetch_from_db(db: Dict, key: str) -> Any:
    """Simulated database fetch."""
    return db.get(key)


def main():
    # Simulated database
    db = {
        "user:1": {"id": 1, "name": "Alice", "email": "alice@example.com"},
        "user:2": {"id": 2, "name": "Bob", "email": "bob@example.com"},
        "user:3": {"id": 3, "name": "Charlie", "email": "charlie@example.com"},
    }

    cache = CacheAside(db, ttl=30.0)

    print("=" * 50)
    print("CACHE-ASIDE PATTERN DEMO")
    print("=" * 50)

    # First access (cache miss -> DB)
    print("\n## First access to user:1 (cache miss)")
    start = time.perf_counter()
    result = cache.get("user:1")
    elapsed = (time.perf_counter() - start) * 1000
    print(f"  Result: {result}")
    print(f"  Latency: {elapsed:.2f}ms (includes DB)")

    # Second access (cache hit)
    print("\n## Second access to user:1 (cache hit)")
    start = time.perf_counter()
    result = cache.get("user:1")
    elapsed = (time.perf_counter() - start) * 1000
    print(f"  Result: {result}")
    print(f"  Latency: {elapsed:.2f}ms")

    # Access multiple keys
    print("\n## Accessing multiple keys")
    keys = ["user:1", "user:2", "user:3", "user:1", "user:2", "user:1"]
    for key in keys:
        start = time.perf_counter()
        cache.get(key)
        elapsed = (time.perf_counter() - start) * 1000
        status = "HIT" if key in cache.cache else "MISS"
        print(f"  {key}: {elapsed:.2f}ms ({status})")

    print("\n## Cache Statistics")
    stats = cache.stats()
    for k, v in stats.items():
        print(f"  {k}: {v}")

    print("\n" + "=" * 50)
    print("KEY INSIGHT")
    print("=" * 50)
    print("""
Cache-aside is robust because the app controls everything.
However, first request is slow (cache miss penalty).
For predictable low latency, consider Read-Through or
pre-warming the cache.
""")


if __name__ == "__main__":
    main()
