import React from "react";
import { THEME } from "../../data/theme.ts";

interface WaveProps {
    data: number[];
    progress: number;
    color: string;
}

export const Wave: React.FC<WaveProps> = ({ data, progress, color }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", height: 52, gap: 1, padding: "0 2px" }}>
            {data.map((v, i) => (
                <div
                    key={i}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
                >
                    <div
                        style={{
                            width: "100%",
                            borderRadius: 1,
                            height: `${v * 100}% `,
                            minHeight: 2,
                            backgroundColor: i / data.length < progress ? color : THEME.colors.text.dim,
                            transition: "background-color .15s",
                        }}
                    />
                </div>
            ))}
        </div>
    );
};
