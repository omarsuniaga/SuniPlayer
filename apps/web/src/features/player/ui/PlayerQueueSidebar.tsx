// src/features/player/ui/PlayerQueueSidebar.tsx
import React from "react";
import { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme.ts";
import { fmt } from "@suniplayer/core";

interface Props {
    pQueue: Track[];
    ci: number;
    isLive: boolean;
    mCol: string;
    masterPool: Track[];
    stackOrder: string[];
    dropTarget: number | null;
    editingNotes: string | null;
    dragIdx: React.MutableRefObject<number | null>;
    onDragStart: (i: number) => void;
    onDragOver: (e: React.DragEvent, i: number) => void;
    onDrop: (e: React.DragEvent, i: number) => void;
    onDragEnd: () => void;
    onQueueClick: (track: Track, idx: number) => void;
    onTogglePool: (track: Track) => void;
    onSetNotes: (id: string, notes: string) => void;
    onEditNotes: (id: string | null) => void;
    onTrimTrack: (track: Track) => void;
}

export const PlayerQueueSidebar: React.FC<Props> = ({
    pQueue, ci, isLive, mCol, masterPool, stackOrder,
    dropTarget, editingNotes, dragIdx,
    onDragStart, onDragOver, onDrop, onDragEnd,
    onQueueClick, onTogglePool, onSetNotes, onEditNotes, onTrimTrack,
}) => {
    const poolTracks = masterPool.filter(t => !pQueue.some(p => p.id === t.id));

    return (
        <aside className="desktop-sidebar" style={{ width: 340, backgroundColor: THEME.colors.panel, borderLeft: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${THEME.colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isLive && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2.5" strokeLinecap="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700, color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.primary }}>
                            {isLive ? "COLA · LOCKED" : "COLA · EDIT"}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: THEME.colors.text.muted, fontFamily: THEME.fonts.mono }}>
                            {pQueue.length}/{masterPool.length}
                        </span>
                        <span style={{ fontSize: 13, fontFamily: THEME.fonts.mono, fontWeight: 700, color: mCol }}>{pQueue.length} activas</span>
                    </div>
                </div>
                {!isLive && (
                    <p style={{ fontSize: 11, color: THEME.colors.text.muted, margin: "8px 0 0", lineHeight: 1.4 }}>
                        Click en una pista para añadir/quitar de la cola de reproducción
                    </p>
                )}
            </div>

            {/* Queue list */}
            <div style={{ flex: 1, overflowY: "auto" }}>

                {/* ── ACTIVE QUEUE ── */}
                <div style={{ padding: "8px 8px 0" }}>
                    {isLive && (
                        <div style={{ fontSize: 10, color: THEME.colors.brand.violet, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "4px 8px 8px" }}>
                            Toca para apilar el orden ▼
                        </div>
                    )}
                    {pQueue.map((t, i) => {
                        const stackIdx = stackOrder.indexOf(t.id);
                        const isStacked = stackIdx !== -1;
                        const isCurrent = i === ci;

                        return (
                            <div
                                key={t.id + "q" + i}
                                draggable={!isLive && !isCurrent}
                                onDragStart={() => onDragStart(i)}
                                onDragOver={e => onDragOver(e, i)}
                                onDrop={e => onDrop(e, i)}
                                onDragEnd={onDragEnd}
                                onClick={() => onQueueClick(t, i)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 10px 10px 8px",
                                    borderRadius: THEME.radius.md,
                                    cursor: isCurrent ? "default" : (isLive ? "pointer" : "grab"),
                                    backgroundColor: isCurrent
                                        ? `${THEME.colors.brand.cyan}12`
                                        : dropTarget === i ? `${THEME.colors.brand.violet}18`
                                            : isStacked ? `${THEME.colors.brand.violet}10` : "transparent",
                                    borderTop: !isLive && dropTarget === i && dragIdx.current !== null && dragIdx.current !== i
                                        ? `2px solid ${THEME.colors.brand.violet}`
                                        : "2px solid transparent",
                                    borderLeft: isCurrent
                                        ? `3px solid ${THEME.colors.brand.cyan}`
                                        : isStacked ? `3px solid ${THEME.colors.brand.violet}60` : "3px solid transparent",
                                    transition: "all 0.1s",
                                    opacity: dragIdx.current === i ? 0.4 : 1,
                                }}
                                onMouseEnter={e => {
                                    if (!isCurrent && dragIdx.current === null) {
                                        const hoverColor = isLive
                                            ? (isStacked ? `${THEME.colors.status.error}10` : `${THEME.colors.brand.violet}15`)
                                            : `${THEME.colors.surfaceHover}`;
                                        e.currentTarget.style.backgroundColor = hoverColor;
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (dropTarget !== i) {
                                        e.currentTarget.style.backgroundColor = isCurrent
                                            ? `${THEME.colors.brand.cyan}12`
                                            : isStacked ? `${THEME.colors.brand.violet}10` : "transparent";
                                    }
                                }}
                                title={
                                    isCurrent ? "Reproduciendo ahora"
                                        : isLive
                                            ? (isStacked ? `Prioridad ${stackIdx + 1} — click para quitar del stack` : "Click para apilar como siguiente")
                                            : "Click para saltar · Arrastra para reordenar"
                                }
                            >
                                {/* Drag handle — only in Edit mode, not for current track */}
                                {!isLive && !isCurrent && (
                                    <div style={{
                                        color: THEME.colors.text.muted,
                                        opacity: 0.35,
                                        cursor: "grab",
                                        flexShrink: 0,
                                        padding: "0 2px",
                                        fontSize: 14,
                                    }}>
                                        ⠿
                                    </div>
                                )}
                                {/* Position/Stack badge */}
                                <span style={{
                                    minWidth: 22, height: 22,
                                    borderRadius: "50%",
                                    backgroundColor: isCurrent
                                        ? THEME.colors.brand.cyan
                                        : isStacked ? THEME.colors.brand.violet : "rgba(255,255,255,0.06)",
                                    color: isCurrent || isStacked ? "white" : THEME.colors.text.muted,
                                    fontSize: 10, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: THEME.fonts.mono,
                                    flexShrink: 0,
                                    transition: "all 0.2s",
                                    boxShadow: isStacked ? `0 0 8px ${THEME.colors.brand.violet}60` : "none",
                                }}>
                                    {isCurrent
                                        ? <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                        : isStacked ? (stackIdx + 1) : (i + 1)
                                    }
                                </span>

                                {/* Track info + Notes */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: isCurrent || isStacked ? 700 : 400,
                                        color: isCurrent ? "white" : isStacked ? THEME.colors.brand.violet : THEME.colors.text.secondary,
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>{t.title}</div>
                                    <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                    {/* Notes display/edit */}
                                    {editingNotes === t.id ? (
                                        <textarea
                                            autoFocus
                                            defaultValue={t.notes || ""}
                                            placeholder="Notas de performance..."
                                            onBlur={e => {
                                                onSetNotes(t.id, e.target.value.trim());
                                                onEditNotes(null);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === "Escape") onEditNotes(null);
                                                if (e.key === "Enter" && e.metaKey) {
                                                    onSetNotes(t.id, (e.target as HTMLTextAreaElement).value.trim());
                                                    onEditNotes(null);
                                                }
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                width: "100%",
                                                marginTop: 4,
                                                padding: "4px 8px",
                                                fontSize: 11,
                                                backgroundColor: "rgba(0,0,0,0.4)",
                                                border: `1px solid ${THEME.colors.brand.violet}60`,
                                                borderRadius: THEME.radius.sm,
                                                color: THEME.colors.text.primary,
                                                resize: "none",
                                                height: 52,
                                                outline: "none",
                                                fontFamily: THEME.fonts.main,
                                            }}
                                        />
                                    ) : t.notes ? (
                                        <div
                                            onClick={e => { e.stopPropagation(); if (!isLive) onEditNotes(t.id); }}
                                            style={{ fontSize: 11, color: THEME.colors.brand.violet, marginTop: 2, opacity: 0.85, cursor: isLive ? "default" : "pointer" }}
                                            title={isLive ? t.notes : "Click para editar notas"}
                                        >
                                            📝 {t.notes}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Right column: Duration + note btn + trim btn */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                                    <span style={{ fontSize: 11, fontFamily: THEME.fonts.mono, color: THEME.colors.text.muted }}>{fmt(t.duration_ms)}</span>
                                    {isLive && isStacked && (
                                        <span style={{ fontSize: 9, color: THEME.colors.brand.violet, fontWeight: 700, letterSpacing: "0.05em" }}>NEXT {stackIdx + 1}</span>
                                    )}
                                    {/* Note button (Edit mode only) */}
                                    {!isLive && !isCurrent && editingNotes !== t.id && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onEditNotes(editingNotes === t.id ? null : t.id); }}
                                            title="Agregar nota de performance"
                                            style={{
                                                background: "none", border: "none",
                                                cursor: "pointer", padding: "2px 3px",
                                                color: t.notes ? THEME.colors.brand.violet : THEME.colors.text.muted,
                                                opacity: t.notes ? 0.9 : 0.4,
                                                fontSize: 13, lineHeight: 1,
                                                transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = t.notes ? "0.9" : "0.4"; }}
                                        >
                                            ✍️
                                        </button>
                                    )}
                                    {/* Trimming button (Edit mode only) */}
                                    {!isLive && !isCurrent && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onTrimTrack(t); }}
                                            title="Recortar inicio/fin"
                                            style={{
                                                background: "none", border: "none",
                                                cursor: "pointer", padding: "2px 3px",
                                                color: THEME.colors.text.muted,
                                                opacity: 0.4,
                                                fontSize: 13, lineHeight: 1,
                                                transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = THEME.colors.brand.cyan; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = "0.4"; e.currentTarget.style.color = THEME.colors.text.muted; }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                                                <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                                                <line x1="8.12" y1="8.12" x2="12" y2="12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── POOL (not in queue) ── */}
                {poolTracks.length > 0 && (
                    <div style={{ padding: "12px 8px 8px", marginTop: 4, borderTop: `1px solid ${THEME.colors.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "0 8px 6px" }}>
                            Disponibles · no programadas
                        </div>
                        {poolTracks.map(t => (
                            <div
                                key={t.id + "pool"}
                                onClick={() => !isLive && onTogglePool(t)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 10px 10px 8px",
                                    borderRadius: THEME.radius.md,
                                    cursor: isLive ? "default" : "pointer",
                                    backgroundColor: "transparent",
                                    borderLeft: "3px solid transparent",
                                    transition: "background-color 0.15s",
                                    opacity: 0.45,
                                }}
                                onMouseEnter={e => {
                                    if (!isLive) {
                                        e.currentTarget.style.backgroundColor = `${THEME.colors.brand.cyan}0a`;
                                        e.currentTarget.style.opacity = "0.85";
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.opacity = "0.45";
                                }}
                                title={isLive ? "" : "Click para añadir a la cola"}
                            >
                                {/* Empty slot badge */}
                                <span style={{
                                    minWidth: 22, height: 22,
                                    borderRadius: "50%",
                                    border: `1px dashed rgba(255,255,255,0.15)`,
                                    fontSize: 10, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </span>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 400,
                                        color: THEME.colors.text.secondary,
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>{t.title}</div>
                                    <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                </div>

                                <span style={{ fontSize: 11, fontFamily: THEME.fonts.mono, color: THEME.colors.text.muted, flexShrink: 0 }}>
                                    {fmt(t.duration_ms)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Coming up next */}
                {ci < pQueue.length - 1 && (
                    <div style={{ margin: "8px", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Siguiente</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{pQueue[ci + 1]?.title}</div>
                        <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{pQueue[ci + 1]?.artist}</div>
                    </div>
                )}
            </div>
        </aside>
    );
};
