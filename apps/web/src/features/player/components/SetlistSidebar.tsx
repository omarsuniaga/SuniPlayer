import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Track } from "../../../types";

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
}

export const SetlistSidebar: React.FC<SetlistSidebarProps> = ({
    showQueue, isMobile, pQueue, ci, playing, isLive, stackOrder, mCol,
    onQueueClick, onClose, onDrop
}) => {
    return (
        <>
            {showQueue && isMobile && (
                <div 
                    onClick={onClose} 
                    style={{ 
                        position: "fixed", 
                        inset: 0, 
                        backgroundColor: "rgba(0,0,0,0.8)", 
                        backdropFilter: "blur(8px)", 
                        zIndex: 2000 
                    }} 
                />
            )}
            <aside style={{
                position: isMobile ? "fixed" : "relative",
                right: 0, top: 0, bottom: 0,
                width: showQueue ? (isMobile ? "85vw" : "360px") : 0, 
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: isMobile ? THEME.colors.bg : THEME.colors.panel, 
                borderLeft: `1px solid ${THEME.colors.border}`,
                display: "flex", flexDirection: "column", 
                overflow: "hidden",
                zIndex: 2001, 
                boxShadow: isMobile && showQueue ? "-20px 0 50px rgba(0,0,0,0.5)" : "none"
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
                            return (
                                <div 
                                    key={t.id} 
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
                                        background: isActive ? `${mCol}15` : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${isActive ? mCol + "40" : "transparent"}`,
                                        display: "flex", 
                                        gap: 14, 
                                        alignItems: "center", 
                                        transition: "all 0.2s",
                                        userSelect: "none"
                                    }}
                                >
                                    <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, opacity: 0.3, minWidth: 24 }}>{String(i + 1).padStart(2, '0')}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 700, color: isActive ? "white" : THEME.colors.text.primary }}>{t.title}</div>
                                        <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                    </div>
                                    {isLive && stackIdx !== -1 && (
                                        <div style={{ backgroundColor: THEME.colors.brand.cyan, color: "black", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{stackIdx + 1}</div>
                                    )}
                                    {isActive && playing && (
                                        <div style={{ display: "flex", gap: 3, height: 16, alignItems: "flex-end" }}>
                                            <div style={{ width: 3, height: "60%", background: mCol }} />
                                            <div style={{ width: 3, height: "100%", background: mCol }} />
                                            <div style={{ width: 3, height: "40%", background: mCol }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
};
