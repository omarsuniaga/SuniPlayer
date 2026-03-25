import React from "react";
import { THEME } from "../../data/theme.ts";
import { useProjectStore } from "../../store/useProjectStore";

const NAV_ITEMS = [
    { id: "builder", label: "Sets", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
    )},
    { id: "player", label: "Player", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    )},
    { id: "library", label: "Library", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18V5l12-2v13M6 15a3 3 0 1 0 0 6 3 3 0 000-6zm12-2a3 3 0 1 0 0 6 3 3 0 000-6z" /></svg>
    )},
    { id: "history", label: "History", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
    )},
] as const;

export const BottomNav: React.FC = () => {
    const currentView = useProjectStore(s => s.view);
    const setView = useProjectStore(s => s.setView);

    return (
        <nav style={{
            height: "72px",
            backgroundColor: "rgba(13, 17, 23, 0.85)",
            backdropFilter: "blur(12px)",
            borderTop: `1px solid ${THEME.colors.border}`,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "0 16px",
            position: "relative",
            zIndex: 100,
            paddingBottom: "env(safe-area-inset-bottom)" // Importante para iPhone/iPad
        }}>
            {NAV_ITEMS.map((item) => {
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as any)}
                        style={{
                            background: "none",
                            border: "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            color: isActive ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            minWidth: "60px",
                            transform: isActive ? "translateY(-4px)" : "none"
                        }}
                    >
                        <div style={{
                            opacity: isActive ? 1 : 0.6,
                            transition: "transform 0.2s",
                            transform: isActive ? "scale(1.1)" : "scale(1)"
                        }}>
                            {item.icon}
                        </div>
                        <span style={{ 
                            fontSize: 10, 
                            fontWeight: 800, 
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            {item.label}
                        </span>
                        
                        {isActive && (
                            <div style={{
                                position: "absolute",
                                top: -12,
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                backgroundColor: THEME.colors.brand.cyan,
                                boxShadow: `0 0 10px ${THEME.colors.brand.cyan}`
                            }} />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};
