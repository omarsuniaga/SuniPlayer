import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function TransportControls({ isPlaying, onPlay, onPause, onNext, onPrev, hasNext, hasPrev }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.btn, !hasPrev && styles.disabled]} onPress={onPrev} disabled={!hasPrev} accessibilityLabel="Anterior">
        <Ionicons name="play-skip-back" size={32} color={hasPrev ? colors.textPrimary : colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.playBtn} onPress={isPlaying ? onPause : onPlay} accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}>
        <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={72} color={colors.playButton} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, !hasNext && styles.disabled]} onPress={onNext} disabled={!hasNext} accessibilityLabel="Siguiente">
        <Ionicons name="play-skip-forward" size={32} color={hasNext ? colors.textPrimary : colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  btn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  playBtn: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
});
