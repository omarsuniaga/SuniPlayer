import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../data/theme";
import { usePreviewStore } from "../../store/usePreviewStore";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useIsMobile } from "../../utils/useMediaQuery";

interface TrackRowV2Props {
    track: Track;
    index: number;
    isSelected: boolean;
    onSelectToggle: (trackId: string) => void;
    onDelete: (track: Track) => void;
    isInRepertoire: boolean;
    style?: React.CSSProperties;
}

export const TrackRowV2: React.FC<TrackRowV2Props> = ({
    track,
    index,
    isSelected,
    onSelectToggle,
    onDelete,
    isInRepertoire,
    style
}) => {
    const { previewTrackId, isPlaying, isLoading, togglePreview } = usePreviewStore();
    const isMobile = useIsMobile();

    const isThisTrackPreviewing = previewTrackId === track.id;
    const isThisTrackPlaying = isThisTrackPreviewing && isPlaying;
    const isThisTrackLoading = isThisTrackPreviewing && isLoading;

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    if (isMobile) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 12px",
                    borderBottom: `1px solid ${THEME.colors.border}`,
                    backgroundColor: isThisTrackPreviewing ? "rgba(6, 182, 212, 0.05)" : "transparent",
                    color: THEME.colors.text.primary,
                    transition: "background-color 0.2s",
                    height: "78px",
                    overflow: "hidden",
                }}
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectToggle(track.id)}
                    style={{
                        accentColor: THEME.colors.brand.cyan,
                        cursor: "pointer",
                        width: "16px",
                        height: "16px",
                        flexShrink: 0,
                    }}
                />

                <button
                    onClick={() => togglePreview(track)}
                    style={{
                        background: isThisTrackPlaying ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)",
                        border: "none",
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isThisTrackPlaying ? "black" : THEME.colors.brand.cyan,
                        fontSize: "14px",
                        transition: "all 0.2s",
                        flexShrink: 0,
                    }}
                >
                    {isThisTrackLoading ? (
                        <LoadingSpinner size={14} color={isThisTrackPlaying ? "black" : THEME.colors.brand.cyan} />
                    ) : (
                        isThisTrackPlaying ? "⏸" : "▶"
                    )}
                </button>

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                fontWeight: 700,
                                fontSize: 14,
                                lineHeight: 1.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {track.title}
                        </div>
                        {isInRepertoire && (
                            <span
                                style={{
                                    flexShrink: 0,
                                    fontSize: 9,
                                    color: THEME.colors.status.success,
                                    backgroundColor: `${THEME.colors.status.success}20`,
                                    padding: "3px 6px",
                                    borderRadius: 999,
                                    fontWeight: 800,
                                    letterSpacing: "0.06em",
                                }}
                            >
                                ACTIVE
                            </span>
                        )}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, auto)) minmax(0, 1fr)",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 0,
                            color: THEME.colors.text.secondary,
                            fontSize: 11,
                            lineHeight: 1.1,
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
                                textAlign: "right",
                            }}
                        >
                            {track.artist || ""}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => onDelete(track)}
                    style={{
                        background: "none",
                        border: "none",
                        color: THEME.colors.text.muted,
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "8px 4px",
                        transition: "color 0.2s",
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = THEME.colors.status.error}
                    onMouseLeave={(e) => e.currentTarget.style.color = THEME.colors.text.muted}
                    aria-label={`Eliminar ${track.title}`}
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                ...style,
                display: "grid",
                gridTemplateColumns: "40px 50px 2fr 1.5fr 80px 80px 1fr 80px 50px",
                alignItems: "center",
                padding: "0 16px",
                borderBottom: `1px solid ${THEME.colors.border}`,
                backgroundColor: isThisTrackPreviewing ? "rgba(6, 182, 212, 0.05)" : "transparent",
                color: THEME.colors.text.primary,
                fontSize: "13px",
                transition: "background-color 0.2s",
                height: "56px"
            }}
        >
            <div style={{ display: "flex", justifyContent: "center" }}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectToggle(track.id)}
                    style={{
                        accentColor: THEME.colors.brand.cyan,
                        cursor: "pointer",
                        width: "16px",
                        height: "16px"
                    }}
                />
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                    onClick={() => togglePreview(track)}
                    style={{
                        background: isThisTrackPlaying ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)",
                        border: "none",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isThisTrackPlaying ? "black" : THEME.colors.brand.cyan,
                        fontSize: "14px",
                        transition: "all 0.2s"
                    }}
                >
                    {isThisTrackLoading ? (
                        <LoadingSpinner size={14} color={isThisTrackPlaying ? "black" : THEME.colors.brand.cyan} />
                    ) : (
                        isThisTrackPlaying ? "⏸" : "▶"
                    )}
                </button>
            </div>

            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "10px" }}>
                {track.title}
                {isInRepertoire && (
                    <span style={{
                        marginLeft: "8px",
                        fontSize: "10px",
                        color: THEME.colors.status.success,
                        backgroundColor: `${THEME.colors.status.success}20`,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 800
                    }}>
                        ACTIVE
                    </span>
                )}
            </div>

            <div style={{ color: THEME.colors.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "10px" }}>
                {track.artist || "-"}
            </div>

            <div style={{ fontFamily: THEME.fonts.mono, color: THEME.colors.brand.cyan, textAlign: "center" }}>
                {Math.round(track.bpm || 0) || "-"}
            </div>

            <div style={{ fontFamily: THEME.fonts.mono, color: THEME.colors.brand.violet, textAlign: "center" }}>
                {track.key || "-"}
            </div>

            <div style={{ color: THEME.colors.text.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {track.genre || "-"}
            </div>

            <div style={{ color: THEME.colors.text.secondary, textAlign: "right" }}>
                {formatDuration(track.duration_ms)}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                    onClick={() => onDelete(track)}
                    style={{
                        background: "none",
                        border: "none",
                        color: THEME.colors.text.muted,
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "8px",
                        transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = THEME.colors.status.error}
                    onMouseLeave={(e) => e.currentTarget.style.color = THEME.colors.text.muted}
                    aria-label={`Eliminar ${track.title}`}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
