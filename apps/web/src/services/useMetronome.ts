import { useEffect, useRef } from "react";
import { useProjectStore } from "../store/useProjectStore";

/**
 * useMetronome — Drives the visual Atmosphere Pulse based on BPM.
 * Sincroniza la animación visual con el tiempo del audio context.
 */
export function useMetronome() {
    const playing = useProjectStore(s => s.playing);
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const pos = useProjectStore(s => s.pos);
    
    const ct = pQueue[ci];
    const bpm = ct?.bpm || 0;
    
    useEffect(() => {
        if (!playing || bpm <= 0) {
            // Cleanup: remove pulse classes if paused
            const container = document.querySelector('.player-atmosphere-container');
            container?.classList.remove('beat-down', 'beat-up');
            return;
        }

        const beatDurationMs = 60000 / bpm;
        const container = document.querySelector('.player-atmosphere-container');
        
        let lastBeatIndex = -1;

        const updatePulse = () => {
            if (!playing) return;

            // Calculate current beat index within the song
            const currentBeat = Math.floor(pos / beatDurationMs);
            const isDownbeat = currentBeat % 4 === 0;

            if (currentBeat !== lastBeatIndex) {
                lastBeatIndex = currentBeat;
                
                // Trigger visual pulse
                container?.classList.remove('beat-down', 'beat-up');
                
                // Force reflow to restart transition if needed
                void (container as HTMLElement)?.offsetWidth;
                
                container?.classList.add(isDownbeat ? 'beat-down' : 'beat-up');
                
                // Pulse duration is short (150ms) to feel sharp
                setTimeout(() => {
                    container?.classList.remove('beat-down', 'beat-up');
                }, 150);
            }

            requestAnimationFrame(updatePulse);
        };

        const animId = requestAnimationFrame(updatePulse);
        return () => {
            cancelAnimationFrame(animId);
            container?.classList.remove('beat-down', 'beat-up');
        };
    }, [playing, bpm, pos]); // Re-sync when position jumps or playing changes
}
