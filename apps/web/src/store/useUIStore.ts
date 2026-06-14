import { create } from "zustand";

/**
 * Cross-component UI state that doesn't belong to the audio/player domain.
 * Lets components outside the Player view (e.g. the Navbar chronometer) drive
 * the setlist queue panel without prop-drilling through the whole tree.
 */
interface UIState {
    showQueue: boolean;
    setShowQueue: (value: boolean) => void;
    toggleQueue: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    showQueue: typeof window !== "undefined" ? window.innerWidth > 1200 : false,
    setShowQueue: (value) => set({ showQueue: value }),
    toggleQueue: () => set((state) => ({ showQueue: !state.showQueue })),
}));
