/**
 * backgroundAnalysis.ts
 * 
 * Orchestrator for the Audio Analysis Web Worker.
 * Offloads heavy computations to keep the Main Thread free for audio playback and UI.
 */
import { AnalysisWorkerResults } from "./analysis.worker";

/**
 * Executes audio analysis in a background Web Worker.
 */
export async function analyzeAudioInBackground(buffer: AudioBuffer): Promise<AnalysisWorkerResults> {
    return new Promise((resolve, reject) => {
        // Create worker using Vite's constructor pattern
        const worker = new Worker(
            new URL("./analysis.worker.ts", import.meta.url),
            { type: "module" }
        );

        // Prepare data (only first channel for analysis speed)
        const audioData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;

        worker.onmessage = (event: MessageEvent<AnalysisWorkerResults>) => {
            resolve(event.data);
            worker.terminate(); // Clean up immediately after success
        };

        worker.onerror = (err) => {
            console.error("[AnalysisWorker] Error:", err);
            reject(err);
            worker.terminate(); // Clean up after error
        };

        // Send data to worker. 
        // audioData.buffer is passed as a 'Transferable' to avoid copying memory.
        worker.postMessage(
            { audioData, sampleRate }
        );
    });
}

/**
 * Service to analyze tracks one by one from a queue if needed
 */
export async function runBackgroundAnalysis() {
    // This could be expanded to scan the library for unanalyzed tracks
    // and process them when the CPU is idle.
}
