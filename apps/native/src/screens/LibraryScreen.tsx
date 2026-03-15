import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@suniplayer/core';
import type { Track } from '@suniplayer/core';
import { fileAccess } from '../platform';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';

export function LibraryScreen() {
  // Real store API: customTracks, addCustomTrack, removeCustomTrack
  const tracks = useLibraryStore(s => s.customTracks);
  const addTrack = useLibraryStore(s => s.addCustomTrack);
  const removeTrack = useLibraryStore(s => s.removeCustomTrack);
  const [importing, setImporting] = useState(false);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const imported = await fileAccess.importFile({ type: 'picker' });
      if (!imported) return;
      const track: Track = {
        id: `user-${Date.now()}`,
        title: imported.name.replace(/\.[^.]+$/, ''),
        artist: 'Desconocido',
        duration_ms: 0,
        bpm: 120, key: 'C', energy: 0.5, mood: 'neutral',
        file_path: imported.url,
        analysis_cached: false,
        isCustom: true,
      };
      addTrack(track);
    } catch (err) {
      Alert.alert('Error', 'No se pudo importar el archivo.');
      console.error('[LibraryScreen]', err);
    } finally {
      setImporting(false);
    }
  }, [addTrack]);

  const handleDelete = useCallback((track: Track) => {
    Alert.alert('Eliminar', `¿Eliminar "${track.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeTrack(track.id) },
    ]);
  }, [removeTrack]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <TouchableOpacity style={[styles.importBtn, importing && styles.disabled]} onPress={handleImport} disabled={importing} accessibilityLabel="Importar audio">
          {importing ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={22} color="#fff" />}
          <Text style={styles.importText}>{importing ? 'Importando...' : 'Importar'}</Text>
        </TouchableOpacity>
      </View>
      {tracks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Biblioteca vacía</Text>
          <Text style={styles.emptySub}>Toca "Importar" para agregar canciones desde Archivos</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TrackRow track={item} onLongPress={() => handleDelete(item)} />}
          ListFooterComponent={<Text style={styles.hint}>Mantén presionado para eliminar</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  importBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6, minHeight: 44 },
  disabled: { opacity: 0.5 },
  importText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 16 },
});
