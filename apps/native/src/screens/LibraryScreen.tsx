import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore, catalog } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { fileAccess } from '../platform';
import { colors } from '../theme/colors';
import { TrackProfileModal } from '../components/TrackProfileModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function moodColor(mood?: string): string {
  const map: Record<string, string> = {
    alegre: '#22c55e', festivo: '#f59e0b', energético: '#ef4444',
    energetico: '#ef4444', romántico: '#ec4899', romantico: '#ec4899',
    melancólico: '#8b5cf6', melancolico: '#8b5cf6', tranquilo: '#0ea5e9',
    dark: '#6b7280', épico: '#f97316', epico: '#f97316', latino: '#eab308',
    neutral: '#a0a0a0', happy: '#22c55e', calm: '#0ea5e9',
    melancholic: '#8b5cf6', energetic: '#ef4444',
  };
  return map[mood?.toLowerCase() ?? ''] ?? colors.accent;
}

// EditModal removed — replaced by TrackProfileModal (4 tabs: Detalles, Notas, Recorte, Partitura)

// ── Track row ─────────────────────────────────────────────────────────────────

function LibraryTrackRow({
  track, isCustom, onEdit, onDelete,
}: {
  track: Track; isCustom: boolean; onEdit?: () => void; onDelete?: () => void;
}) {
  const mc = moodColor(track.mood);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onEdit}
      onLongPress={onDelete}
      activeOpacity={0.7}
      accessibilityLabel={`${track.title} — tocar para editar`}
    >
      <View style={[styles.moodDot, { backgroundColor: mc }]} />
      <View style={styles.info}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaTag}>{track.bpm} BPM</Text>
          {track.key ? <Text style={styles.metaTag}>{track.key}</Text> : null}
          {track.mood ? <Text style={[styles.metaTag, { color: mc }]}>{track.mood}</Text> : null}
          {track.duration_ms > 0 ? <Text style={styles.metaDur}>{fmt(track.duration_ms)}</Text> : null}
        </View>
        {track.notes ? <Text style={styles.notes} numberOfLines={1}>📝 {track.notes}</Text> : null}
      </View>
      {isCustom ? (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <View style={styles.catalogBadge}>
          <Text style={styles.catalogBadgeText}>catálogo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main LibraryScreen ────────────────────────────────────────────────────────

type Tab = 'mia' | 'catalogo';

export function LibraryScreen() {
  const customTracks = useLibraryStore(s => s.customTracks);
  const addTrack = useLibraryStore(s => s.addCustomTrack);
  const removeTrack = useLibraryStore(s => s.removeCustomTrack);
  const updateTrack = useLibraryStore(s => s.updateTrack);

  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [tab, setTab] = useState<Tab>('mia');

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const imported = await fileAccess.importFile({ type: 'picker' });
      if (!imported) return;
      const track: Track = {
        id: `user-${Date.now()}`,
        title: imported.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
        artist: 'Desconocido',
        duration_ms: 0,
        bpm: 120, key: 'C', energy: 0.5, mood: 'neutral',
        file_path: imported.url,
        analysis_cached: false,
        isCustom: true,
      };
      addTrack(track);
      // Immediately open edit modal for the new track
      setEditingTrack(track);
    } catch (err) {
      Alert.alert('Error', 'No se pudo importar el archivo.');
      console.error('[LibraryScreen]', err);
    } finally {
      setImporting(false);
    }
  }, [addTrack]);

  const handleDelete = useCallback((track: Track) => {
    Alert.alert('Eliminar canción', `¿Eliminar "${track.title}" de tu biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeTrack(track.id) },
    ]);
  }, [removeTrack]);

  const handleSaveEdit = useCallback((track: Track, updates: Partial<Track>) => {
    updateTrack(track.id, updates);
  }, [updateTrack]);

  const q = search.toLowerCase();

  const filteredCustom = useMemo(() =>
    customTracks.filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    ), [customTracks, q]);

  const filteredCatalog = useMemo(() =>
    (catalog as Track[]).filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    ), [q]);

  const activeData = tab === 'mia' ? filteredCustom : filteredCatalog;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <TouchableOpacity
          style={[styles.importBtn, importing && styles.disabled]}
          onPress={handleImport}
          disabled={importing}
        >
          {importing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="add" size={20} color="#fff" />
          }
          <Text style={styles.importText}>{importing ? 'Importando...' : 'Importar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título o artista..."
          placeholderTextColor={colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'mia' && styles.tabActive]}
          onPress={() => setTab('mia')}
        >
          <Text style={[styles.tabText, tab === 'mia' && styles.tabTextActive]}>
            Mi Biblioteca ({customTracks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'catalogo' && styles.tabActive]}
          onPress={() => setTab('catalogo')}
        >
          <Text style={[styles.tabText, tab === 'catalogo' && styles.tabTextActive]}>
            Catálogo ({(catalog as Track[]).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Track list */}
      {activeData.length === 0 ? (
        <View style={styles.empty}>
          {tab === 'mia' ? (
            <>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Biblioteca vacía</Text>
              <Text style={styles.emptySub}>Toca "Importar" para agregar canciones desde Archivos</Text>
            </>
          ) : (
            <>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <LibraryTrackRow
              track={item}
              isCustom={tab === 'mia'}
              onEdit={tab === 'mia' ? () => setEditingTrack(item) : undefined}
              onDelete={tab === 'mia' ? () => handleDelete(item) : undefined}
            />
          )}
          ListFooterComponent={
            tab === 'mia' && customTracks.length > 0
              ? <Text style={styles.hint}>Toca para editar · Mantén presionado para eliminar</Text>
              : null
          }
        />
      )}

      {/* Full track profile modal (4 tabs: Detalles, Notas, Recorte, Partitura) */}
      {editingTrack && (
        <TrackProfileModal
          track={editingTrack}
          onSave={updates => {
            handleSaveEdit(editingTrack, updates);
            // Update local editingTrack so modal reflects saved state without closing
            setEditingTrack(prev => prev ? { ...prev, ...updates } : null);
          }}
          onClose={() => setEditingTrack(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, gap: 6,
  },
  disabled: { opacity: 0.5 },
  importText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, padding: 10, backgroundColor: colors.bgElevated,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15 },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.accent },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  moodDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 2 },
  info: { flex: 1, minWidth: 0 },
  trackTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  trackArtist: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaTag: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  metaDur: { color: colors.textMuted, fontSize: 11 },
  notes: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  deleteBtn: { padding: 8 },
  catalogBadge: {
    backgroundColor: colors.bgElevated, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  catalogBadgeText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },

  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 16 },
});
