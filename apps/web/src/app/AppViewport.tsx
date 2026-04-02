import React, { useRef, useEffect } from "react";

import { History } from "../pages/History";
import { Builder } from "../pages/Builder";
import { Player } from "../pages/Player";
import { Library } from "../pages/Library";
import { usePlayerStore, useSettingsStore } from "@suniplayer/core";
import { useProjectStore } from "../store/useProjectStore";
import { useAudio } from "../services/useAudio";
import { usePedalBindings } from "../services/usePedalBindings";

import { useDebugStore } from "../store/useDebugStore";
import { SettingsPanel } from "../components/layout/SettingsPanel";
import { LiveUnlockModal } from "../components/player/LiveUnlockModal";
import { MiniPlayer } from "../components/player/MiniPlayer";

const viewMap = {
    builder: Builder,
    player: Player,
    history: History,
    library: Library,
} as const;

export const AppViewport: React.FC = () => {
    const view = useProjectStore((state) => state.view);
    const mode = useProjectStore((state) => state.mode);
    const setMode = useProjectStore((state) => state.setMode);
    const showSettings = useProjectStore((state) => state.showSettings);
    const setShowSettings = useProjectStore((state) => state.setShowSettings);
    const pQueue = usePlayerStore((state) => state.pQueue);
    
    const [showUnlockModal, setShowUnlockModal] = React.useState(false);
    const isLive = mode === "live";

    const ActiveView = viewMap[view] ?? Player;
    const setIsFocused = useDebugStore(s => s.setIsFocused);

    useAudio();
    usePedalBindings();

    // Interceptar el cambio de modo para seguridad global
    const handleGlobalModeToggle = () => {
        if (isLive) setShowUnlockModal(true);
        else setMode("live");
    };

    // Maintain focus for pedal events
    useEffect(() => {
        const onFocus = () => setIsFocused(true);
        const onBlur = () => setIsFocused(false);
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, [setIsFocused]);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", height: "100%" }}>
            
            {showUnlockModal && (
                <LiveUnlockModal 
                    onConfirm={() => { setMode("edit"); setShowUnlockModal(false); }} 
                    onCancel={() => setShowUnlockModal(false)} 
                />
            )}

            <div 
                key={view}
                className="view-transition"
                style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}
            >
                <ActiveView onModeToggle={handleGlobalModeToggle} />
            </div>

            {view !== "player" && pQueue.length > 0 && (
                <MiniPlayer />
            )}

            <SettingsPanel />

            <style>{`
                .view-transition {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    animation: viewFade 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                @keyframes viewFade {
                    from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
