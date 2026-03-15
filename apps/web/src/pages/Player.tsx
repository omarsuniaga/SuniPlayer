import React, { useEffect, useState } from "react";
import { useProjectStore, setTrackTrim, updateTrackMetadata } from "../store/useProjectStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { THEME } from "../data/theme.ts";
import { Wave } from "../components/common/Wave.tsx";
import { fmt, fmtM, mc } from "../services/uiUtils.ts";
import { sumTrackDurationMs } from "../utils/trackMetrics.ts";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { Track } from "../types";
import { SheetMusicViewer } from "../components/common/SheetMusicViewer";
import { Dashboard } from "../components/player/Dashboard";
import { LiveUnlockModal } from "../components/player/LiveUnlockModal";
import { getWaveformData } from "../services/waveformService";

// ── Player Page ───────────────────────────────────────────────────────────────
export const Player: React.FC = () => {
    // ── Store Selectors ──
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const pos = useProjectStore(s => s.pos);
    const playing = useProjectStore(s => s.playing);
    const setPos = useProjectStore(s => s.setPos);
    const setCi = useProjectStore(s => s.setCi);
    const setPlaying = useProjectStore(s => s.setPlaying);
    const setVol = useProjectStore(s => s.setVol);
    const setMode = useProjectStore(s => s.setMode);
    const setPQueue = useProjectStore(s => s.setPQueue);

    const vol = useProjectStore(s => s.vol);
    const mode = useProjectStore(s => s.mode);
    const elapsed = useProjectStore(s => s.elapsed);

    const fadeEnabled = useProjectStore(s => s.fadeEnabled);
    const setFadeEnabled = useProjectStore(s => s.setFadeEnabled);
    const crossfade = useProjectStore(s => s.crossfade);
    const setCrossfade = useProjectStore(s => s.setCrossfade);
    const crossfadeMs = useProjectStore(s => s.crossfadeMs);
    const setCrossfadeMs = useProjectStore(s => s.setCrossfadeMs);
    const fadeInMs = useProjectStore(s => s.fadeInMs);
    const setFadeInMs = useProjectStore(s => s.setFadeInMs);
    const fadeOutMs = useSettingsStore(s => s.fadeOutMs);
    const setFadeOutMs = useProjectStore(s => s.setFadeOutMs);

    const splMeterEnabled = useProjectStore(s => s.splMeterEnabled);
    const setSplMeterEnabled = useProjectStore(s => s.setSplMeterEnabled);
    const splMeterTarget = useProjectStore(s => s.splMeterTarget);
    const splMeterExpanded = useProjectStore(s => s.splMeterExpanded);
    const setSplMeterExpanded = useProjectStore(s => s.setSplMeterExpanded);
    const fadeExpanded = useProjectStore(s => s.fadeExpanded);
    const setFadeExpanded = useProjectStore(s => s.setFadeExpanded);
    const crossExpanded = useProjectStore(s => s.crossExpanded);
    const setCrossExpanded = useProjectStore(s => s.setCrossExpanded);
    const isSimulating = useProjectStore(s => s.isSimulating);
    const stackOrder = useProjectStore(s => s.stackOrder);
    const setStackOrder = useProjectStore(s => s.setStackOrder);

    const performanceMode = useSettingsStore(s => s.performanceMode);
    const setPerformanceMode = useSettingsStore(s => s.setPerformanceMode);

    // ── UI State ──
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const [viewingSheetTrack, setViewingSheetTrack] = useState<Track | null>(null);
    const [showQueue, setShowQueue] = useState(window.innerWidth > 1000);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

    // Dynamic resize tracking
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 800);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const ct = pQueue[ci];
    const isLive = mode === "live";

    // ── Logic ──
    const mCol = mc(ct?.mood);
    const tCol = playing ? mCol : THEME.colors.text.muted;
    const durMs = ct?.duration_ms || 1;
    const rem = Math.max(0, durMs - pos);
    const tPct = Math.min(1, pos / durMs);
    const prog = pos / durMs;
    const qTot = sumTrackDurationMs(pQueue);

    const [currentWave, setCurrentWave] = useState<number[]>([]);
    const isLoadingWave = Boolean(ct) && currentWave.length === 0;

    useEffect(() => {
        if (!ct) return;

        let cancelled = false;
        const url = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;
        getWaveformData(url)
            .then((waveform) => {
                if (!cancelled) {
                    setCurrentWave(waveform);
                }
            });

        return () => {
            cancelled = true;
            setCurrentWave([]);
        };
    }, [ct]);

    // ── Handlers ──
    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isLive || !ct) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const p = (e.clientX - rect.left) / rect.width;
        setPos(p * ct.duration_ms);
    };

    const handleModeToggle = () => {
        if (isLive) setShowUnlockModal(true);
        else setMode("live");
    };

    const handleQueueClick = (track: Track) => {
        if (isLive) {
            if (ct?.id === track.id) return;
            setStackOrder(prev => {
                if (prev.includes(track.id)) {
                    return prev.filter(id => id !== track.id);
                } else {
                    return [...prev, track.id];
                }
            });
            return;
        }
        const idx = pQueue.findIndex(t => t.id === track.id);
        if (idx !== -1) {
            setCi(idx);
            setPos(0);
            setStackOrder([]);
        }
    };

    const onDrop = (dragIdx: number, targetIndex: number) => {
        if (isLive) return;
        const newQueue = [...pQueue];
        const [movedItem] = newQueue.splice(dragIdx, 1);
        newQueue.splice(targetIndex, 0, movedItem);
        setPQueue(newQueue);
        setStackOrder([]);
        if (ci === dragIdx) setCi(targetIndex);
        else if (ci > dragIdx && ci <= targetIndex) setCi(ci - 1);
        else if (ci < dragIdx && ci >= targetIndex) setCi(ci + 1);
    };

    return (
        <div style={{
            height: "100%", width: "100%",
            display: "flex", backgroundColor: THEME.colors.bg,
            color: THEME.colors.text.primary, overflow: "hidden"
        }}>
            {showUnlockModal && <LiveUnlockModal onConfirm={() => { setMode("edit"); setShowUnlockModal(false); }} onCancel={() => setShowUnlockModal(false)} />}

            {/* Central Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", overflowY: "auto", gap: performanceMode ? 40 : 32 }}>

                    {/* Status Banners */}
                    {isSimulating && playing && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: THEME.radius.md, backgroundColor: `${THEME.colors.status.warning}10`, border: `1px solid ${THEME.colors.status.warning}30` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <span style={{ fontSize: 12, color: THEME.colors.status.warning, fontWeight: 700 }}>MODO SIMULACIÓN ACTIVO</span>
                        </div>
                    )}

                    {/* 1. SECCIÓN CABECERA */}
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <h1 style={{ fontSize: performanceMode ? 48 : 36, fontWeight: 900, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{ct?.title || "--"}</h1>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => setProfileTrack(ct)} title="Perfil de Canción" style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.colors.text.muted, cursor: "pointer", transition: "all 0.2s" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>
                                        {ct?.sheetMusic && ct.sheetMusic.length > 0 && (
                                            <button onClick={() => setViewingSheetTrack(ct)} title="Ver Partitura" style={{ background: "rgba(139,92,246,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.colors.brand.violet, cursor: "pointer", transition: "all 0.2s" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></button>
                                        )}
                                    </div>
                            </div>
                            <p style={{ fontSize: performanceMode ? 22 : 18, color: THEME.colors.text.muted, margin: "4px 0 16px" }}>{ct?.artist || "--"}</p>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {ct && (
                                    <>
                                        <span style={{ fontSize: performanceMode ? 12 : 10, padding: "4px 10px", borderRadius: 4, background: THEME.colors.brand.cyan + "15", color: THEME.colors.brand.cyan, fontWeight: 800 }}>{ct.bpm} BPM</span>
                                        <span style={{ fontSize: performanceMode ? 12 : 10, padding: "4px 10px", borderRadius: 4, background: THEME.colors.brand.violet + "15", color: THEME.colors.brand.violet, fontWeight: 800 }}>{ct.key}</span>
                                        <span style={{ fontSize: performanceMode ? 12 : 10, padding: "4px 10px", borderRadius: 4, background: mc(ct.mood) + "15", color: mc(ct.mood), fontWeight: 800 }}>{ct.mood}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ position: "relative", width: performanceMode ? 120 : 90, height: performanceMode ? 120 : 90, flexShrink: 0 }}>
                            <svg width={performanceMode ? 120 : 90} height={performanceMode ? 120 : 90} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                                <circle cx="50" cy="50" r="44" fill="none" stroke={tCol} strokeWidth="6" strokeDasharray="276.5" strokeDashoffset={276.5 * (1 - tPct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s linear" }} />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: performanceMode ? 24 : 18, fontWeight: 900, fontFamily: THEME.fonts.mono }}>{fmt(rem)}</span>
                                <span style={{ fontSize: 8, opacity: 0.4, textTransform: "uppercase" }}>restante</span>
                            </div>
                        </div>
                    </header>

                    {/* 2. BOTONES SUPERPODERES */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={() => setCrossfade(!crossfade)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${crossfade ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`, background: crossfade ? THEME.colors.brand.cyan + "20" : "transparent", color: crossfade ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Mezcla automática">CROSS</button>
                        <button onClick={() => setFadeEnabled(!fadeEnabled)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${fadeEnabled ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`, background: fadeEnabled ? THEME.colors.brand.cyan + "20" : "transparent", color: fadeEnabled ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Desvanecimiento global">FADE</button>
                        <button onClick={() => setSplMeterEnabled(!splMeterEnabled)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${splMeterEnabled ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`, background: splMeterEnabled ? THEME.colors.brand.violet + "20" : "transparent", color: splMeterEnabled ? THEME.colors.brand.violet : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Medidor SPL">METER</button>
                        <button onClick={() => setPerformanceMode(!performanceMode)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${performanceMode ? THEME.colors.brand.pink : "rgba(255,255,255,0.1)"}`, background: performanceMode ? THEME.colors.brand.pink + "20" : "transparent", color: performanceMode ? THEME.colors.brand.pink : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Modo Tablet/Performance">TABLET UI</button>
                        <button onClick={() => setShowQueue(!showQueue)} style={{ marginLeft: "auto", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></button>
                    </div>

                    <Dashboard
                        fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} setFadeInMs={setFadeInMs} fadeOutMs={fadeOutMs} setFadeOutMs={setFadeOutMs} fadeExpanded={fadeExpanded} setFadeExpanded={setFadeExpanded}
                        crossfade={crossfade} crossfadeMs={crossfadeMs} setCrossfadeMs={setCrossfadeMs} crossExpanded={crossExpanded} setCrossExpanded={setCrossExpanded}
                        splMeterEnabled={splMeterEnabled} splMeterTarget={splMeterTarget} splMeterExpanded={splMeterExpanded} setSplMeterExpanded={setSplMeterExpanded}
                    />

                    {/* 4. VISUALIZADOR */}
                    <div style={{ display: "flex", flexDirection: "column", gap: performanceMode ? 24 : 12 }}>
                        <div onClick={seek} style={{
                            height: performanceMode ? 240 : 160, backgroundColor: "rgba(255,255,255,0.01)", border: `1px solid ${isLive ? THEME.colors.brand.cyan + "20" : THEME.colors.border}`,
                            borderRadius: THEME.radius.xl, position: "relative", cursor: isLive ? "default" : "pointer", overflow: "hidden",
                            opacity: isLoadingWave ? 0.4 : 1, transition: "all 0.3s"
                        }}>
                            <Wave data={currentWave.length > 0 ? currentWave : Array(100).fill(0.15)} progress={prog} color={mCol} fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs} totalMs={durMs} />
                            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${prog * 100}%`, width: 3, background: mCol, boxShadow: `0 0 20px ${mCol}`, zIndex: 5 }} />
                            {isLive && playing && (
                                <div style={{ position: "absolute", top: 12, left: 12, padding: "6px 14px", borderRadius: 6, background: THEME.colors.brand.cyan + "30", border: `1px solid ${THEME.colors.brand.cyan}50`, color: THEME.colors.brand.cyan, fontSize: 10, fontWeight: 900 }}>LIVE MODE PROTECTED</div>
                            )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: performanceMode ? 16 : 13, fontFamily: THEME.fonts.mono, opacity: 0.5 }}>
                            <span>{fmt(pos)}</span>
                            <span>-{fmt(rem)}</span>
                        </div>
                    </div>

                    {/* 5. REPRODUCTOR CONTROLES */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: performanceMode ? 80 : 48 }}>
                        <button onClick={() => { if (!isLive && ci > 0) { setCi(ci - 1); setPos(0); } }} style={{ background: "none", border: "none", opacity: ci > 0 ? 0.9 : 0.2, cursor: "pointer", transform: performanceMode ? "scale(1.5)" : "none", transition: "transform 0.3s" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
                        <button onClick={() => setPlaying(!playing)} style={{ width: performanceMode ? 120 : 88, height: performanceMode ? 120 : 88, borderRadius: "50%", border: "none", background: THEME.gradients.brand, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: playing ? `0 0 40px ${mCol}50` : "0 10px 30px rgba(0,0,0,0.5)", transition: "all 0.3s" }}>{playing ? <svg width={performanceMode ? 48 : 36} height={performanceMode ? 48 : 36} viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg width={performanceMode ? 48 : 36} height={performanceMode ? 48 : 36} viewBox="0 0 24 24" fill="white" style={{ marginLeft: performanceMode ? 8 : 6 }}><path d="M8 5v14l11-7z" /></svg>}</button>
                        <button onClick={() => { if (!isLive && ci < pQueue.length - 1) { setCi(ci + 1); setPos(0); } }} style={{ background: "none", border: "none", opacity: ci < pQueue.length - 1 ? 0.9 : 0.2, cursor: "pointer", transform: performanceMode ? "scale(1.5)" : "none", transition: "transform 0.3s" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                    </div>

                    {/* 6. VOLUMEN */}
                    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "0 10px" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                        <div style={{ flex: 1, position: "relative", height: performanceMode ? 32 : 10 }}>
                            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)", borderRadius: performanceMode ? 16 : 5 }} />
                            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${vol * 100}%`, background: THEME.gradients.brand, borderRadius: performanceMode ? 16 : 5, boxShadow: `0 0 10px ${mCol}30` }} />
                            <input type="range" min="0" max="100" value={vol * 100} onChange={e => setVol(parseInt(e.target.value) / 100)} title="Control de volumen maestro" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                        </div>
                        <span style={{ fontSize: performanceMode ? 24 : 16, fontWeight: 900, fontFamily: THEME.fonts.mono, color: mCol, width: 60 }}>{Math.round(vol * 100)}%</span>
                    </div>

                    {/* 7. SET STATS */}
                    <div style={{ marginTop: "auto", padding: performanceMode ? "32px" : "24px", borderRadius: THEME.radius.xl, backgroundColor: THEME.colors.surface, border: `1px solid ${isLive ? THEME.colors.brand.cyan + "25" : THEME.colors.border}`, display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ width: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900, letterSpacing: 1.5 }}>SET ELAPSED</span>
                                    <span style={{ fontSize: performanceMode ? 24 : 18, fontWeight: 900, color: THEME.colors.brand.cyan, fontFamily: THEME.fonts.mono }}>{fmtM(elapsed * 1000)}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 900, letterSpacing: 1.5 }}>TOTAL REMAINING</span>
                                    <span style={{ fontSize: performanceMode ? 24 : 18, fontWeight: 900, color: mCol, fontFamily: THEME.fonts.mono }}>{fmtM(Math.max(0, qTot - (sumTrackDurationMs(pQueue.slice(0, ci)) + pos)))}</span>
                                </div>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(100, (sumTrackDurationMs(pQueue.slice(0, ci)) + pos) / (qTot || 1) * 100)}%`, background: THEME.gradients.brand, transition: "width 0.5s" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.4 }}>Total Set: {fmtM(qTot)}</span>
                            <button onClick={handleModeToggle} style={{ padding: "10px 24px", borderRadius: THEME.radius.full, background: isLive ? THEME.colors.brand.cyan + "20" : "rgba(255,255,255,0.05)", border: `1px solid ${isLive ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`, color: isLive ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontSize: 12, fontWeight: 900, cursor: "pointer" }}>{isLive ? "EXIT LIVE" : "ENTER LIVE"}</button>
                        </div>
                    </div>

                </main>
            </div>

            {/* Queue Sidebar */}
            {showQueue && isMobile && (
                <div onClick={() => setShowQueue(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
            )}
            <aside style={{
                position: isMobile ? "fixed" : "relative",
                right: 0, top: 0, bottom: 0,
                width: showQueue ? "min(360px, 100vw)" : 0, 
                transition: "width 0.4s",
                backgroundColor: THEME.colors.panel, 
                borderLeft: `1px solid ${THEME.colors.border}`,
                display: "flex", flexDirection: "column", 
                overflow: "hidden",
                zIndex: 1001
            }}>
                <div style={{ width: isMobile ? "100vw" : 360, maxWidth: 360, height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "24px", borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <h2 style={{ fontSize: 13, fontWeight: 900, margin: 0, opacity: 0.8 }}>SETLIST QUEUE</h2>
                            <span style={{ fontSize: 11, fontWeight: 800, color: THEME.colors.text.muted }}>{pQueue.length} Tracks</span>
                        </div>
                        <button onClick={() => setShowQueue(false)} style={{ background: "none", border: "none", color: THEME.colors.text.muted, cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                        {pQueue.map((t, i) => {
                            const stackIdx = stackOrder.indexOf(t.id);
                            const isActive = ci === i;
                            return (
                                <div key={t.id} onClick={() => handleQueueClick(t)} draggable={!isLive} onDragStart={(e) => { e.dataTransfer.setData("idx", i.toString()); }} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(parseInt(e.dataTransfer.getData("idx")), i)} style={{
                                    padding: "14px", borderRadius: THEME.radius.md, marginBottom: 6, cursor: "pointer",
                                    background: isActive ? `${mCol}15` : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${isActive ? mCol + "40" : "transparent"}`,
                                    display: "flex", gap: 14, alignItems: "center", transition: "all 0.2s"
                                }}>
                                    <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, opacity: 0.3, minWidth: 20 }}>{String(i + 1).padStart(2, '0')}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "white" : THEME.colors.text.primary }}>{t.title}</div>
                                        <div style={{ fontSize: 11, color: THEME.colors.text.muted }}>{t.artist}</div>
                                    </div>
                                    {isLive && stackIdx !== -1 && (
                                        <div style={{ backgroundColor: THEME.colors.brand.cyan, color: "black", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{stackIdx + 1}</div>
                                    )}
                                    {isActive && playing && (
                                        <div style={{ display: "flex", gap: 3, height: 16, alignItems: "flex-end" }}>
                                            <div style={{ width: 3, height: "60%", background: mCol }} />
                                            <div style={{ width: 3, height: "100%", background: mCol }} />
                                            <div style={{ width: 3, height: "40%", background: mCol }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {trimmingTrack && <TrackTrimmer track={trimmingTrack} onSave={(s, e) => { setTrackTrim(trimmingTrack.id, s, e); setTrimmingTrack(null); }} onCancel={() => setTrimmingTrack(null)} />}
            {profileTrack && <TrackProfileModal track={profileTrack} onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }} onCancel={() => setProfileTrack(null)} />}
            {viewingSheetTrack && <SheetMusicViewer items={viewingSheetTrack.sheetMusic || []} onClose={() => setViewingSheetTrack(null)} />}
        </div>
    );
};
