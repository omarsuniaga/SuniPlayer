import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { MetadataService } from "../../services/MetadataService";
import { THEME } from "../../data/theme.ts";
import { Track } from "@suniplayer/core";
import { ImportCandidate, SUPPORTED_AUDIO_FILE_ACCEPT, getRelativeAudioPath, isSupportedAudioFile } from "../../features/library/lib/audioImport";
import { analyzeAudio } from "../../services/analysisService.ts";
import { LoadingProgress } from "./LoadingProgress";

const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.round(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedSeconds = String(seconds).padStart(2, "0");
    return `${minutes}:${paddedSeconds}`;
};

type Mood = "calm" | "happy" | "melancholic" | "energetic";

interface PendingTrack {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    energy: number;
    mood: Mood;
    genre?: string;
    key: string;
    duration_ms: number;
    blob_url: string;
    fileName: string;
    waveform?: number[];
    file: File;
    startTime?: number;
    endTime?: number;
}

interface ImportZoneProps {
    onClose?: () => void;
    externalFiles?: FileList | null;
}

export interface ImportZoneHandle {
    openFilePicker: () => void;
    openFolderPicker: () => void;
}

interface ProgressState {
    current: number;
    total: number;
    label: string;
}

export const ImportZone = forwardRef<ImportZoneHandle, ImportZoneProps>(({ onClose, externalFiles }, ref) => {
    const addCustomTrack = useProjectStore(s => s.addCustomTrack);
    const setSelectedFolderName = useLibraryStore((state) => state.setSelectedFolderName);

    const inputRef = useRef<HTMLInputElement>(null);
    const directoryInputRef = useRef<HTMLInputElement>(null);
    const selectedFolderHandleRef = useRef<any | null>(null);

    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pending, setPending] = useState<PendingTrack[]>([]);
    const [results, setResults] = useState<{ title: string; ok: boolean }[]>([]);
    const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, label: "" });

    const processImportCandidates = useCallback(async (items: ImportCandidate[]) => {
        const arr = items.filter(({ file }) => isSupportedAudioFile(file));
        if (!arr.length) return;

        setProcessing(true);
        setResults([]);
        setProgress({
            current: 0,
            total: arr.length,
            label: arr.length === 1 ? `Procesando ${arr[0].file.name}...` : `Procesando ${arr.length} canciones...`,
        });

        const tracks: PendingTrack[] = [];
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        try {
            for (const [index, { file, relativePath }] of arr.entries()) {
                setProgress({
                    current: index,
                    total: arr.length,
                    label: `Analizando ${file.name}...`,
                });

                const metadata = await MetadataService.extract(file);

                let autoBpm = metadata.bpm || 120;
                let autoKey = metadata.key || "12B";
                let autoEnergy = 0.6;
                let waveform: number[] | undefined;
                let autoStartTime = 0;
                let autoEndTime = metadata.duration * 1000 || 0;

                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const analysis = await analyzeAudio(audioBuffer);
                    autoBpm = metadata.bpm || analysis.bpm;
                    autoKey = metadata.key || analysis.key;
                    autoEnergy = analysis.energy;
                    waveform = analysis.waveform;
                    autoStartTime = analysis.startTime || 0;
                    autoEndTime = analysis.endTime || audioBuffer.duration * 1000;
                } catch (e) {
                    console.error("An�lisis fallido para", file.name, e);
                    if (autoEndTime === 0) autoEndTime = 300000;
                }

                tracks.push({
                    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
                    artist: metadata.artist || "Unknown Artist",
                    genre: metadata.genre,
                    bpm: Math.round(autoBpm),
                    energy: autoEnergy,
                    mood: autoEnergy > 0.7 ? "energetic" : autoEnergy > 0.4 ? "happy" : "calm",
                    key: autoKey,
                    duration_ms: autoEndTime,
                    blob_url: URL.createObjectURL(file),
                    fileName: getRelativeAudioPath(file, relativePath),
                    waveform,
                    file,
                    startTime: autoStartTime,
                    endTime: autoEndTime,
                });

                setProgress({
                    current: index + 1,
                    total: arr.length,
                    label: `Preparando ${index + 1} de ${arr.length}`,
                });
            }
        } finally {
            try { await audioCtx.close(); } catch (e) { console.error(e); }
        }

        setProcessing(false);
        setProgress({
            current: arr.length,
            total: arr.length,
            label: arr.length === 1 ? "Canci�n lista" : `${arr.length} canciones listas`,
        });
        setPending(tracks);
    }, []);

    useEffect(() => {
        if (externalFiles && externalFiles.length > 0 && pending.length === 0 && !processing) {
            processImportCandidates(Array.from(externalFiles).map(f => ({ file: f })));
        }
    }, [externalFiles, pending.length, processing, processImportCandidates]);

    useImperativeHandle(ref, () => ({
        openFilePicker: () => inputRef.current?.click(),
        openFolderPicker: () => openFolderPicker(),
    }));

    useEffect(() => {
        if (!directoryInputRef.current) return;
        directoryInputRef.current.setAttribute("webkitdirectory", "");
        directoryInputRef.current.setAttribute("directory", "");
    }, []);

    const openFolderPicker = useCallback(async () => {
        if (!(window as any).showDirectoryPicker) {
            directoryInputRef.current?.click();
            return;
        }
        try {
            const handle = await (window as any).showDirectoryPicker();
            selectedFolderHandleRef.current = handle;
            setSelectedFolderName(handle.name);

            const files: ImportCandidate[] = [];
            for await (const entry of handle.values()) {
                if (entry.kind === "file") {
                    const file = await entry.getFile();
                    if (isSupportedAudioFile(file)) files.push({ file, relativePath: `${handle.name}/${file.name}` });
                }
            }
            await processImportCandidates(files);
        } catch {
            // user cancelled
        }
    }, [processImportCandidates, setSelectedFolderName]);

    const confirmImport = useCallback(async () => {
        setProcessing(true);
        setProgress({
            current: 0,
            total: pending.length,
            label: pending.length === 1 ? "Guardando canci�n..." : `Guardando ${pending.length} canciones...`,
        });
        const { storage } = await import("../../platform/index");

        const newTracks: Track[] = [];
        try {
            for (const [index, p] of pending.entries()) {
                setResults(prev => [...prev, { title: `Guardando ${p.title}...`, ok: true }]);
                setProgress({
                    current: index,
                    total: pending.length,
                    label: `Guardando ${p.title}...`,
                });

                await storage.saveAudioFile(p.id, p.file);
                await storage.saveAnalysis(p.id, {
                    id: p.id, bpm: p.bpm, key: p.key, energy: p.energy, timestamp: Date.now(),
                });
                if (p.waveform) await storage.saveWaveform(p.id, p.waveform);

                const track: Track = {
                    id: p.id,
                    title: p.title,
                    artist: p.artist,
                    bpm: p.bpm,
                    energy: p.energy,
                    mood: p.mood,
                    genre: p.genre,
                    key: p.key,
                    duration_ms: p.duration_ms,
                    blob_url: p.blob_url,
                    file_path: p.fileName,
                    waveform: p.waveform,
                    // gainOffset: p.gainOffset,
                    startTime: p.startTime,
                    endTime: p.endTime,
                    analysis_cached: true,
                    isCustom: true,
                    metadata: {
                        originalFileName: p.file.name,
                        importedAt: new Date().toISOString(),
                        sourceType: "local",
                    },
                };
                addCustomTrack(track);
                newTracks.push(track);

                setProgress({
                    current: index + 1,
                    total: pending.length,
                    label: `${p.title} lista`,
                });
            }
        } catch (e) {
            console.error("Error en importaci�n cr�tica:", e);
        }

        setResults(newTracks.map(t => ({ title: `${t.title} - �LISTO!`, ok: true })));
        setPending([]);
        setProcessing(false);
        if (onClose) setTimeout(onClose, 2000);
    }, [pending, addCustomTrack, onClose]);

    if (processing) {
        const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

        return (
            <LoadingProgress
                label="Cargando canciones seleccionadas"
                detail={progress.label || "Preparando archivos para tu biblioteca"}
                progress={progressPercent}
            />
        );
    }

    if (results.length > 0) {
        return (
            <div style={{ padding: 30, textAlign: "center" }}>
                <h3 style={{ color: THEME.colors.brand.cyan }}>Importación Exitosa!</h3>
                {results.map((r, i) => <div key={i} style={{ fontSize: 12, opacity: 0.7 }}>? {r.title}</div>)}
            </div>
        );
    }

    if (pending.length > 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 14px 0", minHeight: 0, height: "100%" }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900 }}>Confirmar Importaci�n</h3>
                <div style={{ color: THEME.colors.text.muted, fontSize: 12, lineHeight: 1.5 }}>
                    Revisa las canciones antes de guardarlas. La lista usa ahora todo el espacio disponible del contenedor.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6, paddingBottom: 120 }}>
                    {pending.map(t => (
                        <div key={t.id} style={{ padding: "10px 10px", border: `1px solid ${THEME.colors.border}`, borderRadius: 16, background: "rgba(255,255,255,0.02)" }}>
                            <div>
                            {t.title} 
                            </div>
                            <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>
                                {t.artist} � {t.bpm} BPM � {t.key} � {formatDuration(t.duration_ms)}
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    style={{
                        position: "sticky",
                        bottom: 0,
                        marginTop: "auto",
                        padding: "12px 0 16px",
                        background: "linear-gradient(180deg, rgba(18,24,32,0) 0%, rgba(18,24,32,0.92) 24%, rgba(18,24,32,1) 100%)",
                    }}
                >
                    <button
                        onClick={confirmImport}
                        style={{ width: "100%", padding: 13, background: THEME.colors.brand.cyan, color: "black", border: "none", borderRadius: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 10px 24px ${THEME.colors.brand.cyan}35` }}
                    >
                        GUARDAR EN DISCO VIRTUAL ({pending.length})
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <input
                ref={inputRef}
                type="file"
                accept={SUPPORTED_AUDIO_FILE_ACCEPT}
                multiple
                onChange={e => e.target.files && processImportCandidates(Array.from(e.target.files).map(f => ({ file: f })))}
                style={{ display: "none" }}
            />
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files && processImportCandidates(Array.from(e.dataTransfer.files).map(f => ({ file: f }))); }}
                style={{
                    border: `2px dashed ${dragging ? THEME.colors.brand.cyan : THEME.colors.border}`,
                    borderRadius: 12,
                    padding: 40,
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: dragging ? "rgba(6,182,212,0.05)" : "transparent"
                }}
            >
                <div style={{ fontSize: 40, marginBottom: 10 }}>??</div>
                <div style={{ fontWeight: 700 }}>Arrastra tus MP3 o haz click acá</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 5 }}>Los archivos se guardarán permanentemente en el navegador</div>
            </div>
        </div>
    );
});
