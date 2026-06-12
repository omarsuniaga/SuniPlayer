// Vista de Inicio (docs/vistas/01-vista-inicio.md)
import { h, fmtTime, openModal, closeModal, confirmModal, toast } from '../ui.js';
import { Songs, Playlists, Config } from '../db.js';
import { playSong, state } from '../player.js';
import { navigate, refreshSmartCollections } from '../app.js';

let query = '';

export async function renderHome(container) {
  const [songs, playlists, lastPlayed] = await Promise.all([
    Songs.all(), Playlists.all(), Config.get('lastPlayed'),
  ]);
  const smart = playlists.filter(p => p.kind === 'smart');
  const manual = playlists.filter(p => p.kind === 'playlist' || p.kind === 'set');
  container.innerHTML = '';

  container.append(
    h('header', { class: 'view-header' },
      h('h1', {}, '🎵 Suniplayer'),
      h('div', { class: 'header-actions' },
        h('button', { class: 'btn-icon', 'aria-label': 'Perfil', onclick: () => navigate('profile') }, '👤')),
    ),
    h('div', { class: 'search-box' },
      h('input', {
        type: 'search', placeholder: '🔍 Buscar canciones, playlists...', value: query,
        oninput: (e) => { query = e.target.value; renderBody(); },
      })),
    h('div', { id: 'home-body' }),
  );

  function renderBody() {
    const body = container.querySelector('#home-body');
    body.innerHTML = '';

    // --- search results mode ---
    if (query.trim()) {
      const q = query.toLowerCase();
      const songHits = songs.filter(s => s.name.toLowerCase().includes(q));
      const plHits = playlists.filter(p => p.name.toLowerCase().includes(q));
      if (!songHits.length && !plHits.length) {
        body.append(h('p', { class: 'empty-state' }, 'Sin resultados'));
        return;
      }
      if (songHits.length) {
        body.append(h('h2', { class: 'section-title' }, 'Canciones'));
        for (const s of songHits.slice(0, 20)) {
          body.append(h('div', {
            class: 'song-row', onclick: () =>
              playSong(s, { type: 'song', name: s.name, songIds: [s.id] }).then(ok => ok && navigate('player')),
          },
            h('div', { class: 'song-row-main' }, h('span', { class: 'song-icon' }, '♫'),
              h('div', { class: 'song-row-text' }, h('div', { class: 'song-row-title' }, s.name))),
            h('div', { class: 'song-row-meta' }, h('span', {}, fmtTime(s.duration)))));
        }
      }
      if (plHits.length) {
        body.append(h('h2', { class: 'section-title' }, 'Colecciones'));
        body.append(h('div', { class: 'card-grid' }, plHits.map(p => collectionCard(p))));
      }
      return;
    }

    // --- first use ---
    if (songs.length === 0) {
      body.append(h('div', { class: 'empty-state' },
        h('div', { class: 'empty-card' },
          h('p', { class: 'empty-title' }, '🎵 Bienvenido a Suniplayer'),
          h('p', {}, 'Empezá importando canciones desde la Librería.'),
          h('button', { class: 'btn primary', onclick: () => navigate('library') }, '📂 Importar'))));
      return;
    }

    // --- smart collections ---
    body.append(h('div', { class: 'section-head' },
      h('h2', { class: 'section-title' }, 'Colecciones Inteligentes'),
      h('button', {
        class: 'btn-icon', title: 'Regenerar', onclick: async () => {
          await refreshSmartCollections();
          toast('Colecciones regeneradas');
          renderHome(container);
        },
      }, '🔄')));
    if (smart.length === 0) {
      body.append(h('p', { class: 'hint' }, 'Importá canciones para ver tus colecciones inteligentes (mínimo 3 analizadas).'));
    } else {
      body.append(h('div', { class: 'card-grid' }, smart.slice(0, 4).map(p => collectionCard(p))));
    }

    // --- recent play ---
    if (lastPlayed && lastPlayed.songId) {
      const song = songs.find(s => s.id === lastPlayed.songId);
      if (song) {
        body.append(h('h2', { class: 'section-title' }, 'Reproduciendo ahora'),
          h('div', {
            class: 'recent-card', onclick: () =>
              playSong(song, { type: 'song', name: song.name, songIds: [song.id] }).then(ok => ok && navigate('player')),
          },
            h('div', {},
              h('div', { class: 'song-row-title' }, song.name),
              h('div', { class: 'song-row-sub' },
                `BPM: ${song.bpm || '—'}  |  Tono: ${song.pitch > 0 ? '+' : ''}${song.pitch || 0}  |  Tempo: ${song.tempo || 100}%`)),
            h('button', { class: 'btn primary' }, '▶ Continuar')));
      }
    }

    // --- playlists ---
    body.append(h('div', { class: 'section-head' },
      h('h2', { class: 'section-title' }, 'Tus Playlists'),
      manual.length ? h('button', {
        class: 'btn-icon', title: 'Eliminar colecciones',
        onclick: () => deleteCollectionsModal(manual, container),
      }, '🗑') : null));
    const grid = h('div', { class: 'card-grid' });
    if (manual.length === 0) {
      body.append(h('p', { class: 'hint' }, 'Aún no tenés playlists. Tocá + para crear una.'));
    }
    for (const p of manual) grid.append(collectionCard(p));
    grid.append(h('div', { class: 'collection-card new-card', onclick: () => createPlaylistModal(songs, container) },
      h('div', { class: 'new-card-plus' }, '➕'), h('div', {}, 'Nueva')));
    body.append(grid);
  }

  function collectionCard(p) {
    const icon = p.kind === 'smart'
      ? (p.criterio === 'plays' ? '🔥' : '⟡')
      : p.kind === 'set' ? '🎯' : '📋';
    const sub = p.kind === 'smart' && p.criterio === 'plays'
      ? `${p.songIds.length} canc. · plays`
      : `${p.songIds.length} canc. · ${fmtTime(p.totalDuration || 0)}`;
    return h('div', {
      class: `collection-card ${p.kind}`,
      onclick: async () => {
        if (!p.songIds.length) { toast('Esta colección está vacía'); return; }
        const first = await Songs.get(p.songIds[0]);
        if (first) {
          const ok = await playSong(first, { type: p.kind, name: p.name, songIds: p.songIds.slice() });
          if (ok) navigate('player');
        }
      },
    },
      h('div', { class: 'collection-icon' }, icon),
      h('div', { class: 'collection-name' }, p.name),
      h('div', { class: 'collection-sub' }, sub),
      p.curve ? h('div', { class: 'collection-tag' }, `⟡ ${p.curve}`) : null,
    );
  }

  renderBody();
}

// Modal Crear Playlist (cabecera + cuerpo + pie, docs/vistas/01-vista-inicio.md §5)
export function createPlaylistModal(songs, container, { kind = 'playlist', onSaved } = {}) {
  const selected = [];
  let plPage = 0;
  const PAGE = 8;
  const nameInput = h('input', { type: 'text', placeholder: 'Nombre de la colección', class: 'text-input' });
  const headerInfo = h('div', { class: 'modal-counter' }, 'Total: 0 canciones | Duración: 0:00');
  const listEl = h('div', { class: 'menu-list' });
  const pagerEl = h('div', { class: 'pager' });

  function update() {
    const dur = selected.reduce((a, s) => a + (s.duration || 0), 0);
    headerInfo.textContent = `Total: ${selected.length} canciones | Duración: ${fmtTime(dur)}`;
    listEl.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(songs.length / PAGE));
    const slice = songs.slice(plPage * PAGE, (plPage + 1) * PAGE);
    for (const s of slice) {
      const isIn = selected.includes(s);
      listEl.append(h('div', { class: 'pick-row' },
        h('span', { class: 'pick-name' }, `${s.name}`),
        h('span', { class: 'pick-dur' }, fmtTime(s.duration)),
        h('button', {
          class: `btn small ${isIn ? '' : 'primary'}`,
          onclick: () => { isIn ? selected.splice(selected.indexOf(s), 1) : selected.push(s); update(); },
        }, isIn ? 'Quitar' : '+ Agregar')));
    }
    pagerEl.innerHTML = '';
    if (totalPages > 1) {
      pagerEl.append(
        h('button', { class: 'btn-icon', disabled: plPage === 0, onclick: () => { plPage--; update(); } }, '◀'),
        h('span', {}, `${plPage + 1} / ${totalPages}`),
        h('button', { class: 'btn-icon', disabled: plPage >= totalPages - 1, onclick: () => { plPage++; update(); } }, '▶'));
    }
  }
  update();

  openModal(kind === 'set' ? 'Nuevo Set' : 'Nueva Playlist',
    h('div', {}, nameInput, headerInfo, listEl, pagerEl), [
    {
      label: 'Cerrar', onClick: async () => {
        if (selected.length) {
          const ok = await confirmModal('Descartar', '¿Descartar los cambios?', 'Descartar');
          if (!ok) return;
        }
      },
    },
    {
      label: 'Guardar', kind: 'primary', onClick: async () => {
        const name = nameInput.value.trim();
        if (!name) { toast('Poné un nombre primero'); return; }
        const id = await Playlists.add({
          name, kind,
          songIds: selected.map(s => s.id),
          totalDuration: selected.reduce((a, s) => a + (s.duration || 0), 0),
          createdAt: Date.now(), modifiedAt: Date.now(),
          shuffle: false, repeat: false,
          targetMinutes: null, startSongId: null,
        });
        toast(`"${name}" creada`);
        if (onSaved) onSaved(id);
        else if (container) renderHome(container);
      },
    },
  ]);
}

function deleteCollectionsModal(collections, container) {
  const checks = new Map();
  const listEl = h('div', { class: 'menu-list' },
    ...collections.map(p => {
      const cb = h('input', { type: 'checkbox' });
      checks.set(p, cb);
      return h('label', { class: 'pick-row' }, cb,
        h('span', { class: 'pick-name' }, `${p.name}`),
        h('span', { class: 'pick-dur' }, `${p.songIds.length} canc. · ${fmtTime(p.totalDuration || 0)}`));
    }));
  openModal('Eliminar colecciones', listEl, [
    { label: 'Cancelar' },
    {
      label: 'Eliminar seleccionadas', kind: 'danger', close: false, onClick: async () => {
        const picked = collections.filter(p => checks.get(p).checked);
        if (!picked.length) { toast('Seleccioná al menos una'); return; }
        closeModal();
        const ok = await confirmModal('¿Eliminar las colecciones seleccionadas?',
          `${picked.map(p => '· ' + p.name).join('\n')}\n\nEsta acción no se puede deshacer. Las canciones NO se eliminan de la librería.`,
          'Eliminar');
        if (ok) {
          for (const p of picked) await Playlists.remove(p.id);
          toast('Colecciones eliminadas');
          renderHome(container);
        }
      },
    },
  ]);
}
