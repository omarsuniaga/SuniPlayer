import React from "react";
import { THEME } from "../../../data/theme.ts";
import { useIsMobile } from "../../../utils/useMediaQuery";

interface ShowControlProps {
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;
    fadeEnabled: boolean;
    setFadeEnabled: (v: boolean) => void;
    splMeterEnabled: boolean;
    setSplMeterEnabled: (v: boolean) => void;
    curveVisible: boolean;
    setCurveVisible: (v: boolean) => void;
    hasCurve: boolean;
    isMirrorOpen: boolean;
    onToggleMirror: () => void;
    mirrorMode: 'docked' | 'floating';
    onToggleMirrorMode: () => void;
    onToggleQueue: () => void;
}

export const ShowControl: React.FC<ShowControlProps> = ({
    autoNext, setAutoNext,
    crossfade, setCrossfade,
    fadeEnabled, setFadeEnabled,
    splMeterEnabled, setSplMeterEnabled,
    curveVisible, setCurveVisible,
    hasCurve,
    isMirrorOpen, onToggleMirror,
    mirrorMode, onToggleMirrorMode,
    onToggleQueue
}) => {
    const isMobile = useIsMobile();

    const ControlButton = ({ active, label, onClick, icon }: any) => (
        <button 
            onClick={onClick}
            style={{
                flex: isMobile ? "1 1 calc(33.33% - 8px)" : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: isMobile ? "8px 4px" : "12px 8px",
                borderRadius: THEME.radius.md,
                border: `1px solid ${active ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`,
                background: active ? `${THEME.colors.brand.cyan}15` : "rgba(255,255,255,0.02)",
                color: active ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                minWidth: isMobile ? "0" : "60px"
            }}
        >
            <div style={{ opacity: active ? 1 : 0.5 }}>
                {React.cloneElement(icon as React.ReactElement, { 
                    width: isMobile ? 14 : 16, 
                    height: isMobile ? 14 : 16 
                })}
            </div>
            <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 900, letterSpacing: "0.05em" }}>{label}</span>
        </button>
    );

    return (
        <div className="show-control-wrapper" style={{ 
            display: "flex", 
            gap: isMobile ? 8 : 10, 
            width: "100%", 
            backgroundColor: "rgba(255,255,255,0.02)", 
            padding: "8px", 
            borderRadius: THEME.radius.lg,
            border: `1px solid ${THEME.colors.border}`,
            alignItems: "stretch",
            flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
            <ControlButton 
                active={autoNext} 
                label="FLOW" 
                onClick={() => setAutoNext(!autoNext)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12h20M17 7l5 5-5 5M2 12l5-5M2 12l5 5"/></svg>}
            />
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

            {!isMobile && <div className="nav-separator" style={{ width: "1px", background: THEME.colors.border, margin: "4px 2px" }} />}

            <ControlButton 
                active={isMirrorOpen} 
                label="CAMERA" 
                onClick={onToggleMirror}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
            />
            
            {!isMobile && <div className="nav-separator" style={{ width: "1px", background: THEME.colors.border, margin: "4px 2px" }} />}
            
            <button 
                className="desktop-only-queue-btn"
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

            <style>{`
                @media (max-width: 768px) {
                    .desktop-only-queue-btn { display: none !important; }
                    .nav-separator { display: none !important; }
                }
            `}</style>
        </div>
    );
};
