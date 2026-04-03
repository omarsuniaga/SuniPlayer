import React, { useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  useBuilderStore, usePlayerStore, useSettingsStore,
  useLibraryStore, buildSet, catalog, VENUES, CURVES,
} from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { colors } from '../theme/colors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMin(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function moodColor(mood?: string): string {
  const map: Record<string, string> = {
    alegre: '#22c55e', festivo: '#f59e0b', energético: '#ef4444',
    energetico: '#ef4444', romántico: '#ec4899', romantico: '#ec4899',
    melancólico: '#8b5cf6', melancolico: '#8b5cf6', tranquilo: '#0ea5e9',
    dark: '#6b7280', épico: '#f97316', epico: '#f97316', latino: '#eab308',
  };
  return map[mood?.toLowerCase() ?? ''] ?? colors.accent;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SliderRow({
  label, value, onValueChange, min, max, step, color = colors.accent,
}: {
  label: string; value: number; onValueChange: (v: number) => void;
  min: number; max: number; step: number; color?: string;
}) {
  return (
    <View style={styles.sliderGroup}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Slider
        value={value} onValueChange={onValueChange}
        minimumValue={min} maximumValue={max} step={step}
        minimumTrackTintColor={color} maximumTrackTintColor={colors.border}
        thumbTintColor={color} style={{ marginHorizontal: -4 }}
      />
    </View>
  );
}

function ChipRow<T extends { id: string; label: string; color?: string }>({
  items, selected, onSelect,
}: {
  items: T[]; selected: string; onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {items.map(item => {
        const active = selected === item.id;
        const c = item.color ?? colors.accent;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, active && { backgroundColor: c + '25', borderColor: c }]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.chipText, active && { color: c }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SetTrackRow({ track, index }: { track: Track; index: number }) {
  const mc = moodColor(track.mood);
  const dur = fmtMin(track.duration_ms);
  return (
    <View style={styles.setRow}>
      <Text style={styles.setIdx}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.setInfo}>
        <Text style={styles.setTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.setArtist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[styles.setMood, { color: mc }]}>{track.mood}</Text>
        <Text style={styles.setMeta}>{track.bpm} BPM · {dur}</Text>
      </View>
    </View>
  );
}

// ── Main BuilderScreen ────────────────────────────────────────────────────────

export function BuilderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;

  const targetMin = useBuilderStore(s => s.targetMin);
  const setTargetMin = useBuilderStore(s => s.setTargetMin);
  const venue = useBuilderStore(s => s.venue);
  const setVenue = useBuilderStore(s => s.setVenue);
  const curve = useBuilderStore(s => s.curve);
  const setCurve = useBuilderStore(s => s.setCurve);
  const genSet = useBuilderStore(s => s.genSet);
  const setGenSet = useBuilderStore(s => s.setGenSet);

  const bpmMin = useSettingsStore(s => s.bpmMin);
  const bpmMax = useSettingsStore(s => s.bpmMax);
  const setBpmMin = useSettingsStore(s => s.setBpmMin);
  const setBpmMax = useSettingsStore(s => s.setBpmMax);

  const customTracks = useLibraryStore(s => s.customTracks);

  // Combined repo: user library + built-in catalog (deduped by id)
  const fullRepo = useMemo(() => {
    const seen = new Set<string>();
    const merged: Track[] = [];
    for (const t of [...customTracks, ...(catalog as Track[])]) {
      if (!seen.has(t.id)) { seen.add(t.id); merged.push(t); }
    }
    return merged;
  }, [customTracks]);

  const totalGenMs = useMemo(
    () => genSet.reduce((sum, t) => sum + t.duration_ms, 0),
    [genSet]
  );

  const handleBuild = useCallback(() => {
    const result = buildSet(fullRepo, targetMin * 60, { bpmMin, bpmMax, venue, curve });
    setGenSet(result);
  }, [fullRepo, targetMin, bpmMin, bpmMax, venue, curve]);

  const handleLoadAndPlay = useCallback(() => {
    if (!genSet.length) return;
    usePlayerStore.getState().setPQueue(genSet);
    usePlayerStore.getState().setCi(0);
    usePlayerStore.getState().setPlaying(false);
    // navigate() switches the active tab without adding a new history entry.
    // push('/') would push the player as a stack screen on top of the tabs.
    router.navigate('/');
  }, [genSet, router]);

  const controls = (
    <ScrollView style={styles.controls} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Armador de Set</Text>
      <Text style={styles.subtitle}>
        {fullRepo.length} canciones disponibles
        {customTracks.length > 0 ? ` (${customTracks.length} de tu biblioteca)` : ''}
      </Text>

      <SectionTitle>DURACIÓN</SectionTitle>
      <SliderRow
        label={`${targetMin} minutos`}
        value={targetMin} onValueChange={v => setTargetMin(Math.round(v))}
        min={15} max={120} step={5} color={colors.accent}
      />

      <SectionTitle>RANGO DE BPM</SectionTitle>
      <SliderRow
        label={`Mínimo: ${bpmMin} BPM`}
        value={bpmMin} onValueChange={v => setBpmMin(Math.round(v))}
        min={40} max={bpmMax - 5} step={5}
      />
      <SliderRow
        label={`Máximo: ${bpmMax} BPM`}
        value={bpmMax} onValueChange={v => setBpmMax(Math.round(v))}
        min={bpmMin + 5} max={220} step={5}
      />

      <SectionTitle>AMBIENTE</SectionTitle>
      <ChipRow items={VENUES} selected={venue} onSelect={setVenue} />

      <SectionTitle>CURVA DE ENERGÍA</SectionTitle>
      <ChipRow
        items={CURVES.map(c => ({ id: c.id, label: c.label, color: colors.accent }))}
        selected={curve} onSelect={setCurve}
      />
      {CURVES.find(c => c.id === curve) && (
        <Text style={styles.curveDesc}>{CURVES.find(c => c.id === curve)!.desc}</Text>
      )}

      <TouchableOpacity style={styles.buildBtn} onPress={handleBuild} activeOpacity={0.85}>
        <Text style={styles.buildBtnText}>⚡ Generar Set</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const result = genSet.length > 0 ? (
    <View style={styles.result}>
      <View style={styles.resultHeader}>
        <View>
          <Text style={styles.resultTitle}>{genSet.length} canciones</Text>
          <Text style={styles.resultDur}>{fmtMin(totalGenMs)}</Text>
        </View>
        <TouchableOpacity style={styles.loadBtn} onPress={handleLoadAndPlay} activeOpacity={0.85}>
          <Text style={styles.loadBtnText}>▶ Cargar y Reproducir</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={genSet}
        keyExtractor={t => t.id}
        renderItem={({ item, index }) => <SetTrackRow track={item} index={index} />}
        scrollEnabled={!isIPad}
      />
    </View>
  ) : (
    <View style={styles.emptyResult}>
      <Text style={styles.emptyResultText}>
        Ajusta los parámetros y toca{'\n'}"Generar Set"
      </Text>
    </View>
  );

  if (isIPad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.split}>
          <View style={styles.controlsPanel}>{controls}</View>
          <View style={styles.resultPanel}>{result}</View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {controls}
      {result}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // iPad split
  split: { flex: 1, flexDirection: 'row' },
  controlsPanel: { width: 360, borderRightWidth: 1, borderRightColor: colors.border },
  resultPanel: { flex: 1 },

  // Controls
  controls: { padding: 20, maxHeight: 520 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: 20 },

  sectionTitle: {
    color: colors.textMuted, fontSize: 10, fontWeight: '900',
    letterSpacing: 1.5, marginTop: 20, marginBottom: 10,
  },

  sliderGroup: { marginBottom: 8 },
  sliderLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: 2 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent',
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  curveDesc: { color: colors.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },

  // Generate button
  buildBtn: {
    backgroundColor: colors.accent, padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20, marginBottom: 8,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  buildBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Result panel
  result: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  resultTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  resultDur: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  loadBtn: {
    backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyResult: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyResultText: {
    color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22,
  },

  // Set track row
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  setIdx: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'], width: 22 },
  setInfo: { flex: 1, minWidth: 0 },
  setTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  setArtist: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  setMood: { fontSize: 11, fontWeight: '700' },
  setMeta: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] },
});
