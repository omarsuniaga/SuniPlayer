/**
 * ImportZone — Drag & drop / file-picker for user MP3 files
 *
 * Reads audio metadata (duration), parses title/artist from filename,
 * creates a blob URL, and adds the track to the store's customTracks.
 */
import React, { useRef, useState, useCallback } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { THEME } from "../../data/theme.ts";
import { Track } from "../../types";

const MOODS = ["calm", "happy", "melancholic", "energetic"] as const;
void MOODS; // referenced for future mood picker

/** Parse "Artist - Title.mp3" → { artist, title } with smart fallbacks */
function parseName(filename: string): { title: string; artist: string } {
    const base = filename.replace(/\.[^/.]+$/, ""); // remove extension
    const parts = base.split(" - ");
    if (parts.length >= 2) {
        return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
    }
    return { artist: "Unknown Artist", title: base.trim() };
}

/** Read audio file duration via HTMLAudioElement */
function readDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        audio.addEventListener("loadedmetadata", () => {
            const ms = Math.round(audio.duration * 1000);
            URL.revokeObjectURL(url); // free temporary URL immediately
            resolve(ms > 0 ? ms : 180_000); // fallback 3min
        });
        audio.addEventListener("error", () => {
            URL.revokeObjectURL(url);
            resolve(180_000);
        });
        audio.src = url;
    });
}

interface Props { onClose?: () => void }

export const ImportZone: React.FC<Props> = ({ onClose }) => {
    const addCustomTrack = useProjectStore(s => s.addCustomTrack);
    const appendToQueue = useProjectStore(s => s.appendToQueue);

    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<{ title: string; ok: boolean }[]>([]);

    const processFiles = useCallback(async (files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i));
        if (!arr.length) return;

        setProcessing(true);
        const newTracks: Track[] = [];

        for (const file of arr) {
            const blobUrl = URL.createObjectURL(file);
            const { title, artist } = parseName(file.name);
            const duration_ms = await readDuration(file);

            const track: Track = {
                id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                title,
                artist,
                duration_ms,
                bpm: 120,
                key: "C",
                energy: 0.6,
                mood: "calm",
                file_path: file.name,
                analysis_cached: false,
                blob_url: blobUrl,
                isCustom: true,
            };

            addCustomTrack(track);
            appendToQueue([track]);
            newTracks.push(track);
        }

        setResults(newTracks.map(t => ({ title: t.title, ok: true })));
        setProcessing(false);

        // Auto-close after 2.5 seconds
        if (onClose) setTimeout(onClose, 2500);
    }, [addCustomTrack, appendToQueue, onClose]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) processFiles(e.target.files);
    }, [processFiles]);

    if (results.length > 0) {
        return (
            <div style={{
                padding: 20,
                display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: `${THEME.colors.status.success}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 4,
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.success} strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {results.length} {results.length === 1 ? "pista importada" : "pistas importadas"}
                </div>
                {results.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: THEME.colors.text.muted }}>
                        ✓ {r.title}
                    </div>
                ))}
                <div style={{ fontSize: 11, color: THEME.colors.text.muted, marginTop: 4 }}>
                    Añadidas a la cola · Cerrando...
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 16 }}>
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.flac"
                multiple
                onChange={onInputChange}
                style={{ display: "none" }}
            />

            {/* Drop zone */}
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
                        <div style={{ fontSize: 14, color: THEME.colors.text.muted }}>Procesando archivos...</div>
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
                                <span style={{ color: THEME.colors.text.muted, opacity: 0.7 }}>
                                    MP3 · WAV · OGG · AAC · M4A · FLAC
                                </span>
                            </div>
                        </div>

                        <div style={{
                            fontSize: 11, color: THEME.colors.text.muted,
                            backgroundColor: "rgba(255,255,255,0.04)",
                            padding: "6px 12px",
                            borderRadius: THEME.radius.sm,
                        }}>
                            Nombre recomendado: <code style={{ color: THEME.colors.brand.violet }}>Artista - Título.mp3</code>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
