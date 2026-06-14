import type { Track } from "@suniplayer/core";

type NextTrackSnapshot = {
    ci: number;
    pQueue: Track[];
    stackOrder: string[];
};

export interface AudioTransportController {
    skipToNextGracefully: () => void;
    togglePlaybackGracefully: () => void;
    /** Hard kill switch: stops the main engine and every preview source. */
    stopAllAudio: () => void;
}

let controller: AudioTransportController | null = null;

export function registerAudioTransportController(nextController: AudioTransportController | null) {
    controller = nextController;
}

export function skipToNextGracefully() {
    controller?.skipToNextGracefully();
}

export function togglePlaybackGracefully() {
    controller?.togglePlaybackGracefully();
}

/**
 * Global panic button: silences ALL audio in the app. The registered controller
 * stops the main engine and the known preview engines; as a safety net we also
 * pause every <audio>/<video> element in the DOM so no stray HTMLAudio source can
 * keep playing. STOP must always be able to silence anything that is sounding.
 */
export function stopAllAudio() {
    controller?.stopAllAudio();
    if (typeof document !== "undefined") {
        document.querySelectorAll("audio, video").forEach((el) => {
            try { (el as HTMLMediaElement).pause(); } catch { /* ignore */ }
        });
    }
}

export function resolveNextTrackIndex({ ci, pQueue, stackOrder }: NextTrackSnapshot): number | null {
    if (stackOrder.length > 0) {
        const queuedIndex = pQueue.findIndex((track) => track.id === stackOrder[0]);
        if (queuedIndex !== -1) return queuedIndex;
    }

    return ci < pQueue.length - 1 ? ci + 1 : null;
}
