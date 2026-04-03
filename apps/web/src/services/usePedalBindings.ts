import { useEffect, useRef } from "react";
import { useSettingsStore, PedalAction } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useDebugStore } from "../store/useDebugStore";
import { skipToNextGracefully, togglePlaybackGracefully } from "./audioTransport";

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
 * Executes a normalized pedal action.
 * Centralized logic for all hardware inputs (Keyboard, Bluetooth Pedal, Ring/Mouse Gestures).
 */
export function executePedalAction(action: PedalAction, addLog: (msg: string) => void) {
    const playerStore = usePlayerStore.getState();
    const { ci, pQueue, vol, setCi, setPlaying, setVol, setPos, mode } = playerStore;
    const isLive = mode === "live";

    addLog(`Acción: ${action}${isLive ? " (LIVE)" : ""}`);
    console.log(`[Pedal] Action executed: ${action} (Live: ${isLive})`);

    switch (action) {
        case "next":
            if (isLive) {
                addLog("Pedal: NEXT bloqueado (LIVE)");
                return;
            }
            if (ci < pQueue.length - 1) {
                skipToNextGracefully();
            }
            break;
        case "prev":
            if (isLive) {
                addLog("Pedal: PREV bloqueado (LIVE)");
                return;
            }
            if (ci > 0) {
                setCi(ci - 1);
                setPos(0);
            }
            break;
        case "play_pause":
            togglePlaybackGracefully();
            break;
        case "stop":
            setPlaying(false);
            setPos(0);
            break;
        case "vol_up":
            setVol(Math.min(vol + 0.05, 1));
            break;
        case "vol_down":
            setVol(Math.max(vol - 0.05, 0));
            break;
    }
}

/**
 * Handles a keyboard event and dispatches the corresponding pedal action.
 * Reads directly from stores to avoid stale closures.
 */
export function handlePedalEvent(
    event: KeyboardEvent, 
    addLog: (msg: string) => void,
    setLastEvent: (ev: string) => void
) {
    const { learningAction, setPedalBinding, setLearningAction, pedalBindings } = useSettingsStore.getState();
    
    // Log to debug store for iPad visibility
    setLastEvent(`${event.type}: ${event.key}`);
    
    if (isTypingTarget(event.target)) return;

    // ── Learn mode ──────────────────────────────────────────────────
    if (learningAction !== null) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.type === "keydown") {
            if (event.key === "Escape") {
                setLearningAction(null);
            } else {
                console.log(`[Pedal] Mapping ${learningAction} to ${event.key}`);
                addLog(`Mapeado: ${learningAction} -> ${event.key}`);
                setPedalBinding(learningAction, {
                    key: event.key,
                    label: keyLabel(event.key),
                });
                setLearningAction(null);
            }
        }
        return;
    }

    // ── Normal mode — find matching binding ──────────────────────────
    if (event.type !== "keydown") return;

    const matchedAction = (
        Object.entries(pedalBindings) as [PedalAction, { key: string }][]
    ).find(([, b]) => b.key === event.key)?.[0];

    if (!matchedAction) return;
    
    event.preventDefault();
    event.stopPropagation();

    executePedalAction(matchedAction, addLog);
}

/**
 * usePedalBindings — mount once globally in AppViewport.
 */
export function usePedalBindings() {
    const setLastEvent = useDebugStore(s => s.setLastEvent);
    const addLog = useDebugStore(s => s.addLog);
    const lastTriggerRef = useRef<number>(0);
    const DEBOUNCE_MS = 300;

    useEffect(() => {
        const handleKeyEvent = (event: KeyboardEvent) => {
            const now = Date.now();
            if (now - lastTriggerRef.current < DEBOUNCE_MS) {
                // Ignore rapid fire events (Level 3 protection)
                return;
            }
            
            // Si el evento es válido, actualizamos el timestamp
            // Nota: handlePedalEvent internamente filtrará si no hay binding matched
            const prevLastEvent = useDebugStore.getState().lastEvent;
            handlePedalEvent(event, addLog, setLastEvent);
            
            if (useDebugStore.getState().lastEvent !== prevLastEvent) {
                lastTriggerRef.current = now;
            }
        };

        window.addEventListener("keydown", handleKeyEvent, { capture: true });
        
        return () => {
            window.removeEventListener("keydown", handleKeyEvent, { capture: true });
        };
    }, [addLog, setLastEvent]); 
}
