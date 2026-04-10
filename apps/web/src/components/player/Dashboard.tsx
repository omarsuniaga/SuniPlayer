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

    curve?: string;
    curvePlayheadPct?: number;
    curveExpanded: boolean;
    setCurveExpanded: (v: boolean) => void;
    curveVisible: boolean;

    autoNext: boolean;
    playbackGapMs: number;
    setPlaybackGapMs: (v: number) => void;
    playbackGapRemainingMs: number;
    flowExpanded: boolean;
    setFlowExpanded: (v: boolean) => void;
}

const Section: React.FC<{
    accentColor: string; icon: React.ReactNode; title: string; badge?: string;
    expanded: boolean; onToggle: () => void; children: React.ReactNode;
}> = ({ accentColor, icon, title, badge, expanded, onToggle, children }) => (
    <div style={{ borderRadius: THEME.radius.md, border: `1px solid ${accentColor}20`, backgroundColor: `${accentColor}05`, overflow: "hidden" }}>
        <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ color: accentColor, display: "flex" }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.05em", color: accentColor, flex: 1, textAlign: "left", textTransform: "uppercase" }}>{title}</span>
            {badge && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: THEME.fonts.mono, color: accentColor, opacity: 0.6 }}>{badge}</span>}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s", opacity: 0.4 }}><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {expanded && <div style={{ borderTop: `1px solid ${accentColor}10`, padding: "12px" }}>{children}</div>}
    </div>
);

const Presets: React.FC<{ values: number[], current: number, onChange: (v: number) => void, format: (v: number) => string, color: string }> = ({ values, current, onChange, format, color }) => (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {values.map(v => (
            <button key={v} onClick={() => onChange(v)} style={{ fontSize: 9, padding: "4px 8px", borderRadius: 4, border: `1px solid ${current === v ? color + "60" : "rgba(255,255,255,0.05)"}`, background: current === v ? `${color}10` : "transparent", color: current === v ? color : "#666", cursor: "pointer", fontWeight: 700 }}>{format(v)}</button>
        ))}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
    fadeEnabled, fadeInMs, setFadeInMs, fadeOutMs, setFadeOutMs, fadeExpanded, setFadeExpanded,
    crossfade, crossfadeMs, setCrossfadeMs, crossExpanded, setCrossExpanded,
    splMeterEnabled, splMeterTarget, splMeterExpanded, setSplMeterExpanded,
    curve, curvePlayheadPct, curveExpanded, setCurveExpanded, curveVisible,
    autoNext, playbackGapMs, setPlaybackGapMs, playbackGapRemainingMs, flowExpanded, setFlowExpanded,
}) => {
    const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* ── FLOW ── */}
            {autoNext && (
                <Section accentColor="#fbbf24" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12h20M17 7l5 5-5 5M2 12l5-5M2 12l5 5"/></svg>}
                    title="FLUJO AUTOMÁTICO" badge={playbackGapRemainingMs > 0 ? `ESPERANDO: ${(playbackGapRemainingMs / 1000).toFixed(1)}s` : `GAP: ${fmtMs(playbackGapMs)}`}
                    expanded={flowExpanded} onToggle={() => setFlowExpanded(!flowExpanded)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>TIEMPO DE ESPERA</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: "#fbbf24" }}>{fmtMs(playbackGapMs)}</span>
                        </div>
                        <Presets values={[0, 1000, 2000, 3000, 5000]} current={playbackGapMs} onChange={setPlaybackGapMs} format={fmtMs} color="#fbbf24" />
                    </div>
                </Section>
            )}

            {/* ── CROSSFADE ── */}
            {crossfade && (
                <Section accentColor={THEME.colors.brand.cyan} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>}
                    title="MEZCLA (CROSSFADE)" badge={fmtMs(crossfadeMs)}
                    expanded={crossExpanded} onToggle={() => setCrossExpanded(!crossExpanded)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>DURACIÓN DEL CRUCE</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: THEME.colors.brand.cyan }}>{fmtMs(crossfadeMs)}</span>
                        </div>
                        <Presets values={[1000, 2000, 3000, 5000, 8000]} current={crossfadeMs} onChange={setCrossfadeMs} format={fmtMs} color={THEME.colors.brand.cyan} />
                    </div>
                </Section>
            )}

            {/* ── FADES ── */}
            {fadeEnabled && (
                <Section accentColor={THEME.colors.brand.cyan} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 20c.6-1 2.1-3.9 3.2-5.2m11.2-10.3c1.2-1.3 2.7-4.2 3.2-5.2"/><path d="M2 10s3-3 10-3 10 3 10 3-3 3-10 3-10-3-10-3Z"/></svg>}
                    title="CURVAS DE FADE" badge={`↑${(fadeInMs/1000).toFixed(1)}s · ↓${(fadeOutMs/1000).toFixed(1)}s`}
                    expanded={fadeExpanded} onToggle={() => setFadeExpanded(!fadeExpanded)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>FADE IN</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: THEME.colors.brand.cyan }}>{fmtMs(fadeInMs)}</span>
                        </div>
                        <Presets values={[0, 500, 1000, 2000, 3000]} current={fadeInMs} onChange={setFadeInMs} format={fmtMs} color={THEME.colors.brand.cyan} />
                        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)" }}/>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>FADE OUT</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: THEME.colors.brand.cyan }}>{fmtMs(fadeOutMs)}</span>
                        </div>
                        <Presets values={[0, 500, 1000, 2000, 3000]} current={fadeOutMs} onChange={setFadeOutMs} format={fmtMs} color={THEME.colors.brand.cyan} />
                    </div>
                </Section>
            )}

            {/* ── ENERGY ── */}
            {curve && curveVisible && (
                <Section accentColor={THEME.colors.brand.violet} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 17 Q7 5 12 12 Q17 19 21 7"/></svg>}
                    title="CURVA DE ENERGÍA" badge={CURVE_LABEL[curve] ?? curve}
                    expanded={curveExpanded} onToggle={() => setCurveExpanded(!curveExpanded)}>
                    <EnergyCurveChart type={curve as CurveType} size="mini" playheadPct={curvePlayheadPct} active />
                </Section>
            )}

            {/* ── SPL METER ── */}
            {splMeterEnabled && (
                <Section accentColor={THEME.colors.brand.violet} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v3m0 14v3M4.93 4.93l2.12 2.12m10.6 10.6l2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m10.6-10.6l2.12-2.12"/></svg>}
                    title="SONÓMETRO (SPL)" expanded={splMeterExpanded} onToggle={() => setSplMeterExpanded(!splMeterExpanded)}>
                    <SplMeter target={splMeterTarget} expanded={splMeterExpanded} onToggleExpand={() => setSplMeterExpanded(!splMeterExpanded)} />
                </Section>
            )}
        </div>
    );
};
