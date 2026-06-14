import React, { useState } from "react";
import { THEME } from "../../../data/theme.ts";
import { useIsMobile } from "../../../utils/useMediaQuery";

interface VolumeControlProps {
    vol: number;
    mCol: string;
    performanceMode: boolean;
    onVolumeChange: (v: number) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
    vol, mCol, performanceMode, onVolumeChange
}) => {
    const isMobile = useIsMobile();
    const [prevVol, setPrevVol] = useState(vol > 0 ? vol : 0.5);
    const isMuted = vol === 0;

    const handleMuteToggle = () => {
        if (isMuted) {
            onVolumeChange(prevVol);
        } else {
            setPrevVol(vol);
            onVolumeChange(0);
        }
    };

    // Sensibilidad Logarítmica (Percepción humana)
    const displayVol = Math.round(vol * 100);

    return (
        <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? 12 : 16, 
            padding: isMobile ? "6px 12px" : (performanceMode ? "10px 20px" : "0 10px"),
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: THEME.radius.lg,
            border: `1px solid ${isMuted ? THEME.colors.status.error + "30" : "transparent"}`,
            transition: "all 0.3s"
        }}>
            {/* Botón MUTE */}
            <button 
                onClick={handleMuteToggle}
                title={isMuted ? "Activar sonido" : "Silenciar"}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isMuted ? THEME.colors.status.error : "rgba(255,255,255,0.5)",
                    transition: "all 0.2s",
                    padding: isMobile ? 10 : 8,
                    borderRadius: "50%",
                    backgroundColor: isMuted ? `${THEME.colors.status.error}15` : "transparent"
                }}
            >
                {isMuted ? (
                    <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
                ) : (
                    <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
            </button>

            <div style={{ flex: 1, position: "relative", height: isMobile ? 8 : (performanceMode ? 32 : 12) }}>
                <div style={{ 
                    position: "absolute", inset: 0, 
                    background: "rgba(255,255,255,0.06)", 
                    borderRadius: isMobile ? 4 : (performanceMode ? 16 : 6) 
                }} />
                
                {/* Barra de progreso de volumen */}
                <div style={{ 
                    position: "absolute", top: 0, bottom: 0, left: 0, 
                    width: `${vol * 100}%`, 
                    background: isMuted ? THEME.colors.status.error : THEME.gradients.brand, 
                    borderRadius: isMobile ? 4 : (performanceMode ? 16 : 6), 
                    boxShadow: isMuted ? "none" : `0 0 15px ${mCol}40`,
                    transition: "width 0.1s ease-out, background-color 0.3s"
                }} />

                <input 
                    type="range" min="0" max="100" 
                    value={vol * 100} 
                    onChange={e => onVolumeChange(parseInt(e.target.value) / 100)} 
                    style={{ 
                        position: "absolute", inset: 0, width: "100%", height: "100%", 
                        opacity: 0, cursor: "pointer", zIndex: 10
                    }} 
                />
            </div>

            <div style={{ 
                minWidth: isMobile ? 40 : 50, 
                textAlign: "right",
                fontSize: isMobile ? 13 : (performanceMode ? 22 : 15), 
                fontWeight: 900, 
                fontFamily: THEME.fonts.mono, 
                color: isMuted ? THEME.colors.status.error : mCol,
                opacity: isMuted ? 0.8 : 1
            }}>
                {isMuted ? "MUTE" : `${displayVol}%`}
            </div>
        </div>
    );
};
