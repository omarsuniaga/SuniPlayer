/**
 * SheetMusicViewer — Full-screen viewer for sheet music during performance.
 * - Images: shown in a zoomable ScrollView
 * - PDFs: opened with the device's system PDF viewer via Linking
 * - Multi-page navigation (if multiple sheets assigned)
 * - Track remaining time shown in footer
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, Dimensions, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '@suniplayer/core';
import { colors } from '../theme/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SheetEntry {
  id: string;
  type: 'pdf' | 'image';
  name: string;
  localUri?: string; // file:// path on device
}

interface Props {
  items: SheetEntry[];
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Main ──────────────────────────────────────────────────────────────────────

export function SheetMusicViewer({ items, onClose }: Props) {
  const [page, setPage] = useState(0);
  const currentTrack = usePlayerStore(s => s.pQueue[s.ci]);
  const positionMs = 0; // position comes from audio engine; read from store if available

  const item = items[page];

  const handleOpenPdf = async () => {
    if (!item?.localUri) {
      Alert.alert('Sin archivo', 'El PDF no está disponible en este dispositivo.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(item.localUri);
      if (supported) {
        await Linking.openURL(item.localUri);
      } else {
        Alert.alert(
          'Sin visor PDF',
          'No se encontró una app para abrir PDFs. Instala un visor de PDF y vuelve a intentarlo.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo abrir el archivo.');
      console.error('[SheetMusicViewer]', err);
    }
  };

  const durationMs = currentTrack?.duration_ms ?? 0;
  const remaining = Math.max(0, durationMs - positionMs);

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>✕ Cerrar</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{item?.name ?? 'Partitura'}</Text>
            {items.length > 1 && (
              <Text style={s.headerPage}>{page + 1} / {items.length}</Text>
            )}
          </View>
          <View style={{ width: 80 }} />
        </View>

        {/* Content area */}
        <View style={s.content}>
          {item?.type === 'image' && item.localUri ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={s.imageContainer}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              bouncesZoom
            >
              <Image
                source={{ uri: item.localUri }}
                style={{ width: SCREEN_W, height: SCREEN_H * 0.75 }}
                resizeMode="contain"
              />
            </ScrollView>
          ) : item?.type === 'pdf' ? (
            <View style={s.pdfPrompt}>
              <Text style={s.pdfIcon}>📄</Text>
              <Text style={s.pdfName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.pdfHint}>Los PDFs se abren con el visor del sistema.</Text>
              <TouchableOpacity style={s.openPdfBtn} onPress={handleOpenPdf}>
                <Text style={s.openPdfText}>Abrir PDF</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.pdfPrompt}>
              <Text style={s.pdfIcon}>📂</Text>
              <Text style={s.pdfHint}>Archivo no disponible en este dispositivo.</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {items.length > 1 && (
          <View style={s.pagination}>
            <TouchableOpacity
              style={[s.pageBtn, page === 0 && s.pageBtnDisabled]}
              onPress={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <Text style={s.pageBtnText}>← Anterior</Text>
            </TouchableOpacity>

            <View style={s.pageDots}>
              {items.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.dot, i === page && s.dotActive]}
                  onPress={() => setPage(i)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[s.pageBtn, page === items.length - 1 && s.pageBtnDisabled]}
              onPress={() => setPage(p => Math.min(items.length - 1, p + 1))}
              disabled={page === items.length - 1}
            >
              <Text style={s.pageBtnText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer: track info + remaining time */}
        {currentTrack && (
          <View style={s.footer}>
            <View style={{ flex: 1 }}>
              <Text style={s.footerTrack} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={s.footerArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <View style={s.footerTime}>
              <Text style={s.footerTimeLabel}>RESTANTE</Text>
              <Text style={s.footerTimeValue}>{fmt(remaining)}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  closeBtn: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 80 },
  closeBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  headerPage: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  content: { flex: 1, backgroundColor: '#111' },

  imageContainer: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111',
  },

  pdfPrompt: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
  },
  pdfIcon: { fontSize: 56 },
  pdfName: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  pdfHint: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  openPdfBtn: {
    backgroundColor: colors.accent, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 12, marginTop: 8,
  },
  openPdfText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  pageBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    backgroundColor: colors.bgElevated,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  pageDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 20 },

  footer: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
    gap: 12,
  },
  footerTrack: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  footerArtist: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  footerTime: { alignItems: 'flex-end' },
  footerTimeLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  footerTimeValue: { color: colors.accent, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
