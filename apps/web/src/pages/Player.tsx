import React, { useCallback, useEffect, useState } from "react";
import { useProjectStore, setTrackTrim, updateTrackMetadata } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { THEME } from "../data/theme.ts";
import catalogTracks from "../data/tracks.json";
import { mc, mc as mcHelper } from "../services/uiUtils.ts";
import { sumTrackDurationMs } from "../utils/trackMetrics.ts";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { Track } from "../types";
import { SheetMusicViewer } from "../components/common/SheetMusicViewer";
import { Dashboard } from "../components/player/Dashboard";
import { LiveUnlockModal } from "../components/player/LiveUnlockModal";
import { getWaveformData } from "../services/waveformService";

// Sub-components
import { PlayerHeader } from "../features/player/components/PlayerHeader";
import { VisualizerSection } from "../features/player/components/VisualizerSection";
import { PlaybackControls } from "../features/player/components/PlaybackControls";
import { VolumeControl } from "../features/player/components/VolumeControl";
import { SetStatusPanel } from "../features/player/components/SetStatusPanel";
import { SetlistSidebar } from "../features/player/components/SetlistSidebar";

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
    const curveVisible = useSettingsStore(s => s.curveVisible);
    const setCurveVisible = useSettingsStore(s => s.setCurveVisible);
    const curveExpanded = useSettingsStore(s => s.curveExpanded);
    const setCurveExpanded = useSettingsStore(s => s.setCurveExpanded);

    const curve = useBuilderStore(s => s.curve);
    const currentSetMetadata = usePlayerStore(s => s.currentSetMetadata);

    // ── UI State ──
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const [viewingSheetTrack, setViewingSheetTrack] = useState<Track | null>(null);
    const [showQueue, setShowQueue] = useState(window.innerWidth > 1000);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

    // Auto-load catalog as preset queue when Player opens with no tracks
    useEffect(() => {
        if (pQueue.length === 0) {
            setPQueue(catalogTracks as Track[]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dynamic resize tracking
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 800);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const ct = pQueue[ci];
    const isLive = mode === "live";

    // ── Logic ──
    const mCol = mcHelper(ct?.mood);
    const durMs = ct?.duration_ms || 1;
    const rem = Math.max(0, durMs - pos);
    const tPct = Math.min(1, pos / durMs);
    const prog = pos / durMs;
    const qTot = sumTrackDurationMs(pQueue);
    const currentProgressMs = sumTrackDurationMs(pQueue.slice(0, ci)) + pos;
    const curvePlayheadPct = qTot > 0 ? currentProgressMs / qTot : 0;

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
                    <PlayerHeader 
                        track={ct} performanceMode={performanceMode} playing={playing} 
                        pos={pos} rem={rem} tPct={tPct} currentSetMetadata={currentSetMetadata}
                        onProfileClick={() => setProfileTrack(ct)} 
                        onSheetMusicClick={() => setViewingSheetTrack(ct)}
                    />

                    {/* 2. BOTONES SUPERPODERES */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={() => setCrossfade(!crossfade)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${crossfade ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`, background: crossfade ? THEME.colors.brand.cyan + "20" : "transparent", color: crossfade ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Mezcla automática">CROSS</button>
                        <button onClick={() => setFadeEnabled(!fadeEnabled)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${fadeEnabled ? THEME.colors.brand.cyan : "rgba(255,255,255,0.1)"}`, background: fadeEnabled ? THEME.colors.brand.cyan + "20" : "transparent", color: fadeEnabled ? THEME.colors.brand.cyan : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Desvanecimiento global">FADE</button>
                        <button onClick={() => setSplMeterEnabled(!splMeterEnabled)} style={{ padding: "10px 16px", borderRadius: THEME.radius.md, border: `1px solid ${splMeterEnabled ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`, background: splMeterEnabled ? THEME.colors.brand.violet + "20" : "transparent", color: splMeterEnabled ? THEME.colors.brand.violet : THEME.colors.text.muted, fontSize: 11, fontWeight: 900, cursor: "pointer" }} title="Medidor SPL">METER</button>
                        {curve && (
                            <button
                                onClick={() => setCurveVisible(!curveVisible)}
                                style={{
                                    padding: "10px 16px",
                                    borderRadius: THEME.radius.md,
                                    border: `1px solid ${curveVisible ? THEME.colors.brand.violet : "rgba(255,255,255,0.1)"}`,
                                    background: curveVisible ? THEME.colors.brand.violet + "20" : "transparent",
                                    color: curveVisible ? THEME.colors.brand.violet : THEME.colors.text.muted,
                                    fontSize: 11, fontWeight: 900, cursor: "pointer"
                                }}
                                title="Curva de Energía del Set"
                            >
                                CURVE
                            </button>
                        )}
                        <button onClick={() => setShowQueue(!showQueue)} style={{ marginLeft: "auto", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></button>
                    </div>

                    <Dashboard
                        fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} setFadeInMs={setFadeInMs} fadeOutMs={fadeOutMs} setFadeOutMs={setFadeOutMs} fadeExpanded={fadeExpanded} setFadeExpanded={setFadeExpanded}
                        crossfade={crossfade} crossfadeMs={crossfadeMs} setCrossfadeMs={setCrossfadeMs} crossExpanded={crossExpanded} setCrossExpanded={setCrossExpanded}
                        splMeterEnabled={splMeterEnabled} splMeterTarget={splMeterTarget} splMeterExpanded={splMeterExpanded} setSplMeterExpanded={setSplMeterExpanded}
                        curve={curve} curvePlayheadPct={curvePlayheadPct} curveVisible={curveVisible} curveExpanded={curveExpanded} setCurveExpanded={setCurveExpanded}
                    />

                    {/* 4. VISUALIZADOR */}
                    <VisualizerSection 
                        track={ct} performanceMode={performanceMode} isLive={isLive} playing={playing}
                        pos={pos} rem={rem} durMs={durMs} prog={prog} mCol={mCol}
                        currentWave={currentWave} isLoadingWave={isLoadingWave}
                        fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs}
                        onMarkersChange={(markers) => ct && updateTrackMetadata(ct.id, { markers })}
                        onSeek={(newPosMs) => { if (!isLive && ct) setPos(newPosMs); }}
                    />

                    {/* 5. REPRODUCTOR CONTROLES */}
                    <PlaybackControls 
                        playing={playing} isLive={isLive} ci={ci} queueLen={pQueue.length} 
                        pos={pos} performanceMode={performanceMode} mCol={mCol}
                        onPlayPause={() => setPlaying(!playing)}
                        onPrev={() => { setCi(ci - 1); setPos(0); }}
                        onNext={() => { setCi(ci + 1); setPos(0); }}
                        onStop={() => { setPlaying(false); setPos(0); }}
                    />

                    {/* 6. VOLUMEN */}
                    <VolumeControl 
                        vol={vol} mCol={mCol} performanceMode={performanceMode}
                        onVolumeChange={setVol}
                    />

                    {/* 7. SET STATS */}
                    <SetStatusPanel 
                        isLive={isLive} performanceMode={performanceMode}
                        elapsed={elapsed} qTot={qTot} currentProgressMs={currentProgressMs}
                        onModeToggle={handleModeToggle} mCol={mCol}
                    />

                </main>
            </div>

            {/* Queue Sidebar */}
            <SetlistSidebar 
                showQueue={showQueue} isMobile={isMobile} pQueue={pQueue}
                ci={ci} playing={playing} isLive={isLive} stackOrder={stackOrder} mCol={mCol}
                onQueueClick={handleQueueClick}
                onClose={() => setShowQueue(false)}
                onDrop={onDrop}
            />

            {trimmingTrack && <TrackTrimmer track={trimmingTrack} onSave={(s, e) => { setTrackTrim(trimmingTrack.id, s, e); setTrimmingTrack(null); }} onCancel={() => setTrimmingTrack(null)} />}
            {profileTrack && <TrackProfileModal track={profileTrack} onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }} onCancel={() => setProfileTrack(null)} />}
            {viewingSheetTrack && <SheetMusicViewer items={viewingSheetTrack.sheetMusic || []} onClose={() => setViewingSheetTrack(null)} />}
        </div>
    );
};
