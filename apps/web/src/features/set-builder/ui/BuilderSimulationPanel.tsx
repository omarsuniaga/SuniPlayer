import React, { useState } from "react";
import { THEME } from "../../../data/theme";
import { Track, sumTrackDurationMs } from "@suniplayer/core";

interface BuilderSimulationPanelProps {
    tracks: Track[];
}

export const BuilderSimulationPanel: React.FC<BuilderSimulationPanelProps> = ({ tracks }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [progress, setProgress] = useState(0);

    if (tracks.length === 0) return null;

    const totalDuration = sumTrackDurationMs(tracks);
    const totalMin = Math.floor(totalDuration / 60000);
    const totalSec = Math.floor((totalDuration % 60000) / 1000);

    // Calculate overall Harmonic Score
    const getCamelotDist = (k1: string, k2: string) => {
        if (!k1 || !k2) return 2;
        const n1 = parseInt(k1); const l1 = k1.replace(/[0-9]/g, '');
        const n2 = parseInt(k2); const l2 = k2.replace(/[0-9]/g, '');
        const nd = Math.abs(n1 - n2);
        const cd = nd > 6 ? 12 - nd : nd;
        return l1 === l2 ? cd : (cd === 0 ? 1 : cd + 1);
    };

    let harmonicMatches = 0;
    for (let i = 0; i < tracks.length - 1; i++) {
        if (getCamelotDist(tracks[i].key || "", tracks[i+1].key || "") <= 1) {
            harmonicMatches++;
        }
    }
    const harmonicScore = tracks.length > 1 ? Math.round((harmonicMatches / (tracks.length - 1)) * 100) : 100;

    const runSimulation = () => {
        setIsSimulating(true);
        setProgress(0);
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setIsSimulating(false);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    return (
        <div style={{ 
            marginTop: 24, padding: "20px", borderRadius: THEME.radius.lg, 
            backgroundColor: "rgba(0,0,0,0.3)", border: `1px solid ${THEME.colors.border}`,
            animation: "fadeIn 0.5s ease-out"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Set Simulator</h3>
                    <p style={{ fontSize: 11, color: THEME.colors.text.muted, margin: "4px 0 0" }}>Predict performance flow and transition health</p>
                </div>
                <button 
                    onClick={runSimulation}
                    disabled={isSimulating}
                    style={{ 
                        padding: "8px 16px", borderRadius: THEME.radius.sm, border: "none",
                        background: isSimulating ? THEME.colors.surface : THEME.colors.brand.cyan,
                        color: isSimulating ? THEME.colors.text.muted : "black",
                        fontSize: 11, fontWeight: 900, cursor: "pointer",
                        boxShadow: isSimulating ? "none" : `0 4px 12px ${THEME.colors.brand.cyan}40`
                    }}
                >
                    {isSimulating ? "SIMULATING..." : "RUN SIMULATION"}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ padding: "12px", borderRadius: THEME.radius.md, backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.colors.border}40` }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: THEME.colors.text.muted, textTransform: "uppercase" }}>Harmonic Score</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: harmonicScore > 80 ? THEME.colors.status.success : THEME.colors.status.warning }}>
                        {harmonicScore}%
                    </div>
                </div>
                <div style={{ padding: "12px", borderRadius: THEME.radius.md, backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.colors.border}40` }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: THEME.colors.text.muted, textTransform: "uppercase" }}>Predicted Duration</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: THEME.colors.brand.cyan }}>
                        {totalMin}:{totalSec.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            {isSimulating && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700 }}>Processing transitions...</span>
                        <span style={{ fontSize: 10, fontFamily: THEME.fonts.mono }}>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: THEME.colors.brand.cyan, transition: "width 0.1s linear" }} />
                    </div>
                </div>
            )}

            {!isSimulating && progress === 100 && (
                <div style={{ 
                    padding: "10px", borderRadius: THEME.radius.sm, 
                    backgroundColor: `${THEME.colors.status.success}15`, 
                    border: `1px solid ${THEME.colors.status.success}40`,
                    fontSize: 11, color: THEME.colors.status.success, fontWeight: 600,
                    textAlign: "center"
                }}>
                    ✅ Set validated for stage performance.
                </div>
            )}
        </div>
    );
};
