import { useEffect } from "react";
import { usePlayerStore } from "../store/usePlayerStore";

/**
 * useLiveProtection â€” Prevents accidental window/tab closing during LIVE mode.
 */
export function useLiveProtection() {
    const mode = usePlayerStore(s => s.mode);
    const isLive = mode === "live";

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isLive) {
                // Standard way to show a confirmation dialog in most browsers
                e.preventDefault();
                e.returnValue = ""; 
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isLive]);
}
