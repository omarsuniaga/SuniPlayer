import React, { useMemo, useRef, useState } from "react";
import { BuilderConfigSection } from "../features/set-builder/ui/BuilderConfigSection";
import { BuilderGeneratedSetSection } from "../features/set-builder/ui/BuilderGeneratedSetSection";
import { BuilderRepertoirePanel } from "../features/set-builder/ui/BuilderRepertoirePanel";
import { BuilderSimulationPanel } from "../features/set-builder/ui/BuilderSimulationPanel";
import { useProjectStore, useBuilderStore } from "../store/useProjectStore";
import { THEME } from "../data/theme.ts";
import { TRACKS } from "@suniplayer/core";
import { useLibraryStore } from "../store/useLibraryStore";
import { TrackProfileModal } from "../components/common/TrackProfileModal.tsx";
import { updateTrackMetadata } from "../store/useProjectStore.ts";
import { Track } from "@suniplayer/core";

export const Builder: React.FC = () => {
    const s = useProjectStore();
    const pQueue = useProjectStore(st => st.pQueue);
    const playing = useProjectStore(st => st.playing);
    const tSec = s.targetMin * 60;
    const [repoOpen,   setRepoOpen]   = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const isPlaying = playing && pQueue.length > 0;

    // ── Anchors State ──────────────────────────────────────────────────────────
    const [anchors, setAnchors] = useState<Record<number, Track>>({});
    const toggleAnchor = (index: number, track: Track) => {
        setAnchors(prev => {
            const next = { ...prev };
            if (next[index]) delete next[index];
            else next[index] = track;
            return next;
        });
    };

    // ── Drag & Drop ────────────────────────────────────────────────────────────
    const dragIdx   = useRef<number | null>(null);
    const [dropTarget, setDropTarget] = useState<number | null>(null);
    const onGenDragStart = (i: number) => { dragIdx.current = i; };
    const onGenDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDropTarget(i); };
    const onGenDrop      = (e: React.DragEvent, dropI: number) => {
        e.preventDefault(); setDropTarget(null);
        const fromI = dragIdx.current; dragIdx.current = null;
        if (fromI === null || fromI === dropI) return;
        s.setGenSet(prev => {
            const next = [...prev]; const [item] = next.splice(fromI, 1);
            next.splice(fromI < dropI ? dropI - 1 : dropI, 0, item);
            return next;
        });
    };
    const onGenDragEnd = () => { dragIdx.current = null; setDropTarget(null); };

    const [showHelp, setShowHelp] = useState(false);
    const [configExpanded, setConfigExpanded] = useState(false);

    return (
        <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            backgroundColor: "#050508", padding: "2px", gap: "2px", overflow: "hidden",
            minHeight: 0
        }}>
            {/* ── HELP MODAL ── */}
            {showHelp && (
                <div onClick={() => setShowHelp(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "#111", border: `1px solid ${THEME.colors.brand.cyan}40`, borderRadius: 12, padding: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: THEME.colors.brand.cyan, marginTop: 0 }}>BUILDER GUIDE</h2>
                        <div style={{ fontSize: 13, color: "#ccc", display: "flex", flexDirection: "column", gap: 16 }}>
                            <p>📌 <strong>Pins:</strong> Fix tracks in position. Algorithm builds around them.</p>
                            <p>✨ <strong>Swap:</strong> Musical replacement for that specific gap.</p>
                            <p>✓ <strong>Catalog:</strong> Use the right panel to mark tracks for the generator.</p>
                        </div>
                        <button onClick={() => setShowHelp(false)} style={{ width: "100%", marginTop: 24, padding: 12, borderRadius: 6, border: "none", background: THEME.colors.brand.cyan, color: "black", fontWeight: 900 }}>GOT IT!</button>
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
            <header style={{ 
                height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 8px", background: "#111118", borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: THEME.colors.brand.cyan, letterSpacing: 1 }}>SUNI BUILDER</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setConfigExpanded(!configExpanded)} style={{ background: configExpanded ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)", border: "none", color: configExpanded ? "black" : "white", fontSize: 9, fontWeight: 900, padding: "4px 10px", borderRadius: 4 }}>STRATEGY</button>
                    <button onClick={() => setShowHelp(true)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#888", fontSize: 10, fontWeight: 900, width: 24, height: 24, borderRadius: 4 }}>?</button>
                </div>
            </header>

            <div style={{ flex: 1, display: "flex", gap: "2px", overflow: "hidden" }}>
                
                {/* ── LEFT: WORKSPACE ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", position: "relative" }}>
                    
                    <div style={{ 
                        display: configExpanded ? "block" : "none",
                        background: "#111118", padding: "8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)",
                        zIndex: 100
                    }}>
                        <BuilderConfigSection
                            targetMin={s.targetMin} venue={s.venue} curve={s.curve}
                            onTargetMinChange={s.setTargetMin} onVenueChange={s.setVenue} onCurveChange={s.setCurve}
                            onGenerate={() => { s.doGen(anchors); setConfigExpanded(false); }}
                            genSetLength={s.genSet.length}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }} className="no-scrollbar">
                        <BuilderGeneratedSetSection
                            tracks={s.genSet} targetSeconds={tSec} dropTarget={dropTarget} activeDragIndex={dragIdx.current}
                            onSave={s.saveSet} onSendToPlayer={s.toPlayer}
                            onDragStart={onGenDragStart} onDragOver={onGenDragOver} onDrop={onGenDrop} onDragEnd={onGenDragEnd}
                            onRemoveTrack={(i) => s.setGenSet(p => p.filter((_, idx) => idx !== i))}
                            onEditTrack={setProfileTrack} onSmartReplace={s.smartReplace}
                            onToggleAnchor={toggleAnchor} anchors={anchors}
                        />
                        <BuilderSimulationPanel tracks={s.genSet} />
                    </div>

                    <div className="mobile-only" style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", gap: 8 }}>
                        <button onClick={() => setRepoOpen(true)} style={{ flex: 1, height: 44, borderRadius: 8, background: "#222", border: "1px solid #444", color: "white", fontSize: 12, fontWeight: 800 }}>CATALOG</button>
                        <button onClick={() => s.doGen(anchors)} style={{ flex: 2, height: 44, borderRadius: 8, background: THEME.colors.brand.cyan, border: "none", color: "black", fontSize: 12, fontWeight: 900 }}>REGENERATE</button>
                    </div>
                </div>

                {/* ── RIGHT: CATALOG SIDEBAR (Desktop) ── */}
                <aside className="desktop-sidebar" style={{ 
                    width: 320, background: "#0a0a0f", borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)",
                    overflow: "hidden", display: "flex", flexDirection: "column"
                }}>
                    <BuilderRepertoirePanel
                        isPlaying={isPlaying} importOpen={importOpen} search={s.search} selectedMood={s.fMood}
                        onToggleImport={() => setImportOpen(v => !v)} onSearchChange={s.setSearch} onMoodChange={s.setFMood}
                        onAddTrack={t => s.setGenSet(p => [...p, t])} onAppendToQueue={t => s.appendToQueue([t])}
                        onEditTrack={setProfileTrack} onRemoveCustomTrack={s.removeCustomTrack}
                        filteredTracks={[]} customTracks={[]} // Ignored by component, but kept for TS
                    />
                </aside>
            </div>

            {/* ── REPERTOIRE BOTTOM SHEET (Mobile) ── */}
            {repoOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1500 }}>
                    <div onClick={() => setRepoOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "85vh", background: "#0a0a0f", borderTop: `1px solid ${THEME.colors.brand.cyan}40`, borderRadius: "16px 16px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ height: 4, width: 40, background: "#333", borderRadius: 2, margin: "12px auto" }} />
                        <BuilderRepertoirePanel
                            isPlaying={isPlaying} importOpen={importOpen} search={s.search} selectedMood={s.fMood}
                            onToggleImport={() => setImportOpen(v => !v)} onSearchChange={s.setSearch} onMoodChange={s.setFMood}
                            onAddTrack={t => { s.setGenSet(p => [...p, t]); setRepoOpen(false); }}
                            onAppendToQueue={t => s.appendToQueue([t])}
                            onEditTrack={setProfileTrack} onRemoveCustomTrack={s.removeCustomTrack}
                            filteredTracks={[]} customTracks={[]} 
                        />
                    </div>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .mobile-only { display: none; }
                @media (max-width: 900px) {
                    .mobile-only { display: flex; }
                    .desktop-sidebar { display: none !important; }
                }
            `}</style>

            {profileTrack && (
                <TrackProfileModal
                    track={profileTrack}
                    onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }}
                    onCancel={() => setProfileTrack(null)}
                />
            )}
        </div>
    );
};
