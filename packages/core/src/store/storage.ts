import { StateStorage } from "zustand/middleware";

let _storage: StateStorage | null = null;

export function configureStorage(storage: StateStorage): void {
  _storage = storage;
}

/**
 * Returns a lazy proxy StateStorage.
 *
 * `createJSONStorage(() => getStorage())` calls getStorage() immediately at
 * store-creation time — before configureStorage() has been called (because the
 * stores are evaluated as a side-effect of importing '@suniplayer/core').
 *
 * Instead of throwing at creation time (which makes createJSONStorage return
 * undefined and disables persistence entirely), we return a stable proxy object
 * whose methods forward to _storage at call time, when configureStorage() has
 * already been called.
 */
const lazyStorage: StateStorage = {
  getItem: (name) => {
    if (!_storage) throw new Error(
      "[suniplayer/core] Storage not configured. Call configureStorage() at app startup."
    );
    return _storage.getItem(name);
  },
  setItem: (name, value) => {
    if (!_storage) throw new Error(
      "[suniplayer/core] Storage not configured. Call configureStorage() at app startup."
    );
    return _storage.setItem(name, value);
  },
  removeItem: (name) => {
    if (!_storage) throw new Error(
      "[suniplayer/core] Storage not configured. Call configureStorage() at app startup."
    );
    return _storage.removeItem(name);
  },
};

export function getStorage(): StateStorage {
  // Return the proxy immediately — actual _storage is accessed lazily on first use.
  return lazyStorage;
}
