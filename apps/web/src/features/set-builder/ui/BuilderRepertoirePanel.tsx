import React, { useState, useMemo } from "react";
import { ImportZone } from "../../../components/common/ImportZone";
import { TrackRow } from "../../../components/common/TrackRow";
import { MOODS, TRACKS } from "@suniplayer/core";
import { THEME } from "../../../data/theme";
import { mc } from "@suniplayer/core";
import type { Track } from "@suniplayer/core";
import { useProjectStore } from "../../../store/useProjectStore";

interface BuilderRepertoirePanelProps {
    filteredTracks: Track[];
    customTracks: Track[];
    isPlaying: boolean;
    importOpen: boolean;
    search: string;
    selectedMood: string | null;
    onToggleImport: () => void;
    onSearchChange: (value: string) => void;
    onMoodChange: (mood: string | null) => void;
    onAddTrack: (track: Track) => void;
    onAppendToQueue: (track: Track) => void;
    onEditTrack: (track: Track) => void;
    onRemoveCustomTrack: (trackId: string) => void;
}

export const BuilderRepertoirePanel: React.FC<BuilderRepertoirePanelProps> = ({
    isPlaying, importOpen, search, selectedMood, onToggleImport, onSearchChange, onMoodChange, onAddTrack, onAppendToQueue, onEditTrack, onRemoveCustomTrack
}) => {
    const { 
        customTracks = [], 
        repertoire = [], 
        addToRepertoire, 
        removeFromRepertoire, 
        addMultipleToRepertoire 
    } = useProjectStore();

    const [tab, setTab] = useState<"all" | "local" | "cloud">("all");

    // Unified Library Catalog
    const fullCatalog = useMemo(() => {
        const all = [...TRACKS, ...(customTracks || []).filter(ct => !TRACKS.some(t => t.id === ct.id))];
        return all.filter(t => {
            const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase());
            const matchesMood = !selectedMood || t.mood === selectedMood;
            const matchesTab = tab === "all" || (tab === "local" && t.isCustom) || (tab === "cloud" && !t.isCustom);
            return matchesSearch && matchesMood && matchesTab;
        }).sort((a, b) => a.title.localeCompare(b.title));
    }, [customTracks, search, selectedMood, tab]);

    const repertoireIds = useMemo(() => new Set((repertoire || []).map(t => t.id)), [repertoire]);

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
            {/* ── HEADER ── */}
            <div style={{ padding: "12px", borderBottom: `1px solid ${THEME.colors.border}20` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: THEME.colors.brand.cyan, letterSpacing: 1 }}>LIBRARY CATALOG</span>
                    <button onClick={onToggleImport} style={{ padding: "4px 8px", borderRadius: 4, background: importOpen ? THEME.colors.brand.violet : "rgba(255,255,255,0.05)", border: "none", color: "white", fontSize: 9, fontWeight: 800 }}>
                        {importOpen ? "CLOSE" : "IMPORT"}
                    </button>
                </div>

                {importOpen && <div style={{ marginBottom: 12 }}><ImportZone onClose={onToggleImport} /></div>}

                <input 
                    type="text" placeholder="Search catalog..." value={search} onChange={e => onSearchChange(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 12, marginBottom: 8 }}
                />

                <div style={{ display: "flex", gap: 4 }}>
                    {(["all", "local", "cloud"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "4px", borderRadius: 4, border: "none", background: tab === t ? "rgba(255,255,255,0.1)" : "transparent", color: tab === t ? "white" : "#666", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── LIST ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px" }} className="no-scrollbar">
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#555" }}>{fullCatalog.length} TRACKS FOUND</span>
                    <button 
                        onClick={() => addMultipleToRepertoire(customTracks)}
                        style={{ background: "none", border: "none", color: THEME.colors.brand.cyan, fontSize: 9, fontWeight: 800, cursor: "pointer" }}
                    >
                        ADD ALL LOCAL TO BUILDER
                    </button>
                </div>

                {fullCatalog.map((track) => {
                    const isInRepertoire = repertoireIds.has(track.id);
                    return (
                        <div key={track.id} style={{ 
                            display: "flex", alignItems: "center", height: 40, padding: "0 8px", borderRadius: 4,
                            background: isInRepertoire ? "rgba(6,182,212,0.05)" : "transparent",
                            borderBottom: "1px solid rgba(255,255,255,0.02)"
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: isInRepertoire ? THEME.colors.brand.cyan : "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
                                <div style={{ fontSize: 9, color: "#555" }}>{track.artist} • {track.bpm || "--"} BPM</div>
                            </div>
                            
                            <div style={{ display: "flex", gap: 4 }}>
                                <button 
                                    onClick={() => isInRepertoire ? removeFromRepertoire(track.id) : addToRepertoire(track)}
                                    title={isInRepertoire ? "Quitar de la lógica de generación" : "Añadir a la lógica de generación"}
                                    style={{ background: isInRepertoire ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)", border: "none", borderRadius: 4, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                >
                                    {isInRepertoire ? "✓" : "+"}
                                </button>
                                <button onClick={() => onAddTrack(track)} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 4, width: 24, height: 24, fontSize: 10 }}>⚡</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
