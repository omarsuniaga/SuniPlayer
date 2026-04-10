import { useEffect, useRef, useCallback } from "react";

/**
 * useWakeLock — Prevents the device screen from dimming or locking.
 * Robust implementation that handles visibility changes and initial user interaction.
 */
export function useWakeLock() {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const requestWakeLock = useCallback(async () => {
        const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } };
        // Only proceed if the API is supported and we don't already have a lock
        if (nav.wakeLock && !wakeLockRef.current) {
            try {
                const lock = await nav.wakeLock.request("screen");
                wakeLockRef.current = lock;
                console.log("[WakeLock] 🛡️ Screen lock active and protected");

                // If the lock is released (e.g. by the system), clear our ref
                lock.addEventListener("release", () => {
                    console.log("[WakeLock] 🔓 Screen lock was released");
                    wakeLockRef.current = null;
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                // This usually happens if the tab is not active or no user gesture yet
                console.warn(`[WakeLock] ⚠️ Failed to acquire lock: ${message}`);
            }
        }
    }, []);

    useEffect(() => {
        // 1. Try to request immediately if visible
        if (document.visibilityState === "visible") {
            requestWakeLock();
        }

        // 2. Re-request when the app becomes visible again (crucial for mobile)
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                requestWakeLock();
            }
        };

        // 3. Re-request on first click if it failed due to "user gesture" requirement
        const handleInteraction = () => {
            requestWakeLock();
            // Once we have it (or tried), we can stop listening to the first click
            window.removeEventListener("mousedown", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("mousedown", handleInteraction);
        window.addEventListener("touchstart", handleInteraction);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("mousedown", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
            wakeLockRef.current?.release();
            wakeLockRef.current = null;
        };
    }, [requestWakeLock]);
}
