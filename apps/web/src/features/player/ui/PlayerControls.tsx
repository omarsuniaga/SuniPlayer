// src/features/player/ui/PlayerControls.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";
import { useIsMobile } from "../../../utils/useMediaQuery";
import { usePlayerStore } from "@suniplayer/core";

interface Props {
    playing: boolean;
    isLive: boolean;
    ci: number;
    queueLen: number;
    vol: number;
    mCol: string;
    onPlayPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onVolumeChange: (v: number) => void;
}

export const PlayerControls: React.FC<Props> = ({
    playing, isLive, ci, queueLen, vol, mCol,
    onPlayPause, onPrev, onNext, onVolumeChange,
}) => {
    const isMobile = useIsMobile();
    const countdown = usePlayerStore(s => s.countdown);
    const playSize = isMobile ? 64 : 80;
    const iconSize = isMobile ? 28 : 32;

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: isMobile ? 16 : 32, 
            marginTop: isMobile ? 8 : 16 
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24 }}>
                {/* Prev — blocked in live */}
                <button
                    onClick={onPrev}
                    title={isLive ? "Bloqueado en modo Live" : "Anterior"}
                    style={{
                        background: "none", border: "none",
                        cursor: isLive ? "not-allowed" : "pointer",
                        opacity: isLive ? 0.15 : ci > 0 ? 0.6 : 0.1,
                        transition: "opacity 0.2s",
                        position: "relative",
                        padding: isMobile ? "12px" : "8px", 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                </button>

                {/* Play/Pause — always allowed */}
                <button
                    onClick={onPlayPause}
                    disabled={countdown !== null}
                    style={{
                        width: playSize, height: playSize,
                        borderRadius: "50%",
                        border: "none",
                        cursor: countdown !== null ? "default" : "pointer",
                        background: countdown !== null ? THEME.colors.brand.cyan : THEME.gradients.brand,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: countdown !== null ? `0 0 30px ${THEME.colors.brand.cyan}60` : playing ? `0 0 40px ${mCol}40` : "0 10px 30px rgba(0,0,0,0.5)",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        transform: countdown !== null ? "scale(1.15)" : "scale(1)"
                    }}
                    onMouseEnter={e => countdown === null && (e.currentTarget.style.transform = "scale(1.08)")}
                    onMouseLeave={e => countdown === null && (e.currentTarget.style.transform = "scale(1)")}
                >
                    {countdown !== null ? (
                        <span data-testid="play-countdown" style={{ fontSize: isMobile ? 28 : 32, fontWeight: 900, fontFamily: THEME.fonts.mono, color: "white" }}>
                            {countdown}
                        </span>
                    ) : playing
                        ? <svg width={isMobile ? 28 : 32} height={isMobile ? 28 : 32} viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        : <svg width={isMobile ? 28 : 32} height={isMobile ? 28 : 32} viewBox="0 0 24 24" fill="white" style={{ marginLeft: isMobile ? 3 : 4 }}><path d="M8 5v14l11-7z" /></svg>
                    }
                </button>

                {/* Next — blocked in live */}
                <button
                    onClick={onNext}
                    title={isLive ? "Bloqueado en modo Live" : "Siguiente"}
                    style={{
                        background: "none", border: "none",
                        cursor: isLive ? "not-allowed" : "pointer",
                        opacity: isLive ? 0.15 : ci < queueLen - 1 ? 0.6 : 0.1,
                        transition: "opacity 0.2s",
                        padding: isMobile ? "12px" : "8px", 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
            </div>

            {/* Volume — ALWAYS UNLOCKED */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={THEME.colors.text.muted}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                <input
                    type="range" min="0" max="100"
                    value={Math.round(vol * 100)}
                    onChange={e => onVolumeChange(parseInt(e.target.value) / 100)}
                    className="vol-slider"
                    style={{
                        width: isMobile ? 120 : 200,
                        appearance: "none",
                        height: 4,
                        borderRadius: 2,
                        background: `linear-gradient(to right, ${mCol} ${vol * 100}%, rgba(255,255,255,0.08) ${vol * 100}%)`,
                        outline: "none",
                        cursor: "pointer",
                    }}
                />
                {!isMobile && (
                    <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, color: THEME.colors.text.muted, width: 40 }}>{Math.round(vol * 100)}%</span>
                )}
            </div>
        </div>
    );
};
