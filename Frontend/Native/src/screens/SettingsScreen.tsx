import React, { useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@suniplayer/core';
import type { PedalAction } from '@suniplayer/core';
import { colors } from '../theme/colors';

// ── Pedal action definitions ──────────────────────────────────────────────────

const PEDAL_ACTIONS: { action: PedalAction; label: string; icon: string }[] = [
  { action: 'next',       label: 'Siguiente canción',  icon: '⏭' },
  { action: 'prev',       label: 'Canción anterior',   icon: '⏮' },
  { action: 'play_pause', label: 'Play / Pausa',        icon: '⏯' },
  { action: 'vol_up',     label: 'Subir volumen',       icon: '🔊' },
  { action: 'vol_down',   label: 'Bajar volumen',       icon: '🔉' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {desc && <Text style={styles.settingDesc}>{desc}</Text>}
      </View>
      {children}
    </View>
  );
}

function SliderSetting({
  label, value, onValueChange, min, max, step, format,
}: {
  label: string; value: number; onValueChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <View style={styles.sliderSetting}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={[styles.settingLabel, { color: colors.accent }]}>{format(value)}</Text>
      </View>
      <Slider
        value={value} onValueChange={onValueChange}
        minimumValue={min} maximumValue={max} step={step}
        minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

// ── Main SettingsScreen ───────────────────────────────────────────────────────

export function SettingsScreen() {
  const autoNext        = useSettingsStore(s => s.autoNext);
  const setAutoNext     = useSettingsStore(s => s.setAutoNext);

  const defaultVol      = useSettingsStore(s => s.defaultVol);
  const setDefaultVol   = useSettingsStore(s => s.setDefaultVol);

  const fadeEnabled     = useSettingsStore(s => s.fadeEnabled);
  const setFadeEnabled  = useSettingsStore(s => s.setFadeEnabled);
  const fadeInMs        = useSettingsStore(s => s.fadeInMs);
  const setFadeInMs     = useSettingsStore(s => s.setFadeInMs);
  const fadeOutMs       = useSettingsStore(s => s.fadeOutMs);
  const setFadeOutMs    = useSettingsStore(s => s.setFadeOutMs);

  const crossfade       = useSettingsStore(s => s.crossfade);
  const setCrossfade    = useSettingsStore(s => s.setCrossfade);
  const crossfadeMs     = useSettingsStore(s => s.crossfadeMs);
  const setCrossfadeMs  = useSettingsStore(s => s.setCrossfadeMs);

  const pedalBindings      = useSettingsStore(s => s.pedalBindings);
  const learningAction     = useSettingsStore(s => s.learningAction);
  const setLearningAction  = useSettingsStore(s => s.setLearningAction);
  const clearPedalBinding  = useSettingsStore(s => s.clearPedalBinding);
  const clearPedalBindings = useSettingsStore(s => s.clearPedalBindings);

  // Cancel learning mode after 10s
  useEffect(() => {
    if (!learningAction) return;
    const t = setTimeout(() => setLearningAction(null), 10000);
    return () => clearTimeout(t);
  }, [learningAction]);

  const fmtMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ajustes</Text>

        {/* ── Reproducción ── */}
        <SectionHeader>REPRODUCCIÓN</SectionHeader>

        <SettingRow label="Auto-siguiente" desc="Avanzar automáticamente al terminar la canción">
          <Switch
            value={autoNext} onValueChange={setAutoNext}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </SettingRow>

        <SliderSetting
          label="Volumen inicial"
          value={defaultVol} onValueChange={setDefaultVol}
          min={0} max={1} step={0.05}
          format={v => `${Math.round(v * 100)}%`}
        />

        {/* ── Fade ── */}
        <SectionHeader>FADE IN / FADE OUT</SectionHeader>

        <SettingRow label="Fade habilitado" desc="Suaviza la entrada y salida de cada canción">
          <Switch
            value={fadeEnabled} onValueChange={setFadeEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </SettingRow>

        {fadeEnabled && (
          <>
            <SliderSetting
              label="Fade in (entrada)"
              value={fadeInMs} onValueChange={v => setFadeInMs(Math.round(v))}
              min={0} max={8000} step={250}
              format={fmtMs}
            />
            <SliderSetting
              label="Fade out (salida)"
              value={fadeOutMs} onValueChange={v => setFadeOutMs(Math.round(v))}
              min={0} max={8000} step={250}
              format={fmtMs}
            />
          </>
        )}

        {/* ── Crossfade ── */}
        <SectionHeader>CROSSFADE</SectionHeader>

        <SettingRow label="Crossfade automático" desc="Mezcla el final de una canción con el inicio de la siguiente">
          <Switch
            value={crossfade} onValueChange={setCrossfade}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </SettingRow>

        {crossfade && (
          <SliderSetting
            label="Duración del crossfade"
            value={crossfadeMs} onValueChange={v => setCrossfadeMs(Math.round(v))}
            min={500} max={10000} step={500}
            format={fmtMs}
          />
        )}

        {/* ── Pedal ── */}
        <SectionHeader>PEDAL BLUETOOTH</SectionHeader>
        <Text style={styles.pedalDesc}>
          Conecta tu pedal al iPad vía Bluetooth (HID/teclado). Toca "Asignar", luego presiona el botón del pedal para vincularlo.
        </Text>

        {PEDAL_ACTIONS.map(({ action, label, icon }) => {
          const binding = pedalBindings[action];
          const isLearning = learningAction === action;

          return (
            <View key={action} style={styles.pedalRow}>
              <Text style={styles.pedalIcon}>{icon}</Text>
              <Text style={styles.pedalLabel}>{label}</Text>
              <View style={styles.pedalControls}>
                {binding && (
                  <View style={styles.bindingChip}>
                    <Text style={styles.bindingChipText}>{binding.label}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.assignBtn, isLearning && styles.assignBtnLearning]}
                  onPress={() => setLearningAction(isLearning ? null : action)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.assignBtnText, isLearning && { color: '#000' }]}>
                    {isLearning ? '⏳ Esperando...' : binding ? 'Cambiar' : 'Asignar'}
                  </Text>
                </TouchableOpacity>
                {binding && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => clearPedalBinding(action)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {Object.keys(pedalBindings).length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={clearPedalBindings}>
            <Text style={styles.clearAllText}>Eliminar todas las asignaciones</Text>
          </TouchableOpacity>
        )}

        {/* ── Versión ── */}
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>SuniPlayer Native · v0.1.0-alpha</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', padding: 20, paddingBottom: 8 },

  section: {
    color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  settingLabel: { color: colors.textPrimary, fontSize: 15 },
  settingDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  sliderSetting: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },

  pedalDesc: {
    color: colors.textSecondary, fontSize: 13, lineHeight: 18,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  pedalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56,
  },
  pedalIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  pedalLabel: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  pedalControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bindingChip: {
    backgroundColor: colors.accentDim, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1, borderColor: colors.accent + '50',
  },
  bindingChipText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  assignBtn: {
    backgroundColor: colors.bgElevated, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border, minHeight: 40, justifyContent: 'center',
  },
  assignBtnLearning: { backgroundColor: colors.warning, borderColor: colors.warning },
  assignBtnText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  clearBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.error + '20', borderRadius: 16,
  },
  clearBtnText: { color: colors.error, fontSize: 14, fontWeight: '700' },

  clearAllBtn: {
    margin: 20, padding: 14, borderRadius: 10,
    backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '40',
    alignItems: 'center',
  },
  clearAllText: { color: colors.error, fontSize: 14, fontWeight: '600' },

  versionRow: { padding: 24, alignItems: 'center' },
  versionText: { color: colors.textMuted, fontSize: 12 },
});
