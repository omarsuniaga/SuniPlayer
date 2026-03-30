import React from "react";
import { THEME } from "../../data/theme.ts";
import { SplMeter } from "../common/SplMeter";
import { EnergyCurveChart } from "../common/EnergyCurveChart";
import type { CurveType } from "../common/EnergyCurveChart";

const CURVE_LABEL: Record<string, string> = {
    steady: "Estable", ascending: "Ascendente",
    descending: "Descendente", wave: "Ola",
};

interface DashboardProps {
    fadeEnabled: boolean;
    fadeInMs: number;
    setFadeInMs: (v: number) => void;
    fadeOutMs: number;
    setFadeOutMs: (v: number) => void;
    fadeExpanded: boolean;
    setFadeExpanded: (v: boolean) => void;

    crossfade: boolean;
    crossfadeMs: number;
    setCrossfadeMs: (v: number) => void;
    crossExpanded: boolean;
    setCrossExpanded: (v: boolean) => void;

    splMeterEnabled: boolean;
    splMeterTarget: "studio" | "small" | "hall" | "open";
    splMeterExpanded: boolean;
    setSplMeterExpanded: (v: boolean) => void;

    /** Energy curve of the current set (e.g. "steady", "ascending") */
    curve?: string;
    /** 0–1: how far through the set we are (for the playhead dot) */
    curvePlayheadPct?: number;
    curveExpanded: boolean;
    setCurveExpanded: (v: boolean) => void;
    /** When false, the Energy Curve section is hidden regardless of curve value */
    curveVisible: boolean;
}

// ── Reusable section container ────────────────────────────────────────────────
const Section: React.FC<{
    active?: boolean;
    accentColor: string;
    icon: React.ReactNode;
    title: string;
    badge?: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ accentColor, icon, title, badge, expanded, onToggle, children }) => (
    <div style={{
        borderRadius: THEME.radius.lg,
        border: `1px solid ${accentColor}28`,
        backgroundColor: `${accentColor}05`,
        overflow: "hidden",
        transition: "border-color 0.2s",
    }}>
        {/* Header */}
        <button
            onClick={onToggle}
            style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "14px 16px", background: "none", border: "none", // Aumentado padding
                cursor: "pointer", color: "white",
            }}
        >
            <span style={{ color: accentColor, display: "flex", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: accentColor, flex: 1, textAlign: "left" }}>
                {title}
            </span>
            {badge && (
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: THEME.fonts.mono, color: accentColor, opacity: 0.7 }}>
                    {badge}
                </span>
            )}
            <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={accentColor} strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", opacity: 0.6, flexShrink: 0 }}
            >
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </button>

        {/* Body */}
        {expanded && (
            <div style={{ borderTop: `1px solid ${accentColor}15` }}>
                {children}
            </div>
        )}
    </div>
);

// ── Quick preset pills ────────────────────────────────────────────────────────
const Presets: React.FC<{
    values: number[];
    current: number;
    onChange: (v: number) => void;
    format: (v: number) => string;
    color: string;
}> = ({ values, current, onChange, format, color }) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {values.map(v => (
            <button
                key={v}
                onClick={() => onChange(v)}
                style={{
                    fontSize: 11, padding: "6px 12px", borderRadius: THEME.radius.sm, // Aumentado padding y font
                    border: `1px solid ${current === v ? color + "60" : "rgba(255,255,255,0.08)"}`,
                    background: current === v ? `${color}15` : "rgba(255,255,255,0.03)",
                    color: current === v ? color : THEME.colors.text.muted,
                    cursor: "pointer", fontWeight: 700, fontFamily: THEME.fonts.mono,
                    transition: "all 0.15s",
                }}
            >{format(v)}</button>
        ))}
    </div>
);

// ── Slider row ────────────────────────────────────────────────────────────────
const SliderRow: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    displayValue: string;
    color: string;
    fillPct: number;
}> = ({ label, value, min, max, step, onChange, displayValue, color, fillPct }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: THEME.colors.text.muted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 900, fontFamily: THEME.fonts.mono, color }}>{displayValue}</span>
        </div>
        <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}> 
            {/* Height aumentado de 20 a 32 para mejor captura táctil */}
            <div style={{ position: "absolute", left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.07)" }}/>
            <div style={{ position: "absolute", left: 0, height: 6, borderRadius: 3, width: `${fillPct * 100}%`, background: `linear-gradient(to right, ${color}80, ${color})` }}/>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                style={{ position: "relative", width: "100%", appearance: "none", height: 32, background: "transparent", cursor: "pointer", outline: "none" }}
            />
        </div>
    </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({
    fadeEnabled, fadeInMs, setFadeInMs, fadeOutMs, setFadeOutMs, fadeExpanded, setFadeExpanded,
    crossfade, crossfadeMs, setCrossfadeMs, crossExpanded, setCrossExpanded,
    splMeterEnabled, splMeterTarget, splMeterExpanded, setSplMeterExpanded,
    curve, curvePlayheadPct, curveExpanded, setCurveExpanded, curveVisible,
}) => {
    if (!crossfade && !fadeEnabled && !splMeterEnabled && !curve) return null;

    const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* ── CROSSFADE ──────────────────────────────────────────── */}
            {crossfade && (
                <Section
                    accentColor={THEME.colors.brand.cyan}
                    icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                        </svg>
                    }
                    title="CROSSFADE"
                    badge={fmtMs(crossfadeMs)}
                    expanded={crossExpanded}
                    onToggle={() => setCrossExpanded(!crossExpanded)}
                >
                    <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Visual crossfade diagram */}
                        <div style={{
                            position: "relative", height: 56, borderRadius: THEME.radius.md,
                            overflow: "hidden", backgroundColor: "rgba(0,0,0,0.25)",
                        }}>
                            {/* Gradient fills */}
                            <div style={{
                                position: "absolute", inset: 0,
                                background: `linear-gradient(to right, ${THEME.colors.brand.cyan}50 0%, ${THEME.colors.brand.cyan}00 55%, ${THEME.colors.brand.violet}00 45%, ${THEME.colors.brand.violet}50 100%)`,
                            }}/>
                            {/* Crossfade lines */}
                            <svg
                                viewBox="0 0 200 56" preserveAspectRatio="none"
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                            >
                                {/* Song A: full then fades out */}
                                <polyline
                                    points="0,12 80,12 160,48"
                                    fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2" strokeLinecap="round"
                                />
                                {/* Song B: fades in then full */}
                                <polyline
                                    points="40,48 120,12 200,12"
                                    fill="none" stroke={THEME.colors.brand.violet} strokeWidth="2" strokeLinecap="round"
                                />
                                {/* Overlap zone */}
                                <rect x="80" y="0" width="80" height="56" fill="rgba(255,255,255,0.03)"/>
                            </svg>
                            {/* Labels */}
                            <div style={{
                                position: "absolute", inset: 0, display: "flex",
                                alignItems: "center", justifyContent: "space-between",
                                padding: "0 12px", pointerEvents: "none",
                            }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: THEME.colors.brand.cyan, textTransform: "uppercase", letterSpacing: 1 }}>
                                    Canción A ↘
                                </span>
                                <span style={{ fontSize: 9, fontWeight: 800, color: THEME.colors.brand.violet, textTransform: "uppercase", letterSpacing: 1 }}>
                                    ↗ Canción B
                                </span>
                            </div>
                            {/* Duration pill */}
                            <div style={{
                                position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
                                padding: "2px 8px", borderRadius: 4,
                                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                                fontSize: 9, fontWeight: 700, fontFamily: THEME.fonts.mono,
                                color: "rgba(255,255,255,0.6)", letterSpacing: 1,
                            }}>
                                {fmtMs(crossfadeMs)}
                            </div>
                        </div>

                        {/* Duration slider */}
                        <SliderRow
                            label="Duración del cruce"
                            value={crossfadeMs}
                            min={500} max={10000} step={250}
                            onChange={setCrossfadeMs}
                            displayValue={fmtMs(crossfadeMs)}
                            color={THEME.colors.brand.cyan}
                            fillPct={(crossfadeMs - 500) / (10000 - 500)}
                        />

                        {/* Quick presets */}
                        <Presets
                            values={[500, 1000, 2000, 3000, 5000, 8000]}
                            current={crossfadeMs}
                            onChange={setCrossfadeMs}
                            format={fmtMs}
                            color={THEME.colors.brand.cyan}
                        />

                        {/* Description */}
                        <p style={{ margin: 0, fontSize: 10, color: THEME.colors.text.muted, lineHeight: 1.6 }}>
                            La canción activa hará un{" "}
                            <strong style={{ color: THEME.colors.brand.cyan }}>fadeOut</strong> y la siguiente un{" "}
                            <strong style={{ color: THEME.colors.brand.violet }}>fadeIn</strong>{" "}
                            durante los últimos {fmtMs(crossfadeMs)} de la canción.
                        </p>
                    </div>
                </Section>
            )}

            {/* ── FADE ───────────────────────────────────────────────── */}
            {fadeEnabled && (
                <Section
                    accentColor={THEME.colors.brand.cyan}
                    icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 20c.6-1 2.1-3.9 3.2-5.2m11.2-10.3c1.2-1.3 2.7-4.2 3.2-5.2"/>
                            <path d="M2 10s3-3 10-3 10 3 10 3-3 3-10 3-10-3-10-3Z"/>
                        </svg>
                    }
                    title="FADE CURVES"
                    badge={`↑${(fadeInMs/1000).toFixed(1)}s · ↓${(fadeOutMs/1000).toFixed(1)}s`}
                    expanded={fadeExpanded}
                    onToggle={() => setFadeExpanded(!fadeExpanded)}
                >
                    <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                        <SliderRow
                            label="Fade In"
                            value={fadeInMs}
                            min={0} max={5000} step={100}
                            onChange={setFadeInMs}
                            displayValue={fmtMs(fadeInMs)}
                            color={THEME.colors.brand.cyan}
                            fillPct={fadeInMs / 5000}
                        />
                        <Presets
                            values={[0, 500, 1000, 2000, 3000]}
                            current={fadeInMs}
                            onChange={setFadeInMs}
                            format={fmtMs}
                            color={THEME.colors.brand.cyan}
                        />
                        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }}/>
                        <SliderRow
                            label="Fade Out"
                            value={fadeOutMs}
                            min={0} max={5000} step={100}
                            onChange={setFadeOutMs}
                            displayValue={fmtMs(fadeOutMs)}
                            color={THEME.colors.brand.cyan}
                            fillPct={fadeOutMs / 5000}
                        />
                        <Presets
                            values={[0, 500, 1000, 2000, 3000]}
                            current={fadeOutMs}
                            onChange={setFadeOutMs}
                            format={fmtMs}
                            color={THEME.colors.brand.cyan}
                        />
                    </div>
                </Section>
            )}

            {/* ── ENERGY CURVE ───────────────────────────────────────── */}
            {curve && curveVisible && (
                <Section
                    accentColor={THEME.colors.brand.violet}
                    icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M3 17 Q7 5 12 12 Q17 19 21 7"/>
                        </svg>
                    }
                    title="ENERGY CURVE"
                    badge={CURVE_LABEL[curve] ?? curve}
                    expanded={curveExpanded}
                    onToggle={() => setCurveExpanded(!curveExpanded)}
                >
                    <div style={{ padding: "14px 14px 16px" }}>
                        <EnergyCurveChart
                            type={curve as CurveType}
                            size="large"
                            playheadPct={curvePlayheadPct}
                            active
                        />
                        <p style={{ margin: "10px 0 0", fontSize: 10, color: THEME.colors.text.muted, lineHeight: 1.6 }}>
                            El punto indica en qué parte de la curva de energía estás dentro del set completo.
                        </p>
                    </div>
                </Section>
            )}

            {/* ── SPL METER ──────────────────────────────────────────── */}
            {splMeterEnabled && (
                <Section
                    accentColor={THEME.colors.brand.violet}
                    icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v3m0 14v3M4.93 4.93l2.12 2.12m10.6 10.6l2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m10.6-10.6l2.12-2.12"/>
                        </svg>
                    }
                    title="SPL METER"
                    expanded={splMeterExpanded}
                    onToggle={() => setSplMeterExpanded(!splMeterExpanded)}
                >
                    <div style={{ padding: "14px" }}>
                        <SplMeter
                            target={splMeterTarget}
                            expanded={splMeterExpanded}
                            onToggleExpand={() => setSplMeterExpanded(!splMeterExpanded)}
                        />
                    </div>
                </Section>
            )}
        </div>
    );
};
