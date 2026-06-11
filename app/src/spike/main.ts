// Spike P1 — validates signalsmith-stretch (WASM/AudioWorklet) for Suniplayer.
// Gate defined in docs/adr/0001-stack-tecnologico.md: pitch +12 semitones and
// time-stretch at rate 0.5 must work in-browser with acceptable quality.
import SignalsmithStretch from 'signalsmith-stretch';
import {
  bufferStats,
  estimateDominantFrequency,
  expectedOutputDuration,
  makeSine,
  semitonesToRatio,
} from './lib/audioAnalysis';

const INPUT_HZ = 440;
const INPUT_SECONDS = 2;
const SEMITONES = 12;
const RATE = 0.5;

interface SpikeResult {
  pass: boolean;
  checks: Record<string, { pass: boolean; expected: string; measured: string }>;
  environment: Record<string, string | number>;
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
}

// ---------- 1. Automated check ----------

async function runAutomatedCheck(): Promise<SpikeResult> {
  const ctx = new AudioContext();
  await ctx.resume();

  const input = makeSine(INPUT_HZ, INPUT_SECONDS, ctx.sampleRate);
  const stretch = await SignalsmithStretch(ctx);
  await stretch.addBuffers([input]);

  // Capture chain: stretch -> capture (ScriptProcessor, spike-only) -> mute -> out.
  const captured: Float32Array[] = [];
  const capture = ctx.createScriptProcessor(4096, 1, 1);
  capture.onaudioprocess = (e) => {
    captured.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
  const mute = ctx.createGain();
  mute.gain.value = 0;
  stretch.connect(capture);
  capture.connect(mute);
  mute.connect(ctx.destination);

  const reportedLatency = stretch.latency();
  const wallStart = performance.now();

  stretch.schedule({ input: 0, rate: RATE, semitones: SEMITONES, active: true });

  // Wait until the node consumed the whole input buffer (plus safety timeout).
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => resolve(), 15000);
    stretch.setUpdateInterval(0.05, (inputTime) => {
      if (inputTime >= INPUT_SECONDS - 0.01) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  const wallSeconds = (performance.now() - wallStart) / 1000;
  stretch.stop();
  stretch.disconnect();
  capture.disconnect();
  mute.disconnect();

  // Concatenate capture, trim warmup/tail edges before analysis.
  const total = captured.reduce((n, c) => n + c.length, 0);
  const output = new Float32Array(total);
  let offset = 0;
  for (const chunk of captured) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  const trimStart = Math.floor(0.5 * ctx.sampleRate);
  const trimEnd = Math.floor(0.3 * ctx.sampleRate);
  const analyzed = output.subarray(trimStart, Math.max(trimStart, total - trimEnd));

  const dominantHz = estimateDominantFrequency(analyzed, ctx.sampleRate);
  const stats = bufferStats(analyzed);
  const expectedHz = INPUT_HZ * semitonesToRatio(SEMITONES);
  const expectedSeconds = expectedOutputDuration(INPUT_SECONDS, RATE);

  const checks: SpikeResult['checks'] = {
    pitchShift: {
      pass: Math.abs(dominantHz - expectedHz) <= expectedHz * 0.05,
      expected: `${expectedHz.toFixed(0)}Hz ±5%`,
      measured: `${dominantHz.toFixed(1)}Hz`,
    },
    stretchDuration: {
      pass: Math.abs(wallSeconds - expectedSeconds) <= expectedSeconds * 0.15,
      expected: `${expectedSeconds.toFixed(1)}s ±15%`,
      measured: `${wallSeconds.toFixed(2)}s (wall clock, realtime)`,
    },
    noCorruption: {
      pass: !stats.hasNaN,
      expected: 'zero NaN samples',
      measured: stats.hasNaN ? 'NaN FOUND' : 'clean',
    },
    audibleSignal: {
      pass: stats.rms > 0.05 && stats.silentRatio < 0.5,
      expected: 'rms > 0.05, silentRatio < 0.5',
      measured: `rms ${stats.rms.toFixed(3)}, silent ${(stats.silentRatio * 100).toFixed(0)}%`,
    },
  };

  const result: SpikeResult = {
    pass: Object.values(checks).every((c) => c.pass),
    checks,
    environment: {
      userAgent: navigator.userAgent,
      sampleRate: ctx.sampleRate,
      baseLatencyMs: Math.round((ctx.baseLatency ?? 0) * 1000),
      outputLatencyMs: Math.round((ctx.outputLatency ?? 0) * 1000),
      stretchReportedLatencyMs: Math.round(reportedLatency * 1000),
    },
  };

  await ctx.close();
  return result;
}

byId<HTMLButtonElement>('run-auto').addEventListener('click', async () => {
  const button = byId<HTMLButtonElement>('run-auto');
  const verdict = byId<HTMLParagraphElement>('auto-verdict');
  const results = byId<HTMLPreElement>('auto-results');
  button.disabled = true;
  verdict.textContent = 'Running (~4s of realtime processing)...';
  try {
    const result = await runAutomatedCheck();
    results.textContent = JSON.stringify(result, null, 2);
    verdict.innerHTML = result.pass
      ? '<span class="pass">✅ SPIKE PASS</span>'
      : '<span class="fail">❌ SPIKE FAIL</span>';
    console.log('SPIKE_RESULT', JSON.stringify(result));
  } catch (error) {
    verdict.innerHTML = '<span class="fail">❌ SPIKE ERROR</span>';
    results.textContent = String(error instanceof Error ? error.stack : error);
    console.log('SPIKE_ERROR', String(error));
  } finally {
    button.disabled = false;
  }
});

// ---------- 2. Human check ----------

let humanCtx: AudioContext | null = null;
let decoded: AudioBuffer | null = null;
let activeNodes: { disconnect(): void; stop?(when?: number): void }[] = [];

function stopAll(): void {
  for (const node of activeNodes) {
    try {
      node.stop?.();
      node.disconnect();
    } catch {
      /* already stopped */
    }
  }
  activeNodes = [];
}

const semitonesInput = byId<HTMLInputElement>('semitones');
const rateInput = byId<HTMLInputElement>('rate');
semitonesInput.addEventListener('input', () => {
  const v = Number(semitonesInput.value);
  byId<HTMLOutputElement>('semitones-value').textContent = v > 0 ? `+${v}` : `${v}`;
});
rateInput.addEventListener('input', () => {
  byId<HTMLOutputElement>('rate-value').textContent = Number(rateInput.value).toFixed(2);
});

byId<HTMLInputElement>('file-input').addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  humanCtx ??= new AudioContext();
  const status = byId<HTMLPreElement>('human-status');
  status.textContent = `Decoding ${file.name}...`;
  decoded = await humanCtx.decodeAudioData(await file.arrayBuffer());
  status.textContent = `Loaded: ${file.name} — ${decoded.duration.toFixed(1)}s, ${decoded.numberOfChannels}ch @ ${decoded.sampleRate}Hz`;
  byId<HTMLButtonElement>('play-processed').disabled = false;
  byId<HTMLButtonElement>('play-original').disabled = false;
  byId<HTMLButtonElement>('stop-all').disabled = false;
});

byId<HTMLButtonElement>('play-processed').addEventListener('click', async () => {
  if (!decoded || !humanCtx) return;
  stopAll();
  await humanCtx.resume();
  const stretch = await SignalsmithStretch(humanCtx, {
    outputChannelCount: [decoded.numberOfChannels],
  });
  const channels: Float32Array[] = [];
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    channels.push(decoded.getChannelData(c));
  }
  await stretch.addBuffers(channels);
  stretch.connect(humanCtx.destination);
  stretch.schedule({
    input: 0,
    rate: Number(rateInput.value),
    semitones: Number(semitonesInput.value),
    active: true,
  });
  activeNodes.push(stretch);
  byId<HTMLPreElement>('human-status').textContent =
    `Playing PROCESSED: ${semitonesInput.value} semitones, rate ${rateInput.value} — latency ${Math.round(stretch.latency() * 1000)}ms`;
});

byId<HTMLButtonElement>('play-original').addEventListener('click', async () => {
  if (!decoded || !humanCtx) return;
  stopAll();
  await humanCtx.resume();
  const source = humanCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(humanCtx.destination);
  source.start();
  activeNodes.push(source);
  byId<HTMLPreElement>('human-status').textContent = 'Playing ORIGINAL';
});

byId<HTMLButtonElement>('stop-all').addEventListener('click', () => {
  stopAll();
  byId<HTMLPreElement>('human-status').textContent = 'Stopped';
});
