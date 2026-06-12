// IndexedDB persistence layer — Capa 1 (docs/especificaciones/04-almacenamiento.md)
const DB_NAME = 'suniplayer';
const DB_VERSION = 1;

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('songs')) {
        const s = db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
        s.createIndex('name', 'name');
        s.createIndex('bpm', 'bpm');
        s.createIndex('playCount', 'playCount');
        s.createIndex('addedAt', 'addedAt');
      }
      if (!db.objectStoreNames.contains('markers')) {
        const m = db.createObjectStore('markers', { keyPath: 'id', autoIncrement: true });
        m.createIndex('songId', 'songId');
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('showHistory')) {
        db.createObjectStore('showHistory', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('audioCache')) {
        db.createObjectStore('audioCache', { keyPath: 'songId' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const result = fn(s);
    t.oncomplete = () => resolve(result && result._value !== undefined ? result._value : result);
    t.onerror = () => reject(t.error);
  }));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll(store) {
  const db = await openDB();
  return reqToPromise(db.transaction(store).objectStore(store).getAll());
}
async function get(store, key) {
  const db = await openDB();
  return reqToPromise(db.transaction(store).objectStore(store).get(key));
}
async function put(store, value) {
  const db = await openDB();
  return reqToPromise(db.transaction(store, 'readwrite').objectStore(store).put(value));
}
async function add(store, value) {
  const db = await openDB();
  return reqToPromise(db.transaction(store, 'readwrite').objectStore(store).add(value));
}
async function del(store, key) {
  const db = await openDB();
  return reqToPromise(db.transaction(store, 'readwrite').objectStore(store).delete(key));
}

// ---- Songs ----
export const Songs = {
  all: () => getAll('songs'),
  get: (id) => get('songs', id),
  add: (song) => add('songs', song),
  update: (song) => put('songs', song),
  async patch(id, changes) {
    const song = await get('songs', id);
    if (!song) return null;
    Object.assign(song, changes);
    await put('songs', song);
    return song;
  },
  remove: async (id) => {
    await del('songs', id);
    await del('audioCache', id);
    const markers = await Markers.bySong(id);
    for (const m of markers) await del('markers', m.id);
  },
};

// ---- Markers ----
export const Markers = {
  async bySong(songId) {
    const db = await openDB();
    return reqToPromise(db.transaction('markers').objectStore('markers').index('songId').getAll(songId));
  },
  add: (marker) => add('markers', marker),
  remove: (id) => del('markers', id),
};

// ---- Playlists (playlist | set | smart) ----
export const Playlists = {
  all: () => getAll('playlists'),
  get: (id) => get('playlists', id),
  add: (pl) => add('playlists', pl),
  update: (pl) => put('playlists', pl),
  remove: (id) => del('playlists', id),
};

// ---- Show history ----
export const ShowHistory = {
  all: () => getAll('showHistory'),
  add: (entry) => add('showHistory', entry),
};

// ---- Config (key/value) ----
export const Config = {
  async get(key, fallback = null) {
    const row = await get('config', key);
    return row ? row.value : fallback;
  },
  set: (key, value) => put('config', { key, value }),
};

// ---- Audio blobs (Capa 2: archivos guardados en la app) ----
export const AudioCache = {
  get: (songId) => get('audioCache', songId),
  put: (songId, blob) => put('audioCache', { songId, blob }),
  remove: (songId) => del('audioCache', songId),
  async size() {
    const rows = await getAll('audioCache');
    return rows.reduce((acc, r) => acc + (r.blob ? r.blob.size : 0), 0);
  },
  async count() {
    const rows = await getAll('audioCache');
    return rows.length;
  },
  async clear() {
    const db = await openDB();
    return reqToPromise(db.transaction('audioCache', 'readwrite').objectStore('audioCache').clear());
  },
};
