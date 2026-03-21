import React from "react";

import { CURVES, VENUES } from "../../../data/constants";
import { THEME } from "../../../data/theme";
import { EnergyCurveChart } from "../../../components/common/EnergyCurveChart";
import type { CurveType } from "../../../components/common/EnergyCurveChart";

interface BuilderConfigSectionProps {
    targetMin: number;
    venue: string;
    curve: string;
    onTargetMinChange: (minutes: number) => void;
    onVenueChange: (venue: string) => void;
    onCurveChange: (curve: string) => void;
    onGenerate: () => void;
}

export const BuilderConfigSection: React.FC<BuilderConfigSectionProps> = ({
    targetMin,
    venue,
    curve,
    onTargetMinChange,
    onVenueChange,
    onCurveChange,
    onGenerate,
}) => {
    return (
        <>
            <section>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Set Configuration</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Duration</label>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }} className="duration-grid">
                            {[30, 45, 60, 90, 120].map((minutes) => (
                                <button
                                    key={minutes}
                                    onClick={() => onTargetMinChange(minutes)}
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: THEME.radius.md,
                                        cursor: "pointer",
                                        border: `1px solid ${targetMin === minutes ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                        backgroundColor: targetMin === minutes ? "rgba(6,182,212,0.1)" : THEME.colors.surface,
                                        color: targetMin === minutes ? THEME.colors.brand.cyan : THEME.colors.text.secondary,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        fontFamily: THEME.fonts.mono,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {minutes}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Venue</label>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            {VENUES.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onVenueChange(item.id)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: THEME.radius.md,
                                        cursor: "pointer",
                                        border: `1px solid ${venue === item.id ? item.color + "80" : THEME.colors.border}`,
                                        backgroundColor: venue === item.id ? item.color + "15" : THEME.colors.surface,
                                        color: venue === item.id ? item.color : THEME.colors.text.secondary,
                                        fontWeight: 500,
                                        fontSize: 13,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Energy Curve</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 8 }}>
                            {CURVES.map((item) => {
                                const isActive = curve === item.id;
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => onCurveChange(item.id)}
                                    style={{
                                        padding: "12px 12px 10px",
                                        borderRadius: THEME.radius.md,
                                        cursor: "pointer",
                                        border: `1px solid ${isActive ? THEME.colors.brand.violet + "80" : THEME.colors.border}`,
                                        backgroundColor: isActive ? THEME.colors.brand.violet + "10" : THEME.colors.surface,
                                        color: isActive ? THEME.colors.brand.violet : THEME.colors.text.secondary,
                                        textAlign: "left",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <EnergyCurveChart
                                        type={item.id as CurveType}
                                        size="mini"
                                        active={isActive}
                                    />
                                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{item.label}</div>
                                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{item.desc}</div>
                                </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <div
                style={{
                    position: "relative",
                    padding: "2px",
                    background: THEME.gradients.brand,
                    borderRadius: THEME.radius.xl,
                    boxShadow: `0 8px 32px ${THEME.colors.brand.cyan}20`,
                }}
            >
                <button
                    onClick={onGenerate}
                    style={{
                        width: "100%",
                        padding: "18px",
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: THEME.colors.bg,
                        color: "white",
                        fontSize: 16,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor = THEME.colors.bg;
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Generate {targetMin} Minute Set
                </button>
            </div>
        </>
    );
};
