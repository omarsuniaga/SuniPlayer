import type { Track } from "@suniplayer/core";

type NextTrackSnapshot = {
    ci: number;
    pQueue: Track[];
    stackOrder: string[];
};

export interface AudioTransportController {
    skipToNextGracefully: () => void;
    togglePlaybackGracefully: () => void;
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

export function resolveNextTrackIndex({ ci, pQueue, stackOrder }: NextTrackSnapshot): number | null {
    if (stackOrder.length > 0) {
        const queuedIndex = pQueue.findIndex((track) => track.id === stackOrder[0]);
        if (queuedIndex !== -1) return queuedIndex;
    }

    return ci < pQueue.length - 1 ? ci + 1 : null;
}
