import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TrackMarker } from \"@suniplayer/core\";
import { THEME } from "../../data/theme";

const MAX_CHARS = 140;

function fmtMs(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

interface MarkerModalProps {
    marker: Partial<TrackMarker> & { posMs: number };  // posMs always set
    markers: TrackMarker[];                            // all track markers (for nav)
    isReadOnly: boolean;
    onSave: (marker: TrackMarker) => void;
    onDelete: (id: string) => void;
    onNavigate: (marker: TrackMarker) => void;
    onClose: () => void;
}

export const MarkerModal: React.FC<MarkerModalProps> = ({
    marker, markers, isReadOnly, onSave, onDelete, onNavigate, onClose,
}) => {
    const [comment, setComment] = useState(marker.comment ?? "");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sort markers by position for prev/next nav
    const sorted = [...markers].sort((a, b) => a.posMs - b.posMs);
    const currentIdx = marker.id ? sorted.findIndex(m => m.id === marker.id) : -1;
    const prevMarker = currentIdx > 0 ? sorted[currentIdx - 1] : null;
    const nextMarker = currentIdx !== -1 && currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSave = () => {
        if (!comment.trim()) return;
        onSave({
            id: marker.id ?? crypto.randomUUID(),
            posMs: marker.posMs,
            comment: comment.trim().slice(0, MAX_CHARS),
        });
    };

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 2000);
            return;
        }
        if (marker.id) onDelete(marker.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
    };

    return createPortal(
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9000,
                backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#0D1117",
                    border: `1px solid ${THEME.colors.border}`,
                    borderRadius: THEME.radius.xl,
                    padding: 24,
                    width: "min(400px, 92vw)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 10, color: THEME.colors.text.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                            {marker.id ? "Editar marcador" : "Nuevo marcador"}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: THEME.fonts.mono, color: "#ef4444", marginTop: 2 }}>
                            {fmtMs(marker.posMs)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
                </div>

                {/* Textarea */}
                <div style={{ position: "relative" }}>
                    <textarea
                        ref={textareaRef}
                        value={comment}
                        onChange={e => setComment(e.target.value.slice(0, MAX_CHARS))}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? "" : "Escribe tu comentario…"}
                        rows={4}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            resize: "none",
                            backgroundColor: THEME.colors.surface,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.md,
                            color: THEME.colors.text.primary,
                            fontSize: 14,
                            padding: "10px 12px",
                            fontFamily: "inherit",
                            outline: "none",
                        }}
                    />
                    {!isReadOnly && (
                        <div style={{
                            position: "absolute", bottom: 8, right: 10,
                            fontSize: 10, color: comment.length >= MAX_CHARS ? "#ef4444" : THEME.colors.text.muted,
                        }}>
                            {comment.length}/{MAX_CHARS}
                        </div>
                    )}
                </div>

                {/* Nav — prev/next */}
                {markers.length > 1 && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => prevMarker && onNavigate(prevMarker)}
                            disabled={!prevMarker}
                            style={{
                                flex: 1, padding: "8px", borderRadius: THEME.radius.md,
                                background: "rgba(255,255,255,0.04)", border: `1px solid ${THEME.colors.border}`,
                                color: prevMarker ? THEME.colors.text.secondary : THEME.colors.text.muted,
                                cursor: prevMarker ? "pointer" : "default", fontSize: 12, fontWeight: 700,
                            }}
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={() => nextMarker && onNavigate(nextMarker)}
                            disabled={!nextMarker}
                            style={{
                                flex: 1, padding: "8px", borderRadius: THEME.radius.md,
                                background: "rgba(255,255,255,0.04)", border: `1px solid ${THEME.colors.border}`,
                                color: nextMarker ? THEME.colors.text.secondary : THEME.colors.text.muted,
                                cursor: nextMarker ? "pointer" : "default", fontSize: 12, fontWeight: 700,
                            }}
                        >
                            Siguiente →
                        </button>
                    </div>
                )}

                {/* Action buttons */}
                {!isReadOnly && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {marker.id && (
                            <button
                                onClick={handleDelete}
                                style={{
                                    padding: "10px 16px", borderRadius: THEME.radius.md,
                                    background: confirmDelete ? "rgba(239,68,68,0.15)" : "transparent",
                                    border: `1px solid ${confirmDelete ? "#ef4444" : THEME.colors.border}`,
                                    color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700,
                                    transition: "all 0.2s",
                                }}
                            >
                                {confirmDelete ? "¿Confirmar?" : "Eliminar"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: "10px", borderRadius: THEME.radius.md,
                                background: "transparent", border: `1px solid ${THEME.colors.border}`,
                                color: THEME.colors.text.muted, cursor: "pointer", fontSize: 13, fontWeight: 700,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!comment.trim()}
                            style={{
                                flex: 2, padding: "10px", borderRadius: THEME.radius.md,
                                background: comment.trim() ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${comment.trim() ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                color: comment.trim() ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                                cursor: comment.trim() ? "pointer" : "default",
                                fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                            }}
                        >
                            Guardar
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
