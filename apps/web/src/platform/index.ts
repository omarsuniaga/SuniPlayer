// src/platform/index.ts

import { BrowserAudioEngine } from './browser/BrowserAudioEngine';
import { IDBStorage, dbStorage } from './browser/IDBStorage'; // Importamos la instancia única
import { BlobFileAccess } from './browser/BlobFileAccess';

export type { IAudioEngine, AudioLoadOptions } from './interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './interfaces/IFileAccess';

// Instancias únicas (Singletons)
const _audioEngine = new BrowserAudioEngine();
const _fileAccess = new BlobFileAccess();

// Exportamos las instancias directamente. 
export const audioEngine = _audioEngine;
export const storage = dbStorage; // Usamos la instancia que viene de IDBStorage
export const fileAccess = _fileAccess;

export function getAudioEngine() { return _audioEngine; }
export function getStorage() { return dbStorage; }
export function getFileAccess() { return _fileAccess; }
