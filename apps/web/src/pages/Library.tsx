import React, { useState, useRef } from "react";
import { useLibraryStore, useProjectStore, Track } from "@suniplayer/core";
import { THEME } from "../data/theme";
import { TRACKS } from "../data/constants";
import { ImportZone } from "../components/common/ImportZone";
import { TrackRow } from "../components/common/TrackRow";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { analyzeTrack } from "../services/audioProbe.ts";
import { usePreviewPlayer } from "../services/usePreviewPlayer.ts";

export const Library: React.FC = () => {
    const { customTracks, repertoire, addToRepertoire, removeFromRepertoire, clearCustomTracks, trackOverrides } = useLibraryStore();
    const [importOpen, setImportOpen] = useState(customTracks.length === 0);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const { updateTrackMetadata } = useProjectStore();
    const { previewTrackId, isPreviewPlaying, togglePreview } = usePreviewPlayer();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
        setImportOpen(true);
    };

    const toggleRepertoire = (track: Track) => {
        const isInRepertoire = repertoire.some(t => t.id === track.id);
        if (isInRepertoire) {
            removeFromRepertoire(track.id);
        } else {
            addToRepertoire(track);
        }
    };

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
        <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            padding: "32px", 
            overflowY: "auto", // 🟢 SCROLL CRÍTICO
            gap: 32, 
            backgroundColor: "#0A0E14",
            fontFamily: "'DM Sans', sans-serif",
            height: "100%" 
        }}>
            <input 
                ref={fileInputRef}
                type="file" 
                accept=".mp3,.wav,.m4a,.aac,.flac,audio/*" 
                multiple 
                style={{ display: "none" }}
                onChange={() => setImportOpen(true)}
            />

            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
                <div>
                    <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0, letterSpacing: "-0.04em", color: "white" }}>Biblioteca Local</h1>
                    <p style={{ fontSize: 16, color: THEME.colors.text.muted, marginTop: 6, fontWeight: 500 }}>Gestioná tu música offline para el escenario</p>
                </div>
                
                <div style={{ display: "flex", gap: 12 }}>
                    {customTracks.length > 0 && (
                        <button
                            onClick={() => confirm("¿VACIAR DISCO? Esta acción borrará físicamente los audios del navegador.") && clearCustomTracks()}
                            style={{ 
                                padding: "12px 20px", borderRadius: 12, border: `1px solid ${THEME.colors.status.error}40`, 
                                color: THEME.colors.status.error, background: "rgba(239, 68, 68, 0.05)", 
                                cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s" 
                            }}
                        >
                            VACIAR DISCO
                        </button>
                    )}
                    <button
                        className="btn-glow"
                        onClick={handleButtonClick}
                        style={{ 
                            padding: "14px 28px", borderRadius: 12, background: THEME.gradients.brand, 
                            color: "white", border: "none", fontWeight: 900, fontSize: 14, 
                            cursor: "pointer", boxShadow: `0 10px 25px ${THEME.colors.brand.cyan}40`, 
                            transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
                        }}
                    >
                        {importOpen ? "+ AGREGAR MÁS" : "IMPORTAR MÚSICA"}
                    </button>
                </div>
            </header>

            {importOpen && (
                <div style={{ 
                    backgroundColor: "#121820", borderRadius: 20, 
                    border: `1px solid ${THEME.colors.brand.cyan}30`, overflow: "hidden", 
                    animation: "slideDown 0.4s ease-out", backdropFilter: "blur(20px)" 
                }}>
                    <ImportZone externalFiles={fileInputRef.current?.files} onClose={() => setImportOpen(false)} />
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))", gap: 20 }}>
                {customTracks.length === 0 && !importOpen && (
                    <div onClick={handleButtonClick} style={{ 
                        gridColumn: "1/-1", padding: "100px 40px", textAlign: "center", 
                        border: `2px dashed ${THEME.colors.border}`, borderRadius: 24, 
                        cursor: "pointer", background: "rgba(255,255,255,0.01)", transition: "all 0.3s" 
                    }}>
                        <div style={{ fontSize: 50, marginBottom: 20 }}>💿</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: "0 0 10px" }}>Tu biblioteca está lista para el show</h2>
                        <p style={{ color: THEME.colors.text.muted, fontSize: 16, maxWidth: "450px", margin: "0 auto", lineHeight: 1.6 }}>Tocá acá para cargar tus archivos <strong>MP3 o WAV</strong>. Se guardarán de forma persistente como en una app nativa.</p>
                    </div>
                )}

                {customTracks.map((track) => {
                    const isSelected = previewTrackId === track.id;
                    const isPlaying = isSelected && isPreviewPlaying;
                    const isInRepertoire = repertoire.some(t => t.id === track.id);
                    
                    return (
                        <div 
                            key={track.id} 
                            className="track-card"
                            style={{ 
                                backgroundColor: isSelected ? "rgba(6, 182, 212, 0.08)" : "#121820", 
                                padding: "20px", borderRadius: 20, display: "flex", flexDirection: "column", gap: 16,
                                border: `1px solid ${isSelected ? THEME.colors.brand.cyan : (isInRepertoire ? `${THEME.colors.brand.cyan}40` : THEME.colors.border)}`,
                                boxShadow: isSelected ? `0 0 40px ${THEME.colors.brand.cyan}20` : "none",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                position: "relative", overflow: "hidden"
                            }}
                        >
                            {/* Repertoire Status Indicator */}
                            {isInRepertoire && (
                                <div style={{ 
                                    position: "absolute", top: 0, right: 0, width: 0, height: 0, 
                                    borderStyle: "solid", borderWidth: "0 40px 40px 0", 
                                    borderColor: `transparent ${THEME.colors.brand.cyan} transparent transparent`,
                                    zIndex: 1
                                }}>
                                    <span style={{ position: "absolute", top: 6, right: -36, color: "black", fontSize: 10, fontWeight: 900 }}>✓</span>
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 2 }}>
                                <button 
                                    onClick={() => togglePreview(track)}
                                    style={{ 
                                        width: 56, height: 56, borderRadius: "50%", border: "none", 
                                        background: isPlaying ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)", 
                                        color: isPlaying ? "black" : THEME.colors.brand.cyan, 
                                        cursor: "pointer", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.2s", boxShadow: isPlaying ? `0 0 25px ${THEME.colors.brand.cyan}50` : "none"
                                    }}
                                >
                                    {isPlaying ? "⏸" : "▶"}
                                </button>
                                
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 19, fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
                                    <div style={{ fontSize: 13, color: THEME.colors.text.muted, marginTop: 2, fontWeight: 600 }}>{track.artist || "Artista Local"}</div>
                                </div>

                                <button 
                                    onClick={() => toggleRepertoire(track)} 
                                    className="repertoire-btn"
                                    style={{ 
                                        width: 48, height: 48, borderRadius: 14, border: "none", 
                                        background: isInRepertoire ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)", 
                                        color: isInRepertoire ? "black" : "white", 
                                        fontSize: 24, fontWeight: 900, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.3s",
                                        boxShadow: isInRepertoire ? `0 5px 15px ${THEME.colors.brand.cyan}30` : "none"
                                    }}
                                >
                                    {isInRepertoire ? "✓" : "+"}
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", zIndex: 2 }}>
                                <div style={badgeStyle(`${THEME.colors.brand.cyan}12`, THEME.colors.brand.cyan)}>
                                    <span style={{ fontSize: 9, opacity: 0.6, marginRight: 4, fontWeight: 600 }}>BPM</span>
                                    {Math.round(track.bpm || 120)}
                                </div>
                                <div style={badgeStyle(`${THEME.colors.brand.violet}12`, THEME.colors.brand.violet)}>
                                    <span style={{ fontSize: 9, opacity: 0.6, marginRight: 4, fontWeight: 600 }}>NRG</span>
                                    {Math.round((track.energy || 0.5) * 100)}%
                                </div>
                                <div style={badgeStyle("rgba(255,255,255,0.04)", THEME.colors.text.muted)}>
                                    {track.key || "C"}
                                </div>
                                <div style={{ flex: 1 }} />
                                <button 
                                    onClick={() => setProfileTrack(track)}
                                    style={{ background: "none", border: "none", color: THEME.colors.text.muted, fontSize: 12, fontWeight: 800, cursor: "pointer", textDecoration: "underline", opacity: 0.7 }}
                                >
                                    EDITAR
                                </button>
                            </div>

                            {isSelected && (
                                <div style={{ position: "absolute", bottom: 0, left: 0, height: 4, background: THEME.colors.brand.cyan, width: isPlaying ? "100%" : "0%", transition: "width 0.3s linear" }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {profileTrack && <TrackProfileModal track={profileTrack} onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }} onCancel={() => setProfileTrack(null)} />}

            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                
                .track-card:hover {
                    transform: scale(1.01) translateY(-4px);
                    background-color: #161d27 !important;
                    box-shadow: 0 15px 45px rgba(0,0,0,0.4);
                }

                .repertoire-btn:hover {
                    transform: scale(1.1);
                }

                .btn-glow:hover {
                    filter: brightness(1.2);
                    box-shadow: 0 0 30px ${THEME.colors.brand.cyan}60 !important;
                }

                @media (max-width: 640px) {
                    h1 { font-size: 28px !important; }
                    p.page-subtitle { font-size: 14px !important; }
                    .main-import-btn { padding: 10px 16px !important; font-size: 12px !important; }
                    .track-card { padding: 14px !important; gap: 12px !important; }
                }
            `}</style>
        </div>
    );
};

const badgeStyle = (bg: string, col: string): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: "10px",
    backgroundColor: bg,
    color: col,
    fontSize: "13px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "-0.02em"
});
