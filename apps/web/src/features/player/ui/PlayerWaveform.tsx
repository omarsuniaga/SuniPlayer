// src/features/player/ui/PlayerWaveform.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Wave } from "../../../components/common/Wave.tsx";
import { fmt } from \"@suniplayer/core\";

interface Props {
    waveData: number[];
    prog: number;
    mCol: string;
    isLive: boolean;
    pos: number;
    durationMs: number;
    onSeek: (e: React.MouseEvent) => void;
}

export const PlayerWaveform: React.FC<Props> = ({ waveData, prog, mCol, isLive, pos, durationMs, onSeek }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
            onClick={onSeek}
            style={{
                cursor: "pointer",
                borderRadius: THEME.radius.xl,
                padding: "12px 0",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: `1px solid ${THEME.colors.border}`,
                position: "relative",
                transition: "border-color 0.3s",
                minHeight: 76,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <Wave data={waveData} progress={prog} color={mCol} />
            {/* Playhead */}
            <div
                style={{
                    position: "absolute",
                    top: 4, bottom: 4,
                    left: `${prog * 100}%`,
                    width: 3,
                    backgroundColor: mCol,
                    borderRadius: 2,
                    boxShadow: `0 0 15px ${mCol}`,
                    transition: "left 0.25s linear",
                }}
            />
        </div>
        {/* Timestamps */}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: THEME.fonts.mono, fontSize: 12, color: THEME.colors.text.muted, padding: "0 8px" }}>
            <span>{fmt(pos)}</span>
            <span>-{fmt(Math.max(0, durationMs - pos))}</span>
        </div>
    </div>
);
