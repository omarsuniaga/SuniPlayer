// src/features/player/ui/PlayerTrackHeader.tsx
import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme.ts";
import { fmt, mc } from "@suniplayer/core";
import { useIsMobile } from "../../../utils/useMediaQuery";

interface Props {
    ct: Track | undefined;
    rem: number;
    tCol: string;
    tPct: number;
}

export const PlayerTrackHeader: React.FC<Props> = ({ ct, rem, tCol, tPct }) => {
    const isMobile = useIsMobile();
    const timerSize = isMobile ? 72 : 100;
    const timerRadius = isMobile ? 32 : 44;

    return (
        <header style={{ 
            display: "flex", 
            alignItems: "flex-start", 
            justifyContent: "space-between", 
            flexWrap: isMobile ? "nowrap" : "wrap", 
            gap: isMobile ? 12 : 12,
            marginBottom: isMobile ? 12 : 0
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ 
                    fontSize: isMobile ? 24 : 32, 
                    fontWeight: 700, 
                    margin: 0, 
                    letterSpacing: "-0.03em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }} className="title-xl">
                    {ct?.title || "--"}
                </h1>
                <p style={{ 
                    fontSize: isMobile ? 14 : 16, 
                    color: THEME.colors.text.muted, 
                    margin: isMobile ? "2px 0 0" : "4px 0 0",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }}>{ct?.artist}</p>

                <div style={{ display: "flex", gap: isMobile ? 4 : 8, marginTop: isMobile ? 12 : 16, flexWrap: "wrap" }}>
                    {ct && (
                        <>
                            <span style={{ fontSize: isMobile ? 9 : 11, padding: isMobile ? "2px 6px" : "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: THEME.colors.brand.cyan + "15", color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>
                                {ct.bpm} BPM
                            </span>
                            <span style={{ fontSize: isMobile ? 9 : 11, padding: isMobile ? "2px 6px" : "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: THEME.colors.brand.violet + "15", color: THEME.colors.brand.violet, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>
                                {ct.key}
                            </span>
                            <span style={{ fontSize: isMobile ? 9 : 11, padding: isMobile ? "2px 6px" : "4px 10px", borderRadius: THEME.radius.sm, backgroundColor: mc(ct.mood || "calm") + "15", color: mc(ct.mood || "calm"), fontWeight: 700, textTransform: "capitalize" }}>
                                {ct.mood}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Timer Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 4 : 8, flexShrink: 0 }}>
                <div style={{ position: "relative", width: timerSize, height: timerSize }}>
                    <svg width={timerSize} height={timerSize} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={isMobile ? "8" : "6"} />
                        <circle
                            cx="50" cy="50" r="44"
                            fill="none"
                            stroke={tCol}
                            strokeWidth={isMobile ? "8" : "6"}
                            strokeDasharray={`${2 * Math.PI * 44}`}
                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - tPct)}`}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                        />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 700, fontFamily: THEME.fonts.mono, color: tCol }}>{fmt(rem * 1000)}</span>
                        <span style={{ fontSize: isMobile ? 7 : 9, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1 }}>{isMobile ? "Rem" : "Remaining"}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
