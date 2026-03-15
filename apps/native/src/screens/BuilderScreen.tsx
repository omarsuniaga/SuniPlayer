import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useBuilderStore, usePlayerStore, useSettingsStore, buildSet, catalog } from '@suniplayer/core';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';

export function BuilderScreen() {
  // Real store API: targetMin/setTargetMin, genSet/setGenSet
  const targetMin = useBuilderStore(s => s.targetMin);
  const setTargetMin = useBuilderStore(s => s.setTargetMin);
  const genSet = useBuilderStore(s => s.genSet);
  const setGenSet = useBuilderStore(s => s.setGenSet);
  const bpmMin = useSettingsStore(s => s.bpmMin);
  const bpmMax = useSettingsStore(s => s.bpmMax);
  const setBpmMin = useSettingsStore(s => s.setBpmMin);
  const setBpmMax = useSettingsStore(s => s.setBpmMax);

  const handleBuild = useCallback(() => {
    // buildSet(repo, targetSeconds, opts) — target is in seconds
    const result = buildSet(catalog, targetMin * 60, { bpmMin, bpmMax });
    setGenSet(result);
  }, [targetMin, bpmMin, bpmMax]);

  const handleLoad = useCallback(() => {
    if (!genSet.length) return;
    // Real player API: setPQueue
    usePlayerStore.getState().setPQueue(genSet);
    usePlayerStore.getState().setCi(0);
  }, [genSet]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.controls}>
        <Text style={styles.title}>Armador de Set</Text>
        <SliderRow label={`Duración: ${targetMin} min`} value={targetMin} onValueChange={setTargetMin} min={15} max={120} step={5} />
        <SliderRow label={`BPM mínimo: ${bpmMin}`} value={bpmMin} onValueChange={setBpmMin} min={40} max={bpmMax - 5} step={1} />
        <SliderRow label={`BPM máximo: ${bpmMax}`} value={bpmMax} onValueChange={setBpmMax} min={bpmMin + 5} max={220} step={1} />
        <TouchableOpacity style={styles.buildBtn} onPress={handleBuild} accessibilityLabel="Generar set">
          <Text style={styles.buildBtnText}>Generar Set</Text>
        </TouchableOpacity>
      </ScrollView>
      {genSet.length > 0 && (
        <View style={styles.result}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{genSet.length} canciones</Text>
            <TouchableOpacity style={styles.loadBtn} onPress={handleLoad}>
              <Text style={styles.loadBtnText}>Cargar al Reproductor</Text>
            </TouchableOpacity>
          </View>
          <FlatList data={genSet} keyExtractor={t => t.id} renderItem={({ item }) => <TrackRow track={item} />} />
        </View>
      )}
    </SafeAreaView>
  );
}

function SliderRow({ label, value, onValueChange, min, max, step }: { label: string; value: number; onValueChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <View style={styles.sliderGroup}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Slider value={value} onValueChange={onValueChange} minimumValue={min} maximumValue={max} step={step}
        minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.border} thumbTintColor={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: 16, maxHeight: 340 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  sliderGroup: { marginBottom: 20 },
  sliderLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: 4 },
  buildBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 10, alignItems: 'center', minHeight: 52, justifyContent: 'center', marginTop: 8 },
  buildBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  result: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  resultTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  loadBtn: { backgroundColor: colors.bgElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  loadBtnText: { color: colors.accent, fontWeight: '600' },
});
