/**
 * ImportZone â€” Zona de importaciÃ³n profesional con soporte para persistencia binaria.
 */
import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { THEME } from "../../data/theme.ts";
import { Track } from "@suniplayer/core";
import { ImportCandidate, getRelativeAudioPath, isSupportedAudioFile, parseTrackName } from "../../features/library/lib/audioImport";
import { analyzeAudio } from "../../services/analysisService.ts";

// â”€â”€ Tipos y Constantes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MOODS = ["calm", "happy", "melancholic", "energetic"] as const;
type Mood = typeof MOODS[number];

const MOOD_LABELS: Record<Mood, string> = {
    calm:        "Tranquilo",
    happy:       "Alegre",
    melancholic: "MelancÃ³lico",
    energetic:   "EnÃ©rgico",
};

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
    waveform?: number[];
    file: File;
    startTime?: number;
    endTime?: number;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Componente Principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ImportZoneProps {
    onClose?: () => void;
    externalFiles?: FileList | null;
}

export interface ImportZoneHandle {
    openFilePicker: () => void;
    openFolderPicker: () => void;
}

export const ImportZone = forwardRef<ImportZoneHandle, ImportZoneProps>(({ onClose, externalFiles }, ref) => {
    const addCustomTrack = useProjectStore(s => s.addCustomTrack);
    const appendToQueue  = useProjectStore(s => s.appendToQueue);
    const selectedFolderName = useLibraryStore((state) => state.selectedFolderName);
    const setSelectedFolderName = useLibraryStore((state) => state.setSelectedFolderName);

    const inputRef = useRef<HTMLInputElement>(null);
    const directoryInputRef = useRef<HTMLInputElement>(null);
    const selectedFolderHandleRef = useRef<any | null>(null);
    
    const [dragging,   setDragging]   = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pending,    setPending]    = useState<PendingTrack[]>([]);
    const [results,    setResults]    = useState<{ title: string; ok: boolean }[]>([]);
    const [importSourceLabel, setImportSourceLabel] = useState<string | null>(selectedFolderName);

    // Procesar archivos externos si vienen (iPad Fix)
    useEffect(() => {
        if (externalFiles && externalFiles.length > 0 && pending.length === 0 && !processing) {
            processImportCandidates(Array.from(externalFiles).map(f => ({ file: f })));
        }
    }, [externalFiles, pending.length, processing]);

    // Exponer mÃ©todos al padre (Library)
    useImperativeHandle(ref, () => ({
        openFilePicker: () => inputRef.current?.click(),
        openFolderPicker: () => openFolderPicker(),
    }));

    useEffect(() => {
        if (!directoryInputRef.current) return;
        directoryInputRef.current.setAttribute("webkitdirectory", "");
        directoryInputRef.current.setAttribute("directory", "");
    }, []);

    const processImportCandidates = useCallback(async (items: ImportCandidate[]) => {
        const arr = items.filter(({ file }) => isSupportedAudioFile(file));
        if (!arr.length) return;

        setProcessing(true);
        const tracks: PendingTrack[] = [];
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        try {
            for (const { file, relativePath } of arr) {
                const blobUrl = URL.createObjectURL(file);
                
                // Usar el nombre del archivo real como tÃ­tulo por defecto
                // Quitamos la extensiÃ³n (.mp3, .wav, etc.)
                const fileNameClean = file.name.replace(/\.[^/.]+$/, "");
                const { title: parsedTitle, artist: parsedArtist } = parseTrackName(file.name);
                
                // Prioridad: Nombre de archivo limpio si el usuario no tiene metadatos claros
                const title = parsedTitle && parsedTitle !== file.name ? parsedTitle : fileNameClean;
                const artist = parsedArtist || "Artista Local";

                const duration_ms = await readDuration(file);
                
                let autoBpm = 120;
                let autoKey = "C";
                let autoEnergy = 0.6;
                let waveform: number[] | undefined = undefined;

                // Auto-Trim Detection
                let autoStartTime = 0;
                let autoEndTime = duration_ms;

                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const { analyzeAudio } = await import("../../services/analysisService.ts");
                    const analysis = await analyzeAudio(audioBuffer);
                    autoBpm = analysis.bpm;
                    autoKey = analysis.key;
                    autoEnergy = analysis.energy;
                    waveform = analysis.waveform;
                    autoStartTime = analysis.startTime || 0;
                    autoEndTime = analysis.endTime || duration_ms;
                } catch (e) {
                    console.error("AnÃ¡lisis fallido para", file.name, e);
                }

                tracks.push({
                    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    title,
                    artist,
                    bpm: autoBpm,
                    energy: autoEnergy,
                    mood: autoEnergy > 0.7 ? "energetic" : autoEnergy > 0.4 ? "happy" : "calm",
                    key: autoKey,
                    duration_ms,
                    blobUrl,
                    fileName: getRelativeAudioPath(file, relativePath),
                    waveform,
                    file,
                    startTime: autoStartTime, // ðŸŸ¢ Aplicar Auto-Trim
                    endTime: autoEndTime,     // ðŸŸ¢ Aplicar Auto-Trim
                });
            }
        } finally {
            try { await audioCtx.close(); } catch (e) { console.error(e); }
        }

        setProcessing(false);
        setPending(tracks);
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
            setImportSourceLabel(handle.name);
            
            // Recolectar archivos (simplificado para brevedad)
            const files: ImportCandidate[] = [];
            for await (const entry of handle.values()) {
                if (entry.kind === "file") {
                    const file = await entry.getFile();
                    if (isSupportedAudioFile(file)) files.push({ file, relativePath: `${handle.name}/${file.name}` });
                }
            }
            await processImportCandidates(files);
        } catch { }
    }, [processImportCandidates, setSelectedFolderName]);

    const confirmImport = useCallback(async () => {
        setProcessing(true);
        const { storage } = await import("../../platform/index");
        
        const newTracks: Track[] = [];
        try {
            for (const p of pending) {
                setResults(prev => [...prev, { title: `Guardando ${p.title}...`, ok: true }]);
                
                // Guardado fÃ­sico real
                await storage.saveAudioFile(p.id, p.file);
                await storage.saveAnalysis(p.id, {
                    id: p.id, bpm: p.bpm, key: p.key, energy: p.energy, timestamp: Date.now()
                });
                if (p.waveform) await storage.saveWaveform(p.id, p.waveform);
                
                const track: Track = {
                    ...p,
                    analysis_cached: true,
                    isCustom: true,
                };
                addCustomTrack(track);
                newTracks.push(track);
            }
        } catch (e) {
            console.error("Error en importaciÃ³n crÃ­tica:", e);
        }

        appendToQueue(newTracks);
        setResults(newTracks.map(t => ({ title: `${t.title} - Â¡LISTO!`, ok: true })));
        setPending([]);
        setProcessing(false);
        if (onClose) setTimeout(onClose, 2000);
    }, [pending, addCustomTrack, appendToQueue, onClose]);

    if (results.length > 0) {
        return (
            <div style={{ padding: 30, textAlign: "center" }}>
                <h3 style={{ color: THEME.colors.brand.cyan }}>Â¡ImportaciÃ³n Exitosa!</h3>
                {results.map((r, i) => <div key={i} style={{ fontSize: 12, opacity: 0.7 }}>âœ“ {r.title}</div>)}
            </div>
        );
    }

    if (pending.length > 0) {
        return (
            <div style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 15px" }}>Confirmar Metadatos</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
                    {pending.map(t => (
                        <div key={t.id} style={{ padding: 10, border: `1px solid ${THEME.colors.border}`, borderRadius: 8 }}>
                            <strong>{t.title}</strong> - {t.bpm} BPM
                        </div>
                    ))}
                </div>
                <button 
                    onClick={confirmImport}
                    style={{ marginTop: 15, width: "100%", padding: 12, background: THEME.colors.brand.cyan, color: "black", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
                >
                    GUARDAR EN DISCO VIRTUAL ({pending.length})
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <input ref={inputRef} type="file" accept="audio/*" multiple onChange={e => e.target.files && processImportCandidates(Array.from(e.target.files).map(f => ({ file: f })))} style={{ display: "none" }} />
            <div 
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files && processImportCandidates(Array.from(e.dataTransfer.files).map(f => ({ file: f }))); }}
                style={{
                    border: `2px dashed ${dragging ? THEME.colors.brand.cyan : THEME.colors.border}`,
                    borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer",
                    backgroundColor: dragging ? "rgba(6,182,212,0.05)" : "transparent"
                }}
            >
                <div style={{ fontSize: 40, marginBottom: 10 }}>ðŸ“</div>
                <div style={{ fontWeight: 700 }}>ArrastrÃ¡ tus MP3 o hacÃ© click acÃ¡</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 5 }}>Los archivos se guardarÃ¡n permanentemente en el navegador</div>
            </div>
        </div>
    );
});
