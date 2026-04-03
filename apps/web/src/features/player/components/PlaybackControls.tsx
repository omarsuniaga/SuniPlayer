import React from "react";
import { THEME } from "../../../data/theme.ts";
import { useIsMobile } from "../../../utils/useMediaQuery";

interface PlaybackControlsProps {
    playing: boolean;
    isLive: boolean;
    ci: number;
    queueLen: number;
    pos: number;
    performanceMode: boolean;
    mCol: string;
    onPlayPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onStop: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    playing, isLive, ci, queueLen, pos, performanceMode, mCol,
    onPlayPause, onPrev, onNext, onStop
}) => {
    const isMobile = useIsMobile();
    const playSize = isMobile ? 64 : (performanceMode ? 120 : 88);
    const skipSize = isMobile ? 36 : (performanceMode ? 44 : 32);

    return (
        <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: isMobile ? 16 : (performanceMode ? 60 : 32) 
        }}>
            {/* Botón Stop — Bloqueado en Live Mode */}
            <button 
                onClick={() => { if (!isLive) onStop(); }} 
                title={isLive ? "Stop bloqueado en Live Mode" : "Detener"}
                style={{ 
                    background: "none", 
                    border: "none", 
                    opacity: isLive ? 0.15 : (playing || pos > 0) ? 0.9 : 0.2, 
                    cursor: isLive ? "not-allowed" : "pointer",
                    transform: performanceMode ? "scale(1.3)" : "none",
                    transition: "all 0.3s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: isMobile ? 12 : 8 // Larger hit area
                }}
            >
                <svg width={isMobile ? 24 : 28} height={isMobile ? 24 : 28} viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
            </button>

            <button 
                onClick={() => { if (!isLive && ci > 0) onPrev(); }} 
                style={{ 
                    background: "none", 
                    border: "none", 
                    opacity: isLive ? 0.15 : ci > 0 ? 0.9 : 0.2, 
                    cursor: isLive ? "not-allowed" : "pointer", 
                    transform: performanceMode ? "scale(1.5)" : "none", 
                    transition: "transform 0.3s",
                    padding: isMobile ? 12 : 8 // Larger hit area
                }}
            >
                <svg width={skipSize} height={skipSize} viewBox="0 0 24 24" fill="white"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            
            <button 
                onClick={onPlayPause} 
                style={{ 
                    width: playSize, height: playSize, 
                    borderRadius: "50%", border: "none", 
                    background: THEME.gradients.brand, 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    cursor: "pointer", 
                    boxShadow: playing ? `0 0 40px ${mCol}50` : "0 10px 30px rgba(0,0,0,0.5)", 
                    transition: "all 0.3s" 
                }}
            >
                {playing 
                    ? <svg width={isMobile ? 28 : (performanceMode ? 48 : 36)} height={isMobile ? 28 : (performanceMode ? 48 : 36)} viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> 
                    : <svg width={isMobile ? 28 : (performanceMode ? 48 : 36)} height={isMobile ? 28 : (performanceMode ? 48 : 36)} viewBox="0 0 24 24" fill="white" style={{ marginLeft: isMobile ? 4 : (performanceMode ? 8 : 6) }}><path d="M8 5v14l11-7z" /></svg>
                }
            </button>
            
            <button 
                onClick={() => { if (!isLive && ci < queueLen - 1) onNext(); }} 
                style={{ 
                    background: "none", 
                    border: "none", 
                    opacity: isLive ? 0.15 : ci < queueLen - 1 ? 0.9 : 0.2, 
                    cursor: isLive ? "not-allowed" : "pointer", 
                    transform: performanceMode ? "scale(1.5)" : "none", 
                    transition: "transform 0.3s",
                    padding: isMobile ? 12 : 8 // Larger hit area
                }}
            >
                <svg width={skipSize} height={skipSize} viewBox="0 0 24 24" fill="white"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
        </div>
    );
};
