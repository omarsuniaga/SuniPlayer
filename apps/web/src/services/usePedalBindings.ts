import { useEffect } from "react";
import { useSettingsStore, PedalAction } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useDebugStore } from "../store/useDebugStore";

/** Maps raw event.key values to human-readable labels */
function keyLabel(key: string): string {
    const map: Record<string, string> = {
        ArrowRight: "→",
        ArrowLeft: "←",
        ArrowUp: "↑",
        ArrowDown: "↓",
        " ": "Espacio",
        PageUp: "Pág↑",
        PageDown: "Pág↓",
        Enter: "Enter",
        Escape: "Esc",
    };
    return map[key] ?? key;
}

/** Returns true if the key event originated from a real text input element */
function isTypingTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    
    // EXCEPTION: Don't treat our invisible pedal focus anchor as a typing target
    if (target.id === "suni-pedal-focus") return false;

    if (tag === "INPUT" || tag === "TEXTAREA") return true;
    if (target.isContentEditable) return true;
    return false;
}

/**
 * usePedalBindings — mount once globally in AppViewport.
 */
export function usePedalBindings() {
    const setPedalBinding = useSettingsStore((s) => s.setPedalBinding);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);
    const setCi = usePlayerStore((s) => s.setCi);
    const setPlaying = usePlayerStore((s) => s.setPlaying);
    const setVol = usePlayerStore((s) => s.setVol);
    
    const setLastEvent = useDebugStore(s => s.setLastEvent);
    const addLog = useDebugStore(s => s.addLog);

    useEffect(() => {
        const handleKeyEvent = (event: KeyboardEvent) => {
            // Log to debug store for iPad visibility
            setLastEvent(`${event.type}: ${event.key}`);
            console.log(`[Pedal] ${event.type}:`, event.key);

            if (isTypingTarget(event.target)) return;

            // ── Learn mode ──────────────────────────────────────────────────
            const currentLearning = useSettingsStore.getState().learningAction;
            if (currentLearning !== null) {
                event.preventDefault();
                event.stopPropagation();
                
                // Only capture on keydown to avoid double-triggers
                if (event.type === "keydown") {
                    if (event.key === "Escape") {
                        setLearningAction(null);
                    } else {
                        addLog(`Mapeado: ${currentLearning} -> ${event.key}`);
                        setPedalBinding(currentLearning, {
                            key: event.key,
                            label: keyLabel(event.key),
                        });
                        setLearningAction(null);
                    }
                }
                return;
            }

            // ── Normal mode — find matching binding ──────────────────────────
            // Only respond to keydown for actions
            if (event.type !== "keydown") return;

            const bindings = useSettingsStore.getState().pedalBindings;
            const matchedAction = (
                Object.entries(bindings) as [PedalAction, { key: string }][]
            ).find(([, b]) => b.key === event.key)?.[0];

            if (!matchedAction) return;
            
            event.preventDefault();
            event.stopPropagation();

            const { ci: currentCi, pQueue: currentQueue, vol: currentVol } =
                usePlayerStore.getState();

            addLog(`Acción: ${matchedAction}`);

            switch (matchedAction) {
                case "next":
                    if (currentCi < currentQueue.length - 1) {
                        setCi(currentCi + 1);
                    }
                    break;
                case "prev":
                    if (currentCi > 0) {
                        setCi(currentCi - 1);
                    }
                    break;
                case "play_pause":
                    setPlaying((prev) => !prev);
                    break;
                case "vol_up":
                    setVol(Math.min(currentVol + 0.05, 1));
                    break;
                case "vol_down":
                    setVol(Math.max(currentVol - 0.05, 0));
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyEvent, { capture: true });
        window.addEventListener("keyup", handleKeyEvent, { capture: true });
        
        return () => {
            window.removeEventListener("keydown", handleKeyEvent, { capture: true });
            window.removeEventListener("keyup", handleKeyEvent, { capture: true });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 
}
