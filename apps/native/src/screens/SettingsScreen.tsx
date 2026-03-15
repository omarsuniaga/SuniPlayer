import React, { useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@suniplayer/core';
import type { PedalAction } from '@suniplayer/core';
import { colors } from '../theme/colors';

const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
  { action: 'next', label: 'Siguiente' },
  { action: 'prev', label: 'Anterior' },
  { action: 'play_pause', label: 'Play / Pausa' },
  { action: 'vol_up', label: 'Subir volumen' },
  { action: 'vol_down', label: 'Bajar volumen' },
];

export function SettingsScreen() {
  const autoNext = useSettingsStore(s => s.autoNext);
  const setAutoNext = useSettingsStore(s => s.setAutoNext);
  const pedalBindings = useSettingsStore(s => s.pedalBindings);
  const learningAction = useSettingsStore(s => s.learningAction);
  const setLearningAction = useSettingsStore(s => s.setLearningAction);
  const setPedalBinding = useSettingsStore(s => s.setPedalBinding);
  const clearPedalBinding = useSettingsStore(s => s.clearPedalBinding);

  // Cancel learning mode after 10s timeout
  useEffect(() => {
    if (!learningAction) return;
    const t = setTimeout(() => setLearningAction(null), 10000);
    return () => clearTimeout(t);
  }, [learningAction]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.section}>Reproducción</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Auto-siguiente</Text>
          <Switch value={autoNext} onValueChange={setAutoNext}
            trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.textPrimary} />
        </View>

        <Text style={styles.section}>Pedal Bluetooth</Text>
        <Text style={styles.sectionDesc}>Conecta tu pedal al iPad y asigna cada acción a un botón.</Text>

        {PEDAL_ACTIONS.map(({ action, label }) => {
          const binding = pedalBindings[action];
          const isLearning = learningAction === action;
          return (
            <View key={action} style={styles.pedalRow}>
              <Text style={styles.pedalLabel}>{label}</Text>
              <View style={styles.pedalControls}>
                {binding && <Text style={styles.bindingChip}>{binding.label}</Text>}
                <TouchableOpacity
                  style={[styles.pedalBtn, isLearning && styles.pedalBtnLearning]}
                  onPress={() => setLearningAction(isLearning ? null : action)}
                  accessibilityLabel={isLearning ? 'Cancelar asignación' : `Asignar ${label}`}
                >
                  <Text style={styles.pedalBtnText}>
                    {isLearning ? 'Esperando...' : binding ? 'Cambiar' : 'Asignar'}
                  </Text>
                </TouchableOpacity>
                {binding && (
                  <TouchableOpacity style={styles.clearBtn} onPress={() => clearPedalBinding(action)} accessibilityLabel={`Eliminar asignación ${label}`}>
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', padding: 16, paddingBottom: 8 },
  sectionDesc: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  rowLabel: { color: colors.textPrimary, fontSize: 16 },
  pedalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  pedalLabel: { color: colors.textPrimary, fontSize: 15, flex: 1 },
  pedalControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bindingChip: { color: colors.accent, fontSize: 13, backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  pedalBtn: { backgroundColor: colors.bgElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  pedalBtnLearning: { backgroundColor: colors.warning },
  pedalBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  clearBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '33', borderRadius: 16 },
  clearBtnText: { color: colors.error, fontSize: 14 },
});
