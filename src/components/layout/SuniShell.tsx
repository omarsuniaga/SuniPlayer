import React from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { SettingsPanel } from "./SettingsPanel";
import { THEME } from "../../data/theme.ts";
import { Builder } from "../../pages/Builder";
import { Player } from "../../pages/Player";
import { History } from "../../pages/History";
import { useAudio } from "../../services/useAudio";

export const SuniShell: React.FC = () => {
    const view = useProjectStore((s) => s.view);
    const playing = useProjectStore((s) => s.playing);
    const mode = useProjectStore((s) => s.mode);

    // 🎵 Mount audio engine globally — persists across view changes
    useAudio();

    return (
        <div
            style={{
                height: "100%",          // ← era minHeight:100vh (rompe scroll de hijos)
                backgroundColor: THEME.colors.bg,
                color: THEME.colors.text.primary,
                display: "flex",
                flexDirection: "column",
                fontFamily: THEME.fonts.main,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background Atmosphere - Generative Glow */}
            <div
                style={{
                    position: "absolute",
                    top: "-10%",
                    right: "-5%",
                    width: "40vw",
                    height: "40vw",
                    borderRadius: "50%",
                    background: playing
                        ? (mode === "live" ? THEME.colors.brand.cyan : THEME.colors.brand.violet)
                        : "transparent",
                    filter: "blur(180px)",
                    opacity: 0.1,
                    pointerEvents: "none",
                    transition: "background 1.5s ease, opacity 1s",
                }}
            />

            <Navbar />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
                {view === "builder" && <Builder />}
                {view === "player" && <Player />}
                {view === "history" && <History />}
            </div>

            {/* Mobile bottom tab navigation */}
            <BottomNav />

            {/* Settings drawer — rendered globally above all views */}
            <SettingsPanel />

            {/* Global CSS for Animations */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid ${THEME.colors.brand.cyan};
          box-shadow: 0 0 10px ${THEME.colors.brand.cyan}40;
        }
      `}</style>
        </div>
    );
};
