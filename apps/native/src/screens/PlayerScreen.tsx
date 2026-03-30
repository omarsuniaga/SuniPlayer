import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  useWindowDimensions, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore, useSettingsStore, useLibraryStore, sumTrackDurationMs, getTrackUrl } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { audioEngine } from '../platform';
import { colors } from '../theme/colors';
import { TrackProfileModal } from '../components/TrackProfileModal';
import { SheetMusicViewer } from '../components/SheetMusicViewer';
import type { SheetEntry } from '../components/SheetMusicViewer';
import { Waveform } from '../components/Waveform';

// ── Helpers ──────────────────────────────────────────────────────────────────

function moodColor(mood?: string): string {
  const map: Record<string, string> = {
    alegre: '#22c55e', festivo: '#f59e0b', energético: '#ef4444',
    energetico: '#ef4444', romántico: '#ec4899', romantico: '#ec4899',
    melancólico: '#8b5cf6', melancolico: '#8b5cf6', tranquilo: '#0ea5e9',
    dark: '#6b7280', épico: '#f97316', epico: '#f97316', latino: '#eab308',
  };
  return map[mood?.toLowerCase() ?? ''] ?? colors.accent;
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

function fmtMin(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Circular time display (mood-colored ring) ─────────────────────────────────
// A solid circular border colored by mood, with remaining time inside.
// Progress is already shown by the linear ProgressBar below NowPlaying.

function ProgressRing({ progress, color, size = 100 }: { progress: number; color: string; size?: number }) {
  // Border opacity scales with remaining progress: full at 100%, dim at 0%
  const opacity = 0.15 + 0.85 * Math.max(0, Math.min(1, progress));
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 6, borderColor: color,
      opacity, alignItems: 'center', justifyContent: 'center',
    }} />
  );
}

// ── Tag pill ──────────────────────────────────────────────────────────────────

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Now Playing header ────────────────────────────────────────────────────────

function NowPlaying({
  track, positionMs, color, isIPad, onProfile, onSheetMusic,
}: {
  track: Track | null; positionMs: number; color: string; isIPad: boolean;
  onProfile: () => void; onSheetMusic: () => void;
}) {
  if (!track) return null;
  const durationMs = track.duration_ms ?? 0;
  const remaining = Math.max(0, durationMs - positionMs);
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const ringSize = isIPad ? 130 : 100;
  const hasSheetMusic = (track.sheetMusic?.length ?? 0) > 0;

  return (
    <View style={styles.nowPlayingRow}>
      <View style={styles.nowPlayingInfo}>
        {/* Title row with action buttons */}
        <View style={styles.titleRow}>
          <Text style={[styles.trackTitle, isIPad && styles.trackTitleLarge, { flex: 1 }]} numberOfLines={2}>
            {track.title}
          </Text>
          <View style={styles.trackActionBtns}>
            {/* Profile / edit button */}
            <TouchableOpacity
              style={styles.trackActionBtn}
              onPress={onProfile}
              accessibilityLabel="Editar perfil de canción"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.trackActionBtnText}>👤</Text>
            </TouchableOpacity>
            {/* Sheet music button — only visible if track has sheets */}
            {hasSheetMusic && (
              <TouchableOpacity
                style={[styles.trackActionBtn, { backgroundColor: '#8b5cf620', borderColor: '#8b5cf6' }]}
                onPress={onSheetMusic}
                accessibilityLabel="Ver partitura"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.trackActionBtnText}>🎼</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
        <View style={styles.tagsRow}>
          {track.bpm ? <Tag label={`${track.bpm} BPM`} color={colors.accent} /> : null}
          {track.key ? <Tag label={track.key} color="#8b5cf6" /> : null}
          {track.mood ? <Tag label={track.mood} color={color} /> : null}
        </View>
      </View>
      <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
        <ProgressRing progress={progress} color={color} size={ringSize} />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.ringCenter}>
            <Text style={[styles.ringTime, { color }]}>{fmt(remaining)}</Text>
            <Text style={styles.ringLabel}>restante</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Set stats footer ──────────────────────────────────────────────────────────

function SetStats({ queue, ci, positionMs, elapsed, color }: {
  queue: Track[]; ci: number; positionMs: number; elapsed: number; color: string;
}) {
  const total = sumTrackDurationMs(queue);
  const played = sumTrackDurationMs(queue.slice(0, ci)) + positionMs;
  const remaining = Math.max(0, total - played);
  const progress = total > 0 ? played / total : 0;

  return (
    <View style={styles.statsBox}>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statsLabel}>SET ELAPSED</Text>
          <Text style={[styles.statsValue, { color: colors.accent }]}>{fmtMin(elapsed * 1000)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.statsLabel}>REMAINING</Text>
          <Text style={[styles.statsValue, { color }]}>{fmtMin(remaining)}</Text>
        </View>
      </View>
      <View style={styles.statsBar}>
        <View style={[styles.statsBarFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statsTotal}>Total set: {fmtMin(total)}</Text>
    </View>
  );
}

// ── Next track preview ────────────────────────────────────────────────────────

function NextTrack({ track }: { track: Track | null }) {
  if (!track) return null;
  return (
    <View style={styles.nextBox}>
      <Text style={styles.nextLabel}>A CONTINUACIÓN</Text>
      <Text style={styles.nextTitle} numberOfLines={1}>{track.title}</Text>
      <Text style={styles.nextArtist} numberOfLines={1}>{track.artist} · {track.bpm} BPM</Text>
    </View>
  );
}

// ── Transport Controls ────────────────────────────────────────────────────────

function TransportControls({ isPlaying, onPlay, onPause, onNext, onPrev, hasNext, hasPrev, color, isIPad }: {
  isPlaying: boolean; onPlay: () => void; onPause: () => void;
  onNext: () => void; onPrev: () => void; hasNext: boolean; hasPrev: boolean;
  color: string; isIPad: boolean;
}) {
  const btnSize = isIPad ? 100 : 76;
  return (
    <View style={styles.transport}>
      <TouchableOpacity onPress={onPrev} disabled={!hasPrev} style={[styles.skipBtn, !hasPrev && styles.disabled]}>
        <Text style={styles.skipIcon}>⏮</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={isPlaying ? onPause : onPlay}
        style={[styles.playBtn, { width: btnSize, height: btnSize, borderRadius: btnSize / 2, shadowColor: color }]}
        accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext} disabled={!hasNext} style={[styles.skipBtn, !hasNext && styles.disabled]}>
        <Text style={styles.skipIcon}>⏭</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Queue item ────────────────────────────────────────────────────────────────

function QueueItem({ track, index, isActive, isPlaying, onPress }: {
  track: Track; index: number; isActive: boolean; isPlaying: boolean; onPress: () => void;
}) {
  const mc = moodColor(track.mood);
  return (
    <TouchableOpacity
      style={[styles.queueItem, isActive && { backgroundColor: mc + '15', borderColor: mc + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.queueIdx}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.queueInfo}>
        <Text style={[styles.queueTitle, isActive && { color: '#fff' }]} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.queueArtist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.queueBpm}>{track.bpm} BPM</Text>
        <Text style={styles.queueDur}>{fmt(track.duration_ms)}</Text>
      </View>
      {isActive && isPlaying && (
        <View style={styles.playingDots}>
          <View style={[styles.dot, { height: 8, backgroundColor: mc }]} />
          <View style={[styles.dot, { height: 14, backgroundColor: mc }]} />
          <View style={[styles.dot, { height: 6, backgroundColor: mc }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Live mode banner ──────────────────────────────────────────────────────────

function LiveBanner({ onExit }: { onExit: () => void }) {
  return (
    <View style={styles.liveBanner}>
      <View style={styles.liveDot} />
      <Text style={styles.liveBannerText}>MODO LIVE — controles de edición bloqueados</Text>
      <TouchableOpacity onPress={onExit} style={styles.liveExitBtn}>
        <Text style={styles.liveExitText}>SALIR</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main PlayerScreen ─────────────────────────────────────────────────────────

export function PlayerScreen() {
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;

  const queue = usePlayerStore(s => s.pQueue);
  const ci = usePlayerStore(s => s.ci);
  const setCi = usePlayerStore(s => s.setCi);
  const isPlaying = usePlayerStore(s => s.playing);
  const setPlaying = usePlayerStore(s => s.setPlaying);
  const vol = usePlayerStore(s => s.vol);
  const setVol = usePlayerStore(s => s.setVol);
  const elapsed = usePlayerStore(s => s.elapsed);
  const setElapsed = usePlayerStore(s => s.setElapsed);
  const mode = usePlayerStore(s => s.mode);
  const setMode = usePlayerStore(s => s.setMode);
  
  // Settings
  const autoNext = useSettingsStore(s => s.autoNext);
  const fadeEnabled = useSettingsStore(s => s.fadeEnabled);
  const fadeInMs = useSettingsStore(s => s.fadeInMs);
  const fadeOutMs = useSettingsStore(s => s.fadeOutMs);
  const crossfade = useSettingsStore(s => s.crossfade);
  const crossfadeMs = useSettingsStore(s => s.crossfadeMs);

  const [positionMs, setPositionMs] = useState(0);
  const [bufferedMs, setBufferedMs] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSheetMusic, setShowSheetMusic] = useState(false);
  const elapsedRef = useRef(elapsed);
  const isTransitioningRef = useRef(false);

  const currentTrack: Track | null = queue[ci] ?? null;
  const nextTrack: Track | null = queue[ci + 1] ?? null;
  const color = moodColor(currentTrack?.mood);

  const updateTrack = useLibraryStore(s => s.updateTrack);

  // ── Audio engine hooks ──
  useEffect(() => {
    let active = true; // guard against state updates after unmount

    audioEngine.onPositionUpdate(ms => {
      if (!active) return;
      setPositionMs(ms);
      if (isPlaying) {
        elapsedRef.current += 0.25;
        setElapsed(elapsedRef.current);

        // ── Smooth Transitions (Fade Out) ──
        if (autoNext && currentTrack && !isTransitioningRef.current) {
          const duration = currentTrack.duration_ms ?? 0;
          const triggerMs = crossfade ? crossfadeMs : (fadeEnabled ? fadeOutMs : 0);
          
          if (triggerMs > 0 && duration > 0 && triggerMs < duration && ms >= (duration - triggerMs)) {
            isTransitioningRef.current = true;
            audioEngine.fadeVolume(0, triggerMs)
              .catch(err => console.error('[PlayerScreen] Fade out failed:', err));
          }
        }
      }
    });
    audioEngine.onEnded(() => {
      if (!active) return;
      isTransitioningRef.current = false;
      
      if (autoNext && ci < queue.length - 1) {
        setCi(ci + 1);
        // Fade in is handled by the useEffect loading currentTrack
      } else {
        setPlaying(false);
      }
    });
    audioEngine.onBufferUpdate(buffered => {
      if (!active) return;
      setBufferedMs(buffered);
    });
    audioEngine.onBufferingChange(buffering => {
      if (!active) return;
      setIsBuffering(buffering);
    });
    audioEngine.onError(err => {
      console.error('[PlayerScreen]', err);
      if (!active) return;
      setPlaying(false);
      Alert.alert('Error de reproducción', `No se pudo cargar el audio.\n${err.message}`);
    });

    return () => {
      active = false;
      // Clear listeners so stale closures don't fire after deps change
      audioEngine.onPositionUpdate(() => {});
      audioEngine.onBufferUpdate(() => {});
      audioEngine.onBufferingChange(() => {});
      audioEngine.onEnded(() => {});
      audioEngine.onError(() => {});
    };
  }, [ci, queue.length, autoNext, isPlaying, currentTrack, crossfade, crossfadeMs, fadeEnabled, fadeOutMs]);

  useEffect(() => {
    if (!currentTrack) return;
    isTransitioningRef.current = false;
    // Resolve URL with remote streaming fallback for demo assets
    const url = getTrackUrl(currentTrack, 'https://suniplayer.netlify.app/audio/');
    setPositionMs(0);
    setBufferedMs(0);
    setIsBuffering(false);
    
    if (!url) {
      Alert.alert('Sin audio', 'Este track no tiene archivo de audio asignado.');
      return;
    }

    const startVolume = (fadeEnabled || crossfade) ? 0 : vol;
    audioEngine.load(url, {
      id: currentTrack.id,
      initialVolume: startVolume,
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.artwork,
      duration: currentTrack.duration_ms,
    })
      .then(async () => {
        if (isPlaying) {
          await audioEngine.play();
          if (fadeEnabled || crossfade) {
            audioEngine.fadeVolume(vol, fadeInMs || crossfadeMs)
              .catch(err => console.error('[PlayerScreen] Fade in failed:', err));
          }
        }
      })
      .catch(err => console.error('[PlayerScreen] audioEngine.load failed:', err));
  }, [currentTrack?.id]);

  // ── Handlers ──
  const handlePlay = useCallback(async () => {
    setPlaying(true);
    try {
      const { fadeEnabled, fadeInMs, crossfade, crossfadeMs } = useSettingsStore.getState();
      const { vol } = usePlayerStore.getState();
      if (fadeEnabled || crossfade) {
        // Garantiza fade-in desde 0, sin importar cómo se pausó antes
        await audioEngine.setVolume(0);
      } else {
        audioEngine.setVolume(vol);
      }
      await audioEngine.play();
      if (fadeEnabled || crossfade) {
        audioEngine.fadeVolume(vol, crossfade ? crossfadeMs : fadeInMs)
          .catch(err => console.warn('[PlayerScreen] handlePlay fade failed:', err));
      }
    } catch (err) {
      console.error('[PlayerScreen] handlePlay failed:', err);
      setPlaying(false);
      Alert.alert('Error de reproducción', 'No se pudo iniciar el audio. Verifica el archivo.');
    }
  }, []);
  const handlePause = useCallback(async () => {
    const { fadeEnabled, fadeOutMs, crossfade, crossfadeMs } = useSettingsStore.getState();
    if (fadeEnabled || crossfade) {
      await audioEngine.fadeVolume(0, crossfade ? crossfadeMs : fadeOutMs).catch(() => {});
    }
    audioEngine.pause();
    setPlaying(false);
  }, []);
  const handleNext = useCallback(async () => {
    const { mode: currentMode, ci: currentCi, pQueue, playing } = usePlayerStore.getState();
    if (currentMode === 'live') return;
    if (currentCi >= pQueue.length - 1) return;

    if (playing) {
      const { fadeEnabled, fadeOutMs, crossfade, crossfadeMs } = useSettingsStore.getState();
      if (fadeEnabled || crossfade) {
        isTransitioningRef.current = true; // bloquea el trigger automático de fade-out
        await audioEngine.fadeVolume(0, crossfade ? crossfadeMs : fadeOutMs).catch(() => {});
        // isTransitioningRef se resetea en el useEffect de load del próximo track
      }
    }

    setCi(currentCi + 1);
    setPositionMs(0);
  }, []);

  const handlePrev = useCallback(async () => {
    const { mode: currentMode, ci: currentCi, playing } = usePlayerStore.getState();
    if (currentMode === 'live') return;
    if (currentCi <= 0) return;

    if (playing) {
      const { fadeEnabled, fadeOutMs, crossfade, crossfadeMs } = useSettingsStore.getState();
      if (fadeEnabled || crossfade) {
        isTransitioningRef.current = true;
        await audioEngine.fadeVolume(0, crossfade ? crossfadeMs : fadeOutMs).catch(() => {});
      }
    }

    setCi(currentCi - 1);
    setPositionMs(0);
  }, []);

  const handleEnterLive = useCallback(() => {
    Alert.alert('Modo Live', '¿Entrar al modo live? Los controles de edición se bloquearán.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Entrar', style: 'destructive', onPress: () => setMode('live') },
    ]);
  }, []);
  const handleExitLive = useCallback(() => setMode('edit'), []);

  // ── Track profile save — must be before any early returns (Rules of Hooks) ──
  const handleSaveProfile = useCallback((updates: Partial<Track>) => {
    if (!currentTrack) return;
    if (currentTrack.isCustom) {
      updateTrack(currentTrack.id, updates);
    }
    const updatedQueue = queue.map((t, i) => i === ci ? { ...t, ...updates } : t);
    usePlayerStore.getState().setPQueue(updatedQueue);
  }, [currentTrack, queue, ci, updateTrack]);

  const isLive = mode === 'live';

  // ── Empty state ──
  if (!queue.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>Sin set cargado</Text>
          <Text style={styles.emptySub}>Ve al Armador para generar un set</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Player content ──
  const playerContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.playerContent}>
      {isLive && <LiveBanner onExit={handleExitLive} />}

      <NowPlaying
        track={currentTrack} positionMs={positionMs} color={color} isIPad={isIPad}
        onProfile={() => setShowProfile(true)}
        onSheetMusic={() => setShowSheetMusic(true)}
      />

      <View style={styles.progressContainer}>
        <Text style={styles.progressTime}>{fmt(positionMs)}</Text>
        <Waveform
          positionMs={positionMs}
          durationMs={currentTrack?.duration_ms ?? 0}
          color={color}
          markers={currentTrack?.markers}
          onSeek={(ms) => audioEngine.seek(ms)}
        />
        <Text style={styles.progressTime}>{fmt(currentTrack?.duration_ms ?? 0)}</Text>
      </View>

      <TransportControls
        isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause}
        onNext={handleNext} onPrev={handlePrev}
        hasNext={!isLive && ci < queue.length - 1}
        hasPrev={!isLive && ci > 0}
        color={color} isIPad={isIPad}
      />

      {/* Volume */}
      <View style={styles.volRow}>
        <Text style={styles.volIcon}>🔉</Text>
        <Slider
          style={{ flex: 1 }}
          value={vol}
          onValueChange={setVol}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={color}
          maximumTrackTintColor={colors.border}
          thumbTintColor={color}
          accessibilityLabel="Volumen"
        />
        <Text style={[styles.volPct, { color }]}>{Math.round(vol * 100)}%</Text>
      </View>

      <NextTrack track={nextTrack} />

      <SetStats queue={queue} ci={ci} positionMs={positionMs} elapsed={elapsed} color={color} />

      {/* Live mode toggle */}
      <TouchableOpacity
        style={[styles.liveToggle, isLive && { backgroundColor: color + '20', borderColor: color }]}
        onPress={isLive ? handleExitLive : handleEnterLive}
      >
        <Text style={[styles.liveToggleText, isLive && { color }]}>
          {isLive ? 'EXIT LIVE MODE' : 'ENTER LIVE MODE'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const queueContent = (
    <FlatList
      data={queue}
      keyExtractor={t => t.id}
      renderItem={({ item, index }) => (
        <QueueItem
          track={item} index={index} isActive={index === ci} isPlaying={isPlaying}
          onPress={() => { if (!isLive) { setCi(index); setPositionMs(0); } }}
        />
      )}
    />
  );

  // ── Shared modals ──
  const modals = (
    <>
      {showProfile && currentTrack && (
        <TrackProfileModal
          track={currentTrack}
          onSave={handleSaveProfile}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showSheetMusic && currentTrack && (currentTrack.sheetMusic?.length ?? 0) > 0 && (
        <SheetMusicViewer
          items={(currentTrack.sheetMusic ?? []) as SheetEntry[]}
          onClose={() => setShowSheetMusic(false)}
        />
      )}
    </>
  );

  // ── iPad split layout ──
  if (isIPad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.split}>
          <View style={styles.queuePanel}>
            <Text style={styles.queueHeader}>SETLIST · {queue.length} canciones</Text>
            {queueContent}
          </View>
          <View style={styles.playerPanel}>{playerContent}</View>
        </View>
        {modals}
      </SafeAreaView>
    );
  }

  // ── Phone layout ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.phoneHeader}>
        <Text style={styles.phoneTitle}>Reproductor</Text>
        <TouchableOpacity onPress={() => setShowQueue(!showQueue)} style={styles.queueToggleBtn}>
          <Text style={styles.queueToggleText}>{showQueue ? 'OCULTAR' : `SETLIST (${queue.length})`}</Text>
        </TouchableOpacity>
      </View>
      {showQueue ? queueContent : playerContent}
      {modals}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Layout
  split: { flex: 1, flexDirection: 'row' },
  queuePanel: { width: 320, borderRightWidth: 1, borderRightColor: colors.border },
  playerPanel: { flex: 1 },
  phoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  phoneTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  queueToggleBtn: { backgroundColor: colors.bgElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  queueToggleText: { color: colors.accent, fontSize: 12, fontWeight: '700' },

  playerContent: { padding: 20, gap: 24 },

  // Empty state
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
  emptySub: { color: colors.textSecondary, fontSize: 14 },

  // Now playing
  nowPlayingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  nowPlayingInfo: { flex: 1, gap: 6 },
  trackTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  trackTitleLarge: { fontSize: 36, lineHeight: 42 },
  trackArtist: { color: colors.textSecondary, fontSize: 16 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '800' },

  // Track action buttons (profile + sheet music)
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  trackActionBtns: { flexDirection: 'row', gap: 6, marginTop: 4, flexShrink: 0 },
  trackActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  trackActionBtnText: { fontSize: 16 },

  // Ring
  ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  ringTime: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  ringLabel: { fontSize: 8, color: colors.textMuted, textTransform: 'uppercase', marginTop: 2 },

  // Progress bar
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressFillAbsolute: { position: 'absolute', top: 0, left: 0 },
  bufferingSpinner: { position: 'absolute', right: -20, top: -8 },
  progressTime: { color: colors.textSecondary, fontSize: 12, width: 42, textAlign: 'center', fontVariant: ['tabular-nums'] },

  // Transport
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  skipBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  skipIcon: { fontSize: 28 },
  disabled: { opacity: 0.25 },
  playBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  playIcon: { fontSize: 32, color: '#fff', marginLeft: 2 },

  // Volume
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  volIcon: { fontSize: 20 },
  volPct: { fontSize: 14, fontWeight: '700', width: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },

  // Next track
  nextBox: { backgroundColor: colors.bgSurface, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  nextLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  nextTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  nextArtist: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

  // Set stats
  statsBox: { backgroundColor: colors.bgSurface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  statsValue: { fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statsBar: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  statsBarFill: { height: '100%', borderRadius: 3 },
  statsTotal: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },

  // Live mode
  liveBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: colors.accent + '15', borderRadius: 8, borderWidth: 1, borderColor: colors.accent + '40' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveBannerText: { flex: 1, color: colors.accent, fontSize: 12, fontWeight: '700' },
  liveExitBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.accent + '20', borderRadius: 6 },
  liveExitText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  liveToggle: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  liveToggleText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },

  // Queue
  queueHeader: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  queueItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, borderWidth: 1, borderColor: 'transparent', borderRadius: 8, marginHorizontal: 6, marginVertical: 2 },
  queueIdx: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'], width: 22 },
  queueInfo: { flex: 1, minWidth: 0 },
  queueTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  queueArtist: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  queueBpm: { color: colors.textMuted, fontSize: 11 },
  queueDur: { color: colors.textSecondary, fontSize: 12, fontVariant: ['tabular-nums'] },
  playingDots: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 },
  dot: { width: 3, borderRadius: 1.5 },
});
