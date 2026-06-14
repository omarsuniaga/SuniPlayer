import { create } from "zustand";

interface DebugState {
    lastEvent: string;
    isFocused: boolean;
    log: string[];
    addLog: (msg: string) => void;
    setLastEvent: (ev: string) => void;
    setIsFocused: (focused: boolean) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    lastEvent: "Ninguno",
    isFocused: false,
    log: [],
    addLog: (msg) => set((state) => ({ log: [msg, ...state.log].slice(0, 20) })),
    setLastEvent: (ev) => set({ lastEvent: ev }),
    setIsFocused: (focused) => set({ isFocused: focused }),
}));
