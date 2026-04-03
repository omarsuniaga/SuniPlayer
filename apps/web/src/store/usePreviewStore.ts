import { create } from "zustand";
import { Track } from "@suniplayer/core";
import { usePlayerStore } from "./usePlayerStore.ts";

interface PreviewState {
    previewTrackId: string | null;
    isPlaying: boolean;
    isLoading: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    togglePreview: (track: Track) => void;
    stopPreview: () => void;
    setVolume: (volume: number) => void;
}

const previewAudio = new Audio();

export const usePreviewStore = create<PreviewState>((set, get) => {
    // Sync internal state with Audio events
    previewAudio.ontimeupdate = () => {
        set({ currentTime: previewAudio.currentTime });
    };

    previewAudio.onloadedmetadata = () => {
        set({ duration: previewAudio.duration, isLoading: false });
    };

    previewAudio.onplay = () => {
        set({ isPlaying: true, isLoading: false });
    };

    previewAudio.onpause = () => {
        set({ isPlaying: false });
    };

    previewAudio.onended = () => {
        set({ isPlaying: false, previewTrackId: null });
    };

    previewAudio.onerror = () => {
        set({ isPlaying: false, isLoading: false, previewTrackId: null });
        console.error("Preview audio error:", previewAudio.error);
    };

    return {
        previewTrackId: null,
        isPlaying: false,
        isLoading: false,
        currentTime: 0,
        duration: 0,
        volume: 0.7,

        togglePreview: (track: Track) => {
            const { previewTrackId, isPlaying } = get();

            // If clicking the same track that is already playing, stop it
            if (previewTrackId === track.id) {
                if (isPlaying) {
                    previewAudio.pause();
                } else {
                    // This case handles if it was paused or ended but ID not cleared
                    previewAudio.play().catch(console.error);
                }
                return;
            }

            // New track or different track
            // 1. Stop current preview if any
            previewAudio.pause();
            previewAudio.src = ""; // Clear current source

            // 2. Pause the Main Player to prevent sound overlap
            usePlayerStore.getState().setPlaying(false);

            // 3. Set up new track
            const sourceUrl = track.blob_url || track.file_path;
            if (!sourceUrl) {
                console.warn("No source URL for track preview:", track.id);
                return;
            }

            set({
                previewTrackId: track.id,
                isLoading: true,
                currentTime: 0,
                duration: 0
            });

            previewAudio.src = sourceUrl;
            previewAudio.volume = get().volume;
            previewAudio.play().catch(err => {
                console.error("Failed to play preview:", err);
                set({ isLoading: false, previewTrackId: null });
            });
        },

        stopPreview: () => {
            previewAudio.pause();
            previewAudio.src = "";
            set({ previewTrackId: null, isPlaying: false, isLoading: false });
        },

        setVolume: (volume: number) => {
            previewAudio.volume = volume;
            set({ volume });
        }
    };
});
