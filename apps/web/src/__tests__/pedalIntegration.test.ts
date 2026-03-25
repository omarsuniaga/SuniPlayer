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
            setCi: vi.fn(),
            setPlaying: vi.fn(),
            setVol: vi.fn(),
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
        const setPedalBinding = vi.fn((a, b) => useSettingsStore.getState().setPedalBinding(a, b));
        const setLearningAction = vi.fn((a) => useSettingsStore.setState({ learningAction: a }));
        const addLog = vi.fn();
        const setLastEvent = vi.fn();

        // 1. Simular evento de teclado
        const event = new KeyboardEvent("keydown", { key: "ArrowRight" });

        // 2. Ejecutar lógica en modo aprendizaje para 'next'
        handlePedalEvent(
            event,
            'next',
            setPedalBinding,
            setLearningAction,
            addLog,
            setLastEvent
        );

        // 3. Verificaciones
        expect(setPedalBinding).toHaveBeenCalledWith('next', expect.objectContaining({ key: 'ArrowRight' }));
        expect(setLearningAction).toHaveBeenCalledWith(null);
        
        // Verificar que el store realmente cambió
        expect(useSettingsStore.getState().pedalBindings.next?.key).toBe("ArrowRight");
    });

    it("debe ejecutar la acción mapeada en modo normal", () => {
        // 1. Mapear 'play_pause' a la tecla ' ' (Espacio)
        useSettingsStore.getState().setPedalBinding('play_pause', { key: ' ', label: 'Espacio' });
        
        const setPedalBinding = vi.fn();
        const setLearningAction = vi.fn();
        const addLog = vi.fn();
        const setLastEvent = vi.fn();

        const event = new KeyboardEvent("keydown", { key: " " });

        // 2. Ejecutar lógica en modo normal (learningAction = null)
        handlePedalEvent(
            event,
            null,
            setPedalBinding,
            setLearningAction,
            addLog,
            setLastEvent
        );

        // 3. Verificación de logs (la acción se ejecutó)
        expect(addLog).toHaveBeenCalledWith(expect.stringContaining("play_pause"));
    });
});
