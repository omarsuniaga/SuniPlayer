import React from "react";

import { AppAtmosphere } from "./AppAtmosphere";
import { ShowRecoveryManager } from "./ShowRecoveryManager";
import { AppViewport } from "./AppViewport";
import { Navbar } from "../components/layout/Navbar";
import { BottomNav } from "../components/layout/BottomNav";
import { SettingsPanel } from "../components/layout/SettingsPanel";

import { useProjectStore } from "../store/useProjectStore";

export const AppShell: React.FC = () => {
    const isLive = useProjectStore(s => s.mode === "live");

    return (
        <div className={`app-shell ${isLive ? 'mode-live' : ''}`} style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "box-shadow 0.5s ease"
        }}>
            <AppAtmosphere />
            <ShowRecoveryManager />
            <Navbar />
            <AppViewport />
            <BottomNav />
            <SettingsPanel />

            {/* Live Mode Border Overlay */}
            {isLive && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    border: `3px solid ${THEME.colors.brand.cyan}`,
                    pointerEvents: "none",
                    zIndex: 9999,
                    boxShadow: `inset 0 0 40px ${THEME.colors.brand.cyan}30`,
                    animation: "pulseBorder 2s infinite"
                }} />
            )}

            <style>{`
                @keyframes pulseBorder {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
                .app-shell.mode-live {
                    background-color: #000 !important;
                }
            `}</style>
        </div>
    );
};
