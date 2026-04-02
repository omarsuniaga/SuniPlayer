import React, { useState } from "react";
import { useProjectStore } from "@suniplayer/core";
import { THEME } from "../../data/theme";
import { fmt } from "@suniplayer/core";
import { useIsMobile } from "../../utils/useMediaQuery";
import { skipToNextGracefully } from "../../services/audioTransport";

export const MiniPlayer: React.FC = () => {
    const { pQueue, ci, pos, playing, setPlaying, setCi, setPos, setView } = useProjectStore();
    const isMobile = useIsMobile();

    const [minimized, setMinimized] = useState(false);

    const ct = pQueue[ci];
    if (!ct) return null;
    const progress = ct.duration_ms > 0 ? Math.min(100, Math.max(0, (pos / ct.duration_ms) * 100)) : 0;

    const handleNextGraceful = () => {
        if (!playing) {
            if (ci < pQueue.length - 1) { setCi(ci + 1); setPos(0); }
            return;
        }

        skipToNextGracefully();
    };

    if (minimized) {
        return (
            <div
                style={{
                    padding: "0 12px 8px",
                    display: "flex",
                    justifyContent: "flex-end",
                    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(6,10,16,0.85) 100%)",
                }}
            >
                <button
                    onClick={() => setMinimized(false)}
                    style={{
                        minHeight: "38px",
                        padding: "0 14px",
                        borderRadius: "999px",
                        background: "rgba(18, 24, 32, 0.2)",
                        color: "white",
                        border: `1px solid ${THEME.colors.border}`,
                        cursor: "pointer",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        backdropFilter: "blur(18px)",
                    }}
                    aria-label="Expandir minirreproductor"
                >
                    <span
                        style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "rgba(34, 211, 238, 0.18)",
                            color: THEME.colors.brand.cyan,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em" }}>
                        {/* Nombre de la pista  */}
                        {ct.title}
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div style={{
            padding: "0 12px 8px",
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(6,10,16,0.94) 100%)",
        }} onClick={() => setView("player")}>
            <div
                style={{
                    minHeight: isMobile ? "56px" : "64px",
                    backgroundColor: "rgba(18, 24, 32, 0.78)",
                    borderRadius: "18px",
                    border: `1px solid ${THEME.colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 10 : 14,
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
                    backdropFilter: "blur(18px)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: isMobile ? "34px" : "40px",
                        height: isMobile ? "34px" : "40px",
                        borderRadius: "12px",
                        background: THEME.gradients.brand,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        flexShrink: 0,
                        boxShadow: "0 8px 18px rgba(34, 211, 238, 0.18)",
                    }}
                >
                    <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ct.title}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                            minWidth: 0,
                            fontSize: isMobile ? 10 : 11,
                            color: THEME.colors.text.muted,
                            fontWeight: 700,
                        }}
                    >
                        <span style={{ color: THEME.colors.brand.cyan, whiteSpace: "nowrap" }}>
                            {fmt(pos)}
                        </span>
                        <span style={{ opacity: 0.45 }}>•</span>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ct.artist || "Artista Local"}
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setPlaying(!playing)}
                        style={{
                            width: isMobile ? 38 : 42,
                            height: isMobile ? 38 : 42,
                            borderRadius: "50%",
                            border: "none",
                            background: playing ? "rgba(255,255,255,0.12)" : THEME.colors.brand.cyan,
                            color: playing ? "white" : "black",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                        aria-label={playing ? "Pausar reproducción" : "Reproducir"}
                    >
                        {playing ? "⏸" : "▶"}
                    </button>
                    <button
                        onClick={handleNextGraceful}
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            opacity: 0.9,
                        }}
                        aria-label="Siguiente pista"
                    >
                        <svg width={isMobile ? "22" : "24"} height={isMobile ? "22" : "24"} viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                    <button
                        onClick={() => setMinimized(true)}
                        style={{
                            background: "none",
                            border: "none",
                            color: THEME.colors.text.muted,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Minimizar minirreproductor"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                </div>

                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ height: "100%", background: THEME.colors.brand.cyan, width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};
