jest.mock('react-native-track-player', () => ({
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setRate: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn().mockResolvedValue(undefined),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  Event: {
    PlaybackProgressUpdated: 'playback-progress-updated',
    PlaybackQueueEnded: 'playback-queue-ended',
    PlaybackError: 'playback-error',
  },
}));

import { ExpoAudioEngine } from '../platform/ExpoAudioEngine';

describe('ExpoAudioEngine', () => {
  let engine: ExpoAudioEngine;
  beforeEach(() => { engine = new ExpoAudioEngine(); });
  afterEach(() => { engine.dispose(); });

  it('satisfies IAudioEngine interface — all 11 methods present', () => {
    const methods = ['load','play','pause','seek','setPitch','setTempo','setVolume',
      'onPositionUpdate','onEnded','onError','dispose'];
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

  it('clamps volume to [0,1]', () => {
    const TP = require('react-native-track-player');
    engine.setVolume(1.5);
    expect(TP.setVolume).toHaveBeenCalledWith(1);
    engine.setVolume(-0.5);
    expect(TP.setVolume).toHaveBeenCalledWith(0);
  });
});
