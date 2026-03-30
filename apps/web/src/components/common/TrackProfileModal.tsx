import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Track } from \"@suniplayer/core\";
import { THEME } from "../../data/theme.ts";
import { fmt, fmtFull } from \"@suniplayer/core\";
import { TrackTrimmer } from "./TrackTrimmer.tsx";
import { useLibraryStore } from "../../store/useLibraryStore.ts";
import { analyzeAudio } from "../../services/analysisService.ts";
import { saveAsset, deleteAsset } from "../../services/assetStorage.ts";
import { KEY_OPTIONS, buildTargetKey, describeTranspose, getTransposeSemitones, parseMusicalKey } from "../../features/library/lib/transpose";
import { getPitchEngine } from "../../services/pitchEngine";
import { usePlayerStore } from "../../store/usePlayerStore.ts";

interface TrackProfileModalProps {
    track: Track;
    onSave: (updates: Partial<Track>) => void;
    onCancel: () => void;
}

export const TrackProfileModal: React.FC<TrackProfileModalProps> = ({ track, onSave, onCancel }) => {
    const { availableTags, addTag } = useLibraryStore();
    const [edit, setEdit] = useState<Partial<Track>>({ ...track });
    const [newTag, setNewTag] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTrimmer, setShowTrimmer] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "notes" | "audio" | "sheet">("info");
    const [isUploadingSheet, setIsUploadingSheet] = useState(false);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const setPlaying = usePlayerStore(s => s.setPlaying);
    const mode = usePlayerStore(s => s.mode);
    const wasPlayingRef = useRef(false);

    // En Live Mode la música no se interrumpe al abrir propiedades
    useEffect(() => {
        if (mode === "live") return;
        wasPlayingRef.current = usePlayerStore.getState().playing;
        setPlaying(false);
    }, [mode, setPlaying]);

    const sourceKey = edit.key || track.key || "";
    const targetKey = edit.targetKey || sourceKey;
    const parsedSourceKey = parseMusicalKey(sourceKey);
    const transposeSemitones = getTransposeSemitones(sourceKey, targetKey);
    const playbackTempo = edit.playbackTempo ?? 1.0;

    const handleSave = () => {
        getPitchEngine().stop();
        if (wasPlayingRef.current) setPlaying(true);
        onSave({
            ...edit,
            targetKey,
            transposeSemitones,
            playbackTempo,
        });
    };

    const handlePreview = async () => {
        if (isPreviewPlaying) return;
        const engine = getPitchEngine();
        setIsLoadingPreview(true);
        try {
            const ok = await engine.loadFromPath(track.file_path, track.blob_url ?? undefined);
            if (!ok) throw new Error("Failed to load audio");
            engine.pitchSemitones = transposeSemitones;
            engine.tempo = playbackTempo;
            engine.onTimeUpdate((currentTimeSec: number, _percent: number) => {
                // Auto-stop after 30 seconds of preview
                if (currentTimeSec >= 30) {
                    engine.stop();
                    setIsPreviewPlaying(false);
                }
            });
            engine.play();
            setIsPreviewPlaying(true);
        } catch (err) {
            console.warn("[TrackProfileModal] Preview failed:", err);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleStopPreview = () => {
        getPitchEngine().stop();
        setIsPreviewPlaying(false);
    };

    const handleCancel = () => {
        getPitchEngine().stop();
        setIsPreviewPlaying(false);
        if (wasPlayingRef.current) setPlaying(true);
        onCancel();
    };

    const toggleTag = (tag: string) => {
        const tags = edit.tags || [];
        if (tags.includes(tag)) {
            setEdit({ ...edit, tags: tags.filter(t => t !== tag) });
        } else {
            setEdit({ ...edit, tags: [...tags, tag] });
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && newTag.trim()) {
            addTag(newTag.trim());
            toggleTag(newTag.trim());
            setNewTag("");
        }
    };

    const handleAutoAnalyze = async () => {
        let url = track.blob_url;
        if (!url && track.file_path) {
            url = `/audio/${encodeURI(track.file_path)}`;
        }
        
        if (!url) {
            alert("No se puede analizar: El archivo no tiene una ruta válida.");
            return;
        }

        let audioCtx: AudioContext | null = null;
        try {
            setIsAnalyzing(true);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioCtx = new AudioContextClass();
            
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const results = await analyzeAudio(audioBuffer);
            
            setEdit(prev => ({
                ...prev,
                bpm: results.bpm,
                key: results.key,
                targetKey: prev.targetKey || results.key,
                transposeSemitones: getTransposeSemitones(results.key, prev.targetKey || results.key),
                energy: results.energy,
                mood: results.energy > 0.7 ? "energetic" : results.energy > 0.4 ? "happy" : "calm",
                waveform: results.waveform, // Ensure waveform is also saved!
                analysis_cached: true
            }));
            
            console.log("Analysis results:", results);
        } catch (err) {
            console.error("Analysis failed:", err);
            alert(`Error al analizar el audio: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsAnalyzing(false);
            if (audioCtx) {
                try { await audioCtx.close(); } catch (e) { console.error(e); }
            }
        }
    };

    const handleSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            setIsUploadingSheet(true);
            const newItems: { id: string; type: "pdf" | "image"; name: string }[] = [];
            
            for (const file of files) {
                const isPdf = file.type === "application/pdf";
                const isImg = file.type.startsWith("image/");
                if (!isPdf && !isImg) continue;

                const assetId = `${track.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await saveAsset(assetId, file);
                newItems.push({
                    id: assetId,
                    type: isPdf ? "pdf" : "image",
                    name: file.name
                });
            }

            setEdit(prev => ({
                ...prev,
                sheetMusic: [...(prev.sheetMusic || []), ...newItems]
            }));
        } catch (err) {
            console.error("Sheet upload failed:", err);
            alert("Error al guardar la partitura.");
        } finally {
            setIsUploadingSheet(false);
            e.target.value = ""; // reset input
        }
    };

    const removeSheetItem = async (id: string) => {
        if (!confirm("¿Deseas eliminar este archivo?")) return;
        try {
            await deleteAsset(id);
            setEdit(prev => ({
                ...prev,
                sheetMusic: (prev.sheetMusic || []).filter(item => item.id !== id)
            }));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return createPortal(
        <div style={{
            position: "fixed", inset: 0, zIndex: 9000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 12px",
            backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
            boxSizing: "border-box", overflowY: "auto",
            animation: "fadeIn 0.2s ease-out"
        }}>
            <div style={{
                backgroundColor: "#0D1117",
                border: `1px solid ${THEME.colors.borderLight}`,
                borderRadius: THEME.radius.xl,
                width: "min(500px, 100%)",
                maxHeight: "calc(100vh - 40px)",
                overflow: "hidden",
                minHeight: 0,
                display: "flex", flexDirection: "column",
                boxShadow: `0 0 80px rgba(139,92,246,0.2), 0 30px 100px rgba(0,0,0,0.8)`,
                animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                flexShrink: 0,
            }}>
                {/* Header */}
                <header style={{
                    padding: "20px 24px 0",
                    borderBottom: `1px solid ${THEME.colors.border}`,
                    background: `linear-gradient(to bottom, rgba(139,92,246,0.05), transparent)`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.brand.violet, textTransform: "uppercase", letterSpacing: "0.1em" }}>Track Profile</span>
                            <h3 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{edit.title}</h3>
                            <p style={{ margin: "2px 0 0", fontSize: 14, color: THEME.colors.text.muted }}>{edit.artist}</p>
                        </div>
                        <button onClick={handleCancel} style={{ background: "none", border: "none", color: THEME.colors.text.dim, cursor: "pointer", padding: 4 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                        {(["info", "notes", "audio", "sheet"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: "none", border: "none", padding: "0 0 8px",
                                    fontSize: 13, fontWeight: 700, color: activeTab === tab ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                                    cursor: "pointer", position: "relative", textTransform: "capitalize",
                                    transition: "color 0.2s"
                                }}
                            >
                                {tab === "info" ? "Detalles" : tab === "notes" ? "Notas" : tab === "audio" ? "Recorte" : "Partitura"}
                                {activeTab === tab && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: THEME.colors.brand.cyan, borderRadius: 1 }} />}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content */}
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px" }}>
                    {activeTab === "info" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Título</label>
                                    <input value={edit.title} onChange={e => setEdit({...edit, title: e.target.value})} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Artista / Compositor</label>
                                    <input value={edit.artist} onChange={e => setEdit({...edit, artist: e.target.value})} style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>BPM</label>
                                    <input type="number" value={edit.bpm} onChange={e => setEdit({...edit, bpm: parseInt(e.target.value)})} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Tono (Key)</label>
                                    <input value={edit.key} onChange={e => setEdit({...edit, key: e.target.value})} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Energía</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40 }}>
                                        <input type="range" min={0} max={1} step={0.1} value={edit.energy} onChange={e => setEdit({...edit, energy: parseFloat(e.target.value)})} style={{ flex: 1, accentColor: THEME.colors.brand.cyan }} />
                                        <span style={{ fontSize: 13, color: THEME.colors.brand.cyan, fontWeight: 700 }}>{Math.round((edit.energy || 0)*10)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: "16px 20px", borderRadius: THEME.radius.lg, background: "rgba(255,255,255,0.02)", border: `1px solid ${THEME.colors.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
                                    <div>
                                        <label style={{ ...labelStyle, marginBottom: 4 }}>Transposición y Tempo HD</label>
                                        <div style={{ fontSize: 12, color: THEME.colors.text.muted, lineHeight: 1.5 }}>
                                            Ajusta el tono y la velocidad de forma independiente sin pérdida de calidad (WSOLA).
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <div style={{ padding: "8px 12px", borderRadius: THEME.radius.md, backgroundColor: `${THEME.colors.brand.cyan}12`, color: THEME.colors.brand.cyan, fontSize: 11, fontWeight: 700 }}>
                                            {describeTranspose(transposeSemitones)}
                                        </div>
                                        <div style={{ padding: "8px 12px", borderRadius: THEME.radius.md, backgroundColor: `${THEME.colors.brand.violet}12`, color: THEME.colors.brand.violet, fontSize: 11, fontWeight: 700 }}>
                                            {(edit.playbackTempo ?? 1.0).toFixed(2)}x
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={labelStyle}>Tono detectado/base</label>
                                        <input
                                            value={sourceKey}
                                            onChange={e => setEdit({ ...edit, key: e.target.value })}
                                            style={inputStyle}
                                            placeholder="Ej. C# Major"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Tono objetivo</label>
                                        <select
                                            value={targetKey}
                                            onChange={e => setEdit({ ...edit, targetKey: e.target.value })}
                                            style={{ ...inputStyle, appearance: "none" }}
                                        >
                                            {KEY_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                                    {[-3, -2, -1, 0, 1, 2, 3].map(step => (
                                        <button
                                            key={step}
                                            onClick={() => {
                                                const nextTargetKey = buildTargetKey(sourceKey, step);
                                                if (nextTargetKey) {
                                                    setEdit({ ...edit, targetKey: nextTargetKey, transposeSemitones: step });
                                                }
                                            }}
                                            disabled={!parsedSourceKey}
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: THEME.radius.sm,
                                                border: `1px solid ${transposeSemitones === step ? THEME.colors.brand.violet : THEME.colors.border}`,
                                                backgroundColor: transposeSemitones === step ? `${THEME.colors.brand.violet}15` : "transparent",
                                                color: transposeSemitones === step ? THEME.colors.brand.violet : THEME.colors.text.secondary,
                                                cursor: parsedSourceKey ? "pointer" : "not-allowed",
                                                opacity: parsedSourceKey ? 1 : 0.45,
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {step > 0 ? `+${step}` : step}
                                        </button>
                                    ))}
                                </div>

                                {/* Tempo Slider */}
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <label style={{ ...labelStyle, marginBottom: 0 }}>Velocidad (Tempo)</label>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: THEME.colors.brand.cyan }}>{Math.round(((edit.playbackTempo || 1.0) - 1.0) * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0.8} max={1.2} step={0.01}
                                        aria-label="Velocidad (Tempo)"
                                        value={edit.playbackTempo || 1.0}
                                        onChange={e => setEdit({ ...edit, playbackTempo: parseFloat(e.target.value) })}
                                        style={{ width: "100%", accentColor: THEME.colors.brand.cyan }}
                                    />
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: THEME.colors.text.dim }}>
                                        <span>-20% lento</span>
                                        <span>Normal</span>
                                        <span>+20% rápido</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 16, fontSize: 12, color: THEME.colors.text.muted }}>
                                    {parsedSourceKey
                                        ? <>Original: <strong style={{ color: "white" }}>{sourceKey}</strong> · Objetivo: <strong style={{ color: "white" }}>{targetKey}</strong></>
                                        : <>Escribe un tono valido como `C# Major` o `A Minor` para calcular semitonos.</>}
                                </div>

                                {/* ── Preview ────────────────────────────────────────────────────────────── */}
                                <div style={{
                                    marginTop: 16,
                                    padding: "14px 16px",
                                    borderRadius: THEME.radius.md,
                                    background: "rgba(255,255,255,0.02)",
                                    border: `1px solid ${THEME.colors.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                                            Preview
                                        </div>
                                        <div style={{ fontSize: 12, color: THEME.colors.text.dim }}>
                                            {transposeSemitones === 0 && playbackTempo === 1.0
                                                ? "Sin cambios — tono y tempo originales"
                                                : `${transposeSemitones > 0 ? "+" : ""}${transposeSemitones} st · ${playbackTempo.toFixed(2)}x · 30 seg`}
                                        </div>
                                    </div>

                                    {isPreviewPlaying ? (
                                        <button
                                            onClick={handleStopPreview}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: THEME.radius.md,
                                                border: `1px solid ${THEME.colors.status.error}40`,
                                                background: `${THEME.colors.status.error}10`,
                                                color: THEME.colors.status.error,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                                            Detener
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handlePreview}
                                            disabled={isLoadingPreview || (!track.blob_url && !track.file_path)}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: THEME.radius.md,
                                                border: `1px solid ${THEME.colors.brand.cyan}40`,
                                                background: `${THEME.colors.brand.cyan}10`,
                                                color: isLoadingPreview ? THEME.colors.text.dim : THEME.colors.brand.cyan,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: isLoadingPreview ? "default" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {isLoadingPreview ? (
                                                "Cargando..."
                                            ) : (
                                                <>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                                    Escuchar Preview
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>Categorías / Tags</label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input 
                                            placeholder="+ Nueva" 
                                            value={newTag} 
                                            onChange={e => setNewTag(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            style={{ ...inputStyle, height: 28, width: 100, fontSize: 11, padding: "0 8px", background: "transparent" }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {availableTags.map(tag => {
                                        const isSelected = edit.tags?.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                style={{
                                                    padding: "6px 12px", borderRadius: THEME.radius.full, border: `1px solid ${isSelected ? THEME.colors.brand.violet : THEME.colors.border}`,
                                                    background: isSelected ? `${THEME.colors.brand.violet}15` : "transparent",
                                                    color: isSelected ? THEME.colors.brand.violet : THEME.colors.text.muted,
                                                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Analytics Section */}
                            <div style={{ 
                                padding: "16px 20px", borderRadius: THEME.radius.lg, 
                                background: "rgba(255,255,255,0.02)", 
                                border: `1px solid ${THEME.colors.border}`,
                                marginTop: 8
                            }}>
                                <label style={{ ...labelStyle, color: THEME.colors.brand.cyan, marginBottom: 12 }}>Estadísticas de Rendimiento</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase", fontWeight: 700 }}>Veces Tocado</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginTop: 4 }}>{edit.playCount || 0}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase", fontWeight: 700 }}>Inversión Total</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginTop: 4 }}>{fmtFull(edit.totalPlayTimeMs || 0)}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase", fontWeight: 700 }}>Última Sesión</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.text.secondary, marginTop: 4 }}>
                                            {edit.lastPlayedAt ? new Date(edit.lastPlayedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "notes" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <label style={labelStyle}>Notas para el show (se mostrarán durante la previa)</label>
                            <textarea
                                value={edit.notes || ""}
                                onChange={e => setEdit({...edit, notes: e.target.value})}
                                placeholder="Ej: Intro larga de 4 compases, terminar en fade out..."
                                style={{
                                    ...inputStyle,
                                    height: 200, padding: "12px 16px", resize: "none", fontSize: 14, lineHeight: 1.6
                                }}
                            />
                        </div>
                    )}

                    {activeTab === "audio" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center", padding: "20px 0" }}>
                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${THEME.colors.brand.cyan}10`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.cyan} strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 16 }}>Recortar Segmento</h4>
                                <p style={{ fontSize: 13, color: THEME.colors.text.muted, marginTop: 8, maxWidth: 300, lineHeight: 1.5 }}>
                                    Ajusta el punto de inicio y fin para esta canción. El set se adaptará automáticamente.
                                </p>
                            </div>
                            
                            <div style={{ 
                                padding: "12px 20px", borderRadius: THEME.radius.md, background: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.colors.border}`,
                                display: "flex", gap: 24
                            }}>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase" }}>Inicio</div>
                                    <div style={{ fontSize: 16, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>{fmt(edit.startTime || 0)}</div>
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: 9, color: THEME.colors.text.muted, textTransform: "uppercase" }}>Fin</div>
                                    <div style={{ fontSize: 16, fontFamily: THEME.fonts.mono, fontWeight: 700 }}>{fmt(edit.endTime || edit.duration_ms || 0)}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowTrimmer(true)}
                                style={{
                                    padding: "12px 24px", borderRadius: THEME.radius.md, border: "none",
                                    background: THEME.colors.brand.cyan, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                    boxShadow: `0 8px 24px ${THEME.colors.brand.cyan}30`
                                }}
                            >
                                Abrir Editor de Audio
                            </button>
                        </div>
                    )}

                    {activeTab === "sheet" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div style={{ textAlign: "center", padding: "10px 0" }}>
                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${THEME.colors.brand.violet}10`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.violet} strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                </div>
                                <h4 style={{ margin: 0, fontSize: 16 }}>Partituras y Documentos</h4>
                                <p style={{ fontSize: 13, color: THEME.colors.text.muted, marginTop: 4 }}>Sube PDFs o imágenes de tus arreglos.</p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {edit.sheetMusic?.map((item) => (
                                    <div key={item.id} style={{
                                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                                        backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.colors.border}`, borderRadius: THEME.radius.md
                                    }}>
                                        <div style={{ color: item.type === "pdf" ? "#ff4d4d" : THEME.colors.brand.cyan }}>
                                            {item.type === "pdf" ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                                            <div style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase" }}>{item.type}</div>
                                        </div>
                                        <button
                                            onClick={() => removeSheetItem(item.id)}
                                            style={{ background: "none", border: "none", color: THEME.colors.status.error, cursor: "pointer", padding: 4, display: "flex", opacity: 0.6 }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <label style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                    padding: "16px", borderRadius: THEME.radius.md, border: `2px dashed ${THEME.colors.border}`,
                                    cursor: "pointer", color: THEME.colors.text.muted, transition: "all 0.2s",
                                    marginTop: 8
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{isUploadingSheet ? "Subiendo..." : "Añadir Archivo(s)"}</span>
                                    <input type="file" multiple accept="application/pdf,image/*" onChange={handleSheetUpload} disabled={isUploadingSheet} style={{ display: "none" }} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer style={{ padding: "16px 24px", borderTop: `1px solid ${THEME.colors.border}`, display: "flex", gap: 12, backgroundColor: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
                    <button
                        onClick={handleAutoAnalyze}
                        disabled={isAnalyzing}
                        style={{
                            padding: "0 16px", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.brand.cyan}40`,
                            backgroundColor: "transparent", color: THEME.colors.brand.cyan, fontSize: 13, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 8, opacity: isAnalyzing ? 0.5 : 1
                        }}
                    >
                        {isAnalyzing ? "Analizando..." : "Auto-Analizar"}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: "14px 24px", borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`,
                            backgroundColor: "transparent", color: THEME.colors.text.muted, fontSize: 14, fontWeight: 600, cursor: "pointer"
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: "14px 28px", borderRadius: THEME.radius.md, border: "none",
                            background: THEME.gradients.brand, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer"
                        }}
                    >
                        Guardar Perfil
                    </button>
                </footer>
            </div>

            {showTrimmer && (
                <TrackTrimmer
                    track={track}
                    onSave={(start, end) => {
                        setEdit({ ...edit, startTime: start, endTime: end });
                        setShowTrimmer(false);
                    }}
                    onCancel={() => setShowTrimmer(false)}
                />
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: THEME.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 8
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.md,
    color: "white",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    fontFamily: THEME.fonts.main,
    transition: "border-color 0.2s"
};
