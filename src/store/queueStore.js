import { create } from "zustand";

export const useQueueStore = create((set) => ({
    pQueue: [],
    setPQueue: (pQueue) => set({ pQueue }),
    ci: 0,
    setCi: (ci) => set({ ci }),

    // Actions
    addTrack: (track) => set((state) => ({ pQueue: [...state.pQueue, track] })),
    removeTrack: (idx) => set((state) => ({ pQueue: state.pQueue.filter((_, i) => i !== idx) })),
    clearQueue: () => set({ pQueue: [], ci: 0 }),
}));
