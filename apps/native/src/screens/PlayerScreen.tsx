import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore, useSettingsStore } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { audioEngine } from '../platform';
import { TransportControls } from '../components/TransportControls';
import { ProgressBar } from '../components/ProgressBar';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';

export function PlayerScreen() {
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;

  // Real store API: pQueue, playing, setPlaying, setCi
  const queue = usePlayerStore(s => s.pQueue);
  const ci = usePlayerStore(s => s.ci);
  const isPlaying = usePlayerStore(s => s.playing);
  const setPlaying = usePlayerStore(s => s.setPlaying);
  const setCi = usePlayerStore(s => s.setCi);
  const autoNext = useSettingsStore(s => s.autoNext);

  const [positionMs, setPositionMs] = useState(0);
  const currentTrack: Track | null = queue[ci] ?? null;

  useEffect(() => {
    audioEngine.onPositionUpdate(setPositionMs);
    audioEngine.onEnded(() => {
      if (autoNext && ci < queue.length - 1) {
        setCi(ci + 1);
      } else {
        setPlaying(false);
      }
    });
    audioEngine.onError(err => console.error('[PlayerScreen]', err));
  }, [ci, queue.length, autoNext]);

  useEffect(() => {
    if (!currentTrack) return;
    const url = currentTrack.blob_url ?? currentTrack.file_path;
    audioEngine.load(url, { initialVolume: useSettingsStore.getState().defaultVol });
  }, [currentTrack?.id]);

  const handlePlay = useCallback(() => { audioEngine.play(); setPlaying(true); }, []);
  const handlePause = useCallback(() => { audioEngine.pause(); setPlaying(false); }, []);
  const handleNext = useCallback(() => { if (ci < queue.length - 1) setCi(ci + 1); }, [ci, queue.length]);
  const handlePrev = useCallback(() => { if (ci > 0) setCi(ci - 1); }, [ci]);

  if (!queue.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin set cargado</Text>
          <Text style={styles.emptySub}>Ve al Armador para generar un set</Text>
        </View>
      </SafeAreaView>
    );
  }

  const controls = (
    <>
      <NowPlaying track={currentTrack} />
      <ProgressBar positionMs={positionMs} durationMs={currentTrack?.duration_ms ?? 0} />
      <TransportControls
        isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause}
        onNext={handleNext} onPrev={handlePrev}
        hasNext={ci < queue.length - 1} hasPrev={ci > 0}
      />
    </>
  );

  const queueList = (
    <FlatList
      data={queue}
      keyExtractor={t => t.id}
      renderItem={({ item, index }) => (
        <TrackRow track={item} isActive={index === ci} onPress={() => setCi(index)} />
      )}
    />
  );

  // iPad landscape: split view
  if (isIPad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.split}>
          <View style={styles.queuePanel}>{queueList}</View>
          <View style={styles.playerPanel}>{controls}</View>
        </View>
      </SafeAreaView>
    );
  }

  // Phone / portrait
  return (
    <SafeAreaView style={styles.container}>
      {controls}
      {queueList}
    </SafeAreaView>
  );
}

function NowPlaying({ track }: { track: Track | null }) {
  if (!track) return null;
  return (
    <View style={styles.nowPlaying}>
      <Text style={styles.trackTitle} numberOfLines={2}>{track.title}</Text>
      <Text style={styles.trackArtist}>{track.artist}</Text>
      <Text style={styles.trackMeta}>{track.bpm} BPM · {track.key}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  split: { flex: 1, flexDirection: 'row' },
  queuePanel: { width: 320, borderRightWidth: 1, borderRightColor: colors.border },
  playerPanel: { flex: 1, justifyContent: 'center', gap: 24, padding: 32 },
  nowPlaying: { padding: 24, alignItems: 'center' },
  trackTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  trackArtist: { color: colors.textSecondary, fontSize: 16, marginTop: 8 },
  trackMeta: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
  emptySub: { color: colors.textSecondary, fontSize: 14 },
});
