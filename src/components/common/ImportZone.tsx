/**
 * ImportZone — Drag & drop / file-picker for user MP3 files
 *
 * 3-phase flow:
 *   1. Drop zone  → user drops / picks files
 *   2. Editor     → editable metadata per track (BPM, energy, mood, key, title, artist)
 *   3. Success    → confirmation screen, auto-closes after 2.5 s
 */
import React, { useRef, useState, useCallback } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { THEME } from "../../data/theme.ts";
import { Track } from "../../types";

// ── Constants ────────────────────────────────────────────────────────────────

const MOODS = ["calm", "happy", "melancholic", "energetic"] as const;
type Mood = typeof MOODS[number];

const MOOD_LABELS: Record<Mood, string> = {
    calm:        "Tranq.",
    happy:       "Alegre",
    melancholic: "Melan.",
    energetic:   "Energía",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "Artist - Title.mp3" → { artist, title } with smart fallbacks */
function parseName(filename: string): { title: string; artist: string } {
    const base = filename.replace(/\.[^/.]+$/, "");
    const parts = base.split(" - ");
    if (parts.length >= 2) {
        return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
    }
    return { artist: "Unknown Artist", title: base.trim() };
}

/** Read audio duration from a File via HTMLAudioElement */
function readDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        audio.addEventListener("loadedmetadata", () => {
            const ms = Math.round(audio.duration * 1000);
            URL.revokeObjectURL(url);
            resolve(ms > 0 ? ms : 180_000);
        });
        audio.addEventListener("error", () => { URL.revokeObjectURL(url); resolve(180_000); });
        audio.src = url;
    });
}

function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface PendingTrack {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    energy: number;
    mood: Mood;
    key: string;
    duration_ms: number;
    blobUrl: string;
    fileName: string;
}

// ── Shared micro-styles ───────────────────────────────────────────────────────

const fieldInput: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.06)",
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.sm,
    color: "inherit",
    fontSize: 12,
    padding: "4px 8px",
    outline: "none",
    minWidth: 0,
};

const rowLabel: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: THEME.colors.text.muted,
    whiteSpace: "nowrap",
};

// ── MetadataRow sub-component ─────────────────────────────────────────────────

interface MetadataRowProps {
    track: PendingTrack;
    onChange: (patch: Partial<PendingTrack>) => void;
}

const MetadataRow: React.FC<MetadataRowProps> = ({ track, onChange }) => (
    <div style={{
        borderRadius: THEME.radius.md,
        border: `1px solid ${THEME.colors.border}`,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.02)",
    }}>
        {/* ── Title / Artist / Duration ── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* music note icon */}
            <div style={{
                width: 30, height: 30, borderRadius: THEME.radius.sm, flexShrink: 0,
                backgroundColor: `${THEME.colors.brand.violet}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={THEME.colors.brand.violet} strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
            </div>

            <input
                value={track.title}
                onChange={e => onChange({ title: e.target.value })}
                placeholder="Título"
                style={{ ...fieldInput, flex: 3 }}
            />
            <input
                value={track.artist}
                onChange={e => onChange({ artist: e.target.value })}
                placeholder="Artista"
                style={{ ...fieldInput, flex: 2 }}
            />
            <span style={{ fontSize: 11, color: THEME.colors.text.muted, flexShrink: 0 }}>
                {formatDuration(track.duration_ms)}
            </span>
        </div>

        {/* ── BPM · Energy · Key ── */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {/* BPM */}
            <label style={rowLabel}>
                <span>BPM</span>
                <input type="range" min={40} max={220} step={1}
                    value={track.bpm}
                    onChange={e => onChange({ bpm: Number(e.target.value) })}
                    style={{ width: 72, accentColor: THEME.colors.brand.cyan }}
                />
                <span style={{ fontSize: 11, color: THEME.colors.brand.cyan, minWidth: 28, textAlign: "right" }}>
                    {track.bpm}
                </span>
            </label>

            {/* Energy */}
            <label style={rowLabel}>
                <span>⚡</span>
                <input type="range" min={0} max={1} step={0.05}
                    value={track.energy}
                    onChange={e => onChange({ energy: Number(e.target.value) })}
                    style={{ width: 64, accentColor: THEME.colors.brand.violet }}
                />
                <span style={{ fontSize: 11, color: THEME.colors.brand.violet, minWidth: 30, textAlign: "right" }}>
                    {Math.round(track.energy * 100)}%
                </span>
            </label>

            {/* Key */}
            <label style={rowLabel}>
                <span>Key</span>
                <input
                    value={track.key}
                    onChange={e => onChange({ key: e.target.value })}
                    maxLength={4}
                    style={{ ...fieldInput, width: 38, textAlign: "center", padding: "4px 4px" }}
                />
            </label>
        </div>

        {/* ── Mood selector ── */}
        <div style={{ display: "flex", gap: 4 }}>
            {MOODS.map(m => (
                <button
                    key={m}
                    onClick={() => onChange({ mood: m })}
                    style={{
                        flex: 1, padding: "4px 0",
                        borderRadius: THEME.radius.sm,
                        border: `1px solid ${track.mood === m ? THEME.colors.brand.violet : THEME.colors.border}`,
                        backgroundColor: track.mood === m ? `${THEME.colors.brand.violet}20` : "transparent",
                        color: track.mood === m ? THEME.colors.brand.violet : THEME.colors.text.muted,
                        fontSize: 10, cursor: "pointer",
                        fontWeight: track.mood === m ? 700 : 400,
                        transition: "all 0.15s",
                    }}
                >
                    {MOOD_LABELS[m]}
                </button>
            ))}
        </div>
    </div>
);

// ── ImportZone ────────────────────────────────────────────────────────────────

interface Props { onClose?: () => void }

export const ImportZone: React.FC<Props> = ({ onClose }) => {
    const addCustomTrack = useProjectStore(s => s.addCustomTrack);
    const appendToQueue  = useProjectStore(s => s.appendToQueue);

    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging,   setDragging]   = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pending,    setPending]    = useState<PendingTrack[]>([]);
    const [results,    setResults]    = useState<{ title: string; ok: boolean }[]>([]);

    // ── Phase 1: read files ──────────────────────────────────────────────────

    const processFiles = useCallback(async (files: FileList | File[]) => {
        const arr = Array.from(files).filter(f =>
            f.type.startsWith("audio/") || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(f.name)
        );
        if (!arr.length) return;

        setProcessing(true);
        const tracks: PendingTrack[] = [];

        for (const file of arr) {
            const blobUrl = URL.createObjectURL(file);
            const { title, artist } = parseName(file.name);
            const duration_ms = await readDuration(file);
            tracks.push({
                id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                title, artist,
                bpm: 120, energy: 0.6, mood: "calm", key: "C",
                duration_ms, blobUrl, fileName: file.name,
            });
        }

        setProcessing(false);
        setPending(tracks); // → editor phase
    }, []);

    // ── Phase 2: metadata editing ────────────────────────────────────────────

    const updatePending = useCallback((id: string, patch: Partial<PendingTrack>) => {
        setPending(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    }, []);

    const confirmImport = useCallback(() => {
        const newTracks: Track[] = pending.map(p => ({
            id:              p.id,
            title:           p.title,
            artist:          p.artist,
            duration_ms:     p.duration_ms,
            bpm:             p.bpm,
            key:             p.key,
            energy:          p.energy,
            mood:            p.mood,
            file_path:       p.fileName,
            analysis_cached: false,
            blob_url:        p.blobUrl,
            isCustom:        true,
        }));

        newTracks.forEach(t => addCustomTrack(t));
        appendToQueue(newTracks);
        setResults(newTracks.map(t => ({ title: t.title, ok: true })));
        setPending([]);

        if (onClose) setTimeout(onClose, 2500);
    }, [pending, addCustomTrack, appendToQueue, onClose]);

    const cancelEdit = useCallback(() => {
        pending.forEach(p => URL.revokeObjectURL(p.blobUrl)); // release memory
        setPending([]);
    }, [pending]);

    // ── Event handlers ───────────────────────────────────────────────────────

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) processFiles(e.target.files);
    }, [processFiles]);

    // ── Phase 3: success screen ───────────────────────────────────────────────

    if (results.length > 0) {
        return (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: `${THEME.colors.status.success}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 4,
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke={THEME.colors.status.success} strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {results.length} {results.length === 1 ? "pista importada" : "pistas importadas"}
                </div>
                {results.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: THEME.colors.text.muted }}>✓ {r.title}</div>
                ))}
                <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 4 }}>
                    Añadidas a la cola · Cerrando...
                </div>
            </div>
        );
    }

    // ── Phase 2: metadata editor ──────────────────────────────────────────────

    if (pending.length > 0) {
        return (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                        Editar metadatos
                    </span>
                    <span style={{ fontSize: 12, color: THEME.colors.text.muted }}>
                        {pending.length} {pending.length === 1 ? "pista" : "pistas"}
                    </span>
                </div>

                {/* Track list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
                    {pending.map(t => (
                        <MetadataRow
                            key={t.id}
                            track={t}
                            onChange={(patch) => updatePending(t.id, patch)}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                    <button
                        onClick={cancelEdit}
                        style={{
                            flex: 1, padding: "9px 0",
                            borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`,
                            backgroundColor: "transparent",
                            color: THEME.colors.text.muted,
                            cursor: "pointer", fontSize: 13,
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmImport}
                        style={{
                            flex: 2, padding: "9px 0",
                            borderRadius: THEME.radius.md,
                            border: "none",
                            backgroundColor: THEME.colors.brand.violet,
                            color: "#fff",
                            cursor: "pointer", fontSize: 13, fontWeight: 700,
                        }}
                    >
                        Confirmar e importar ({pending.length})
                    </button>
                </div>
            </div>
        );
    }

    // ── Phase 1: drop zone ────────────────────────────────────────────────────

    return (
        <div style={{ padding: 16 }}>
            <input
                ref={inputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.flac"
                multiple
                onChange={onInputChange}
                style={{ display: "none" }}
            />

            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? THEME.colors.brand.cyan : THEME.colors.border}`,
                    borderRadius: THEME.radius.lg,
                    padding: "32px 24px",
                    textAlign: "center",
                    cursor: processing ? "wait" : "pointer",
                    backgroundColor: dragging ? `${THEME.colors.brand.cyan}08` : "transparent",
                    transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                }}
            >
                {processing ? (
                    <>
                        <div style={{
                            width: 40, height: 40,
                            border: `3px solid ${THEME.colors.brand.cyan}30`,
                            borderTop: `3px solid ${THEME.colors.brand.cyan}`,
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }} />
                        <div style={{ fontSize: 14, color: THEME.colors.text.muted }}>Leyendo archivos...</div>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: 56, height: 56,
                            borderRadius: THEME.radius.lg,
                            backgroundColor: `${dragging ? THEME.colors.brand.cyan : THEME.colors.brand.violet}15`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                        }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                                stroke={dragging ? THEME.colors.brand.cyan : THEME.colors.brand.violet}
                                strokeWidth="2" strokeLinecap="round">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>

                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                                {dragging ? "Suelta tus archivos" : "Importar MP3s"}
                            </div>
                            <div style={{ fontSize: 12, color: THEME.colors.text.muted, lineHeight: 1.5 }}>
                                Arrastra aquí · o haz click para seleccionar
                                <br />
                                <span style={{ opacity: 0.7 }}>MP3 · WAV · OGG · AAC · M4A · FLAC</span>
                            </div>
                        </div>

                        <div style={{
                            fontSize: 11, color: THEME.colors.text.muted,
                            backgroundColor: "rgba(255,255,255,0.04)",
                            padding: "6px 12px", borderRadius: THEME.radius.sm,
                        }}>
                            Nombre recomendado:{" "}
                            <code style={{ color: THEME.colors.brand.violet }}>Artista - Título.mp3</code>
                        </div>
                    </>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
