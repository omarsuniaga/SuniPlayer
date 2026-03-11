import React, { useState } from "react";
import { useLibraryStore } from "../store/useLibraryStore";
import { THEME } from "../data/theme.ts";
import { ImportZone } from "../components/common/ImportZone";
import { TrackRow } from "../components/common/TrackRow";
import { useProjectStore } from "../store/useProjectStore";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { Track } from "../types";

export const Library: React.FC = () => {
    const { customTracks, selectedFolderName, clearCustomTracks } = useLibraryStore();
    const [importOpen, setImportOpen] = useState(customTracks.length === 0);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const { appendToQueue, updateTrackMetadata, setTrackTrim } = useProjectStore();

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Archivos Reconocidos ({customTracks.length})</h2>
                    {customTracks.some(t => !t.blob_url) && (
                        <span style={{ fontSize: 12, color: THEME.colors.status.warning, fontWeight: 600 }}>
                            ⚠️ Algunos archivos necesitan re-conexión
                        </span>
                    )}
                </div>

                {customTracks.length === 0 ? (
                    <div style={{ 
                        padding: "80px 20px", 
                        textAlign: "center", 
                        backgroundColor: "rgba(255,255,255,0.02)", 
                        borderRadius: THEME.radius.xl,
                        border: `1px dashed ${THEME.colors.border}`
                    }}>
                        <div style={{ 
                            width: 64, height: 64, borderRadius: "50%", 
                            backgroundColor: "rgba(255,255,255,0.03)", 
                            margin: "0 auto 20px",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.text.muted} strokeWidth="1.5">
                                <path d="M9 18V5l12-2v13M9 10L21 8M6 15a3 3 0 100 6 3 3 0 000-6zm12-2a3 3 0 100 6 3 3 0 000-6z" />
                            </svg>
                        </div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Tu biblioteca está vacía</h3>
                        <p style={{ color: THEME.colors.text.muted, fontSize: 14, maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>
                            Escoge una carpeta de tu dispositivo para que SuniPlayer reconozca tus canciones automáticamente.
                        </p>
                        <button
                            onClick={() => setImportOpen(true)}
                            style={{
                                padding: "12px 24px",
                                borderRadius: THEME.radius.md,
                                border: `1px solid ${THEME.colors.brand.cyan}`,
                                background: `${THEME.colors.brand.cyan}10`,
                                color: THEME.colors.brand.cyan,
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 700,
                            }}
                        >
                            Seleccionar Carpeta del Dispositivo
                        </button>
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
                                transition: "transform 0.2s, border-color 0.2s",
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
