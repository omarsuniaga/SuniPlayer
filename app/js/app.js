// App bootstrap + router + theme (docs/componentes/13-tema.md)
import { openDB, Songs, Playlists, Config } from './db.js';
import { generateSmartCollections } from './collections.js';
import { state, engine, subscribe } from './player.js';
import { renderHome } from './views/home.js';
import { renderLibrary } from './views/library.js';
import { renderPlayer } from './views/playerView.js';
import { renderEdit } from './views/edit.js';
import { renderShow, cleanupShow } from './views/show.js';
import { renderProfile } from './views/profile.js';
import { toast } from './ui.js';

const views = {
  home: renderHome,
  library: renderLibrary,
  player: renderPlayer,
  edit: renderEdit,
  show: renderShow,
  profile: renderProfile,
};

let currentView = 'home';

export function navigate(view) {
  // Show mode locks navigation (docs/especificaciones/03-modelo-sesion.md)
  if (state.show.active && view !== 'show') {
    toast('Estás en modo Show. Tocá ⏹ para terminar el show primero.');
    return;
  }
  if (currentView === 'show' && view !== 'show') cleanupShow();
  currentView = view;
  const container = document.getElementById('view');
  views[view](container);
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  window.scrollTo(0, 0);
}

export async function refreshSmartCollections() {
  const songs = await Songs.all();
  const existing = (await Playlists.all()).filter(p => p.kind === 'smart');
  for (const p of existing) await Playlists.remove(p.id);
  if (songs.filter(s => s.bpm).length >= 3 || songs.some(s => s.playCount > 0)) {
    const collections = generateSmartCollections(songs);
    for (const c of collections) await Playlists.add(c);
  }
}

export function applyTheme(theme) {
  const resolved = theme === 'system'
    ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  document.documentElement.dataset.theme = resolved;
}

// mini-player persistent bar (visible outside the player view)
function updateMiniPlayer() {
  const bar = document.getElementById('mini-player');
  const song = state.currentSong;
  if (!song || currentView === 'player' || currentView === 'show') {
    bar.classList.remove('visible');
    return;
  }
  bar.classList.add('visible');
  bar.querySelector('.mini-title').textContent = song.name;
  bar.querySelector('.mini-play').textContent = engine.isPlaying ? '⏸' : '▶';
}

async function init() {
  await openDB();
  const theme = await Config.get('theme', 'dark');
  applyTheme(theme);
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', async () => {
    applyTheme(await Config.get('theme', 'dark'));
  });

  const masterVol = await Config.get('masterVolume', 75);
  // master volume applies on first user gesture (AudioContext policy)
  document.addEventListener('pointerdown', () => engine.setMasterVolume(masterVol), { once: true });

  // bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // mini player events
  const bar = document.getElementById('mini-player');
  bar.querySelector('.mini-play').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (engine.isPlaying) engine.pause(); else await engine.play();
  });
  bar.addEventListener('click', () => navigate('player'));

  subscribe((event) => {
    if (['songchange', 'playstate', 'mode'].includes(event)) updateMiniPlayer();
    if (event === 'mode' && state.show.active) navigate('show');
  });

  // keyboard shortcuts: space = play/pause, ←/→ = seek ±5s
  document.addEventListener('keydown', async (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (!state.currentSong) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (engine.isPlaying) engine.pause(); else await engine.play();
    } else if (e.code === 'ArrowRight') {
      engine.seek(engine.currentTime + 5);
    } else if (e.code === 'ArrowLeft') {
      engine.seek(engine.currentTime - 5);
    }
  });

  await refreshSmartCollections();

  // PWA service worker
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  }

  navigate('home');
}

init();
