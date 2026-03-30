import React from "react";
import { useSettingsStore, PedalAction } from "../../store/useSettingsStore";
import { useDebugStore } from "../../store/useDebugStore";
import { THEME } from "../../data/theme";

// â”€â”€ Action definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
    { action: "next",       label: "Siguiente canciÃ³n" },
    { action: "prev",       label: "CanciÃ³n anterior" },
    { action: "play_pause", label: "Play / Pause" },
    { action: "stop",       label: "Detener audio" },
    { action: "vol_up",     label: "Volumen +" },
    { action: "vol_down",   label: "Volumen âˆ’" },
];

export const PedalConfig: React.FC = () => {
    const pedalBindings = useSettingsStore((s) => s.pedalBindings);
    const learningAction = useSettingsStore((s) => s.learningAction);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);
    const clearPedalBindings = useSettingsStore((s) => s.clearPedalBindings);
    
    const lastEvent = useDebugStore(s => s.lastEvent);
    const isFocused = useDebugStore(s => s.isFocused);
    const addLog = useDebugStore(s => s.addLog);

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

    const forceiPadFocus = (fromAction?: string) => {
        if (fromAction) {
            addLog(`BotÃ³n pulsado: ${fromAction}`);
        }
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
        <div style={{ position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0 8px" }}>
                <span style={{ fontSize: 18 }}>ðŸ¦¶</span>
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
                        <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.brand.violet }}>DIAGNÃ“STICO IPAD</span>
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
                    <span style={{ fontSize: 10, color: THEME.colors.text.muted }}>SeÃ±al: <strong style={{ color: THEME.colors.brand.cyan }}>{lastEvent}</strong></span>
                </div>

                {!isFocused && (
                    <button 
                        id="btn-activate-ipad"
                        onClick={() => forceiPadFocus("ACTIVACIÃ“N")}
                        style={{
                            width: "100%", padding: "14px", borderRadius: THEME.radius.sm,
                            border: `2px solid ${THEME.colors.brand.cyan}`,
                            background: "rgba(0,255,255,0.1)", color: "white",
                            fontSize: 12, fontWeight: 900, cursor: "pointer", marginBottom: 12,
                            transition: "all 0.2s"
                        }}
                    >
                        PULSA AQUÃ PARA CONECTAR PEDALERA
                    </button>
                )}

                <input 
                    type="text" 
                    placeholder="Prueba tu pedal aquÃ­..."
                    style={{
                        width: "100%", background: "rgba(255,255,255,0.1)", border: "none",
                        borderRadius: 4, padding: "10px", fontSize: 14, color: "white",
                        outline: "none", borderBottom: `2px solid ${THEME.colors.brand.cyan}`
                    }}
                />
            </div>

            {/* Listening banner */}
            {learningAction && (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px", backgroundColor: "rgba(239, 68, 68, 0.2)",
                    border: "2px solid #EF4444", borderRadius: THEME.radius.md,
                    marginBottom: 16
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#EF4444", boxShadow: "0 0 10px #EF4444", animation: "pedalPulse 1s infinite" }} />
                        <span style={{ fontSize: 14, color: "white", fontWeight: 700 }}>Asignando <strong>{learningAction.toUpperCase()}</strong>... Pisa el pedal</span>
                    </div>
                    <button onClick={() => setLearningAction(null)} style={{ background: "white", border: "none", color: "black", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>CANCELAR</button>
                </div>
            )}

            <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: "0 0 12px" }}>
                Conecta tu pedalera y asigna cada pedal. Si usas iPad, asegÃºrate de que el estado sea <strong>LISTO</strong>.
            </p>

            {PEDAL_ACTIONS.map(({ action, label }) => {
                const binding = pedalBindings[action];
                const isLearning = learningAction === action;

                return (
                    <div key={action} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${THEME.colors.border}` }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "white", flex: 1 }}>{label}</span>
                        <div style={{ padding: "6px 12px", backgroundColor: binding ? `${THEME.colors.brand.cyan}25` : "rgba(255,255,255,0.05)", border: `1px solid ${binding ? THEME.colors.brand.cyan : THEME.colors.border}`, borderRadius: THEME.radius.sm, fontSize: 13, fontFamily: THEME.fonts.mono, color: binding ? THEME.colors.brand.cyan : "rgba(255,255,255,0.3)", minWidth: 100, textAlign: "center", marginRight: 12 }}>
                            {binding ? binding.label : "sin asignar"}
                        </div>
                        <button 
                            onClick={() => { setLearningAction(action); forceiPadFocus(label); }} 
                            onPointerDown={() => { setLearningAction(action); forceiPadFocus(label); }}
                            style={{ 
                                padding: "10px 16px", borderRadius: THEME.radius.sm, 
                                border: `2px solid ${isLearning ? THEME.colors.brand.cyan : "rgba(255,255,255,0.3)"}`, 
                                backgroundColor: isLearning ? `${THEME.colors.brand.cyan}30` : "rgba(255,255,255,0.05)", 
                                color: "white", // Forzado a blanco para que no parezca inactivo
                                cursor: "pointer", fontSize: 12, fontWeight: 900, minWidth: 85,
                                textTransform: "uppercase"
                            }}
                        >
                            {isLearning ? "OÃ­do..." : (binding ? "Cambiar" : "Aprender")}
                        </button>
                    </div>
                );
            })}

            <div style={{ paddingTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => { clearPedalBindings(); addLog("Reset completo"); }} style={{ padding: "10px 20px", borderRadius: THEME.radius.sm, border: `1px solid ${THEME.colors.status.error}`, backgroundColor: "transparent", color: THEME.colors.status.error, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
                    BORRAR TODO
                </button>
            </div>

            <style>{`
                @keyframes pedalPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};
