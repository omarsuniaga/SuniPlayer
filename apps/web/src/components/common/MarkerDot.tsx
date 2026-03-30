import React, { useState } from "react";
import type { TrackMarker } from "@suniplayer/core";

interface MarkerDotProps {
    marker: TrackMarker;
    durationMs: number;
    onClick: (marker: TrackMarker) => void;
}

export const MarkerDot: React.FC<MarkerDotProps> = ({ marker, durationMs, onClick }) => {
    const [hovered, setHovered] = useState(false);
    const leftPct = durationMs > 0 ? (marker.posMs / durationMs) * 100 : 0;
    const truncated = marker.comment.length > 40
        ? marker.comment.slice(0, 40) + "…"
        : marker.comment;

    return (
        <div
            style={{
                position: "absolute",
                left: `${leftPct}%`,
                bottom: 0,
                transform: "translateX(-50%)",
                zIndex: 10,
                cursor: "pointer",
            }}
            onClick={(e) => { e.stopPropagation(); onClick(marker); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Red dot */}
            <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                boxShadow: "0 0 4px rgba(239,68,68,0.7)",
                transition: "transform 0.15s",
                transform: hovered ? "scale(1.5)" : "scale(1)",
            }} />

            {/* Tooltip */}
            {hovered && marker.comment && (
                <div style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(15,15,20,0.95)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    color: "white",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}>
                    {truncated}
                </div>
            )}
        </div>
    );
};
