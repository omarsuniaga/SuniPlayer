import { useEffect, useRef } from "react";
import { useProjectStore, updateTrackMetadata } from "../store/useProjectStore";

/**
 * useTapTempo — Detects rhythm from border clicks and updates track BPM.
 */
export function useTapTempo() {
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const ct = pQueue[ci];
    
    const tapTimes = useRef<number[]>([]);
    const RESET_TIMEOUT = 2000; // 2 seconds between taps resets the count

    useEffect(() => {
        const handleTap = () => {
            if (!ct) return;

            const now = Date.now();
            const container = document.querySelector('.player-atmosphere-container');

            // 1. Visual Feedback (Flash)
            container?.classList.add('tap-flash');
            setTimeout(() => container?.classList.remove('tap-flash'), 100);

            // 2. Logic: Add timestamp and filter old ones
            if (tapTimes.current.length > 0 && now - tapTimes.current[tapTimes.current.length - 1] > RESET_TIMEOUT) {
                tapTimes.current = []; // Reset if too much time passed
            }

            tapTimes.current.push(now);

            // 3. Calculation: Need at least 4 taps for stability
            if (tapTimes.current.length >= 4) {
                const intervals: number[] = [];
                for (let i = 1; i < tapTimes.current.length; i++) {
                    intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
                }

                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const calculatedBpm = Math.round(60000 / avgInterval);

                if (calculatedBpm > 30 && calculatedBpm < 300) {
                    console.log(`[TapTempo] 🥁 New BPM detected: ${calculatedBpm}`);
                    updateTrackMetadata(ct.id, { bpm: calculatedBpm });
                    
                    // Keep the last 3 to allow continuous adjustment
                    tapTimes.current = tapTimes.current.slice(-3);
                }
            }
        };

        window.addEventListener('suni-tap-border' as any, handleTap);
        return () => window.removeEventListener('suni-tap-border' as any, handleTap);
    }, [ct]);
}
