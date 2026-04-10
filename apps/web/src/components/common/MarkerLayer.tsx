import React, { useCallback, useMemo, useRef, useState } from "react";
import type { TrackMarker } from "@suniplayer/core";
import type { CollaborationFeatureFlags } from "../../config/featureFlags";
import { collaborationFeatureFlags, isCollabMarkersEnabled } from "../../config/featureFlags";
import { toTrackMarker } from "../../features/collaboration/markers/adapters/trackMarkerAdapter";
import { MarkerEditor, type MarkerEditorValue } from "../../features/collaboration/markers/components/MarkerEditor";
import type { MarkerRepository } from "../../features/collaboration/markers/data/markerRepository";
import { useMarkers } from "../../features/collaboration/markers/hooks/useMarkers";
import type { Marker, MarkerAuthor } from "../../types/marker";
import { findNearbyMarker, getBubbleState } from "./markerUtils";
import { MarkerDot } from "./MarkerDot";
import { MarkerBubble } from "./MarkerBubble";
import { MarkerModal } from "./MarkerModal";

// Inject CSS keyframe once
const PULSE_STYLE = `
@keyframes markerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}
`;
// Inject at module load (not inside component to avoid act() warnings in tests)
if (typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = PULSE_STYLE;
    document.head.appendChild(el);
}

const LONG_PRESS_MS = 500;

interface MarkerLayerProps {
    children: React.ReactNode;
    markers: TrackMarker[];
    collaborationFlags?: CollaborationFeatureFlags;
    collaborativeOptions?: MarkerLayerCollaborativeOptions;
    posMs: number;
    durationMs: number;
    isLive: boolean;
    onMarkersChange: (markers: TrackMarker[]) => void;
    /** Called for seek (short click on empty area). Only called when !isLive. */
    onSeek: (posMs: number) => void;
}

interface ModalState {
    marker: Partial<TrackMarker> & { posMs: number };
    mode: "new" | "edit" | "readonly";
}

interface CollaborativeModalState {
    marker: Partial<Marker> & { timeMs: number };
    mode: "new" | "edit" | "readonly";
}

export interface MarkerLayerCollaborativeOptions {
    trackId: string;
    currentUser: MarkerAuthor;
    repository?: MarkerRepository;
    includeDeleted?: boolean;
    now?: () => string;
}

export type MarkerLayerMode = "legacy" | "collaborative";

export interface ResolveRenderMarkersOptions {
    legacyMarkers: TrackMarker[];
    collaborativeMarkers: Marker[];
    collaborativeEnabled: boolean;
}

export function resolveMarkerLayerMode(
    flags: CollaborationFeatureFlags = collaborationFeatureFlags
): MarkerLayerMode {
    return isCollabMarkersEnabled(flags) ? "collaborative" : "legacy";
}

export function resolveRenderMarkers({
    legacyMarkers,
    collaborativeMarkers,
    collaborativeEnabled,
}: ResolveRenderMarkersOptions): TrackMarker[] {
    if (!collaborativeEnabled) {
        return legacyMarkers;
    }

    return collaborativeMarkers.map((marker) => toTrackMarker(marker));
}

export const MarkerLayer: React.FC<MarkerLayerProps> = ({
    children,
    markers,
    collaborationFlags = collaborationFeatureFlags,
    collaborativeOptions,
    posMs,
    durationMs,
    isLive,
    onMarkersChange,
    onSeek,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
    const isLongPress = useRef(false);
    const pendingPosMs = useRef(0);

    const [provisionalPosMs, setProvisionalPosMs] = useState<number | null>(null);
    const [modal, setModal] = useState<ModalState | null>(null);
    const [collaborativeModal, setCollaborativeModal] = useState<CollaborativeModalState | null>(null);
    const markerLayerMode = resolveMarkerLayerMode(collaborationFlags);
    const collaborativeMarkersEnabled = markerLayerMode === "collaborative" && collaborativeOptions !== undefined;
    const collaborativeState = useMarkers({
        trackId: collaborativeOptions?.trackId ?? "",
        currentUser: collaborativeOptions?.currentUser ?? FALLBACK_COLLABORATIVE_USER,
        repository: collaborativeOptions?.repository,
        includeDeleted: collaborativeOptions?.includeDeleted,
        now: collaborativeOptions?.now,
        enabled: collaborativeMarkersEnabled,
    });
    const collaborativeMarkers = collaborativeState.markers;
    const renderMarkers = useMemo(() => {
        return resolveRenderMarkers({
            legacyMarkers: markers,
            collaborativeMarkers,
            collaborativeEnabled: collaborativeMarkersEnabled,
        });
    }, [collaborativeMarkers, collaborativeMarkersEnabled, markers]);
    const collaborativeMarkersById = useMemo(() => {
        return new Map(collaborativeMarkers.map((marker) => [marker.id, marker]));
    }, [collaborativeMarkers]);

    const getPosMs = useCallback((clientX: number): number => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return pct * durationMs;
    }, [durationMs]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        isLongPress.current = false;

        const clickPosMs = getPosMs(e.clientX);
        pendingPosMs.current = clickPosMs;

        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setProvisionalPosMs(clickPosMs);
        }, LONG_PRESS_MS);
    }, [getPosMs]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!mouseDownPos.current || !longPressTimer.current) return;
        const dx = Math.abs(e.clientX - mouseDownPos.current.x);
        const dy = Math.abs(e.clientY - mouseDownPos.current.y);
        if (dx > 5 || dy > 5) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isLongPress.current) {
            if (collaborativeMarkersEnabled) {
                setCollaborativeModal({ marker: { timeMs: pendingPosMs.current }, mode: "new" });
            } else {
                setModal({ marker: { posMs: pendingPosMs.current }, mode: "new" });
            }
            return;
        }

        // Short click: hit-test against existing markers
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const nearby = findNearbyMarker(clickX, rect.width, durationMs, renderMarkers);

        if (nearby) {
            if (collaborativeMarkersEnabled) {
                const collaborativeMarker = collaborativeMarkersById.get(nearby.id);

                if (collaborativeMarker !== undefined) {
                    setCollaborativeModal({
                        marker: collaborativeMarker,
                        mode: isLive ? "readonly" : "edit",
                    });
                }
            } else {
                setModal({
                    marker: nearby,
                    mode: isLive ? "readonly" : "edit",
                });
            }
        } else {
            // Seek
            onSeek(getPosMs(e.clientX));
        }

        setProvisionalPosMs(null);
        mouseDownPos.current = null;
        isLongPress.current = false;
    }, [durationMs, renderMarkers, collaborativeMarkersEnabled, collaborativeMarkersById, isLive, onSeek, getPosMs]);

    // ── Modal handlers ───────────────────────────────────────────────────────
    const handleSave = useCallback((saved: TrackMarker) => {
        const existing = markers.find(m => m.id === saved.id);
        const updated = existing
            ? markers.map(m => m.id === saved.id ? saved : m)
            : [...markers, saved];
        onMarkersChange(updated);
        setModal(null);
        setProvisionalPosMs(null);
    }, [markers, onMarkersChange]);

    const handleDelete = useCallback((id: string) => {
        onMarkersChange(markers.filter(m => m.id !== id));
        setModal(null);
    }, [markers, onMarkersChange]);

    const handleNavigate = useCallback((marker: TrackMarker) => {
        setModal({ marker, mode: isLive ? "readonly" : "edit" });
    }, [isLive]);

    const handleCollaborativeSave = useCallback((value: MarkerEditorValue) => {
        if (!collaborativeMarkersEnabled) {
            return;
        }

        const activeMarkerId = collaborativeModal?.marker.id;

        if (typeof activeMarkerId === "string" && activeMarkerId.length > 0) {
            void collaborativeState.updateMarker(activeMarkerId, {
                label: value.label,
                note: value.note,
                category: value.category,
                shared: value.shared,
            });
        } else {
            void collaborativeState.createMarker({
                timeMs: value.timeMs,
                label: value.label,
                note: value.note,
                category: value.category,
                shared: value.shared,
            });
        }

        collaborativeState.clearError();
        setCollaborativeModal(null);
        setProvisionalPosMs(null);
    }, [collaborativeMarkersEnabled, collaborativeModal, collaborativeState]);

    const handleCollaborativeDelete = useCallback((id: string) => {
        if (!collaborativeMarkersEnabled) {
            return;
        }

        void collaborativeState.deleteMarker(id);
        collaborativeState.clearError();
        setCollaborativeModal(null);
    }, [collaborativeMarkersEnabled, collaborativeState]);

    const handleCollaborativeNavigate = useCallback((marker: Marker) => {
        setCollaborativeModal({ marker, mode: isLive ? "readonly" : "edit" });
    }, [isLive]);

    // ── Bubble stacking: group markers by posMs ──────────────────────────────
    // Group markers sharing the same posMs bucket (within 500ms)
    const bubbleGroups = new Map<string, TrackMarker[]>();
    for (const m of renderMarkers) {
        const bucket = Math.round(m.posMs / 500);
        const key = String(bucket);
        if (!bubbleGroups.has(key)) bubbleGroups.set(key, []);
        bubbleGroups.get(key)!.push(m);
    }

    return (
        <div
            ref={containerRef}
            data-marker-mode={markerLayerMode}
            data-testid="marker-layer"
            style={{ position: "relative", userSelect: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {children}

            {collaborativeMarkersEnabled && collaborativeState.error !== null && (
                <div
                    role="alert"
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 40,
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.45)",
                        color: "#fecaca",
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                    }}
                >
                    {collaborativeState.error.message}
                </div>
            )}

            {/* Provisional dot (during long press) */}
            {provisionalPosMs !== null && (
                <div style={{
                    position: "absolute",
                    left: `${(provisionalPosMs / durationMs) * 100}%`,
                    bottom: 0,
                    transform: "translateX(-50%)",
                    width: 8, height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    opacity: 0.5,
                    pointerEvents: "none",
                    zIndex: 10,
                }} />
            )}

            {/* Marker dots */}
            {renderMarkers.map(m => (
                <MarkerDot
                    key={m.id}
                    marker={m}
                    durationMs={durationMs}
                    onClick={(marker) => {
                        if (collaborativeMarkersEnabled) {
                            const collaborativeMarker = collaborativeMarkersById.get(marker.id);

                            if (collaborativeMarker !== undefined) {
                                setCollaborativeModal({
                                    marker: collaborativeMarker,
                                    mode: isLive ? "readonly" : "edit",
                                });
                            }

                            return;
                        }

                        setModal({ marker, mode: isLive ? "readonly" : "edit" });
                    }}
                />
            ))}

            {/* Bubbles */}
            {renderMarkers.map(m => {
                const state = getBubbleState(m.posMs, posMs);
                if (state === "hidden") return null;
                // Find stack index within its group
                const bucket = String(Math.round(m.posMs / 500));
                const group = bubbleGroups.get(bucket) ?? [];
                const stackIndex = group.indexOf(m);
                return (
                    <MarkerBubble
                        key={m.id}
                        marker={m}
                        durationMs={durationMs}
                        playheadMs={posMs}
                        state={state}
                        stackIndex={stackIndex}
                    />
                );
            })}

            {/* Modal */}
            {modal && (
                <MarkerModal
                    marker={modal.marker}
                    markers={markers}
                    isReadOnly={modal.mode === "readonly"}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onNavigate={handleNavigate}
                    onClose={() => { setModal(null); setProvisionalPosMs(null); }}
                />
            )}

            {collaborativeModal && (
                <MarkerEditor
                    marker={collaborativeModal.marker}
                    markers={collaborativeMarkers}
                    isReadOnly={collaborativeModal.mode === "readonly"}
                    onClose={() => {
                        collaborativeState.clearError();
                        setCollaborativeModal(null);
                        setProvisionalPosMs(null);
                    }}
                    onDelete={handleCollaborativeDelete}
                    onNavigate={handleCollaborativeNavigate}
                    onSave={handleCollaborativeSave}
                />
            )}
        </div>
    );
};

const FALLBACK_COLLABORATIVE_USER: MarkerAuthor = {
    id: "collab-marker-layer",
    name: "Collaborative Marker Layer",
    color: "#06b6d4",
};
