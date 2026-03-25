import React from "react";
import { THEME } from "../../../data/theme.ts";

interface VolumeControlProps {
    vol: number;
    mCol: string;
    performanceMode: boolean;
    onVolumeChange: (v: number) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
    vol, mCol, performanceMode, onVolumeChange
}) => (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "0 10px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
        <div style={{ flex: 1, position: "relative", height: performanceMode ? 32 : 10 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)", borderRadius: performanceMode ? 16 : 5 }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${vol * 100}%`, background: THEME.gradients.brand, borderRadius: performanceMode ? 16 : 5, boxShadow: `0 0 10px ${mCol}30` }} />
            <input 
                type="range" min="0" max="100" 
                value={vol * 100} 
                onChange={e => onVolumeChange(parseInt(e.target.value) / 100)} 
                title="Control de volumen maestro" 
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            />
        </div>
        <span style={{ fontSize: performanceMode ? 24 : 16, fontWeight: 900, fontFamily: THEME.fonts.mono, color: mCol, width: 60 }}>{Math.round(vol * 100)}%</span>
    </div>
);
