# 🎵 Audio Files Directory

Place your MP3/WAV/OGG audio files here to enable real audio playback in SuniPlayer.

## Naming Convention

Files must match the `file_path` field defined in `src/data/constants.ts`.

Example:
```
public/audio/Sinatra - My Way.mp3
public/audio/Bocelli - Besame Mucho.mp3
```

## Supported Formats
- MP3 (recommended)
- WAV
- OGG
- M4A / AAC

## How It Works

SuniPlayer's Audio Engine (`src/services/useAudio.ts`) tries to load files from this directory.
If a file is not found, it automatically falls back to **simulation mode** — the UI timer and
waveform still work, but no actual audio plays.

This allows you to prototype your setlists even without audio files available.

## Adding Tracks

1. Copy your MP3 files here.
2. Update `src/data/constants.ts` to add/modify track entries with matching `file_path`.
3. The player will automatically pick them up on next page load.
