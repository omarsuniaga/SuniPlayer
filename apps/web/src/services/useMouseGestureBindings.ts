import { useEffect, useRef } from "react";
import { useDebugStore } from "../store/useDebugStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { executePedalAction } from "./usePedalBindings";

/**
 * useMouseGestureBindings — Logic for Bluetooth Ring (HID Mouse).
 * Only triggers actions when a button is HELD and DRAGGED (mousedown -> move -> mouseup).
 */
export function useMouseGestureBindings() {
    const addLog = useDebugStore(s => s.addLog);
    const { gestureBindings, ringControlEnabled } = useSettingsStore();
    
    const isPressed = useRef(false);
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const dragBuffer = useRef({ x: 0, y: 0 });
    
    const DRAG_THRESHOLD = 50; // pixels to count as a deliberate gesture

    useEffect(() => {
        if (!ringControlEnabled) return;

        const handleMouseDown = (e: MouseEvent) => {
            // Ignorar si el target es un input o botón para no romper el UI normal
            if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;

            isPressed.current = true;
            startPos.current = { x: e.screenX, y: e.screenY };
            dragBuffer.current = { x: 0, y: 0 };
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPressed.current) return;

            // Acumulamos el movimiento relativo
            dragBuffer.current.x += e.movementX;
            dragBuffer.current.y += e.movementY;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isPressed.current) return;
            isPressed.current = false;

            const totalX = dragBuffer.current.x;
            const totalY = dragBuffer.current.y;
            const absX = Math.abs(totalX);
            const absY = Math.abs(totalY);

            // Solo disparamos si se movió más del umbral
            if (Math.max(absX, absY) > DRAG_THRESHOLD) {
                let direction: "up" | "down" | "left" | "right" | null = null;

                if (absX > absY) {
                    direction = totalX > 0 ? "right" : "left";
                } else {
                    direction = totalY > 0 ? "down" : "up";
                }

                if (direction) {
                    const action = gestureBindings[direction];
                    if (action && action !== "none") {
                        executePedalAction(action, addLog);
                    }
                }
            }

            startPos.current = null;
            dragBuffer.current = { x: 0, y: 0 };
        };

        const handleDblClick = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
            const action = gestureBindings.dblclick;
            if (action && action !== "none") {
                executePedalAction(action, addLog);
            }
        };

        window.addEventListener("mousedown", handleMouseDown, { capture: true });
        window.addEventListener("mousemove", handleMouseMove, { capture: true });
        window.addEventListener("mouseup", handleMouseUp, { capture: true });
        window.addEventListener("dblclick", handleDblClick, { capture: true });

        return () => {
            window.removeEventListener("mousedown", handleMouseDown, { capture: true });
            window.removeEventListener("mousemove", handleMouseMove, { capture: true });
            window.removeEventListener("mouseup", handleMouseUp, { capture: true });
            window.removeEventListener("dblclick", handleDblClick, { capture: true });
        };
    }, [addLog, gestureBindings, ringControlEnabled]);
}
