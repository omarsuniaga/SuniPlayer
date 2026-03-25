import { create } from "zustand";

interface DebugState {
    lastEvent: string;
    log: string[];
    addLog: (msg: string) => void;
    setLastEvent: (ev: string) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    lastEvent: "Ninguno",
    log: [],
    addLog: (msg) => set((state) => ({ log: [msg, ...state.log].slice(0, 20) })),
    setLastEvent: (ev) => set({ lastEvent: ev }),
}));
