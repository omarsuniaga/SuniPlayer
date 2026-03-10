import React from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { THEME } from "../../data/theme.ts";

interface TabItem {
    id: "builder" | "player" | "history";
    label: string;
    icon: (active: boolean) => React.ReactNode;
}

const TABS: TabItem[] = [
    {
        id: "builder",
        label: "Builder",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? THEME.colors.brand.cyan : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
        ),
    },
    {
        id: "player",
        label: "Player",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? THEME.colors.brand.cyan : "currentColor"}>
                <path d="M8 5v14l11-7z" />
            </svg>
        ),
    },
    {
        id: "history",
        label: "History",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? THEME.colors.brand.cyan : "currentColor"} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
];

export const BottomNav: React.FC = () => {
    const view = useProjectStore(s => s.view);
    const setView = useProjectStore(s => s.setView);
    const pQueue = useProjectStore(s => s.pQueue);
    const playing = useProjectStore(s => s.playing);

    return (
        <>
            {/* Spacer so content doesn't hide behind the fixed bar */}
            <div className="bottom-nav-spacer" style={{ display: "none", height: 72 }} />

            <nav
                className="bottom-nav"
                style={{
                    display: "none", // shown via CSS media query
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 68,
                    backgroundColor: "rgba(10,10,15,0.92)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderTop: `1px solid ${THEME.colors.border}`,
                    zIndex: 500,
                    alignItems: "stretch",
                    justifyContent: "space-around",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)", // iPhone notch
                }}
            >
                {TABS.map(tab => {
                    const active = view === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id)}
                            aria-label={tab.label}
                            aria-current={active ? "page" : undefined}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: active ? THEME.colors.brand.cyan : THEME.colors.text.dim,
                                position: "relative",
                                transition: "color 0.2s",
                                padding: "8px 0",
                            }}
                        >
                            {/* Active indicator pill */}
                            {active && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 32,
                                        height: 3,
                                        borderRadius: "0 0 4px 4px",
                                        background: THEME.gradients.brand,
                                        boxShadow: `0 0 12px ${THEME.colors.brand.cyan}60`,
                                    }}
                                />
                            )}

                            {/* Icon with optional badge */}
                            <div style={{ position: "relative" }}>
                                {tab.icon(active)}
                                {tab.id === "player" && pQueue.length > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -4,
                                            right: -6,
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            backgroundColor: playing ? THEME.colors.brand.cyan : "rgba(255,255,255,0.3)",
                                            fontSize: 9,
                                            fontWeight: 700,
                                            color: "black",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "background-color 0.3s",
                                        }}
                                    >
                                        {pQueue.length}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: active ? 700 : 500,
                                    letterSpacing: active ? "0.02em" : "0",
                                    transition: "all 0.2s",
                                }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <style>{`
                @media (max-width: 640px) {
                    .bottom-nav { display: flex !important; }
                    .bottom-nav-spacer { display: block !important; }
                }
            `}</style>
        </>
    );
};
