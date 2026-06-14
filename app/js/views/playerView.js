// Vista Reproductor (docs/vistas/02-vista-reproductor.md)
// Tool panels render INLINE below the toolbar — no modals, everything
// one touch away. Modals remain only for pickers and confirmations.
import { h, fmtTime, openModal, toast } from '../ui.js';
import { Songs, Markers } from '../db.js';
import { Waveform } from '../waveform.js';
import {
  state, engine, subscribe, togglePlay, stop, next, previous,
  cycleRepeat, queueAdd, queueRemove, queueClear, queueDuration,
} from '../player.js';
import { transposedKey, energyClass } from '../audio/analyzer.js';
import { navigate } from '../app.js';
import { appHeader } from './header.js';

let unsub = null;
let waveform = null;
let activePanel = null; // tone | tempo | markers | queue | more | null — persists across re-renders

export async function renderPlayer(container) {
  if (unsub) unsub();
  container.innerHTML = '';
  const song = state.currentSong;

  if (!song) {
    container.append(
      appHeader({ title: '▶ Reproductor' }),
      h('div', { class: 'empty-state' },
        h('div', { class: 'empty-card' },
          h('p', { class: 'empty-title' }, 'Seleccioná una canción para empezar'),
          h('button', { class: 'btn primary', onclick: () => navigate('library') }, '📂 Ir a la Librería'))));
    return;
  }

  const markers = await Markers.bySong(song.id);

  container.append(appHeader({
    title: state.source ? state.source.name : 'Reproductor',
    backTo: 'home',
  }));

  // --- song card ---
  const adjustLine = h('div', { class: 'song-adjust-line' });
  const cover = song.imageData
    ? h('img', { class: 'cover-img', src: song.imageData, alt: 'Portada' })
    : h('div', { class: 'cover-placeholder' }, '🎵');
  container.append(h('div', { class: 'now-card' },
    cover,
    h('div', { class: 'now-title' }, song.name),
    h('div', { class: 'now-file' }, `${song.fileName}`),
    adjustLine,
    h('div', { class: 'now-bpm' }, song.bpm ? `BPM: ${song.bpm} ${energyClass(song.bpm).icon}` : 'BPM: —'),
  ));

  // --- waveform ---
  const canvas = h('canvas', { class: 'waveform-canvas' });
  const timeLabels = h('div', { class: 'wave-times' },
    h('span', { id: 'wt-cur' }, '0:00'), h('span', { id: 'wt-total' }, fmtTime(song.duration)));
  const markerTip = h('div', { class: 'marker-tip', style: { display: 'none' } });
  container.append(h('div', { class: 'waveform-wrap' }, canvas, markerTip, timeLabels));

  waveform = new Waveform(canvas, { onSeek: (t) => engine.seek(t) });
  waveform.setData({
    peaks: song.peaks, duration: song.duration, markers,
    startAt: song.startAt || 0, endAt: song.endAt || 0,
  });

  // --- transport ---
  const playBtn = h('button', { class: 'btn-transport main', onclick: togglePlay, 'aria-label': 'Play/Pausa' }, engine.isPlaying ? '⏸' : '▶');
  const repeatBtn = h('button', { class: 'btn-transport', onclick: () => { repeatBtn.textContent = repeatLabel(cycleRepeat()); }, 'aria-label': 'Repetir' }, repeatLabel(state.repeat));
  container.append(h('div', { class: 'transport' },
    h('button', { class: 'btn-transport', onclick: previous, 'aria-label': 'Anterior' }, '⏮'),
    h('button', { class: 'btn-transport', onclick: stop, 'aria-label': 'Detener' }, '⏹'),
    playBtn,
    h('button', { class: 'btn-transport', onclick: next, 'aria-label': 'Siguiente' }, '⏭'),
    repeatBtn,
  ));

  // --- volume ---
  const volLabel = h('span', { class: 'vol-label' }, `${song.volume ?? 75}%`);
  container.append(h('div', { class: 'volume-row' },
    h('span', {}, '🔊'),
    h('input', {
      type: 'range', min: 0, max: 100, value: song.volume ?? 75, class: 'slider',
      oninput: async (e) => {
        const v = Number(e.target.value);
        engine.setSongVolume(v);
        volLabel.textContent = `${v}%`;
        await Songs.patch(song.id, { volume: v });
      },
    }),
    volLabel));

  // --- tool bar (toggles inline panels) ---
  const panelHost = h('div', { class: 'panel-host' });
  const toolDefs = [
    ['tone', '🎵 Tono'], ['tempo', '⏱ Tempo'], ['markers', '📌 Marcos'],
    ['queue', '↕ Cola'], ['more', '⚙ Más'],
  ];
  const toolBar = h('div', { class: 'tool-bar' },
    ...toolDefs.map(([key, label]) => h('button', {
      class: `btn tool ${activePanel === key ? 'active' : ''}`,
      onclick: () => {
        activePanel = activePanel === key ? null : key;
        renderToolBar();
        renderActivePanel();
      },
    }, label)));
  container.append(toolBar, panelHost);

  function renderToolBar() {
    toolBar.querySelectorAll('.btn.tool').forEach((btn, i) => {
      btn.classList.toggle('active', activePanel === toolDefs[i][0]);
    });
  }

  function renderActivePanel() {
    panelHost.innerHTML = '';
    if (!activePanel) return;
    const builders = { tone: buildTonePanel, tempo: buildTempoPanel, markers: buildMarkersPanel, queue: buildQueuePanel, more: buildMorePanel };
    panelHost.append(h('div', { class: 'inline-panel' }, builders[activePanel]()));
  }

  function repeatLabel(mode) {
    return mode === 'one' ? '🔁 Una' : mode === 'all' ? '🔁 Todas' : '🔁 No';
  }

  function updateAdjustLine() {
    const p = song.pitch || 0;
    adjustLine.textContent = `Tono: ${p > 0 ? '+' : ''}${p}  |  Tempo: ${song.tempo || 100}%`;
  }
  updateAdjustLine();

  // ---- inline panels ----
  function buildTonePanel() {
    const valueLabel = h('div', { class: 'panel-value' });
    const keyLabel = h('div', { class: 'panel-sub' });
    const slider = h('input', {
      type: 'range', min: -12, max: 12, step: 1, value: song.pitch || 0, class: 'slider',
      oninput: (e) => apply(Number(e.target.value)),
    });
    async function apply(v) {
      v = Math.min(12, Math.max(-12, v));
      engine.setPitch(v);
      song.pitch = v;
      slider.value = v;
      valueLabel.textContent = `${v > 0 ? '+' : ''}${v} st`;
      const orig = song.originalKey;
      keyLabel.textContent = orig ? `${orig} → ${transposedKey(orig, v) || '?'}` : '';
      updateAdjustLine();
      await Songs.patch(song.id, { pitch: v });
    }
    apply(song.pitch || 0);
    return h('div', { class: 'panel' },
      h('div', { class: 'panel-title' }, 'Ajuste de tono'),
      h('div', { class: 'stepper' },
        h('button', { class: 'btn small', onclick: () => apply((song.pitch || 0) - 1) }, '−'),
        slider,
        h('button', { class: 'btn small', onclick: () => apply((song.pitch || 0) + 1) }, '+')),
      valueLabel, keyLabel,
      h('button', { class: 'btn small', onclick: () => apply(0) }, '↺ Restablecer'));
  }

  function buildTempoPanel() {
    const valueLabel = h('div', { class: 'panel-value' });
    const slider = h('input', {
      type: 'range', min: 50, max: 200, step: 1, value: song.tempo || 100, class: 'slider',
      oninput: (e) => apply(Number(e.target.value)),
    });
    const preserveCb = h('input', {
      type: 'checkbox', checked: engine.preservePitch,
      onchange: (e) => { engine.preservePitch = e.target.checked; engine.setTempo(song.tempo || 100); },
    });
    async function apply(v) {
      engine.setTempo(v);
      song.tempo = v;
      slider.value = v;
      valueLabel.textContent = `${v}%`;
      updateAdjustLine();
      await Songs.patch(song.id, { tempo: v });
    }
    apply(song.tempo || 100);
    return h('div', { class: 'panel' },
      h('div', { class: 'panel-title' }, 'Velocidad'),
      h('div', { class: 'stepper' }, h('span', {}, '50%'), slider, h('span', {}, '200%')),
      valueLabel,
      h('label', { class: 'check-row' }, preserveCb, ' Preservar tono'),
      h('button', { class: 'btn small', onclick: () => apply(100) }, '↺ Restablecer'));
  }

  function buildMarkersPanel() {
    const colors = ['verde', 'rojo', 'amarillo', 'azul'];
    const icons = { verde: '🟢', rojo: '🔴', amarillo: '🟡', azul: '🔵' };
    let colorIdx = 0;
    const listEl = h('div', { class: 'menu-list' });
    function renderMarkers() {
      listEl.innerHTML = '';
      markers.sort((a, b) => a.timestamp - b.timestamp);
      for (const m of markers) {
        listEl.append(h('div', { class: 'pick-row' },
          h('span', {}, icons[m.color] || '🟢'),
          h('span', { class: 'pick-name', onclick: () => engine.seek(m.timestamp) },
            `${fmtTime(m.timestamp)}  "${m.text}"`),
          h('button', {
            class: 'btn-icon', onclick: async () => {
              await Markers.remove(m.id);
              markers.splice(markers.indexOf(m), 1);
              renderMarkers();
              waveform.setData({ peaks: song.peaks, duration: song.duration, markers, startAt: song.startAt || 0, endAt: song.endAt || 0 });
            },
          }, '✕')));
      }
      if (!markers.length) listEl.append(h('p', { class: 'hint' }, 'Sin marcadores todavía.'));
    }
    renderMarkers();
    const textInput = h('input', { type: 'text', placeholder: 'Texto del marcador...', class: 'text-input' });
    const colorBtn = h('button', {
      class: 'btn small', onclick: () => {
        colorIdx = (colorIdx + 1) % colors.length;
        colorBtn.textContent = icons[colors[colorIdx]];
      },
    }, icons[colors[0]]);
    return h('div', { class: 'panel' },
      h('div', { class: 'panel-title' }, 'Marcadores'),
      h('div', { class: 'marker-add-row' },
        colorBtn, textInput,
        h('button', {
          class: 'btn primary small', onclick: async () => {
            const text = textInput.value.trim();
            if (!text) { toast('Escribí el texto del marcador'); return; }
            const marker = { songId: song.id, timestamp: engine.currentTime, text, color: colors[colorIdx] };
            marker.id = await Markers.add(marker);
            markers.push(marker);
            textInput.value = '';
            renderMarkers();
            waveform.setData({ peaks: song.peaks, duration: song.duration, markers, startAt: song.startAt || 0, endAt: song.endAt || 0 });
          },
        }, `+ ${fmtTime(engine.currentTime)}`)),
      listEl);
  }

  function buildQueuePanel() {
    const listEl = h('div', { class: 'menu-list' });
    const totals = h('div', { class: 'panel-sub' });
    function renderQueue() {
      listEl.innerHTML = '';
      if (state.queue.length === 0) {
        listEl.append(h('p', { class: 'hint' }, 'Cola vacía. Agregá canciones con +.'));
      }
      state.queue.forEach((s, i) => {
        listEl.append(h('div', { class: 'pick-row' },
          h('span', { class: 'pick-name' }, `${i + 1}. ${s.name}`),
          h('span', { class: 'pick-dur' }, `${fmtTime(s.duration)} · ${s.bpm || '—'} BPM`),
          h('button', { class: 'btn-icon', disabled: i === 0, onclick: () => { state.queue.splice(i, 1); state.queue.splice(i - 1, 0, s); renderQueue(); } }, '↑'),
          h('button', { class: 'btn-icon', onclick: () => { queueRemove(i); renderQueue(); } }, '✕')));
      });
      const qd = queueDuration();
      const cur = state.currentSong ? Math.max(0, engine.duration - engine.currentTime) : 0;
      totals.textContent = `En cola: ${fmtTime(qd)} · Estimado: ${fmtTime(qd + cur)}`;
    }
    renderQueue();
    return h('div', { class: 'panel' },
      h('div', { class: 'panel-title' }, 'Cola (QuouList)'),
      listEl, totals,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn small primary', onclick: () => addFromLibrary(renderQueue) }, '+ Agregar'),
        h('button', { class: 'btn small', onclick: () => { queueClear(); renderQueue(); } }, '✕ Vaciar')));
  }

  function buildMorePanel() {
    const fadeIn = h('input', { type: 'number', min: 0, max: 30, step: 0.5, value: song.fadeIn || 0, class: 'text-input num' });
    const fadeOut = h('input', { type: 'number', min: 0, max: 30, step: 0.5, value: song.fadeOut || 0, class: 'text-input num' });
    const save = async () => {
      song.fadeIn = Number(fadeIn.value) || 0;
      song.fadeOut = Number(fadeOut.value) || 0;
      await Songs.patch(song.id, { fadeIn: song.fadeIn, fadeOut: song.fadeOut });
    };
    fadeIn.addEventListener('change', save);
    fadeOut.addEventListener('change', save);
    return h('div', { class: 'panel' },
      h('div', { class: 'panel-title' }, 'Fades y detalle'),
      h('div', { class: 'adj-row' }, 'FadeIn ', fadeIn, ' FadeOut ', fadeOut),
      song.imageData
        ? h('img', { src: song.imageData, class: 'sheet-img' })
        : h('p', { class: 'hint' }, 'Sin partitura. Cargala desde Librería → ⋮ → Editar info.'),
      h('p', { class: 'panel-sub' },
        `${song.format} · ${song.sampleRate} Hz · ${song.channels === 1 ? 'Mono' : 'Estéreo'} · ${song.playCount || 0} reproducciones`));
  }

  renderActivePanel();

  // --- live updates ---
  unsub = subscribe((event) => {
    if (event === 'time') {
      const t = engine.currentTime;
      waveform.setTime(t);
      container.querySelector('#wt-cur').textContent = fmtTime(t);
      container.querySelector('#wt-total').textContent = `-${fmtTime(Math.max(0, engine.duration - t))}`;
      const near = markers.find(m => Math.abs(m.timestamp - t) < 3);
      if (near) {
        markerTip.style.display = '';
        markerTip.textContent = `📌 ${near.text}`;
      } else markerTip.style.display = 'none';
    } else if (event === 'playstate') {
      playBtn.textContent = engine.isPlaying ? '⏸' : '▶';
    } else if (event === 'songchange' || event === 'error') {
      renderPlayer(container);
    }
  });

  if (state.error) {
    container.append(h('p', { class: 'error-banner' }, state.error));
  }
}

// shared picker: add songs to QuouList from library
export async function addFromLibrary(onDone) {
  const songs = await Songs.all();
  const listEl = h('div', { class: 'menu-list' },
    ...songs.map(s => h('button', {
      class: 'menu-item', onclick: () => {
        queueAdd(s);
        toast(`"${s.name}" en cola`);
        if (onDone) onDone();
      },
    }, `♫ ${s.name} · ${fmtTime(s.duration)} · ${s.bpm || '—'} BPM`)));
  openModal('Agregar a la cola', songs.length ? listEl : h('p', { class: 'hint' }, 'No hay canciones en la librería.'));
}
