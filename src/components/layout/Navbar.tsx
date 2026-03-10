import React from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { THEME } from "../../data/theme.ts";

export const Navbar: React.FC = () => {
    const view = useProjectStore(s => s.view);
    const setView = useProjectStore(s => s.setView);
    const pQueue = useProjectStore(s => s.pQueue);
    const playing = useProjectStore(s => s.playing);
    const setShowSettings = useProjectStore(s => s.setShowSettings);

    const navBtn = (id: "builder" | "player" | "history", label: string, icon: React.ReactNode) => {
        const active = view === id;
        return (
            <button
                key={id}
                onClick={() => setView(id)}
                style={{
                    padding: "8px 16px",
                    borderRadius: THEME.radius.md,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: active ? "rgba(6,182,212,0.12)" : "transparent",
                    color: active ? THEME.colors.brand.cyan : THEME.colors.text.secondary,
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                }}
                onMouseEnter={e => {
                    if (!active) e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover;
                }}
                onMouseLeave={e => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
            >
                {icon}
                {label}
                {id === "player" && pQueue.length > 0 && (
                    <span
                        style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: THEME.radius.full,
                            backgroundColor: playing ? THEME.colors.brand.cyan : "rgba(255,255,255,0.15)",
                            color: "white",
                            fontWeight: 700,
                            transition: "background-color 0.3s",
                        }}
                    >
                        {pQueue.length}
                    </span>
                )}
            </button>
        );
    };

    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 24px",
                backgroundColor: "rgba(10,10,15,0.8)",
                borderBottom: `1px solid ${THEME.colors.border}`,
                position: "sticky",
                top: 0,
                zIndex: 100,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                flexShrink: 0,
            }}
        >
            {/* ── Logo ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: THEME.radius.md,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: THEME.gradients.brand,
                        boxShadow: `0 4px 12px ${THEME.colors.brand.cyan}40`,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>SuniPlayer</span>

                {/* Playing indicator bars — desktop only */}
                {playing && (
                    <div className="playing-bars" style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 15, marginLeft: 4 }}>
                        {[0.55, 1, 0.7, 0.85, 0.45].map((h, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 3,
                                    height: `${h * 15}px`,
                                    backgroundColor: THEME.colors.brand.cyan,
                                    borderRadius: 2,
                                    animation: `pulse ${0.55 + i * 0.1}s ease-in-out infinite alternate`,
                                    opacity: 0.85,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Desktop Nav (hidden on mobile, replaced by BottomNav) ── */}
            <nav
                className="desktop-nav"
                style={{
                    display: "flex",
                    gap: 4,
                    padding: 4,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: THEME.radius.lg,
                }}
            >
                {navBtn("builder", "Builder",
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                    </svg>
                )}
                {navBtn("player", "Player",
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
                {navBtn("history", "History",
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                )}
            </nav>

            {/* ── Right side: Settings button (always visible, hamburger future use) ── */}
            <button
                className="settings-btn"
                title="Configuración"
                onClick={() => setShowSettings(true)}
                style={{
                    background: "none",
                    border: `1px solid ${THEME.colors.border}`,
                    borderRadius: THEME.radius.md,
                    cursor: "pointer",
                    color: THEME.colors.text.muted,
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover;
                    e.currentTarget.style.color = THEME.colors.text.primary;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = THEME.colors.text.muted;
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>

            {/* ── Responsive styles ── */}
            <style>{`
                @media (max-width: 640px) {
                    .desktop-nav   { display: none !important; }
                    .playing-bars  { display: none !important; }
                }
            `}</style>
        </header>
    );
};
