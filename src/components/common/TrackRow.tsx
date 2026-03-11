import React from "react";
import { Track } from "../../types";
import { fmt, mc, ec, getEffectiveDuration } from "../../services/uiUtils.ts";
import { THEME } from "../../data/theme.ts";

interface TrackRowProps {
    track: Track;
    idx: number;
    showN?: boolean;
    onAdd?: (track: Track) => void;
    onRm?: (idx: number) => void;
    active?: boolean;
    onClick?: () => void;
    onTrim?: (track: Track) => void;
    onEdit?: (track: Track) => void;
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
    onTrim,
    onEdit,
    small,
}) => {
    return (
        <div
            onClick={onClick}
            className={`track-row ${active ? 'active' : ''}`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: small ? 8 : 12,
                padding: small ? "8px 10px" : "12px 14px",
                borderRadius: THEME.radius.md,
                cursor: onClick ? "pointer" : "default",
                backgroundColor: active ? `${THEME.colors.brand.cyan}15` : "transparent",
                borderLeft: active ? `3px solid ${THEME.colors.brand.cyan}` : "3px solid transparent",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                fontFamily: THEME.fonts.main,
                position: "relative",
                overflow: "hidden",
                minWidth: 0,
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
            <style>{`
                .track-row { min-width: 0; }
                .track-info { flex: 1; min-width: 0; }
                .track-meta { display: flex; align-items: center; gap: 8; flex-shrink: 0; }
                .track-actions { display: flex; gap: 4; margin-left: 8; flex-shrink: 0; }
                
                @media (max-width: 540px) {
                    .meta-energy { display: none !important; }
                    .meta-key { font-size: 9px !important; padding: 1px 4px !important; }
                    .track-meta { gap: 6px; }
                    .track-actions { gap: 2px; margin-left: 4px; }
                    .action-btn { width: 24px !important; height: 24px !important; }
                    .action-btn svg { width: 12px !important; height: 12px !important; }
                }
            `}</style>
            
            {showN && (
                <span
                    style={{
                        fontSize: 11,
                        color: active ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                        fontFamily: THEME.fonts.mono,
                        width: 20,
                        textAlign: "right",
                        fontWeight: active ? 700 : 400,
                        flexShrink: 0,
                    }}
                >
                    {(idx + 1).toString().padStart(2, '0')}
                </span>
            )}

            <div className="track-info">
                <div
                    style={{
                        fontSize: small ? 13 : 14,
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
                <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {track.artist}
                </div>
            </div>

            <div className="track-meta">
                <span
                    className="meta-key"
                    style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: THEME.radius.sm,
                        backgroundColor: mc(track.mood) + "12",
                        color: mc(track.mood),
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        flexShrink: 0,
                    }}
                 >
                    {track.key}
                </span>

                <div
                    className="meta-energy"
                    style={{
                        width: 32,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        overflow: "hidden",
                        flexShrink: 0,
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
                        fontSize: 10,
                        color: THEME.colors.text.muted,
                        fontFamily: THEME.fonts.mono,
                        minWidth: 32,
                        textAlign: "right",
                        flexShrink: 0,
                    }}
                >
                    {fmt(getEffectiveDuration(track))}
                </span>
            </div>

            <div className="track-actions">
                {onTrim && (
                    <button
                        className="action-btn"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onTrim(track);
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
                            color: THEME.colors.text.muted,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = THEME.colors.brand.cyan;
                            e.currentTarget.style.borderColor = THEME.colors.brand.cyan + "40";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = THEME.colors.text.muted;
                            e.currentTarget.style.borderColor = THEME.colors.border;
                        }}
                        title="Recortar inicio/fin"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                            <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                            <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                    </button>
                )}
                {onEdit && (
                    <button
                        className="action-btn"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onEdit(track);
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
                            color: THEME.colors.text.muted,
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = THEME.colors.brand.violet;
                            e.currentTarget.style.borderColor = THEME.colors.brand.violet + "40";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = THEME.colors.text.muted;
                            e.currentTarget.style.borderColor = THEME.colors.border;
                        }}
                        title="Ver perfil y editar track"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                )}
                {onAdd && (
                    <button
                        className="action-btn"
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
                        className="action-btn"
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

