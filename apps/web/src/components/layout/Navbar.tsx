import React, { useState } from "react";
import { useProjectStore, usePlayerStore, Track } from "@suniplayer/core";
import { THEME } from "../../data/theme";
import { fmt } from "../../services/uiUtils";
import { LiveUnlockModal } from "../player/LiveUnlockModal";
import { sumTrackDurationMs } from "../../utils/trackMetrics";

export const Navbar: React.FC = () => {
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const pos = useProjectStore(s => s.pos);
    const playing = useProjectStore(s => s.playing);
    const setShowSettings = useProjectStore(s => s.setShowSettings);
    
    // Show Mode State & Actions
    const mode = useProjectStore(s => s.mode);
    const setMode = useProjectStore(s => s.setMode);
    const elapsed = useProjectStore(s => s.elapsed);
    const isShowMode = mode === "live";
    
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    // Cálculos de tiempo total
    const qTot = sumTrackDurationMs(pQueue);
    const currentProgressMs = sumTrackDurationMs(pQueue.slice(0, ci)) + pos;
    const totalRemainingMs = Math.max(0, qTot - currentProgressMs);

    const handleModeToggle = () => {
        if (isShowMode) setShowUnlockModal(true);
        else setMode("live");
    };

    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                height: "64px",
                backgroundColor: isShowMode ? "rgba(10, 0, 20, 0.95)" : "rgba(10,10,15,0.85)",
                borderBottom: `1px solid ${isShowMode ? THEME.colors.brand.violet + "60" : THEME.colors.border}`,
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backdropFilter: "blur(20px)",
                transition: "all 0.5s ease"
            }}
        >
            {showUnlockModal && (
                <LiveUnlockModal 
                    onConfirm={() => { setMode("edit"); setShowUnlockModal(false); }} 
                    onCancel={() => setShowUnlockModal(false)} 
                />
            )}

            {/* ── Left side: Logo & Timers ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: THEME.radius.md,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isShowMode ? THEME.colors.brand.violet : THEME.gradients.brand,
                        boxShadow: isShowMode ? `0 0 15px ${THEME.colors.brand.violet}60` : `0 4px 12px ${THEME.colors.brand.cyan}40`,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "white" }} className="nav-logo-text">SuniPlayer</span>
                </div>

                {/* ⏱️ DUAL SHOW TIMER */}
                {pQueue.length > 0 && (
                    <div style={{ 
                        display: "flex", alignItems: "center", 
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderRadius: "10px",
                        padding: "2px",
                        border: `1px solid ${isShowMode ? THEME.colors.brand.violet + "40" : "rgba(255,255,255,0.05)"}`
                    }}>
                        {/* Elapsed */}
                        <div style={{ padding: "4px 12px", textAlign: "center" }}>
                            <div style={{ fontSize: 8, fontWeight: 800, color: THEME.colors.text.muted, letterSpacing: 0.5 }}>ELAPSED</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: isShowMode ? THEME.colors.brand.violet : THEME.colors.brand.cyan }}>
                                {fmt(elapsed * 1000)}
                            </div>
                        </div>
                        {/* Separator */}
                        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
                        {/* Remaining */}
                        <div style={{ padding: "4px 12px", textAlign: "center" }}>
                            <div style={{ fontSize: 8, fontWeight: 800, color: THEME.colors.text.muted, letterSpacing: 0.5 }}>REMAINING</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: "white" }}>
                                {fmt(totalRemainingMs)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right side: Show Toggle & Settings ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                    onClick={handleModeToggle}
                    className="mode-toggle-btn"
                    style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        border: `1px solid ${isShowMode ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`,
                        background: isShowMode ? THEME.colors.brand.violet : "rgba(255,255,255,0.02)",
                        color: isShowMode ? "white" : THEME.colors.text.muted,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                        fontWeight: 900, fontSize: 11,
                        transition: "all 0.3s ease"
                    }}
                >
                    <div className={isShowMode ? "record-dot-active" : "record-dot"} />
                    <span>{isShowMode ? "MODO SHOW" : "SHOW"}</span>
                </button>

                <button
                    className="settings-btn"
                    onClick={() => setShowSettings(true)}
                    style={{
                        background: "none",
                        border: `1px solid rgba(255,255,255,0.1)`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        color: THEME.colors.text.muted,
                        width: "38px", height: "38px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </button>
            </div>

            <style>{`
                .record-dot { width: 8px; height: 8px; border-radius: 50%; background: #FF0000; opacity: 0.4; }
                .record-dot-active { width: 8px; height: 8px; border-radius: 50%; background: #fff; animation: blink 1s infinite; }
                @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
                @media (max-width: 850px) { .nav-logo-text { display: none; } }
                @media (max-width: 640px) { .live-label { display: none; } }
            `}</style>
        </header>
    );
};
