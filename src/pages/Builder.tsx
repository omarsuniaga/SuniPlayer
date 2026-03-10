import React, { useMemo, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { THEME } from "../data/theme.ts";
import { TRACKS, VENUES, CURVES, MOODS } from "../data/constants";
import { TrackRow } from "../components/common/TrackRow";
import { SetSummary } from "../components/common/SetSummary";
import { ImportZone } from "../components/common/ImportZone";
import { mc } from "../services/uiUtils";

export const Builder: React.FC = () => {
    const s = useProjectStore();
    const pQueue = useProjectStore(st => st.pQueue);
    const playing = useProjectStore(st => st.playing);
    const customTracks = useProjectStore(st => st.customTracks);
    const removeCustomTrack = useProjectStore(st => st.removeCustomTrack);
    const tSec = s.targetMin * 60;
    const [repoOpen, setRepoOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const isPlaying = playing && pQueue.length > 0;

    const filtered = useMemo(() => {
        return TRACKS.filter((t) => {
            if (s.search && !t.title.toLowerCase().includes(s.search.toLowerCase()) && !t.artist.toLowerCase().includes(s.search.toLowerCase())) return false;
            if (s.fMood && t.mood !== s.fMood) return false;
            if (s.genSet.find((gs) => gs.id === t.id)) return false;
            return true;
        });
    }, [s.search, s.fMood, s.genSet]);

    const RepoContent = () => (
        <>
            <div style={{ padding: "16px", borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.text.primary }}>REPERTOIRE</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: THEME.colors.text.muted, fontFamily: THEME.fonts.mono }}>{filtered.length + customTracks.length} items</span>
                        {/* Import MP3 button */}
                        <button
                            onClick={() => setImportOpen(v => !v)}
                            title="Importar mis archivos de audio"
                            style={{
                                padding: "4px 10px",
                                borderRadius: THEME.radius.sm,
                                border: `1px solid ${importOpen ? THEME.colors.brand.violet : THEME.colors.border}`,
                                backgroundColor: importOpen ? `${THEME.colors.brand.violet}15` : "transparent",
                                color: importOpen ? THEME.colors.brand.violet : THEME.colors.text.muted,
                                cursor: "pointer", fontSize: 11, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 5,
                                transition: "all 0.2s",
                            }}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Import
                        </button>
                    </div>
                </div>

                {/* Collapsible import zone */}
                {importOpen && (
                    <div style={{ borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`, overflow: "hidden" }}>
                        <ImportZone onClose={() => setImportOpen(false)} />
                    </div>
                )}

                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search artist or title..."
                        value={s.search}
                        onChange={(e) => s.setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`,
                            backgroundColor: THEME.colors.surface,
                            color: THEME.colors.text.primary,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = THEME.colors.brand.cyan}
                        onBlur={(e) => e.target.style.borderColor = THEME.colors.border}
                    />
                </div>

                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button
                        onClick={() => s.setFMood(null)}
                        style={{
                            padding: "4px 10px",
                            borderRadius: THEME.radius.sm,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: !s.fMood ? "rgba(255,255,255,0.1)" : "transparent",
                            color: !s.fMood ? "white" : THEME.colors.text.muted,
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        All
                    </button>
                    {MOODS.map((m) => (
                        <button
                            key={m}
                            onClick={() => s.setFMood(s.fMood === m ? null : m)}
                            style={{
                                padding: "4px 10px",
                                borderRadius: THEME.radius.sm,
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: s.fMood === m ? mc(m) + "20" : "transparent",
                                color: s.fMood === m ? mc(m) : THEME.colors.text.muted,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "capitalize",
                            }}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                {filtered.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <TrackRow
                                track={t}
                                small
                                idx={0}
                                onAdd={(tr) => {
                                    s.setGenSet((p) => [...p, tr]);
                                    setRepoOpen(false);
                                }}
                            />
                        </div>
                        {/* Quick Add to Queue button — only shown when something is playing */}
                        {isPlaying && (
                            <button
                                onClick={() => s.appendToQueue([t])}
                                title="Agregar a la cola del Player sin interrumpir"
                                style={{
                                    flexShrink: 0,
                                    width: 28, height: 28,
                                    borderRadius: THEME.radius.sm,
                                    border: `1px solid ${THEME.colors.brand.violet}40`,
                                    backgroundColor: `${THEME.colors.brand.violet}10`,
                                    color: THEME.colors.brand.violet,
                                    cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, fontWeight: 700,
                                    transition: "all 0.15s",
                                    marginRight: 4,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = `${THEME.colors.brand.violet}25`;
                                    e.currentTarget.style.transform = "scale(1.1)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = `${THEME.colors.brand.violet}10`;
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M12 5v14M5 12l7 7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}

                {/* ── Custom Tracks (user-imported) ── */}
                {customTracks.length > 0 && (
                    <>
                        <div style={{ fontSize: 10, color: THEME.colors.brand.violet, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 10px 4px" }}>
                            Mis archivos importados
                        </div>
                        {customTracks.map(t => (
                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <TrackRow
                                        track={t}
                                        small
                                        idx={0}
                                        onAdd={(tr) => {
                                            s.setGenSet(p => [...p, tr]);
                                            setRepoOpen(false);
                                        }}
                                    />
                                </div>
                                {/* Send to queue (when playing) */}
                                {isPlaying && (
                                    <button
                                        onClick={() => s.appendToQueue([t])}
                                        title="Agregar a la cola"
                                        style={{
                                            flexShrink: 0, width: 28, height: 28,
                                            borderRadius: THEME.radius.sm,
                                            border: `1px solid ${THEME.colors.brand.violet}40`,
                                            backgroundColor: `${THEME.colors.brand.violet}10`,
                                            color: THEME.colors.brand.violet,
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M12 5v14M5 12l7 7 7-7" />
                                        </svg>
                                    </button>
                                )}
                                {/* Remove imported track */}
                                <button
                                    onClick={() => removeCustomTrack(t.id)}
                                    title="Eliminar archivo importado"
                                    style={{
                                        flexShrink: 0, width: 24, height: 24,
                                        borderRadius: THEME.radius.sm,
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: THEME.colors.text.muted,
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 16, lineHeight: 1, marginRight: 4,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = THEME.colors.status.error; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = THEME.colors.text.muted; }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* ── Layout ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }} className="builder-layout">

                {/* ── Main Content ── */}
                <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", overflowY: "auto", gap: 24, minWidth: 0 }} className="main-content">

                    {/* Set Configuration */}
                    <section>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Set Configuration</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                            {/* Duration */}
                            <div>
                                <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Duration</label>
                                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }} className="duration-grid">
                                    {[30, 45, 60, 90, 120].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => s.setTargetMin(m)}
                                            style={{
                                                padding: "10px 16px",
                                                borderRadius: THEME.radius.md,
                                                cursor: "pointer",
                                                border: `1px solid ${s.targetMin === m ? THEME.colors.brand.cyan : THEME.colors.border}`,
                                                backgroundColor: s.targetMin === m ? "rgba(6,182,212,0.1)" : THEME.colors.surface,
                                                color: s.targetMin === m ? THEME.colors.brand.cyan : THEME.colors.text.secondary,
                                                fontWeight: 600,
                                                fontSize: 14,
                                                fontFamily: THEME.fonts.mono,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Venue */}
                            <div>
                                <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Venue</label>
                                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                    {VENUES.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => s.setVenue(v.id)}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: THEME.radius.md,
                                                cursor: "pointer",
                                                border: `1px solid ${s.venue === v.id ? v.color + "80" : THEME.colors.border}`,
                                                backgroundColor: s.venue === v.id ? v.color + "15" : THEME.colors.surface,
                                                color: s.venue === v.id ? v.color : THEME.colors.text.secondary,
                                                fontWeight: 500,
                                                fontSize: 13,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Energy Curve */}
                            <div>
                                <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Energy Curve</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 8 }}>
                                    {CURVES.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => s.setCurve(c.id)}
                                            style={{
                                                padding: "12px",
                                                borderRadius: THEME.radius.md,
                                                cursor: "pointer",
                                                border: `1px solid ${s.curve === c.id ? THEME.colors.brand.violet + "80" : THEME.colors.border}`,
                                                backgroundColor: s.curve === c.id ? THEME.colors.brand.violet + "10" : THEME.colors.surface,
                                                color: s.curve === c.id ? THEME.colors.brand.violet : THEME.colors.text.secondary,
                                                textAlign: "left",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                                            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{c.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Generate Button */}
                    <div
                        style={{
                            position: "relative",
                            padding: "2px",
                            background: THEME.gradients.brand,
                            borderRadius: THEME.radius.xl,
                            boxShadow: `0 8px 32px ${THEME.colors.brand.cyan}20`,
                        }}
                    >
                        <button
                            onClick={s.doGen}
                            style={{
                                width: "100%",
                                padding: "18px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: THEME.colors.bg,
                                color: "white",
                                fontSize: 16,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 12,
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.colors.bg)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            Generate {s.targetMin} Minute Set
                        </button>
                    </div>

                    {/* Results Area */}
                    {s.genSet.length > 0 ? (
                        <section style={{ animation: "fadeIn 0.4s ease-out" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Generated Set</h2>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={s.saveSet}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: THEME.radius.sm,
                                            border: `1px solid ${THEME.colors.status.success}40`,
                                            backgroundColor: THEME.colors.status.success + "10",
                                            color: THEME.colors.status.success,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Save to History
                                    </button>
                                    <button
                                        onClick={s.toPlayer}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: THEME.radius.sm,
                                            border: "none",
                                            background: THEME.gradients.cyan,
                                            color: "white",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            boxShadow: `0 4px 12px ${THEME.colors.brand.cyan}30`,
                                        }}
                                    >
                                        Send to Player
                                    </button>
                                </div>
                            </div>

                            <SetSummary tracks={s.genSet} target={tSec} />

                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4, backgroundColor: THEME.colors.panel, borderRadius: THEME.radius.lg, border: `1px solid ${THEME.colors.border}`, overflow: "hidden" }}>
                                {s.genSet.map((t, i) => (
                                    <TrackRow
                                        key={t.id + i}
                                        track={t}
                                        idx={i}
                                        showN
                                        onRm={(j) => s.setGenSet((p) => p.filter((_, k) => k !== j))}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${THEME.colors.border}`, borderRadius: THEME.radius.xl, color: THEME.colors.text.muted, fontSize: 14, minHeight: 120 }}>
                            Configure and click Generate to start
                        </div>
                    )}
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
                    <RepoContent />
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
                    aria-label="Browse repertoire"
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
                            <RepoContent />
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
        </>
    );
};
