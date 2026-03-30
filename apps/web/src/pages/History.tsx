import React from "react";
import { useHistoryStore } from "../store/useHistoryStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useBuilderStore } from "../store/useBuilderStore";
import { THEME } from "../data/theme.ts";
import type { SetEntry, Show, Track } from "@suniplayer/core";
import { StatsDashboard } from "../features/history/ui/StatsDashboard";

export const History: React.FC = () => {
    const history = useHistoryStore(s => s.history);
    const clearHistory = useHistoryStore(s => s.clearHistory);
    const setView = useBuilderStore(s => s.setView);

    const sendToPlayer = (setEntry: SetEntry, show: Show) => {
        usePlayerStore.getState().setPQueue(setEntry.tracks);
        usePlayerStore.getState().setCi(0);
        usePlayerStore.getState().setPos(0);
        usePlayerStore.getState().setElapsed(0);
        usePlayerStore.getState().setCurrentSetMetadata(
            show.sets.length > 1
                ? { setLabel: setEntry.label, totalSetsInShow: show.sets.length }
                : null
        );
        setView("player");
    };

    return (
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }} className="main-content">
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>Historial de Shows</h2>
                    <p style={{ color: THEME.colors.text.muted, fontSize: 16, marginTop: 4 }}>Reportes y estadÃ­sticas de tus sesiones en vivo</p>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={() => confirm("Â¿Seguro que querÃ©s borrar todo el historial?") && clearHistory()}
                        style={{
                            padding: "10px 20px",
                            borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.status.error}40`,
                            backgroundColor: "transparent",
                            color: THEME.colors.status.error,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        Limpiar Todo
                    </button>
                )}
            </header>

            {/* Panel de EstadÃ­sticas */}
            <StatsDashboard />

            {history.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${THEME.colors.border}`, borderRadius: THEME.radius.xl, color: THEME.colors.text.muted }}>
                    No sets saved yet. Generate some in the Builder!
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {history.map((show: Show) => {
                        const totalDurationMs = show.sets.reduce((sum: number, s: SetEntry) => sum + s.durationMs, 0);
                        const totalTracks = show.sets.reduce((sum: number, s: SetEntry) => sum + s.tracks.length, 0);
                        const totalMin = Math.round(totalDurationMs / 60000);

                        return (
                            <div
                                key={show.id}
                                style={{
                                    borderRadius: THEME.radius.xl,
                                    backgroundColor: THEME.colors.surface,
                                    border: `1px solid ${THEME.colors.border}`,
                                    overflow: "hidden",
                                }}
                            >
                                {/* Show header */}
                                <div style={{
                                    padding: "16px 20px",
                                    borderBottom: show.sets.length > 0 ? `1px solid ${THEME.colors.border}` : "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 16 }}>ðŸ“…</span>
                                        <span style={{ fontSize: 15, fontWeight: 700 }}>{show.name}</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: THEME.colors.text.muted, whiteSpace: "nowrap" }}>
                                        {show.sets.length} set{show.sets.length !== 1 ? "s" : ""} Â· {totalTracks} songs Â· {totalMin} min
                                    </span>
                                </div>

                                {/* Sets within the show */}
                                {show.sets.map((setEntry: SetEntry, index: number) => {
                                    const setMin = Math.round(setEntry.durationMs / 60000);
                                    const isLast = index === show.sets.length - 1;

                                    return (
                                        <div
                                            key={setEntry.id}
                                            style={{
                                                padding: "14px 20px 14px 36px",
                                                borderBottom: isLast ? "none" : `1px solid ${THEME.colors.border}`,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 16,
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.text.primary }}>
                                                    {setEntry.label}
                                                </div>
                                                <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 2 }}>
                                                    {setMin} min Â· {setEntry.tracks.length} songs
                                                </div>

                                                {/* Track pills */}
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                                                    {setEntry.tracks.slice(0, 5).map((t: Track, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            style={{
                                                                fontSize: 10,
                                                                padding: "3px 7px",
                                                                borderRadius: THEME.radius.sm,
                                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                                color: THEME.colors.text.muted,
                                                                border: `1px solid ${THEME.colors.border}`,
                                                            }}
                                                        >
                                                            {t.title}
                                                        </span>
                                                    ))}
                                                    {setEntry.tracks.length > 5 && (
                                                        <span style={{ fontSize: 10, padding: "3px 7px", color: THEME.colors.text.muted }}>
                                                            +{setEntry.tracks.length - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => sendToPlayer(setEntry, show)}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: THEME.radius.md,
                                                    border: "none",
                                                    background: THEME.gradients.brand,
                                                    color: "white",
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap",
                                                    boxShadow: `0 4px 12px ${THEME.colors.brand.cyan}20`,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                Load
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
