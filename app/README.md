# Suniplayer — MVP

Audio player PWA for musicians, singers and performers. Vanilla ES modules, no build step.

## Run

Any static server works:

```bash
npx serve -l 4173 app
# open http://localhost:4173
```

Audio import, playback, pitch/tempo and persistence require a browser context (Chrome/Edge recommended). Everything is stored locally in IndexedDB — no cloud, works offline after first load (service worker).

## Features (per docs/)

- **Import & analysis**: mp3/wav/ogg/flac/m4a → duration, waveform peaks, BPM, energy class, key estimate. Files are cached in IndexedDB so playback never depends on the filesystem.
- **Player**: waveform with seek, markers with colored pins and proximity tooltips, play/pause/stop/prev/next, repeat modes, per-song volume.
- **Pitch shift** (−12..+12 semitones, independent of speed — dual delay-line granular shifter).
- **Tempo** (50%–200%, preserves pitch via native time-stretch; toggleable).
- **Fades**: per-song fade in/out honored by the engine; transition presets in Edit (corte seco / desvanecer / fundido encadenado).
- **Collections**: Playlists, Sets, QuouList (in-memory live queue), Smart Collections (BPM curves: lineal/curva/exponencial + Más Reproducidas).
- **Modes**: Escucha / Edit (set prep, trims, transitions, time budget) / Show (locked navigation, big chronometer with `elapsed + queue = total`, wake lock, show history).
- **Profile**: dark/light/system theme, master volume, storage management, local stats, anonymous JSON export.

## Structure

```
app/
  index.html            shell + bottom nav + mini player
  css/styles.css        theme (CSS variables, dark/light)
  sw.js                 offline cache
  js/
    db.js               IndexedDB layer (songs, markers, playlists, history, config, audio blobs)
    importer.js         import pipeline (decode → analyze → persist)
    player.js           playback orchestration, QuouList, modes, show lifecycle
    collections.js      smart collection generator
    waveform.js         canvas waveform renderer
    audio/engine.js     Web Audio graph (media element → pitch → gains)
    audio/jungle.js     pitch shifter
    audio/analyzer.js   BPM / key / peaks / energy
    views/              home, library, playerView, edit, show, profile
```
