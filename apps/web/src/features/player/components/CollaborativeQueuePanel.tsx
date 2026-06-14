import React, { useMemo, useState } from "react";
import { useLibraryStore, useProjectStore } from "@suniplayer/core";
import type { Track } from "@suniplayer/core";
import { THEME } from "../../../data/theme";
import { useCollaborativeQueue } from "../hooks/useCollaborativeQueue";

/**
 * Phase 2 UI — the shared, collaborative setlist. Visible only inside a session.
 * Any device can contribute its own tracks, remove, or reorder; everything syncs
 * via the CRDT queue. "Cargar en el reproductor" resolves the shared list into the
 * local player queue (using the published CDN url for tracks not held locally).
 */
export const CollaborativeQueuePanel: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const { items, userId, contribute, remove, move, toTrack } = useCollaborativeQueue();
    const customTracks = useLibraryStore((s) => s.customTracks);
    const repertoire = useLibraryStore((s) => s.repertoire);
    const setPQueue = useProjectStore((s) => s.setPQueue);
    const [picking, setPicking] = useState(false);

    const library: Track[] = useMemo(() => {
        const byId = new Map<string, Track>();
        [...customTracks, ...repertoire].forEach((t) => byId.set(t.id, t));
        return Array.from(byId.values());
    }, [customTracks, repertoire]);

    const loadIntoPlayer = () => {
        const tracks = items.map((i) => toTrack(i, library));
        if (tracks.length) setPQueue(tracks);
    };

    const rowBg = "rgba(255,255,255,0.03)";

    return (
        <div style={{ padding: "12px", borderTop: `1px solid ${THEME.colors.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: THEME.colors.brand.violet, letterSpacing: 1 }}>
                    COLA COLABORATIVA
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.text.muted }}>{items.length} aportes</span>
            </div>

            {items.length === 0 && (
                <p style={{ fontSize: 11, color: THEME.colors.text.muted, margin: "0 0 8px" }}>
                    Nadie aportó temas todavía. Agregá los tuyos 👇
                </p>
            )}

            {items.map((it, i) => {
                const mine = it.ownerId === userId;
                return (
                    <div key={it.uid} style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "12px 10px" : "9px 10px", borderRadius: 8, marginBottom: 6, background: rowBg }}>
                        <span style={{ fontSize: 11, fontFamily: THEME.fonts.mono, opacity: 0.4, minWidth: 18 }}>{String(i + 1).padStart(2, "0")}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: isMobile ? 14 : 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: THEME.colors.text.primary }}>{it.title}</div>
                            <div style={{ fontSize: 10, color: THEME.colors.text.muted }}>
                                {it.artist || "—"} · <span style={{ color: mine ? THEME.colors.brand.cyan : THEME.colors.brand.violet, fontWeight: 800 }}>{mine ? "Tú" : "Otro"}</span>
                            </div>
                        </div>
                        <button onClick={() => move(it.uid, Math.max(0, i - 1))} disabled={i === 0} title="Subir" style={iconBtn(i === 0)}>▲</button>
                        <button onClick={() => move(it.uid, i + 1)} disabled={i === items.length - 1} title="Bajar" style={iconBtn(i === items.length - 1)}>▼</button>
                        <button onClick={() => remove(it.uid)} title="Quitar" style={{ ...iconBtn(false), color: THEME.colors.status.error }}>✕</button>
                    </div>
                );
            })}

            {picking ? (
                <div style={{ marginTop: 8, maxHeight: 220, overflowY: "auto", border: `1px solid ${THEME.colors.border}`, borderRadius: 8 }}>
                    {library.length === 0 && (
                        <p style={{ fontSize: 11, color: THEME.colors.text.muted, padding: 12, margin: 0 }}>Tu biblioteca está vacía. Importá temas primero.</p>
                    )}
                    {library.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => { contribute(t); setPicking(false); }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "none", border: "none", borderBottom: `1px solid ${THEME.colors.border}`, color: THEME.colors.text.primary, fontSize: 12, cursor: "pointer" }}
                        >
                            <span style={{ fontWeight: 700 }}>{t.title}</span>
                            <span style={{ color: THEME.colors.text.muted }}> — {t.artist || "—"}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <button
                    onClick={() => setPicking(true)}
                    style={{ width: "100%", marginTop: 8, padding: isMobile ? "13px" : "10px", borderRadius: 8, border: `1px solid ${THEME.colors.brand.violet}40`, background: `${THEME.colors.brand.violet}12`, color: THEME.colors.brand.violet, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                    + Agregar de mi biblioteca
                </button>
            )}

            {items.length > 0 && (
                <button
                    onClick={loadIntoPlayer}
                    style={{ width: "100%", marginTop: 8, padding: isMobile ? "13px" : "10px", borderRadius: 8, border: "none", background: THEME.colors.brand.cyan, color: "black", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
                >
                    ▶ Cargar en el reproductor
                </button>
            )}
        </div>
    );
};

function iconBtn(disabled: boolean): React.CSSProperties {
    return {
        background: "rgba(255,255,255,0.05)",
        border: "none",
        borderRadius: 6,
        width: 26,
        height: 26,
        color: disabled ? "#444" : THEME.colors.text.muted,
        fontSize: 11,
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
    };
}
