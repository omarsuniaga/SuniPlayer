import React, { useMemo, useState } from "react";
import { type Track } from "@suniplayer/core";

import { THEME } from "../../data/theme";
import { getLibraryTrackOrigin } from "../../features/library/lib/libraryCatalog";

interface TrackRowV2Props {
    track: Track;
    isInQueue: boolean;
    isInRepertoire: boolean;
    onQueue: (track: Track) => void;
    onPlay: (track: Track) => void;
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
    onQueue,
    onPlay,
    onOpenTrackProfile,
    onRemoveFromPlayer,
    onVerifyCloud,
    cloudStatus,
    style,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const origin = useMemo(() => getLibraryTrackOrigin(track), [track]);
    const isActive = isInQueue || isInRepertoire;

    const background = isActive
        ? "linear-gradient(90deg, rgba(6,182,212,0.10) 0%, rgba(139,92,246,0.08) 100%)"
        : "transparent";

    const activeLabel = isInQueue ? "EN QUEUE" : isInRepertoire ? "ACTIVE" : null;

    return (
        <div
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 12px",
                borderBottom: `1px solid ${THEME.colors.border}`,
                background: background,
                color: THEME.colors.text.primary,
                transition: "background-color 0.2s",
                // overflow: "hidden", // Removido para permitir que el menú de acciones sea visible
                zIndex: menuOpen ? 1000 : 1, // Elevamos mucho la fila cuando el menú está abierto
                cursor: "pointer",
            }}
            onClick={() => onQueue(track)}
        >
            {/* Backdrop para cerrar el menú y oscurecer el fondo */}
            {menuOpen && (
                <div 
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        backdropFilter: "blur(4px)",
                        zIndex: -1, // Detrás del contenido de la fila actual pero encima de todo lo demás
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                    }}
                />
            )}

            <button
                onClick={(event) => {
                    event.stopPropagation();
                    onPlay(track);
                }}
                style={{
                    background: THEME.colors.brand.cyan,
                    border: "none",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "black",
                    fontSize: 16,
                    fontWeight: 900,
                    boxShadow: `0 8px 20px ${THEME.colors.brand.cyan}25`,
                    flexShrink: 0,
                    filter: menuOpen ? "blur(2px) grayscale(0.5)" : "none",
                    opacity: menuOpen ? 0.3 : 1,
                    transition: "all 0.3s ease",
                }}
                aria-label={`Reproducir ${track.title}`}
            >
                ▶
            </button>

            <div style={{ 
                flex: 1, 
                minWidth: 0, 
                display: "flex", 
                flexDirection: "column", 
                gap: 6,
                filter: menuOpen ? "blur(2px) opacity(0.3)" : "none",
                transition: "all 0.3s ease",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            fontWeight: 800,
                            fontSize: 14,
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {track.title}
                    </div>

                    {activeLabel && (
                        <span
                            style={{
                                flexShrink: 0,
                                fontSize: 9,
                                color: isInQueue ? THEME.colors.brand.cyan : THEME.colors.status.success,
                                backgroundColor: isInQueue
                                    ? `${THEME.colors.brand.cyan}20`
                                    : `${THEME.colors.status.success}20`,
                                padding: "3px 6px",
                                borderRadius: 999,
                                fontWeight: 800,
                                letterSpacing: "0.06em",
                            }}
                        >
                            {activeLabel}
                        </span>
                    )}
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                        color: THEME.colors.text.secondary,
                        fontSize: 11,
                        lineHeight: 1.1,
                        flexWrap: "wrap",
                    }}
                >
                    <span style={{ color: THEME.colors.text.muted, whiteSpace: "nowrap" }}>
                        {formatDuration(track.duration_ms)}
                    </span>
                    <span style={{ color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono, whiteSpace: "nowrap" }}>
                        {Math.round(track.bpm || 0) || "-"} BPM
                    </span>
                    <span style={{ color: THEME.colors.brand.violet, fontFamily: THEME.fonts.mono, whiteSpace: "nowrap" }}>
                        {track.key || "-"}
                    </span>
                    <span
                        style={{
                            color: THEME.colors.text.muted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: 0,
                            flex: 1,
                        }}
                    >
                        {track.artist || "Unknown Artist"}
                    </span>
                </div>

                {cloudStatus && (
                    <div
                        style={{
                            fontSize: 10,
                            color: THEME.colors.text.muted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {cloudStatus}
                    </div>
                )}
            </div>

            <button
                onClick={(event) => {
                    event.stopPropagation();
                    if (origin === "cloud") {
                        onVerifyCloud(track);
                    }
                }}
                style={{
                    background: origin === "cloud" ? "rgba(255,255,255,0.05)" : "transparent",
                    border: "none",
                    width: 32,
                    height: 32,
                    borderRadius: 12,
                    cursor: origin === "cloud" ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: origin === "cloud" ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                    fontSize: 16,
                    flexShrink: 0,
                }}
                title={origin === "cloud" ? "Verificar disponibilidad en nube" : "Disponible en este dispositivo"}
                aria-label={origin === "cloud" ? "Track en la nube" : "Track local"}
            >
                {origin === "cloud" ? "☁" : "📱"}
            </button>

            <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen((open) => !open);
                    }}
                    style={{
                        background: "transparent",
                        border: "none",
                        width: 32,
                        height: 32,
                        borderRadius: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: THEME.colors.text.muted,
                        fontSize: 18,
                    }}
                    aria-label={`Acciones para ${track.title}`}
                >
                    ⋮
                </button>

                {menuOpen && (
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 4px)",
                            minWidth: 180,
                            background: "#10161F",
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: 14,
                            boxShadow: "0 14px 28px rgba(0,0,0,0.45)",
                            overflow: "hidden",
                            zIndex: 20,
                        }}
                    >
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                setMenuOpen(false);
                                onOpenTrackProfile(track);
                            }}
                            style={menuButtonStyle}
                        >
                            Abrir Track Profile
                        </button>
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                setMenuOpen(false);
                                onRemoveFromPlayer(track);
                            }}
                            style={{ ...menuButtonStyle, color: THEME.colors.status.error }}
                        >
                            Eliminar del reproductor
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

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
