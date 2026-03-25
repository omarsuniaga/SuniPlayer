import React from "react";
import { THEME } from "../../../data/theme.ts";
import { fmtM } from "../../../services/uiUtils.ts";

interface SetStatusPanelProps {
    isLive: boolean;
    performanceMode: boolean;
    elapsed: number;
    qTot: number;
    currentProgressMs: number;
    onModeToggle: () => void;
    mCol: string;
}

export const SetStatusPanel: React.FC<SetStatusPanelProps> = ({
    isLive, performanceMode, elapsed, qTot, currentProgressMs, onModeToggle, mCol
}) => (
    <div style={{ 
        marginTop: "auto", 
        padding: performanceMode ? "32px" : "24px", 
        borderRadius: THEME.radius.xl, 
        backgroundColor: THEME.colors.surface, 
        border: `1px solid ${isLive ? THEME.colors.brand.cyan + "25" : THEME.colors.border}`, 
        display: "flex", flexDirection: "column", gap: 20 
    }}>
        <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900, letterSpacing: 1.5 }}>SET ELAPSED</span>
                    <span style={{ fontSize: performanceMode ? 24 : 18, fontWeight: 900, color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono }}>{fmtM(elapsed * 1000)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900, letterSpacing: 1.5 }}>TOTAL REMAINING</span>
                    <span style={{ fontSize: performanceMode ? 24 : 18, fontWeight: 900, color: mCol, fontFamily: THEME.fonts.mono }}>{fmtM(Math.max(0, qTot - currentProgressMs))}</span>
                </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, currentProgressMs / (qTot || 1) * 100)}%`, background: THEME.gradients.brand, transition: "width 0.5s" }} />
            </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.4 }}>Total Set: {fmtM(qTot)}</span>
                <span style={{ fontSize: 9, opacity: 0.2, fontWeight: 800 }}>V1.2.1-FORCE-REFRESH</span>
            </div>
            <button 
                onClick={onModeToggle} 
                style={{ 
                    padding: "10px 24px", 
                    borderRadius: THEME.radius.full, 
                    background: isLive ? THEME.colors.brand.cyan + "20" : "rgba(255,255,255,0.05)", 
                    border: `1px solid ${isLive ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`, 
                    color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.muted, 
                    fontSize: 12, fontWeight: 900, cursor: "pointer" 
                }}
            >
                {isLive ? "EXIT LIVE" : "ENTER LIVE"}
            </button>
        </div>
    </div>
);
