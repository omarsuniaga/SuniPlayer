import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent, Text } from 'react-native';
import { colors } from '../theme/colors';
import { TrackMarker } from '@suniplayer/core';

interface WaveformProps {
  durationMs: number;
  positionMs: number;
  onSeek: (targetMs: number) => void;
  frequencies?: number[];
  markers?: TrackMarker[];
  color?: string;
}

const BAR_COUNT = 60;
const SNAP_THRESHOLD_PX = 12; // Snap if within 12 pixels of a marker

/**
 * A waveform component that visualizes audio frequencies and allows seeking.
 */
export const Waveform: React.FC<WaveformProps> = ({
  durationMs,
  positionMs,
  onSeek,
  frequencies,
  markers = [],
  color = colors.accent,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);

  // Generate or use provided frequencies.
  // We use useMemo to ensure random frequencies are stable across re-renders.
  const data = useMemo(() => {
    if (frequencies && frequencies.length > 0) {
      // If we have frequencies, we map them to BAR_COUNT.
      // We take BAR_COUNT samples spread across the frequencies array.
      const result: number[] = [];
      const step = frequencies.length / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const index = Math.floor(i * step);
        result.push(frequencies[index] ?? 0.2);
      }
      return result;
    }
    // Generate 60 stable random numbers between 0.1 and 1.0.
    return Array.from({ length: BAR_COUNT }, () => 0.1 + Math.random() * 0.9);
  }, [frequencies]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handlePress = (e: any) => {
    if (containerWidth === 0 || durationMs <= 0) return;
    
    // locationX is the position relative to the Pressable.
    const x = e.nativeEvent.locationX;
    let targetMs = (x / containerWidth) * durationMs;

    // Snapping logic: find if any marker is close to the touch point
    for (const marker of markers) {
      const markerX = (marker.posMs / durationMs) * containerWidth;
      if (Math.abs(x - markerX) < SNAP_THRESHOLD_PX) {
        targetMs = marker.posMs;
        break;
      }
    }
    
    onSeek(Math.max(0, Math.min(durationMs, targetMs)));
  };

  const progressRatio = durationMs > 0 ? positionMs / durationMs : 0;
  const activeBarIndex = progressRatio * BAR_COUNT;

  // Find active marker (within 1 second)
  const activeMarker = markers.find(m => Math.abs(positionMs - m.posMs) < 1000);

  return (
    <Pressable 
      style={styles.container} 
      onLayout={handleLayout} 
      onPress={handlePress}
    >
      <View style={styles.barsContainer} pointerEvents="none">
        {data.map((val, i) => {
          const isActive = i < activeBarIndex;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: `${Math.max(15, val * 100)}%`, // Minimum height for visibility
                  backgroundColor: isActive ? color : colors.bgElevated,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Markers Layer */}
      {containerWidth > 0 && markers.map((marker) => {
        const x = (marker.posMs / durationMs) * containerWidth;
        const isActive = activeMarker?.id === marker.id;
        
        return (
          <React.Fragment key={marker.id}>
            {isActive && (
              <View style={[styles.bubble, { left: Math.max(0, Math.min(containerWidth - 100, x - 50)) }]}>
                <Text style={styles.bubbleText} numberOfLines={1}>{marker.comment}</Text>
              </View>
            )}
            <View 
              style={[
                styles.markerDot, 
                { left: x - 4 } // Center the dot
              ]} 
            />
          </React.Fragment>
        );
      })}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  markerDot: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  bubble: {
    position: 'absolute',
    top: -25,
    width: 100,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    zIndex: 10,
  },
  bubbleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

