import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Track, usePlayerStore } from "@suniplayer/core";
import { CollaborativeQueuePanel } from "./CollaborativeQueuePanel";

interface SetlistSidebarProps {
    showQueue: boolean;
    isMobile: boolean;
    pQueue: Track[];
    ci: number;
    playing: boolean;
    isLive: boolean;
    stackOrder: string[];
    mCol: string;
    onQueueClick: (track: Track) => void;
    onClose: () => void;
    onDrop: (dragIdx: number, targetIndex: number) => void;
    onEditSetlist: () => void;
}

export const SetlistSidebar: React.FC<SetlistSidebarProps> = ({
    showQueue, isMobile, pQueue, ci, playing, isLive, stackOrder, mCol,
    onQueueClick, onClose, onDrop, onEditSetlist
}) => {
    const touchStartRef = React.useRef<number | null>(null);
    const sessionId = usePlayerStore((s) => s.sessionId);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartRef.current;

        // If swipe right > 100px, close
        if (diff > 100 && isMobile) {
            onClose();
            touchStartRef.current = null;
        }
    };

    return (
        <>
            {showQueue && (
                <div 
                    onClick={onClose} 
                    style={{ 
                        position: "fixed", 
                        inset: 0, 
                        backgroundColor: "rgba(0,0,0,0.6)", 
                        backdropFilter: "blur(4px)", 
                        zIndex: 2000 
                    }} 
                />
            )}
            <aside 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                style={{
                position: "fixed",
                right: 0, top: 0, bottom: 0,
                width: showQueue ? (isMobile ? "85vw" : "360px") : 0,
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: THEME.colors.bg,
                borderLeft: `1px solid ${THEME.colors.border}`,
                display: "flex", flexDirection: "column", 
                overflow: "hidden",
                zIndex: 2001, 
                boxShadow: showQueue ? "-20px 0 50px rgba(0,0,0,0.5)" : "none",
                pointerEvents: showQueue ? "auto" : "none"
            }}>
                <div style={{ width: isMobile ? "85vw" : 360, maxWidth: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ 
                        padding: isMobile ? "32px 24px" : "24px", 
                        borderBottom: `1px solid ${THEME.colors.border}`, 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        background: "rgba(255,255,255,0.02)"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <h2 style={{ fontSize: isMobile ? 16 : 13, fontWeight: 900, margin: 0, opacity: 0.8, color: THEME.colors.brand.cyan }}>SETLIST QUEUE</h2>
                            <span style={{ fontSize: 11, fontWeight: 800, color: THEME.colors.text.muted }}>{pQueue.length} Tracks</span>
                        </div>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: isMobile ? "rgba(255,255,255,0.05)" : "none", 
                                border: "none", 
                                borderRadius: isMobile ? "50%" : 0,
                                width: isMobile ? 44 : "auto",
                                height: isMobile ? 44 : "auto",
                                color: THEME.colors.text.muted, 
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                        >
                            <svg width={isMobile ? "24" : "18"} height={isMobile ? "24" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px", WebkitOverflowScrolling: "touch" }}>
                        {pQueue.map((t, i) => {
                            const stackIdx = stackOrder.indexOf(t.id);
                            const isActive = ci === i;
                            const isInStack = stackIdx !== -1;
                            
                            // Visual prominence logic for Live Mode
                            let opacity = 1;
                            let background = isActive ? `${mCol}15` : "rgba(255,255,255,0.03)";
                            let border = `1px solid ${isActive ? mCol + "40" : "transparent"}`;

                            if (isLive) {
                                if (!isActive && !isInStack) {
                                    opacity = 0.4; // Dim unselected tracks
                                }
                                if (isInStack) {
                                    background = `rgba(6, 182, 212, 0.08)`;
                                    border = `1px solid ${THEME.colors.brand.cyan}40`;
                                    opacity = 1;
                                }
                            }

                            return (
                                <div 
                                    key={`${t.instanceId || t.id}-${i}`} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQueueClick(t);
                                    }} 
                                    draggable={!isLive} 
                                    onDragStart={(e) => { e.dataTransfer.setData("idx", i.toString()); }} 
                                    onDragOver={e => e.preventDefault()} 
                                    onDrop={e => onDrop(parseInt(e.dataTransfer.getData("idx")), i)} 
                                    style={{
                                        padding: isMobile ? "18px 20px" : "14px", 
                                        borderRadius: THEME.radius.md, 
                                        marginBottom: 8, 
                                        cursor: "pointer",
                                        background,
                                        border,
                                        display: "flex", 
                                        gap: 14, 
                                        alignItems: "center", 
                                        transition: "all 0.3s ease",
                                        userSelect: "none",
                                        opacity,
                                        position: "relative",
                                        overflow: "hidden"
                                    }}
                                >
                                    <span style={{ 
                                        fontFamily: THEME.fonts.mono, 
                                        fontSize: 11, 
                                        opacity: isActive || isInStack ? 0.8 : 0.2, 
                                        minWidth: 24,
                                        color: isInStack ? THEME.colors.brand.cyan : "inherit"
                                    }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontSize: isMobile ? 15 : 14, 
                                            fontWeight: 700, 
                                            color: isActive ? "white" : (isInStack ? THEME.colors.brand.cyan : THEME.colors.text.primary),
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                        }}>
                                            {t.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                    </div>

                                    {isLive && isInStack && (
                                        <div style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            alignItems: "center", 
                                            gap: 4 
                                        }}>
                                            {stackIdx === 0 && (
                                                <span style={{ 
                                                    fontSize: 8, 
                                                    fontWeight: 900, 
                                                    color: THEME.colors.brand.cyan, 
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.5,
                                                    animation: "pulseText 1.5s infinite"
                                                }}>
                                                    NEXT
                                                </span>
                                            )}
                                            <div style={{ 
                                                backgroundColor: THEME.colors.brand.cyan, 
                                                color: "black", 
                                                width: 24, 
                                                height: 24, 
                                                borderRadius: "50%", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center", 
                                                fontSize: 11, 
                                                fontWeight: 900,
                                                boxShadow: `0 0 12px ${THEME.colors.brand.cyan}40`
                                            }}>
                                                {stackIdx + 1}
                                            </div>
                                        </div>
                                    )}

                                    {isActive && playing && (
                                        <div style={{ display: "flex", gap: 3, height: 16, alignItems: "flex-end" }}>
                                            <div style={{ width: 3, height: "60%", background: mCol, animation: "audioBar 0.6s infinite alternate" }} />
                                            <div style={{ width: 3, height: "100%", background: mCol, animation: "audioBar 0.8s infinite alternate-reverse" }} />
                                            <div style={{ width: 3, height: "40%", background: mCol, animation: "audioBar 0.5s infinite alternate" }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Phase 2: shared collaborative queue (only inside a session) */}
                        {sessionId && <CollaborativeQueuePanel isMobile={isMobile} />}
                    </div>

                    {/* Footer: edit order / add more songs */}
                    <div style={{ padding: 12, borderTop: `1px solid ${THEME.colors.border}` }}>
                        <button
                            onClick={onEditSetlist}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: isMobile ? "14px" : "11px", borderRadius: THEME.radius.md,
                                border: `1px solid ${THEME.colors.brand.violet}40`,
                                background: `${THEME.colors.brand.violet}12`,
                                color: THEME.colors.brand.violet, fontSize: 12, fontWeight: 800,
                                cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Editar / agregar canciones
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes pulseText {
                        0% { opacity: 0.4; transform: scale(0.95); }
                        50% { opacity: 1; transform: scale(1.05); }
                        100% { opacity: 0.4; transform: scale(0.95); }
                    }
                    @keyframes audioBar {
                        from { height: 20%; }
                        to { height: 100%; }
                    }
                `}</style>
            </aside>
        </>
    );
};
