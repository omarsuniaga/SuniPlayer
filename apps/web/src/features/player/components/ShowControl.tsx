import React from "react";
import { THEME } from "../../../data/theme.ts";

interface ShowControlProps {
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;
    fadeEnabled: boolean;
    setFadeEnabled: (v: boolean) => void;
    splMeterEnabled: boolean;
    setSplMeterEnabled: (v: boolean) => void;
    curveVisible: boolean;
    setCurveVisible: (v: boolean) => void;
    hasCurve: boolean;
    onToggleQueue: () => void;
}

export const ShowControl: React.FC<ShowControlProps> = ({
    crossfade, setCrossfade,
    fadeEnabled, setFadeEnabled,
    splMeterEnabled, setSplMeterEnabled,
    curveVisible, setCurveVisible,
    hasCurve,
    onToggleQueue
}) => {
    const ControlButton = ({ active, label, onClick, icon }: any) => (
        <button 
            onClick={onClick}
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "12px 8px",
                borderRadius: THEME.radius.md,
                border: `1px solid ${active ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`,
                background: active ? `${THEME.colors.brand.cyan}15` : "rgba(255,255,255,0.02)",
                color: active ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                minWidth: "70px"
            }}
        >
            <div style={{ opacity: active ? 1 : 0.5 }}>{icon}</div>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.05em" }}>{label}</span>
        </button>
    );

    return (
        <div style={{ 
            display: "flex", 
            gap: 10, 
            width: "100%", 
            backgroundColor: "rgba(255,255,255,0.02)", 
            padding: "8px", 
            borderRadius: THEME.radius.lg,
            border: `1px solid ${THEME.colors.border}`,
            alignItems: "stretch"
        }}>
            <ControlButton 
                active={crossfade} 
                label="CROSS" 
                onClick={() => setCrossfade(!crossfade)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 11l5-5 5 5M7 13l5 5 5-5"/></svg>}
            />
            <ControlButton 
                active={fadeEnabled} 
                label="FADE" 
                onClick={() => setFadeEnabled(!fadeEnabled)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07"/></svg>}
            />
            <ControlButton 
                active={splMeterEnabled} 
                label="METER" 
                onClick={() => setSplMeterEnabled(!splMeterEnabled)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6M12 9v6"/></svg>}
            />
            {hasCurve && (
                <ControlButton 
                    active={curveVisible} 
                    label="CURVE" 
                    onClick={() => setCurveVisible(!curveVisible)}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18M18 9l-5 5-2-2-5 5"/></svg>}
                />
            )}
            
            <div style={{ width: "1px", background: THEME.colors.border, margin: "4px 2px" }} />
            
            <button 
                onClick={onToggleQueue}
                style={{
                    width: "48px",
                    borderRadius: THEME.radius.md,
                    border: "none",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
        </div>
    );
};
