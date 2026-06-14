import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { MetadataService } from "../../services/MetadataService";
import { THEME } from "../../data/theme.ts";
import { Track } from "@suniplayer/core";
import { ImportCandidate, SUPPORTED_AUDIO_FILE_ACCEPT, getRelativeAudioPath, isSupportedAudioFile } from "../../features/library/lib/audioImport";
import { analyzeAudio } from "../../services/analysisService.ts";
import { LoadingProgress } from "./LoadingProgress";
import { storage } from "../../platform/index";

type Mood = "calm" | "happy" | "melancholic" | "energetic";
interface ImportZoneProps { onClose?: () => void; externalFiles?: FileList | null; }
export interface ImportZoneHandle { openFilePicker: () => void; openFolderPicker: () => void; }
interface ProgressState { current: number; total: number; label: string; }
interface ImportResult { title: string; ok: boolean; error?: string; }

export const ImportZone = forwardRef<ImportZoneHandle, ImportZoneProps>(({ onClose, externalFiles }, ref) => {
    const addCustomTrack = useProjectStore(s => s.addCustomTrack);
    const setSelectedFolderName = useLibraryStore((state) => state.setSelectedFolderName);

    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, label: "" });

    useImperativeHandle(ref, () => ({
        openFilePicker: () => inputRef.current?.click(),
        openFolderPicker: () => inputRef.current?.click(),
    }));

    const processImportCandidates = useCallback(async (items: ImportCandidate[]) => {
        const arr = items.filter(({ file }) => isSupportedAudioFile(file));
        if (!arr.length) return;

        setProcessing(true);
        setResults([]);
        const importResults: ImportResult[] = [];
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        try {
            for (const [index, { file, relativePath }] of arr.entries()) {
                const label = file.name.length > 30 ? file.name.slice(0, 28) + "…" : file.name;

                // Phase 1: Analyze
                setProgress({ current: index, total: arr.length, label: `Analizando ${label}…` });

                let track: Track | null = null;
                try {
                    const metadata = await MetadataService.extract(file);
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const analysis = await analyzeAudio(audioBuffer);

                    const id = `custom_${Date.now()}_${index}_${Math.random().toString(36).slice(2)}`;
                    const mood: Mood = analysis.energy > 0.7 ? "energetic" : analysis.energy > 0.4 ? "happy" : "calm";

                    // Phase 2: Save
                    setProgress({ current: index, total: arr.length, label: `Guardando ${label}…` });

                    await storage.saveFullTrack(id, file, {
                        id, bpm: Math.round(metadata.bpm || analysis.bpm), key: metadata.key || analysis.key,
                        energy: analysis.energy, gainOffset: 0, timestamp: Date.now()
                    }, analysis.waveform);

                    track = {
                        id,
                        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
                        artist: metadata.artist || "Artista Desconocido",
                        bpm: Math.round(metadata.bpm || analysis.bpm),
                        energy: analysis.energy,
                        mood,
                        key: metadata.key || analysis.key,
                        duration_ms: audioBuffer.duration * 1000,
                        blob_url: URL.createObjectURL(file),
                        file_path: getRelativeAudioPath(file, relativePath),
                        waveform: analysis.waveform,
                        startTime: analysis.startTime,
                        endTime: analysis.endTime,
                        analysis_cached: true,
                        isCustom: true,
                        metadata: { originalFileName: file.name, importedAt: new Date().toISOString(), sourceType: "local" },
                    };

                    addCustomTrack(track);
                    importResults.push({ title: track.title, ok: true });
                    console.log(`[ImportZone] ✓ ${track.title} (${index + 1}/${arr.length})`);
                } catch (err) {
                    console.error("[ImportZone] Error procesando:", file.name, err);
                    importResults.push({ title: file.name.replace(/\.[^/.]+$/, ""), ok: false, error: String(err) });
                }

                setProgress({ current: index + 1, total: arr.length, label: track ? `${track.title} ✓` : `${label} ✗` });
            }
        } finally {
            await audioCtx.close();
            setProcessing(false);
            setResults(importResults);
            if (importResults.some(r => r.ok) && onClose) {
                setTimeout(onClose, 2000);
            }
        }
    }, [addCustomTrack, onClose]);

    if (processing) {
        return <LoadingProgress
            label={`Importando (${progress.current}/${progress.total})…`}
            detail={progress.label}
            progress={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
        />;
    }

    if (results.length > 0) {
        const ok = results.filter(r => r.ok).length;
        const fail = results.filter(r => !r.ok).length;
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{fail === 0 ? "✅" : ok > 0 ? "⚠️" : "❌"}</div>
                <h3 style={{ margin: "0 0 6px", color: THEME.colors.brand.cyan, fontSize: 14, fontWeight: 900 }}>
                    {ok > 0 ? `${ok} tema${ok > 1 ? "s" : ""} importado${ok > 1 ? "s" : ""}` : "No se pudo importar"}
                </h3>
                {fail > 0 && (
                    <p style={{ fontSize: 11, color: THEME.colors.status?.error ?? "#f87171", margin: 0 }}>
                        {fail} archivo{fail > 1 ? "s" : ""} no pudo procesarse. Revisá la consola (F12).
                    </p>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <input
                ref={inputRef}
                type="file"
                accept={SUPPORTED_AUDIO_FILE_ACCEPT}
                multiple
                onChange={e => {
                    if (e.target.files) {
                        processImportCandidates(Array.from(e.target.files).map(f => ({ file: f })));
                    }
                }}
                style={{ display: "none" }}
            />
            <div
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                    e.preventDefault();
                    setDragging(false);
                    if (e.dataTransfer.files) {
                        processImportCandidates(Array.from(e.dataTransfer.files).map(f => ({ file: f })));
                    }
                }}
                style={{
                    border: `2px dashed ${dragging ? THEME.colors.brand.cyan : THEME.colors.border}`,
                    borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer",
                    backgroundColor: dragging ? "rgba(6,182,212,0.05)" : "transparent"
                }}
            >
                <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Toca o arrastra tus audios</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 5 }}>MP3, WAV, OGG, FLAC</div>
            </div>
        </div>
    );
});
