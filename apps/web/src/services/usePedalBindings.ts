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
 * Handles a keyboard event and dispatches the corresponding pedal action.
 * Exported for testing purposes.
 */
export function handlePedalEvent(
    event: KeyboardEvent, 
    learningAction: PedalAction | null,
    setPedalBinding: (action: PedalAction, binding: { key: string, label: string }) => void,
    setLearningAction: (action: PedalAction | null) => void,
    addLog: (msg: string) => void,
    setLastEvent: (ev: string) => void
) {
    // Log to debug store for iPad visibility
    setLastEvent(`${event.type}: ${event.key}`);
    
    if (isTypingTarget(event.target)) return;

    // ── Learn mode ──────────────────────────────────────────────────
    if (learningAction !== null) {
        event.preventDefault();
        event.stopPropagation();
        
        // Only capture on keydown to avoid double-triggers
        if (event.type === "keydown") {
            if (event.key === "Escape") {
                setLearningAction(null);
            } else {
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

    const setCi = usePlayerStore.getState().setCi;
    const setPlaying = usePlayerStore.getState().setPlaying;
    const setVol = usePlayerStore.getState().setVol;
    const setPos = usePlayerStore.getState().setPos;

    addLog(`Acción: ${matchedAction}`);

    switch (matchedAction) {
        case "next":
            if (currentCi < currentQueue.length - 1) {
                setCi(currentCi + 1);
                setPos(0);
            }
            break;
        case "prev":
            if (currentCi > 0) {
                setCi(currentCi - 1);
                setPos(0);
            }
            break;
        case "play_pause":
            setPlaying((prev: boolean) => !prev);
            break;
        case "stop":
            setPlaying(false);
            setPos(0);
            break;
        case "vol_up":
            setVol(Math.min(currentVol + 0.05, 1));
            break;
        case "vol_down":
            setVol(Math.max(currentVol - 0.05, 0));
            break;
    }
}

/**
 * usePedalBindings — mount once globally in AppViewport.
 */
export function usePedalBindings() {
    const setPedalBinding = useSettingsStore((s) => s.setPedalBinding);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);
    
    const setLastEvent = useDebugStore(s => s.setLastEvent);
    const addLog = useDebugStore(s => s.addLog);

    useEffect(() => {
        const handleKeyEvent = (event: KeyboardEvent) => {
            const learningAction = useSettingsStore.getState().learningAction;
            handlePedalEvent(
                event, 
                learningAction, 
                setPedalBinding, 
                setLearningAction, 
                addLog, 
                setLastEvent
            );
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
