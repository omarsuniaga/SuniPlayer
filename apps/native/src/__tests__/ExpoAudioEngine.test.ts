jest.mock('react-native-track-player', () => ({
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  updateOptions: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setRate: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn().mockResolvedValue(undefined),
  getVolume: jest.fn().mockResolvedValue(1),
  getPosition: jest.fn().mockResolvedValue(30),   // 30 segundos
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  Event: {
    PlaybackProgressUpdated: 'playback-progress-updated',
    PlaybackState: 'playback-state',
    PlaybackQueueEnded: 'playback-queue-ended',
    PlaybackError: 'playback-error',
  },
  State: {
    None: 'none',
    Ready: 'ready',
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
    Buffering: 'buffering',
    Loading: 'loading',
    Error: 'error',
  },
  Capability: {
    Play: 'play',
    Pause: 'pause',
    SkipToNext: 'skip-to-next',
    SkipToPrevious: 'skip-to-previous',
    Stop: 'stop',
  },
  IOSCategory: {
    Playback: 'playback',
  },
  IOSCategoryMode: {
    Default: 'default',
  },
  IOSCategoryOptions: {
    AllowBluetooth: 'allow-bluetooth',
    AllowBluetoothA2DP: 'allow-bluetooth-a2dp',
  },
  AndroidAudioContentType: {
    Music: 'music',
  },
  AppKilledPlaybackBehavior: {
    StopPlaybackAndRemoveNotification: 'stop-playback-and-remove-notification',
  },
}));

import { ExpoAudioEngine } from '../platform/ExpoAudioEngine';

describe('ExpoAudioEngine', () => {
  let engine: ExpoAudioEngine;
  beforeEach(() => {
    jest.clearAllMocks(); // limpia historial de llamadas; NO borra las implementaciones mockResolvedValue
    engine = new ExpoAudioEngine();
  });
  afterEach(() => { engine.dispose(); });

  it('satisfies IAudioEngine interface — all 15 methods present', () => {
    const methods = [
      'load', 'play', 'pause', 'seek', 'getPosition',
      'fadeVolume', 'setPitch', 'setTempo', 'setVolume',
      'onPositionUpdate', 'onBufferUpdate', 'onBufferingChange',
      'onEnded', 'onError', 'dispose',
    ];
    methods.forEach(m => expect(typeof (engine as Record<string,unknown>)[m]).toBe('function'));
  });

  it('calls TrackPlayer.play on play()', async () => {
    const TP = require('react-native-track-player');
    await engine.load('file:///test.mp3');
    await engine.play();
    expect(TP.play).toHaveBeenCalled();
  });

  it('calls TrackPlayer.pause on pause()', async () => {
    const TP = require('react-native-track-player');
    await engine.load('file:///test.mp3');
    engine.pause();
    expect(TP.pause).toHaveBeenCalled();
  });

  it('converts ms to seconds on seek()', async () => {
    const TP = require('react-native-track-player');
    engine.seek(5000);
    expect(TP.seekTo).toHaveBeenCalledWith(5);
  });

  it('passes metadata correctly to TrackPlayer.add', async () => {
    const TP = require('react-native-track-player');
    await engine.load('file:///test.mp3', {
      title: 'Test Song',
      artist: 'Test Artist',
      duration: 180000,
    });
    expect(TP.add).toHaveBeenCalledWith({
      url: 'file:///test.mp3',
      title: 'Test Song',
      artist: 'Test Artist',
      artwork: undefined,
      duration: 180,
    });
  });

  it('clamps volume to [0,1]', () => {
    const TP = require('react-native-track-player');
    engine.setVolume(1.5);
    expect(TP.setVolume).toHaveBeenCalledWith(1);
    engine.setVolume(-0.5);
    expect(TP.setVolume).toHaveBeenCalledWith(0);
  });

  it('getPosition returns ms (seconds × 1000)', async () => {
    const TP = require('react-native-track-player');
    TP.getPosition.mockResolvedValueOnce(30); // 30 s
    const ms = await engine.getPosition();
    expect(ms).toBe(30000);
  });

  it('fadeVolume reaches target volume after duration', async () => {
    // Usamos timers reales con duración corta para evitar conflictos fake-timer + async/await
    const TP = require('react-native-track-player');
    TP.getVolume.mockResolvedValueOnce(0);

    await engine.fadeVolume(0.8, 100); // 100 ms → 2 pasos × 50 ms

    const calls = (TP.setVolume.mock.calls as number[][]).map(c => c[0]);
    expect(calls[calls.length - 1]).toBeCloseTo(0.8, 1);
  }, 3000);

  it('fadeVolume cancels previous fade when called again', async () => {
    const TP = require('react-native-track-player');
    TP.getVolume.mockResolvedValue(0);

    // Inicia un fade largo sin await
    engine.fadeVolume(1.0, 5000).catch(() => {});

    // Espera un tick para que el primer fade arranque
    await new Promise(r => setTimeout(r, 60));

    // Cancela con un segundo fade y espera que termine
    await engine.fadeVolume(0.5, 100);

    const calls = (TP.setVolume.mock.calls as number[][]).map(c => c[0]);
    expect(calls[calls.length - 1]).toBeCloseTo(0.5, 1);
  }, 3000);

  it('onBufferUpdate fires callback with ms', async () => {
    const TP = require('react-native-track-player');
    await engine.load('file:///test.mp3'); // inicializa + adjunta listeners

    const bufferCb = jest.fn();
    engine.onBufferUpdate(bufferCb);

    // Obtener el handler del evento (clearAllMocks garantiza que solo hay uno)
    const progressCall = TP.addEventListener.mock.calls.find(
      ([event]: [string]) => event === 'playback-progress-updated'
    );
    expect(progressCall).toBeDefined();
    const handler = progressCall[1];
    handler({ position: 10, buffered: 45 });

    expect(bufferCb).toHaveBeenCalledWith(45000); // 45 s → 45000 ms
  });

  it('onBufferingChange fires true on State.Buffering, false otherwise', async () => {
    const TP = require('react-native-track-player');
    await engine.load('file:///test.mp3');

    const bufferingCb = jest.fn();
    engine.onBufferingChange(bufferingCb);

    const stateCall = TP.addEventListener.mock.calls.find(
      ([event]: [string]) => event === 'playback-state'
    );
    expect(stateCall).toBeDefined();
    const handler = stateCall[1];

    handler({ state: 'buffering' });
    expect(bufferingCb).toHaveBeenCalledWith(true);

    handler({ state: 'playing' });
    expect(bufferingCb).toHaveBeenCalledWith(false);
  });
});
