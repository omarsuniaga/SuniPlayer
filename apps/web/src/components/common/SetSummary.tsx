import React from "react";
import { Track } from \"@suniplayer/core\";
import { fmtM, getEffectiveDuration } from \"@suniplayer/core\";
import { THEME } from "../../data/theme.ts";

interface SetSummaryProps {
    tracks: Track[];
    target: number;
}

export const SetSummary: React.FC<SetSummaryProps> = ({ tracks, target }) => {
    const tot = tracks.reduce((s, t) => s + getEffectiveDuration(t), 0);
    const diff = tot - (target * 1000);
    const dc = Math.abs(diff) <= 60000 ? "#10B981" : Math.abs(diff) <= 180000 ? "#F59E0B" : "#EF4444";
    const dl = diff === 0 ? "Exacto" : diff > 0 ? "+" + fmtM(diff) : "-" + fmtM(Math.abs(diff));
    const ae = tracks.length ? tracks.reduce((s: number, t: Track) => s + t.energy, 0) / tracks.length : 0;

    return (
        <div
            className="set-summary-grid"
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 12,
                padding: "16px",
                borderRadius: THEME.radius.lg,
                backgroundColor: THEME.colors.surface,
                border: `1px solid ${THEME.colors.border}`,
                fontFamily: THEME.fonts.main,
            }}
        >
            <style>{`
                @media (max-width: 480px) {
                    .set-summary-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }
            `}</style>
            <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Duracion
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: THEME.fonts.mono }}>{fmtM(tot)}</div>
            </div>
            <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    vs Objetivo
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: THEME.fonts.mono, color: dc }}>
                    {dl}
                </div>
            </div>
            <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Tracks
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: THEME.fonts.mono }}>{tracks.length}</div>
            </div>
            <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Energia
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${ae * 100}%`,
                                borderRadius: 3,
                                background: `linear-gradient(90deg,${THEME.colors.brand.cyan},${THEME.colors.status.warning},${THEME.colors.status.error})`,
                            }}
                        />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: THEME.fonts.mono, color: "rgba(255,255,255,0.4)" }}>
                        {(ae * 10).toFixed(1)}
                    </span>
                </div>
            </div>
        </div >
    );
};
