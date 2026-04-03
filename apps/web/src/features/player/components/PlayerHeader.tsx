import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme";
import { fmt } from "@suniplayer/core";
import { useIsMobile } from "../../../utils/useMediaQuery";
import { useSettingsStore } from "../../../store/useSettingsStore";

interface PlayerHeaderProps {
    track: Track | null;
    performanceMode: boolean;
    playing: boolean;
    rem: number;
    tPct: number;
    isMirrorOpen: boolean;
    onMirrorToggle: () => void;
    currentSetMetadata: { setLabel: string; totalSetsInShow: number } | null;
    onProfileClick: () => void;
    onSheetMusicClick: () => void;
    onSetlistToggle: () => void; // New prop
    showQueue: boolean;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
    track, performanceMode, playing, currentSetMetadata,
    onProfileClick, onSheetMusicClick, isMirrorOpen, onMirrorToggle,
    onSetlistToggle, showQueue
}) => {
    const isMobile = useIsMobile();
    const autoGain = useSettingsStore(s => s.autoGain);
    if (!track) return null;
    const isNormalized = autoGain && typeof track.gainOffset === "number" && Math.abs(track.gainOffset - 1) > 0.02;

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: isMobile ? 4 : 8,
            paddingBottom: isMobile ? "12px" : "20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'DM Sans', sans-serif",
            position: "relative"
        }}>
            {/* Setlist Toggle Button (Absolute Bottom Right) */}
            <button
                onClick={onSetlistToggle}
                title="Mostrar Setlist"
                style={{
                    position: "absolute",
                    bottom: isMobile ? 8 : 12,
                    right: 0,
                    background: showQueue ? "rgba(139, 92, 246, 0.2)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${showQueue ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`,
                    color: showQueue ? THEME.colors.brand.violet : "white",
                    width: isMobile ? "32px" : "40px",
                    height: isMobile ? "32px" : "40px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    transition: "all 0.2s"
                }}
            >
                <svg width={isMobile ? 18 : 20} height={isMobile ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
            </button>

            {/* Upper Badge Layer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {currentSetMetadata ? (
                        <div style={{ 
                            padding: isMobile ? "2px 8px" : "3px 10px", borderRadius: 6, 
                            backgroundColor: "rgba(139, 92, 246, 0.15)", 
                            fontSize: isMobile ? 9 : 10, fontWeight: 900, color: THEME.colors.brand.violet,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: 1,
                            border: "1px solid rgba(139, 92, 246, 0.2)"
                        }}>
                            {currentSetMetadata.setLabel.toUpperCase()} • {currentSetMetadata.totalSetsInShow} SETS
                        </div>
                    ) : (
                        <div style={{ 
                            padding: isMobile ? "2px 8px" : "3px 10px", borderRadius: 6, 
                            backgroundColor: "rgba(255,255,255,0.05)", 
                            fontSize: isMobile ? 9 : 10, fontWeight: 800, color: THEME.colors.text.muted,
                            letterSpacing: 1
                        }}>
                            SINGLE SESSION
                        </div>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>|</span>
                    <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: THEME.colors.brand.cyan, letterSpacing: 1 }}>
                        {playing ? "BROADCASTING" : "STANDBY"}
                    </span>
                    {isNormalized && (
                        <>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>|</span>
                            <span style={{
                                padding: isMobile ? "2px 6px" : "3px 8px",
                                borderRadius: 999,
                                backgroundColor: "rgba(6, 182, 212, 0.12)",
                                border: "1px solid rgba(6, 182, 212, 0.25)",
                                fontSize: isMobile ? 8 : 9,
                                fontWeight: 900,
                                color: THEME.colors.brand.cyan,
                                letterSpacing: 0.8,
                            }}>
                                NORMALIZADO
                            </span>
                        </>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    {track.sheetMusic && track.sheetMusic.length > 0 && (
                        <button 
                            onClick={onSheetMusicClick}
                            title="Ver Partitura"
                            style={{ 
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", 
                                color: "white", width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", borderRadius: "10px",
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                            }}
                        >
                            <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </button>
                    )}
                    
                    <button 
                        onClick={onProfileClick}
                        title="Propiedades del Audio"
                        style={{ 
                            background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)", 
                            color: THEME.colors.brand.cyan, width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", borderRadius: "10px",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}
                    >
                        <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
            </div>

            {/* Main Title & Artist Layer */}
            <div style={{ marginTop: isMobile ? 0 : 4 }}>
                <h1 style={{ 
                    fontSize: isMobile ? 26 : (performanceMode ? 44 : 32), 
                    fontWeight: 900, color: "white", margin: 0, 
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1
                }}>
                    {track.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, marginTop: 2 }}>
                    <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{track.artist || "Artista Local"}</span>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: THEME.colors.brand.cyan, boxShadow: `0 0 8px ${THEME.colors.brand.cyan}` }} />
                    <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 800, color: THEME.colors.brand.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(track.bpm || 120)} BPM</span>
                    <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 800, color: THEME.colors.brand.violet, fontFamily: "'JetBrains Mono', monospace" }}>{track.key || "C"}</span>
                </div>
            </div>
        </div>
    );
};
