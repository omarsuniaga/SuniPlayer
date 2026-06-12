// Pitch shifter — dual delay-line granular technique ("Jungle", Chris Wilson's approach).
// Shifts pitch without changing speed: two delay lines whose delayTime ramps
// continuously (Doppler effect) are crossfaded to hide the discontinuity.

const BUFFER_TIME = 0.100; // grain size in seconds
const FADE_TIME = 0.050;

function createDelayTimeBuffer(ctx, activeTime, fadeTime, shiftUp) {
  const length = Math.round(ctx.sampleRate * (activeTime + fadeTime));
  const buffer = new Float32Array(length);
  const active = Math.round(ctx.sampleRate * activeTime);
  for (let i = 0; i < length; i++) {
    if (i < active) {
      // ramp from activeTime->0 (shift up) or 0->activeTime (shift down)
      buffer[i] = shiftUp ? (active - i) / active * activeTime : i / active * activeTime;
    } else {
      buffer[i] = buffer[active - 1];
    }
  }
  return buffer;
}

function createFadeBuffer(ctx, activeTime, fadeTime) {
  const length = Math.round(ctx.sampleRate * (activeTime + fadeTime));
  const buffer = new Float32Array(length);
  const fadeLength = Math.round(ctx.sampleRate * fadeTime);
  const fadeIndexEnd = Math.round(ctx.sampleRate * activeTime) - fadeLength;
  for (let i = 0; i < length; i++) {
    if (i < fadeLength) buffer[i] = Math.sqrt(i / fadeLength);
    else if (i >= fadeIndexEnd && i < fadeIndexEnd + fadeLength) buffer[i] = Math.sqrt(1 - (i - fadeIndexEnd) / fadeLength);
    else if (i < fadeIndexEnd) buffer[i] = 1;
    else buffer[i] = 0;
  }
  return buffer;
}

export class Jungle {
  constructor(ctx) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    const mod1 = ctx.createBufferSource();
    const mod2 = ctx.createBufferSource();
    const mod3 = ctx.createBufferSource();
    const mod4 = ctx.createBufferSource();

    const upBuf = createDelayTimeBuffer(ctx, BUFFER_TIME, FADE_TIME, true);
    const downBuf = createDelayTimeBuffer(ctx, BUFFER_TIME, FADE_TIME, false);
    const shiftDownBuffer = ctx.createBuffer(1, downBuf.length, ctx.sampleRate);
    shiftDownBuffer.copyToChannel(downBuf, 0);
    const shiftUpBuffer = ctx.createBuffer(1, upBuf.length, ctx.sampleRate);
    shiftUpBuffer.copyToChannel(upBuf, 0);

    mod1.buffer = shiftDownBuffer;
    mod2.buffer = shiftDownBuffer;
    mod3.buffer = shiftUpBuffer;
    mod4.buffer = shiftUpBuffer;
    [mod1, mod2, mod3, mod4].forEach(m => { m.loop = true; });

    this.mod1Gain = ctx.createGain();
    this.mod2Gain = ctx.createGain();
    this.mod3Gain = ctx.createGain(); this.mod3Gain.gain.value = 0;
    this.mod4Gain = ctx.createGain(); this.mod4Gain.gain.value = 0;

    mod1.connect(this.mod1Gain);
    mod2.connect(this.mod2Gain);
    mod3.connect(this.mod3Gain);
    mod4.connect(this.mod4Gain);

    this.modGain1 = ctx.createGain();
    this.modGain2 = ctx.createGain();

    const delay1 = ctx.createDelay(1);
    const delay2 = ctx.createDelay(1);
    this.mod1Gain.connect(this.modGain1);
    this.mod3Gain.connect(this.modGain1);
    this.mod2Gain.connect(this.modGain2);
    this.mod4Gain.connect(this.modGain2);
    this.modGain1.connect(delay1.delayTime);
    this.modGain2.connect(delay2.delayTime);

    const fadeArr = createFadeBuffer(ctx, BUFFER_TIME, FADE_TIME);
    const fadeBuffer = ctx.createBuffer(1, fadeArr.length, ctx.sampleRate);
    fadeBuffer.copyToChannel(fadeArr, 0);
    const fade1 = ctx.createBufferSource();
    const fade2 = ctx.createBufferSource();
    fade1.buffer = fadeBuffer;
    fade2.buffer = fadeBuffer;
    fade1.loop = true;
    fade2.loop = true;

    const mix1 = ctx.createGain(); mix1.gain.value = 0;
    const mix2 = ctx.createGain(); mix2.gain.value = 0;
    fade1.connect(mix1.gain);
    fade2.connect(mix2.gain);

    this.input.connect(delay1);
    this.input.connect(delay2);
    delay1.connect(mix1);
    delay2.connect(mix2);
    mix1.connect(this.output);
    mix2.connect(this.output);

    const t = ctx.currentTime + 0.05;
    const t2 = t + BUFFER_TIME - FADE_TIME;
    mod1.start(t);
    mod3.start(t);
    fade1.start(t);
    mod2.start(t2);
    mod4.start(t2);
    fade2.start(t2);

    this.setPitchOffset(0);
  }

  // semitones: -12..+12
  setPitchOffset(semitones) {
    const mult = Math.pow(2, semitones / 12) - 1;
    if (mult > 0) {
      this.mod1Gain.gain.value = 0;
      this.mod2Gain.gain.value = 0;
      this.mod3Gain.gain.value = 1;
      this.mod4Gain.gain.value = 1;
    } else {
      this.mod1Gain.gain.value = 1;
      this.mod2Gain.gain.value = 1;
      this.mod3Gain.gain.value = 0;
      this.mod4Gain.gain.value = 0;
    }
    const amount = BUFFER_TIME * Math.abs(mult);
    this.modGain1.gain.setTargetAtTime(0.5 * amount, this.ctx.currentTime, 0.01);
    this.modGain2.gain.setTargetAtTime(0.5 * amount, this.ctx.currentTime, 0.01);
  }
}
