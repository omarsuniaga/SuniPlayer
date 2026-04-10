import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { MetadataService } from "../../services/MetadataService";
import { THEME } from "../../data/theme.ts";
import { Track } from "@suniplayer/core";
import { ImportCandidate, SUPPORTED_AUDIO_FILE_ACCEPT, getRelativeAudioPath, isSupportedAudioFile } from "../../features/library/lib/audioImport";
import { analyzeAudio } from "../../services/analysisService.ts";
import { LoadingProgress } from "./LoadingProgress";
import { storage } from "../../platform/index";

const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.round(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

type Mood = "calm" | "happy" | "melancholic" | "energetic";

interface PendingTrack {
    id: string; title: string; artist: string; bpm: number; energy: number; mood: Mood;
    genre?: string; key: string; duration_ms: number; blob_url: string; fileName: string;
    waveform?: number[]; file: File; startTime?: number; endTime?: number;
}

interface ImportZoneProps { onClose?: () => void; externalFiles?: FileList | null; }
export interface ImportZoneHandle { openFilePicker: () => void; openFolderPicker: () => void; }
interface ProgressState { current: number; total: number; label: string; }

export const ImportZone = forwardRef<ImportZoneHandle, ImportZoneProps>(({ onClose, externalFiles }, ref) => {
    const addCustomTrack = useProjectStore(s => s.addCustomTrack);
    const setSelectedFolderName = useLibraryStore((state) => state.setSelectedFolderName);

    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pending, setPending] = useState<PendingTrack[]>([]);
    const [results, setResults] = useState<{ title: string; ok: boolean }[]>([]);
    const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, label: "" });

    const processImportCandidates = useCallback(async (items: ImportCandidate[]) => {
        const arr = items.filter(({ file }) => isSupportedAudioFile(file));
        if (!arr.length) return;

        setProcessing(true);
        setPending([]);
        const tracks: PendingTrack[] = [];
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        try {
            for (const [index, { file, relativePath }] of arr.entries()) {
                setProgress({ current: index, total: arr.length, label: `Analizando ${file.name}...` });
                
                try {
                    const metadata = await MetadataService.extract(file);
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const analysis = await analyzeAudio(audioBuffer);

                    tracks.push({
                        id: `custom_${Date.now()}_${index}_${Math.random().toString(36).slice(2)}`,
                        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
                        artist: metadata.artist || "Artista Desconocido",
                        bpm: Math.round(metadata.bpm || analysis.bpm),
                        energy: analysis.energy,
                        mood: (analysis.energy > 0.7 ? "energetic" : analysis.energy > 0.4 ? "happy" : "calm") as Mood,
                        key: metadata.key || analysis.key,
                        duration_ms: audioBuffer.duration * 1000,
                        blob_url: URL.createObjectURL(file),
                        fileName: getRelativeAudioPath(file, relativePath),
                        waveform: analysis.waveform,
                        file,
                        startTime: 0,
                        endTime: audioBuffer.duration * 1000,
                    });
                } catch (err) {
                    console.error("[ImportZone] Error analizando archivo:", file.name, err);
                }
            }
        } finally {
            await audioCtx.close();
            setProcessing(false);
            setPending(tracks);
        }
    }, []);

    const confirmImport = useCallback(async () => {
        if (pending.length === 0) return;
        setProcessing(true);
        const newTracks: Track[] = [];
        
        console.log(`[ImportZone] Iniciando guardado masivo de ${pending.length} temas...`);

        try {
            for (const [index, p] of pending.entries()) {
                // Indicamos qué estamos haciendo
                setProgress({ current: index, total: pending.length, label: `Guardando ${p.title}...` });
                
                // Pequeño respiro para la UI
                await new Promise(resolve => setTimeout(resolve, 50));

                console.log(`[ImportZone] Paso 1/2: Escribiendo archivos para ${p.id}`);
                // Guardado híbrido
                await storage.saveFullTrack(p.id, p.file, {
                    id: p.id, bpm: p.bpm, key: p.key, energy: p.energy,
                    gainOffset: 0, timestamp: Date.now()
                }, p.waveform);

                const track: Track = {
                    id: p.id, title: p.title, artist: p.artist, bpm: p.bpm, energy: p.energy, mood: p.mood,
                    key: p.key, duration_ms: p.duration_ms, blob_url: p.blob_url, file_path: p.fileName,
                    waveform: p.waveform, startTime: p.startTime, endTime: p.endTime, analysis_cached: true, isCustom: true,
                    metadata: { originalFileName: p.file.name, importedAt: new Date().toISOString(), sourceType: "local" },
                };
                
                addCustomTrack(track);
                newTracks.push(track);
                
                // Actualizamos progreso DESPUÉS del éxito
                setProgress({ current: index + 1, total: pending.length, label: `${p.title} guardado con éxito` });
                console.log(`[ImportZone] Paso 2/2: Confirmado ${p.title} (${index + 1}/${pending.length})`);
            }
            
            setResults(newTracks.map(t => ({ title: `${t.title} - ¡LISTO!`, ok: true })));
            if (onClose) setTimeout(onClose, 1500);
        } catch (e) {
            console.error("[ImportZone] ERROR CRÍTICO EN GUARDADO:", e);
            alert(`Error fatal: ${e instanceof Error ? e.message : "Desconocido"}. Revisa la consola (F12).`);
        } finally {
            setPending([]);
            setProcessing(false);
        }
    }, [pending, addCustomTrack, onClose]);

    if (processing) {
        return <LoadingProgress label="Importando canciones..." detail={progress.label} progress={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} />;
    }

    if (results.length > 0) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: THEME.colors.brand.cyan }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <h3 style={{ margin: 0 }}>¡Importación Finalizada!</h3>
                <p style={{ fontSize: 12, opacity: 0.7, color: "white" }}>{results.length} temas añadidos a tu biblioteca.</p>
            </div>
        );
    }

    if (pending.length > 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", height: "70vh", maxHeight: 500, overflow: "hidden", background: "#0a0a0f", borderRadius: 12, border: `1px solid ${THEME.colors.border}` }}>
                <div style={{ padding: "16px", borderBottom: `1px solid ${THEME.colors.border}20` }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: THEME.colors.brand.cyan }}>CONFIRMAR IMPORTACIÓN</h3>
                </div>

                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px" }} className="no-scrollbar">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {pending.map((t, idx) => (
                            <div key={t.id} style={{ padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    <input value={t.title} onChange={e => { const n = [...pending]; n[idx].title = e.target.value; setPending(n); }} 
                                        style={{ flex: "1 1 180px", background: "#111", border: "1px solid #333", borderRadius: 4, padding: "6px 8px", color: "white", fontSize: 12, fontWeight: 700 }} />
                                    <input value={t.artist} onChange={e => { const n = [...pending]; n[idx].artist = e.target.value; setPending(n); }} 
                                        style={{ flex: "1 1 100px", background: "#111", border: "1px solid #333", borderRadius: 4, padding: "6px 8px", color: "#888", fontSize: 11 }} />
                                </div>
                                <div style={{ fontSize: 9, color: THEME.colors.brand.cyan, fontWeight: 800, opacity: 0.6, marginTop: 4 }}>
                                    {t.bpm} BPM • {t.key} • {formatDuration(t.duration_ms)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: 12, borderTop: `1px solid ${THEME.colors.border}20`, background: "#0a0a0f", display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={confirmImport} style={{ width: "100%", padding: 14, background: THEME.colors.brand.cyan, color: "black", border: "none", borderRadius: 8, fontWeight: 900, cursor: "pointer" }}>
                        GUARDAR {pending.length} TEMAS
                    </button>
                    <button onClick={() => setPending([])} style={{ width: "100%", padding: 8, background: "transparent", border: "none", color: "#666", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>CANCELAR</button>
                </div>
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
                style={{ border: `2px dashed ${dragging ? THEME.colors.brand.cyan : THEME.colors.border}`, borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", backgroundColor: dragging ? "rgba(6,182,212,0.05)" : "transparent" }}
            >
                <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Toca o arrastra tus audios</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 5 }}>MP3, WAV, OGG, FLAC</div>
            </div>
        </div>
    );
});
