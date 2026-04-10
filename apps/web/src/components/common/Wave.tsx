import React from "react";
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

export const Wave: React.FC<WaveProps> = ({ data, progress, color, fadeEnabled, fadeInMs = 0, fadeOutMs = 0, totalMs = 1 }) => {
    const { waveScale } = usePlayerStore();

    return (
        <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", height: "100%", gap: 1, padding: "0 2px" }}>
                {data.map((v, i) => {
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
                    const h = v * fadeScale * waveScale;

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
                                    backgroundColor: i / data.length < progress ? color : THEME.colors.text.dim,
                                    transition: "background-color .15s, height .2s ease-out",
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
