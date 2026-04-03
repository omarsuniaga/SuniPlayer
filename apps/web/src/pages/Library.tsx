import React, { useMemo, useRef, useState } from "react";
import { TRACKS, type Track } from "@suniplayer/core";
import { useVirtualizer } from "@tanstack/react-virtual";

import { ImportZone } from "../components/common/ImportZone";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { LibraryToolbar } from "../components/library/LibraryToolbar";
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

export const Library: React.FC = () => {
    const {
        customTracks,
        repertoire,
        removeCustomTrack,
        clearCustomTracks,
        removeFromRepertoire,
        addToRepertoire,
    } = useLibraryStore();
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

    const sortedTracks = useMemo(() => buildLibraryCatalog(TRACKS as Track[], customTracks), [customTracks]);
    const queuedIds = useMemo(() => new Set(pQueue.map((track) => track.id)), [pQueue]);
    const repertoireIds = useMemo(() => new Set(repertoire.map((track) => track.id)), [repertoire]);

    const rowVirtualizer = useVirtualizer({
        count: sortedTracks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => (isMobile ? 88 : 72),
        overscan: 10,
    });

    const handleImportClick = () => {
        fileInputRef.current?.click();
        setImportOpen(true);
    };

    const handleQueueTrack = (track: Track) => {
        const currentQueue = usePlayerStore.getState().pQueue;
        const exists = currentQueue.find(t => t.id === track.id);

        if (exists) {
            // TOGGLE: Si ya existe, lo removemos
            const nextQueue = currentQueue.filter(t => t.id !== track.id);
            setPQueue(nextQueue);
            setTTarget(nextQueue.reduce((sum, t) => sum + (t.duration_ms / 1000), 0));
            removeFromRepertoire(track.id);
        } else {
            // TOGGLE: Si no existe, lo agregamos
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

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: isMobile ? "24px 0 0" : "24px 0 0", // Padding lateral removido para tocar bordes
                backgroundColor: "#0A0E14",
                fontFamily: "'DM Sans', sans-serif",
                height: "100%",
                overflow: "hidden",
                gap: isMobile ? 8 : 12,
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

            <header style={{ marginBottom: isMobile ? 0 : 16, padding: isMobile ? "0 12px" : "0 32px" }}>
                <h1
                    style={{
                        fontSize: isMobile ? 18 : 40,
                        fontWeight: 900,
                        margin: 0,
                        letterSpacing: isMobile ? "-0.03em" : "-0.04em",
                        color: "white",
                        lineHeight: 1.05,
                    }}
                >
                    Biblioteca Local
                </h1>
                <span
                    style={{
                        fontSize: isMobile ? 12 : 16,
                        color: THEME.colors.text.muted,
                        margin: isMobile ? "4px 0 0" : "6px 0 0",
                        fontWeight: 500,
                        lineHeight: 1.35,
                        maxWidth: isMobile ? "100%" : 520,
                    }}
                >
                    Gestiona tu música local y en la nube desde un catálogo único.
                </span>
            </header>
            <div style={{ padding: isMobile ? "0 12px" : "0 32px" }}>
                <LibraryToolbar
                    onImport={handleImportClick}
                    onClear={clearCustomTracks}
                    showAccept={false}
                    hasTracks={customTracks.length > 0}
                />
            </div>

            {importOpen ? (
                <div
                    style={{
                        backgroundColor: "#121820",
                        borderRadius: isMobile ? 18 : 20,
                        border: `1px solid ${THEME.colors.brand.cyan}30`,
                        overflow: "hidden",
                        marginBottom: isMobile ? 6 : 24,
                        backdropFilter: "blur(20px)",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        margin: isMobile ? "0 12px" : "0 32px",
                        minHeight: isMobile ? 0 : 340,
                        width: "calc(100% - (isMobile ? 24px : 64px))",
                    }}
                >
                    <ImportZone externalFiles={fileInputRef.current?.files} onClose={() => setImportOpen(false)} />
                </div>
            ) : (
                <div
                    style={{
                        flex: 1, // Usa todo el espacio disponible
                        backgroundColor: "#0D1117",
                        borderRadius: "24px 24px 0 0", // Solo redondeamos arriba para que pegue abajo
                        borderTop: `1px solid ${THEME.colors.border}`,
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: "none",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden", 
                        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                        width: "100%",
                        margin: "0", // Pegado a los bordes
                        maxHeight: isMobile ? "none" : "calc(100vh - 250px)", // Removido para usar todo el alto
                    }}
                >
                    <div
                        style={{
                            padding: isMobile ? "2px 14px" : "2px 32px",
                            borderBottom: `1px solid ${THEME.colors.border}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "rgba(255,255,255,0.02)",
                            gap: isMobile ? 4 : 16,
                            flexWrap: isMobile ? "wrap" : "nowrap",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 14, minWidth: 0, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                            <h3
                                style={{
                                    fontSize: isMobile ? 12 : 16,
                                    fontWeight: 600,
                                    margin: 0,
                                    color: "white",
                                    textTransform: "uppercase",
                                    letterSpacing: isMobile ? "0.03em" : "0.05em",
                                }}
                            >
                                {sortedTracks.length} Tracks Disponibles
                            </h3>
                            <div
                                style={{
                                    backgroundColor: `${THEME.colors.brand.cyan}16`,
                                    color: THEME.colors.brand.cyan,
                                    padding: isMobile ? "4px 10px" : "2px 12px",
                                    borderRadius: 20,
                                    fontSize: isMobile ? 10 : 11,
                                    fontWeight: 800,
                                }}
                            >
                                Tocá un track para enviarlo al SetList Queue
                            </div>
                        </div>
                    </div>

                    <div
                        ref={parentRef}
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            overflowX: "hidden",
                            padding: "8px 0",
                            position: "relative",
                            scrollbarWidth: "thin",
                            scrollbarColor: `${THEME.colors.border} transparent`,
                        }}
                    >
                        {sortedTracks.length === 0 ? (
                            <div
                                onClick={handleImportClick}
                                style={{
                                    padding: isMobile ? "72px 24px" : "100px 40px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                }}
                            >
                                <div style={{ fontSize: 50, marginBottom: 20 }}>💿</div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: "0 0 10px" }}>
                                    Tu biblioteca está lista para el show
                                </h2>
                                <p
                                    style={{
                                        color: THEME.colors.text.muted,
                                        fontSize: 16,
                                        maxWidth: "450px",
                                        margin: "0 auto",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Tocá acá para cargar tus archivos <strong>MP3 o WAV</strong>.
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
                                            onQueue={handleQueueTrack}
                                            onPlay={handlePlayTrack}
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
