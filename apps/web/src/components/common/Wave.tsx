import React, { useMemo } from "react";
import { THEME } from "../../data/theme.ts";
import { usePlayerStore } from "@suniplayer/core";

interface WaveProps {
    data: number[];
    progress: number;
    color: string;
    fadeEnabled?: boolean;
    fadeInMs?: number;
    fadeOutMs?: number;
    totalMs?: number;
}

export const Wave = React.memo<WaveProps>(({ data, progress, color, fadeEnabled, fadeInMs = 0, fadeOutMs = 0, totalMs = 1 }) => {
    const { waveScale } = usePlayerStore();

    // Cache computed heights to avoid recalculating in every render
    const barHeights = useMemo(() => {
        return data.map((v, i) => {
            let fadeScale = 1;
            if (fadeEnabled && totalMs > 0) {
                const posPct = i / data.length;
                const posMs = posPct * totalMs;
                
                if (posMs < fadeInMs) {
                    fadeScale = Math.pow(posMs / fadeInMs, 2);
                } else if (posMs > totalMs - fadeOutMs) {
                    const remMs = totalMs - posMs;
                    fadeScale = Math.pow(remMs / fadeOutMs, 2);
                }
            }
            return v * fadeScale;
        });
    }, [data, fadeEnabled, fadeInMs, fadeOutMs, totalMs]);

    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ display: "flex", alignItems: "center", height: "100%", gap: 1, padding: "0 2px" }}>
                {barHeights.map((hFactor, i) => {
                    const h = hFactor * waveScale;
                    const isPlayed = i / data.length < progress;

                    return (
                        <div
                            key={i}
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    borderRadius: 1,
                                    height: `${Math.min(100, h * 100)}%`,
                                    minHeight: 2,
                                    backgroundColor: isPlayed ? color : THEME.colors.text.dim,
                                    // Eliminamos transiciones pesadas durante el playback
                                    transition: isPlayed ? "none" : "background-color .15s, height .2s ease-out",
                                    opacity: isPlayed ? 1 : 0.3
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

Wave.displayName = "Wave";
