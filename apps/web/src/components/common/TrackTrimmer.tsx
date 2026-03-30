import React, { useState, useEffect, useRef } from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../data/theme.ts";
import { getWaveformData } from "../../services/waveformService.ts";
import { Wave } from "./Wave.tsx";
import { fmt } from "@suniplayer/core";
import { usePlayerStore } from "../../store/usePlayerStore.ts";

interface TrackTrimmerProps {
    track: Track;
    onSave: (startTime: number, endTime: number) => void;
    onCancel: () => void;
}

export const TrackTrimmer: React.FC<TrackTrimmerProps> = ({ track, onSave, onCancel }) => {
    const [waveData, setWaveData] = useState<number[]>([]);
    const [start, setStart] = useState(track.startTime || 0);
    const [end, setEnd] = useState(track.endTime || track.duration_ms);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const setPlaying = usePlayerStore(s => s.setPlaying);
    const wasPlayingRef = useRef(false);
    const duration = track.duration_ms;
    const loading = waveData.length === 0;

    useEffect(() => {
        // Pause main player on mount and save whether it was playing
        wasPlayingRef.current = usePlayerStore.getState().playing;
        setPlaying(false);

        const url = track.blob_url ?? `/audio/${encodeURIComponent(track.file_path || "")}`;
        getWaveformData(url, track.id, 200).then(data => {
            setWaveData(data);
        });

        // Setup preview audio (pitch handled by SoundTouch in main player)
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.playbackRate = 1.0;
        previewAudioRef.current = audio;

        const handleEnded = () => setIsPreviewing(false);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("ended", handleEnded);
            audio.pause();
            previewAudioRef.current = null;
        };
    }, [track, setPlaying]);

    const togglePreview = () => {
        const audio = previewAudioRef.current;
        if (!audio) return;

        if (isPreviewing) {
            audio.pause();
            setIsPreviewing(false);
        } else {
            audio.currentTime = start / 1000;
            audio.play().catch(console.error);
            setIsPreviewing(true);
            
            // Auto stop at 'end' point
            const checkEnd = setInterval(() => {
                if (audio.currentTime * 1000 >= end) {
                    audio.pause();
                    setIsPreviewing(false);
                    clearInterval(checkEnd);
                }
                if (audio.paused) clearInterval(checkEnd);
            }, 100);
        }
    };

    const handleSave = () => {
        onSave(start, end);
    };

    const handleCancel = () => {
        if (wasPlayingRef.current) setPlaying(true);
        onCancel();
    };

    const startPct = (start / duration) * 100;
    const endPct = (end / duration) * 100;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
            animation: "fadeIn 0.2s ease-out"
        }}>
            <div style={{
                backgroundColor: THEME.colors.panel,
                border: `1px solid ${THEME.colors.brand.cyan}40`,
                borderRadius: THEME.radius.xl,
                width: "min(650px, 95vw)",
                padding: "32px 40px",
                display: "flex", flexDirection: "column", gap: 32,
                boxShadow: `0 30px 100px rgba(0,0,0,0.9)`,
                animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Recortar Pista</h3>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: THEME.colors.text.muted, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: THEME.colors.brand.violet, fontWeight: 700 }}>{track.artist}</span>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <span>{track.title}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        style={{ background: "none", border: "none", color: THEME.colors.text.dim, cursor: "pointer", padding: 4 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </header>

                <div style={{ position: "relative", padding: "20px 0" }}>
                    {loading ? (
                        <div style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                            <div className="spinner" style={{ width: 24, height: 24, border: `2px solid ${THEME.colors.brand.cyan}20`, borderTopColor: THEME.colors.brand.cyan, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            <span style={{ fontSize: 12, color: THEME.colors.text.dim }}>Analizando ondas de audio...</span>
                        </div>
                    ) : (
                        <>
                            <div style={{ position: "relative", height: 120, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: THEME.radius.lg, overflow: "hidden", border: `1px solid rgba(255,255,255,0.05)` }}>
                                <Wave data={waveData} progress={0} color={THEME.colors.text.dim} />
                                
                                {/* Overlay for inactive areas */}
                                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${startPct}%`, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "grayscale(1)" }} />
                                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - endPct}%`, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "grayscale(1)" }} />
                                </div>

                                {/* Active area highlight */}
                                <div style={{ 
                                    position: "absolute", 
                                    left: `${startPct}%`, 
                                    width: `${endPct - startPct}%`, 
                                    top: 0, bottom: 0, 
                                    borderLeft: `3px solid ${THEME.colors.brand.cyan}`,
                                    borderRight: `3px solid ${THEME.colors.brand.cyan}`,
                                    background: `linear-gradient(to bottom, ${THEME.colors.brand.cyan}05, ${THEME.colors.brand.cyan}15)`,
                                    boxShadow: `inset 0 0 40px ${THEME.colors.brand.cyan}10`,
                                    pointerEvents: "none"
                                }}>
                                    <Wave data={waveData.slice(Math.floor(startPct * waveData.length / 100), Math.floor(endPct * waveData.length / 100))} progress={0} color={THEME.colors.brand.cyan} />
                                </div>
                            </div>

                            {/* Range Handles Visualization */}
                            <div style={{ position: "absolute", top: 10, left: `${startPct}%`, transform: "translateX(-50%)", zIndex: 10 }}>
                                <div style={{ padding: "4px 8px", backgroundColor: THEME.colors.brand.cyan, color: "black", fontSize: 10, fontWeight: 900, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>START</div>
                            </div>
                            <div style={{ position: "absolute", bottom: 10, left: `${endPct}%`, transform: "translateX(-50%)", zIndex: 10 }}>
                                <div style={{ padding: "4px 8px", backgroundColor: THEME.colors.brand.cyan, color: "black", fontSize: 10, fontWeight: 900, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>END</div>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 40 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 10, color: THEME.colors.text.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Inicio Seleccionado</span>
                                <span style={{ fontSize: 20, color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>{fmt(start)}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ fontSize: 10, color: THEME.colors.text.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Fin Seleccionado</span>
                                <span style={{ fontSize: 20, color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>{fmt(end)}</span>
                            </div>
                        </div>

                        <button
                            onClick={togglePreview}
                            style={{
                                width: 56, height: 56, borderRadius: "50%", border: "none",
                                background: isPreviewing ? THEME.colors.status.error : THEME.gradients.brand,
                                color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: `0 8px 20px ${isPreviewing ? THEME.colors.status.error : THEME.colors.brand.cyan}40`,
                                transition: "all 0.2s"
                            }}
                        >
                            {isPreviewing ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>
                    </div>

                    <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center", margin: "0 4px" }}>
                        {/* Dual Range Sliders Container */}
                        <div style={{ position: "absolute", width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
                        <div style={{ 
                            position: "absolute", 
                            left: `${startPct}%`, 
                            width: `${endPct - startPct}%`, 
                            height: 6, 
                            backgroundColor: THEME.colors.brand.cyan, 
                            opacity: 0.3,
                            borderRadius: 3 
                        }} />
                        
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            step={100}
                            value={start}
                            onChange={(e) => setStart(Math.min(parseInt(e.target.value), end - 1000))}
                            className="trim-slider start"
                            style={{
                                appearance: "none", width: "100%", height: 0, outline: "none",
                                position: "absolute", pointerEvents: "none", zIndex: 5,
                            }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            step={100}
                            value={end}
                            onChange={(e) => setEnd(Math.max(parseInt(e.target.value), start + 1000))}
                            className="trim-slider end"
                            style={{
                                appearance: "none", width: "100%", height: 0, outline: "none",
                                position: "absolute", pointerEvents: "none", zIndex: 4,
                            }}
                        />
                    </div>

                    <div style={{ 
                        fontSize: 12, color: THEME.colors.text.secondary, textAlign: "center", 
                        padding: "10px 20px", borderRadius: THEME.radius.md, backgroundColor: "rgba(255,255,255,0.02)",
                        border: `1px solid rgba(255,255,255,0.03)`
                    }}>
                        Duración del segmento recortado: <strong style={{ color: "white", fontFamily: THEME.fonts.mono }}>{fmt(end - start)}</strong>
                    </div>
                </div>

                <footer style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            flex: 1, padding: "16px", borderRadius: THEME.radius.lg, border: `1px solid ${THEME.colors.border}`,
                            backgroundColor: "transparent", color: THEME.colors.text.secondary, fontSize: 14, fontWeight: 700, cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        Descartar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            flex: 1.5, padding: "16px", borderRadius: THEME.radius.lg, border: "none",
                            background: THEME.gradients.brand, color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer",
                            boxShadow: `0 12px 30px ${THEME.colors.brand.cyan}30`,
                            transition: "all 0.2s",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Aplicar Cambios
                    </button>
                </footer>
            </div>

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .trim-slider {
                    pointer-events: none;
                }
                .trim-slider::-webkit-slider-thumb {
                    pointer-events: auto;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    border: 4px solid ${THEME.colors.brand.cyan};
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                .trim-slider.start::-webkit-slider-thumb {
                    background: ${THEME.colors.brand.cyan};
                    border: 3px solid white;
                    z-index: 10;
                }
                .trim-slider.end::-webkit-slider-thumb {
                    background: ${THEME.colors.brand.cyan};
                    border: 3px solid white;
                    z-index: 10;
                }
            `}</style>
        </div>
    );
};
