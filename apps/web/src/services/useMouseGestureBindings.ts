import { useEffect, useRef } from "react";
import { useDebugStore } from "../store/useDebugStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { executePedalAction } from "./usePedalBindings";

/**
 * useMouseGestureBindings — Detects global mouse/pointer swipes (drags)
 * and translates them into pedal actions based on user configuration.
 */
export function useMouseGestureBindings() {
    const addLog = useDebugStore(s => s.addLog);
    const gestureBindings = useSettingsStore(s => s.gestureBindings);
    
    // State for tracking the gesture
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const isDragging = useRef(false);
    const SWIPE_THRESHOLD = 50; 

    useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            if ((e.target as HTMLElement).closest('button, input, textarea, [role="button"]')) return;
            
            // Secuestrar el evento para que no llegue al sistema/navegador
            e.preventDefault();
            e.stopPropagation();

            startPos.current = { x: e.clientX, y: e.clientY };
            isDragging.current = true;
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (!startPos.current || !isDragging.current) return;

            // También bloqueamos el final del gesto
            e.preventDefault();
            e.stopPropagation();

            const deltaX = e.clientX - startPos.current.x;
            const deltaY = e.clientY - startPos.current.y;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (Math.max(absX, absY) > SWIPE_THRESHOLD) {
                let action = null;
                if (absX > absY) {
                    action = deltaX > 0 ? gestureBindings.right : gestureBindings.left;
                } else {
                    action = deltaY < 0 ? gestureBindings.up : gestureBindings.down;
                }

                if (action) executePedalAction(action, addLog);
            }

            startPos.current = null;
            isDragging.current = false;
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (isDragging.current) {
                // Bloqueamos el movimiento mientras arrastramos para evitar scroll del sistema
                e.preventDefault();
                e.stopPropagation();
            }
        };

        window.addEventListener("pointerdown", handlePointerDown, { capture: true });
        window.addEventListener("pointermove", handlePointerMove, { capture: true });
        window.addEventListener("pointerup", handlePointerUp, { capture: true });

        return () => {
            window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
            window.removeEventListener("pointermove", handlePointerMove, { capture: true });
            window.removeEventListener("pointerup", handlePointerUp, { capture: true });
        };
    }, [addLog, gestureBindings]);
}
