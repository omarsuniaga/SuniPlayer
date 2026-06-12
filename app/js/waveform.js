// Waveform canvas renderer with playhead, markers, and trimmed zones
// (docs/componentes/06-grafica-ondas.md).

export class Waveform {
  constructor(canvas, { onSeek } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.peaks = null;
    this.duration = 0;
    this.time = 0;
    this.markers = [];
    this.startAt = 0;
    this.endAt = 0;
    this.onSeek = onSeek;

    canvas.addEventListener('pointerdown', (e) => this._seekFromEvent(e));
    new ResizeObserver(() => this.draw()).observe(canvas);
  }

  setData({ peaks, duration, markers = [], startAt = 0, endAt = 0 }) {
    this.peaks = peaks;
    this.duration = duration;
    this.markers = markers;
    this.startAt = startAt;
    this.endAt = endAt || duration;
    this.draw();
  }

  setTime(time) {
    this.time = time;
    this.draw();
  }

  _seekFromEvent(e) {
    if (!this.duration || !this.onSeek) return;
    const rect = this.canvas.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    this.onSeek(ratio * this.duration);
  }

  draw() {
    const c = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, hgt = c.clientHeight;
    if (!w || !hgt) return;
    if (c.width !== w * dpr || c.height !== hgt * dpr) {
      c.width = w * dpr;
      c.height = hgt * dpr;
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hgt);

    const css = getComputedStyle(document.documentElement);
    const colPlayed = css.getPropertyValue('--accent').trim() || '#e8615a';
    const colRest = css.getPropertyValue('--wave-rest').trim() || '#4a4a55';
    const colTrim = css.getPropertyValue('--wave-trim').trim() || 'rgba(120,120,130,0.25)';

    if (!this.peaks) {
      // flat line (no playback)
      ctx.fillStyle = colRest;
      ctx.fillRect(0, hgt / 2 - 1, w, 2);
      return;
    }

    const n = this.peaks.length;
    const barW = w / n;
    const playedX = this.duration ? (this.time / this.duration) * w : 0;
    const mid = hgt / 2;

    for (let i = 0; i < n; i++) {
      const x = i * barW;
      const amp = Math.max(0.02, this.peaks[i]) * (hgt * 0.46);
      ctx.fillStyle = x < playedX ? colPlayed : colRest;
      ctx.fillRect(x, mid - amp, Math.max(1, barW - 1), amp * 2);
    }

    // trimmed zones (start/end personalizados)
    if (this.duration) {
      if (this.startAt > 0) {
        ctx.fillStyle = colTrim;
        ctx.fillRect(0, 0, (this.startAt / this.duration) * w, hgt);
      }
      if (this.endAt && this.endAt < this.duration) {
        const x = (this.endAt / this.duration) * w;
        ctx.fillStyle = colTrim;
        ctx.fillRect(x, 0, w - x, hgt);
      }
    }

    // markers
    const markerColors = { rojo: '#e8453c', verde: '#3cb96a', amarillo: '#e0b13c', azul: '#3c87e8' };
    for (const m of this.markers) {
      const x = (m.timestamp / this.duration) * w;
      ctx.fillStyle = markerColors[m.color] || '#3cb96a';
      ctx.beginPath();
      ctx.arc(x, hgt - 7, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 0.75, hgt - 7, 1.5, -hgt + 14);
    }

    // playhead
    ctx.fillStyle = colPlayed;
    ctx.fillRect(playedX - 1, 0, 2, hgt);
  }
}
