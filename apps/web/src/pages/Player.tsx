import React, { useEffect, useState } from "react";
import { useProjectStore, setTrackTrim, updateTrackMetadata } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { THEME } from "../data/theme.ts";
import catalogTracks from "../data/tracks.json";
import { mc as mcHelper } from "../services/uiUtils.ts";
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
import { ShowControl } from "../features/player/components/ShowControl";

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
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
        isDesktop: window.innerWidth >= 1200
    });

    useEffect(() => {
        if (pQueue.length === 0) {
            const { customTracks } = useLibraryStore.getState();
            if (customTracks.length > 0) setPQueue(customTracks);
            else setPQueue(catalogTracks as Track[]);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            setScreenSize({
                isMobile: w < 768,
                isTablet: w >= 768 && w < 1200,
                isDesktop: w >= 1200
            });
            if (w > 1200) setShowQueue(true);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const ct = pQueue[ci];
    const isLive = mode === "live";
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
        getWaveformData(url, ct.id).then((waveform) => {
            if (!cancelled) setCurrentWave(waveform);
        });
        return () => { cancelled = true; setCurrentWave([]); };
    }, [ct]);

    const handleModeToggle = () => isLive ? setShowUnlockModal(true) : setMode("live");

    const handleQueueClick = (track: Track) => {
        if (isLive) {
            if (ct?.id === track.id) return;
            setStackOrder(prev => prev.includes(track.id) ? prev.filter(id => id !== track.id) : [...prev, track.id]);
            return;
        }
        const idx = pQueue.findIndex(t => t.id === track.id);
        if (idx !== -1) { setCi(idx); setPos(0); setStackOrder([]); }
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

    // ── Layout Rendering ──
    const useColumns = screenSize.isDesktop || (screenSize.isTablet && window.innerWidth > window.innerHeight);

    return (
        <div style={{
            height: "100%", width: "100%",
            display: "flex", backgroundColor: THEME.colors.bg,
            color: THEME.colors.text.primary, overflow: "hidden"
        }}>
            {showUnlockModal && <LiveUnlockModal onConfirm={() => { setMode("edit"); setShowUnlockModal(false); }} onCancel={() => setShowUnlockModal(false)} />}

            {/* Left Column: Stats & Dashboard (Only on Desktop/Tablet Landscape) */}
            {useColumns && (
                <aside style={{ 
                    width: "320px", borderRight: `1px solid ${THEME.colors.border}`, 
                    padding: "24px", display: "flex", flexDirection: "column", gap: 24,
                    backgroundColor: "rgba(0,0,0,0.1)", overflowY: "auto"
                }}>
                    <h2 style={{ fontSize: 11, fontWeight: 900, color: THEME.colors.brand.cyan, letterSpacing: 2 }}>SHOW MONITOR</h2>
                    <SetStatusPanel 
                        isLive={isLive} performanceMode={performanceMode}
                        elapsed={elapsed} qTot={qTot} currentProgressMs={currentProgressMs}
                        onModeToggle={handleModeToggle} mCol={mCol}
                    />
                    <div style={{ flex: 1 }}>
                        <Dashboard
                            fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} setFadeInMs={setFadeInMs} fadeOutMs={fadeOutMs} setFadeOutMs={setFadeOutMs} fadeExpanded={true} setFadeExpanded={() => {}}
                            crossfade={crossfade} crossfadeMs={crossfadeMs} setCrossfadeMs={setCrossfadeMs} crossExpanded={true} setCrossExpanded={() => {}}
                            splMeterEnabled={splMeterEnabled} splMeterTarget={splMeterTarget} splMeterExpanded={true} setSplMeterExpanded={() => {}}
                            curve={curve} curvePlayheadPct={curvePlayheadPct} curveVisible={curveVisible} curveExpanded={true} setCurveExpanded={() => {}}
                        />
                    </div>
                </aside>
            )}

            {/* Central Column: Main Player */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
                <main style={{ 
                    flex: 1, display: "flex", flexDirection: "column", 
                    padding: screenSize.isMobile ? "16px" : "32px", 
                    overflowY: "auto", gap: performanceMode ? 40 : 32,
                    maxWidth: useColumns ? "900px" : "100%", margin: "0 auto", width: "100%"
                }}>
                    {isSimulating && playing && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: THEME.radius.md, backgroundColor: `${THEME.colors.status.warning}10`, border: `1px solid ${THEME.colors.status.warning}30` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <span style={{ fontSize: 12, color: THEME.colors.status.warning, fontWeight: 700 }}>MODO SIMULACIÓN</span>
                        </div>
                    )}

                    <PlayerHeader 
                        track={ct} performanceMode={performanceMode} playing={playing} 
                        rem={rem} tPct={tPct} currentSetMetadata={currentSetMetadata}
                        onProfileClick={() => setProfileTrack(ct)} 
                        onSheetMusicClick={() => setViewingSheetTrack(ct)}
                    />

                    <ShowControl 
                        crossfade={crossfade} setCrossfade={setCrossfade}
                        fadeEnabled={fadeEnabled} setFadeEnabled={setFadeEnabled}
                        splMeterEnabled={splMeterEnabled} setSplMeterEnabled={setSplMeterEnabled}
                        curveVisible={curveVisible} setCurveVisible={setCurveVisible}
                        hasCurve={Boolean(curve)}
                        onToggleQueue={() => setShowQueue(!showQueue)}
                    />

                    {!useColumns && (
                        <Dashboard
                            fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} setFadeInMs={setFadeInMs} fadeOutMs={fadeOutMs} setFadeOutMs={setFadeOutMs} fadeExpanded={fadeExpanded} setFadeExpanded={setFadeExpanded}
                            crossfade={crossfade} crossfadeMs={crossfadeMs} setCrossfadeMs={setCrossfadeMs} crossExpanded={crossExpanded} setCrossExpanded={setCrossExpanded}
                            splMeterEnabled={splMeterEnabled} splMeterTarget={splMeterTarget} splMeterExpanded={splMeterExpanded} setSplMeterExpanded={setSplMeterExpanded}
                            curve={curve} curvePlayheadPct={curvePlayheadPct} curveVisible={curveVisible} curveExpanded={curveExpanded} setCurveExpanded={setCurveExpanded}
                        />
                    )}

                    <VisualizerSection 
                        track={ct} performanceMode={performanceMode} isLive={isLive} playing={playing}
                        pos={pos} rem={rem} durMs={durMs} prog={prog} mCol={mCol}
                        currentWave={currentWave} isLoadingWave={isLoadingWave}
                        fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} fadeOutMs={fadeOutMs}
                        onMarkersChange={(markers) => ct && updateTrackMetadata(ct.id, { markers })}
                        onSeek={(newPosMs) => { if (!isLive && ct) setPos(newPosMs); }}
                    />

                    <PlaybackControls 
                        playing={playing} isLive={isLive} ci={ci} queueLen={pQueue.length} 
                        pos={pos} performanceMode={performanceMode} mCol={mCol}
                        onPlayPause={() => setPlaying(!playing)}
                        onPrev={() => { setCi(ci - 1); setPos(0); }}
                        onNext={() => { setCi(ci + 1); setPos(0); }}
                        onStop={() => { setPlaying(false); setPos(0); }}
                    />

                    <VolumeControl 
                        vol={vol} mCol={mCol} performanceMode={performanceMode}
                        onVolumeChange={setVol}
                    />

                    {!useColumns && (
                        <SetStatusPanel 
                            isLive={isLive} performanceMode={performanceMode}
                            elapsed={elapsed} qTot={qTot} currentProgressMs={currentProgressMs}
                            onModeToggle={handleModeToggle} mCol={mCol}
                        />
                    )}
                </main>
            </div>

            {/* Right Column: Queue Sidebar */}
            <SetlistSidebar 
                showQueue={showQueue} 
                isMobile={screenSize.isMobile} 
                pQueue={pQueue}
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
