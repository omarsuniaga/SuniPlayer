import React from "react";
import { THEME } from "../../../data/theme.ts";
import { Track } from "../../../types";
import { Wave } from "../../../components/common/Wave.tsx";
import { MarkerLayer } from "../../../components/common/MarkerLayer";
import { fmt } from "../../../services/uiUtils.ts";

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
                }}>
                    <Wave 
                        data={currentWave.length > 0 ? currentWave : Array(100).fill(0.15)} 
                        progress={prog} color={mCol} 
                        fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs} 
                        totalMs={durMs} 
                    />
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: `${prog * 100}%`, width: 3, background: mCol, boxShadow: `0 0 20px ${mCol}`, zIndex: 5 }} />
                    {isLive && playing && (
                        <div style={{ position: "absolute", top: 12, left: 12, padding: "6px 14px", borderRadius: 6, background: THEME.colors.brand.cyan + "30", border: `1px solid ${THEME.colors.brand.cyan}50`, color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 900 }}>LIVE MODE PROTECTED</div>
                    )}
                </div>
            </MarkerLayer>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: performanceMode ? 16 : 13, fontFamily: THEME.fonts.mono, opacity: 0.5 }}>
                <span>{fmt(pos)}</span>
                <span>-{fmt(rem)}</span>
            </div>
        </div>
    );
};
