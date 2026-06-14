// Minimal typings for the official signalsmith-stretch WASM/AudioWorklet release.
// API per node_modules/signalsmith-stretch/README.md (v1.3.2).
declare module 'signalsmith-stretch' {
  export interface StretchScheduleChange {
    output?: number;
    active?: boolean;
    input?: number;
    rate?: number;
    semitones?: number;
    tonalityHz?: number;
    formantSemitones?: number;
    formantCompensation?: boolean;
    formantBaseHz?: number;
    loopStart?: number;
    loopEnd?: number;
  }

  export interface SignalsmithStretchNode extends AudioWorkletNode {
    inputTime: number;
    schedule(change: StretchScheduleChange): void;
    start(when?: number, offset?: number, duration?: number): void;
    stop(when?: number): void;
    addBuffers(channels: Float32Array[]): Promise<number>;
    dropBuffers(toSeconds?: number): Promise<{ start: number; end: number }> | void;
    latency(): number;
    setUpdateInterval(seconds: number, callback?: (inputTime: number) => void): void;
    configure(options: {
      blockMs?: number | null;
      intervalMs?: number;
      splitComputation?: boolean;
      preset?: 'default' | 'cheaper';
    }): void;
  }

  export default function SignalsmithStretch(
    context: BaseAudioContext,
    channelOptions?: Partial<AudioWorkletNodeOptions>,
  ): Promise<SignalsmithStretchNode>;
}
