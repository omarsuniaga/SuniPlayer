// src/features/player/ui/PlayerBanners.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    isLive: boolean;
    isSimulating: boolean;
    playing: boolean;
}

export const PlayerBanners: React.FC<Props> = ({ isLive, isSimulating, playing }) => (
    <>
        {/* â”€â”€ Live Lock Banner â”€â”€ */}
        {isLive && (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: THEME.radius.md,
                    backgroundColor: `${THEME.colors.brand.cyan}08`,
                    border: `1px solid ${THEME.colors.brand.cyan}25`,
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ fontSize: 12, color: THEME.colors.brand.cyan, fontWeight: 700, letterSpacing: "0.04em" }}>
                    LIVE LOCK ACTIVO â€” La reproducciÃ³n estÃ¡ protegida
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: THEME.colors.text.muted }}>
                    Espacio para pausar Â· Flechas bloqueadas
                </span>
            </div>
        )}

        {/* â”€â”€ Simulation Mode Indicator â”€â”€ */}
        {isSimulating && playing && (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: THEME.radius.md,
                    backgroundColor: `${THEME.colors.status.warning}08`,
                    border: `1px solid ${THEME.colors.status.warning}30`,
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: 11, color: THEME.colors.status.warning, fontWeight: 700, letterSpacing: "0.04em" }}>
                    MODO SIMULACIÃ“N â€” Sin archivos de audio reales
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: THEME.colors.text.muted }}>
                    Usa la pestaÃ±a "Library" para seleccionar tu mÃºsica local
                </span>
            </div>
        )}
    </>
);
