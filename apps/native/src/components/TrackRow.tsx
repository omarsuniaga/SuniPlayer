import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Track } from '@suniplayer/core';

interface TrackRowProps {
  track: Track;
  isActive?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TrackRow({ track, isActive, onPress, onLongPress }: TrackRowProps) {
  const min = Math.floor(track.duration_ms / 60000);
  const sec = Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0');

  return (
    <TouchableOpacity
      style={[styles.row, isActive && styles.rowActive]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} por ${track.artist}`}
    >
      {isActive && <Ionicons name="musical-note" size={16} color={colors.accent} style={styles.icon} />}
      <View style={styles.info}>
        <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.bpm}>{track.bpm} BPM</Text>
        <Text style={styles.duration}>{min}:{sec}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  rowActive: { backgroundColor: colors.accentDim },
  icon: { marginRight: 8 },
  info: { flex: 1, marginRight: 12 },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  titleActive: { color: colors.accent },
  artist: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  meta: { alignItems: 'flex-end' },
  bpm: { color: colors.textMuted, fontSize: 12 },
  duration: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
