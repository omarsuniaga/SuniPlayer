import React from "react";

import { AppAtmosphere } from "./AppAtmosphere";
import { AppViewport } from "./AppViewport";
import { useProjectStore } from "../store/useProjectStore";
import { useLiveProtection } from "./useLiveProtection";
import { useLibraryStore } from "../store/useLibraryStore";
import { useWakeLock } from "./useWakeLock";
import { Navbar } from "../components/layout/Navbar";
import { BottomNav } from "../components/layout/BottomNav";
import { THEME } from "../data/theme.ts";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

export const AppShell: React.FC = () => {
    const mode = useProjectStore(s => s.mode);
    const setElapsed = useProjectStore(s => s.setElapsed);
    const isLive = mode === "live";
    const hydrateLibrary = useLibraryStore(s => s.hydrateFromStorage);
    
    useLiveProtection();
    useWakeLock();
    const [isLargeScreen, setIsLargeScreen] = React.useState(window.innerWidth >= 1024);

    // ⏱️ GLOBAL SHOW TIMER: Indestructible en Modo Show
    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        
        if (isLive) {
            console.log("[AppShell] ⏱️ Show Timer Started");
            interval = setInterval(() => {
                setElapsed((prev: number) => prev + 1);
            }, 1000);
        } else {
            setElapsed(0); // Reset al salir del modo show
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLive, setElapsed]);

    React.useEffect(() => {
        hydrateLibrary();
        const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [hydrateLibrary]);

    return (
        <div className={`app-shell ${isLive ? "mode-live" : "mode-edit"}`} style={{
            height: "100dvh",
            width: "100dvw",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#000",
            overflow: "hidden",
            position: "relative"
        }}>
            {/* 🟣 SHOW MODE PERIMETER BORDER (Soft Violet) */}
            {isLive && (
                <div className="live-border-overlay" />
            )}

            {/* Focus anchor */}
            <textarea 
                id="suni-pedal-focus" 
                inputMode="none" 
                autoCapitalize="none" 
                autoCorrect="off" 
                spellCheck="false" 
                style={{ position: "fixed", top: 0, left: 0, width: "1px", height: "1px", zIndex: -1, opacity: 0.01 }}
            />

            <AppAtmosphere />

            <ErrorBoundary zone="Navbar" silent>
                <Navbar />
            </ErrorBoundary>

            <main style={{
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 1
            }}>
                <ErrorBoundary zone="Vista principal">
                    <AppViewport />
                </ErrorBoundary>
            </main>

            <ErrorBoundary zone="BottomNav" silent>
                <BottomNav />
            </ErrorBoundary>

            <style>{`
                .app-shell { transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); height: 100dvh; }
                @supports not (height: 100dvh) { .app-shell { height: -webkit-fill-available; } }
                
                .live-border-overlay {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 9999;
                    border: 3px solid ${THEME.colors.brand.violet};
                    box-shadow: inset 0 0 50px rgba(139, 92, 246, 0.2);
                    animation: livePulseBorder 3s ease-in-out infinite;
                }

                @keyframes livePulseBorder {
                    0% { border-color: rgba(139, 92, 246, 0.3); opacity: 0.6; }
                    50% { border-color: rgba(139, 92, 246, 0.8); opacity: 1; }
                    100% { border-color: rgba(139, 92, 246, 0.3); opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};
