import React, { useState, useRef, useMemo } from "react";
import { useLibraryStore, Track } from "@suniplayer/core";
import { THEME } from "../data/theme";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LibraryToolbar } from "../components/library/LibraryToolbar";
import { TrackRowV2 } from "../components/library/TrackRowV2";
import { ImportZone } from "../components/common/ImportZone";
import { usePreviewStore } from "../store/usePreviewStore";
import { useIsMobile } from "../utils/useMediaQuery";

export const Library: React.FC = () => {
    const {
        customTracks,
        repertoire,
        addMultipleToRepertoire,
        removeCustomTrack,
        clearCustomTracks,
        removeFromRepertoire,
    } = useLibraryStore();

    const { stopPreview } = usePreviewStore();
    const isMobile = useIsMobile();

    const [importOpen, setImportOpen] = useState(customTracks.length === 0);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    const sortedTracks = useMemo(() => {
        return [...customTracks].sort((a, b) => a.title.localeCompare(b.title));
    }, [customTracks]);

    const rowVirtualizer = useVirtualizer({
        count: sortedTracks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 78 : 56,
        overscan: 10,
    });

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
        setImportOpen(true);
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedTrackIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTrackIds(newSet);
    };

    const handleAcceptSelected = () => {
        const selectedTracks = sortedTracks.filter(t => selectedTrackIds.has(t.id));
        if (selectedTracks.length > 0) {
            addMultipleToRepertoire(selectedTracks);
            setSelectedTrackIds(new Set());
        }
    };

    const handleDelete = (track: Track) => {
        if (confirm(`¿Eliminar "${track.title}" de la biblioteca?`)) {
            removeCustomTrack(track.id);
            removeFromRepertoire(track.id);
            stopPreview();
        }
    };

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: isMobile ? "14px 12px 12px" : "32px",
                backgroundColor: "#0A0E14",
                fontFamily: "'DM Sans', sans-serif",
                height: "100%",
                overflow: "hidden",
                gap: isMobile ? 10 : 16,
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.flac,audio/*"
                multiple
                style={{ display: "none" }}
                onChange={() => setImportOpen(true)}
            />

            <header style={{ marginBottom: isMobile ? 4 : 16 }}>
                <h1 style={{ fontSize: isMobile ? 18 : 40, fontWeight: 900, margin: 0, letterSpacing: isMobile ? "-0.03em" : "-0.04em", color: "white", lineHeight: 1.05 }}>
                    Biblioteca Local
                </h1>
                <p style={{ fontSize: isMobile ? 12 : 16, color: THEME.colors.text.muted, margin: isMobile ? "4px 0 0" : "6px 0 0", fontWeight: 500, lineHeight: 1.35, maxWidth: isMobile ? "100%" : 520 }}>
                    Gestioná tu música offline para el escenario
                </p>
            </header>

            <LibraryToolbar
                onImport={handleImportClick}
                onClear={clearCustomTracks}
                onAcceptSelected={handleAcceptSelected}
                showAccept={selectedTrackIds.size > 0}
                hasTracks={customTracks.length > 0}
            />

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
                        minHeight: isMobile ? 0 : 340,
                        width: "100%",
                    }}
                >
                    <ImportZone externalFiles={fileInputRef.current?.files} onClose={() => setImportOpen(false)} />
                </div>
            ) : (
                <div
                    style={{
                        flex: 1,
                        backgroundColor: "#0D1117",
                        borderRadius: 24,
                        border: `1px solid ${THEME.colors.border}`,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                        width: "100%",
                        margin: "0 auto",
                        maxHeight: isMobile ? "none" : "calc(100vh - 250px)",
                    }}
                >
                    <div
                        style={{
                            padding: isMobile ? "12px 14px" : "20px 32px",
                            borderBottom: `1px solid ${THEME.colors.border}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "rgba(255,255,255,0.02)",
                            gap: isMobile ? 8 : 16,
                            flexWrap: isMobile ? "wrap" : "nowrap",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, minWidth: 0, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                            <h2 style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, margin: 0, color: "white", textTransform: "uppercase", letterSpacing: isMobile ? "0.03em" : "0.05em" }}>
                                {sortedTracks.length} Archivos Disponibles
                            </h2>
                            {selectedTrackIds.size > 0 && (
                                <div style={{ backgroundColor: `${THEME.colors.brand.cyan}20`, color: THEME.colors.brand.cyan, padding: isMobile ? "4px 10px" : "4px 12px", borderRadius: isMobile ? 18 : 20, fontSize: isMobile ? 10 : 11, fontWeight: 800 }}>
                                    {selectedTrackIds.size} SELECCIONADOS
                                </div>
                            )}
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
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: "0 0 10px" }}>Tu biblioteca está lista para el show</h2>
                                <p style={{ color: THEME.colors.text.muted, fontSize: 16, maxWidth: "450px", margin: "0 auto", lineHeight: 1.6 }}>
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
                                    const isSelected = selectedTrackIds.has(track.id);
                                    const isInRepertoire = repertoire.some(t => t.id === track.id);

                                    return (
                                        <TrackRowV2
                                            key={track.id}
                                            track={track}
                                            index={virtualItem.index}
                                            isSelected={isSelected}
                                            isInRepertoire={isInRepertoire}
                                            onSelectToggle={toggleSelect}
                                            onDelete={handleDelete}
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
        </div>
    );
};
