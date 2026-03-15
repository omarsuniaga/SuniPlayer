import { StateStorage } from "zustand/middleware";

let _storage: StateStorage | null = null;

export function configureStorage(storage: StateStorage): void {
  _storage = storage;
}

export function getStorage(): StateStorage {
  if (!_storage) {
    throw new Error(
      "[suniplayer/core] Storage not configured. Call configureStorage() at app startup before using any store."
    );
  }
  return _storage;
}
