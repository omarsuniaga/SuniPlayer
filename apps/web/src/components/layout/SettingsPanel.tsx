import React, { useState, useEffect } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useIsMobile } from "../../utils/useMediaQuery";
import { THEME } from "../../data/theme.ts";
import { PedalConfig } from "../settings/PedalConfig";
import { VERSION_INFO } from "../../version";
import { getStorage } from "@suniplayer/core";

// ── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: `1px solid ${THEME.colors.border}` }}>
        <div style={{ flex: 1 }}>
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
    </div>
);

// ── Accordion Section ────────────────────────────────────────────────────────
const AccordionSection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    isOpen: boolean; 
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => (
    <div style={{ borderBottom: `1px solid ${THEME.colors.border}` }}>
        <button 
            onClick={onToggle}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "20px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isOpen ? THEME.colors.brand.cyan : "white"
            }}
        >
            <div style={{ color: isOpen ? THEME.colors.brand.cyan : THEME.colors.text.muted }}>{icon}</div>
            <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {title}
            </span>
            <svg 
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s", opacity: 0.3 }}
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </button>
        <div style={{ 
            maxHeight: isOpen ? "2000px" : "0",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isOpen ? 1 : 0
        }}>
            <div style={{ paddingBottom: 24 }}>
                {children}
            </div>
        </div>
    </div>
);

// ── Settings Panel ───────────────────────────────────────────────────────────
export const SettingsPanel: React.FC = () => {
    const isMobile = useIsMobile();
    const showSettings = useProjectStore(s => s.showSettings);
    // Storage Metrics State
    const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
    const [isPersisted, setIsPersisted] = useState<boolean>(false);

    useEffect(() => {
        if (!showSettings) return;

        // Fetch storage metrics
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                setStorageUsage({
                    used: estimate.usage || 0,
                    quota: estimate.quota || 0
                });
            });
        }

        if (navigator.storage && navigator.storage.persisted) {
            navigator.storage.persisted().then(persisted => {
                setIsPersisted(persisted);
            });
        }
    }, [showSettings]);

    const handleRequestPersistence = async () => {
        if (navigator.storage && navigator.storage.persist) {
            const persisted = await navigator.storage.persist();
            setIsPersisted(persisted);
            if (persisted) {
                alert("✅ Almacenamiento Blindado: El sistema operativo no borrará tus archivos automáticamente.");
            } else {
                alert("ℹ️ El navegador decidirá cuándo otorgar la persistencia (suele requerir que la app esté instalada o se use frecuentemente).");
            }
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const usagePercent = storageUsage ? (storageUsage.used / storageUsage.quota) * 100 : 0;
// ... (rest of store selectors)
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
    
    // Advanced DJ Logic
    const harmonicMixing = useSettingsStore(s => s.harmonicMixing);
    const setHarmonicMixing = useSettingsStore(s => s.setHarmonicMixing);
    const maxBpmJump = useSettingsStore(s => s.maxBpmJump);
    const setMaxBpmJump = useSettingsStore(s => s.setMaxBpmJump);
    const energyContinuity = useSettingsStore(s => s.energyContinuity);
    const setEnergyContinuity = useSettingsStore(s => s.setEnergyContinuity);

    const defaultVol = useProjectStore(s => s.defaultVol);
    const setDefaultVol = useProjectStore(s => s.setDefaultVol);
    const targetMin = useProjectStore(s => s.targetMin);
    const setTargetMin = useProjectStore(s => s.setTargetMin);
    const setVol = useProjectStore(s => s.setVol);
    const autoGain = useProjectStore(s => s.autoGain);
    const setAutoGain = useProjectStore(s => s.setAutoGain);
    const fadeEnabled = useProjectStore(s => s.fadeEnabled);
    const setFadeEnabled = useProjectStore(s => s.setFadeEnabled);
    const fadeInMs = useProjectStore(s => s.fadeInMs);
    const setFadeInMs = useProjectStore(s => s.setFadeInMs);
    const fadeOutMs = useProjectStore(s => s.fadeOutMs);
    const setFadeOutMs = useProjectStore(s => s.setFadeOutMs);
    const splMeterEnabled = useProjectStore(s => s.splMeterEnabled);
    const setSplMeterEnabled = useProjectStore(s => s.setSplMeterEnabled);
    const resetApp = useProjectStore(s => s.resetApp);
    const performanceMode = useSettingsStore(s => s.performanceMode);
    const setPerformanceMode = useSettingsStore(s => s.setPerformanceMode);
    const setView = useProjectStore(s => s.setView);

    // ── Builder Intelligence ──────────────────────────────────────────────────
    const repertoire = useLibraryStore(s => s.repertoire);
    const curve = useProjectStore(s => s.curve);
    const setCurve = useProjectStore(s => s.setCurve);

    const tracksInRange = repertoire.filter(t => {
        const bpm = t.bpm || 120;
        return bpm >= bpmMin && bpm <= bpmMax;
    });

    const CURVES = [
        { id: "steady", label: "Estable", icon: "⎯", desc: "Mantiene la energía constante" },
        { id: "rising", label: "In Crescendo", icon: "↗", desc: "Sube gradualmente el BPM" },
        { id: "peak", label: "Montaña", icon: "⋀", desc: "Punto máximo a mitad del set" },
    ];

    // State for accordions
    const [openSection, setOpenSection] = useState<string | null>("audio");

    if (!showSettings) return null;

    const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

    const navHeight = 64;
    const footerHeight = isMobile ? 56 : 72;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setShowSettings(false)}
                style={{
                    position: "fixed", 
                    top: navHeight,
                    bottom: footerHeight,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(2px)",
                    zIndex: 800,
                    animation: "fadeIn 0.15s ease-out",
                }}
            />

            {/* Drawer */}
            <div style={{
                position: "fixed",
                top: navHeight, 
                right: 0, 
                bottom: footerHeight,
                width: "min(400px, 100vw)",
                backgroundColor: "#0D1117",
                borderLeft: `1px solid ${THEME.colors.border}`,
                borderTop: isMobile ? `1px solid ${THEME.colors.border}` : "none",
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
                            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Ajustes</h2>
                            <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: 0 }}>SuniPlayer Control</p>
                        </div>
                    </div>
                    <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 32px" }}>

                    <AccordionSection 
                        title="Reproducción" 
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                        isOpen={openSection === "audio"}
                        onToggle={() => toggle("audio")}
                    >
                        <Toggle label="Auto-siguiente" checked={autoNext} onChange={setAutoNext} />
                        <Toggle label="Crossfade" checked={crossfade} onChange={v => { setCrossfade(v); if (v) setAutoNext(true); }} />
                        {crossfade && <SliderRow label="Duración Crossfade" value={crossfadeMs} min={500} max={10000} step={500} unit=" ms" onChange={setCrossfadeMs} />}
                        <SliderRow label="Volumen por defecto" value={Math.round(defaultVol * 100)} min={0} max={100} unit="%" onChange={v => { setDefaultVol(v / 100); setVol(v / 100); }} />
                        <Toggle
                            label="Normalizar volumen"
                            description="Suaviza diferencias de loudness entre canciones sin tocar tu volumen general."
                            checked={autoGain}
                            onChange={setAutoGain}
                        />
                        <Toggle label="Efecto Fade" checked={fadeEnabled} onChange={setFadeEnabled} />
                        {fadeEnabled && (
                            <>
                                <SliderRow label="Duración Fade-IN" value={fadeInMs} min={500} max={10000} step={500} unit=" ms" onChange={setFadeInMs} />
                                <SliderRow label="Duración Fade-OUT" value={fadeOutMs} min={500} max={10000} step={500} unit=" ms" onChange={setFadeOutMs} />
                            </>
                        )}
                        <Toggle label="Sonómetro (dB SPL)" checked={splMeterEnabled} onChange={setSplMeterEnabled} />
                        <Toggle label="Modo Tablet" checked={performanceMode} onChange={setPerformanceMode} />
                    </AccordionSection>

                    <AccordionSection 
                        title="Builder de Sets" 
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>}
                        isOpen={openSection === "builder"}
                        onToggle={() => toggle("builder")}
                    >
                        {/* 🌌 Universo de Temas (Diagnóstico) */}
                        <div style={{ 
                            padding: "14px", 
                            backgroundColor: "rgba(6,182,212,0.08)", 
                            borderRadius: THEME.radius.md, 
                            border: `1px solid ${THEME.colors.brand.cyan}30`,
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 12
                        }}>
                            <div style={{ fontSize: 24 }}>🌌</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: THEME.colors.brand.cyan }}>UNIVERSO DISPONIBLE</div>
                                <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 2 }}>
                                    <strong style={{ color: "white" }}>{tracksInRange.length}</strong> temas calificados de un total de {repertoire.length}.
                                </div>
                            </div>
                        </div>

                        <SliderRow label="Duración del set" value={targetMin} min={15} max={180} unit=" min" onChange={setTargetMin} />
                        <SliderRow label="BPM mínimo" value={bpmMin} min={40} max={bpmMax - 5} unit=" bpm" onChange={setBpmMin} />
                        <SliderRow label="BPM máximo" value={bpmMax} min={bpmMin + 5} max={220} unit=" bpm" onChange={setBpmMax} />

                        {/* 📈 Selector de Curva Visual */}
                        <div style={{ marginTop: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: THEME.colors.text.muted, textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>
                                Curva de Energía Predeterminada
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: 8 }}>
                                {CURVES.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setCurve(c.id)}
                                        title={c.desc}
                                        style={{
                                            padding: "12px 8px",
                                            borderRadius: THEME.radius.md,
                                            border: `1px solid ${curve === c.id ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                            backgroundColor: curve === c.id ? `${THEME.colors.brand.cyan}15` : "rgba(255,255,255,0.03)",
                                            color: curve === c.id ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 4,
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <span style={{ fontSize: 18, fontWeight: 900 }}>{c.icon}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 🧠 Inteligencia DJ (Advanced Logic) */}
                        <div style={{ marginTop: 24, padding: "16px", backgroundColor: "rgba(139, 92, 246, 0.05)", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.brand.violet}30` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                <span style={{ fontSize: 16 }}>🧠</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: THEME.colors.brand.violet, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Inteligencia DJ
                                </span>
                            </div>

                            <Toggle 
                                label="Mezcla Armónica" 
                                description="Prioriza temas con tonos musicalmente compatibles (Círculo de Quintas)."
                                checked={harmonicMixing} 
                                onChange={setHarmonicMixing} 
                            />
                            
                            <Toggle 
                                label="Continuidad de Energía" 
                                description="Evita saltos bruscos de intensidad (Mood) entre canciones."
                                checked={energyContinuity} 
                                onChange={setEnergyContinuity} 
                            />

                            <div style={{ padding: "14px 0 0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>Salto Máximo de BPM</span>
                                    <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.brand.violet, fontWeight: 700 }}>
                                        ±{maxBpmJump} BPM
                                    </span>
                                </div>
                                <input
                                    type="range" min={5} max={25} step={1}
                                    value={maxBpmJump}
                                    onChange={e => setMaxBpmJump(Number(e.target.value))}
                                    style={{
                                        width: "100%", appearance: "none", height: 4, borderRadius: 2,
                                        background: `linear-gradient(to right, ${THEME.colors.brand.violet} ${(maxBpmJump - 5) / (25 - 5) * 100}%, rgba(255,255,255,0.1) ${(maxBpmJump - 5) / (25 - 5) * 100}%)`,
                                        outline: "none", cursor: "pointer",
                                    }}
                                />
                                <div style={{ fontSize: 10, color: THEME.colors.text.muted, marginTop: 8, fontStyle: "italic" }}>
                                    Limita la diferencia de tempo entre temas para una transición fluida.
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection 
                        title="Bluetooth" 
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                        isOpen={openSection === "pedal"}
                        onToggle={() => toggle("pedal")}
                    >
                        <PedalConfig />
                    </AccordionSection>

                    <AccordionSection 
                        title="Almacenamiento Local" 
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>}
                        isOpen={openSection === "storage"}
                        onToggle={() => toggle("storage")}
                    >
                        <div style={{ padding: "16px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`, marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                            
                            {/* 📊 Métricas de Almacenamiento */}
                            <div style={{ marginBottom: 4 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-end" }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: THEME.colors.text.muted, textTransform: "uppercase" }}>Uso de disco</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.brand.cyan }}>
                                        {storageUsage ? `${formatBytes(storageUsage.used)} / ${formatBytes(storageUsage.quota)}` : "Cargando..."}
                                    </span>
                                </div>
                                <div style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${Math.min(100, usagePercent)}%`, 
                                        height: "100%", 
                                        backgroundColor: usagePercent > 90 ? THEME.colors.status.error : THEME.colors.brand.cyan,
                                        transition: "width 0.5s ease-out"
                                    }} />
                                </div>
                            </div>

                            {/* 🛡️ Blindaje (Persistencia) */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 6, border: `1px solid ${isPersisted ? THEME.colors.status.success + "30" : THEME.colors.border}` }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: isPersisted ? THEME.colors.status.success : THEME.colors.text.muted }}>
                                        {isPersisted ? "🛡️ ALMACENAMIENTO BLINDADO" : "🔓 MODO TEMPORAL"}
                                    </div>
                                    <div style={{ fontSize: 9, color: THEME.colors.text.muted, marginTop: 2 }}>
                                        {isPersisted ? "Tus audios están protegidos por el sistema." : "El sistema podría borrar audios si falta espacio."}
                                    </div>
                                </div>
                                {!isPersisted && (
                                    <button 
                                        onClick={handleRequestPersistence}
                                        style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${THEME.colors.brand.cyan}`, background: "transparent", color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 900, cursor: "pointer" }}
                                    >
                                        BLINDAR
                                    </button>
                                )}
                            </div>

                            <div style={{ height: 1, backgroundColor: THEME.colors.border, margin: "4px 0" }} />

                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: THEME.colors.text.muted }}>Tracks en el dispositivo</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: THEME.colors.brand.cyan }}>{useLibraryStore.getState().customTracks.length}</span>
                            </div>
                            
                            <button onClick={() => { setView("library"); setShowSettings(false); }} style={{ width: "100%", padding: "10px", borderRadius: THEME.radius.sm, border: `1px solid ${THEME.colors.brand.violet}40`, background: `${THEME.colors.brand.violet}15`, color: THEME.colors.brand.violet, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                GESTIONAR BIBLIOTECA
                            </button>

                            <div style={{ height: 1, backgroundColor: THEME.colors.border, margin: "4px 0" }} />

                            <div style={{ display: "flex", gap: 8 }}>
                                <button 
                                    onClick={async () => {
                                        try {
                                            const backup = await getStorage().exportFullBackup();
                                            const url = URL.createObjectURL(backup);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `suniplayer-backup-${new Date().toISOString().split('T')[0]}.suni-backup`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        } catch (e) {
                                            alert("Error al exportar: " + e);
                                        }
                                    }}
                                    style={{ flex: 1, padding: "10px", borderRadius: THEME.radius.sm, border: `1px solid ${THEME.colors.brand.cyan}40`, background: `${THEME.colors.brand.cyan}10`, color: THEME.colors.brand.cyan, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                                >
                                    EXPORTAR BACKUP
                                </button>

                                <button 
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.suni-backup';
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                if (confirm("⚠️ ¿Restaurar backup? Esto reemplazará tu biblioteca actual.")) {
                                                    const res = await getStorage().importFullBackup(file);
                                                    if (res.success) {
                                                        alert(`✅ Restauración exitosa: ${res.count} temas cargados. Reiniciando...`);
                                                        window.location.reload();
                                                    } else {
                                                        alert("❌ Error en la restauración.");
                                                    }
                                                }
                                            }
                                        };
                                        input.click();
                                    }}
                                    style={{ flex: 1, padding: "10px", borderRadius: THEME.radius.sm, border: `1px solid rgba(255,255,255,0.2)`, background: "rgba(255,255,255,0.05)", color: "white", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                                >
                                    IMPORTAR BACKUP
                                </button>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection 
                        title="Acerca de" 
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                        isOpen={openSection === "about"}
                        onToggle={() => toggle("about")}
                    >
                        <div style={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: THEME.radius.md, padding: "12px", border: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                           {[
                               ["Versión", VERSION_INFO.tag],
                               ["Build Date", VERSION_INFO.buildDate],
                               ["Build Time", `${VERSION_INFO.buildTime} (UTC-4)`],
                           ].map(([k, v]) => (
                               <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                                   <span style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.text.muted, textTransform: "uppercase" }}>{k}</span>
                                   <span style={{ fontSize: 12, fontFamily: THEME.fonts.mono, color: THEME.colors.brand.cyan }}>{v}</span>
                               </div>
                           ))}
                        </div>
                    </AccordionSection>

                    <AccordionSection 
                        title="Sistema" 
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>}
                        isOpen={openSection === "system"}
                        onToggle={() => toggle("system")}
                    >
                        <button onClick={resetApp} style={{ width: "100%", padding: "12px", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.status.error}60`, backgroundColor: `${THEME.colors.status.error}10`, color: THEME.colors.status.error, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            Reiniciar aplicación y limpiar caché
                        </button>
                    </AccordionSection>

                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </>
    );
};
