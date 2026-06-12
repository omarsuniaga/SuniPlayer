// Vista Show — presentación en vivo (docs/vistas/04-vista-show.md)
import { h, fmtTime, openModal, toast } from '../ui.js';
import {
  state, engine, subscribe, togglePlay, next, previous,
  queueRemove, queueDuration, endShow,
} from '../player.js';
import { addFromLibrary } from './playerView.js';
import { navigate } from '../app.js';

let unsub = null;
let tick = null;

export function renderShow(container) {
  if (unsub) unsub();
  if (tick) clearInterval(tick);
  container.innerHTML = '';

  if (!state.show.active) {
    container.append(h('div', { class: 'empty-state' },
      h('div', { class: 'empty-card' },
        h('p', { class: 'empty-title' }, 'No hay show activo'),
        h('p', {}, 'Prepará un set primero desde la vista Edit.'),
        h('button', { class: 'btn primary', onclick: () => navigate('edit') }, '✏️ Ir a Edit'))));
    return;
  }

  document.body.classList.add('show-mode');

  container.append(h('header', { class: 'view-header show-header' },
    h('span', { class: 'live-badge' }, '🔴 EN VIVO'),
    h('span', { class: 'show-name' }, `SHOW: ${state.show.setName}`)));

  // --- chronometer ---
  const elapsedEl = h('div', { class: 'chrono-main' }, '00:00');
  const queueTimeEl = h('div', { class: 'chrono-sub' }, '+ Cola: 0:00');
  const totalEl = h('div', { class: 'chrono-sub' }, '= Total: 0:00');
  container.append(h('div', { class: 'chrono-card' }, h('span', { class: 'chrono-icon' }, '⏱'), elapsedEl, queueTimeEl, totalEl));

  // --- now playing ---
  const nowName = h('div', { class: 'now-title' }, '—');
  const nowAdjust = h('div', { class: 'song-adjust-line' }, '');
  const progressFill = h('div', { class: 'progress-fill' });
  const nowTime = h('div', { class: 'show-time' }, '0:00 / 0:00');
  container.append(h('div', { class: 'show-now-card' },
    h('h2', { class: 'section-title' }, 'Ahora suena'),
    nowName, nowAdjust,
    h('div', { class: 'progress-track big' }, progressFill),
    nowTime));

  // --- QuouList ---
  const queueEl = h('div', { class: 'menu-list' });
  const queueTotal = h('div', { class: 'panel-sub' });
  container.append(h('div', { class: 'show-queue-card' },
    h('h2', { class: 'section-title' }, 'Siguientes (QuouList activa)'),
    queueEl, queueTotal,
    h('button', { class: 'btn', onclick: () => addFromLibrary(renderQueue) }, '+ Agregar desde librería...')));

  // --- transport ---
  const playBtn = h('button', { class: 'btn-transport main', onclick: togglePlay }, engine.isPlaying ? '⏸' : '▶');
  const remainEl = h('div', { class: 'show-remaining' }, '');
  container.append(h('div', { class: 'transport show-transport' },
    h('button', { class: 'btn-transport', onclick: previous }, '⏮'),
    h('button', { class: 'btn-transport danger', onclick: confirmEndShow }, '⏹'),
    playBtn,
    h('button', { class: 'btn-transport', onclick: next }, '⏭'),
  ), remainEl);

  function renderQueue() {
    queueEl.innerHTML = '';
    if (state.queue.length === 0) {
      queueEl.append(h('p', { class: 'hint' }, 'Cola vacía. Tocá + para agregar canciones'));
    }
    state.queue.forEach((s, i) => {
      queueEl.append(h('div', { class: 'pick-row' },
        h('span', { class: 'pick-name' }, `${i + 1}. ${s.name}`),
        h('span', { class: 'pick-dur' }, `${fmtTime(s.duration)} · BPM ${s.bpm || '—'} · Tono: ${(s.pitch || 0) > 0 ? '+' : ''}${s.pitch || 0}`),
        h('button', { class: 'btn-icon', onclick: () => { queueRemove(i); renderQueue(); } }, '✕')));
    });
    queueTotal.textContent = `Tiempo en cola: ${fmtTime(queueDuration())}`;
  }

  function renderNow() {
    const song = state.currentSong;
    if (!song) { nowName.textContent = '—'; return; }
    nowName.textContent = `♫ ${song.name}`;
    nowAdjust.textContent = `Tono: ${(song.pitch || 0) > 0 ? '+' : ''}${song.pitch || 0}  |  Tempo: ${song.tempo || 100}%`;
  }

  function updateChrono() {
    const elapsed = Math.floor((Date.now() - state.show.startedAt) / 1000);
    const qd = queueDuration();
    elapsedEl.textContent = fmtTime(elapsed);
    queueTimeEl.textContent = `+ Cola: ${fmtTime(qd)}`;
    totalEl.textContent = `= Total: ${fmtTime(elapsed + qd)}`;
    // remaining time of set
    if (state.source && state.source.songIds) {
      const remainingIds = state.source.songIds.slice(state.sourceIndex + 1);
      remainEl.textContent = `Tiempo restante del set: ${remainingIds.length} canciones en espera`;
    }
  }

  tick = setInterval(updateChrono, 1000);
  updateChrono();
  renderNow();
  renderQueue();

  unsub = subscribe((event) => {
    if (event === 'time') {
      const ratio = engine.duration ? engine.currentTime / engine.duration : 0;
      progressFill.style.width = `${ratio * 100}%`;
      nowTime.textContent = `${fmtTime(engine.currentTime)} / ${fmtTime(engine.duration)}`;
    } else if (event === 'playstate') {
      playBtn.textContent = engine.isPlaying ? '⏸' : '▶';
    } else if (event === 'songchange') {
      renderNow();
      renderQueue();
    } else if (event === 'queue') {
      renderQueue();
    } else if (event === 'setdone') {
      toast('Set completado. ¿Terminar show o agregar más canciones?');
    }
  });

  function confirmEndShow() {
    const elapsed = Math.floor((Date.now() - state.show.startedAt) / 1000);
    openModal('¿Terminar el show?', h('div', { class: 'panel' },
      h('p', {}, `Tiempo total: ${fmtTime(elapsed)}`),
      h('p', {}, `Canciones: ${state.show.songsPlayed}`),
      h('p', {}, `Cola agregada: ${state.show.queueAdded}`)), [
      { label: 'Seguir show' },
      {
        label: 'Terminar Show', kind: 'danger', onClick: async () => {
          if (tick) clearInterval(tick);
          document.body.classList.remove('show-mode');
          await endShow();
          toast('Show guardado en el historial 🎉');
          navigate('home');
        },
      },
    ]);
  }
}

export function cleanupShow() {
  if (tick) clearInterval(tick);
  document.body.classList.remove('show-mode');
}
