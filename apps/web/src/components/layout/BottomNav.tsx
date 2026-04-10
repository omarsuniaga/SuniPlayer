import React from "react";
import { THEME } from "../../data/theme.ts";
import { useProjectStore } from "../../store/useProjectStore";
import { useIsMobile } from "../../utils/useMediaQuery";

const NAV_ITEMS: { id: "player" | "history" | "builder" | "library"; label: string; icon: React.ReactNode }[] = [
    { id: "player", label: "Reproductor", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    )},
    { id: "history", label: "Historial", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )},
    { id: "builder", label: "Generador", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
    )},
    { id: "library", label: "Biblioteca", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18V5l12-2v13M6 15a3 3 0 1 0 0 6 3 3 0 000-6zm12-2a3 3 0 1 0 0 6 3 3 0 000-6z" /></svg>
    )},
] as const;

export const BottomNav: React.FC = () => {
    const currentView = useProjectStore(s => s.view);
    const setView = useProjectStore(s => s.setView);
    const isMobile = useIsMobile();

    return (
        <nav style={{
            height: isMobile ? "56px" : "72px",
            backgroundColor: "rgba(13, 17, 23, 0.5)",
            backdropFilter: "blur(24px)",
            borderTop: `1px solid ${THEME.colors.border}`,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            paddingTop: "0",
            paddingRight: isMobile ? "8px" : "16px",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: isMobile ? "8px" : "16px",
            position: "relative",
            zIndex: 100,
        }}>
            {NAV_ITEMS.map((item) => {
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        style={{
                            background: "none",
                            border: "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: isMobile ? 2 : 4,
                            color: isActive ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            minWidth: isMobile ? "50px" : "60px",
                            padding: isMobile ? "4px 0" : "0",
                            transform: isActive ? "translateY(-2px)" : "none"
                        }}
                    >
                        <div style={{
                            opacity: isActive ? 1 : 0.6,
                            transition: "transform 0.2s",
                            transform: isActive ? "scale(1.05)" : "scale(1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            {React.cloneElement(item.icon as React.ReactElement, {
                                width: isMobile ? 18 : 20,
                                height: isMobile ? 18 : 20
                            })}
                        </div>
                        <span style={{ 
                            fontSize: isMobile ? 9 : 10, 
                            fontWeight: 800, 
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            {item.label}
                        </span>
                        
                        {isActive && (
                            <div style={{
                                position: "absolute",
                                top: isMobile ? -4 : -2,
                                width: "6px",
                                height: "6px",
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
