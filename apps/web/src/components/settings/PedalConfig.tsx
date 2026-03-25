import React from "react";
import { useSettingsStore, PedalAction } from "../../store/useSettingsStore";
import { useDebugStore } from "../../store/useDebugStore";
import { THEME } from "../../data/theme";

// ── Action definitions ────────────────────────────────────────────────────────
const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
    { action: "next",       label: "Siguiente canción" },
    { action: "prev",       label: "Canción anterior" },
    { action: "play_pause", label: "Play / Pause" },
    { action: "stop",       label: "Detener audio" },
    { action: "vol_up",     label: "Volumen +" },
    { action: "vol_down",   label: "Volumen −" },
];

export const PedalConfig: React.FC = () => {
    const pedalBindings = useSettingsStore((s) => s.pedalBindings);
    const learningAction = useSettingsStore((s) => s.learningAction);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);
    const clearPedalBindings = useSettingsStore((s) => s.clearPedalBindings);
    
    const lastEvent = useDebugStore(s => s.lastEvent);
    const isFocused = useDebugStore(s => s.isFocused);

    // Activity flash
    const [activityFlash, setActivityFlash] = React.useState(false);
    const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const match = Object.values(pedalBindings).some((b) => b?.key === e.key);
            if (match) {
                if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                setActivityFlash(true);
                flashTimerRef.current = setTimeout(() => setActivityFlash(false), 300);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => {
            window.removeEventListener("keydown", handleKey);
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        };
    }, [pedalBindings]);

    const forceiPadFocus = () => {
        const el = document.getElementById("suni-pedal-focus") as HTMLInputElement;
        if (el) {
            el.focus();
            const btn = document.getElementById("btn-activate-ipad");
            if (btn) {
                btn.style.backgroundColor = THEME.colors.brand.cyan;
                setTimeout(() => { if (btn) btn.style.backgroundColor = "transparent"; }, 500);
            }
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0 8px" }}>
                <span style={{ fontSize: 18 }}>🦶</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: THEME.colors.text.muted, flex: 1 }}>
                    Pedalera Bluetooth
                </span>
                {activityFlash && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: THEME.colors.brand.cyan, boxShadow: `0 0 6px ${THEME.colors.brand.cyan}`, display: "inline-block" }} />
                )}
            </div>
            
            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", borderRadius: THEME.radius.md, padding: "12px", border: `1px solid ${THEME.colors.border}`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.brand.violet }}>DIAGNÓSTICO IPAD</span>
                        <div style={{ 
                            fontSize: 9, padding: "2px 6px", borderRadius: 4, 
                            backgroundColor: isFocused ? `${THEME.colors.status.success}20` : `${THEME.colors.status.error}20`,
                            color: isFocused ? THEME.colors.status.success : THEME.colors.status.error,
                            border: `1px solid ${isFocused ? THEME.colors.status.success : THEME.colors.status.error}40`,
                            fontWeight: 900
                        }}>
                            {isFocused ? "LISTO" : "DESCONECTADO"}
                        </div>
                    </div>
                    <span style={{ fontSize: 10, color: THEME.colors.text.muted }}>Señal: <strong style={{ color: THEME.colors.brand.cyan }}>{lastEvent}</strong></span>
                </div>

                {!isFocused && (
                    <button 
                        id="btn-activate-ipad"
                        onClick={forceiPadFocus}
                        style={{
                            width: "100%", padding: "10px", borderRadius: THEME.radius.sm,
                            border: `1px solid ${THEME.colors.brand.cyan}`,
                            background: "transparent", color: THEME.colors.brand.cyan,
                            fontSize: 11, fontWeight: 800, cursor: "pointer", marginBottom: 12,
                            transition: "all 0.2s"
                        }}
                    >
                        PULSA AQUÍ PARA CONECTAR PEDALERA
                    </button>
                )}

                <input 
                    type="text" 
                    placeholder="Prueba tu pedal aquí..."
                    style={{
                        width: "100%", background: "rgba(255,255,255,0.05)", border: "none",
                        borderRadius: 4, padding: "8px", fontSize: 12, color: "white",
                        outline: "none", borderBottom: `1px solid ${THEME.colors.border}`
                    }}
                />
            </div>

            <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: "0 0 12px" }}>
                Conecta tu pedalera y asigna cada pedal. Si usas iPad, pulsa el botón para activar la señal.
            </p>

            {PEDAL_ACTIONS.map(({ action, label }) => {
                const binding = pedalBindings[action];
                const isLearning = learningAction === action;
                const isDimmed = learningAction !== null && !isLearning;

                return (
                    <div key={action} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${THEME.colors.border}`, opacity: isDimmed ? 0.35 : 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: THEME.colors.text.primary, flex: 1 }}>{label}</span>
                        <div style={{ padding: "4px 10px", backgroundColor: binding ? `${THEME.colors.brand.cyan}15` : "rgba(255,255,255,0.04)", border: `1px solid ${binding ? THEME.colors.brand.cyan + "40" : THEME.colors.border}`, borderRadius: THEME.radius.sm, fontSize: 12, fontFamily: THEME.fonts.mono, color: binding ? THEME.colors.brand.cyan : THEME.colors.text.muted, minWidth: 90, textAlign: "center", marginRight: 8 }}>
                            {binding ? binding.label : "sin asignar"}
                        </div>
                        <button onClick={() => { if (!isDimmed) { setLearningAction(action); forceiPadFocus(); } }} disabled={isDimmed} style={{ padding: "6px 12px", borderRadius: THEME.radius.sm, border: `1px solid ${isLearning ? THEME.colors.brand.cyan : THEME.colors.border}`, backgroundColor: isLearning ? `${THEME.colors.brand.cyan}20` : "transparent", color: isLearning ? THEME.colors.brand.cyan : THEME.colors.text.muted, cursor: isDimmed ? "default" : "pointer", fontSize: 12, fontWeight: 700, minWidth: 72 }}>
                            {binding ? "Cambiar" : "Aprender"}
                        </button>
                    </div>
                );
            })}

            <div style={{ paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => { clearPedalBindings(); }} style={{ padding: "6px 12px", borderRadius: THEME.radius.sm, border: `1px solid ${THEME.colors.status.error}40`, backgroundColor: "transparent", color: THEME.colors.status.error, cursor: "pointer", fontSize: 12 }}>
                    Borrar todo
                </button>
            </div>
        </div>
    );
};
