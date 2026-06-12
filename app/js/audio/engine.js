// Playback engine (docs/componentes/01-audio-engine, 02-pitch-shifter,
// 03-time-stretcher, 05-fade-engine).
//
// Graph: <audio> element -> MediaElementSource -> [dry | Jungle pitch] -> songGain -> masterGain -> out
//  - Tempo: audio.playbackRate with preservesPitch = true (native time-stretch)
//  - Pitch: Jungle dual-delay granular shifter (independent of tempo)
//  - Fades: songGain automation

import { Jungle } from './jungle.js';

export class AudioEngine extends EventTarget {
  constructor() {
    super();
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.ctx = null;
    this.currentSong = null;
    this.currentUrl = null;
    this.preservePitch = true;
    this._fadeOutScheduled = false;
    this._endTimer = null;

    this.audio.addEventListener('timeupdate', () => this._onTimeUpdate());
    this.audio.addEventListener('ended', () => this._emit('ended'));
    this.audio.addEventListener('play', () => this._emit('play'));
    this.audio.addEventListener('pause', () => this._emit('pause'));
    this.audio.addEventListener('error', () => this._emit('error'));
  }

  _ensureGraph() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.sourceNode = this.ctx.createMediaElementSource(this.audio);
    this.dryGain = this.ctx.createGain();
    this.jungle = new Jungle(this.ctx);
    this.wetGain = this.ctx.createGain();
    this.songGain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();

    this.sourceNode.connect(this.dryGain);
    this.dryGain.connect(this.songGain);
    this.sourceNode.connect(this.jungle.input);
    this.jungle.output.connect(this.wetGain);
    this.wetGain.connect(this.songGain);
    this.songGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.wetGain.gain.value = 0; // dry by default (pitch 0)
    this.dryGain.gain.value = 1;
  }

  _emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // Load a song object + its audio Blob. Applies stored adjustments.
  async load(song, blob) {
    this._ensureGraph();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
    this.currentSong = song;
    this.currentUrl = URL.createObjectURL(blob);
    this.audio.src = this.currentUrl;
    this._fadeOutScheduled = false;

    this.setTempo(song.tempo ?? 100);
    this.setPitch(song.pitch ?? 0);
    this.setSongVolume(song.volume ?? 75);
    this.audio.currentTime = song.startAt ?? 0;
    this._emit('songchange', { song });
  }

  async play() {
    if (!this.currentSong) return;
    this._ensureGraph();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const song = this.currentSong;
    if ((song.fadeIn ?? 0) > 0 && this.audio.currentTime <= (song.startAt ?? 0) + 0.1) {
      this._fade(0, this._songGainTarget(), song.fadeIn);
    } else {
      this.songGain.gain.setValueAtTime(this._songGainTarget(), this.ctx.currentTime);
    }
    await this.audio.play();
  }

  pause() { this.audio.pause(); }

  stop() {
    this.audio.pause();
    if (this.currentSong) this.audio.currentTime = this.currentSong.startAt ?? 0;
    this._fadeOutScheduled = false;
    this._emit('stopped');
  }

  get isPlaying() { return !this.audio.paused && !this.audio.ended; }
  get currentTime() { return this.audio.currentTime; }
  get duration() { return this.audio.duration || (this.currentSong ? this.currentSong.duration : 0); }

  seek(seconds) {
    const song = this.currentSong;
    if (!song) return;
    const start = song.startAt ?? 0;
    const end = song.endAt ?? this.duration;
    this.audio.currentTime = Math.min(Math.max(seconds, start), end);
    this._fadeOutScheduled = false;
  }

  // Tempo 50..200 (%) — preserves pitch natively
  setTempo(pct) {
    const rate = Math.min(200, Math.max(50, pct)) / 100;
    this.audio.preservesPitch = this.preservePitch;
    if ('mozPreservesPitch' in this.audio) this.audio.mozPreservesPitch = this.preservePitch;
    this.audio.playbackRate = rate;
    if (this.currentSong) this.currentSong.tempo = pct;
  }

  // Pitch -12..+12 semitones — independent of tempo
  setPitch(semitones) {
    this._ensureGraph();
    const st = Math.min(12, Math.max(-12, semitones));
    if (st === 0) {
      this.dryGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    } else {
      this.jungle.setPitchOffset(st);
      this.dryGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.02);
    }
    if (this.currentSong) this.currentSong.pitch = st;
  }

  // Song volume 0..100
  setSongVolume(vol) {
    this._ensureGraph();
    if (this.currentSong) this.currentSong.volume = vol;
    if (!this.isPlaying || !this._fadeOutScheduled) {
      this.songGain.gain.setTargetAtTime(this._songGainTarget(), this.ctx.currentTime, 0.02);
    }
  }

  // Master volume 0..100
  setMasterVolume(vol) {
    this._ensureGraph();
    this.masterGain.gain.setTargetAtTime(Math.min(100, Math.max(0, vol)) / 100, this.ctx.currentTime, 0.02);
  }

  _songGainTarget() {
    return ((this.currentSong && this.currentSong.volume) ?? 75) / 100;
  }

  _fade(from, to, seconds) {
    const g = this.songGain.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(from, this.ctx.currentTime);
    g.linearRampToValueAtTime(to, this.ctx.currentTime + seconds);
  }

  _onTimeUpdate() {
    const song = this.currentSong;
    if (!song) return;
    const t = this.audio.currentTime;
    const end = song.endAt && song.endAt > 0 ? Math.min(song.endAt, this.duration) : this.duration;
    const fadeOut = song.fadeOut ?? 0;

    if (fadeOut > 0 && !this._fadeOutScheduled && t >= end - fadeOut) {
      this._fadeOutScheduled = true;
      this._fade(this._songGainTarget(), 0, Math.max(0.05, end - t));
    }
    if (t >= end - 0.05 && end < this.duration - 0.1) {
      // custom end reached: behave like natural end
      this.audio.pause();
      this._emit('ended');
    }
    this._emit('timeupdate', { time: t, duration: this.duration });
  }
}

export const engine = new AudioEngine();
