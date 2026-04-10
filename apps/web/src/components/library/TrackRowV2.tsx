import React, { useMemo, useState } from "react";
import { type Track } from "@suniplayer/core";

import { THEME } from "../../data/theme";
import { getLibraryTrackOrigin } from "../../features/library/lib/libraryCatalog";

interface TrackRowV2Props {
    track: Track;
    isInQueue: boolean;
    isInRepertoire: boolean;
    isSelected: boolean;
    selectionMode: boolean;
    onQueue: (track: Track) => void;
    onPlay: (track: Track) => void;
    onSelect: (track: Track) => void;
    onOpenTrackProfile: (track: Track) => void;
    onRemoveFromPlayer: (track: Track) => void;
    onVerifyCloud: (track: Track) => void;
    cloudStatus?: string;
    style?: React.CSSProperties;
}

const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const TrackRowV2: React.FC<TrackRowV2Props> = ({
    track,
    isInQueue,
    isInRepertoire,
    isSelected,
    selectionMode,
    onQueue,
    onPlay,
    onSelect,
    onOpenTrackProfile,
    onRemoveFromPlayer,
    onVerifyCloud,
    cloudStatus,
    style,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const origin = useMemo(() => getLibraryTrackOrigin(track), [track]);
    const isPlaying = isInQueue;

    return (
        <div
            className={`spotify-row ${isSelected ? "selected" : ""}`}
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 12px",
                height: 54,
                marginBottom: 2,
                backgroundColor: isSelected ? `${THEME.colors.brand.cyan}10` : "transparent",
                color: THEME.colors.text.primary,
                transition: "all 0.15s ease",
                cursor: "pointer",
                position: "relative",
                userSelect: "none",
            }}
            onClick={() => selectionMode ? onSelect(track) : onQueue(track)}
            onContextMenu={(e) => { e.preventDefault(); onSelect(track); }}
        >
            {/* 🟦 SELECTION CHECKBOX (Only in Selection Mode) */}
            {(selectionMode || isSelected) && (
                <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: `2px solid ${isSelected ? THEME.colors.brand.cyan : THEME.colors.border}`,
                    backgroundColor: isSelected ? THEME.colors.brand.cyan : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.2s"
                }}>
                    {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
            )}

            {/* 🖼️ ARTWORK / PLACEHOLDER (Compact 42px) */}
            <div style={{
                width: 42,
                height: 42,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${THEME.colors.brand.cyan}15 0%, ${THEME.colors.brand.violet}15 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.03)"
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isPlaying ? THEME.colors.brand.cyan : "rgba(255,255,255,0.2)"}>
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                
                <div className="artwork-play-overlay">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>

            {/* 📝 INFO (Super Compact) */}
            <div style={{ 
                flex: 1, 
                minWidth: 0, 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center",
                gap: 0 // Sin espacio entre líneas
            }}>
                <div style={{
                    fontSize: 14, // Un pelín más chico
                    fontWeight: 600,
                    color: isPlaying ? THEME.colors.brand.cyan : "white",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2
                }}>
                    {track.title || "Unknown Title"}
                </div>
                
                <div style={{
                    fontSize: 12, // Más compacto
                    color: THEME.colors.text.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    lineHeight: 1.2
                }}>
                    {origin === "cloud" && <span style={{ fontSize: 9 }}>☁️</span>}
                    <span style={{ fontWeight: 500 }}>{track.artist || "Unknown Artist"}</span>
                    <span>•</span>
                    <span>{formatDuration(track.duration_ms)}</span>
                    {track.bpm ? (
                        <>
                            <span>•</span>
                            <span style={{ fontFamily: THEME.fonts.mono }}>{Math.round(track.bpm)}BPM</span>
                        </>
                    ) : null}
                </div>
            </div>

            {/* 🎹 KEY (Ultra compact) */}
            {track.key && (
                <div style={{
                    fontSize: 11,
                    fontFamily: THEME.fonts.mono,
                    color: THEME.colors.brand.violet,
                    opacity: 0.8,
                    width: 24,
                    textAlign: "right",
                    fontWeight: 800,
                    marginRight: 4
                }}>
                    {track.key}
                </div>
            )}

            {/* ⋮ ACTIONS (Minimal) */}
            <div style={{ position: "relative" }}>
                <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: THEME.colors.text.muted,
                        padding: 6,
                        cursor: "pointer",
                        borderRadius: "4px",
                        display: "flex",
                        opacity: 0.5
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                </button>

                {menuOpen && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 999
                    }} onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>
                        <div
                            style={{
                                position: "absolute",
                                right: 16,
                                background: "#282828",
                                borderRadius: 6,
                                boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
                                minWidth: 180,
                                padding: 4,
                                zIndex: 1000,
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => { onOpenTrackProfile(track); setMenuOpen(false); }} style={spotifyMenuStyle}>Track Profile</button>
                            <button onClick={() => { onVerifyCloud(track); setMenuOpen(false); }} style={spotifyMenuStyle}>Verificar en Nube</button>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                            <button onClick={() => { onRemoveFromPlayer(track); setMenuOpen(false); }} style={{ ...spotifyMenuStyle, color: THEME.colors.status.error }}>Eliminar del reproductor</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .spotify-row:hover {
                    background-color: rgba(255,255,255,0.04) !important;
                }
                .spotify-row:hover .artwork-play-overlay {
                    opacity: 1;
                }
                .artwork-play-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.15s ease;
                }
            `}</style>
        </div>
    );
};

const spotifyMenuStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "12px 12px",
    background: "transparent",
    border: "none",
    color: "#EBEBEB",
    fontSize: 13,
    fontWeight: 400,
    cursor: "pointer",
    borderRadius: 2,
    transition: "background 0.1s"
};
// Agregar hover al estilo del menú via CSS o inline (Spotify usa #3E3E3E al hover)


const menuButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "transparent",
    color: "white",
    border: "none",
    borderBottom: `1px solid ${THEME.colors.border}`,
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
};
