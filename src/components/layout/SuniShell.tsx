import React from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { Navbar } from "./Navbar.tsx";
import { BottomNav } from "./BottomNav.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { THEME } from "../../data/theme.ts";
import { Builder } from "../../pages/Builder.tsx";
import { Player } from "../../pages/Player.tsx";
import { History } from "../../pages/History.tsx";
import { useAudio } from "../../services/useAudio.ts";

export const SuniShell: React.FC = () => {
    const view = useProjectStore((s) => s.view);
    const playing = useProjectStore((s) => s.playing);
    const mode = useProjectStore((s) => s.mode);

    // 🎵 Mount audio engine globally — persists across view changes
    useAudio();

    return (
        <div className="app-shell">
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

            {/* Global animations and range-thumb are in index.css */}
        </div>
    );
};
