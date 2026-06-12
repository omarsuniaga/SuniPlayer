// Vista Edit (docs/vistas/05-vista-edit.md)
import { h, fmtTime, openModal, closeModal, confirmModal, toast } from '../ui.js';
import { Songs, Playlists } from '../db.js';
import { state, setMode, startShow, playSong } from '../player.js';
import { navigate } from '../app.js';
import { createPlaylistModal } from './home.js';

let currentSetId = null;
let selectedSongId = null;

const TRANSITION_PRESETS = {
  corte: { fadeOut: 0, gap: 0, fadeIn: 0, label: 'Corte seco' },
  desvanecer: { fadeOut: 3, gap: 1, fadeIn: 2, label: 'Desvanecer' },
  mezcla: { fadeOut: 3, gap: 0, fadeIn: 3, label: 'Fundido encadenado' },
};

export async function renderEdit(container) {
  setMode('edit');
  const allPlaylists = await Playlists.all();
  const sets = allPlaylists.filter(p => p.kind === 'set');
  container.innerHTML = '';

  container.append(h('header', { class: 'view-header' },
    h('button', { class: 'btn-icon', onclick: () => { setMode('escucha'); navigate('home'); }, 'aria-label': 'Volver' }, '←'),
    h('h1', {}, '✏️ Modo Edit')));

  if (sets.length === 0) {
    container.append(h('div', { class: 'empty-state' },
      h('div', { class: 'empty-card' },
        h('p', { class: 'empty-title' }, 'Aún no tenés sets'),
        h('p', {}, 'Un set es la lista ordenada de canciones de tu show.'),
        h('button', { class: 'btn primary', onclick: () => newSet(container) }, '➕ Crear set'))));
    return;
  }

  let set = sets.find(s => s.id === currentSetId) || sets[0];
  currentSetId = set.id;
  const songs = [];
  for (const id of set.songIds) {
    const s = await Songs.get(id);
    if (s) songs.push(s);
  }
  set.totalDuration = songs.reduce((a, s) => a + (s.duration || 0), 0);

  // --- set selector ---
  container.append(h('div', { class: 'set-selector' },
    h('span', { class: 'set-label' }, 'SET:'),
    h('select', {
      class: 'select', onchange: (e) => {
        if (e.target.value === '__new') { newSet(container); return; }
        currentSetId = Number(e.target.value);
        selectedSongId = null;
        renderEdit(container);
      },
    },
      ...sets.map(s => h('option', { value: s.id, selected: s.id === set.id }, s.name)),
      h('option', { value: '__new' }, '➕ Nuevo set...')),
    h('button', {
      class: 'btn-icon', title: 'Eliminar set', onclick: async () => {
        const ok = await confirmModal('Eliminar set', `¿Eliminar "${set.name}"? Las canciones no se borran.`, 'Eliminar');
        if (ok) { await Playlists.remove(set.id); currentSetId = null; renderEdit(container); }
      },
    }, '🗑')));

  // --- set info + time budget ---
  const target = set.targetMinutes;
  let budget = null;
  if (target) {
    const ratio = (set.totalDuration / 60) / target;
    budget = ratio <= 0.9 ? `🟢 Entra en ${target} min` : ratio <= 1 ? `🟡 Al límite de ${target} min` : `🔴 Excede los ${target} min`;
  }
  container.append(h('div', { class: 'set-info-card' },
    h('div', { class: 'set-info-line' },
      `${songs.length} canciones  |  Duración: ${fmtTime(set.totalDuration)}` + (budget ? `  |  ${budget}` : '')),
    h('div', { class: 'set-info-actions' },
      h('button', {
        class: 'btn primary', onclick: async () => {
          if (!songs.length) { toast('Agregá canciones al set primero'); return; }
          const ok = await new Promise(res => openModal('🎯 Iniciar Show', h('div', { class: 'panel' },
            h('p', {}, `Set: ${set.name}`),
            h('p', {}, `Duración: ${fmtTime(set.totalDuration)} | ${songs.length} canciones`),
            h('p', { class: 'hint' }, '¿Estás listo para empezar el show? Una vez iniciado, no se puede editar el set.')), [
            { label: 'Cancelar', onClick: () => res(false) },
            { label: '🎯 Iniciar Show', kind: 'primary', onClick: () => res(true) },
          ]));
          if (ok) {
            await startShow(set, songs);
            navigate('show');
          }
        },
      }, '🎯 Iniciar Show'),
      h('button', {
        class: 'btn', onclick: () => {
          const input = h('input', { type: 'number', min: 1, max: 600, value: set.targetMinutes || 40, class: 'text-input num' });
          openModal('Tiempo disponible del show', h('div', { class: 'panel' },
            h('label', { class: 'field-label' }, 'Minutos disponibles'), input), [
            { label: 'Cancelar' },
            {
              label: 'Guardar', kind: 'primary', onClick: async () => {
                set.targetMinutes = Number(input.value) || null;
                await Playlists.update(set);
                renderEdit(container);
              },
            }]);
        },
      }, '⏱ Tiempo'),
    )));

  // --- set order: drag & drop + fallback arrows ---
  const orderEl = h('div', { class: 'set-order' });
  let dragFrom = null;
  songs.forEach((s, i) => {
    const icons = [
      (s.pitch || 0) !== 0 ? '🎵' : '',
      (s.tempo || 100) !== 100 ? '⏱' : '',
    ].join('');
    orderEl.append(h('div', {
      class: `song-row ${selectedSongId === s.id ? 'selected' : ''}`,
      draggable: 'true',
      ondragstart: (e) => { dragFrom = i; e.dataTransfer.effectAllowed = 'move'; e.currentTarget.classList.add('dragging'); },
      ondragend: (e) => e.currentTarget.classList.remove('dragging'),
      ondragover: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drop-target'); },
      ondragleave: (e) => e.currentTarget.classList.remove('drop-target'),
      ondrop: async (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-target');
        if (dragFrom !== null && dragFrom !== i) await move(dragFrom, i);
        dragFrom = null;
      },
      onclick: () => { selectedSongId = s.id; renderEdit(container); },
    },
      h('div', { class: 'song-row-main' },
        h('span', { class: 'drag-grip', title: 'Arrastrar para reordenar' }, '≣'),
        h('span', { class: 'order-num' }, `${i + 1}.`),
        h('div', { class: 'song-row-text' },
          h('div', { class: 'song-row-title' }, `♫ ${s.name} ${icons}`),
          h('div', { class: 'song-row-sub' },
            `Tono: ${(s.pitch || 0) > 0 ? '+' : ''}${s.pitch || 0}  |  Tempo: ${s.tempo || 100}%  |  ${fmtTime(s.duration)}`))),
      h('div', { class: 'song-row-meta' },
        h('button', { class: 'btn-icon', disabled: i === 0, onclick: (e) => { e.stopPropagation(); move(i, i - 1); } }, '↑'),
        h('button', { class: 'btn-icon', disabled: i === songs.length - 1, onclick: (e) => { e.stopPropagation(); move(i, i + 1); } }, '↓'),
        h('button', {
          class: 'btn-icon', onclick: async (e) => {
            e.stopPropagation();
            set.songIds.splice(i, 1);
            await Playlists.update(set);
            renderEdit(container);
          },
        }, '✕'))));
  });
  container.append(
    h('h2', { class: 'section-title' }, 'Orden del set'),
    orderEl,
    h('button', { class: 'btn big', onclick: () => addSongsModal(set, container) }, '+ Agregar canciones desde librería'));

  async function move(from, to) {
    const [id] = set.songIds.splice(from, 1);
    set.songIds.splice(to, 0, id);
    await Playlists.update(set);
    renderEdit(container);
  }

  // --- selected song adjustments + transition ---
  const sel = songs.find(s => s.id === selectedSongId);
  if (sel) {
    const selIdx = songs.indexOf(sel);
    const transition = (set.transitions && set.transitions[selIdx]) || { fadeOut: sel.fadeOut || 0, gap: 1, fadeIn: 0 };

    const pitchVal = h('span', { class: 'adj-val' }, `${(sel.pitch || 0) > 0 ? '+' : ''}${sel.pitch || 0}`);
    const tempoVal = h('span', { class: 'adj-val' }, `${sel.tempo || 100}%`);
    container.append(
      h('h2', { class: 'section-title' }, `Canción seleccionada: ${sel.name}`),
      h('div', { class: 'edit-panels' },
        h('div', { class: 'edit-panel' },
          h('div', { class: 'adj-row' }, '🎵 Tono ', pitchVal,
            h('input', {
              type: 'range', min: -12, max: 12, value: sel.pitch || 0, class: 'slider',
              oninput: async (e) => {
                sel.pitch = Number(e.target.value);
                pitchVal.textContent = `${sel.pitch > 0 ? '+' : ''}${sel.pitch}`;
                await Songs.patch(sel.id, { pitch: sel.pitch });
              },
            })),
          h('div', { class: 'adj-row' }, '⏱ Tempo ', tempoVal,
            h('input', {
              type: 'range', min: 50, max: 200, value: sel.tempo || 100, class: 'slider',
              oninput: async (e) => {
                sel.tempo = Number(e.target.value);
                tempoVal.textContent = `${sel.tempo}%`;
                await Songs.patch(sel.id, { tempo: sel.tempo });
              },
            })),
          h('div', { class: 'adj-row' }, '✂ Inicio ',
            timeInput(sel.startAt || 0, async (v) => { sel.startAt = v; await Songs.patch(sel.id, { startAt: v }); })),
          h('div', { class: 'adj-row' }, '✂ Final ',
            timeInput(sel.endAt || sel.duration, async (v) => { sel.endAt = v; await Songs.patch(sel.id, { endAt: v }); })),
          h('button', {
            class: 'btn small', onclick: async () => {
              const ok = await playSong(sel, { type: 'set', name: set.name, songIds: set.songIds.slice() });
              if (ok) navigate('player');
            },
          }, '▶ Escuchar (ensayo)')),
        h('div', { class: 'edit-panel' },
          h('div', { class: 'panel-title' }, '▶ Transición a siguiente'),
          h('div', { class: 'adj-row' }, 'FadeOut ',
            numInput(transition.fadeOut, async v => { transition.fadeOut = v; await saveTransition(); })),
          h('div', { class: 'adj-row' }, 'Gap ',
            numInput(transition.gap, async v => { transition.gap = v; await saveTransition(); })),
          h('div', { class: 'adj-row' }, 'FadeIn ',
            numInput(transition.fadeIn, async v => { transition.fadeIn = v; await saveTransition(); })),
          h('div', { class: 'preset-row' },
            ...Object.entries(TRANSITION_PRESETS).map(([k, p]) =>
              h('button', {
                class: 'btn small', onclick: async () => {
                  Object.assign(transition, { fadeOut: p.fadeOut, gap: p.gap, fadeIn: p.fadeIn });
                  await saveTransition();
                  renderEdit(container);
                },
              }, p.label))))));

    async function saveTransition() {
      set.transitions = set.transitions || {};
      set.transitions[selIdx] = transition;
      // apply to the songs involved so the engine honors them
      await Songs.patch(sel.id, { fadeOut: transition.fadeOut, gap: transition.gap });
      const nextSong = songs[selIdx + 1];
      if (nextSong) await Songs.patch(nextSong.id, { fadeIn: transition.fadeIn });
      await Playlists.update(set);
    }
  }

  function timeInput(seconds, onChange) {
    return h('input', {
      type: 'text', value: fmtTime(seconds), class: 'text-input num',
      onchange: (e) => {
        const parts = e.target.value.split(':').map(Number);
        let v = 0;
        if (parts.length === 2) v = parts[0] * 60 + parts[1];
        else v = Number(e.target.value) || 0;
        onChange(v);
      },
    });
  }
  function numInput(value, onChange) {
    return h('input', {
      type: 'number', min: 0, max: 30, step: 0.5, value, class: 'text-input num',
      onchange: (e) => onChange(Number(e.target.value) || 0),
    });
  }
}

function newSet(container) {
  Songs.all().then(songs => {
    createPlaylistModal(songs, null, {
      kind: 'set',
      onSaved: (id) => { currentSetId = id; renderEdit(container); },
    });
  });
}

async function addSongsModal(set, container) {
  const songs = await Songs.all();
  const available = songs.filter(s => !set.songIds.includes(s.id));
  openModal('Agregar al set', available.length
    ? h('div', { class: 'menu-list' },
      ...available.map(s => h('button', {
        class: 'menu-item', onclick: async () => {
          set.songIds.push(s.id);
          set.modifiedAt = Date.now();
          await Playlists.update(set);
          closeModal();
          renderEdit(container);
        },
      }, `♫ ${s.name} · ${fmtTime(s.duration)}`)))
    : h('p', { class: 'hint' }, 'Todas tus canciones ya están en el set.'));
}
