import React, { useMemo, useRef, useState } from "react";
import { TRACKS, type Track } from "@suniplayer/core";
import { useVirtualizer } from "@tanstack/react-virtual";

import { ImportZone } from "../components/common/ImportZone";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { THEME } from "../data/theme";
import { useProjectStore, updateTrackMetadata } from "../store/useProjectStore";
import { useIsMobile } from "../utils/useMediaQuery";

export const Library: React.FC = () => {
    const isMobile = useIsMobile();
    const { 
        customTracks, repertoire, addToRepertoire, removeFromRepertoire, 
        selectedTrackIds, toggleSelection, clearSelection, removeCustomTrack
    } = useProjectStore();

    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"all" | "local" | "cloud">("all");
    const [importOpen, setImportOpen] = useState(false);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const fullCatalog = useMemo(() => {
        const all = [...TRACKS, ...customTracks.filter(ct => !TRACKS.some(t => t.id === ct.id))];
        return all.filter(t => {
            const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase());
            const matchesTab = tab === "all" || (tab === "local" && t.isCustom) || (tab === "cloud" && !t.isCustom);
            return matchesSearch && matchesTab;
        }).sort((a, b) => a.title.localeCompare(b.title));
    }, [customTracks, search, tab]);

    const isSelectionMode = selectedTrackIds.length > 0;
    const isAllSelected = fullCatalog.length > 0 && selectedTrackIds.length === fullCatalog.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            clearSelection();
        } else {
            fullCatalog.forEach(t => {
                if (!selectedTrackIds.includes(t.id)) toggleSelection(t.id);
            });
        }
    };

    const handleBatchDelete = () => {
        if (!confirm(`¿Eliminar ${selectedTrackIds.length} temas de la biblioteca?`)) return;
        selectedTrackIds.forEach(id => removeCustomTrack(id));
        clearSelection();
    };

    const handleBatchAddToRepertoire = () => {
        const tracksToAdd = fullCatalog.filter(t => selectedTrackIds.includes(t.id));
        tracksToAdd.forEach(t => addToRepertoire(t));
        clearSelection();
        alert(`${tracksToAdd.length} temas habilitados para el Generador.`);
    };

    return (
        <div style={{ 
            height: "100dvh", display: "flex", flexDirection: "column", 
            backgroundColor: "#050508", color: "white", overflow: "hidden", position: "fixed", inset: 0
        }}>
            <style>{`
                .lib-row { height: 40px; }
                @media (max-width: 640px) {
                    .lib-row { height: 54px !important; padding: 4px 8px !important; }
                    .track-info-container { flex-direction: column !important; align-items: flex-start !important; gap: 2px !important; }
                    .track-data-tech { position: absolute; right: 80px; bottom: 6px; gap: 8px !important; }
                    .track-actions-container { position: absolute; right: 4px; bottom: 4px; }
                    .track-actions-container button { width: 36px !important; height: 36px !important; font-size: 14px !important; }
                }
            `}</style>

            {/* ── HELP MODAL ── */}
            {showHelp && (
                <div onClick={() => setShowHelp(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 400, background: "#111", border: `1px solid ${THEME.colors.brand.cyan}40`, borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.colors.brand.cyan, marginTop: 0, textTransform: "uppercase", letterSpacing: 1 }}>Guía de la Biblioteca</h2>
                        <div style={{ fontSize: 13, color: "#ccc", display: "flex", flexDirection: "column", gap: 20, lineHeight: "1.5" }}>
                            <div>
                                <strong style={{ color: "white", fontSize: 14 }}>🧠 El Cerebro (Repertorio):</strong> 
                                <p style={{ margin: "4px 0 0" }}>Indica que la canción está <strong>Habilitada</strong>. Solo los temas con el cerebro encendido serán usados por el Generador para crear tus sets.</p>
                            </div>
                            <div>
                                <strong style={{ color: "white", fontSize: 14 }}>✓ Multiselección:</strong> 
                                <p style={{ margin: "4px 0 0" }}>Marca temas con los cuadros de la izquierda. Aparecerá una barra arriba para borrarlos o habilitarlos masivamente.</p>
                            </div>
                            <div style={{ padding: "12px", background: "rgba(6,182,212,0.05)", borderRadius: 8, borderLeft: `3px solid ${THEME.colors.brand.cyan}` }}>
                                <strong style={{ color: THEME.colors.brand.cyan, fontSize: 12, textTransform: "uppercase" }}>💡 Ejemplo:</strong>
                                <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: 12 }}>
                                    "Busco temas de Jazz, uso el <strong>Selector Maestro</strong> (arriba) para marcarlos todos, y toco el <strong>Cerebro</strong>. Ahora el Generador armará el set solo con esos temas."
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowHelp(false)} style={{ width: "100%", marginTop: 28, padding: 14, borderRadius: 8, border: "none", background: THEME.colors.brand.cyan, color: "black", fontWeight: 900, cursor: "pointer" }}>¡ENTENDIDO!</button>
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
            <header style={{ 
                height: 40, display: "flex", alignItems: "center", gap: isMobile ? 4 : 8, padding: "0 8px",
                background: "#111118", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0
            }}>
                <div onClick={handleSelectAll} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, border: `1.5px solid ${isAllSelected ? THEME.colors.brand.cyan : "#666"}`, borderRadius: 2, background: isAllSelected ? THEME.colors.brand.cyan : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isAllSelected && <span style={{ color: "black", fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                </div>
                
                <input 
                    type="text" placeholder={isMobile ? "Buscar..." : "Buscar en catálogo..."} value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 0, height: 26, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "white", outline: "none" }} 
                />

                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {["todos", "local"].map((t) => (
                        <button key={t} onClick={() => setTab(t === "todos" ? "all" : "local")} style={{ padding: isMobile ? "4px 6px" : "4px 8px", background: (t === "todos" && tab === "all") || (t === "local" && tab === "local") ? "rgba(255,255,255,0.1)" : "transparent", border: "none", color: (t === "todos" && tab === "all") || (t === "local" && tab === "local") ? "white" : "#555", fontSize: 8, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>{isMobile && t === "todos" ? "ALL" : t}</button>
                    ))}
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); setImportOpen(!importOpen); }} 
                    style={{ background: THEME.colors.brand.violet, color: "white", border: "none", padding: isMobile ? "4px 6px" : "4px 8px", borderRadius: 4, fontSize: 8, fontWeight: 900, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", minWidth: isMobile ? 32 : "auto" }}
                >
                    {isMobile ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> : "IMPORTAR"}
                </button>

                <button 
                    onClick={() => setShowHelp(true)} 
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 900, width: 28, height: 28, borderRadius: 4, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    ?
                </button>
            </header>

            {/* ── BATCH BAR ── */}
            {isSelectionMode && (
                <div style={{ height: 36, background: THEME.colors.brand.cyan, color: "black", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <button onClick={clearSelection} style={{ background: "rgba(0,0,0,0.1)", border: "none", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, fontWeight: 900 }}>×</button>
                        <span style={{ fontSize: 10, fontWeight: 900, marginLeft: 4 }}>{selectedTrackIds.length} SELECCIONADOS</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, paddingRight: 4 }}>
                        <button onClick={handleBatchAddToRepertoire} style={{ background: "black", color: "white", border: "none", padding: "0 12px", height: 28, borderRadius: 4, fontSize: 9, fontWeight: 900, cursor: "pointer" }}>AÑADIR AL GENERADOR</button>
                        <button onClick={handleBatchDelete} style={{ background: "none", border: "1.5px solid black", color: "black", padding: "0 12px", height: 28, borderRadius: 4, fontSize: 9, fontWeight: 900, cursor: "pointer" }}>BORRAR</button>
                    </div>
                </div>
            )}

            {importOpen && <div style={{ padding: 4, background: "#0a0a0f" }}><ImportZone onClose={() => setImportOpen(false)} /></div>}

            {/* ── MAIN LIST ── */}
            <div style={{ 
                flex: 1, 
                overflowY: "auto", 
                position: "relative",
                WebkitOverflowScrolling: "touch"
            }} className="no-scrollbar">
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    paddingBottom: 120 // Espacio para el mini-player
                }}>
                    {fullCatalog.map((track) => {

                        const isSelected = selectedTrackIds.includes(track.id);
                        const isInRepertoire = repertoire.some(r => r.id === track.id);
                        return (
                            <div key={track.id} className="lib-row" style={{ 
                                display: "flex", alignItems: "center", padding: "0 4px", position: "relative",
                                background: isSelected ? `${THEME.colors.brand.cyan}10` : "transparent",
                                borderBottom: "1px solid rgba(255,255,255,0.02)"
                            }}>
                                <div onClick={() => toggleSelection(track.id)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                    <div style={{ width: 14, height: 14, border: `1px solid ${isSelected ? THEME.colors.brand.cyan : "#444"}`, borderRadius: 2, background: isSelected ? THEME.colors.brand.cyan : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {isSelected && <span style={{ color: "black", fontSize: 10, fontWeight: 900 }}>✓</span>}
                                    </div>
                                </div>

                                <div className="track-info-container" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", overflow: "hidden" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
                                            {track.sourceMissing && (
                                                <span title="Archivo no encontrado en este dispositivo" style={{ color: THEME.colors.status.error, fontSize: 10, cursor: "help" }}>⚠️</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 9, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</div>
                                    </div>
                                    <div className="track-data-tech" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <div style={{ fontFamily: THEME.fonts.mono, fontSize: 9, color: THEME.colors.brand.cyan, fontWeight: 700 }}>{track.bpm || "--"}</div>
                                        <div style={{ fontFamily: THEME.fonts.mono, fontSize: 9, color: THEME.colors.brand.violet, fontWeight: 800 }}>{track.key || "--"}</div>
                                    </div>
                                </div>

                                <div className="track-actions-container" style={{ display: "flex", gap: 2 }}>
                                    <button 
                                        onClick={() => isInRepertoire ? removeFromRepertoire(track.id) : addToRepertoire(track)} 
                                        title={isInRepertoire ? "Quitar del generador" : "Habilitar para el generador"}
                                        style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer", opacity: isInRepertoire ? 1 : 0.2 }}
                                    >
                                        🧠
                                    </button>
                                    <button 
                                        onClick={() => setProfileTrack(track)} 
                                        title="Editar perfil del track"
                                        style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer", opacity: 0.6, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button 
                                        onClick={() => { if(confirm("¿Eliminar tema?")) removeCustomTrack(track.id); }} 
                                        title="Eliminar tema"
                                        style={{ background: "none", border: "none", width: 32, height: 32, cursor: "pointer", color: THEME.colors.status.error, opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── FOOTER FADE ── */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                background: "linear-gradient(to top, #050508 20%, transparent)",
                pointerEvents: "none",
                zIndex: 10
            }} />

            {profileTrack && (
                <TrackProfileModal track={profileTrack} onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }} onCancel={() => setProfileTrack(null)} />
            )}
        </div>
    );
};
