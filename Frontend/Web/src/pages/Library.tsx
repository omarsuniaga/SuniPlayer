import React, { useMemo, useRef, useState } from "react";
import { TRACKS, type Track } from "@suniplayer/core";
import { useVirtualizer } from "@tanstack/react-virtual";

import { ImportZone } from "../components/common/ImportZone";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { TrackRowV2 } from "../components/library/TrackRowV2";
import { THEME } from "../data/theme";
import {
    appendTrackToQueueTail,
    buildLibraryCatalog,
    buildPlayerLaunchQueue,
    checkCloudTrackAvailability,
} from "../features/library/lib/libraryCatalog";
import { SUPPORTED_AUDIO_FILE_ACCEPT } from "../features/library/lib/audioImport";
import { useBuilderStore } from "../store/useBuilderStore";
import { useLibraryStore } from "../store/useLibraryStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { setTrackTrim, updateTrackMetadata } from "../store/useProjectStore";
import { usePreviewStore } from "../store/usePreviewStore";
import { useIsMobile } from "../utils/useMediaQuery";

import { LibraryHeader } from "../components/library/LibraryHeader";
import { FilterBar } from "../components/library/FilterBar";

export const Library: React.FC = () => {
    const {
        customTracks,
        repertoire,
        removeCustomTrack,
        clearCustomTracks,
        removeFromRepertoire,
        addToRepertoire,
        // Selection & Filters (Phase 2)
        selectedTrackIds,
        toggleSelection,
        clearSelection,
        activeTags,
        toggleTagFilter,
        clearFilters
    } = useLibraryStore();
    
    const [search, setSearch] = useState("");
    const pQueue = usePlayerStore((state) => state.pQueue);
    const setPQueue = usePlayerStore((state) => state.setPQueue);
    const setCi = usePlayerStore((state) => state.setCi);
    const setPos = usePlayerStore((state) => state.setPos);
    const setElapsed = usePlayerStore((state) => state.setElapsed);
    const setPlaying = usePlayerStore((state) => state.setPlaying);
    const setTTarget = usePlayerStore((state) => state.setTTarget);
    const setCurrentSetMetadata = usePlayerStore((state) => state.setCurrentSetMetadata);
    const setView = useBuilderStore((state) => state.setView);

    const { stopPreview } = usePreviewStore();
    const isMobile = useIsMobile();

    const [importOpen, setImportOpen] = useState(false);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const [cloudStatus, setCloudStatus] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    // ── CUMULATIVE FILTERING LOGIC ──
    const sortedTracks = useMemo(() => {
        let pool = buildLibraryCatalog(TRACKS as Track[], customTracks);
        
        // 1. Filter by Search
        if (search) {
            const s = search.toLowerCase();
            pool = pool.filter(t => 
                t.title.toLowerCase().includes(s) || 
                t.artist.toLowerCase().includes(s) ||
                t.tags?.some(tag => tag.toLowerCase().includes(s))
            );
        }

        // 2. Filter by Active Tags (Cumulative)
        if (activeTags.length > 0) {
            pool = pool.filter(t => 
                activeTags.every(tag => t.tags?.includes(tag))
            );
        }

        return pool;
    }, [customTracks, search, activeTags]);

    const queuedIds = useMemo(() => new Set(pQueue.map((track) => track.id)), [pQueue]);
    const repertoireIds = useMemo(() => new Set(repertoire.map((track) => track.id)), [repertoire]);

    const rowVirtualizer = useVirtualizer({
        count: sortedTracks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56, // Compact height
        overscan: 20,
    });

    const handleImportClick = () => {
        fileInputRef.current?.click();
        setImportOpen(true);
    };

    const handleQueueTrack = (track: Track) => {
        const currentQueue = usePlayerStore.getState().pQueue;
        const exists = currentQueue.find(t => t.id === track.id);

        if (exists) {
            const nextQueue = currentQueue.filter(t => t.id !== track.id);
            setPQueue(nextQueue);
            setTTarget(nextQueue.reduce((sum, t) => sum + (t.duration_ms / 1000), 0));
            removeFromRepertoire(track.id);
        } else {
            const result = appendTrackToQueueTail(currentQueue, track);
            setPQueue(result.queue);
            setTTarget(result.targetSeconds);
            addToRepertoire(track);
        }
    };

    const handlePlayTrack = (track: Track) => {
        const result = buildPlayerLaunchQueue(track);
        stopPreview();
        setCurrentSetMetadata(null);
        setPQueue(result.queue);
        setCi(0);
        setPos(0);
        setElapsed(0);
        setTTarget(result.targetSeconds);
        setView("player");
        setPlaying(true);
    };

    const handleRemoveFromPlayer = (track: Track) => {
        if (!confirm(`¿Quitar "${track.title}" del reproductor?`)) return;

        const nextQueue = usePlayerStore.getState().pQueue.filter((queuedTrack) => queuedTrack.id !== track.id);
        setPQueue(nextQueue);
        setTTarget(nextQueue.reduce((sum, queuedTrack) => sum + queuedTrack.duration_ms / 1000, 0));
        removeFromRepertoire(track.id);

        if (track.isCustom) {
            removeCustomTrack(track.id);
        }

        stopPreview();
    };

    const handleVerifyCloud = async (track: Track) => {
        setCloudStatus((prev) => ({ ...prev, [track.id]: "Verificando disponibilidad..." }));
        const status = await checkCloudTrackAvailability(track);
        setCloudStatus((prev) => ({ ...prev, [track.id]: status }));
    };

    const handleMassDelete = async () => {
        if (selectedTrackIds.length === 0) return;
        if (confirm(`¿Eliminar ${selectedTrackIds.length} temas seleccionados?`)) {
            for (const id of selectedTrackIds) {
                removeCustomTrack(id);
            }
            clearSelection();
        }
    };

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#0A0E14",
                fontFamily: "'DM Sans', sans-serif",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_AUDIO_FILE_ACCEPT}
                multiple
                style={{ display: "none" }}
                onChange={() => setImportOpen(true)}
            />

            <LibraryHeader 
                onImport={handleImportClick}
                onClear={clearCustomTracks}
                search={search}
                onSearchChange={setSearch}
                selectionCount={selectedTrackIds.length}
                onClearSelection={clearSelection}
                onMassDelete={handleMassDelete}
            />

            <FilterBar 
                availableTags={useLibraryStore.getState().availableTags}
                activeTags={activeTags}
                onToggleTag={toggleTagFilter}
                onClear={clearFilters}
            />

            {importOpen ? (
                <div
                    style={{
                        backgroundColor: "#121820",
                        borderRadius: isMobile ? 18 : 20,
                        border: `1px solid ${THEME.colors.brand.cyan}30`,
                        overflow: "hidden",
                        backdropFilter: "blur(20px)",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        margin: isMobile ? "0 12px 12px" : "0 32px 32px",
                    }}
                >
                    <ImportZone externalFiles={fileInputRef.current?.files} onClose={() => setImportOpen(false)} />
                </div>
            ) : (
                <div
                    style={{
                        flex: 1,
                        backgroundColor: "#0D1117",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden", 
                        width: "100%",
                    }}
                >
                    <div
                        ref={parentRef}
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            overflowX: "hidden",
                            padding: "8px 0",
                            position: "relative",
                            scrollbarWidth: "none",
                        }}
                    >
                        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                        {sortedTracks.length === 0 ? (
                            <div
                                onClick={handleImportClick}
                                style={{
                                    padding: "100px 40px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ fontSize: 50, marginBottom: 20 }}>💿</div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: "0 0 10px" }}>
                                    {search || activeTags.length > 0 ? "No se encontraron temas" : "Tu biblioteca está lista"}
                                </h2>
                                <p style={{ color: THEME.colors.text.muted, fontSize: 16 }}>
                                    {search || activeTags.length > 0 ? "Probá quitando algunos filtros." : "Tocá acá para cargar tus archivos."}
                                </p>
                            </div>
                        ) : (
                            <div
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: "100%",
                                    position: "relative",
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                    const track = sortedTracks[virtualItem.index];

                                    return (
                                        <TrackRowV2
                                            key={track.id}
                                            track={track}
                                            isInQueue={queuedIds.has(track.id)}
                                            isInRepertoire={repertoireIds.has(track.id)}
                                            isSelected={selectedTrackIds.includes(track.id)}
                                            selectionMode={selectedTrackIds.length > 0}
                                            onQueue={handleQueueTrack}
                                            onPlay={handlePlayTrack}
                                            onSelect={(t) => toggleSelection(t.id)}
                                            onOpenTrackProfile={setProfileTrack}
                                            onRemoveFromPlayer={handleRemoveFromPlayer}
                                            onVerifyCloud={handleVerifyCloud}
                                            cloudStatus={cloudStatus[track.id]}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: `${virtualItem.size}px`,
                                                transform: `translateY(${virtualItem.start}px)`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {profileTrack && (
                <TrackProfileModal
                    track={profileTrack}
                    onSave={(updates) => {
                        updateTrackMetadata(profileTrack.id, updates);
                        if (typeof updates.startTime === "number" || typeof updates.endTime === "number") {
                            setTrackTrim(
                                profileTrack.id,
                                updates.startTime ?? profileTrack.startTime ?? 0,
                                updates.endTime ?? profileTrack.endTime ?? profileTrack.duration_ms
                            );
                        }
                        setProfileTrack(null);
                    }}
                    onCancel={() => setProfileTrack(null)}
                />
            )}
        </div>
    );
};
