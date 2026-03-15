import React from "react";
import { useSettingsStore, PedalAction, PedalBinding } from "../../store/useSettingsStore";
import { THEME } from "../../data/theme";

// ── Action definitions ────────────────────────────────────────────────────────
const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
    { action: "next",       label: "Siguiente canción" },
    { action: "prev",       label: "Canción anterior" },
    { action: "play_pause", label: "Play / Pause" },
    { action: "vol_up",     label: "Volumen +" },
    { action: "vol_down",   label: "Volumen −" },
];

// ── Conflict detection ────────────────────────────────────────────────────────
function findConflict(
    bindings: Partial<Record<PedalAction, PedalBinding>>,
    forAction: PedalAction,
    candidateKey: string
): PedalAction | null {
    for (const [action, binding] of Object.entries(bindings) as [PedalAction, PedalBinding][]) {
        if (action !== forAction && binding.key === candidateKey) return action;
    }
    return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function actionLabel(action: PedalAction): string {
    return PEDAL_ACTIONS.find((a) => a.action === action)?.label ?? action;
}

// ── PedalConfig ───────────────────────────────────────────────────────────────
export const PedalConfig: React.FC = () => {
    const pedalBindings = useSettingsStore((s) => s.pedalBindings);
    const setPedalBinding = useSettingsStore((s) => s.setPedalBinding);
    const clearPedalBindings = useSettingsStore((s) => s.clearPedalBindings);
    const clearPedalBinding = useSettingsStore((s) => s.clearPedalBinding);
    const learningAction = useSettingsStore((s) => s.learningAction);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);

    // Conflict state: { forAction, conflictsWith, binding }
    const [pendingConflict, setPendingConflict] = React.useState<{
        forAction: PedalAction;
        conflictsWith: PedalAction;
        binding: PedalBinding;
    } | null>(null);

    // Conflict detection: watch pedalBindings for duplicate keys after each save
    React.useEffect(() => {
        for (const { action } of PEDAL_ACTIONS) {
            const binding = pedalBindings[action];
            if (!binding) continue;
            const conflict = findConflict(pedalBindings, action, binding.key);
            if (conflict) {
                setPendingConflict((prev) =>
                    prev ? prev : { forAction: action, conflictsWith: conflict, binding }
                );
                return;
            }
        }
        // No conflicts found — clear any stale conflict state
        setPendingConflict((prev) => (prev ? null : prev));
    }, [pedalBindings]);

    // Activity flash: briefly show a cyan dot when a bound key fires
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

    return (
        <div>
            {/* Section header */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "20px 0 8px",
            }}>
                <span style={{ fontSize: 18 }}>🦶</span>
                <span style={{
                    fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    color: THEME.colors.text.muted, flex: 1,
                }}>
                    Pedalera Bluetooth
                </span>
                {activityFlash && (
                    <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: THEME.colors.brand.cyan,
                        boxShadow: `0 0 6px ${THEME.colors.brand.cyan}`,
                        display: "inline-block",
                    }} />
                )}
            </div>
            <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: "0 0 12px" }}>
                Conecta tu pedalera y asigna cada pedal
            </p>

            {/* Listening banner */}
            {learningAction && (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: `${THEME.colors.brand.cyan}12`,
                    border: `1px solid ${THEME.colors.brand.cyan}40`,
                    borderRadius: THEME.radius.md,
                    marginBottom: 12,
                    animation: "pedalPulse 1s ease-in-out infinite",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            backgroundColor: "#EF4444",
                            boxShadow: "0 0 6px #EF4444",
                        }} />
                        <span style={{ fontSize: 13, color: THEME.colors.text.primary }}>
                            Presiona un pedal...
                        </span>
                    </div>
                    <button
                        onClick={() => setLearningAction(null)}
                        style={{
                            background: "none", border: "none",
                            cursor: "pointer", fontSize: 13,
                            color: THEME.colors.text.muted, padding: "4px 8px",
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Conflict warning */}
            {pendingConflict && (
                <div style={{
                    padding: "12px 16px",
                    backgroundColor: `${THEME.colors.status.warning}12`,
                    border: `1px solid ${THEME.colors.status.warning}40`,
                    borderRadius: THEME.radius.md,
                    marginBottom: 12,
                }}>
                    <div style={{ fontSize: 13, color: THEME.colors.status.warning, marginBottom: 8 }}>
                        ⚠️ Tecla ya asignada a &quot;{actionLabel(pendingConflict.conflictsWith)}&quot;
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => {
                                setPedalBinding(pendingConflict.forAction, pendingConflict.binding);
                                clearPedalBinding(pendingConflict.conflictsWith);
                                setPendingConflict(null);
                            }}
                            style={{
                                padding: "6px 12px", borderRadius: THEME.radius.sm,
                                border: `1px solid ${THEME.colors.status.warning}`,
                                backgroundColor: "transparent",
                                color: THEME.colors.status.warning,
                                cursor: "pointer", fontSize: 12, fontWeight: 700,
                            }}
                        >
                            Reasignar aquí
                        </button>
                        <button
                            onClick={() => setPendingConflict(null)}
                            style={{
                                padding: "6px 12px", borderRadius: THEME.radius.sm,
                                border: `1px solid ${THEME.colors.border}`,
                                backgroundColor: "transparent",
                                color: THEME.colors.text.muted,
                                cursor: "pointer", fontSize: 12,
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Action rows */}
            {PEDAL_ACTIONS.map(({ action, label }) => {
                const binding = pedalBindings[action];
                const isLearning = learningAction === action;
                const isDimmed = learningAction !== null && !isLearning;

                return (
                    <div
                        key={action}
                        style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: `1px solid ${THEME.colors.border}`,
                            opacity: isDimmed ? 0.35 : 1,
                            transition: "opacity 0.2s",
                        }}
                    >
                        {/* Label */}
                        <span style={{
                            fontSize: 14, fontWeight: 600,
                            color: THEME.colors.text.primary, flex: 1,
                        }}>
                            {label}
                        </span>

                        {/* Binding badge */}
                        <div style={{
                            padding: "4px 10px",
                            backgroundColor: binding
                                ? `${THEME.colors.brand.cyan}15`
                                : "rgba(255,255,255,0.04)",
                            border: `1px solid ${binding
                                ? THEME.colors.brand.cyan + "40"
                                : THEME.colors.border}`,
                            borderRadius: THEME.radius.sm,
                            fontSize: 12,
                            fontFamily: THEME.fonts.mono,
                            color: binding ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                            minWidth: 90,
                            textAlign: "center",
                            marginRight: 8,
                        }}>
                            {binding ? binding.label : "sin asignar"}
                        </div>

                        {/* Action button */}
                        <button
                            onClick={() => {
                                if (!isDimmed) setLearningAction(action);
                            }}
                            disabled={isDimmed}
                            style={{
                                padding: "6px 12px",
                                borderRadius: THEME.radius.sm,
                                border: `1px solid ${isLearning
                                    ? THEME.colors.brand.cyan
                                    : THEME.colors.border}`,
                                backgroundColor: isLearning
                                    ? `${THEME.colors.brand.cyan}20`
                                    : "transparent",
                                color: isLearning
                                    ? THEME.colors.brand.cyan
                                    : THEME.colors.text.muted,
                                cursor: isDimmed ? "default" : "pointer",
                                fontSize: 12, fontWeight: 700,
                                minWidth: 72,
                            }}
                        >
                            {binding ? "Cambiar" : "Aprender"}
                        </button>
                    </div>
                );
            })}

            {/* Clear all */}
            <div style={{ paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => { clearPedalBindings(); setPendingConflict(null); }}
                    style={{
                        padding: "6px 12px",
                        borderRadius: THEME.radius.sm,
                        border: `1px solid ${THEME.colors.status.error}40`,
                        backgroundColor: "transparent",
                        color: THEME.colors.status.error,
                        cursor: "pointer", fontSize: 12,
                    }}
                >
                    Borrar todo
                </button>
            </div>

            {/* Pulse animation for listening state */}
            <style>{`
                @keyframes pedalPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};
