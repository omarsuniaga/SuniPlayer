import { useState, useRef, useEffect } from "react";
import { Track } from "@suniplayer/core";

/**
 * usePreviewPlayer â€” Independent audio player for library previews.
 * Doesn't affect the main playback engine.
 */
export function usePreviewPlayer() {
    const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
        
        const handleEnded = () => {
            setIsPlaying(false);
            setPreviewTrackId(null);
        };

        audioRef.current.addEventListener("ended", handleEnded);
        
        return () => {
            audioRef.current?.pause();
            audioRef.current?.removeEventListener("ended", handleEnded);
            audioRef.current = null;
        };
    }, []);

    const togglePreview = (track: Track) => {
        if (!audioRef.current) return;

        if (previewTrackId === track.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            // New track â€” reset and play
            audioRef.current.pause();
            const url = track.blob_url ?? `/audio/${encodeURIComponent(track.file_path)}`;
            audioRef.current.src = url;
            audioRef.current.load();
            audioRef.current.play();
            setPreviewTrackId(track.id);
            setIsPlaying(true);
        }
    };

    const stopPreview = () => {
        audioRef.current?.pause();
        setIsPlaying(false);
        setPreviewTrackId(null);
    };

    return {
        previewTrackId,
        isPreviewPlaying: isPlaying,
        togglePreview,
        stopPreview
    };
}
