import React from "react";
import { Track } from "../../types";
import { fmt, mc, ec } from "../../services/uiUtils.ts";
import { THEME } from "../../data/theme.ts";

interface TrackRowProps {
    track: Track;
    idx: number;
    showN?: boolean;
    onAdd?: (track: Track) => void;
    onRm?: (idx: number) => void;
    active?: boolean;
    onClick?: () => void;
    small?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
    track,
    idx,
    showN,
    onAdd,
    onRm,
    active,
    onClick,
    small,
}) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: small ? "8px 12px" : "12px 16px",
                borderRadius: THEME.radius.md,
                cursor: onClick ? "pointer" : "default",
                backgroundColor: active ? `${THEME.colors.brand.cyan}15` : "transparent",
                borderLeft: active ? `3px solid ${THEME.colors.brand.cyan}` : "3px solid transparent",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                fontFamily: THEME.fonts.main,
                position: "relative",
                overflow: "hidden",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.currentTarget as HTMLDivElement;
                if (!active) target.style.backgroundColor = THEME.colors.surfaceHover;
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.backgroundColor = active ? `${THEME.colors.brand.cyan}15` : "transparent";
            }}
        >
            {showN && (
                <span
                    style={{
                        fontSize: 11,
                        color: active ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                        fontFamily: THEME.fonts.mono,
                        width: 24,
                        textAlign: "right",
                        fontWeight: active ? 700 : 400,
                    }}
                >
                    {(idx + 1).toString().padStart(2, '0')}
                </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        color: active ? "white" : THEME.colors.text.primary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {track.title}
                </div>
                <div style={{ fontSize: 12, color: THEME.colors.text.muted, marginTop: 2 }}>{track.artist}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                    style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: THEME.radius.sm,
                        backgroundColor: mc(track.mood) + "12",
                        color: mc(track.mood),
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                    }}
                >
                    {track.key}
                </span>

                <div
                    style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        overflow: "hidden",
                    }}
                    title={`Energy: ${Math.round(track.energy * 100)}%`}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${track.energy * 100}%`,
                            backgroundColor: ec(track.energy),
                            borderRadius: 2,
                        }}
                    />
                </div>

                <span
                    style={{
                        fontSize: 11,
                        color: THEME.colors.text.muted,
                        fontFamily: THEME.fonts.mono,
                        width: 40,
                        textAlign: "right",
                    }}
                >
                    {fmt(track.duration_ms)}
                </span>
            </div>

            <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                {onAdd && (
                    <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onAdd(track);
                        }}
                        style={{
                            background: THEME.colors.surfaceHover,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.sm,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: THEME.colors.brand.cyan,
                            fontSize: 16,
                            fontWeight: 600,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.colors.brand.cyan;
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover;
                            e.currentTarget.style.color = THEME.colors.brand.cyan;
                        }}
                    >
                        +
                    </button>
                )}
                {onRm && (
                    <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onRm(idx);
                        }}
                        style={{
                            background: "rgba(239,68,68,0.05)",
                            border: `1px solid ${THEME.colors.status.error}30`,
                            borderRadius: THEME.radius.sm,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: THEME.colors.status.error,
                            fontSize: 14,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.colors.status.error;
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.05)";
                            e.currentTarget.style.color = THEME.colors.status.error;
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};
