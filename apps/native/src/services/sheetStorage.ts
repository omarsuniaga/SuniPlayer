/**
 * sheetStorage — stores PDF/image sheet music files to app sandbox
 * Files are saved under documentDirectory/sheets/ and persist across app restarts.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

const SHEETS_DIR = `${FileSystem.documentDirectory}sheets/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SHEETS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SHEETS_DIR, { intermediates: true });
  }
}

export interface SheetItem {
  id: string;
  type: 'pdf' | 'image';
  name: string;
  localUri: string;
}

/** Pick PDF or image files and copy them to app sandbox */
export async function pickSheetFiles(): Promise<SheetItem[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*', 'image/jpeg', 'image/png', 'image/jpg'],
    multiple: true,
    copyToCacheDirectory: false,
  });

  if (result.canceled || !result.assets?.length) return [];

  await ensureDir();

  const items: SheetItem[] = [];
  for (const asset of result.assets) {
    const isPdf = asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');
    const isImg = asset.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(asset.name);
    if (!isPdf && !isImg) continue;

    const id = `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const ext = asset.name.split('.').pop() ?? (isPdf ? 'pdf' : 'jpg');
    const destPath = `${SHEETS_DIR}${id}.${ext}`;
    await FileSystem.copyAsync({ from: asset.uri, to: destPath });

    items.push({
      id,
      type: isPdf ? 'pdf' : 'image',
      name: asset.name,
      localUri: destPath,
    });
  }
  return items;
}

/** Delete a sheet file from disk */
export async function deleteSheetFile(localUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (err) {
    console.warn('[sheetStorage] deleteSheetFile failed:', err);
  }
}

/** Resolve a stored sheet URI (handles both absolute and relative paths) */
export function resolveSheetUri(localUri: string): string {
  if (localUri.startsWith('file://') || localUri.startsWith('content://')) return localUri;
  return `${SHEETS_DIR}${localUri}`;
}
