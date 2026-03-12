import React, { useState } from "react";
import { useLibraryStore } from "../store/useLibraryStore";
import { THEME } from "../data/theme.ts";
import { ImportZone } from "../components/common/ImportZone";
import { TrackRow } from "../components/common/TrackRow";
import { useProjectStore } from "../store/useProjectStore";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { Track } from "../types";
import { TRACKS } from "../data/constants.ts";
import { analyzeTrack } from "../services/audioProbe.ts";

export const Library: React.FC = () => {
    const { customTracks, selectedFolderName, clearCustomTracks, trackOverrides } = useLibraryStore();
    const [importOpen, setImportOpen] = useState(customTracks.length === 0);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const { appendToQueue, updateTrackMetadata, setTrackTrim } = useProjectStore();

    // Auto-probe catalog tracks on mount
    React.useEffect(() => {
        TRACKS.forEach(t => {
            const url = `/audio/${encodeURIComponent(t.file_path)}`;
            analyzeTrack(url).then(analysis => {
                if (analysis) {
                    // Update overrides in library store to show waveform/BPM in UI
                    useLibraryStore.getState().updateTrack(t.id, {
                        ...analysis,
                        analysis_cached: true
                    });
                }
            });
        });
    }, []);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px", overflowY: "auto", gap: 24 }}>
            {/* Header */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Tu Biblioteca Local</h1>
                    <p style={{ fontSize: 16, color: THEME.colors.text.muted, margin: "4px 0 0" }}>
                        {selectedFolderName ? `Sincronizada con: ${selectedFolderName}` : "No has seleccionado una carpeta todavía"}
                    </p>
                </div>
                
                <div style={{ display: "flex", gap: 12 }}>
                    {customTracks.length > 0 && (
                        <button
                            onClick={clearCustomTracks}
                            title="Borrar todas las canciones importadas manualmente"
                            style={{
                                padding: "10px 16px",
                                borderRadius: THEME.radius.md,
                                border: `1px solid ${THEME.colors.status.error}40`,
                                backgroundColor: "transparent",
                                color: THEME.colors.status.error,
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            Limpiar Biblioteca
                        </button>
                    )}
                    <button
                        onClick={() => setImportOpen(!importOpen)}
                        title={importOpen ? "Ocultar panel de importación" : "Abrir panel para añadir archivos locales o carpetas"}
                        style={{
                            padding: "10px 20px",
                            borderRadius: THEME.radius.md,
                            border: "none",
                            background: THEME.gradients.brand,
                            color: "white",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                            boxShadow: `0 8px 24px ${THEME.colors.brand.cyan}30`,
                        }}
                    >
                        {importOpen ? "Cerrar Importador" : "Agregar Música"}
                    </button>
                </div>
            </header>

            {/* Import Area */}
            {importOpen && (
                <div style={{ 
                    backgroundColor: THEME.colors.surface, 
                    borderRadius: THEME.radius.xl, 
                    border: `1px solid ${THEME.colors.brand.violet}30`,
                    overflow: "hidden",
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    <ImportZone onClose={() => setImportOpen(false)} />
                </div>
            )}

            {/* Tracks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Catalog Tracks (public/audio) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px", marginTop: 12 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Catálogo Local (public/audio)</h2>
                    <span style={{ fontSize: 12, color: THEME.colors.text.muted, fontFamily: THEME.fonts.mono }}>
                        {TRACKS.length} pistas
                    </span>
                </div>

                {TRACKS.length > 0 ? (
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                        gap: 12 
                    }}>
                        {TRACKS.map((rawTrack) => {
                            // Apply overrides from store (BPM, Key, Waveform, etc.)
                            const override = trackOverrides[rawTrack.id] || {};
                            const track = { ...rawTrack, ...override };
                            
                            // Use a unique key for the div to avoid React warnings during ID migrations
                            const reactKey = `lib-row-${track.id}`;
                            
                            return (
                                <div key={reactKey} style={{ 
                                    backgroundColor: THEME.colors.panel, 
                                    borderRadius: THEME.radius.lg,
                                    border: `1px solid ${THEME.colors.border}`,
                                    padding: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = THEME.colors.brand.cyan + "50";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = THEME.colors.border;
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <TrackRow 
                                            track={track} 
                                            small 
                                            idx={0} 
                                            onEdit={() => setProfileTrack(track)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => appendToQueue([track])}
                                        title="Añadir a la cola del reproductor (flecha morada: no interrumpe lo que suena)"
                                        style={{
                                            width: 36, height: 36,
                                            borderRadius: THEME.radius.md,
                                            border: "none",
                                            backgroundColor: `${THEME.colors.brand.violet}15`,
                                            color: THEME.colors.brand.violet,
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 5v14M5 12l7 7 7-7" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: 20, textAlign: "center", color: THEME.colors.text.muted, fontSize: 14 }}>
                        No se encontraron canciones en public/audio.
                    </div>
                )}

                {/* Custom Tracks Separator */}
                <div style={{ height: 1, backgroundColor: THEME.colors.border, margin: "12px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Archivos Importados ({customTracks.length})</h2>
                    {customTracks.some(t => !t.blob_url) && (
                        <span style={{ fontSize: 12, color: THEME.colors.status.warning, fontWeight: 600 }}>
                            ⚠️ Necesitan re-conexión
                        </span>
                    )}
                </div>

                {customTracks.length === 0 ? (
                    <div style={{ 
                        padding: "40px 20px", 
                        textAlign: "center", 
                        backgroundColor: "rgba(255,255,255,0.01)", 
                        borderRadius: THEME.radius.xl,
                        border: `1px dashed ${THEME.colors.border}`
                    }}>
                        <p style={{ color: THEME.colors.text.muted, fontSize: 13, margin: 0 }}>
                            No hay archivos importados manualmente.
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                        gap: 12 
                    }}>
                        {customTracks.map((track) => (
                            <div key={track.id} style={{ 
                                backgroundColor: THEME.colors.panel, 
                                borderRadius: THEME.radius.lg,
                                border: `1px solid ${THEME.colors.border}`,
                                padding: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = THEME.colors.brand.violet + "50";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = THEME.colors.border;
                                e.currentTarget.style.transform = "translateY(0)";
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <TrackRow 
                                        track={track} 
                                        small 
                                        idx={0} 
                                        onTrim={() => setTrimmingTrack(track)}
                                        onEdit={() => setProfileTrack(track)}
                                    />
                                </div>
                                <button
                                    onClick={() => appendToQueue([track])}
                                    title="Añadir a la cola del reproductor (flecha morada: no interrumpe lo que suena)"
                                    style={{
                                        width: 36, height: 36,
                                        borderRadius: THEME.radius.md,
                                        border: "none",
                                        backgroundColor: `${THEME.colors.brand.cyan}15`,
                                        color: THEME.colors.brand.cyan,
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 5v14M5 12l7 7 7-7" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {trimmingTrack && (
                <TrackTrimmer 
                    track={trimmingTrack}
                    onSave={(start, end) => {
                        setTrackTrim(trimmingTrack.id, start, end);
                        setTrimmingTrack(null);
                    }}
                    onCancel={() => setTrimmingTrack(null)}
                />
            )}

            {profileTrack && (
                <TrackProfileModal
                    track={profileTrack}
                    onSave={(updates) => {
                        updateTrackMetadata(profileTrack.id, updates);
                        setProfileTrack(null);
                    }}
                    onCancel={() => setProfileTrack(null)}
                />
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
