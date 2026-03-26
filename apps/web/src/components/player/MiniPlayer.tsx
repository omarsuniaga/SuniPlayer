import React, { useState } from "react";
import { useProjectStore, Track, useSettingsStore } from "@suniplayer/core";
import { THEME } from "../../data/theme";
import { fmt } from "../../services/uiUtils";

export const MiniPlayer: React.FC = () => {
    const { pQueue, ci, pos, playing, setPlaying, setCi, setPos, setView } = useProjectStore();
    const { crossfade, crossfadeMs, fadeEnabled, fadeOutMs } = useSettingsStore();

    const [minimized, setMinimized] = useState(false);

    const ct = pQueue[ci];
    if (!ct) return null;

    // Función para saltar de tema con estilo (Graceful Skip)
    const handleNextGraceful = () => {
        if (!playing) {
            if (ci < pQueue.length - 1) { setCi(ci + 1); setPos(0); }
            return;
        }

        const trackEnd = ct.endTime || ct.duration_ms;
        const triggerMs = crossfade ? crossfadeMs : (fadeEnabled ? fadeOutMs : 300);
        const jumpTo = Math.max(0, (trackEnd - triggerMs + 100) / 1000);
        
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.currentTime = jumpTo;
            }
        });
    };

    if (minimized) {
        return (
            <button 
                onClick={() => setMinimized(false)}
                style={{
                    position: "fixed", bottom: "85px", right: "20px",
                    width: "44px", height: "44px", borderRadius: "50%",
                    background: THEME.gradients.brand, color: "white",
                    border: "none", cursor: "pointer", zIndex: 1000,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
        );
    }

    return (
        <div style={{
            position: "fixed", bottom: "80px", left: "16px", right: "16px",
            height: "64px", backgroundColor: "#121820",
            borderRadius: "16px", border: `1px solid ${THEME.colors.border}`,
            display: "flex", alignItems: "center", padding: "0 16px",
            zIndex: 1000, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
            cursor: "pointer"
        }} onClick={() => setView("player")}>
            
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ct.title}
                </div>
                <div style={{ fontSize: 11, color: THEME.colors.brand.cyan, fontWeight: 700 }}>
                    {ct.artist || "Artista Local"} • {fmt(pos)} / {fmt(ct.duration_ms)}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setPlaying(!playing)}
                    style={{ 
                        width: 40, height: 40, borderRadius: "50%", border: "none", 
                        background: playing ? "rgba(255,255,255,0.1)" : THEME.colors.brand.cyan,
                        color: playing ? "white" : "black", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >
                    {playing ? "⏸" : "▶"}
                </button>
                <button 
                    onClick={handleNextGraceful}
                    style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
                <button 
                    onClick={() => setMinimized(true)}
                    style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer", marginLeft: 4 }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
            </div>

            {/* Progress line */}
            <div style={{ position: "absolute", bottom: 0, left: "16px", right: "16px", height: "2px", background: "rgba(255,255,255,0.05)" }}>
                <div style={{ height: "100%", background: THEME.colors.brand.cyan, width: `${(pos / ct.duration_ms) * 100}%` }} />
            </div>
        </div>
    );
};
