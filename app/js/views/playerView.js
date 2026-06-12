// Vista Reproductor (docs/vistas/02-vista-reproductor.md)
import { h, fmtTime, openModal, closeModal, toast } from '../ui.js';
import { Songs, Markers } from '../db.js';
import { Waveform } from '../waveform.js';
import {
  state, engine, subscribe, togglePlay, stop, next, previous,
  cycleRepeat, queueAdd, queueRemove, queueClear, queueDuration,
} from '../player.js';
import { transposedKey, energyClass } from '../audio/analyzer.js';
import { navigate } from '../app.js';

let unsub = null;
let waveform = null;

export async function renderPlayer(container) {
  if (unsub) unsub();
  container.innerHTML = '';
  const song = state.currentSong;

  if (!song) {
    container.append(
      h('header', { class: 'view-header' }, h('h1', {}, '▶ Reproductor')),
      h('div', { class: 'empty-state' },
        h('div', { class: 'empty-card' },
          h('p', { class: 'empty-title' }, 'Seleccioná una canción para empezar'),
          h('button', { class: 'btn primary', onclick: () => navigate('library') }, '📂 Ir a la Librería'))));
    return;
  }

  const markers = await Markers.bySong(song.id);

  // --- header ---
  const sourceLabel = state.source ? `Desde: ${state.source.name}` : '';
  container.append(h('header', { class: 'view-header' },
    h('button', { class: 'btn-icon', onclick: () => navigate('home'), 'aria-label': 'Volver' }, '←'),
    h('div', { class: 'header-context' }, sourceLabel),
    state.show.active ? h('span', { class: 'live-badge' }, '🔴 SHOW') : h('span', {}, ''),
  ));

  // --- song card ---
  const adjustLine = h('div', { class: 'song-adjust-line' });
  const cover = song.imageData
    ? h('img', { class: 'cover-img', src: song.imageData, alt: 'Portada' })
    : h('div', { class: 'cover-placeholder' }, '🎵');
  container.append(h('div', { class: 'now-card' },
    cover,
    h('div', { class: 'now-title' }, song.name),
    h('div', { class: 'now-file' }, `Archivo: ${song.fileName}`),
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

  // --- transport controls ---
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

  // --- tool buttons ---
  container.append(h('div', { class: 'tool-bar' },
    h('button', { class: 'btn tool', onclick: () => tonePanel(song) }, '🎵 Tono'),
    h('button', { class: 'btn tool', onclick: () => tempoPanel(song) }, '⏱ Tempo'),
    h('button', { class: 'btn tool', onclick: () => markersPanel(song, container) }, '📌 Marcos'),
    h('button', { class: 'btn tool', onclick: () => queuePanel(container) }, '↕ Cola'),
    h('button', { class: 'btn tool', onclick: () => morePanel(song) }, '⚙ Más'),
  ));

  function repeatLabel(mode) {
    return mode === 'one' ? '🔁 Una' : mode === 'all' ? '🔁 Todas' : '🔁 No';
  }

  function updateAdjustLine() {
    const p = song.pitch || 0;
    adjustLine.textContent = `Tono: ${p > 0 ? '+' : ''}${p}  |  Tempo: ${song.tempo || 100}%`;
  }
  updateAdjustLine();

  // --- live updates ---
  unsub = subscribe((event) => {
    if (event === 'time') {
      const t = engine.currentTime;
      waveform.setTime(t);
      container.querySelector('#wt-cur').textContent = fmtTime(t);
      container.querySelector('#wt-total').textContent = `-${fmtTime(Math.max(0, engine.duration - t))}`;
      // marker proximity tooltip (±3s)
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

  // ---- Panels ----
  function tonePanel(song) {
    const valueLabel = h('div', { class: 'panel-value' });
    const keyLabel = h('div', { class: 'panel-sub' });
    const slider = h('input', {
      type: 'range', min: -12, max: 12, step: 1, value: song.pitch || 0, class: 'slider',
      oninput: (e) => apply(Number(e.target.value)),
    });
    async function apply(v) {
      engine.setPitch(v);
      song.pitch = v;
      slider.value = v;
      valueLabel.textContent = `Ajuste: ${v > 0 ? '+' : ''}${v} semitonos`;
      const orig = song.originalKey;
      keyLabel.textContent = orig ? `${orig} → ${transposedKey(orig, v) || '?'}` : '';
      updateAdjustLine();
      await Songs.patch(song.id, { pitch: v });
    }
    apply(song.pitch || 0);
    openModal('Ajuste de Tono', h('div', { class: 'panel' },
      h('p', { class: 'panel-sub' }, `Canción: ${song.name}${song.originalKey ? ` · Tono original: ${song.originalKey}` : ''}`),
      h('div', { class: 'stepper' },
        h('button', { class: 'btn small', onclick: () => apply(-12) }, '-12'),
        h('button', { class: 'btn small', onclick: () => apply((song.pitch || 0) - 1) }, '−'),
        slider,
        h('button', { class: 'btn small', onclick: () => apply((song.pitch || 0) + 1) }, '+'),
        h('button', { class: 'btn small', onclick: () => apply(12) }, '+12')),
      valueLabel, keyLabel,
    ), [
      { label: '↺ Restablecer', close: false, onClick: () => apply(0) },
      { label: '✓ Listo', kind: 'primary' },
    ]);
  }

  function tempoPanel(song) {
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
      valueLabel.textContent = `Velocidad: ${v}%`;
      updateAdjustLine();
      await Songs.patch(song.id, { tempo: v });
    }
    apply(song.tempo || 100);
    openModal('Ajuste de Velocidad', h('div', { class: 'panel' },
      valueLabel,
      h('div', { class: 'stepper' }, h('span', {}, '50%'), slider, h('span', {}, '200%')),
      h('label', { class: 'check-row' }, preserveCb, ' Preservar tono (el tono no cambia)'),
    ), [
      { label: '↺ Restablecer', close: false, onClick: () => apply(100) },
      { label: '✓ Listo', kind: 'primary' },
    ]);
  }

  async function markersPanel(song, container) {
    const current = await Markers.bySong(song.id);
    const colors = ['verde', 'rojo', 'amarillo', 'azul'];
    const icons = { verde: '🟢', rojo: '🔴', amarillo: '🟡', azul: '🔵' };
    let colorIdx = 0;
    const listEl = h('div', { class: 'menu-list' });
    function renderMarkers() {
      listEl.innerHTML = '';
      current.sort((a, b) => a.timestamp - b.timestamp);
      for (const m of current) {
        listEl.append(h('div', { class: 'pick-row' },
          h('span', {}, icons[m.color] || '🟢'),
          h('span', { class: 'pick-name', onclick: () => { engine.seek(m.timestamp); closeModal(); } },
            `${fmtTime(m.timestamp)}  "${m.text}"`),
          h('button', {
            class: 'btn-icon', onclick: async () => {
              await Markers.remove(m.id);
              current.splice(current.indexOf(m), 1);
              renderMarkers();
              renderPlayer(container);
            },
          }, '✕')));
      }
      listEl.append(h('p', { class: 'hint' }, `Total: ${current.length} marcadores`));
    }
    renderMarkers();
    const textInput = h('input', { type: 'text', placeholder: 'Texto del marcador...', class: 'text-input' });
    const colorBtn = h('button', {
      class: 'btn small', onclick: () => {
        colorIdx = (colorIdx + 1) % colors.length;
        colorBtn.textContent = icons[colors[colorIdx]];
      },
    }, icons[colors[0]]);
    openModal('Marcadores', h('div', {},
      h('div', { class: 'marker-add-row' },
        colorBtn, textInput,
        h('button', {
          class: 'btn primary small', onclick: async () => {
            const text = textInput.value.trim();
            if (!text) { toast('Escribí el texto del marcador'); return; }
            const marker = { songId: song.id, timestamp: engine.currentTime, text, color: colors[colorIdx] };
            marker.id = await Markers.add(marker);
            current.push(marker);
            textInput.value = '';
            renderMarkers();
            renderPlayer(container);
          },
        }, `+ en ${fmtTime(engine.currentTime)}`)),
      listEl));
  }

  function queuePanel(container) {
    const listEl = h('div', { class: 'menu-list' });
    const totals = h('div', { class: 'panel-sub' });
    function renderQueue() {
      listEl.innerHTML = '';
      if (state.queue.length === 0) {
        listEl.append(h('p', { class: 'hint' }, 'Cola vacía. Agregá canciones desde la librería.'));
      }
      state.queue.forEach((s, i) => {
        listEl.append(h('div', { class: 'pick-row' },
          h('span', { class: 'pick-name' }, `${i + 1}. ${s.name}`),
          h('span', { class: 'pick-dur' }, `${fmtTime(s.duration)} · BPM ${s.bpm || '—'}`),
          h('button', { class: 'btn-icon', disabled: i === 0, onclick: () => { state.queue.splice(i, 1); state.queue.splice(i - 1, 0, s); renderQueue(); } }, '↑'),
          h('button', { class: 'btn-icon', onclick: () => { queueRemove(i); renderQueue(); } }, '✕')));
      });
      const qd = queueDuration();
      const cur = state.currentSong ? Math.max(0, engine.duration - engine.currentTime) : 0;
      totals.textContent = `Tiempo total en cola: ${fmtTime(qd)} · Estimado: ${fmtTime(qd + cur)}`;
    }
    renderQueue();
    openModal('Cola (QuouList)', h('div', {},
      state.currentSong ? h('p', { class: 'panel-sub' }, `🔊 AHORA: ${state.currentSong.name} (${fmtTime(state.currentSong.duration)})`) : null,
      listEl, totals), [
      { label: '+ Desde librería', close: false, onClick: () => addFromLibrary(renderQueue) },
      { label: '✕ Vaciar cola', close: false, onClick: () => { queueClear(); renderQueue(); } },
      { label: 'Cerrar' },
    ]);
  }

  function morePanel(song) {
    const item = (label, fn) => h('button', { class: 'menu-item', onclick: fn }, label);
    openModal('Más opciones', h('div', { class: 'menu-list' },
      item('🌅 Fade In/Out', () => { closeModal(); fadePanel(song); }),
      item('📂 Ver partitura/imagen', () => {
        closeModal();
        if (song.imageData) openModal(song.name, h('img', { src: song.imageData, class: 'sheet-img' }));
        else toast('Esta canción no tiene partitura. Cargala desde Librería → Editar info.');
      }),
      item('ℹ️ Info del archivo', () => {
        closeModal();
        openModal('Info', h('div', { class: 'panel' },
          h('p', {}, `Archivo: ${song.fileName}`),
          h('p', {}, `Formato: ${song.format} · ${song.sampleRate} Hz · ${song.channels === 1 ? 'Mono' : 'Estéreo'}`),
          h('p', {}, `Duración: ${fmtTime(song.duration)} · BPM: ${song.bpm || '—'} · Tono: ${song.originalKey || '—'}`),
          h('p', {}, `Reproducciones: ${song.playCount || 0}`)));
      }),
    ));
  }

  function fadePanel(song) {
    const fadeIn = h('input', { type: 'number', min: 0, max: 30, step: 0.5, value: song.fadeIn || 0, class: 'text-input num' });
    const fadeOut = h('input', { type: 'number', min: 0, max: 30, step: 0.5, value: song.fadeOut || 0, class: 'text-input num' });
    openModal('Fade In / Fade Out', h('div', { class: 'panel' },
      h('label', { class: 'field-label' }, 'FadeIn (segundos al inicio)'), fadeIn,
      h('label', { class: 'field-label' }, 'FadeOut (segundos al final)'), fadeOut), [
      { label: 'Cancelar' },
      {
        label: 'Guardar', kind: 'primary', onClick: async () => {
          song.fadeIn = Number(fadeIn.value) || 0;
          song.fadeOut = Number(fadeOut.value) || 0;
          await Songs.patch(song.id, { fadeIn: song.fadeIn, fadeOut: song.fadeOut });
          toast('Fades guardados');
        },
      },
    ]);
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
    }, `♫ ${s.name} · ${fmtTime(s.duration)} · BPM ${s.bpm || '—'}`)));
  openModal('Agregar a la cola', songs.length ? listEl : h('p', { class: 'hint' }, 'No hay canciones en la librería.'));
}
