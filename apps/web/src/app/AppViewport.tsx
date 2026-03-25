import React from "react";

import { History } from "../pages/History";
import { Builder } from "../pages/Builder";
import { Player } from "../pages/Player";
import { Library } from "../pages/Library";
import { useProjectStore } from "../store/useProjectStore";
import { useAudio } from "../services/useAudio";
import { usePedalBindings } from "../services/usePedalBindings";

const viewMap = {
    builder: Builder,
    player: Player,
    history: History,
    library: Library,
} as const;

export const AppViewport: React.FC = () => {
    const view = useProjectStore((state) => state.view);
    const ActiveView = viewMap[view] ?? Player;
    const hiddenInputRef = React.useRef<HTMLInputElement>(null);

    useAudio();
    usePedalBindings();

    // Background analysis check
    React.useEffect(() => {
        const interval = setInterval(() => {
            import("../services/backgroundAnalysis").then(m => m.runBackgroundAnalysis());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Maintain focus for pedal events (iPad keyboard emulation)
    React.useEffect(() => {
        const refocus = (e: MouseEvent | TouchEvent) => {
            // Only refocus if the target isn't already an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                setTimeout(() => hiddenInputRef.current?.focus(), 100);
            }
        };

        window.addEventListener('click', refocus);
        window.addEventListener('touchstart', refocus);
        
        // Initial focus
        setTimeout(() => hiddenInputRef.current?.focus(), 500);

        return () => {
            window.removeEventListener('click', refocus);
            window.removeEventListener('touchstart', refocus);
        };
    }, []);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
            {/* Hidden focus anchor for iPad pedals */}
            <input 
                id="suni-pedal-focus"
                ref={hiddenInputRef}
                type="text" 
                readOnly
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: -100, left: -100, width: 1, height: 1 }}
                aria-hidden="true"
            />
            <ActiveView />
        </div>
    );
};
