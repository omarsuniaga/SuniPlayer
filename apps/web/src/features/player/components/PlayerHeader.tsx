import React, { useState } from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme";
import { fmt } from "@suniplayer/core";
import { useIsMobile } from "../../../utils/useMediaQuery";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { usePlayerStore } from "../../../store/usePlayerStore";

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
    onResetTrack: () => void;
    onSheetMusicClick: () => void;
    onSetlistToggle: () => void;
    showQueue: boolean;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
    track, performanceMode, playing, currentSetMetadata,
    onProfileClick, onResetTrack, onSheetMusicClick, isMirrorOpen, onMirrorToggle,
    onSetlistToggle, showQueue
}) => {
    const isMobile = useIsMobile();
    const autoGain = useSettingsStore(s => s.autoGain);
    const { syncStatus, isLeader } = usePlayerStore();
    const [showHelp, setShowHelp] = useState(false);
    const [showModInfo, setShowModInfo] = useState(false);

    if (!track) return null;
    const isNormalized = autoGain && typeof track.gainOffset === "number" && Math.abs(track.gainOffset - 1) > 0.02;

    // ── Modified-state detection (derived; the "original" is the neutral baseline) ──
    const semis = track.transposeSemitones ?? 0;
    const tempoPct = Math.round((track.playbackTempo ?? 1.0) * 100);
    const gainDb = track.gainOffset ?? 0;
    const isTrimmed = (track.startTime ?? 0) > 0 || (typeof track.endTime === "number" && track.endTime < track.duration_ms - 1);
    const isModified = semis !== 0 || tempoPct !== 100 || Math.abs(gainDb) > 0.001 || isTrimmed;
    const chipParts: string[] = [];
    if (semis !== 0) chipParts.push(`${semis > 0 ? "+" : ""}${semis} st`);
    if (tempoPct !== 100) chipParts.push(`${tempoPct}%`);
    const chipLabel = chipParts.join(" · ") || "Editado";

    const getSyncColor = () => {
        switch(syncStatus) {
            case 'SYNCED': return THEME.colors.brand.cyan;
            case 'CALIBRATING': return "#fbbf24";
            case 'DRIFTING': return THEME.colors.status.error;
            default: return "#444";
        }
    };

    return (
        <div style={{ 
            display: "flex", flexDirection: "column", gap: isMobile ? 4 : 8,
            paddingBottom: isMobile ? "8px" : "16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'DM Sans', sans-serif", position: "relative"
        }}>
            {/* ── HELP MODAL (Español Masterclass) ── */}
            {showHelp && (
                <div onClick={() => setShowHelp(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 400, background: "#111", border: `1px solid ${THEME.colors.brand.cyan}40`, borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.colors.brand.cyan, marginTop: 0, textTransform: "uppercase", letterSpacing: 1 }}>Guía del Reproductor</h2>
                        <div style={{ fontSize: 13, color: "#ccc", display: "flex", flexDirection: "column", gap: 20, lineHeight: "1.5" }}>
                            <div>
                                <strong style={{ color: "white", fontSize: 14 }}>🚀 Modo Performance:</strong> 
                                <p style={{ margin: "4px 0 0" }}>Optimiza la interfaz para el escenario, agrandando los tiempos y ocultando distracciones.</p>
                            </div>
                            <div>
                                <strong style={{ color: "white", fontSize: 14 }}>🎹 Datos en Vivo:</strong> 
                                <p style={{ margin: "4px 0 0" }}>Ves el <strong>BPM</strong> y el <strong>Tono (Key)</strong> real de cada track. El sistema te avisa si está normalizado.</p>
                            </div>
                            <div>
                                <strong style={{ color: "white", fontSize: 14 }}>🔗 SyncEnsemble (●):</strong> 
                                <p style={{ margin: "4px 0 0" }}>Indica el estado de la sincronía con el resto del ensamble. <span style={{color: THEME.colors.brand.cyan}}>Cian</span> = Sincronizado, <span style={{color: "#fbbf24"}}>Amarillo</span> = Calibrando.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowHelp(false)} style={{ width: "100%", marginTop: 28, padding: 14, borderRadius: 8, border: "none", background: THEME.colors.brand.cyan, color: "black", fontWeight: 900, cursor: "pointer", fontSize: 13 }}>¡LISTO PARA TOCAR!</button>
                    </div>
                </div>
            )}

            {/* Setlist Toggle Button */}
            <button
                onClick={onSetlistToggle}
                style={{
                    position: "absolute", bottom: isMobile ? 4 : 8, right: 0,
                    background: showQueue ? "rgba(139, 92, 246, 0.2)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${showQueue ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`,
                    color: showQueue ? THEME.colors.brand.violet : "white",
                    width: isMobile ? "28px" : "36px", height: isMobile ? "28px" : "36px",
                    borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10
                }}
            >
                <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>

            {/* Upper Badge Layer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ 
                        padding: "2px 8px", borderRadius: 4, 
                        backgroundColor: currentSetMetadata ? "rgba(139, 92, 246, 0.15)" : "rgba(255,255,255,0.05)", 
                        fontSize: 9, fontWeight: 900, color: currentSetMetadata ? THEME.colors.brand.violet : THEME.colors.text.muted,
                        letterSpacing: 1, border: `1px solid ${currentSetMetadata ? "rgba(139, 92, 246, 0.2)" : "transparent"}`
                    }}>
                        {currentSetMetadata ? `${currentSetMetadata.setLabel.toUpperCase()} • ${currentSetMetadata.totalSetsInShow} SETS` : "SESIÓN LIBRE"}
                    </div>
                    
                    {/* 🔗 SYNC INDICATOR */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 12, color: getSyncColor(), filter: syncStatus === 'CALIBRATING' ? "brightness(1.5)" : "none", animation: syncStatus === 'CALIBRATING' ? "pulse 1s infinite" : "none" }}>●</span>
                        <span style={{ fontSize: 8, fontWeight: 900, color: THEME.colors.text.muted }}>{isLeader ? "LÍDER" : "SEGUIDOR"}</span>
                    </div>

                    <span style={{ fontSize: 9, fontWeight: 900, color: playing ? THEME.colors.brand.cyan : "#666", letterSpacing: 1 }}>
                        {playing ? "SONANDO" : "EN ESPERA"}
                    </span>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowHelp(true)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: THEME.colors.brand.cyan, width: 28, height: 28, borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: "pointer" }}>?</button>
                </div>
            </div>

            {/* Main Title & Artist Layer */}
            <div style={{ marginTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                    <h1 style={{
                        fontSize: isMobile ? 22 : (performanceMode ? 38 : 28),
                        fontWeight: 900, color: "white", margin: 0, minWidth: 0,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        letterSpacing: "-0.02em", lineHeight: 1.1
                    }}>
                        {track.title}
                    </h1>

                    {/* Edit / Modified state chip — co-located with the song identity */}
                    {isModified ? (
                        <button onClick={() => setShowModInfo(v => !v)} title="Canción modificada — ver ajustes" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.5)", color: "#fb923c", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
                            <span style={{ fontSize: 11 }}>♪</span>{chipLabel}
                        </button>
                    ) : (
                        <button onClick={onProfileClick} title="Editar perfil del track" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                        </button>
                    )}

                    {/* Modified-detail popover */}
                    {isModified && showModInfo && (
                        <>
                            <div onClick={() => setShowModInfo(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
                            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 51, width: 230, background: "#14181F", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 10, padding: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.7)" }}>
                                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#fb923c", marginBottom: 8 }}>AJUSTES APLICADOS</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#888" }}>Tono</span><span style={{ fontWeight: 800, color: semis !== 0 ? "#fb923c" : "#666" }}>{semis !== 0 ? `${semis > 0 ? "+" : ""}${semis} semitonos` : "Original"}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#888" }}>Velocidad</span><span style={{ fontWeight: 800, color: tempoPct !== 100 ? "#fb923c" : "#666" }}>{tempoPct}%</span></div>
                                    {Math.abs(gainDb) > 0.001 && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#888" }}>Normalización</span><span style={{ fontWeight: 800, color: "#fb923c" }}>{gainDb > 0 ? "+" : ""}{gainDb} dB</span></div>}
                                    {isTrimmed && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#888" }}>Recorte</span><span style={{ fontWeight: 800, color: "#fb923c" }}>Activo</span></div>}
                                </div>
                                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                                    <button onClick={() => { setShowModInfo(false); onProfileClick(); }} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid rgba(6,182,212,0.3)", background: "rgba(6,182,212,0.1)", color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>Editar</button>
                                    <button onClick={() => { setShowModInfo(false); onResetTrack(); }} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid rgba(249,115,22,0.4)", background: "rgba(249,115,22,0.12)", color: "#fb923c", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>Restaurar</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                    <span style={{ fontSize: isMobile ? 12 : 16, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{track.artist || "Artista Local"}</span>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: THEME.colors.brand.cyan, boxShadow: `0 0 6px ${THEME.colors.brand.cyan}` }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.brand.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(track.bpm || 120)} BPM</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.brand.violet, fontFamily: "'JetBrains Mono', monospace" }}>{track.key || "--"}</span>
                </div>
            </div>
            
            <style>{`
                @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
            `}</style>
        </div>
    );
};
