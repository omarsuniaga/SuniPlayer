import React, { useEffect, useMemo, useRef, useState } from "react";

import { THEME } from "../../../../data/theme";
import type { Marker, MarkerCategory } from "../../../../types/marker";

const MARKER_CATEGORIES: Array<{ value: MarkerCategory; label: string }> = [
    { value: "general", label: "General" },
    { value: "cue", label: "Cue" },
    { value: "note", label: "Note" },
    { value: "section", label: "Section" },
    { value: "warning", label: "Warning" },
];

function formatMarkerTime(timeMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function resolveMarkerCategory(value: string, fallback: MarkerCategory): MarkerCategory {
    const matchedCategory = MARKER_CATEGORIES.find((category) => category.value === value);
    return matchedCategory?.value ?? fallback;
}

export interface MarkerEditorValue {
    timeMs: number;
    label: string;
    note: string;
    category: MarkerCategory;
    shared: boolean;
}

export interface MarkerEditorFormState {
    label: string;
    note: string;
    category: MarkerCategory;
    shared: boolean;
}

export interface MarkerEditorNavigation {
    previousMarker: Marker | null;
    nextMarker: Marker | null;
}

interface MarkerEditorProps {
    marker: Partial<Marker> & { timeMs: number };
    markers: Marker[];
    isReadOnly: boolean;
    onSave: (value: MarkerEditorValue) => void;
    onDelete?: (id: string) => void;
    onNavigate: (marker: Marker) => void;
    onClose: () => void;
}

export function resolveMarkerEditorFormState(marker: Partial<Marker>): MarkerEditorFormState {
    return {
        label: marker.label ?? marker.note ?? "",
        note: marker.note ?? "",
        category: marker.category ?? "general",
        shared: marker.shared ?? true,
    };
}

export function resolveMarkerEditorNavigation(
    markers: Marker[],
    markerId?: string
): MarkerEditorNavigation {
    if (markerId === undefined) {
        return {
            previousMarker: null,
            nextMarker: null,
        };
    }

    const sortedMarkers = [...markers].sort((leftMarker, rightMarker) => leftMarker.timeMs - rightMarker.timeMs);
    const currentMarkerIndex = sortedMarkers.findIndex((candidateMarker) => candidateMarker.id === markerId);

    if (currentMarkerIndex === -1) {
        return {
            previousMarker: null,
            nextMarker: null,
        };
    }

    return {
        previousMarker: currentMarkerIndex > 0 ? sortedMarkers[currentMarkerIndex - 1] : null,
        nextMarker: currentMarkerIndex < sortedMarkers.length - 1 ? sortedMarkers[currentMarkerIndex + 1] : null,
    };
}

export const MarkerEditor: React.FC<MarkerEditorProps> = ({
    marker,
    markers,
    isReadOnly,
    onSave,
    onDelete,
    onNavigate,
    onClose,
}) => {
    const initialFormState = resolveMarkerEditorFormState(marker);
    const [label, setLabel] = useState(initialFormState.label);
    const [note, setNote] = useState(initialFormState.note);
    const [category, setCategory] = useState<MarkerCategory>(initialFormState.category);
    const [shared, setShared] = useState(initialFormState.shared);
    const labelInputRef = useRef<HTMLInputElement>(null);

    const navigation = useMemo(() => {
        return resolveMarkerEditorNavigation(markers, marker.id);
    }, [markers, marker.id]);
    const editableMarkerId = typeof marker.id === "string" ? marker.id : null;

    useEffect(() => {
        labelInputRef.current?.focus();
    }, []);

    const handleSave = (): void => {
        const trimmedLabel = label.trim();

        if (trimmedLabel.length === 0) {
            return;
        }

        onSave({
            timeMs: marker.timeMs,
            label: trimmedLabel,
            note: note.trim(),
            category,
            shared,
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent): void => {
        if (event.key === "Escape") {
            onClose();
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !isReadOnly) {
            handleSave();
        }
    };

    return (
        <div
            aria-labelledby="marker-editor-title"
            aria-modal="true"
            role="dialog"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9000,
                backgroundColor: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#0D1117",
                    border: `1px solid ${THEME.colors.border}`,
                    borderRadius: THEME.radius.xl,
                    padding: 24,
                    width: "min(440px, 92vw)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div
                            id="marker-editor-title"
                            style={{
                                fontSize: 10,
                                color: THEME.colors.text.muted,
                                fontWeight: 700,
                                letterSpacing: 1,
                                textTransform: "uppercase",
                            }}
                        >
                            {marker.id === undefined ? "Nuevo marker" : "Editar marker"}
                        </div>
                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: 900,
                                fontFamily: THEME.fonts.mono,
                                color: "#ef4444",
                                marginTop: 2,
                            }}
                        >
                            {formatMarkerTime(marker.timeMs)}
                        </div>
                    </div>
                    <button
                        aria-label="Close marker editor"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: THEME.colors.text.muted,
                            cursor: "pointer",
                            fontSize: 20,
                            lineHeight: 1,
                        }}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ color: THEME.colors.text.secondary, fontSize: 12, fontWeight: 700 }}>Etiqueta</span>
                    <input
                        ref={labelInputRef}
                        disabled={isReadOnly}
                        onChange={(event) => setLabel(event.target.value)}
                        style={{
                            backgroundColor: THEME.colors.surface,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.md,
                            color: THEME.colors.text.primary,
                            fontSize: 14,
                            padding: "10px 12px",
                            outline: "none",
                        }}
                        type="text"
                        value={label}
                    />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ color: THEME.colors.text.secondary, fontSize: 12, fontWeight: 700 }}>Nota</span>
                    <textarea
                        disabled={isReadOnly}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        style={{
                            resize: "none",
                            backgroundColor: THEME.colors.surface,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radius.md,
                            color: THEME.colors.text.primary,
                            fontSize: 14,
                            padding: "10px 12px",
                            outline: "none",
                        }}
                        value={note}
                    />
                </label>

                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ color: THEME.colors.text.secondary, fontSize: 12, fontWeight: 700 }}>Categoria</span>
                        <select
                            disabled={isReadOnly}
                            onChange={(event) => setCategory(resolveMarkerCategory(event.target.value, category))}
                            style={{
                                backgroundColor: THEME.colors.surface,
                                border: `1px solid ${THEME.colors.border}`,
                                borderRadius: THEME.radius.md,
                                color: THEME.colors.text.primary,
                                fontSize: 14,
                                padding: "10px 12px",
                                outline: "none",
                            }}
                            value={category}
                        >
                            {MARKER_CATEGORIES.map((markerCategory) => (
                                <option key={markerCategory.value} value={markerCategory.value}>
                                    {markerCategory.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: THEME.colors.text.secondary,
                            fontSize: 12,
                            fontWeight: 700,
                            marginTop: 22,
                        }}
                    >
                        <input
                            checked={shared}
                            disabled={isReadOnly}
                            onChange={(event) => setShared(event.target.checked)}
                            type="checkbox"
                        />
                        Compartido
                    </label>
                </div>

                {marker.id !== undefined && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            disabled={navigation.previousMarker === null}
                            onClick={() => {
                                if (navigation.previousMarker !== null) {
                                    onNavigate(navigation.previousMarker);
                                }
                            }}
                            style={navigationButtonStyle(navigation.previousMarker !== null)}
                            type="button"
                        >
                            ← Anterior
                        </button>
                        <button
                            disabled={navigation.nextMarker === null}
                            onClick={() => {
                                if (navigation.nextMarker !== null) {
                                    onNavigate(navigation.nextMarker);
                                }
                            }}
                            style={navigationButtonStyle(navigation.nextMarker !== null)}
                            type="button"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}

                {!isReadOnly && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {editableMarkerId !== null && onDelete !== undefined && (
                            <button
                                onClick={() => onDelete(editableMarkerId)}
                                style={{
                                    padding: "10px 16px",
                                    borderRadius: THEME.radius.md,
                                    background: "transparent",
                                    border: "1px solid #ef4444",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                                type="button"
                            >
                                Eliminar
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: "10px",
                                borderRadius: THEME.radius.md,
                                background: "transparent",
                                border: `1px solid ${THEME.colors.border}`,
                                color: THEME.colors.text.muted,
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                            type="button"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={label.trim().length === 0}
                            onClick={handleSave}
                            style={{
                                flex: 2,
                                padding: "10px",
                                borderRadius: THEME.radius.md,
                                background: label.trim().length > 0 ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${label.trim().length > 0 ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                color: label.trim().length > 0 ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                                cursor: label.trim().length > 0 ? "pointer" : "default",
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                            type="button"
                        >
                            Guardar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

function navigationButtonStyle(isEnabled: boolean): React.CSSProperties {
    return {
        flex: 1,
        padding: "8px",
        borderRadius: THEME.radius.md,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${THEME.colors.border}`,
        color: isEnabled ? THEME.colors.text.secondary : THEME.colors.text.muted,
        cursor: isEnabled ? "pointer" : "default",
        fontSize: 12,
        fontWeight: 700,
    };
}
