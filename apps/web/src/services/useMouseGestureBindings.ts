import { useEffect, useRef } from "react";
import { useDebugStore } from "../store/useDebugStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { executePedalAction } from "./usePedalBindings";

/**
 * useMouseGestureBindings — Advanced detection for HID Mouse / Ring controllers.
 * Detects "Flicks" (rapid relative movements) and mouse buttons without requiring drags.
 */
export function useMouseGestureBindings() {
    const addLog = useDebugStore(s => s.addLog);
    const { gestureBindings, immersionMode, setImmersionMode } = useSettingsStore();
    
    // Accumulators for movement speed
    const moveBuffer = useRef<{ x: number, y: number, lastTime: number }>({ x: 0, y: 0, lastTime: 0 });
    const FLICK_THRESHOLD = 150; // px displacement in short window
    const FLICK_WINDOW_MS = 150; // reset buffer after this time of inactivity
    const COOLDOWN_MS = 400;     // prevent rapid fire gestures
    const lastTriggerTime = useRef(0);

    useEffect(() => {
        const trigger = (direction: "up" | "down" | "left" | "right") => {
            const now = Date.now();
            if (now - lastTriggerTime.current < COOLDOWN_MS) return;

            const action = gestureBindings[direction];
            if (action && action !== "none") {
                executePedalAction(action, addLog);
                lastTriggerTime.current = now;
                // Clear buffer after trigger
                moveBuffer.current = { x: 0, y: 0, lastTime: now };
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            
            // If window expired, reset buffer
            if (now - moveBuffer.current.lastTime > FLICK_WINDOW_MS) {
                moveBuffer.current = { x: 0, y: 0, lastTime: now };
            }

            // Accumulate relative movement (works even without Pointer Lock)
            moveBuffer.current.x += e.movementX;
            moveBuffer.current.y += e.movementY;
            moveBuffer.current.lastTime = now;

            // Check for flicks
            const absX = Math.abs(moveBuffer.current.x);
            const absY = Math.abs(moveBuffer.current.y);

            if (absX > FLICK_THRESHOLD && absX > absY) {
                trigger(moveBuffer.current.x > 0 ? "right" : "left");
            } else if (absY > FLICK_THRESHOLD && absY > absX) {
                trigger(moveBuffer.current.y > 0 ? "down" : "up");
            }
        };

        const handleClick = (e: MouseEvent) => {
            // Priority: if immersion mode is ON and we are not locked, LOCK NOW.
            if (immersionMode && !document.pointerLockElement) {
                document.body.requestPointerLock();
                addLog("Ring: Modo Inmersivo activado");
                return;
            }

            // Standard click binding
            const action = gestureBindings.click;
            if (action && action !== "none") {
                executePedalAction(action, addLog);
            }
        };

        const handleDblClick = () => {
            const action = gestureBindings.dblclick;
            if (action && action !== "none") {
                executePedalAction(action, addLog);
            }
        };

        // Pointer Lock Change detection
        const handleLockChange = () => {
            if (!document.pointerLockElement && immersionMode) {
                // If user pressed Escape or system forced unlock
                addLog("Ring: Modo Inmersivo desactivado");
                // We keep the settings toggle ON, so the next click re-locks.
            }
        };

        window.addEventListener("mousemove", handleMouseMove, { capture: true });
        window.addEventListener("click", handleClick, { capture: true });
        window.addEventListener("dblclick", handleDblClick, { capture: true });
        document.addEventListener("pointerlockchange", handleLockChange);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove, { capture: true });
            window.removeEventListener("click", handleClick, { capture: true });
            window.removeEventListener("dblclick", handleDblClick, { capture: true });
            document.removeEventListener("pointerlockchange", handleLockChange);
        };
    }, [addLog, gestureBindings, immersionMode]);
}
