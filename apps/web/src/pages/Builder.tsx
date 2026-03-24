import React, { useMemo, useRef, useState } from "react";
import { BuilderConfigSection } from "../features/set-builder/ui/BuilderConfigSection";
import { BuilderGeneratedSetSection } from "../features/set-builder/ui/BuilderGeneratedSetSection";
import { BuilderRepertoirePanel } from "../features/set-builder/ui/BuilderRepertoirePanel";
import { useProjectStore, useBuilderStore } from "../store/useProjectStore";
import { THEME } from "../data/theme.ts";
import { TRACKS } from "../data/constants.ts";
import { useLibraryStore } from "../store/useLibraryStore";
import { TrackProfileModal } from "../components/common/TrackProfileModal.tsx";
import { updateTrackMetadata } from "../store/useProjectStore.ts";
import { Track } from "../types.ts";

export const Builder: React.FC = () => {
    const s = useProjectStore();
    const pQueue = useProjectStore(st => st.pQueue);
    const playing = useProjectStore(st => st.playing);
    const customTracks = useProjectStore(st => st.customTracks);
    const removeCustomTrack = useProjectStore(st => st.removeCustomTrack);
    const tSec = s.targetMin * 60;
    const [repoOpen,   setRepoOpen]   = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const isPlaying = playing && pQueue.length > 0;

    // ── Show context selectors ────────────────────────────────────────────────
    const currentShow = useBuilderStore(st => st.currentShow);
    const startNewShow = useBuilderStore(st => st.startNewShow);
    const addSetToCurrentShow = useBuilderStore(st => st.addSetToCurrentShow);
    const getExcludedTrackIdsInShow = useBuilderStore(st => st.getExcludedTrackIdsInShow);

    // ── Generated set drag-to-reorder (HTML5 Drag API) ───────────────────────
    const dragIdx   = useRef<number | null>(null);
    const [dropTarget, setDropTarget] = useState<number | null>(null);

    const onGenDragStart = (i: number) => { dragIdx.current = i; };
    const onGenDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDropTarget(i); };
    const onGenDrop      = (e: React.DragEvent, dropI: number) => {
        e.preventDefault();
        setDropTarget(null);
        const fromI = dragIdx.current;
        dragIdx.current = null;
        if (fromI === null || fromI === dropI) return;
        s.setGenSet(prev => {
            const next = [...prev];
            const [item] = next.splice(fromI, 1);
            next.splice(fromI < dropI ? dropI - 1 : dropI, 0, item);
            return next;
        });
    };
    const onGenDragEnd = () => { dragIdx.current = null; setDropTarget(null); };

    const trackOverrides = useLibraryStore(st => st.trackOverrides || {});

    const filtered = useMemo(() => {
        // Hydrate TRACKS with overrides
        const hydratedTracks = TRACKS.map(t => ({
            ...t,
            ...(trackOverrides[t.id] || {})
        }));

        return hydratedTracks.filter((t) => {
            if (s.search && !t.title.toLowerCase().includes(s.search.toLowerCase()) && !t.artist.toLowerCase().includes(s.search.toLowerCase())) return false;
            if (s.fMood && t.mood !== s.fMood) return false;
            if (s.genSet.find((gs) => gs.id === t.id)) return false;
            return true;
        });
    }, [s.search, s.fMood, s.genSet, trackOverrides]);

    const addTrackToGeneratedSet = (track: typeof filtered[number]) => {
        s.setGenSet((previous) => [...previous, track]);
        setRepoOpen(false);
    };

    return (
        <>
            {/* ── Layout ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }} className="builder-layout">

                {/* ── Main Content ── */}
                <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", overflowY: "auto", gap: 24, minWidth: 0 }} className="main-content">

                    {/* ── Show Context Header ── */}
                    {currentShow && (
                        <div style={{ marginBottom: 0, padding: 16, borderRadius: 8, backgroundColor: "rgba(6,182,212,0.08)", borderLeft: `4px solid ${THEME.colors.brand.cyan}` }}>
                            <div style={{ fontSize: 12, color: THEME.colors.text.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Show Context</div>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                                {currentShow.name}
                            </div>
                            <div style={{ fontSize: 13, color: THEME.colors.text.secondary }}>
                                {currentShow.sets.length > 1 ? (
                                    <>
                                        Working on <strong>{currentShow.sets[currentShow.sets.length - 1].label}</strong> of {currentShow.sets.length} sets
                                        {getExcludedTrackIdsInShow().length > 0 && (
                                            <>, {getExcludedTrackIdsInShow().length} song{getExcludedTrackIdsInShow().length !== 1 ? "s" : ""} excluded from other sets</>
                                        )}
                                    </>
                                ) : (
                                    <>Building <strong>Set 1</strong> of this show</>
                                )}
                            </div>
                        </div>
                    )}

                    <BuilderConfigSection
                        targetMin={s.targetMin}
                        venue={s.venue}
                        curve={s.curve}
                        onTargetMinChange={s.setTargetMin}
                        onVenueChange={s.setVenue}
                        onCurveChange={s.setCurve}
                        onGenerate={s.doGen}
                        currentShow={currentShow}
                        genSetLength={s.genSet.length}
                        onNewShow={startNewShow}
                        onAddSet={addSetToCurrentShow}
                    />

                    <BuilderGeneratedSetSection
                        tracks={s.genSet}
                        targetSeconds={tSec}
                        dropTarget={dropTarget}
                        activeDragIndex={dragIdx.current}
                        onSave={s.saveSet}
                        onSendToPlayer={s.toPlayer}
                        onDragStart={onGenDragStart}
                        onDragOver={onGenDragOver}
                        onDrop={onGenDrop}
                        onDragEnd={onGenDragEnd}
                        onRemoveTrack={(index) => s.setGenSet((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                        onEditTrack={setProfileTrack}
                    />
                </main>

                {/* ── Desktop Sidebar (hidden on mobile) ── */}
                <aside
                    className="desktop-sidebar"
                    style={{
                        width: 340,
                        backgroundColor: THEME.colors.panel,
                        borderLeft: `1px solid ${THEME.colors.border}`,
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                    }}
                >
                    <BuilderRepertoirePanel
                        filteredTracks={filtered}
                        customTracks={customTracks}
                        isPlaying={isPlaying}
                        importOpen={importOpen}
                        search={s.search}
                        selectedMood={s.fMood}
                        onToggleImport={() => setImportOpen((value) => !value)}
                        onSearchChange={s.setSearch}
                        onMoodChange={s.setFMood}
                        onAddTrack={addTrackToGeneratedSet}
                        onAppendToQueue={(track) => s.appendToQueue([track])}
                        onEditTrack={setProfileTrack}
                        onRemoveCustomTrack={removeCustomTrack}
                    />
                </aside>
            </div>

            {/* ── Mobile: Floating "Browse" button + Bottom Sheet ── */}
            <>
                {/* FAB — show only on mobile */}
                <button
                    className="mobile-repo-fab"
                    onClick={() => setRepoOpen(true)}
                    style={{
                        display: "none", // shown via media query
                        position: "fixed",
                        bottom: 84, // above bottom nav
                        right: 20,
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: THEME.gradients.brand,
                        border: "none",
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 8px 24px ${THEME.colors.brand.cyan}40`,
                        zIndex: 400,
                        flexDirection: "column",
                        gap: 2,
                    }}
                    title="Abrir panel de canciones y repertorio" aria-label="Browse repertoire"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    {/* Badge for filtered count */}
                    {filtered.length < TRACKS.length && (
                        <span style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            backgroundColor: THEME.colors.status.warning,
                            fontSize: 9,
                            fontWeight: 700,
                            color: "black",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            {filtered.length}
                        </span>
                    )}
                </button>

                {/* Bottom Sheet Overlay */}
                {repoOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            onClick={() => setRepoOpen(false)}
                            style={{
                                display: "none",
                                position: "fixed",
                                inset: 0,
                                backgroundColor: "rgba(0,0,0,0.7)",
                                zIndex: 450,
                            }}
                            className="mobile-repo-backdrop"
                        />
                        {/* Sheet */}
                        <div
                            className="mobile-repo-sheet"
                            style={{
                                display: "none",
                                position: "fixed",
                                bottom: 68, // above bottom nav
                                left: 0,
                                right: 0,
                                height: "65vh",
                                backgroundColor: "#111118",
                                borderTop: `1px solid ${THEME.colors.borderLight}`,
                                borderRadius: "20px 20px 0 0",
                                zIndex: 460,
                                flexDirection: "column",
                                overflow: "hidden",
                                animation: "slideUp 0.25s ease-out",
                            }}
                        >
                            {/* Handle */}
                            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" }} />
                            </div>
                            {/* Header with close */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 0" }}>
                                <span style={{ fontSize: 14, fontWeight: 700 }}>Browse Repertoire</span>
                                <button
                                    onClick={() => setRepoOpen(false)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: THEME.colors.text.muted, padding: 4 }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <BuilderRepertoirePanel
                                filteredTracks={filtered}
                                customTracks={customTracks}
                                isPlaying={isPlaying}
                                importOpen={importOpen}
                                search={s.search}
                                selectedMood={s.fMood}
                                onToggleImport={() => setImportOpen((value) => !value)}
                                onSearchChange={s.setSearch}
                                onMoodChange={s.setFMood}
                                onAddTrack={addTrackToGeneratedSet}
                                onAppendToQueue={(track) => s.appendToQueue([track])}
                                onEditTrack={setProfileTrack}
                                onRemoveCustomTrack={removeCustomTrack}
                            />
                        </div>
                    </>
                )}
            </>

            {/* Responsive styles for builder */}
            <style>{`
                @media (max-width: 640px) {
                    .mobile-repo-fab      { display: flex !important; }
                    .mobile-repo-backdrop { display: block !important; }
                    .mobile-repo-sheet    { display: flex !important; }
                }
            `}</style>

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
        </>
    );
};
