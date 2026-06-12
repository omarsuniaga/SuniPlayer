// Vista Librería (docs/vistas/03-vista-libreria.md)
import { h, fmtTime, fmtDate, openModal, closeModal, confirmModal, toast } from '../ui.js';
import { Songs, Playlists, AudioCache } from '../db.js';
import { energyClass } from '../audio/analyzer.js';
import { importFiles } from '../importer.js';
import { playSong, queueAdd } from '../player.js';
import { navigate, refreshSmartCollections } from '../app.js';

const PAGE_SIZE = 25;
let sortBy = 'addedAt';
let filterEnergy = 'all';
let filterFormat = 'all';
let page = 0;
let query = '';

export async function renderLibrary(container) {
  const songs = await Songs.all();
  container.innerHTML = '';

  const fileInput = h('input', {
    type: 'file', multiple: true, accept: 'audio/*,.mp3,.wav,.ogg,.flac,.m4a',
    style: { display: 'none' },
    onchange: async (e) => {
      if (e.target.files.length) await runImport(e.target.files, container);
    },
  });

  container.append(
    h('header', { class: 'view-header' },
      h('h1', {}, '📂 Librería'),
    ),
    h('div', { class: 'search-box' },
      h('input', {
        type: 'search', placeholder: '🔍 Buscar en tu librería...', value: query,
        oninput: (e) => { query = e.target.value; page = 0; renderList(); },
      })),
    h('div', { class: 'filter-bar' },
      select('Ordenar', [
        ['addedAt', 'Más recientes'], ['name', 'Nombre'], ['bpm', 'BPM'],
        ['duration', 'Duración'], ['playCount', 'Más reproducidas'],
      ], sortBy, v => { sortBy = v; renderList(); }),
      select('Energía', [
        ['all', 'Toda energía'], ['soft', '🟢 Suave'], ['medium', '🟡 Media'],
        ['high', '🔶 Alta'], ['veryhigh', '🔴 Muy Alta'],
      ], filterEnergy, v => { filterEnergy = v; page = 0; renderList(); }),
      select('Formato', [
        ['all', 'Todos'], ['mp3', 'mp3'], ['wav', 'wav'], ['flac', 'flac'], ['ogg', 'ogg'], ['m4a', 'm4a'],
      ], filterFormat, v => { filterFormat = v; page = 0; renderList(); }),
    ),
    h('div', { id: 'library-list' }),
    h('div', { class: 'import-cta' },
      h('button', { class: 'btn primary big', onclick: () => fileInput.click() },
        '📂 + Importar archivos del dispositivo'),
      fileInput),
  );

  function select(label, options, current, onChange) {
    return h('select', { class: 'select', 'aria-label': label, onchange: (e) => onChange(e.target.value) },
      ...options.map(([v, l]) => h('option', { value: v, selected: v === current }, l)));
  }

  function filtered() {
    let list = songs.slice();
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.fileName.toLowerCase().includes(q));
    }
    if (filterEnergy !== 'all') list = list.filter(s => energyClass(s.bpm).key === filterEnergy);
    if (filterFormat !== 'all') list = list.filter(s => s.format === filterFormat);
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'bpm') return (b.bpm || 0) - (a.bpm || 0);
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      if (sortBy === 'playCount') return (b.playCount || 0) - (a.playCount || 0);
      return (b.addedAt || 0) - (a.addedAt || 0);
    });
    return list;
  }

  function renderList() {
    const listEl = container.querySelector('#library-list');
    listEl.innerHTML = '';
    const list = filtered();

    if (songs.length === 0) {
      listEl.append(h('div', { class: 'empty-state' },
        h('div', { class: 'empty-card' },
          h('p', { class: 'empty-title' }, 'Tu librería está vacía'),
          h('p', {}, 'Importá canciones desde tu dispositivo'),
          h('button', { class: 'btn primary', onclick: () => fileInput.click() }, '📂 Importar archivos'))));
      return;
    }
    if (list.length === 0) {
      listEl.append(h('p', { class: 'empty-state' },
        query ? 'No se encontraron canciones' : 'Ninguna canción cumple con este filtro. Probá con otro.'));
      return;
    }

    const totalPages = Math.ceil(list.length / PAGE_SIZE);
    if (page >= totalPages) page = totalPages - 1;
    const slice = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    for (const song of slice) {
      const energy = energyClass(song.bpm);
      listEl.append(h('div', {
        class: 'song-row',
        onclick: () => playSong(song, { type: 'song', name: song.name, songIds: [song.id] }).then(ok => ok && navigate('player')),
        oncontextmenu: (e) => { e.preventDefault(); songMenu(song); },
      },
        h('div', { class: 'song-row-main' },
          h('span', { class: 'song-icon' }, '♫'),
          h('div', { class: 'song-row-text' },
            h('div', { class: 'song-row-title' }, song.name),
            h('div', { class: 'song-row-sub' }, `${song.fileName} · Agregado: ${fmtDate(song.addedAt)}`)),
        ),
        h('div', { class: 'song-row-meta' },
          h('span', {}, fmtTime(song.duration)),
          h('span', { title: energy.label }, `${energy.icon}${song.bpm || '—'}`),
          song.cached ? h('span', { title: 'Guardada en la app' }, '⭐') : null,
          h('button', {
            class: 'btn-icon', 'aria-label': 'Opciones',
            onclick: (e) => { e.stopPropagation(); songMenu(song); },
          }, '⋮')),
      ));
    }

    if (totalPages > 1) {
      listEl.append(h('div', { class: 'pager' },
        h('button', { class: 'btn-icon', disabled: page === 0, onclick: () => { page--; renderList(); } }, '◀'),
        h('span', {}, `${list.length} canciones · Pág ${page + 1} de ${totalPages}`),
        h('button', { class: 'btn-icon', disabled: page >= totalPages - 1, onclick: () => { page++; renderList(); } }, '▶')));
    } else {
      listEl.append(h('div', { class: 'pager' }, h('span', {}, `${list.length} canciones`)));
    }
  }

  function songMenu(song) {
    const item = (label, fn) => h('button', { class: 'menu-item', onclick: () => { closeModal(); fn(); } }, label);
    openModal(song.name, h('div', { class: 'menu-list' },
      item('▶ Reproducir', () => playSong(song, { type: 'song', name: song.name, songIds: [song.id] }).then(ok => ok && navigate('player'))),
      item('➕ Agregar a playlist', () => addToPlaylistModal(song)),
      item('↕ Agregar a cola', () => { queueAdd(song); toast(`"${song.name}" agregada a la cola`); }),
      item('✏️ Editar info', () => editInfoModal(song)),
      item('🗑 Eliminar de librería', async () => {
        const ok = await confirmModal('Eliminar canción',
          `¿Quitar "${song.name}" de la librería? El archivo original no se borra.`, 'Eliminar');
        if (ok) {
          await Songs.remove(song.id);
          await refreshSmartCollections();
          renderLibrary(container);
        }
      }),
    ));
  }

  async function addToPlaylistModal(song) {
    const playlists = (await Playlists.all()).filter(p => p.kind !== 'smart');
    if (playlists.length === 0) { toast('Aún no tenés playlists. Creá una desde Inicio.'); return; }
    openModal('Agregar a playlist', h('div', { class: 'menu-list' },
      ...playlists.map(p => h('button', {
        class: 'menu-item', onclick: async () => {
          if (!p.songIds.includes(song.id)) {
            p.songIds.push(song.id);
            p.totalDuration = (p.totalDuration || 0) + (song.duration || 0);
            await Playlists.update(p);
          }
          closeModal();
          toast(`Agregada a "${p.name}"`);
        },
      }, `📋 ${p.name} (${p.songIds.length})`))));
  }

  function editInfoModal(song) {
    const nameInput = h('input', { type: 'text', value: song.name, class: 'text-input' });
    const imgInput = h('input', { type: 'file', accept: 'image/*,.pdf', class: 'text-input' });
    openModal('Editar info', h('div', {},
      h('label', { class: 'field-label' }, 'Nombre visible (el archivo no se renombra)'),
      nameInput,
      h('label', { class: 'field-label' }, 'Imagen / Partitura asociada'),
      imgInput,
    ), [
      { label: 'Cancelar' },
      {
        label: 'Guardar', kind: 'primary', onClick: async () => {
          const changes = { name: nameInput.value.trim() || song.name };
          const file = imgInput.files[0];
          if (file && file.type.startsWith('image/')) {
            changes.imageData = await new Promise(res => {
              const r = new FileReader();
              r.onload = () => res(r.result);
              r.readAsDataURL(file);
            });
          }
          await Songs.patch(song.id, changes);
          toast('Guardado');
          renderLibrary(container);
        },
      },
    ]);
  }

  renderList();
}

async function runImport(files, container) {
  const body = h('div', {},
    h('p', { id: 'import-status' }, `Importando ${files.length} canciones...`),
    h('div', { class: 'progress-track' }, h('div', { class: 'progress-fill', id: 'import-bar' })),
    h('div', { id: 'import-log', class: 'import-log' }));
  openModal('Importando', body, []);
  const log = body.querySelector('#import-log');
  const bar = body.querySelector('#import-bar');
  await importFiles(files, (done, total, name, phase) => {
    bar.style.width = `${Math.round((done / total) * 100)}%`;
    const icons = { leyendo: '⏳', analizando: '⟳', listo: '✔', error: '⚠️' };
    const last = log.lastElementChild;
    if (last && last.dataset.name === name) last.textContent = `${icons[phase]} ${name}`;
    else {
      const row = h('div', {}, `${icons[phase]} ${name}`);
      row.dataset.name = name;
      log.append(row);
    }
  });
  closeModal();
  await refreshSmartCollections();
  toast('Importación completa');
  renderLibrary(container);
}
