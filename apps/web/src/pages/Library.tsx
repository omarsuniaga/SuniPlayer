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
    const { customTracks, clearCustomTracks, trackOverrides } = useLibraryStore();
    const [importOpen, setImportOpen] = useState(customTracks.length === 0);
    const [showCatalog, setShowCatalog] = useState(customTracks.length === 0);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const { appendToQueue, updateTrackMetadata, setTrackTrim } = useProjectStore();

    // Auto-probe catalog tracks on mount
    React.useEffect(() => {
        TRACKS.forEach(t => {
            const url = `/audio/${encodeURIComponent(t.file_path)}`;
            analyzeTrack(url).then(analysis => {
                if (analysis) {
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
                    <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Tu Música Local</h1>
                    <p style={{ fontSize: 16, color: THEME.colors.text.muted, margin: "4px 0 0" }}>
                        Archivos guardados permanentemente en este dispositivo
                    </p>
                </div>
                
                <div style={{ display: "flex", gap: 12 }}>
                    {customTracks.length > 0 && (
                        <button
                            onClick={clearCustomTracks}
                            style={{
                                padding: "10px 16px", borderRadius: THEME.radius.md,
                                border: `1px solid ${THEME.colors.status.error}40`,
                                backgroundColor: "transparent", color: THEME.colors.status.error,
                                cursor: "pointer", fontSize: 13, fontWeight: 600,
                            }}
                        >
                            Limpiar Todo
                        </button>
                    )}
                    <button
                        onClick={() => setImportOpen(!importOpen)}
                        style={{
                            padding: "10px 24px", borderRadius: THEME.radius.md,
                            border: "none", background: THEME.gradients.brand,
                            color: "white", cursor: "pointer", fontSize: 14, fontWeight: 800,
                            boxShadow: `0 8px 24px ${THEME.colors.brand.cyan}40`,
                        }}
                    >
                        {importOpen ? "Cerrar" : "+ IMPORTAR MÚSICA"}
                    </button>
                </div>
            </header>

            {/* Import Area */}
            {importOpen && (
                <div style={{ 
                    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.xl, 
                    border: `2px solid ${THEME.colors.brand.cyan}30`, overflow: "hidden",
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    <ImportZone onClose={() => setImportOpen(false)} />
                </div>
            )}

            {/* 1. SECCIÓN: TUS ARCHIVOS (Prioridad) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: THEME.colors.brand.cyan }}>BIBLIOTECA PERSONAL ({customTracks.length})</h2>
                </div>

                {customTracks.length === 0 ? (
                    <div 
                        onClick={() => setImportOpen(true)}
                        style={{ 
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "80px 40px",
                            textAlign: "center", 
                            backgroundColor: "rgba(255,255,255,0.01)", 
                            borderRadius: THEME.radius.xl,
                            border: `2px dashed ${THEME.colors.border}`, 
                            cursor: "pointer",
                            gap: 20,
                            animation: "fadeIn 0.6s ease-out"
                        }}
                    >
                        <div style={{
                            width: 80, height: 80, borderRadius: "50%",
                            backgroundColor: `${THEME.colors.brand.cyan}10`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: THEME.colors.brand.cyan,
                            marginBottom: 8
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13M6 15a3 3 0 1 0 0 6 3 3 0 000-6zm12-2a3 3 0 1 0 0 6 3 3 0 000-6z" /></svg>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "white" }}>Tu biblioteca está lista</h3>
                            <p style={{ color: THEME.colors.text.muted, fontSize: 15, margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
                                Importa tus archivos <strong>MP3 o WAV</strong> desde tu iPad para empezar a crear sets inteligentes.
                            </p>
                        </div>
                        <button
                            style={{
                                marginTop: 12, padding: "12px 32px", borderRadius: THEME.radius.full,
                                border: "none", background: THEME.colors.brand.cyan,
                                color: "black", fontSize: 14, fontWeight: 900,
                                boxShadow: `0 10px 30px ${THEME.colors.brand.cyan}40`,
                            }}
                        >
                            COMENZAR IMPORTACIÓN
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                        {customTracks.map((track: Track) => (
                            <div key={track.id} style={{ 
                                backgroundColor: THEME.colors.panel, borderRadius: THEME.radius.lg,
                                border: `1px solid ${THEME.colors.border}`, padding: 14,
                                display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s",
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <TrackRow track={track} small idx={0} onTrim={() => setTrimmingTrack(track)} onEdit={() => setProfileTrack(track)} />
                                </div>
                                <button
                                    onClick={() => appendToQueue([track])}
                                    style={{
                                        width: 40, height: 40, borderRadius: THEME.radius.md,
                                        border: "none", backgroundColor: `${THEME.colors.brand.cyan}15`,
                                        color: THEME.colors.brand.cyan, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. SECCIÓN: CATÁLOGO DEMO (Secundario) */}
            <div style={{ marginTop: 20 }}>
                <button 
                    onClick={() => setShowCatalog(!showCatalog)}
                    style={{ background: "none", border: "none", color: THEME.colors.text.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                >
                    {showCatalog ? "Ocultar catálogo demo" : "Ver canciones demo de SuniPlayer"}
                </button>

                {showCatalog && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                            {TRACKS.map((rawTrack) => {
                                const override = trackOverrides[rawTrack.id] || {};
                                const track = { ...rawTrack, ...override };
                                return (
                                    <div key={track.id} style={{ 
                                        backgroundColor: "rgba(255,255,255,0.02)", borderRadius: THEME.radius.lg,
                                        border: `1px solid ${THEME.colors.border}`, padding: 12,
                                        display: "flex", alignItems: "center", gap: 12, opacity: 0.7
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <TrackRow track={track} small idx={0} onEdit={() => setProfileTrack(track)} />
                                        </div>
                                        <button
                                            onClick={() => appendToQueue([track])}
                                            style={{
                                                width: 36, height: 36, borderRadius: THEME.radius.md,
                                                border: "none", backgroundColor: "rgba(255,255,255,0.05)",
                                                color: THEME.colors.text.muted, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {trimmingTrack && <TrackTrimmer track={trimmingTrack} onSave={(s, e) => { setTrackTrim(trimmingTrack.id, s, e); setTrimmingTrack(null); }} onCancel={() => setTrimmingTrack(null)} />}
            {profileTrack && <TrackProfileModal track={profileTrack} onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }} onCancel={() => setProfileTrack(null)} />}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};
