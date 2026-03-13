import { useEffect } from "react";
import { useSettingsStore, PedalAction } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";

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

/** Returns true if the key event originated from a text input element */
function isTypingTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return true;
    if (target.isContentEditable) return true;
    return false;
}

/**
 * usePedalBindings — mount once globally in AppViewport.
 *
 * Listens for keydown events on the window.
 * - In learn mode: captures the next key press as a binding.
 * - In normal mode: dispatches the mapped player action.
 *
 * learningAction state lives in useSettingsStore (non-persisted)
 * so PedalConfig (a sibling component) can read/write it too.
 */
export function usePedalBindings() {
    const setPedalBinding = useSettingsStore((s) => s.setPedalBinding);
    const setLearningAction = useSettingsStore((s) => s.setLearningAction);
    const setCi = usePlayerStore((s) => s.setCi);
    const setPlaying = usePlayerStore((s) => s.setPlaying);
    const setVol = usePlayerStore((s) => s.setVol);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) return;

            // ── Learn mode ──────────────────────────────────────────────────
            const currentLearning = useSettingsStore.getState().learningAction;
            if (currentLearning !== null) {
                event.preventDefault();
                if (event.key === "Escape") {
                    setLearningAction(null);
                } else {
                    setPedalBinding(currentLearning, {
                        key: event.key,
                        label: keyLabel(event.key),
                    });
                    setLearningAction(null);
                }
                return;
            }

            // ── Normal mode — find matching binding ──────────────────────────
            const bindings = useSettingsStore.getState().pedalBindings;
            const matchedAction = (
                Object.entries(bindings) as [PedalAction, { key: string }][]
            ).find(([, b]) => b.key === event.key)?.[0];

            if (!matchedAction) return;
            event.preventDefault();

            const { ci: currentCi, pQueue: currentQueue, playing: currentPlaying, vol: currentVol } =
                usePlayerStore.getState();

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

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps: reads latest state from store directly — no stale closure
}
