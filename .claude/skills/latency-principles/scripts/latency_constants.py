#!/usr/bin/env python3
"""
Latency Constants Reference

Latency constants for ballpark estimations in low-latency system design.
Based on "Latency: Reduce delay in software systems" by Pekka Enberg.

Usage:
    from latency_constants import (
        CPU, MEMORY, STORAGE, NETWORK, HUMAN_PERCEPTION,
        estimate_rtt, estimate_throughput
    )
"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class LatencyConstant:
    """Represents a latency constant with description."""

    operation: str
    time_seconds: float
    order: str
    description: str = ""

    @property
    def time_ns(self) -> float:
        return self.time_seconds * 1e9

    @property
    def time_us(self) -> float:
        return self.time_seconds * 1e6

    @property
    def time_ms(self) -> float:
        return self.time_seconds * 1e3

    def __str__(self) -> str:
        return f"{self.operation}: {self.time_seconds:.1e}s ({self.order})"


# CPU Operations
CPU = {
    "cpu_cycle": LatencyConstant("CPU cycle (3 GHz)", 0.3e-9, "10⁻¹"),
    "l1_cache": LatencyConstant("L1 cache access", 1e-9, "10⁰"),
    "llc_cache": LatencyConstant("LLC cache access", 10e-9, "10¹"),
    "nic_pcie": LatencyConstant("NIC PCIe latency", 1e-6, "10³"),
}

# Memory Operations
MEMORY = {
    "dram_access": LatencyConstant("DRAM access", 100e-9, "10²"),
    "dram_page_fault": LatencyConstant("DRAM page fault", 10e-6, "10⁴"),
}

# Storage Operations
STORAGE = {
    "nvme_access": LatencyConstant("NVMe SSD access", 10e-6, "10⁴"),
    "ssd_access": LatencyConstant("SSD access", 100e-6, "10⁵"),
    "hdd_seek": LatencyConstant("HDD seek", 10e-3, "10⁷"),
    "hdd_read_1mb": LatencyConstant("HDD read 1MB", 20e-3, "10⁷"),
}

# Network Operations (one-way, round-trip)
NETWORK = {
    "localhost": LatencyConstant("Localhost loopback", 0.1e-3, "10⁴"),
    "在同一_machine": LatencyConstant("Same machine (inter-process)", 0.5e-3, "10⁴"),
    "datacenter": LatencyConstant("Within datacenter", 0.5e-3, "10⁴"),
    "region": LatencyConstant("Within region (10km)", 1e-3, "10³"),
    "coast_to_coast_us": LatencyConstant("US coast-to-coast", 40e-3, "10⁷"),
    "eu_to_us": LatencyConstant("Europe to US", 60e-3, "10⁷"),
    "satellite": LatencyConstant("Satellite", 500e-3, "10⁸"),
}

# Human Perception
HUMAN_PERCEPTION = {
    "immediate": LatencyConstant(
        "Immediate (no delay perceived)", 0.1, "10⁻¹", "< 100ms"
    ),
    "instant": LatencyConstant("Instant (feels fast)", 1.0, "10⁰", "< 1s"),
    "slow": LatencyConstant("Slow (noticeable delay)", 10.0, "10¹", "> 10s"),
}


# Additional useful constants
PROTOCOL = {
    "dns_lookup": LatencyConstant("DNS lookup (uncached)", 20e-3, "10⁷"),
    "tcp_handshake": LatencyConstant("TCP handshake", 10e-3, "10⁷"),
    "tls_handshake": LatencyConstant("TLS handshake", 50e-3, "10⁷"),
    "http_request": LatencyConstant("HTTP request (local)", 5e-3, "10⁶"),
    "mysql_query": LatencyConstant("MySQL query (simple)", 5e-3, "10⁶"),
    "mongodb_query": LatencyConstant("MongoDB query", 3e-3, "10⁶"),
}


def estimate_rtt(distance_km: float) -> float:
    """
    Estimate round-trip time based on distance.

    Speed of light in fiber ~ 200,000 km/s (2/3 vacuum)
    Plus switching/processing overhead.
    """
    speed_of_light = 200_000  # km/s
    base_overhead = 10e-3  # 10ms base overhead for routing

    light_time = (distance_km / speed_of_light) * 2  # round trip
    return light_time + base_overhead


def estimate_throughput(latency_ms: float, packet_size: int, mtu: int = 1500) -> float:
    """
    Estimate achievable throughput based on latency.

    TCP throughput is limited by RTT and window size.
    Uses Bandwidth-Delay Product (BDP) concept.
    """
    rtt = latency_ms / 1000  # convert to seconds
    # Max throughput with typical window (64KB for older, 1MB for modern)
    window_size = 64 * 1024  # bytes
    throughput_bps = (window_size * 8) / rtt
    return throughput_bps / 1_000_000  # Mbps


def print_constants():
    """Print all latency constants in a formatted table."""
    print("=" * 70)
    print("LATENCY CONSTANTS REFERENCE")
    print("=" * 70)

    print("\n## CPU & Memory")
    print("-" * 50)
    for const in CPU.values():
        print(f"  {const.operation:30s} {const.time_ns:>10.1f} ns  {const.order}")
    for const in MEMORY.values():
        print(f"  {const.operation:30s} {const.time_us:>10.1f} μs  {const.order}")

    print("\n## Storage")
    print("-" * 50)
    for const in STORAGE.values():
        print(f"  {const.operation:30s} {const.time_ms:>10.1f} ms  {const.order}")

    print("\n## Network")
    print("-" * 50)
    for const in NETWORK.values():
        print(f"  {const.operation:30s} {const.time_ms:>10.1f} ms  {const.order}")

    print("\n## Human Perception")
    print("-" * 50)
    for name, const in HUMAN_PERCEPTION.items():
        print(f"  {const.operation:30s} {const.time_ms:>10.1f} ms")
        if const.description:
            print(f"    {const.description}")

    print("\n## Protocol Overheads")
    print("-" * 50)
    for const in PROTOCOL.values():
        print(f"  {const.operation:30s} {const.time_ms:>10.1f} ms  {const.order}")


if __name__ == "__main__":
    print_constants()
    print("\n## Example Calculations")
    print("-" * 50)
    print(f"NYC -> London (~5500km): {estimate_rtt(5500) * 1000:.1f} ms")
    print(
        f"Throughput @ 50ms RTT (64KB window): {estimate_throughput(50, 1500):.0f} Mbps"
    )
