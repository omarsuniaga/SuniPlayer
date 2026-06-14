import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../store/useSettingsStore";
import { useDebugStore } from "../store/useDebugStore";
import { handlePedalEvent } from "../services/usePedalBindings";

// Mock del store de reproducción
vi.mock("../store/usePlayerStore", () => ({
    usePlayerStore: {
        getState: () => ({
            ci: 0,
            pQueue: [{ id: '1' }, { id: '2' }],
            vol: 0.5,
            playing: false,
            setCi: vi.fn(),
            setPlaying: vi.fn(),
            setVol: vi.fn(),
            setPos: vi.fn(),
        }),
    }
}));

describe("Lógica de Pedalera (Unit Test)", () => {
    beforeEach(() => {
        useSettingsStore.getState().clearPedalBindings();
        useSettingsStore.setState({ learningAction: null });
        useDebugStore.setState({ lastEvent: "Ninguno", log: [] });
    });

    it("debe capturar una tecla en modo aprendizaje y guardarla en el store", () => {
        const addLog = vi.fn();
        const setLastEvent = vi.fn();

        // 1. Simular evento de teclado
        const event = new KeyboardEvent("keydown", { key: "ArrowRight" });

        // 2. Activar modo aprendizaje en el store real
        useSettingsStore.setState({ learningAction: 'next' });

        // 3. Ejecutar lógica (ahora solo requiere event, addLog y setLastEvent)
        handlePedalEvent(
            event,
            addLog,
            setLastEvent
        );

        // 4. Verificaciones
        // Verificar que el store realmente cambió
        expect(useSettingsStore.getState().pedalBindings.next?.key).toBe("ArrowRight");
        expect(useSettingsStore.getState().learningAction).toBeNull();
    });

    it("debe ejecutar la acción mapeada en modo normal", () => {
        // 1. Mapear 'play_pause' a la tecla ' ' (Espacio)
        useSettingsStore.getState().setPedalBinding('play_pause', { key: ' ', label: 'Espacio' });
        
        const addLog = vi.fn();
        const setLastEvent = vi.fn();

        const event = new KeyboardEvent("keydown", { key: " " });

        // 2. Ejecutar lógica en modo normal
        handlePedalEvent(
            event,
            addLog,
            setLastEvent
        );

        // 3. Verificación de logs (la acción se ejecutó)
        expect(addLog).toHaveBeenCalledWith(expect.stringContaining("play_pause"));
    });
});
