declare module "soundtouchjs" {
    export class PitchShifter {
        constructor(
            context: AudioContext,
            buffer: AudioBuffer,
            bufferSize: number,
            onEnd?: () => void
        );

        /** Time played in seconds */
        timePlayed: number;
        /** Source position in samples */
        sourcePosition: number;
        /** Duration of the buffer in seconds */
        duration: number;
        /** Sample rate of the audio context */
        sampleRate: number;

        /** Formatted duration string (mm:ss) */
        get formattedDuration(): string;
        /** Formatted time played string (mm:ss) */
        get formattedTimePlayed(): string;
        /** Percentage of audio played (0-100) */
        get percentagePlayed(): number;
        /** Set percentage played (0-1 range for seeking) */
        set percentagePlayed(perc: number);

        /** The raw ScriptProcessorNode */
        get node(): ScriptProcessorNode;

        /** Pitch factor (1.0 = original, 2.0 = octave up) */
        set pitch(pitch: number);
        /** Pitch shift in semitones */
        set pitchSemitones(semitone: number);
        /** Rate factor */
        set rate(rate: number);
        /** Tempo factor (1.0 = original speed) */
        set tempo(tempo: number);

        /** Connect to an AudioNode for playback */
        connect(toNode: AudioNode): void;
        /** Disconnect from output (pause) */
        disconnect(): void;

        /** Add event listener ('play' event with detail) */
        on(
            eventName: string,
            cb: (detail: {
                timePlayed: number;
                formattedTimePlayed: string;
                percentagePlayed: number;
            }) => void
        ): void;
        /** Remove event listeners */
        off(eventName?: string | null): void;
    }

    export class SoundTouch {
        constructor();
        clear(): void;
        clone(): SoundTouch;
        get rate(): number;
        set rate(rate: number);
        set rateChange(rateChange: number);
        get tempo(): number;
        set tempo(tempo: number);
        set tempoChange(tempoChange: number);
        set pitch(pitch: number);
        set pitchOctaves(pitchOctaves: number);
        set pitchSemitones(pitchSemitones: number);
        get inputBuffer(): FifoSampleBuffer;
        get outputBuffer(): FifoSampleBuffer;
        process(): void;
    }

    export class WebAudioBufferSource {
        constructor(buffer: AudioBuffer);
        get dualChannel(): boolean;
        get position(): number;
        set position(value: number);
        extract(target: Float32Array, numFrames?: number, position?: number): number;
    }

    export class SimpleFilter {
        constructor(
            sourceSound: WebAudioBufferSource,
            pipe: SoundTouch,
            callback?: () => void
        );
        get position(): number;
        set position(position: number);
        get sourcePosition(): number;
        set sourcePosition(sourcePosition: number);
        extract(target: Float32Array, numFrames?: number): number;
    }

    export class FifoSampleBuffer {
        get vector(): Float32Array;
        get position(): number;
        get startIndex(): number;
        get frameCount(): number;
        get endIndex(): number;
        clear(): void;
        put(numFrames: number): void;
        putSamples(samples: Float32Array, position?: number, numFrames?: number): void;
        receive(numFrames?: number): void;
        receiveSamples(output: Float32Array, numFrames?: number): void;
    }

    export function getWebAudioNode(
        context: AudioContext,
        filter: SimpleFilter,
        sourcePositionCallback?: (position: number) => void,
        bufferSize?: number
    ): ScriptProcessorNode;
}
