// packages/core/src/network/SyncEnsemble.e2e.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IAudioEngine } from '../platform/interfaces/IAudioEngine';
import { TRACKS } from '../data/constants';
import { configureStorage } from '../store/storage';
import { usePlayerStore } from '../store/usePlayerStore';
import { YjsStore } from './crdt/YjsStore';
import { ClockSyncService } from './clockSyncService';
import type { IP2PTransport } from './P2PTransport';
import { SessionManager } from './SessionManager';
import { SyncEnsembleOrchestrator } from './SyncEnsembleOrchestrator';
import type { P2PMessage } from './types';

const memoryState = new Map<string, string>();

const fakeStorage = {
    getItem: async (name: string) => memoryState.get(name) ?? null,
    setItem: async (name: string, value: string) => {
        memoryState.set(name, value);
    },
    removeItem: async (name: string) => {
        memoryState.delete(name);
    },
    getAnalysis: async () => null,
    saveAnalysis: async () => {},
    getWaveform: async () => null,
    saveWaveform: async () => {},
    saveAudioFile: async () => {},
    saveFullTrack: async () => {},
    getAudioFile: async () => null,
    deleteAudioFile: async () => {},
    getAllStoredTrackIds: async () => [],
    exportFullBackup: async () => new Blob(),
    importFullBackup: async () => {},
};

function createAudioEngine(overrides: Partial<IAudioEngine> = {}): IAudioEngine {
    return {
        load: vi.fn(async () => {}),
        play: vi.fn(async () => {}),
        playAt: vi.fn(async () => {}),
        pause: vi.fn(),
        seek: vi.fn(),
        getPosition: vi.fn(async () => 0),
        fadeVolume: vi.fn(async () => {}),
        setPitch: vi.fn(),
        setTempo: vi.fn(),
        setPlaybackRate: vi.fn(),
        setVolume: vi.fn(),
        onPositionUpdate: vi.fn(),
        onBufferUpdate: vi.fn(),
        onBufferingChange: vi.fn(),
        onEnded: vi.fn(),
        onError: vi.fn(),
        dispose: vi.fn(),
        ...overrides,
    };
}

function createLinkedTransportPair() {
    const leaderListeners: Array<(msg: P2PMessage) => void> = [];
    const followerListeners: Array<(msg: P2PMessage) => void> = [];
    const leaderPeerListeners: Array<(peerIds: string[]) => void> = [];
    const followerPeerListeners: Array<(peerIds: string[]) => void> = [];

    const deliver = (listeners: Array<(msg: P2PMessage) => void>, msg: P2PMessage) => {
        listeners.forEach((listener) => listener(msg));
    };

    const leaderTransport: IP2PTransport = {
        broadcast: vi.fn(async (msg: P2PMessage) => deliver(followerListeners, msg)),
        sendTo: vi.fn(async (peerId: string, msg: P2PMessage) => {
            if (peerId === 'follower') deliver(followerListeners, msg);
        }),
        onMessage: (cb) => {
            leaderListeners.push(cb);
        },
        onPeersChange: (cb) => {
            leaderPeerListeners.push(cb);
        },
        getConnectedPeers: () => ['follower'],
    };

    const followerTransport: IP2PTransport = {
        broadcast: vi.fn(async (msg: P2PMessage) => deliver(leaderListeners, msg)),
        sendTo: vi.fn(async (peerId: string, msg: P2PMessage) => {
            if (peerId === 'leader') deliver(leaderListeners, msg);
        }),
        onMessage: (cb) => {
            followerListeners.push(cb);
        },
        onPeersChange: (cb) => {
            followerPeerListeners.push(cb);
        },
        getConnectedPeers: () => ['leader'],
    };

    return {
        leaderTransport,
        followerTransport,
        emitPeers: () => {
            leaderPeerListeners.forEach((listener) => listener(['follower']));
            followerPeerListeners.forEach((listener) => listener(['leader']));
        },
    };
}

describe('SyncEnsemble E2E (Core)', () => {
    let leaderClock: ClockSyncService;
    let followerClock: ClockSyncService;
    let leaderSession: SessionManager;
    let followerSession: SessionManager;
    let leaderOrch: SyncEnsembleOrchestrator;
    let followerOrch: SyncEnsembleOrchestrator;
    let leaderAudio: IAudioEngine;
    let followerAudio: IAudioEngine;
    let transports: ReturnType<typeof createLinkedTransportPair>;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-04T10:00:00.000Z'));
        configureStorage(fakeStorage);
        memoryState.clear();

        usePlayerStore.setState(usePlayerStore.getInitialState(), true);
        usePlayerStore.setState({ pQueue: [TRACKS[0]], ci: 0 });

        leaderClock = new ClockSyncService();
        followerClock = new ClockSyncService();

        leaderAudio = createAudioEngine();
        followerAudio = createAudioEngine({ engine: { isReady: true } } as any);

        leaderSession = new SessionManager(leaderClock, new YjsStore());
        followerSession = new SessionManager(followerClock, new YjsStore());

        leaderOrch = new SyncEnsembleOrchestrator(leaderAudio, leaderSession, leaderClock);
        followerOrch = new SyncEnsembleOrchestrator(followerAudio, followerSession, followerClock);

        transports = createLinkedTransportPair();
        await leaderSession.initialize(transports.leaderTransport, 'leader');
        await followerSession.initialize(transports.followerTransport, 'follower');
        leaderOrch.initialize();
        followerOrch.initialize();
        transports.emitPeers();
    });

    afterEach(() => {
        leaderOrch.stop();
        followerOrch.stop();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        memoryState.clear();
        usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    });

    it('schedules global playback 8 seconds ahead (default for peers) and dispatches to store', async () => {
        leaderSession.createSession('session1', 'Tutti');
        followerSession.joinSession('session1');

        // Note: With 1 peer and 0 readyMembers, countdown is 8s
        const now = Date.now();
        const expectedTarget = now + 8000;

        await leaderOrch.startGlobalPlayback(5000);

        // Check Leader Store
        const leaderScheduled = usePlayerStore.getState().scheduledPlay;
        expect(leaderScheduled?.targetWallMs).toBe(expectedTarget);
        expect(leaderScheduled?.positionMs).toBe(5000);

        // Check Follower Store (received via P2P)
        const followerScheduled = usePlayerStore.getState().scheduledPlay;
        expect(followerScheduled?.targetWallMs).toBe(expectedTarget);
        expect(followerScheduled?.positionMs).toBe(5000);

        const playCalls = (transports.leaderTransport.broadcast as any).mock.calls;
        const playMessage = playCalls.find(([msg]: [P2PMessage]) => msg.type === 'PLAY')?.[0] as P2PMessage | undefined;
        expect(playMessage?.payload.trackId).toBe(TRACKS[0].id);
        expect(playMessage?.payload.targetWallMs).toBe(expectedTarget);
    });

    it('sends CLOCK_PING while calibrating and promotes the leader/member state in the store', async () => {
        leaderSession.createSession('session1', 'Tutti');
        followerSession.joinSession('session1');

        expect(usePlayerStore.getState().sessionId).toBe('session1');
        expect(usePlayerStore.getState().syncStatus).toBe('CALIBRATING');

        vi.spyOn(performance, 'now').mockReturnValue(1000);
        await vi.advanceTimersByTimeAsync(1000);

        const followerBroadcast = transports.followerTransport.broadcast as any;
        const pingMessage = followerBroadcast.mock.calls.find(([msg]: [P2PMessage]) => msg.type === 'CLOCK_PING')?.[0] as P2PMessage | undefined;

        expect(pingMessage).toBeDefined();
        expect(pingMessage?.sessionId).toBe('session1');
        expect(pingMessage?.senderId).toBe('follower');
    });

    it.each([
        { name: 'soft-corrects when follower is ahead by 20ms', myPos: 120, leaderPos: 100, rate: 0.999 },
        { name: 'soft-corrects when follower is behind by 20ms', myPos: 80, leaderPos: 100, rate: 1.001 },
    ])('$name', async ({ myPos, leaderPos, rate }) => {
        followerAudio = createAudioEngine({
            getPosition: vi.fn(async () => myPos),
            setPlaybackRate: vi.fn(),
            engine: { isReady: true },
        } as any);
        followerOrch = new SyncEnsembleOrchestrator(followerAudio, followerSession, followerClock);

        await followerOrch.handlePositionReport(leaderPos);

        expect(followerAudio.setPlaybackRate).toHaveBeenCalledWith(rate);
        expect(followerAudio.seek).not.toHaveBeenCalled();
    });

    it('hard-seeks when drift is >= 150ms and ignores absurd or unready reports', async () => {
        followerAudio = createAudioEngine({
            getPosition: vi.fn(async () => 320),
            setPlaybackRate: vi.fn(),
            seek: vi.fn(),
            engine: { isReady: true },
        } as any);
        followerOrch = new SyncEnsembleOrchestrator(followerAudio, followerSession, followerClock);

        await followerOrch.handlePositionReport(100);

        expect(followerAudio.seek).toHaveBeenCalledWith(100);
        expect(followerAudio.setPlaybackRate).toHaveBeenCalledWith(1.0);

        const unreadyAudio = createAudioEngine({
            getPosition: vi.fn(async () => 50),
            setPlaybackRate: vi.fn(),
            seek: vi.fn(),
            engine: { isReady: false },
        } as any);
        const unreadyOrchestrator = new SyncEnsembleOrchestrator(unreadyAudio, followerSession, followerClock);

        await unreadyOrchestrator.handlePositionReport(100);
        await followerOrch.handlePositionReport(700000);

        expect(unreadyAudio.seek).not.toHaveBeenCalled();
        expect(unreadyAudio.setPlaybackRate).not.toHaveBeenCalled();
        expect((followerAudio.seek as any).mock.calls).toHaveLength(1);
    });
});
