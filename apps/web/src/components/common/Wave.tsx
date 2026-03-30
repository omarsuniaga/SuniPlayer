import React, { useState } from "react";
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
    const { waveScale, setWaveScale } = usePlayerStore();
    const [hover, setHover] = useState(false);

    return (
        <div 
            style={{ position: "relative", height: "100%", width: "100%" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
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

            {/* Amplitude Zoom Controls */}
            <div style={{ 
                position: "absolute", 
                top: 0, 
                right: 4, 
                bottom: 0, 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between",
                padding: "4px 0",
                opacity: hover ? 1 : 0.2,
                transition: "opacity 0.3s ease",
                pointerEvents: hover ? "auto" : "none",
                zIndex: 10
            }}>
                <button 
                    onClick={(e) => { e.stopPropagation(); setWaveScale(waveScale + 0.2); }}
                    style={{ 
                        background: "rgba(255,255,255,0.1)", 
                        border: "none", 
                        color: "white", 
                        cursor: "pointer", 
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: "bold",
                        lineHeight: 1
                    }}
                    title="Zoom +"
                >+</button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setWaveScale(Math.max(0.4, waveScale - 0.2)); }}
                    style={{ 
                        background: "rgba(255,255,255,0.1)", 
                        border: "none", 
                        color: "white", 
                        cursor: "pointer", 
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: "bold",
                        lineHeight: 1
                    }}
                    title="Zoom -"
                >-</button>
            </div>
        </div>
    );
};
