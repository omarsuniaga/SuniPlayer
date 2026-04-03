import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../data/theme";
import { usePreviewStore } from "../../store/usePreviewStore";
import { LoadingSpinner } from "../common/LoadingSpinner";

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
    
    const isThisTrackPreviewing = previewTrackId === track.id;
    const isThisTrackPlaying = isThisTrackPreviewing && isPlaying;
    const isThisTrackLoading = isThisTrackPreviewing && isLoading;

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

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
            {/* 1. Multi-select Checkbox */}
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

            {/* 2. Play/Pause Button */}
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

            {/* 3. Title */}
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

            {/* 4. Artist */}
            <div style={{ color: THEME.colors.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "10px" }}>
                {track.artist || "-"}
            </div>

            {/* 5. BPM */}
            <div style={{ fontFamily: THEME.fonts.mono, color: THEME.colors.brand.cyan, textAlign: "center" }}>
                {Math.round(track.bpm || 0) || "-"}
            </div>

            {/* 6. Key */}
            <div style={{ fontFamily: THEME.fonts.mono, color: THEME.colors.brand.violet, textAlign: "center" }}>
                {track.key || "-"}
            </div>

            {/* 7. Genre */}
            <div style={{ color: THEME.colors.text.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {track.genre || "-"}
            </div>

            {/* 8. Duration */}
            <div style={{ color: THEME.colors.text.secondary, textAlign: "right" }}>
                {formatDuration(track.duration_ms)}
            </div>

            {/* 9. Delete Button */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                    onClick={() => onDelete(track)}
                    style={{
                        background: "none",
                        border: "none",
                        color: THEME.colors.text.muted,
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "8px",
                        transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = THEME.colors.status.error}
                    onMouseLeave={(e) => e.currentTarget.style.color = THEME.colors.text.muted}
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};
