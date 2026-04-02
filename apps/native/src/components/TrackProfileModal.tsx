/**
 * TrackProfileModal — Comprehensive track editor for the native app.
 * 4 tabs: Detalles | Notas | Recorte | Partitura
 *
 * Features:
 * - Title, artist, BPM, key, energy, mood editing
 * - Transpose semitones (-6 to +6) and tempo (0.8x–1.2x)
 * - Tags management (select existing, create new)
 * - Performance notes
 * - Audio trim (startTime / endTime sliders)
 * - Sheet music: pick PDF/image → save to sandbox → list with delete
 * - Play stats display
 */
import React, { useState, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useLibraryStore } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { colors } from '../theme/colors';
import { pickSheetFiles, deleteSheetFile, SheetItem } from '../services/sheetStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const MOODS: Array<{ value: Track['mood']; label: string }> = [
  { value: 'happy', label: 'Alegre' },
  { value: 'calm', label: 'Tranquilo' },
  { value: 'energetic', label: 'Energético' },
  { value: 'melancholic', label: 'Melancólico' },
];

const KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb',
  'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m',
  'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function moodColor(mood?: string): string {
  const map: Record<string, string> = {
    alegre: '#22c55e', festivo: '#f59e0b', energético: '#ef4444',
    energetico: '#ef4444', romántico: '#ec4899', romantico: '#ec4899',
    melancólico: '#8b5cf6', melancolico: '#8b5cf6', tranquilo: '#0ea5e9',
    dark: '#6b7280', épico: '#f97316', epico: '#f97316', latino: '#eab308',
    neutral: '#a0a0a0',
  };
  return map[mood?.toLowerCase() ?? ''] ?? colors.accent;
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function describeTranspose(semi: number): string {
  if (semi === 0) return 'Sin cambio';
  return `${semi > 0 ? '+' : ''}${semi} semitonos`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

type Tab = 'detalles' | 'notas' | 'recorte' | 'partitura';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'detalles', label: 'Detalles' },
    { id: 'notas', label: 'Notas' },
    { id: 'recorte', label: 'Recorte' },
    { id: 'partitura', label: 'Partitura' },
  ];
  return (
    <View style={s.tabBar}>
      {tabs.map(({ id, label }) => (
        <TouchableOpacity
          key={id}
          style={[s.tab, active === id && s.tabActive]}
          onPress={() => onChange(id)}
        >
          <Text style={[s.tabText, active === id && s.tabTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </View>
  );
}

// ── Tab: Detalles ─────────────────────────────────────────────────────────────

function TabDetalles({
  edit, setEdit, availableTags, addTag,
}: {
  edit: Partial<Track>;
  setEdit: (u: Partial<Track>) => void;
  availableTags: string[];
  addTag: (t: string) => void;
}) {
  const [newTag, setNewTag] = useState('');
  const transposeSemitones = edit.transposeSemitones ?? 0;
  const tempo = edit.playbackTempo ?? 1.0;
  const mc = moodColor(edit.mood);

  const handleCreateTag = () => {
    const t = newTag.trim();
    if (!t) return;
    addTag(t);
    const tags = edit.tags ?? [];
    if (!tags.includes(t)) setEdit({ ...edit, tags: [...tags, t] });
    setNewTag('');
  };

  const toggleTag = (tag: string) => {
    const tags = edit.tags ?? [];
    setEdit({
      ...edit,
      tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag],
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">

      {/* Basic info */}
      <Field label="TÍTULO">
        <TextInput
          style={s.input} value={edit.title ?? ''}
          onChangeText={v => setEdit({ ...edit, title: v })}
          placeholderTextColor={colors.textMuted}
        />
      </Field>

      <Field label="ARTISTA / COMPOSITOR">
        <TextInput
          style={s.input} value={edit.artist ?? ''}
          onChangeText={v => setEdit({ ...edit, artist: v })}
          placeholderTextColor={colors.textMuted}
        />
      </Field>

      <View style={s.row2}>
        <Field label="BPM">
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={String(edit.bpm ?? '')}
            onChangeText={v => { const n = parseInt(v); if (!isNaN(n)) setEdit({ ...edit, bpm: n }); else setEdit({ ...edit, bpm: 0 }); }}
            keyboardType="numeric" maxLength={3}
            placeholderTextColor={colors.textMuted}
          />
        </Field>
      </View>

      {/* Energy */}
      <View style={s.sliderField}>
        <View style={s.sliderHeader}>
          <Text style={s.label}>ENERGÍA</Text>
          <Text style={[s.sliderValue, { color: colors.accent }]}>{Math.round((edit.energy ?? 0.5) * 10)}/10</Text>
        </View>
        <Slider
          value={edit.energy ?? 0.5}
          onValueChange={v => setEdit({ ...edit, energy: parseFloat(v.toFixed(1)) })}
          minimumValue={0} maximumValue={1} step={0.1}
          minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
      </View>

      {/* Mood */}
      <Field label="MOOD">
        <View style={s.chipWrap}>
          {MOODS.map(m => {
            const active = edit.mood === m.value;
            const c = moodColor(m.value);
            return (
              <TouchableOpacity
                key={m.value}
                style={[s.chip, active && { backgroundColor: c + '25', borderColor: c }]}
                onPress={() => setEdit({ ...edit, mood: m.value })}
              >
                <Text style={[s.chipText, active && { color: c }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      {/* Key */}
      <Field label="TONALIDAD">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
            {KEYS.map(k => {
              const active = edit.key === k;
              return (
                <TouchableOpacity
                  key={k}
                  style={[s.chip, active && { backgroundColor: '#8b5cf625', borderColor: '#8b5cf6' }]}
                  onPress={() => setEdit({ ...edit, key: k })}
                >
                  <Text style={[s.chipText, active && { color: '#8b5cf6' }]}>{k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Field>

      {/* Transpose */}
      <View style={s.transposeBox}>
        <View style={s.transposeTitleRow}>
          <Text style={s.label}>TRANSPOSICIÓN</Text>
          <View style={s.transposeInfo}>
            <Text style={[s.transposeInfoText, { color: colors.accent }]}>{describeTranspose(transposeSemitones)}</Text>
            <Text style={[s.transposeInfoText, { color: '#8b5cf6', marginLeft: 8 }]}>{tempo.toFixed(2)}x</Text>
          </View>
        </View>

        {/* Semitone buttons */}
        <View style={s.semiRow}>
          {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(step => {
            const active = transposeSemitones === step;
            return (
              <TouchableOpacity
                key={step}
                style={[s.semiBtn, active && { backgroundColor: '#8b5cf625', borderColor: '#8b5cf6' }]}
                onPress={() => setEdit({ ...edit, transposeSemitones: step })}
              >
                <Text style={[s.semiBtnText, active && { color: '#8b5cf6' }]}>
                  {step > 0 ? `+${step}` : step}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tempo */}
        <View style={[s.sliderField, { backgroundColor: 'transparent', paddingHorizontal: 0, borderWidth: 0 }]}>
          <View style={s.sliderHeader}>
            <Text style={s.label}>VELOCIDAD (TEMPO)</Text>
            <Text style={[s.sliderValue, { color: colors.accent }]}>
              {tempo === 1.0 ? 'Normal' : `${tempo > 1 ? '+' : ''}${Math.round((tempo - 1) * 100)}%`}
            </Text>
          </View>
          <Slider
            value={tempo}
            onValueChange={v => setEdit({ ...edit, playbackTempo: parseFloat(v.toFixed(2)) })}
            minimumValue={0.8} maximumValue={1.2} step={0.01}
            minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
          <View style={s.tempoLabels}>
            <Text style={s.tempoLabel}>-20% lento</Text>
            <Text style={s.tempoLabel}>Normal</Text>
            <Text style={s.tempoLabel}>+20% rápido</Text>
          </View>
        </View>
      </View>

      {/* Tags */}
      <Field label="ETIQUETAS">
        <View style={s.chipWrap}>
          {availableTags.map(tag => {
            const active = edit.tags?.includes(tag) ?? false;
            return (
              <TouchableOpacity
                key={tag}
                style={[s.chip, active && { backgroundColor: '#8b5cf625', borderColor: '#8b5cf6' }]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[s.chipText, active && { color: '#8b5cf6' }]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={s.newTagRow}>
          <TextInput
            style={[s.input, { flex: 1, height: 40 }]}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Nueva etiqueta..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleCreateTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addTagBtn} onPress={handleCreateTag}>
            <Text style={s.addTagBtnText}>+ Añadir</Text>
          </TouchableOpacity>
        </View>
      </Field>

      {/* Play stats */}
      {((edit.playCount ?? 0) > 0 || edit.lastPlayedAt) && (
        <View style={s.statsBox}>
          <Text style={s.label}>ESTADÍSTICAS</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{edit.playCount ?? 0}</Text>
              <Text style={s.statLbl}>Veces tocado</Text>
            </View>
            {edit.lastPlayedAt && (
              <View style={s.statItem}>
                <Text style={s.statNum}>
                  {new Date(edit.lastPlayedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={s.statLbl}>Última sesión</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Tab: Notas ────────────────────────────────────────────────────────────────

function TabNotas({ edit, setEdit }: { edit: Partial<Track>; setEdit: (u: Partial<Track>) => void }) {
  return (
    <View style={[s.tabContent, { flex: 1 }]}>
      <FieldLabel>NOTAS DE ACTUACIÓN</FieldLabel>
      <Text style={s.hint}>Se mostrarán antes de reproducir la canción.</Text>
      <TextInput
        style={[s.input, s.notesInput]}
        value={edit.notes ?? ''}
        onChangeText={v => setEdit({ ...edit, notes: v })}
        placeholder="Ej: Intro larga de 4 compases, terminar en fade out, pedir aplauso..."
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

// ── Tab: Recorte ──────────────────────────────────────────────────────────────

function TabRecorte({ edit, setEdit }: { edit: Partial<Track>; setEdit: (u: Partial<Track>) => void }) {
  const total = edit.duration_ms ?? 0;
  const start = edit.startTime ?? 0;
  const end = edit.endTime ?? total;
  const trimDuration = Math.max(0, end - start);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.tabContent}>
      <View style={s.trimInfoBox}>
        <View style={s.trimStat}>
          <Text style={s.trimStatLabel}>INICIO</Text>
          <Text style={s.trimStatValue}>{fmt(start)}</Text>
        </View>
        <View style={s.trimStat}>
          <Text style={s.trimStatLabel}>FIN</Text>
          <Text style={s.trimStatValue}>{fmt(end)}</Text>
        </View>
        <View style={s.trimStat}>
          <Text style={s.trimStatLabel}>DURACIÓN</Text>
          <Text style={[s.trimStatValue, { color: colors.accent }]}>{fmt(trimDuration)}</Text>
        </View>
      </View>

      <View style={s.trimSliderBlock}>
        <View style={s.sliderHeader}>
          <Text style={s.label}>PUNTO DE INICIO</Text>
          <Text style={[s.sliderValue, { color: colors.accent }]}>{fmt(start)}</Text>
        </View>
        <Slider
          value={start}
          onValueChange={v => {
            const newStart = Math.round(v);
            if (newStart < end - 5000) setEdit({ ...edit, startTime: newStart });
          }}
          minimumValue={0}
          maximumValue={total > 0 ? total : 1}
          step={1000}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
      </View>

      <View style={s.trimSliderBlock}>
        <View style={s.sliderHeader}>
          <Text style={s.label}>PUNTO DE FIN</Text>
          <Text style={[s.sliderValue, { color: '#ef4444' }]}>{fmt(end)}</Text>
        </View>
        <Slider
          value={end}
          onValueChange={v => {
            const newEnd = Math.round(v);
            if (newEnd > start + 5000) setEdit({ ...edit, endTime: newEnd });
          }}
          minimumValue={0}
          maximumValue={total > 0 ? total : 1}
          step={1000}
          minimumTrackTintColor={colors.border}
          maximumTrackTintColor={'#ef4444'}
          thumbTintColor={'#ef4444'}
        />
      </View>

      {total === 0 && (
        <Text style={s.hint}>
          ⚠️ Esta canción tiene duración 0. Importa el archivo de audio para habilitar el recorte.
        </Text>
      )}

      <TouchableOpacity
        style={s.resetTrimBtn}
        onPress={() => setEdit({ ...edit, startTime: 0, endTime: total })}
      >
        <Text style={s.resetTrimText}>Restablecer recorte</Text>
      </TouchableOpacity>

      <Text style={[s.hint, { marginTop: 12 }]}>
        El set se adaptará automáticamente a la duración recortada.
      </Text>
    </ScrollView>
  );
}

// ── Tab: Partitura ────────────────────────────────────────────────────────────

function TabPartitura({
  edit, setEdit,
}: {
  edit: Partial<Track>;
  setEdit: (u: Partial<Track>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const sheets = (edit.sheetMusic ?? []) as Array<{ id: string; type: 'pdf' | 'image'; name: string; localUri?: string }>;

  const handleAdd = async () => {
    setLoading(true);
    try {
      const picked = await pickSheetFiles();
      if (!picked.length) return;
      const newItems = picked.map(p => ({
        id: p.id,
        type: p.type,
        name: p.name,
        localUri: p.localUri,
      }));
      setEdit({ ...edit, sheetMusic: [...sheets, ...newItems] });
    } catch (err) {
      Alert.alert('Error', 'No se pudo importar el archivo.');
      console.error('[TrackProfileModal] sheet import:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (item: { type: 'pdf' | 'image'; localUri?: string; name: string }) => {
    const uri = item.localUri;
    if (!uri) { Alert.alert('Sin ruta', 'Archivo no disponible en este dispositivo.'); return; }
    try {
      await Linking.openURL(uri);
    } catch {
      Alert.alert('Sin app', 'No hay una app instalada para abrir este tipo de archivo.');
    }
  };

  const handleDelete = (item: { id: string; localUri?: string; name: string }) => {
    Alert.alert('Eliminar partitura', `¿Eliminar "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          if (item.localUri) await deleteSheetFile(item.localUri);
          setEdit({ ...edit, sheetMusic: sheets.filter(s => s.id !== item.id) });
        },
      },
    ]);
  };

  return (
    <View style={[s.tabContent, { flex: 1 }]}>
      <Text style={s.hint}>Añade PDFs o imágenes de tus arreglos y partituras. Se pueden ver durante la reproducción.</Text>

      <FlatList
        data={sheets}
        keyExtractor={item => item.id}
        style={{ flex: 1, marginTop: 12 }}
        renderItem={({ item }) => (
          <View style={s.sheetRow}>
            <Text style={s.sheetIcon}>{item.type === 'pdf' ? '📄' : '🖼️'}</Text>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleOpen(item)}>
              <Text style={s.sheetName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.sheetType}>{item.type.toUpperCase()} · Toca para abrir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.sheetDeleteBtn}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.sheetDeleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.sheetEmpty}>
            <Text style={s.sheetEmptyIcon}>📂</Text>
            <Text style={s.sheetEmptyText}>Sin partituras añadidas</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.addSheetBtn} onPress={handleAdd} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.addSheetBtnText}>+ Añadir PDF o Imagen</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  track: Track;
  onSave: (updates: Partial<Track>) => void;
  onClose: () => void;
}

export function TrackProfileModal({ track, onSave, onClose }: Props) {
  const availableTags = useLibraryStore(s => s.availableTags);
  const addTag = useLibraryStore(s => s.addTag);

  const [activeTab, setActiveTab] = useState<Tab>('detalles');
  const [edit, setEdit] = useState<Partial<Track>>({ ...track });

  const handleSave = useCallback(() => {
    const bpm = typeof edit.bpm === 'number' ? edit.bpm : parseInt(String(edit.bpm ?? '0'));
    if (isNaN(bpm) || bpm < 40 || bpm > 300) {
      Alert.alert('BPM inválido', 'Ingresa un BPM entre 40 y 300.');
      return;
    }
    onSave({ ...edit, bpm });
    onClose();
  }, [edit, onSave, onClose]);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle} numberOfLines={1}>{edit.title ?? track.title}</Text>
              <Text style={s.headerSub} numberOfLines={1}>{edit.artist ?? track.artist}</Text>
            </View>
            <TouchableOpacity onPress={handleSave} style={s.saveBtn}>
              <Text style={s.saveText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <TabBar active={activeTab} onChange={setActiveTab} />

          {/* Tab content */}
          <View style={{ flex: 1 }}>
            {activeTab === 'detalles' && (
              <TabDetalles
                edit={edit} setEdit={setEdit}
                availableTags={availableTags} addTag={addTag}
              />
            )}
            {activeTab === 'notas' && (
              <TabNotas edit={edit} setEdit={setEdit} />
            )}
            {activeTab === 'recorte' && (
              <TabRecorte edit={edit} setEdit={setEdit} />
            )}
            {activeTab === 'partitura' && (
              <TabPartitura edit={edit} setEdit={setEdit} />
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
  cancelBtn: { padding: 4, minWidth: 70 },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 70, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Tab bar
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.accent },

  // Content
  tabContent: { padding: 20, gap: 20 },

  label: {
    color: colors.textMuted, fontSize: 10, fontWeight: '900',
    letterSpacing: 1.5, marginBottom: 8,
  },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },

  field: { gap: 4 },
  input: {
    backgroundColor: colors.bgElevated, color: colors.textPrimary,
    borderRadius: 10, padding: 12, fontSize: 15,
    borderWidth: 1, borderColor: colors.border, height: 48,
  },
  notesInput: { height: 180, textAlignVertical: 'top', paddingTop: 12 },

  row2: { flexDirection: 'row', gap: 12 },

  sliderField: {
    gap: 4, padding: 16, borderRadius: 12,
    backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderValue: { fontSize: 14, fontWeight: '700' },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },

  // Tags
  newTagRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  addTagBtn: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  addTagBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },

  // Transpose
  transposeBox: {
    padding: 16, borderRadius: 12, gap: 12,
    backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border,
  },
  transposeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transposeInfo: { flexDirection: 'row' },
  transposeInfoText: { fontSize: 12, fontWeight: '700' },
  semiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  semiBtn: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, minWidth: 40, alignItems: 'center',
  },
  semiBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },

  tempoLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  tempoLabel: { color: colors.textMuted, fontSize: 10 },

  // Stats
  statsBox: { padding: 16, borderRadius: 12, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 8 },
  statItem: { alignItems: 'center' },
  statNum: { color: colors.textPrimary, fontSize: 24, fontWeight: '900' },
  statLbl: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  // Trim
  trimInfoBox: {
    flexDirection: 'row', justifyContent: 'space-around',
    padding: 16, borderRadius: 12, backgroundColor: colors.bgSurface,
    borderWidth: 1, borderColor: colors.border,
  },
  trimStat: { alignItems: 'center' },
  trimStatLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  trimStatValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 4, fontVariant: ['tabular-nums'] },
  trimSliderBlock: { gap: 4 },
  resetTrimBtn: {
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', marginTop: 8,
  },
  resetTrimText: { color: colors.textSecondary, fontSize: 14 },

  // Sheet music
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    marginBottom: 8, backgroundColor: colors.bgSurface,
  },
  sheetIcon: { fontSize: 24 },
  sheetName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  sheetType: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  sheetDeleteBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.error + '20',
  },
  sheetDeleteText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  sheetEmpty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  sheetEmptyIcon: { fontSize: 40 },
  sheetEmptyText: { color: colors.textMuted, fontSize: 15 },
  addSheetBtn: {
    backgroundColor: colors.accent, padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  addSheetBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
