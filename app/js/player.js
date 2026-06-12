// Player controller: orchestrates engine + source list + QuouList + session
// modes (docs/especificaciones/03-modelo-sesion.md).

import { engine } from './audio/engine.js';
import { Songs, AudioCache, Config, ShowHistory } from './db.js';

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify(event) { listeners.forEach(fn => fn(event, state)); }

export const state = {
  mode: 'escucha',            // escucha | edit | show
  source: null,               // { type: 'song'|'playlist'|'smart'|'set', name, songIds: [] }
  sourceIndex: -1,
  queue: [],                  // QuouList: array of song objects (in memory only)
  repeat: 'none',             // none | one | all
  currentSong: null,
  loading: false,
  error: null,
  // Show mode
  show: { active: false, startedAt: 0, setName: '', songsPlayed: 0, queueAdded: 0, wakeLock: null },
  sessionStartedAt: Date.now(),
};

export { engine };

async function blobForSong(song) {
  const cached = await AudioCache.get(song.id);
  if (cached && cached.blob) return cached.blob;
  return null;
}

export async function playSong(song, sourceInfo = null) {
  state.loading = true;
  state.error = null;
  notify('loading');
  try {
    const blob = await blobForSong(song);
    if (!blob) {
      state.error = 'No se pudo reproducir este archivo. ¿Está corrupto o fue movido?';
      state.loading = false;
      notify('error');
      return false;
    }
    if (sourceInfo) {
      state.source = sourceInfo;
      state.sourceIndex = sourceInfo.songIds ? sourceInfo.songIds.indexOf(song.id) : -1;
    }
    state.currentSong = song;
    await engine.load(song, blob);
    await engine.play();
    state.loading = false;

    // play counter + recency (persisted)
    song.playCount = (song.playCount || 0) + 1;
    song.lastPlayedAt = Date.now();
    await Songs.patch(song.id, { playCount: song.playCount, lastPlayedAt: song.lastPlayedAt });
    await Config.set('lastPlayed', { songId: song.id, at: Date.now() });
    if (state.show.active) state.show.songsPlayed++;
    notify('songchange');
    return true;
  } catch (err) {
    console.error(err);
    state.error = 'No se pudo reproducir este archivo. ¿Está corrupto o fue movido?';
    state.loading = false;
    notify('error');
    return false;
  }
}

export async function togglePlay() {
  if (!state.currentSong) return;
  if (engine.isPlaying) engine.pause();
  else await engine.play();
  notify('playstate');
}

export function stop() {
  engine.stop();
  notify('playstate');
}

export async function next() {
  // 1) QuouList first
  if (state.queue.length > 0) {
    const nextSong = state.queue.shift();
    notify('queue');
    return playSong(nextSong);
  }
  // 2) repeat one
  if (state.repeat === 'one' && state.currentSong) {
    return playSong(state.currentSong);
  }
  // 3) source list
  if (state.source && state.source.songIds) {
    let idx = state.sourceIndex + 1;
    if (idx >= state.source.songIds.length) {
      if (state.show.active) {
        // Show: cola vacía + última del set => stop, no sorpresas
        engine.stop();
        notify('setdone');
        return;
      }
      if (state.repeat === 'all') idx = 0;
      else { engine.stop(); notify('playstate'); return; }
    }
    const song = await Songs.get(state.source.songIds[idx]);
    if (song) {
      state.sourceIndex = idx;
      return playSong(song);
    }
  }
  engine.stop();
  notify('playstate');
}

export async function previous() {
  if (engine.currentTime > 3 || !state.source || !state.source.songIds) {
    engine.seek(state.currentSong ? (state.currentSong.startAt ?? 0) : 0);
    return;
  }
  const idx = state.sourceIndex - 1;
  if (idx < 0) { engine.seek(state.currentSong.startAt ?? 0); return; }
  const song = await Songs.get(state.source.songIds[idx]);
  if (song) {
    state.sourceIndex = idx;
    return playSong(song);
  }
}

export function cycleRepeat() {
  state.repeat = state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none';
  notify('repeat');
  return state.repeat;
}

// ---- QuouList ----
export function queueAdd(song) {
  state.queue.push(song);
  if (state.show.active) state.show.queueAdded++;
  notify('queue');
}
export function queueRemove(index) {
  state.queue.splice(index, 1);
  notify('queue');
}
export function queueClear() {
  state.queue = [];
  notify('queue');
}
export function queueMove(from, to) {
  const [item] = state.queue.splice(from, 1);
  state.queue.splice(to, 0, item);
  notify('queue');
}
export function queueDuration() {
  return state.queue.reduce((acc, s) => acc + (s.duration || 0), 0);
}

// ---- Show mode ----
export async function startShow(set, songs) {
  state.mode = 'show';
  state.show = { active: true, startedAt: Date.now(), setName: set.name, songsPlayed: 0, queueAdded: 0, wakeLock: null };
  state.source = { type: 'set', name: set.name, songIds: set.songIds.slice() };
  state.sourceIndex = -1;
  state.queue = [];
  try {
    if (navigator.wakeLock) state.show.wakeLock = await navigator.wakeLock.request('screen');
  } catch { /* wake lock optional */ }
  notify('mode');
  if (songs.length > 0) {
    state.sourceIndex = 0;
    await playSong(songs[0]);
  }
}

export async function endShow() {
  const elapsed = Math.round((Date.now() - state.show.startedAt) / 1000);
  await ShowHistory.add({
    date: state.show.startedAt,
    setName: state.show.setName,
    duration: elapsed,
    songCount: state.show.songsPlayed,
    queueExtra: state.show.queueAdded,
  });
  const totalShow = await Config.get('totalShowSeconds', 0);
  await Config.set('totalShowSeconds', totalShow + elapsed);
  const showCount = await Config.get('showCount', 0);
  await Config.set('showCount', showCount + 1);
  try { if (state.show.wakeLock) state.show.wakeLock.release(); } catch { }
  state.show = { active: false, startedAt: 0, setName: '', songsPlayed: 0, queueAdded: 0, wakeLock: null };
  state.mode = 'escucha';
  engine.stop();
  state.queue = [];
  notify('mode');
  return elapsed;
}

export function setMode(mode) {
  state.mode = mode;
  notify('mode');
}

// auto-advance on song end (gap handled here: 1s default between songs)
engine.addEventListener('ended', async () => {
  const gap = state.currentSong?.gap ?? 1;
  setTimeout(() => next(), Math.max(0, gap) * 1000);
});

engine.addEventListener('timeupdate', (e) => notify('time'));
engine.addEventListener('play', () => notify('playstate'));
engine.addEventListener('pause', () => notify('playstate'));

// persist total listened time on unload
window.addEventListener('beforeunload', () => {
  const elapsed = Math.round((Date.now() - state.sessionStartedAt) / 1000);
  // best-effort: synchronous-ish IDB write may not complete; acceptable for MVP
  Config.get('totalListenSeconds', 0).then(t => Config.set('totalListenSeconds', t + elapsed));
});
