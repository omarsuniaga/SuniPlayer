import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme";
import { fmt } from "../../../services/uiUtils";

interface PlayerHeaderProps {
    track: Track | null;
    performanceMode: boolean;
    playing: boolean;
    rem: number;
    tPct: number;
    currentSetMetadata: { setLabel: string; totalSetsInShow: number } | null;
    onProfileClick: () => void;
    onSheetMusicClick: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
    track, performanceMode, playing, currentSetMetadata,
    onProfileClick, onSheetMusicClick
}) => {
    if (!track) return null;

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 8,
            paddingBottom: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'DM Sans', sans-serif",
            position: "relative"
        }}>
            {/* Upper Badge Layer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {currentSetMetadata ? (
                        <div style={{ 
                            padding: "3px 10px", borderRadius: 6, 
                            backgroundColor: "rgba(139, 92, 246, 0.15)", 
                            fontSize: 10, fontWeight: 900, color: THEME.colors.brand.violet,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: 1,
                            border: "1px solid rgba(139, 92, 246, 0.2)"
                        }}>
                            {currentSetMetadata.setLabel.toUpperCase()} • {currentSetMetadata.totalSetsInShow} SETS
                        </div>
                    ) : (
                        <div style={{ 
                            padding: "3px 10px", borderRadius: 6, 
                            backgroundColor: "rgba(255,255,255,0.05)", 
                            fontSize: 10, fontWeight: 800, color: THEME.colors.text.muted,
                            letterSpacing: 1
                        }}>
                            SINGLE SESSION
                        </div>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>|</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.brand.cyan, letterSpacing: 1 }}>
                        {playing ? "BROADCASTING" : "STANDBY"}
                    </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    {track.sheetMusic && track.sheetMusic.length > 0 && (
                        <button 
                            onClick={onSheetMusicClick}
                            title="Ver Partitura"
                            style={{ 
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", 
                                color: "white", width: "36px", height: "36px", borderRadius: "10px",
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </button>
                    )}
                    <button 
                        onClick={onProfileClick}
                        title="Propiedades del Audio"
                        style={{ 
                            background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)", 
                            color: THEME.colors.brand.cyan, width: "36px", height: "36px", borderRadius: "10px",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
            </div>

            {/* Main Title & Artist Layer */}
            <div style={{ marginTop: 4 }}>
                <h1 style={{ 
                    fontSize: performanceMode ? 44 : 32, 
                    fontWeight: 900, color: "white", margin: 0, 
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1
                }}>
                    {track.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{track.artist || "Artista Local"}</span>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: THEME.colors.brand.cyan, boxShadow: `0 0 8px ${THEME.colors.brand.cyan}` }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: THEME.colors.brand.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(track.bpm || 120)} BPM</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: THEME.colors.brand.violet, fontFamily: "'JetBrains Mono', monospace" }}>{track.key || "C"}</span>
                </div>
            </div>
        </div>
    );
};
