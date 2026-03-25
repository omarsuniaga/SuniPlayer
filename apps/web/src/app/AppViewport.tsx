import React from "react";

import { History } from "../pages/History";
import { Builder } from "../pages/Builder";
import { Player } from "../pages/Player";
import { Library } from "../pages/Library";
import { useProjectStore } from "../store/useProjectStore";
import { useAudio } from "../services/useAudio";
import { usePedalBindings } from "../services/usePedalBindings";

import { useDebugStore } from "../store/useDebugStore";

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
    const setIsFocused = useDebugStore(s => s.setIsFocused);

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
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                hiddenInputRef.current?.focus();
            }
        };

        const onFocus = () => setIsFocused(true);
        const onBlur = () => setIsFocused(false);

        window.addEventListener('click', refocus);
        window.addEventListener('touchstart', refocus);
        
        const el = hiddenInputRef.current;
        el?.addEventListener('focus', onFocus);
        el?.addEventListener('blur', onBlur);
        
        // Initial focus
        setTimeout(() => hiddenInputRef.current?.focus(), 1500);

        return () => {
            window.removeEventListener('click', refocus);
            window.removeEventListener('touchstart', refocus);
            el?.removeEventListener('focus', onFocus);
            el?.removeEventListener('blur', onBlur);
        };
    }, [setIsFocused]);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
            {/* Last Resort Focus Anchor: Invisible Textarea covering screen area technically */}
            <textarea 
                id="suni-pedal-focus"
                ref={hiddenInputRef as any}
                inputMode="none"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                style={{ 
                    position: 'fixed', 
                    top: 0, left: 0, 
                    width: '100%', height: '100%', 
                    padding: 0, margin: 0,
                    border: 'none',
                    background: 'transparent',
                    color: 'transparent',
                    outline: 'none',
                    zIndex: -1, // Cambiado de 9999 a -1 para no bloquear clics
                    pointerEvents: 'none',
                    fontSize: '16px', // iOS requirement to avoid auto-zoom
                    opacity: 0.01 // Minimal opacity sometimes helps more than 0
                }}
                aria-hidden="true"
            />
            <ActiveView />
        </div>
    );
};
