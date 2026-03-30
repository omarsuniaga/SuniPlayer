// src/features/player/ui/PlayerSetFooter.tsx
import React from "react";
import { Track } from \"@suniplayer/core\";
import { THEME } from "../../../data/theme.ts";
import { fmtM } from \"@suniplayer/core\";
import { sumTrackDurationMs } from \"@suniplayer/core\";

interface Props {
    pQueue: Track[];
    ci: number;
    pos: number;
    qTot: number;
    isLive: boolean;
    mCol: string;
    onExport: () => void;
    onModeToggle: () => void;
}

export const PlayerSetFooter: React.FC<Props> = ({ pQueue, ci, pos, qTot, isLive, mCol, onExport, onModeToggle }) => (
    <div style={{
        marginTop: "auto", padding: "24px",
        borderRadius: THEME.radius.xl,
        backgroundColor: THEME.colors.surface,
        border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
        display: "flex", alignItems: "center", gap: 20,
        transition: "border-color 0.4s",
    }}>
        <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.text.muted }}>SET PROGRESS</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: mCol, fontFamily: THEME.fonts.mono }}>{fmtM(qTot)} TOTAL</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div
                    style={{
                        height: "100%",
                        width: `${Math.min(100, (sumTrackDurationMs(pQueue.slice(0, ci)) + pos) / (qTot || 1) * 100)}%`,
                        background: THEME.gradients.brand,
                        transition: "width 0.5s ease-out",
                    }}
                />
            </div>
        </div>

        {/* Export Set Button — Edit mode only */}
        {!isLive && (
            <button
                onClick={onExport}
                title="Exportar lista del set como .txt"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: THEME.radius.full,
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    border: `1px solid ${THEME.colors.border}`,
                    color: THEME.colors.text.muted,
                    transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = THEME.colors.brand.violet + "60";
                    e.currentTarget.style.color = THEME.colors.brand.violet;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = THEME.colors.border;
                    e.currentTarget.style.color = THEME.colors.text.muted;
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Export</span>
            </button>
        )}

        {/* Mode Toggle Button */}
        <button
            onClick={onModeToggle}
            title={isLive ? "Haz clic para desbloquear (pedirá confirmación)" : "Activar modo Live — bloquea la reproducción"}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: THEME.radius.full,
                cursor: "pointer",
                backgroundColor: isLive ? THEME.colors.brand.cyan + "15" : THEME.colors.surfaceHover,
                border: `1px solid ${isLive ? THEME.colors.brand.cyan + "50" : THEME.colors.border}`,
                transition: "all 0.25s",
                boxShadow: isLive ? `0 0 20px ${THEME.colors.brand.cyan}10` : "none",
            }}
        >
            {isLive
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.text.muted} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
            }
            <span style={{ fontSize: 12, color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontWeight: 700 }}>
                {isLive ? "LIVE" : "EDIT"}
            </span>
        </button>
    </div>
);
