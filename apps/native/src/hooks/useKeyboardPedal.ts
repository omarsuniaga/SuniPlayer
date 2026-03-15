import { useEffect } from 'react';
import { useSettingsStore, usePlayerStore } from '@suniplayer/core';
import type { PedalAction } from '@suniplayer/core';
import { audioEngine } from '../platform';

/**
 * useKeyboardPedal — mounts once in RootLayout.
 *
 * On iPad with a Bluetooth HID pedal (presents as keyboard),
 * key events are captured and dispatched to player actions.
 *
 * Exposes a global `_suniPedalDispatch(keyCode, keyLabel)` function that
 * native key event modules can call. For v2: integrate react-native-keyevent
 * for deeper HID capture.
 */
export function useKeyboardPedal() {
  useEffect(() => {
    function handleKey(keyCode: string, keyLabel: string) {
      const settings = useSettingsStore.getState();

      // Learn mode: capture the next key press and save it as a binding
      if (settings.learningAction) {
        settings.setPedalBinding(settings.learningAction, { key: keyCode, label: keyLabel });
        settings.setLearningAction(null);
        return;
      }

      // Dispatch mode: find action bound to this key
      const bindings = settings.pedalBindings;
      const entry = (Object.entries(bindings) as [PedalAction, { key: string }][])
        .find(([, b]) => b.key === keyCode);
      if (!entry) return;
      const [action] = entry;

      const player = usePlayerStore.getState();
      const currentVol = settings.defaultVol;

      switch (action) {
        case 'next':
          if (player.ci < player.pQueue.length - 1) {
            player.setCi(player.ci + 1);
          }
          break;
        case 'prev':
          if (player.ci > 0) {
            player.setCi(player.ci - 1);
          }
          break;
        case 'play_pause':
          if (player.playing) {
            audioEngine.pause();
            player.setPlaying(false);
          } else {
            audioEngine.play();
            player.setPlaying(true);
          }
          break;
        case 'vol_up': {
          const v = Math.min(1, currentVol + 0.05);
          audioEngine.setVolume(v);
          settings.setDefaultVol(v);
          break;
        }
        case 'vol_down': {
          const v = Math.max(0, currentVol - 0.05);
          audioEngine.setVolume(v);
          settings.setDefaultVol(v);
          break;
        }
      }
    }

    // Expose globally so native key event modules can call it
    (global as typeof global & { _suniPedalDispatch?: typeof handleKey })._suniPedalDispatch = handleKey;
    return () => {
      delete (global as typeof global & { _suniPedalDispatch?: typeof handleKey })._suniPedalDispatch;
    };
  }, []);
}
