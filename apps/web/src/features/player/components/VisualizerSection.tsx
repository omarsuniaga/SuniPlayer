import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Track, TrackMarker } from "@suniplayer/core";
import { Wave } from "../../../components/common/Wave.tsx";
// ... (imports)
import { MarkerLayer } from "../../../components/common/MarkerLayer";
import { fmt } from "@suniplayer/core";
import { useDownloadStore } from "../../../store/useDownloadStore";
import { useIsMobile } from "../../../utils/useMediaQuery";
import { usePlayerStore } from "@suniplayer/core";

interface VisualizerSectionProps {
    track: Track | null;
    performanceMode: boolean;
    isLive: boolean;
    playing: boolean;
    pos: number;
    rem: number;
    durMs: number;
    prog: number;
    mCol: string;
    currentWave: number[];
    isLoadingWave: boolean;
    fadeEnabled: boolean;
    fadeInMs: number;
    fadeOutMs: number;
    showMarkers: boolean;
    onMarkersChange: (markers: TrackMarker[]) => void;
    onSeek: (posMs: number) => void;
}

export const VisualizerSection: React.FC<VisualizerSectionProps> = ({
    track, performanceMode, isLive, playing, pos, rem, durMs, prog, mCol,
    currentWave, isLoadingWave, fadeEnabled, fadeInMs, fadeOutMs,
    showMarkers, onMarkersChange, onSeek
}) => {
    const isMobile = useIsMobile();
    const url = track ? (track.blob_url ?? `/audio/${encodeURIComponent(track.file_path || "")}`) : "";
    const download = useDownloadStore(s => s.activeDownloads[url]);
    const isBuffering = download && download.percentage < 100;
    const { waveScale, setWaveScale } = usePlayerStore();

    const waveHeight = isMobile ? 110 : (performanceMode ? 220 : 160);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <MarkerLayer
                    markers={showMarkers ? (track?.markers || []) : []}
                    posMs={pos}
                    durationMs={durMs}
                    isLive={isLive}
                    onMarkersChange={onMarkersChange}
                    onSeek={onSeek}
                >
                    <div style={{
                        flex: 1,
                        height: waveHeight, backgroundColor: "rgba(255,255,255,0.01)",
                        border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
                        borderRadius: 12, position: "relative",
                        opacity: isLoadingWave ? 0.4 : 1, transition: "all 0.3s",
                        overflow: "hidden"
                    }}>
                        <Wave 
                            data={currentWave.length > 0 ? currentWave : Array(100).fill(0.15)} 
                            progress={prog} color={mCol} 
                            fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs} 
                            totalMs={durMs} 
                        />

                        {/* Progress Cursor */}
                        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${prog * 100}%`, width: isMobile ? 2 : 3, background: mCol, boxShadow: `0 0 20px ${mCol}`, zIndex: 5 }} />

                        {/* Stage Timers (Gigantes en modo performance) */}
                        <div style={{ 
                            position: "absolute", inset: 0, display: "flex", 
                            alignItems: "center", justifyContent: "center", 
                            pointerEvents: "none", zIndex: 10
                        }}>
                            <span style={{ 
                                fontSize: isMobile ? 40 : (performanceMode ? 100 : 60), 
                                fontWeight: 900, fontFamily: THEME.fonts.mono, 
                                color: "white", opacity: 0.1, letterSpacing: -2
                            }}>
                                {fmt(rem)}
                            </span>
                        </div>

                        {/* Buffer Progress */}
                        {download && download.percentage < 100 && (
                            <div style={{ position: "absolute", bottom: 0, left: 0, height: 4, background: "rgba(255,255,255,0.1)", width: "100%", zIndex: 15 }}>
                                <div style={{ height: "100%", background: THEME.colors.brand.cyan, width: `${download.percentage}%`, transition: "width 0.3s" }} />
                            </div>
                        )}

                        {/* Buffering Overlay */}
                        {isBuffering && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10, 14, 20, 0.7)", backdropFilter: "blur(8px)", zIndex: 20 }}>
                                <div className="spinner" style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,0.05)", borderTopColor: THEME.colors.brand.cyan, borderRadius: "50%", animation: "spin 0.8s linear infinite", boxShadow: `0 0 20px ${THEME.colors.brand.cyan}40` }} />
                                <div style={{ fontSize: 11, fontWeight: 900, color: "white", letterSpacing: 2, marginTop: 12 }}>CARGANDO BUFFER...</div>
                            </div>
                        )}

                        {/* Live Badge */}
                        {isLive && playing && (
                            <div style={{ 
                                position: "absolute", top: 12, left: 12, 
                                padding: "4px 10px", borderRadius: 4, 
                                background: THEME.colors.brand.cyan, color: "black", 
                                fontSize: 9, fontWeight: 900, zIndex: 30
                            }}>
                                MODO SHOW: PROTEGIDO
                            </div>
                        )}

                        {/* Buffer Success Badge */}
                        {!isBuffering && download?.percentage === 100 && (
                            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 4, background: "rgba(0, 255, 255, 0.1)", border: `1px solid ${THEME.colors.brand.cyan}30`, zIndex: 30 }}>
                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: THEME.colors.brand.cyan }} />
                                <span style={{ fontSize: 8, fontWeight: 900, color: THEME.colors.brand.cyan }}>LISTO</span>
                            </div>
                        )}
                    </div>
                </MarkerLayer>
                </div>

                {/* Waveform Amplitude Zoom Controls — outside seekable area */}
                <div style={{
                    display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
                    minWidth: 28, flexShrink: 0, alignSelf: "center"
                }}>
                    <button
                        onClick={() => setWaveScale(waveScale + 0.2)}
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: `1px solid rgba(255,255,255,0.12)`,
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                            width: 28, height: 28,
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 700,
                            lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                        title="Zoom +"
                    >+</button>
                    <button
                        onClick={() => setWaveScale(Math.max(0.4, waveScale - 0.2))}
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: `1px solid rgba(255,255,255,0.12)`,
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                            width: 28, height: 28,
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 700,
                            lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                        title="Zoom -"
                    >−</button>
                </div>
            </div>
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* Bottom Timers (Normal) */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: isMobile ? 12 : 14, fontFamily: THEME.fonts.mono, fontWeight: 700, color: THEME.colors.text.muted }}>
                <span style={{ color: THEME.colors.brand.cyan }}>{fmt(pos)}</span>
                <span>-{fmt(rem)}</span>
            </div>
        </div>
    );
};
