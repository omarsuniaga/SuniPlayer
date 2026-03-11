// src/features/player/ui/PlayerEmptyState.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    onQuickLoad: () => void;
    onGoToBuilder: () => void;
}

export const PlayerEmptyState: React.FC<Props> = ({ onQuickLoad, onGoToBuilder }) => (
    <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 24, padding: 40, textAlign: "center",
    }}>
        <div style={{
            width: 80, height: 80, borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: `1px solid ${THEME.colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13M9 10L21 8M6 15a3 3 0 100 6 3 3 0 000-6zm12-2a3 3 0 100 6 3 3 0 000-6z" />
            </svg>
        </div>
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No hay set cargado</h2>
            <p style={{ fontSize: 14, color: THEME.colors.text.muted, margin: 0, lineHeight: 1.6 }}>
                Genera un set en el Builder y pulsa<br />
                <strong style={{ color: THEME.colors.text.secondary }}>"Send to Player"</strong>, o carga uno rápido aquí.
            </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
            <button
                onClick={onQuickLoad}
                style={{
                    padding: "14px", borderRadius: THEME.radius.md, border: "none",
                    background: THEME.gradients.brand, color: "white", fontSize: 14,
                    fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: `0 8px 24px ${THEME.colors.brand.cyan}30`,
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Generar Set Rápido (45 min)
            </button>
            <button
                onClick={onGoToBuilder}
                style={{
                    padding: "12px", borderRadius: THEME.radius.md,
                    border: `1px solid ${THEME.colors.border}`,
                    backgroundColor: "transparent", color: THEME.colors.text.secondary,
                    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
                Ir al Builder →
            </button>
        </div>
    </div>
);
