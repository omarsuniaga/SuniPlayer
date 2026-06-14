# Latency Diagnostic Checklist

Use this checklist to identify potential sources of latency in a system.

## 1. Measurement & Baselines
- [ ] **Distribution**: Are you looking at p50, p99, and Max latency? (Don't just use average).
- [ ] **Breakdown**: Have you measured:
  - [ ] Network propagation (ping)?
  - [ ] Processing time (application logs/traces)?
  - [ ] Queuing time (load balancer/OS queues)?
- [ ] **Environment**: Is this running on bare metal, VM, or container?

## 2. Infrastructure & Hardware
- [ ] **Distance**: Are client and server geographically close?
- [ ] **CPU**:
  - [ ] Is CPU utilization high? (Queuing)
  - [ ] Is CPU frequency scaling enabled? (Wakeup latency)
  - [ ] Is SMT/Hyperthreading enabled? (Contention)
- [ ] **Memory**:
  - [ ] Is the application swapping? (Disk latency is 1000x slower than RAM)
  - [ ] Cache locality issues?

## 3. Application & Runtime
- [ ] **Concurrency**:
  - [ ] Are you blocking on I/O?
  - [ ] Are thread pools sized correctly? (Little's Law application)
- [ ] **Contention**:
  - [ ] excessive locking/mutex contention?
  - [ ] "Thundering herd" issues?
- [ ] **Runtime**:
  - [ ] **GC**: Are long GC pauses occurring?
  - [ ] **JIT**: Are warm-up periods excluded from measurements?

## 4. Architecture
- [ ] **Fanout**: Does a single request depend on N parallel sub-requests? (Tail at Scale)
- [ ] **Dependencies**: Are you calling slow external services serially?
- [ ] **Databases**:
  - [ ] N+1 query problems?
  - [ ] Missing indexes?

## 5. Network
- [ ] **DNS**: Is DNS resolution cached?
- [ ] **Connections**: Are you reusing connections (Keep-Alive/Connection Pools)?
- [ ] **Protocol**: Overhead of serialization/deserialization?
