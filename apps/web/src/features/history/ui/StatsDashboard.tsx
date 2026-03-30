import React from "react";
import { useLibraryStore, useHistoryStore } from "@suniplayer/core";
import { THEME } from "../../../data/theme";

export const StatsDashboard: React.FC = () => {
    const { customTracks } = useLibraryStore();
    const history = useHistoryStore(s => s.history);

    const totalMs = history.reduce((acc, show) => {
        return acc + show.sets.reduce((setAcc, set) => setAcc + (set.durationMs || 0), 0);
    }, 0);
    const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(1);

    const tracksWithBpm = customTracks.filter(t => (t.bpm || 0) > 0);
    const avgBpm = tracksWithBpm.length > 0
        ? Math.round(tracksWithBpm.reduce((acc, t) => acc + (t.bpm || 0), 0) / tracksWithBpm.length)
        : 0;

    const avgEnergy = customTracks.length > 0 
        ? (customTracks.reduce((acc, t) => acc + (t.energy || 0), 0) / customTracks.length)
        : 0.5;

    return (
        <div className="stats-container">
            {/* CARD: TIEMPO TOTAL */}
            <div className="stats-card">
                <div className="icon-box" style={{ background: `${THEME.colors.brand.cyan}15`, color: THEME.colors.brand.cyan }}>â±ï¸</div>
                <div className="stat-content">
                    <div className="stat-label">TOTAL SHOWS</div>
                    <div className="stat-value">{totalHours}<span className="stat-unit">HRS</span></div>
                </div>
            </div>

            {/* CARD: BPM PROMEDIO */}
            <div className="stats-card">
                <div className="icon-box" style={{ background: `${THEME.colors.brand.pink}15`, color: THEME.colors.brand.pink }}>ðŸ’“</div>
                <div className="stat-content">
                    <div className="stat-label">BPM MEDIO</div>
                    <div className="stat-value">{avgBpm}<span className="stat-unit">BPM</span></div>
                </div>
            </div>

            {/* CARD: ENERGÃA */}
            <div className="stats-card energy-card">
                <div className="icon-box" style={{ background: `${THEME.colors.brand.violet}15`, color: THEME.colors.brand.violet }}>âš¡</div>
                <div className="stat-content" style={{ flex: 1 }}>
                    <div className="stat-label">ENERGÃA</div>
                    <div className="stat-value">{Math.round(avgEnergy * 100)}%</div>
                    <div className="energy-bar-bg">
                        <div className="energy-bar-fill" style={{ width: `${avgEnergy * 100}%` }} />
                    </div>
                </div>
            </div>

            <style>{`
                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                    font-family: 'DM Sans', sans-serif;
                    width: 100%;
                }
                .stats-card {
                    background: #121820;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    transition: all 0.3s ease;
                }
                .icon-box {
                    width: 44px;
                    height: 44px;
                    min-width: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                .stat-label {
                    font-size: 9px;
                    font-weight: 800;
                    color: ${THEME.colors.text.muted};
                    letter-spacing: 0.08em;
                    margin-bottom: 2px;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: 900;
                    color: white;
                    font-family: 'JetBrains Mono', monospace;
                    line-height: 1;
                }
                .stat-unit {
                    font-size: 11px;
                    margin-left: 4px;
                    opacity: 0.4;
                }
                .energy-bar-bg {
                    width: 100%;
                    height: 3px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 2px;
                    margin-top: 6px;
                    overflow: hidden;
                }
                .energy-bar-fill {
                    height: 100%;
                    background: ${THEME.gradients.brand};
                }

                @media (max-width: 640px) {
                    .stats-container {
                        gap: 10px;
                        grid-template-columns: repeat(3, minmax(180px, 1fr));
                        overflow-x: auto;
                    }
                    .stats-card {
                        padding: 12px;
                        gap: 10px;
                    }
                    .stat-value {
                        font-size: 20px;
                    }
                    .icon-box {
                        width: 36px;
                        height: 36px;
                        min-width: 36px;
                        font-size: 16px;
                    }
                }
            `}</style>
        </div>
    );
};
