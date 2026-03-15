import React from "react";

import { SetSummary } from "../../../components/common/SetSummary";
import { TrackRow } from "../../../components/common/TrackRow";
import { THEME } from "../../../data/theme";
import type { Track } from "../../../types";

interface BuilderGeneratedSetSectionProps {
    tracks: Track[];
    targetSeconds: number;
    dropTarget: number | null;
    activeDragIndex: number | null;
    onSave: () => void;
    onSendToPlayer: () => void;
    onDragStart: (index: number) => void;
    onDragOver: (event: React.DragEvent, index: number) => void;
    onDrop: (event: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onRemoveTrack: (index: number) => void;
    onEditTrack: (track: Track) => void;
}

export const BuilderGeneratedSetSection: React.FC<BuilderGeneratedSetSectionProps> = ({
    tracks,
    targetSeconds,
    dropTarget,
    activeDragIndex,
    onSave,
    onSendToPlayer,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onRemoveTrack,
    onEditTrack,
}) => {
    if (tracks.length === 0) {
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${THEME.colors.border}`, borderRadius: THEME.radius.xl, color: THEME.colors.text.muted, fontSize: 14, minHeight: 120 }}>
                Configure and click Generate to start
            </div>
        );
    }

    return (
        <section style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <style>{`
                    @media (max-width: 480px) {
                        .section-header { flex-direction: column; align-items: flex-start !important; gap: 8px; }
                        .header-actions { width: 100%; display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; }
                        .header-actions button { padding: 8px 4px !important; font-size: 10px !important; }
                    }
                `}</style>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Generated Set</h2>
                <div className="header-actions" style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={onSave}
                        title="Guardar este set en tu historial personal"
                        style={{
                            padding: "6px 12px",
                            borderRadius: THEME.radius.sm,
                            border: `1px solid ${THEME.colors.status.success}40`,
                            backgroundColor: THEME.colors.status.success + "10",
                            color: THEME.colors.status.success,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Save to History
                    </button>
                    <button
                        onClick={onSendToPlayer}
                        title="Enviar todas estas canciones al Reproductor para tocarlas ahora"
                        style={{
                            padding: "6px 14px",
                            borderRadius: THEME.radius.sm,
                            border: "none",
                            background: THEME.gradients.cyan,
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: `0 4px 12px ${THEME.colors.brand.cyan}30`,
                        }}
                    >
                        Send to Player
                    </button>
                </div>
            </div>

            <SetSummary tracks={tracks} target={targetSeconds} />

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", backgroundColor: THEME.colors.panel, borderRadius: THEME.radius.lg, border: `1px solid ${THEME.colors.border}`, overflow: "hidden" }}>
                {tracks.map((track, index) => {
                    const isDragging = activeDragIndex === index;
                    const isTarget = dropTarget === index && activeDragIndex !== null && activeDragIndex !== index;

                    return (
                        <div
                            key={track.id + index}
                            draggable
                            onDragStart={() => onDragStart(index)}
                            onDragOver={(event) => onDragOver(event, index)}
                            onDrop={(event) => onDrop(event, index)}
                            onDragEnd={onDragEnd}
                            style={{
                                display: "flex",
                                alignItems: "stretch",
                                opacity: isDragging ? 0.4 : 1,
                                borderTop: isTarget ? `2px solid ${THEME.colors.brand.violet}` : "2px solid transparent",
                                backgroundColor: isTarget ? `${THEME.colors.brand.violet}12` : undefined,
                                transition: "opacity 0.1s, border-top 0.1s, background-color 0.1s",
                            }}
                        >
                            <div
                                title="Arrastra para reordenar"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0 6px 0 10px",
                                    color: THEME.colors.text.muted,
                                    opacity: 0.35,
                                    flexShrink: 0,
                                    cursor: "grab",
                                    userSelect: "none",
                                }}
                            >
                                <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                                    <circle cx="3" cy="2.5" r="1.2" />
                                    <circle cx="7" cy="2.5" r="1.2" />
                                    <circle cx="3" cy="7" r="1.2" />
                                    <circle cx="7" cy="7" r="1.2" />
                                    <circle cx="3" cy="11.5" r="1.2" />
                                    <circle cx="7" cy="11.5" r="1.2" />
                                </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <TrackRow track={track} idx={index} showN onRm={onRemoveTrack} onEdit={onEditTrack} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
