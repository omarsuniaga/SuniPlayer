import React from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { THEME } from "../../data/theme.ts";

// ── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: `1px solid ${THEME.colors.border}` }}>
        <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.text.primary }}>{label}</div>
            {description && <div style={{ fontSize: 12, color: THEME.colors.text.muted, marginTop: 3 }}>{description}</div>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: 44, height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                backgroundColor: checked ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)",
                position: "relative",
                flexShrink: 0,
                transition: "background-color 0.2s",
            }}
        >
            <span style={{
                position: "absolute",
                top: 3, left: checked ? 23 : 3,
                width: 18, height: 18,
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
        </button>
    </div>
);

// ── Slider Row ───────────────────────────────────────────────────────────────
const SliderRow: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
    step?: number;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, unit = "", step = 1, onChange }) => (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${THEME.colors.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.brand.cyan, fontWeight: 700 }}>
                {value}{unit}
            </span>
        </div>
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{
                width: "100%", appearance: "none", height: 4, borderRadius: 2,
                background: `linear-gradient(to right, ${THEME.colors.brand.cyan} ${(value - min) / (max - min) * 100}%, rgba(255,255,255,0.1) ${(value - min) / (max - min) * 100}%)`,
                outline: "none", cursor: "pointer",
            }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: THEME.colors.text.muted }}>{min}{unit}</span>
            <span style={{ fontSize: 10, color: THEME.colors.text.muted }}>{max}{unit}</span>
        </div>
    </div>
);

// ── Section Header ───────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0 8px" }}>
        <div style={{ color: THEME.colors.brand.cyan }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: THEME.colors.text.muted }}>
            {title}
        </span>
    </div>
);

// ── Settings Panel ───────────────────────────────────────────────────────────
export const SettingsPanel: React.FC = () => {
    const showSettings = useProjectStore(s => s.showSettings);
    const setShowSettings = useProjectStore(s => s.setShowSettings);
    const autoNext = useProjectStore(s => s.autoNext);
    const setAutoNext = useProjectStore(s => s.setAutoNext);
    const crossfade = useProjectStore(s => s.crossfade);
    const setCrossfade = useProjectStore(s => s.setCrossfade);
    const crossfadeMs = useProjectStore(s => s.crossfadeMs);
    const setCrossfadeMs = useProjectStore(s => s.setCrossfadeMs);
    const bpmMin = useProjectStore(s => s.bpmMin);
    const setBpmMin = useProjectStore(s => s.setBpmMin);
    const bpmMax = useProjectStore(s => s.bpmMax);
    const setBpmMax = useProjectStore(s => s.setBpmMax);
    const defaultVol = useProjectStore(s => s.defaultVol);
    const setDefaultVol = useProjectStore(s => s.setDefaultVol);
    const targetMin = useProjectStore(s => s.targetMin);
    const setTargetMin = useProjectStore(s => s.setTargetMin);
    const vol = useProjectStore(s => s.vol);
    const setVol = useProjectStore(s => s.setVol);
    const fadeEnabled = useProjectStore(s => s.fadeEnabled);
    const setFadeEnabled = useProjectStore(s => s.setFadeEnabled);
    const fadeInMs = useProjectStore(s => s.fadeInMs);
    const setFadeInMs = useProjectStore(s => s.setFadeInMs);
    const fadeOutMs = useProjectStore(s => s.fadeOutMs);
    const setFadeOutMs = useProjectStore(s => s.setFadeOutMs);
    const splMeterEnabled = useProjectStore(s => s.splMeterEnabled);
    const setSplMeterEnabled = useProjectStore(s => s.setSplMeterEnabled);
    const splMeterTarget = useProjectStore(s => s.splMeterTarget);
    const setSplMeterTarget = useProjectStore(s => s.setSplMeterTarget);

    if (!showSettings) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setShowSettings(false)}
                style={{
                    position: "fixed", inset: 0,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 800,
                    animation: "fadeIn 0.15s ease-out",
                }}
            />

            {/* Drawer */}
            <div style={{
                position: "fixed",
                top: 0, right: 0, bottom: 0,
                width: "min(400px, 92vw)",
                backgroundColor: "#0D1117",
                borderLeft: `1px solid ${THEME.colors.border}`,
                zIndex: 810,
                display: "flex",
                flexDirection: "column",
                animation: "slideInRight 0.25s ease-out",
                boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}>
                {/* Header */}
                <div style={{
                    padding: "24px",
                    borderBottom: `1px solid ${THEME.colors.border}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: THEME.radius.md,
                            backgroundColor: `${THEME.colors.brand.cyan}15`,
                            border: `1px solid ${THEME.colors.brand.cyan}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Configuración</h2>
                            <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: 0 }}>SuniPlayer</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(false)}
                        style={{
                            background: "none", border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.md, padding: "6px 8px",
                            cursor: "pointer", color: THEME.colors.text.muted,
                            display: "flex", alignItems: "center",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 32px" }}>

                    {/* ── Reproducción ── */}
                    <Section title="Reproducción" icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    } />

                    <Toggle
                        label="Auto-siguiente"
                        description="Al terminar una canción, reproduce la siguiente automáticamente"
                        checked={autoNext}
                        onChange={setAutoNext}
                    />

                    <Toggle
                        label="Crossfade"
                        description={`Transición suave entre canciones`}
                        checked={crossfade}
                        onChange={v => { setCrossfade(v); if (v) setAutoNext(true); }}
                    />

                    {crossfade && (
                        <div style={{ paddingLeft: 12, borderLeft: `2px solid ${THEME.colors.brand.cyan}30`, marginBottom: 10 }}>
                            <SliderRow
                                label="Duración Crossfade"
                                value={crossfadeMs}
                                min={500} max={10000} step={500} unit=" ms"
                                onChange={setCrossfadeMs}
                            />
                        </div>
                    )}

                    <SliderRow
                        label="Volumen por defecto"
                        value={Math.round(defaultVol * 100)}
                        min={0} max={100} unit="%"
                        onChange={v => { setDefaultVol(v / 100); setVol(v / 100); }}
                    />

                    <Toggle
                        label="Efecto Fade (Suavizado)"
                        description="Aplica crescendo al inicio y diminuendo al final/pausa"
                        checked={fadeEnabled}
                        onChange={setFadeEnabled}
                    />

                    {fadeEnabled && (
                        <div style={{ paddingLeft: 12, borderLeft: `2px solid ${THEME.colors.brand.cyan}30`, marginBottom: 10 }}>
                            <SliderRow
                                label="Duración Fade-IN"
                                value={fadeInMs}
                                min={500} max={10000} step={500} unit=" ms"
                                onChange={setFadeInMs}
                            />
                            <SliderRow
                                label="Duración Fade-OUT"
                                value={fadeOutMs}
                                min={500} max={10000} step={500} unit=" ms"
                                onChange={setFadeOutMs}
                            />
                        </div>
                    )}

                    <Toggle
                        label="Sonómetro (dB SPL)"
                        description="Mide el volumen ambiental con el micrófono"
                        checked={splMeterEnabled}
                        onChange={setSplMeterEnabled}
                    />

                    {splMeterEnabled && (
                        <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginTop: 4 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.text.muted, marginBottom: 8, textTransform: "uppercase" }}>Calibración / Espacio</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {(["studio", "small", "hall", "open"] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSplMeterTarget(t)}
                                        style={{
                                            padding: "8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                            backgroundColor: splMeterTarget === t ? THEME.colors.brand.cyan : "transparent",
                                            color: splMeterTarget === t ? "black" : "white",
                                            border: `1px solid ${splMeterTarget === t ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                            cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize"
                                        }}
                                    >
                                        {t === "studio" ? "Estudio" : t === "small" ? "Sala Pequeña" : t === "hall" ? "Auditorio" : "Abierto"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Volumen actual */}
                    <div style={{ padding: "14px 0", borderBottom: `1px solid ${THEME.colors.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Volumen ahora</span>
                            <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.brand.violet, fontWeight: 700 }}>
                                {Math.round(vol * 100)}%
                            </span>
                        </div>
                        <input
                            type="range" min={0} max={100} value={Math.round(vol * 100)}
                            onChange={e => setVol(Number(e.target.value) / 100)}
                            style={{
                                width: "100%", appearance: "none", height: 4, borderRadius: 2,
                                background: `linear-gradient(to right, ${THEME.colors.brand.violet} ${vol * 100}%, rgba(255,255,255,0.1) ${vol * 100}%)`,
                                outline: "none", cursor: "pointer",
                            }}
                        />
                    </div>

                    {/* ── Set Builder ── */}
                    <Section title="Builder de Sets" icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                        </svg>
                    } />

                    <SliderRow
                        label="Duración por defecto del set"
                        value={targetMin}
                        min={15} max={180} unit=" min"
                        onChange={setTargetMin}
                    />

                    <SliderRow
                        label="BPM mínimo"
                        value={bpmMin}
                        min={40} max={bpmMax - 5} unit=" bpm"
                        onChange={setBpmMin}
                    />

                    <SliderRow
                        label="BPM máximo"
                        value={bpmMax}
                        min={bpmMin + 5} max={220} unit=" bpm"
                        onChange={setBpmMax}
                    />

                    {/* ── Audio Files ── */}
                    <Section title="Archivos de Audio" icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 18V5l12-2v13M6 15a3 3 0 1 0 0 6 3 3 0 000-6zm12-2a3 3 0 1 0 0 6 3 3 0 000-6z" />
                        </svg>
                    } />

                    <div style={{
                        padding: "16px",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        marginTop: 8,
                    }}>
                        <p style={{ fontSize: 13, color: THEME.colors.text.muted, margin: "0 0 12px", lineHeight: 1.6 }}>
                            Para activar audio real, copia tus MP3 a:
                        </p>
                        <code style={{
                            display: "block",
                            padding: "10px 14px",
                            backgroundColor: "rgba(0,0,0,0.4)",
                            borderRadius: THEME.radius.sm,
                            fontSize: 12,
                            fontFamily: THEME.fonts.mono,
                            color: THEME.colors.brand.cyan,
                            marginBottom: 12,
                            wordBreak: "break-all",
                        }}>
                            /public/audio/[Artista] - [Título].mp3
                        </code>
                        <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: 0, lineHeight: 1.5 }}>
                            El nombre del archivo debe coincidir con el campo <code style={{ color: THEME.colors.brand.violet }}>file_path</code> en <code style={{ color: THEME.colors.brand.violet }}>constants.ts</code>
                        </p>
                    </div>

                    {/* ── About ── */}
                    <Section title="Acerca de" icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    } />

                    <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                            ["Versión", "2.1.0"],
                            ["Motor de sets", "Monte Carlo (600 iter)"],
                            ["Crossfade", `${(crossfadeMs / 1000).toFixed(1)} segundos`],
                            ["Persistencia", "LocalStorage"],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: THEME.colors.text.muted }}>{k}</span>
                                <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.text.secondary }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </>
    );
};
