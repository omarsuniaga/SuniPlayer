import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Track } from "../../../types";
import { Wave } from "../../../components/common/Wave.tsx";
import { MarkerLayer } from "../../../components/common/MarkerLayer";
import { fmt } from "../../../services/uiUtils.ts";
import { useDownloadStore } from "../../../store/useDownloadStore";

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
    onMarkersChange: (markers: any[]) => void;
    onSeek: (posMs: number) => void;
}

export const VisualizerSection: React.FC<VisualizerSectionProps> = ({
    track, performanceMode, isLive, playing, pos, rem, durMs, prog, mCol,
    currentWave, isLoadingWave, fadeEnabled, fadeInMs, fadeOutMs,
    onMarkersChange, onSeek
}) => {
    const url = track ? (track.blob_url ?? `/audio/${encodeURIComponent(track.file_path)}`) : "";
    const download = useDownloadStore(s => s.activeDownloads[url]);
    const isBuffering = download && download.percentage < 100;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: performanceMode ? 24 : 12 }}>
            <MarkerLayer
                markers={track?.markers || []}
                posMs={pos}
                durationMs={durMs}
                isLive={isLive}
                onMarkersChange={onMarkersChange}
                onSeek={onSeek}
            >
                <div style={{
                    height: performanceMode ? 240 : 160, backgroundColor: "rgba(255,255,255,0.01)",
                    border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
                    borderRadius: THEME.radius.xl, position: "relative",
                    opacity: isLoadingWave ? 0.4 : 1, transition: "all 0.3s",
                    overflow: "hidden"
                }}>
                    <Wave 
                        data={currentWave.length > 0 ? currentWave : Array(100).fill(0.15)} 
                        progress={prog} color={mCol} 
                        fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs} 
                        totalMs={durMs} 
                    />
                    
                    {/* Buffer Progress Layer */}
                    {download && download.percentage < 100 && (
                        <div style={{ 
                            position: "absolute", bottom: 0, left: 0, 
                            height: 4, background: "rgba(255,255,255,0.1)", 
                            width: "100%", zIndex: 10 
                        }}>
                            <div style={{ 
                                height: "100%", background: THEME.colors.brand.cyan, 
                                width: `${download.percentage}%`, transition: "width 0.3s" 
                            }} />
                        </div>
                    )}

                    {/* Loading Spinner & Speed */}
                    {isBuffering && (
                        <div style={{ 
                            position: "absolute", inset: 0, 
                            display: "flex", flexDirection: "column", 
                            alignItems: "center", justifyContent: "center",
                            background: "rgba(10, 14, 20, 0.4)",
                            backdropFilter: "blur(4px)",
                            zIndex: 20
                        }}>
                            <div className="spinner" style={{
                                width: 40, height: 40, 
                                border: "3px solid rgba(255,255,255,0.1)",
                                borderTopColor: THEME.colors.brand.cyan,
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                marginBottom: 12
                            }} />
                            <div style={{ fontSize: 11, fontWeight: 900, color: THEME.colors.brand.cyan, letterSpacing: 1 }}>
                                CARGANDO BUFFER...
                            </div>
                            <div style={{ fontSize: 10, color: THEME.colors.text.muted, marginTop: 4, fontFamily: THEME.fonts.mono }}>
                                {(download.speedKbps / 1024).toFixed(1)} MB/s
                            </div>
                        </div>
                    )}

                    <div style={{ position: "absolute", top: 0, bottom: 0, left: `${prog * 100}%`, width: 3, background: mCol, boxShadow: `0 0 20px ${mCol}`, zIndex: 5 }} />
                    {isLive && playing && (
                        <div style={{ position: "absolute", top: 12, left: 12, padding: "6px 14px", borderRadius: 6, background: THEME.colors.brand.cyan + "30", border: `1px solid ${THEME.colors.brand.cyan}50`, color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 900 }}>LIVE MODE PROTECTED</div>
                    )}
                </div>
            </MarkerLayer>
            
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: performanceMode ? 16 : 13, fontFamily: THEME.fonts.mono, opacity: 0.5 }}>
                <span>{fmt(pos)}</span>
                <span>-{fmt(rem)}</span>
            </div>
        </div>
    );
};
