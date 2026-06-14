import React, { useState, useEffect } from "react";
import { THEME } from "../../data/theme";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export const InstallButton: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window === "undefined") return false;
        return !window.matchMedia('(display-mode: standalone)').matches;
    });

    useEffect(() => {
        const handler = (e: BeforeInstallPromptEvent) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
            console.log("[PWA] beforeinstallprompt event fired");
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        // No native prompt available (browser without support, not yet eligible,
        // or running inside an iframe/preview): guide the user instead of doing
        // nothing on click.
        if (!deferredPrompt) {
            setShowHelp(true);
            return;
        }

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

            {showHelp && (
                <div
                    onClick={(e) => { e.stopPropagation(); setShowHelp(false); }}
                    style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#14181F", border: `1px solid ${THEME.colors.brand.cyan}40`, borderRadius: 14, padding: 22, textAlign: "left", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
                        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: THEME.colors.brand.cyan, textTransform: "uppercase", letterSpacing: 0.5 }}>Instalar SuniPlayer</h3>
                        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#bbb", lineHeight: 1.5 }}>Tu navegador no ofreció el instalador automático. Podés instalarla manualmente:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>
                            <div><strong style={{ color: "white" }}>Chrome / Edge:</strong> menú ⋮ → “Instalar app”.</div>
                            <div><strong style={{ color: "white" }}>iPhone (Safari):</strong> Compartir → “Agregar a inicio”.</div>
                            <div><strong style={{ color: "white" }}>Android:</strong> menú ⋮ → “Agregar a pantalla de inicio”.</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setShowHelp(false); }} style={{ width: "100%", marginTop: 18, padding: 12, borderRadius: 8, border: "none", background: THEME.colors.brand.cyan, color: "black", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>ENTENDIDO</button>
                    </div>
                </div>
            )}

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
