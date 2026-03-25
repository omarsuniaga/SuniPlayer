import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Track } from "../../../types";
import { fmt, mc } from "../../../services/uiUtils.ts";

interface PlayerHeaderProps {
    track: Track | null;
    performanceMode: boolean;
    playing: boolean;
    pos: number;
    rem: number;
    tPct: number;
    currentSetMetadata: any;
    onProfileClick: () => void;
    onSheetMusicClick: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
    track, performanceMode, playing, pos, rem, tPct, currentSetMetadata,
    onProfileClick, onSheetMusicClick
}) => {
    const mCol = mc(track?.mood);
    const tCol = playing ? mCol : THEME.colors.text.muted;

    return (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <h1 style={{ fontSize: performanceMode ? 48 : 36, fontWeight: 900, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{track?.title || "--"}</h1>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button 
                            onClick={onProfileClick} 
                            title="Perfil de Canción" 
                            style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.colors.text.muted, cursor: "pointer", transition: "all 0.2s" }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </button>
                        {track?.sheetMusic && track.sheetMusic.length > 0 && (
                            <button 
                                onClick={onSheetMusicClick} 
                                title="Ver Partitura" 
                                style={{ background: "rgba(139,92,246,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.colors.brand.violet, cursor: "pointer", transition: "all 0.2s" }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </button>
                        )}
                    </div>
                </div>
                <p style={{ fontSize: performanceMode ? 22 : 18, color: THEME.colors.text.muted, margin: "4px 0 16px" }}>{track?.artist || "--"}</p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {track && (
                        <>
                            <span style={{ fontSize: performanceMode ? 12 : 10, padding: "4px 10px", borderRadius: 4, background: THEME.colors.brand.cyan + "15", color: THEME.colors.brand.cyan, fontWeight: 800 }}>{track.bpm} BPM</span>
                            <span style={{ fontSize: performanceMode ? 12 : 10, padding: "4px 10px", borderRadius: 4, background: THEME.colors.brand.violet + "15", color: THEME.colors.brand.violet, fontWeight: 800 }}>{track.key}</span>
                            <span style={{ fontSize: performanceMode ? 12 : 10, padding: "4px 10px", borderRadius: 4, background: mc(track.mood) + "15", color: mc(track.mood), fontWeight: 800 }}>{track.mood}</span>
                        </>
                    )}
                </div>

                {currentSetMetadata && currentSetMetadata.totalSetsInShow > 1 && (
                    <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: THEME.radius.md, backgroundColor: `${THEME.colors.brand.violet}15`, border: `1px solid ${THEME.colors.brand.violet}30` }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.violet} strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
                        <span style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.brand.violet }}>
                            {currentSetMetadata.setLabel} / {currentSetMetadata.totalSetsInShow}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ position: "relative", width: performanceMode ? 120 : 90, height: performanceMode ? 120 : 90, flexShrink: 0 }}>
                <svg width={performanceMode ? 120 : 90} height={performanceMode ? 120 : 90} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke={tCol} strokeWidth="6" strokeDasharray="276.5" strokeDashoffset={276.5 * (1 - tPct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s linear" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: performanceMode ? 24 : 18, fontWeight: 900, fontFamily: THEME.fonts.mono }}>{fmt(rem)}</span>
                    <span style={{ fontSize: 8, opacity: 0.4, textTransform: "uppercase" }}>restante</span>
                </div>
            </div>
        </header>
    );
};
