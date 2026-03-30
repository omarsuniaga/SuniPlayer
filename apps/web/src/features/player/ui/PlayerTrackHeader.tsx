// src/features/player/ui/PlayerTrackHeader.tsx
import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme.ts";
import { fmt, mc } from "@suniplayer/core";

interface Props {
    ct: Track | undefined;
    rem: number;
    tCol: string;
    tPct: number;
}

export const PlayerTrackHeader: React.FC<Props> = ({ ct, rem, tCol, tPct }) => (
    <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }} className="title-xl">
                {ct?.title || "--"}
            </h1>
            <p style={{ fontSize: 16, color: THEME.colors.text.muted, margin: "4px 0 0" }}>{ct?.artist}</p>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {ct && (
                    <>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: THEME.colors.brand.cyan + "15", color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>
                            {ct.bpm} BPM
                        </span>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: THEME.colors.brand.violet + "15", color: THEME.colors.brand.violet, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>
                            {ct.key}
                        </span>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: mc(ct.mood) + "15", color: mc(ct.mood), fontWeight: 700, textTransform: "capitalize" }}>
                            {ct.mood}
                        </span>
                    </>
                )}
            </div>
        </div>

        {/* Timer Circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke={tCol}
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - tPct)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 700, fontFamily: THEME.fonts.mono, color: tCol }}>{fmt(rem * 1000)}</span>
                    <span style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1 }}>Remaining</span>
                </div>
            </div>
        </div>
    </header>
);
