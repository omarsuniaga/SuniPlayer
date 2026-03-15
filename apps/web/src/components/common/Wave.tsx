import React from "react";
import { THEME } from "../../data/theme.ts";

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
    return (
        <div style={{ display: "flex", alignItems: "center", height: 52, gap: 1, padding: "0 2px" }}>
            {data.map((v, i) => {
                let scale = 1;
                if (fadeEnabled && totalMs > 0) {
                    const posPct = i / data.length;
                    const posMs = posPct * totalMs;
                    
                    if (posMs < fadeInMs) {
                        scale = Math.pow(posMs / fadeInMs, 2);
                    } else if (posMs > totalMs - fadeOutMs) {
                        const remMs = totalMs - posMs;
                        scale = Math.pow(remMs / fadeOutMs, 2);
                    }
                }
                const h = v * scale;

                return (
                    <div
                        key={i}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
                    >
                        <div
                            style={{
                                width: "100%",
                                borderRadius: 1,
                                height: `${h * 100}% `,
                                minHeight: 2,
                                backgroundColor: i / data.length < progress ? color : THEME.colors.text.dim,
                                transition: "background-color .15s",
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};
