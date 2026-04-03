import React, { useState, useEffect } from "react";
import { THEME } from "../../data/theme";

export const InstallButton: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
            console.log("[PWA] beforeinstallprompt event fired");
        };

        window.addEventListener("beforeinstallprompt", handler as any);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handler as any);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, so clear it
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="pwa-install-btn"
            style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: `1px solid ${THEME.colors.brand.cyan}40`,
                background: "rgba(6, 182, 212, 0.08)",
                color: THEME.colors.brand.cyan,
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.3s ease",
                marginRight: 8,
                letterSpacing: "0.05em",
                textTransform: "uppercase"
            }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>INSTALAR</span>

            <style>{`
                .pwa-install-btn:hover {
                    background: rgba(6, 182, 212, 0.15) !important;
                    border-color: ${THEME.colors.brand.cyan}80 !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
                }
                .pwa-install-btn:active {
                    transform: translateY(0);
                }
                @media (max-width: 640px) {
                    .pwa-install-btn span { display: none; }
                    .pwa-install-btn { padding: 8px; }
                }
            `}</style>
        </button>
    );
};
