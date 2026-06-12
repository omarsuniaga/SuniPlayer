// Vista Perfil — configuración y estadísticas (docs/vistas/06-vista-perfil.md)
import { h, fmtBytes, confirmModal, toast } from '../ui.js';
import { Songs, Config, ShowHistory, AudioCache } from '../db.js';
import { engine } from '../player.js';
import { navigate, applyTheme } from '../app.js';
import { appHeader } from './header.js';

function fmtHours(seconds) {
  const hr = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${hr}h ${m}m`;
}

export async function renderProfile(container) {
  const [songs, shows, theme, masterVol, totalListen, cacheSize, cacheCount] = await Promise.all([
    Songs.all(), ShowHistory.all(), Config.get('theme', 'dark'),
    Config.get('masterVolume', 75), Config.get('totalListenSeconds', 0),
    AudioCache.size(), AudioCache.count(),
  ]);
  const resumeOnOpen = await Config.get('resumeOnOpen', true);
  const autoplay = await Config.get('autoplay', false);

  container.innerHTML = '';
  container.append(appHeader({ title: '⚙️ Configuración', backTo: 'home' }));

  // --- theme ---
  const themeBtn = (value, label) => h('button', {
    class: `btn ${theme === value ? 'primary' : ''}`,
    onclick: async () => {
      await Config.set('theme', value);
      applyTheme(value);
      renderProfile(container);
    },
  }, label);
  container.append(section('Tema',
    h('div', { class: 'btn-row' },
      themeBtn('dark', '🌙 Oscuro'), themeBtn('light', '☀️ Claro'), themeBtn('system', '🔄 Seguir sistema'))));

  // --- sound ---
  const volLabel = h('span', { class: 'vol-label' }, `${masterVol}%`);
  container.append(section('Sonido',
    h('div', { class: 'volume-row' },
      h('span', {}, 'Volumen global'),
      h('input', {
        type: 'range', min: 0, max: 100, value: masterVol, class: 'slider',
        oninput: async (e) => {
          const v = Number(e.target.value);
          volLabel.textContent = `${v}%`;
          engine.setMasterVolume(v);
          await Config.set('masterVolume', v);
        },
      }), volLabel)));

  // --- playback ---
  const checkRow = (label, value, key) => h('label', { class: 'check-row' },
    h('input', {
      type: 'checkbox', checked: value,
      onchange: (e) => Config.set(key, e.target.checked),
    }), ` ${label}`);
  container.append(section('Reproducción',
    h('div', {},
      checkRow('Reanudar al abrir la app', resumeOnOpen, 'resumeOnOpen'),
      checkRow('Reproducción automática', autoplay, 'autoplay'),
      h('label', { class: 'check-row' },
        h('input', {
          type: 'checkbox', checked: engine.preservePitch,
          onchange: (e) => { engine.preservePitch = e.target.checked; },
        }), ' Preservar tono al cambiar velocidad'))));

  // --- storage ---
  container.append(section('Almacenamiento',
    h('div', { class: 'stat-card' },
      h('p', {}, `💾 Espacio usado: ${fmtBytes(cacheSize)}`),
      h('p', {}, `📦 Canciones guardadas: ${cacheCount} de ${songs.length}`),
      h('button', {
        class: 'btn', onclick: async () => {
          const ok = await confirmModal('¿Eliminar las copias cacheadas?',
            'Las canciones que pierdan su copia no podrán reproducirse hasta reimportarlas. ¿Continuar?', 'Eliminar cache');
          if (ok) {
            await AudioCache.clear();
            for (const s of songs) await Songs.patch(s.id, { cached: false });
            toast('Cache eliminada');
            renderProfile(container);
          }
        },
      }, '🧹 Limpiar cache'))));

  // --- stats ---
  const totalShowSec = shows.reduce((a, s) => a + (s.duration || 0), 0);
  const topSong = songs.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0];
  const analyzed = songs.filter(s => s.bpm);
  const avgBpm = analyzed.length ? Math.round(analyzed.reduce((a, s) => a + s.bpm, 0) / analyzed.length) : null;
  container.append(section('Estadísticas',
    h('div', { class: 'stat-card' },
      h('p', {}, `⏱ Tiempo total escuchado: ${fmtHours(totalListen)}`),
      h('p', {}, `🎤 Shows realizados: ${shows.length}`),
      h('p', {}, `🕐 Tiempo en shows: ${fmtHours(totalShowSec)}`),
      topSong && topSong.playCount ? h('p', {}, `♫ Más reproducida: ${topSong.name} (${topSong.playCount}x)`) : null,
      avgBpm ? h('p', {}, `📊 BPM promedio: ${avgBpm} BPM`) : null,
      h('button', {
        class: 'btn', onclick: () => {
          // anonymous export: no song names, no file paths
          const data = {
            songCount: songs.length,
            totalListenSeconds: totalListen,
            showCount: shows.length,
            totalShowSeconds: totalShowSec,
            avgBpm,
            exportedAt: new Date().toISOString(),
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'suniplayer-stats.json';
          a.click();
        },
      }, '📤 Exportar estadísticas anónimas'))));

  // --- about ---
  container.append(section('Acerca de',
    h('p', { class: 'hint' }, 'Suniplayer v1.0.0 (MVP) — Todo se guarda en tu dispositivo. Sin cloud, sin tracking.')));

  function section(title, body) {
    return h('section', { class: 'profile-section' },
      h('h2', { class: 'section-title' }, title), body);
  }
}
