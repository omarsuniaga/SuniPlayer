// src/platform/index.ts

import { BrowserAudioEngine } from './browser/BrowserAudioEngine';
import { IDBStorage } from './browser/IDBStorage';
import { BlobFileAccess } from './browser/BlobFileAccess';

export type { IAudioEngine, AudioLoadOptions } from './interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './interfaces/IFileAccess';

// Instancias Ãºnicas (Singletons)
const _audioEngine = new BrowserAudioEngine();
const _storage = new IDBStorage();
const _fileAccess = new BlobFileAccess();

// Exportamos las instancias directamente. 
// Al ser objetos reales, no perdemos el contexto 'this'.
export const audioEngine = _audioEngine;
export const storage = _storage;
export const fileAccess = _fileAccess;

// Mantener los getters por compatibilidad si algÃºn componente los usa
export function getAudioEngine() { return _audioEngine; }
export function getStorage() { return _storage; }
export function getFileAccess() { return _fileAccess; }
