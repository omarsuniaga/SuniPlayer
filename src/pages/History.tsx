import React from "react";
import { useProjectStore } from "../store/useProjectStore";
import { THEME } from "../data/theme.ts";
import { fmtM } from "../services/uiUtils.ts";

export const History: React.FC = () => {
    const s = useProjectStore();

    return (
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }} className="main-content">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Session History</h2>
                    <p style={{ color: THEME.colors.text.muted, fontSize: 14, marginTop: 4 }}>Your recently generated and saved sets</p>
                </div>
                {s.history.length > 0 && (
                    <button
                        onClick={s.clearHistory}
                        style={{
                            padding: "8px 16px",
                            borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.status.error}30`,
                            backgroundColor: `${THEME.colors.status.error}10`,
                            color: THEME.colors.status.error,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = `${THEME.colors.status.error}20`}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = `${THEME.colors.status.error}10`}
                    >
                        Clear All
                    </button>
                )}
            </header>

            {!s.history.length ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${THEME.colors.border}`, borderRadius: THEME.radius.xl, color: THEME.colors.text.muted }}>
                    No sets saved yet. Generate some in the Builder!
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
                    {s.history.map((hist) => (
                        <div
                            key={hist.id}
                            style={{
                                padding: "20px",
                                borderRadius: THEME.radius.xl,
                                backgroundColor: THEME.colors.surface,
                                border: `1px solid ${THEME.colors.border}`,
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{hist.name}</h3>
                                    <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 4 }}>{hist.date}</div>
                                </div>
                                <div style={{ fontFamily: THEME.fonts.mono, fontSize: 18, fontWeight: 700, color: THEME.colors.brand.cyan }}>
                                    {fmtM(hist.total)}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {hist.tracks.slice(0, 6).map((t, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            fontSize: 10,
                                            padding: "4px 8px",
                                            borderRadius: THEME.radius.sm,
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                            color: THEME.colors.text.muted,
                                            border: `1px solid ${THEME.colors.border}`,
                                        }}
                                    >
                                        {t.title}
                                    </span>
                                ))}
                                {hist.tracks.length > 6 && (
                                    <span style={{ fontSize: 10, padding: "4px 8px", color: THEME.colors.text.muted }}>
                                        + {hist.tracks.length - 6} more
                                    </span>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                                <button
                                    onClick={() => {
                                        s.setGenSet(hist.tracks);
                                        s.setTargetMin(hist.target / 60);
                                        s.setVenue(hist.venue);
                                        s.setCurve(hist.curve);
                                        s.setView("builder");
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: THEME.radius.md,
                                        border: `1px solid ${THEME.colors.brand.cyan}40`,
                                        backgroundColor: "transparent",
                                        color: THEME.colors.brand.cyan,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        s.setPQueue(hist.tracks);
                                        s.setCi(0);
                                        s.setPos(0);
                                        s.setTTarget(hist.target);
                                        s.setElapsed(0);
                                        s.setView("player");
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: THEME.radius.md,
                                        border: "none",
                                        background: THEME.gradients.brand,
                                        color: "white",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        boxShadow: `0 4px 12px ${THEME.colors.brand.cyan}20`,
                                    }}
                                >
                                    Recall & Play
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
