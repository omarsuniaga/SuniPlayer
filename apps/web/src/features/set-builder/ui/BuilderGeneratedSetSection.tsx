import React from "react";
import { THEME } from "../../../data/theme";
import type { Track } from "@suniplayer/core";

interface BuilderGeneratedSetSectionProps {
    tracks: Track[];
    onSave: () => void;
    onSendToPlayer: () => void;
    onDragStart: (index: number) => void;
    onDragOver: (event: React.DragEvent, index: number) => void;
    onDrop: (event: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onRemoveTrack: (index: number) => void;
    onEditTrack: (track: Track) => void;
    onSmartReplace: (index: number) => void;
    onToggleAnchor: (index: number, track: Track) => void;
    anchors: Record<number, Track>;
    dropTarget: number | null;
    activeDragIndex: number | null;
    targetSeconds: number;
}

const MixHealth: React.FC<{ t1: Track, t2: Track }> = ({ t1, t2 }) => {
    const bpm1 = t1.bpm || 120;
    const bpm2 = t2.bpm || 120;
    const bpmDiff = Math.abs(bpm1 - bpm2);
    const getDist = (k1: string, k2: string) => {
        if (!k1 || !k2) return 2;
        const n1 = parseInt(k1); const l1 = k1.replace(/[0-9]/g, '');
        const n2 = parseInt(k2); const l2 = k2.replace(/[0-9]/g, '');
        const nd = Math.abs(n1 - n2);
        const cd = nd > 6 ? 12 - nd : nd;
        return l1 === l2 ? cd : (cd === 0 ? 1 : cd + 1);
    };
    const keyDist = getDist(t1.key || "", t2.key || "");
    const color = keyDist <= 1 && bpmDiff <= 8 ? THEME.colors.status.success : (keyDist > 2 || bpmDiff > 15 ? THEME.colors.status.error : THEME.colors.status.warning);
    return (
        <div className="mix-health" style={{ height: 14, display: "flex", alignItems: "center", fontSize: 8, fontWeight: 900, color, paddingLeft: 20, borderLeft: `1px solid ${color}40`, opacity: 0.8 }}>
            ● {bpmDiff}bpm {t1.key}→{t2.key}
        </div>
    );
};

export const BuilderGeneratedSetSection: React.FC<BuilderGeneratedSetSectionProps> = ({
    tracks, onSave, onSendToPlayer, onDragStart, onDragOver, onDrop, onDragEnd, onRemoveTrack, onEditTrack, onSmartReplace, onToggleAnchor, anchors, dropTarget, activeDragIndex, targetSeconds
}) => {
    if (tracks.length === 0) return <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#555", fontWeight: 700 }}>Set vacío.<br/>Configurá y Generá un set arriba.</div>;

    return (
        <section style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <style>{`
                .track-row { height: 36px; }
                .track-actions button { width: 32px; height: 32px; display: flex; alignItems: center; justifyContent: center; }
                @media (max-width: 640px) {
                    .track-row { height: 48px !important; padding: 4px 8px !important; }
                    .track-title { font-size: 12px !important; }
                    .track-artist { font-size: 10px !important; display: block !important; }
                    .track-actions button { width: 40px !important; height: 40px !important; font-size: 14px !important; }
                    .mix-health { height: 18px !important; font-size: 9px !important; }
                }
            `}</style>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px" }}>
                <span style={{ fontSize: 10, fontWeight: 900, opacity: 0.6, letterSpacing: 1 }}>SET ACTIVO ({tracks.length})</span>
                <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={onSave} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "white", fontSize: 9, fontWeight: 800, cursor: "pointer" }}>GUARDAR</button>
                    <button onClick={onSendToPlayer} style={{ padding: "6px 12px", borderRadius: 4, border: "none", backgroundColor: THEME.colors.brand.cyan, color: "black", fontSize: 9, fontWeight: 900, cursor: "pointer" }}>CARGAR</button>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)", borderRadius: 6, border: `1px solid rgba(255,255,255,0.05)`, overflow: "hidden" }}>
                {tracks.map((track, index) => {
                    const isAnchored = !!anchors[index];
                    return (
                    <React.Fragment key={track.id + index}>
                        <div draggable={!isAnchored} onDragStart={() => onDragStart(index)} onDragOver={e => onDragOver(e, index)} onDrop={e => onDrop(e, index)} onDragEnd={onDragEnd}
                            className="track-row"
                            style={{ 
                                display: "flex", alignItems: "center", padding: "0 4px", position: "relative",
                                opacity: activeDragIndex === index ? 0.3 : 1, 
                                backgroundColor: isAnchored ? "rgba(6,182,212,0.08)" : (dropTarget === index ? "rgba(255,255,255,0.05)" : "transparent"), 
                                borderBottom: `1px solid rgba(255,255,255,0.03)` 
                            }}>
                            <span style={{ width: 16, fontSize: 10, opacity: isAnchored ? 0 : 0.2, textAlign: "center" }}>{isAnchored ? "" : "⋮"}</span>
                            <span style={{ width: 20, fontSize: 10, fontWeight: 900, opacity: 0.3, textAlign: "center" }}>{index + 1}</span>
                            
                            <div style={{ flex: 1, minWidth: 0, padding: "0 8px" }}>
                                <div className="track-title" style={{ color: isAnchored ? THEME.colors.brand.cyan : "white", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {track.title}
                                </div>
                                <div className="track-artist" style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "none" }}>
                                    {track.artist}
                                </div>
                            </div>

                            <div className="track-actions" style={{ display: "flex", alignItems: "center" }}>
                                <button onClick={() => onToggleAnchor(index, track)} style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer", opacity: isAnchored ? 1 : 0.2 }}>📌</button>
                                <button onClick={() => onSmartReplace(index)} style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer" }}>✨</button>
                                <button onClick={() => onEditTrack(track)} style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer", opacity: 0.3 }}>✎</button>
                                <button onClick={() => onRemoveTrack(index)} style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer", color: THEME.colors.status.error, opacity: 0.6 }}>×</button>
                            </div>
                        </div>
                        {index < tracks.length - 1 && <MixHealth t1={track} t2={tracks[index + 1]} />}
                    </React.Fragment>
                )})}
            </div>
        </section>
    );
};
