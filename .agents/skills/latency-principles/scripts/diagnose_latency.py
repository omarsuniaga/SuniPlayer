#!/usr/bin/env python3
"""
Latency Diagnostic Checklist Runner

Interactive CLI to walk through latency diagnostic questions.
Based on references/diagnostic_checklist.md
"""

import sys
from typing import List, Dict, Any

CATEGORIES = {
    "Measurement & Baselines": [
        {
            "question": "Are you looking at latency distribution (p50, p99, Max)?",
            "hint": "Average latency hides outliers. Use histograms or percentiles.",
            "severity": "high",
        },
        {
            "question": "Have you measured latency breakdown (network, processing, queuing)?",
            "hint": "Use distributed tracing (Jaeger, Zipkin) or application logs.",
            "severity": "high",
        },
        {
            "question": "Is this running on bare metal, VM, or container?",
            "hint": "Virtualization adds overhead. Bare metal is best for ultra-low latency.",
            "severity": "medium",
        },
    ],
    "Infrastructure & Hardware": [
        {
            "question": "Are client and server geographically close?",
            "hint": "Every 100km adds ~0.5ms light travel time.",
            "severity": "high",
        },
        {
            "question": "Is CPU utilization high (causing queuing)?",
            "hint": "High CPU = requests waiting in queue. Target < 70% utilization.",
            "severity": "high",
        },
        {
            "question": "Is CPU frequency scaling enabled?",
            "hint": "P-states add wakeup latency. Disable for consistent latency.",
            "severity": "medium",
        },
        {
            "question": "Is SMT/Hyperthreading enabled?",
            "hint": "Shared resources can cause contention. Disable for ultra-low latency.",
            "severity": "medium",
        },
        {
            "question": "Is the application swapping to disk?",
            "hint": "Disk latency is 1000x slower than RAM. Check vm.swappiness.",
            "severity": "critical",
        },
    ],
    "Application & Runtime": [
        {
            "question": "Are you blocking on I/O in the hot path?",
            "hint": "Use async I/O (epoll, io_uring, kqueue) to avoid blocking threads.",
            "severity": "high",
        },
        {
            "question": "Are thread pools sized correctly?",
            "hint": "Apply Little's Law: L = λ × W. Too few threads = queuing, too many = context switching.",
            "severity": "high",
        },
        {
            "question": "Is there excessive locking/mutex contention?",
            "hint": "High lock contention causes serialization. Consider lock-free structures.",
            "severity": "high",
        },
        {
            "question": "Are long GC pauses occurring?",
            "hint": "Check GC logs. Consider tuning heap size or switching to GC-less language.",
            "severity": "medium",
        },
    ],
    "Architecture": [
        {
            "question": "Does a single request fan out to N parallel sub-requests?",
            "hint": "Tail at Scale: probability of slow request increases with fanout.",
            "severity": "high",
        },
        {
            "question": "Are slow external services called serially?",
            "hint": "Parallelize independent calls. Use Promise.all or async gather.",
            "severity": "high",
        },
        {
            "question": "Are there N+1 query problems?",
            "hint": "Use JOINs, batch fetches, or DataLoader pattern.",
            "severity": "high",
        },
        {
            "question": "Are database indexes missing?",
            "hint": "Check EXPLAIN plans. Add indexes for filter/join columns.",
            "severity": "high",
        },
    ],
    "Network": [
        {
            "question": "Is DNS resolution cached?",
            "hint": "DNS lookup adds ~20-100ms. Cache at application level.",
            "severity": "medium",
        },
        {
            "question": "Are connections reused (Keep-Alive/Connection Pools)?",
            "hint": "TCP handshake adds ~10ms, TLS handshake ~50ms.",
            "severity": "high",
        },
        {
            "question": "Are you using JSON for serialization?",
            "hint": "JSON parsing is slow. Consider protobuf, msgpack, or flatbuffers.",
            "severity": "medium",
        },
    ],
}


def run_diagnostic() -> List[Dict[str, Any]]:
    """Run through all diagnostic questions and collect answers."""
    findings = []

    print("=" * 60)
    print("LATENCY DIAGNOSTIC CHECKLIST")
    print("=" * 60)
    print("Answer each question (y/n). Type 'q' to quit.\n")

    for category, questions in CATEGORIES.items():
        print(f"\n## {category}")
        print("-" * 40)

        for q in questions:
            while True:
                response = (
                    input(f"  [{q['severity'].upper()}] {q['question']} (y/n): ")
                    .strip()
                    .lower()
                )

                if response == "q":
                    print("\nExiting...")
                    sys.exit(0)
                elif response in ("y", "n"):
                    break
                else:
                    print("  Please enter 'y', 'n', or 'q'")

            if response == "y":
                findings.append(
                    {
                        "category": category,
                        "question": q["question"],
                        "hint": q["hint"],
                        "severity": q["severity"],
                    }
                )
                print(f"    -> NOTED: {q['hint']}")

    return findings


def print_summary(findings: List[Dict[str, Any]]) -> None:
    """Print a summary of findings."""
    print("\n" + "=" * 60)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 60)

    if not findings:
        print("\nNo issues detected! Your system looks good.")
        return

    severity_order = {"critical": 0, "high": 1, "medium": 2}
    findings.sort(key=lambda x: severity_order.get(x["severity"], 3))

    by_severity = {"critical": [], "high": [], "medium": []}
    for f in findings:
        by_severity[f["severity"]].append(f)

    for severity in ["critical", "high", "medium"]:
        items = by_severity[severity]
        if items:
            print(f"\n{severity.upper()} PRIORITY ({len(items)} items):")
            for item in items:
                print(f"  [{item['category']}] {item['question']}")
                print(f"    -> {item['hint']}")

    print("\n" + "=" * 60)
    print("RECOMMENDED NEXT STEPS")
    print("=" * 60)
    print("""
1. Address CRITICAL items first (likely cause of major latency)
2. Then HIGH items (significant impact)
3. Then MEDIUM items (optimization opportunities)

For more details, see:
- references/diagnostic_checklist.md (full checklist)
- references/principles.md (theory)
- references/data_patterns.md (data layer fixes)
- references/compute_optimization.md (compute layer fixes)
""")


def main():
    findings = run_diagnostic()
    print_summary(findings)


if __name__ == "__main__":
    main()
