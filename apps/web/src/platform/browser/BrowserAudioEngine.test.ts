// apps/web/src/platform/browser/BrowserAudioEngine.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserAudioEngine } from './BrowserAudioEngine';

// Mock PitchEngine
vi.mock('../../services/pitchEngine', () => {
    class MockPitchEngine {
        load = vi.fn().mockResolvedValue(true);
        play = vi.fn();
        pause = vi.fn();
        seekToTime = vi.fn();
        audioContext = { currentTime: 10.5 };
        syncRateAdjustment = 1.0;
    }
    return { PitchEngine: MockPitchEngine };
});

describe('BrowserAudioEngine', () => {
    let engine: BrowserAudioEngine;

    beforeEach(() => {
        engine = new BrowserAudioEngine();
    });

    it('should correctly schedule playback at future time', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pitchEngineMock = (engine as any).engine;
        const now = 5000;
        vi.spyOn(performance, 'now').mockReturnValue(now);

        const targetPerfNow = 5200; // 200ms in the future
        const positionMs = 1000;

        await engine.playAt(targetPerfNow, positionMs);

        // formula: targetCtxTime = audioCtx.currentTime + (targetPerfNow - now) / 1000
        // targetCtxTime = 10.5 + (5200 - 5000) / 1000 = 10.5 + 0.2 = 10.7
        expect(pitchEngineMock.play).toHaveBeenCalledWith(10.7);
        expect(pitchEngineMock.seekToTime).toHaveBeenCalledWith(1); // 1000ms = 1s
    });

    it('should set playback rate for synchronization', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pitchEngineMock = (engine as any).engine;
        engine.setPlaybackRate(1.001);
        expect(pitchEngineMock.syncRateAdjustment).toBe(1.001);
    });
});
