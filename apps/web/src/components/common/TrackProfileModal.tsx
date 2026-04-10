import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Track, Mood } from "@suniplayer/core";
// ... (rest of imports)
import { THEME } from "../../data/theme.ts";
import { fmt, fmtFull } from "@suniplayer/core";
import { useLibraryStore } from "../../store/useLibraryStore.ts";
import { analyzeAudio } from "../../services/analysisService.ts";
import { saveAsset, deleteAsset } from "../../services/assetStorage.ts";
import { KEY_OPTIONS, buildTargetKey, describeTranspose, getTransposeSemitones, parseMusicalKey } from "../../features/library/lib/transpose";
import { getPitchEngine } from "../../services/pitchEngine";
import { getWaveformData } from "../../services/waveformService.ts";
import { Wave } from "./Wave.tsx";

interface TrackProfileModalProps {
    track: Track;
    onSave: (updates: Partial<Track>) => void;
    onCancel: () => void;
}

export const TrackProfileModal: React.FC<TrackProfileModalProps> = ({ track, onSave, onCancel }) => {
    const { availableTags, addTag } = useLibraryStore();
    const [edit, setEdit] = useState<Partial<Track>>({ ...track });
    const [activeTab, setActiveTab] = useState<"audio" | "info" | "notes" | "sheet">("audio");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [waveData, setWaveData] = useState<number[]>([]);

    const sourceKey = edit.key || track.key || "12B";
    const targetKey = edit.targetKey || sourceKey;
    const transposeSemitones = getTransposeSemitones(sourceKey, targetKey);
    const playbackTempo = edit.playbackTempo ?? 1.0;
    const duration = track.duration_ms || 1;

    // Load waveform data
    useEffect(() => {
        const url = track.blob_url ?? `/audio/${encodeURIComponent(track.file_path || "")}`;
        getWaveformData(url, track.id, 200).then(data => setWaveData(data));
    }, [track]);

    const handleSave = () => {
        handleStopPreview();
        onSave({ ...edit, targetKey, transposeSemitones, playbackTempo });
    };

    const handlePreview = async () => {
        if (isPreviewPlaying) return;
        const engine = getPitchEngine();
        setIsLoadingPreview(true);
        try {
            const ok = await engine.load(track.blob_url || `/audio/${encodeURIComponent(track.file_path || "")}`);
            if (!ok) throw new Error("Failed to load audio");
            
            // Configurar motor antes de play
            engine.pitchSemitones = transposeSemitones;
            engine.tempo = playbackTempo;
            engine.limitMs = edit.endTime || duration; // Set end limit
            
            // Buscar punto de inicio
            const startSec = (edit.startTime || 0) / 1000;
            engine.seekToTime(startSec);
            
            engine.play();
            setIsPreviewPlaying(true);
        } catch (err) { console.warn(err); } finally { setIsLoadingPreview(false); }
    };

    const handleStopPreview = () => { getPitchEngine().stop(); setIsPreviewPlaying(false); };
    const handleCancel = () => { handleStopPreview(); onCancel(); };

    const startPct = ((edit.startTime || 0) / duration) * 100;
    const endPct = ((edit.endTime || duration) / duration) * 100;

    // ── REAL-TIME MOTOR SYNC ──
    useEffect(() => {
        if (isPreviewPlaying) {
            const engine = getPitchEngine();
            engine.pitchSemitones = transposeSemitones;
            engine.tempo = playbackTempo;
        }
    }, [transposeSemitones, playbackTempo, isPreviewPlaying]);

    return createPortal(
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)",
            padding: 12, boxSizing: "border-box", animation: "fadeIn 0.2s"
        }}>
            <div style={{
                backgroundColor: "#0a0a0f", border: `1px solid ${THEME.colors.border}`,
                borderRadius: 12, width: "min(600px, 100%)", maxHeight: "95vh",
                overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: `0 0 100px rgba(0,255,255,0.1), 0 40px 120px rgba(0,0,0,0.9)`,
            }}>
                <header style={{ padding: "12px 20px", borderBottom: `1px solid ${THEME.colors.border}20`, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <span style={{ fontSize: 9, fontWeight: 900, color: THEME.colors.brand.cyan, textTransform: "uppercase", letterSpacing: 1.5 }}>Ficha Técnica</span>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "white" }}>{edit.title}</h3>
                        </div>
                        <button onClick={isPreviewPlaying ? handleStopPreview : handlePreview} style={{ background: isPreviewPlaying ? THEME.colors.status.error : "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, padding: "6px 12px", color: "white", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
                            {isLoadingPreview ? "..." : (isPreviewPlaying ? "DETENER" : "PROBAR AUDIO")}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        {(["audio", "info", "notes", "sheet"] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} style={{ background: "none", border: "none", padding: "4px 0", fontSize: 11, fontWeight: 800, color: activeTab === t ? THEME.colors.brand.cyan : "#555", cursor: "pointer", textTransform: "uppercase", borderBottom: `2px solid ${activeTab === t ? THEME.colors.brand.cyan : "transparent"}` }}>
                                {t === "audio" ? "Motor" : t === "info" ? "Info" : t === "notes" ? "Notas" : "Papel"}
                            </button>
                        ))}
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }} className="no-scrollbar">
                    {activeTab === "audio" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {/* 🌊 INTEGRATED TRIMMER VISUALIZER */}
                            <div style={{ position: "relative", height: 80, background: "rgba(0,0,0,0.4)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Wave data={waveData.length > 0 ? waveData : Array(100).fill(0.1)} progress={0} color="#333" />
                                
                                {/* Trimming Mask */}
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${startPct}%`, background: "rgba(0,0,0,0.6)" }} />
                                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - endPct}%`, background: "rgba(0,0,0,0.6)" }} />
                                
                                {/* Active Wave Highlight */}
                                <div style={{ position: "absolute", left: `${startPct}%`, width: `${endPct - startPct}%`, top: 0, bottom: 0, borderLeft: "1px solid cyan", borderRight: "1px solid cyan", overflow: "hidden" }}>
                                    <Wave data={waveData} progress={0} color={THEME.colors.brand.cyan} />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 16 }}>
                                    <div><label style={labelStyle}>Inicio</label><div style={{ fontSize: 13, fontFamily: THEME.fonts.mono }}>{fmt(edit.startTime || 0)}</div></div>
                                    <div><label style={labelStyle}>Fin</label><div style={{ fontSize: 13, fontFamily: THEME.fonts.mono }}>{fmt(edit.endTime || duration)}</div></div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <label style={labelStyle}>Duración Real</label>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: THEME.colors.brand.cyan }}>{fmt((edit.endTime || duration) - (edit.startTime || 0))}</div>
                                </div>
                            </div>

                            <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
                                <input type="range" min={0} max={duration} step={100} value={edit.startTime || 0} onChange={e => setEdit({...edit, startTime: Math.min(parseInt(e.target.value), (edit.endTime || duration) - 1000)})} className="range-slider" style={{ position: "absolute", width: "100%", accentColor: THEME.colors.brand.cyan, zIndex: 2 }} />
                                <input type="range" min={0} max={duration} step={100} value={edit.endTime || duration} onChange={e => setEdit({...edit, endTime: Math.max(parseInt(e.target.value), (edit.startTime || 0) + 1000)})} className="range-slider" style={{ position: "absolute", width: "100%", accentColor: THEME.colors.brand.violet, zIndex: 1 }} />
                            </div>

                            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />

                            {/* BPM & KEY */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${THEME.colors.border}20` }}>
                                    <label style={labelStyle}>BPM Ajustado</label>
                                    <input type="number" value={edit.bpm} onChange={e => setEdit({...edit, bpm: parseInt(e.target.value)})} style={inputStyleCompact} />
                                </div>
                                <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${THEME.colors.border}20` }}>
                                    <label style={labelStyle}>Tono Objetivo</label>
                                    <select value={targetKey} onChange={e => setEdit({...edit, targetKey: e.target.value})} style={inputStyleCompact}>
                                        {KEY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* GAIN & SPEED */}
                            <div style={{ padding: 12, borderRadius: 8, background: `${THEME.colors.brand.violet}05`, border: `1px solid ${THEME.colors.brand.violet}20` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, color: THEME.colors.brand.violet }}>NORMALIZACIÓN (dB)</span>
                                    <span style={{ fontSize: 11, fontWeight: 900 }}>{(edit.gainOffset ?? 0) > 0 ? "+" : ""}{edit.gainOffset || 0}dB</span>
                                </div>
                                <input type="range" min={-6} max={6} step={0.5} value={edit.gainOffset || 0} onChange={e => setEdit({...edit, gainOffset: parseFloat(e.target.value)})} style={{ width: "100%", accentColor: THEME.colors.brand.violet }} />
                                
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, marginBottom: 8 }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, color: THEME.colors.brand.cyan }}>VELOCIDAD (TEMPO)</span>
                                    <span style={{ fontSize: 11, fontWeight: 900 }}>{Math.round(((edit.playbackTempo || 1.0) - 1.0) * 100)}%</span>
                                </div>
                                <input type="range" min={0.8} max={1.2} step={0.01} value={edit.playbackTempo || 1.0} onChange={e => setEdit({...edit, playbackTempo: parseFloat(e.target.value)})} style={{ width: "100%", accentColor: THEME.colors.brand.cyan }} />
                            </div>
                        </div>
                    )}

                    {activeTab === "info" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div><label style={labelStyle}>Título</label><input value={edit.title} onChange={e => setEdit({...edit, title: e.target.value})} style={inputStyleCompact} /></div>
                            <div><label style={labelStyle}>Artista</label><input value={edit.artist} onChange={e => setEdit({...edit, artist: e.target.value})} style={inputStyleCompact} /></div>
                            <div>
                                <label style={labelStyle}>Mood / Energía</label>
                                <div style={{ display: "flex", gap: 4 }}>
                                    {(["calm", "happy", "melancholic", "energetic"] as const).map(m => (
                                        <button key={m} onClick={() => setEdit({...edit, mood: m})} style={{ flex: 1, padding: "8px", borderRadius: 4, border: `1px solid ${edit.mood === m ? THEME.colors.brand.cyan : "#222"}`, background: edit.mood === m ? `${THEME.colors.brand.cyan}10` : "transparent", color: edit.mood === m ? THEME.colors.brand.cyan : "#555", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{m}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "notes" && <textarea value={edit.notes || ""} onChange={e => setEdit({...edit, notes: e.target.value})} placeholder="Instrucciones para el show..." style={{ ...inputStyleCompact, height: 200, resize: "none", padding: 12 }} />}

                    {activeTab === "sheet" && (
                        <div style={{ textAlign: "center", padding: 20 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                            <p style={{ fontSize: 12, color: "#888" }}>Gestión de partituras (PDF/Imagen).</p>
                            <button style={{ padding: "10px 20px", borderRadius: 6, border: `1px dashed #444`, background: "transparent", color: "#666", fontSize: 11, fontWeight: 700 }}>SUBIR ARCHIVO</button>
                        </div>
                    )}
                </div>

                <footer style={{ padding: "12px 20px", borderTop: `1px solid ${THEME.colors.border}20`, display: "flex", gap: 10, background: "rgba(0,0,0,0.3)" }}>
                    <button onClick={handleCancel} style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid #333`, background: "transparent", color: "#888", fontSize: 12, fontWeight: 700 }}>CANCELAR</button>
                    <button onClick={handleSave} style={{ flex: 2, padding: 12, borderRadius: 6, border: "none", background: THEME.colors.brand.cyan, color: "black", fontSize: 12, fontWeight: 900 }}>GUARDAR CAMBIOS</button>
                </footer>
            </div>
            <style>{`
                .range-slider { appearance: none; background: transparent; pointer-events: none; }
                .range-slider::-webkit-slider-thumb { appearance: none; pointer-events: auto; width: 16px; height: 16px; border-radius: 50%; background: white; border: 2px solid currentColor; cursor: pointer; }
            `}</style>
        </div>,
        document.body
    );
};

const labelStyle: React.CSSProperties = { fontSize: 8, fontWeight: 900, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, display: "block" };
const inputStyleCompact: React.CSSProperties = { width: "100%", height: 32, background: "#111", border: "1px solid #333", borderRadius: 4, padding: "0 10px", color: "white", fontSize: 13, outline: "none" };
