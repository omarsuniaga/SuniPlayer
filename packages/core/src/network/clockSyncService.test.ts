// packages/core/src/network/clockSyncService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClockSyncService } from './clockSyncService';

describe('ClockSyncService', () => {
    let service: ClockSyncService;
    let mockNow = 1000;

    const addSample = ({
        leaderOffsetMs = 50,
        outboundMs = 5,
        processingMs = 2,
        inboundMs = 5,
    }: {
        leaderOffsetMs?: number;
        outboundMs?: number;
        processingMs?: number;
        inboundMs?: number;
    } = {}) => {
        const t1 = mockNow;
        const t2 = t1 + leaderOffsetMs + outboundMs;
        const t3 = t2 + processingMs;
        const t4 = t1 + outboundMs + processingMs + inboundMs;

        vi.spyOn(performance, 'now').mockReturnValue(t4);
        service.addSample(t1, t2, t3);
        mockNow += 100;
    };

    beforeEach(() => {
        service = new ClockSyncService();
        vi.useFakeTimers();
        mockNow = 1000;
    });

    it('should initialize as UNCALIBRATED', () => {
        expect(service.getStatus()).toBe('UNCALIBRATED');
        expect(service.getOffset()).toBeNull();
    });

    it('should calculate offset correctly after INITIAL_SAMPLES', () => {
        // Mock performance.now()
        let mockNow = 1000;
        vi.spyOn(performance, 'now').mockImplementation(() => mockNow);

        // Simulate 10 samples with a constant offset of 50ms
        // Leader is 50ms ahead of local: Local = Leader - 50ms
        // T1: Local send, T2: Leader recv, T3: Leader send, T4: Local recv
        for (let i = 0; i < 10; i++) {
            const t1 = mockNow;
            const t2 = t1 + 50 + 5; // Leader recv (50ms offset + 5ms travel)
            const t3 = t2 + 2;      // Leader processing (2ms)
            mockNow += 12;          // Local now (5ms travel back + 2ms processing + some overhead)
            service.addSample(t1, t2, t3);
        }

        expect(service.getStatus()).toBe('SYNCED');
        const offset = service.getOffset();
        expect(offset).not.toBeNull();
        // Offset = ((T2 - T1) + (T3 - T4)) / 2
        // Sample 1: ((1055 - 1000) + (1057 - 1012)) / 2 = (55 + 45) / 2 = 50ms
        expect(offset?.offsetMs).toBeCloseTo(50, 1);
    });

    it('should use EMA to smooth offset changes when SYNCED', () => {
        // 1. Get synced at 50ms offset
        let mockNow = 1000;
        vi.spyOn(performance, 'now').mockImplementation(() => mockNow);
        
        const syncAt = (targetOffset: number) => {
            for (let i = 0; i < 10; i++) {
                const t1 = mockNow;
                const t2 = t1 + targetOffset + 5;
                const t3 = t2 + 2;
                mockNow += 12;
                service.addSample(t1, t2, t3);
            }
        };

        syncAt(50);
        const firstOffset = service.getOffset()?.offsetMs || 0;
        expect(firstOffset).toBeCloseTo(50, 1);

        // 2. Add samples with 60ms offset
        // EMA_ALPHA = 0.3
        // NewOffset = (60 * 0.3) + (50 * 0.7) = 18 + 35 = 53ms
        for (let i = 0; i < 5; i++) {
            const t1 = mockNow;
            const t2 = t1 + 60 + 5;
            const t3 = t2 + 2;
            mockNow += 12;
            service.addSample(t1, t2, t3);
        }

        const secondOffset = service.getOffset()?.offsetMs || 0;
        expect(secondOffset).toBeGreaterThan(50);
        expect(secondOffset).toBeLessThan(60);
        expect(secondOffset).toBeCloseTo(53, 1);
    });

    it('should handle leaderToLocal conversion', () => {
        // Sync at 50ms (Leader is ahead)
        // Mock implementation of addSample to skip internal details
        (service as any).currentOffset = { offsetMs: 50 };
        (service as any).status = 'SYNCED';

        const leaderTime = 2000;
        const localTime = service.leaderToLocal(leaderTime);
        // LocalTime = LeaderTime - OffsetMs = 2000 - 50 = 1950
        expect(localTime).toBe(1950);
    });

    it('should discard the highest RTT outliers before calculating the burst median', () => {
        for (let i = 0; i < 8; i++) {
            addSample({ leaderOffsetMs: 50, outboundMs: 5, inboundMs: 5 });
        }

        // Two noisy samples with very high RTT and a bogus offset.
        addSample({ leaderOffsetMs: 400, outboundMs: 150, inboundMs: 150 });
        addSample({ leaderOffsetMs: -250, outboundMs: 160, inboundMs: 140 });

        expect(service.getStatus()).toBe('SYNCED');
        expect(service.getOffset()?.offsetMs).toBeCloseTo(50, 1);
        expect(service.getOffset()?.sampleCount).toBe(8);
    });

    it('should enter DRIFTING when the burst has high standard deviation', () => {
        const offsets = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

        for (const offset of offsets) {
            addSample({ leaderOffsetMs: offset, outboundMs: 5, inboundMs: 5 });
        }

        expect(service.getStatus()).toBe('DRIFTING');
        expect(service.getOffset()).not.toBeNull();
        expect(service.getOffset()?.stdDevMs).toBeGreaterThan(2);
    });

    it('should convert local timestamps back to leader time once synced', () => {
        (service as any).currentOffset = { offsetMs: 37.5 };
        (service as any).status = 'SYNCED';

        expect(service.localToLeader(1000)).toBe(1037.5);
    });

    it('should fully reset calibration state', () => {
        (service as any).currentOffset = { offsetMs: 50 };
        (service as any).status = 'SYNCED';

        service.reset();

        expect(service.getStatus()).toBe('UNCALIBRATED');
        expect(service.getOffset()).toBeNull();
    });
});
