import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

interface Props { positionMs: number; durationMs: number; }

export function ProgressBar({ positionMs, durationMs }: Props) {
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{fmt(positionMs)}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: progress }]} />
        <View style={[styles.empty, { flex: 1 - progress }]} />
      </View>
      <Text style={styles.time}>{fmt(durationMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  track: { flex: 1, height: 4, borderRadius: 2, flexDirection: 'row', overflow: 'hidden' },
  fill: { backgroundColor: colors.accent, minWidth: 0 },
  empty: { backgroundColor: colors.border, minWidth: 0 },
  time: { color: colors.textSecondary, fontSize: 12, width: 40, textAlign: 'center' },
});
