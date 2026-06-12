// Playback engine (docs/componentes/01-audio-engine, 02-pitch-shifter,
// 03-time-stretcher, 05-fade-engine).
//
// Primary mode ("worklet"): signalsmith-stretch (WASM AudioWorklet) —
// true independent pitch shift (-12..+12 st) and time-stretch (50%..200%).
// AudioWorklet requires a secure context (HTTPS or localhost). When it is
// unavailable (e.g. opening the app over plain http on a phone), the engine
// degrades to "buffer" mode: AudioBufferSourceNode playback where pitch and
// tempo are coupled (vinyl-style) — playback never fails.
//
// Graph: [stretch node | buffer source] -> songGain -> masterGain -> out

import SignalsmithStretch from '../vendor/signalsmith-stretch.mjs';

export class AudioEngine extends EventTarget {
  constructor() {
    super();
    this.ctx = null;
    this.stretch = null;
    this.currentSong = null;
    this.preservePitch = true;
    this.mode = 'worklet'; // worklet | buffer (compat)
    this._buffer = null;
    this._source = null;       // buffer mode
    this._srcAnchorPos = 0;    // buffer mode position tracking
    this._srcAnchorTime = 0;
    this._tickTimer = null;
    this._status = 'idle'; // idle | loading | playing | paused
    this._position = 0;
    this._duration = 0;
    this._tempoPct = 100;
    this._pitch = 0;
    this._fadeOutScheduled = false;
  }

  _ensureGraph() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.songGain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();
    this.songGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  _emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // Load a song object + its audio Blob. Applies stored adjustments.
  async load(song, blob) {
    this._ensureGraph();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this._status = 'loading';
    this._stopBufferSource();

    if (this.stretch) {
      try { this.stretch.stop(); this.stretch.disconnect(); } catch { }
      this.stretch = null;
    }

    const arrayBuffer = await blob.arrayBuffer();
    let buffer;
    try {
      buffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      throw new Error('decode-failed');
    }
    this._buffer = buffer;

    // pick engine mode: worklet needs a secure context
    this.mode = 'buffer';
    if (window.isSecureContext && this.ctx.audioWorklet) {
      try {
        const channels = [];
        for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
        this.stretch = await SignalsmithStretch(this.ctx, {
          outputChannelCount: [buffer.numberOfChannels],
        });
        await this.stretch.addBuffers(channels);
        this.stretch.connect(this.songGain);
        this.stretch.setUpdateInterval(0.05, (inputTime) => this._progress(inputTime));
        this.mode = 'worklet';
      } catch (err) {
        console.warn('signalsmith-stretch unavailable, using buffer mode:', err);
        this.stretch = null;
        this.mode = 'buffer';
      }
    }

    this.currentSong = song;
    this._duration = buffer.duration;
    this._tempoPct = song.tempo ?? 100;
    this._pitch = song.pitch ?? 0;
    this._position = song.startAt ?? 0;
    this._fadeOutScheduled = false;
    this.setSongVolume(song.volume ?? 75);

    this._status = 'idle';
    if (this.mode === 'buffer') this._emit('compat');
    this._emit('songchange', { song });
  }

  // shared progress handler: custom end, fade-out, timeupdate
  _progress(inputTime) {
    if (this._status !== 'playing') return;
    this._position = inputTime;
    const cur = this.currentSong;
    const end = cur && cur.endAt > 0 ? Math.min(cur.endAt, this._duration) : this._duration;
    const fadeOut = (cur && cur.fadeOut) || 0;

    if (fadeOut > 0 && !this._fadeOutScheduled && inputTime >= end - fadeOut) {
      this._fadeOutScheduled = true;
      this._fade(this._songGainTarget(), 0, Math.max(0.05, end - inputTime));
    }
    if (inputTime >= end - 0.03) {
      this._deactivate();
      this._status = 'idle';
      this._position = cur ? (cur.startAt ?? 0) : 0;
      this._emit('pause');
      this._emit('ended');
      return;
    }
    this._emit('timeupdate', { time: inputTime, duration: this._duration });
  }

  _rate() { return Math.min(200, Math.max(50, this._tempoPct)) / 100; }

  // worklet mode: when "preservar tono" is off, pitch follows rate (vinyl)
  _effectiveSemitones() {
    const drift = this.preservePitch ? 0 : 12 * Math.log2(this._rate());
    return Math.min(24, Math.max(-24, this._pitch + drift));
  }

  // buffer mode: pitch and tempo are inherently coupled
  _totalRate() {
    return this._rate() * Math.pow(2, this._pitch / 12);
  }

  _schedule(active = true) {
    if (!this.stretch) return;
    this.stretch.schedule({
      input: this._position,
      rate: this._rate(),
      semitones: this._effectiveSemitones(),
      active,
    });
  }

  // ---- buffer (compat) mode internals ----
  _startBufferSource() {
    this._stopBufferSource();
    const src = this.ctx.createBufferSource();
    src.buffer = this._buffer;
    src.playbackRate.value = this._totalRate();
    src.connect(this.songGain);
    src.start(0, this._position);
    this._source = src;
    this._srcAnchorPos = this._position;
    this._srcAnchorTime = this.ctx.currentTime;
    this._tickTimer = setInterval(() => {
      if (this._status !== 'playing') return;
      const elapsed = (this.ctx.currentTime - this._srcAnchorTime) * this._source.playbackRate.value;
      this._progress(this._srcAnchorPos + elapsed);
    }, 100);
  }

  _stopBufferSource() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._source) {
      try { this._source.stop(); this._source.disconnect(); } catch { }
      this._source = null;
    }
  }

  _rescheduleBuffer() {
    // re-anchor position, then apply the new rate live
    if (!this._source) return;
    const elapsed = (this.ctx.currentTime - this._srcAnchorTime) * this._source.playbackRate.value;
    this._position = this._srcAnchorPos + elapsed;
    this._srcAnchorPos = this._position;
    this._srcAnchorTime = this.ctx.currentTime;
    this._source.playbackRate.value = this._totalRate();
  }

  _deactivate() {
    if (this.mode === 'worklet') this.stretch?.schedule({ active: false });
    else this._stopBufferSource();
  }

  async play() {
    if (!this.currentSong || (!this.stretch && !this._buffer)) return;
    this._ensureGraph();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this._status === 'playing') return;

    const song = this.currentSong;
    if ((song.fadeIn ?? 0) > 0 && this._position <= (song.startAt ?? 0) + 0.1) {
      this._fade(0, this._songGainTarget(), song.fadeIn);
    } else if (!this._fadeOutScheduled) {
      this.songGain.gain.setValueAtTime(this._songGainTarget(), this.ctx.currentTime);
    }
    if (this.mode === 'worklet') this._schedule(true);
    else this._startBufferSource();
    this._status = 'playing';
    this._emit('play');
  }

  pause() {
    if (this._status !== 'playing') return;
    if (this.mode === 'buffer') {
      const elapsed = (this.ctx.currentTime - this._srcAnchorTime) * (this._source ? this._source.playbackRate.value : 1);
      this._position = this._srcAnchorPos + elapsed;
    }
    this._deactivate();
    this._status = 'paused';
    this._emit('pause');
  }

  stop() {
    this._deactivate();
    if (this.currentSong) this._position = this.currentSong.startAt ?? 0;
    this._status = 'idle';
    this._fadeOutScheduled = false;
    this._emit('pause');
    this._emit('stopped');
  }

  get isPlaying() { return this._status === 'playing'; }
  get currentTime() { return this._position; }
  get duration() { return this._duration || (this.currentSong ? this.currentSong.duration : 0); }

  seek(seconds) {
    const song = this.currentSong;
    if (!song) return;
    const start = song.startAt ?? 0;
    const end = song.endAt && song.endAt > 0 ? Math.min(song.endAt, this._duration) : this._duration;
    this._position = Math.min(Math.max(seconds, start), end);
    this._fadeOutScheduled = false;
    if (this._status === 'playing') {
      this.songGain.gain.setValueAtTime(this._songGainTarget(), this.ctx.currentTime);
      if (this.mode === 'worklet') this._schedule(true);
      else this._startBufferSource();
    }
    this._emit('timeupdate', { time: this._position, duration: this._duration });
  }

  // Tempo 50..200 (%) — worklet: true time-stretch; buffer: coupled rate
  setTempo(pct) {
    this._tempoPct = Math.min(200, Math.max(50, pct));
    if (this.currentSong) this.currentSong.tempo = this._tempoPct;
    if (this._status !== 'playing') return;
    if (this.mode === 'worklet') this._schedule(true);
    else this._rescheduleBuffer();
  }

  // Pitch -12..+12 st — worklet: independent; buffer: coupled rate
  setPitch(semitones) {
    this._pitch = Math.min(12, Math.max(-12, semitones));
    if (this.currentSong) this.currentSong.pitch = this._pitch;
    if (this._status !== 'playing') return;
    if (this.mode === 'worklet') this._schedule(true);
    else this._rescheduleBuffer();
  }

  // Song volume 0..100
  setSongVolume(vol) {
    this._ensureGraph();
    if (this.currentSong) this.currentSong.volume = vol;
    if (!this._fadeOutScheduled) {
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
}

export const engine = new AudioEngine();
