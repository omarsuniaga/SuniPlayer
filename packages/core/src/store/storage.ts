/**
 * Core Storage Bridge — SuniPlayer
 * Unifica Zustand persistence con operaciones de archivos binarios.
 * Proporciona un fallback seguro a localStorage para persistencia básica de estado.
 */
import { StateStorage } from "zustand/middleware";
import type { IStorage } from '../platform/interfaces/IStorage';

type StorageImplementation = Partial<IStorage> & Partial<StateStorage>;

let _impl: StorageImplementation | null = null;

/**
 * Configura la implementación real del storage.
 * Se debe llamar al arrancar la app (web o native).
 */
export function configureStorage(implementation: StorageImplementation): void {
  _impl = implementation;
}

/**
 * lazyStorage es un objeto que cumple con IStorage y StateStorage.
 * Delega las llamadas a la implementación configurada o usa localStorage como fallback.
 */
const lazyStorage: IStorage & StateStorage = {
  // --- Zustand StateStorage (Persistencia de JSON de estados) ---
  getItem: (name: string) => {
    const val = (_impl as any)?.getItem?.(name) || localStorage.getItem(name);
    return val instanceof Promise ? val : Promise.resolve(val);
  },
  setItem: (name: string, value: string) => {
    if ((_impl as any)?.setItem) return (_impl as any).setItem(name, value);
    localStorage.setItem(name, value);
    return Promise.resolve();
  },
  removeItem: (name: string) => {
    if ((_impl as any)?.removeItem) return (_impl as any).removeItem(name);
    localStorage.removeItem(name);
    return Promise.resolve();
  },

  // --- SuniPlayer IStorage (Archivos y Análisis) ---
  getAnalysis: (id: string) => _impl?.getAnalysis ? _impl.getAnalysis(id) : Promise.resolve(null),
  saveAnalysis: (id: string, data: any) => _impl?.saveAnalysis ? _impl.saveAnalysis(id, data) : Promise.resolve(),
  getWaveform: (id: string) => _impl?.getWaveform ? _impl.getWaveform(id) : Promise.resolve(null),
  saveWaveform: (id: string, data: number[]) => _impl?.saveWaveform ? _impl.saveWaveform(id, data) : Promise.resolve(),
  
  saveAudioFile: (id: string, file: Blob) => _impl?.saveAudioFile ? _impl.saveAudioFile(id, file) : Promise.resolve(),
  getAudioFile: (id: string) => _impl?.getAudioFile ? _impl.getAudioFile(id) : Promise.resolve(null),
  deleteAudioFile: (id: string) => _impl?.deleteAudioFile ? _impl.deleteAudioFile(id) : Promise.resolve(),
  getAllStoredTrackIds: () => _impl?.getAllStoredTrackIds ? _impl.getAllStoredTrackIds() : Promise.resolve([]),
};

export function getStorage(): IStorage & StateStorage {
  return lazyStorage;
}
