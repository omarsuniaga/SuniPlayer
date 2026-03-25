import { create } from "zustand";
import { DownloadProgress } from "../services/AudioStreamerService";

interface DownloadState {
    activeDownloads: Record<string, DownloadProgress>;
    updateProgress: (url: string, progress: DownloadProgress) => void;
    clearProgress: (url: string) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
    activeDownloads: {},
    updateProgress: (url, progress) => set((state) => ({
        activeDownloads: { ...state.activeDownloads, [url]: progress }
    })),
    clearProgress: (url) => set((state) => {
        const next = { ...state.activeDownloads };
        delete next[url];
        return { activeDownloads: next };
    }),
}));
