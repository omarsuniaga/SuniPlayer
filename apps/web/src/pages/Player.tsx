import React, { useEffect, useState, useRef } from "react";
import { useProjectStore, setTrackTrim, updateTrackMetadata } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useLibraryStore } from "../store/useLibraryStore";
import { THEME } from "../data/theme.ts";
import { catalog as catalogTracks } from "@suniplayer/core";
import { mc as mcHelper } from "@suniplayer/core";
import { sumTrackDurationMs } from "@suniplayer/core";
import { TrackTrimmer } from "../components/common/TrackTrimmer";
import { TrackProfileModal } from "../components/common/TrackProfileModal";
import { Track } from "@suniplayer/core";
import { SheetMusicViewer } from "../components/common/SheetMusicViewer";
import { Dashboard } from "../components/player/Dashboard";
import { getWaveformData } from "../services/waveformService";
import { skipToNextGracefully, togglePlaybackGracefully } from "../services/audioTransport";
import { StageMirror } from "../components/player/StageMirror";
import { useMetronome } from "../services/useMetronome";
import { useTapTempo } from "../services/useTapTempo";

// Sub-components
import { PlayerHeader } from "../features/player/components/PlayerHeader";
import { VisualizerSection } from "../features/player/components/VisualizerSection";
import { PlaybackControls } from "../features/player/components/PlaybackControls";
import { VolumeControl } from "../features/player/components/VolumeControl";
import { SetlistSidebar } from "../features/player/components/SetlistSidebar";
import { ShowControl } from "../features/player/components/ShowControl";

interface PlayerProps {
    onModeToggle: () => void;
}

export const Player: React.FC<PlayerProps> = ({ onModeToggle }) => {
    // ── Store Selectors ──
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const pos = useProjectStore(s => s.pos);
    const playing = useProjectStore(s => s.playing);
    const setPos = useProjectStore(s => s.setPos);
    const setCi = useProjectStore(s => s.setCi);
    const setPlaying = useProjectStore(s => s.setPlaying);
    const setVol = useProjectStore(s => s.setVol);
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
    const showMarkers = useProjectStore(s => s.showMarkers);
    const setShowMarkers = useProjectStore(s => s.setShowMarkers);
    const isSimulating = useProjectStore(s => s.isSimulating);
    const stackOrder = useProjectStore(s => s.stackOrder);
    const setStackOrder = useProjectStore(s => s.setStackOrder);
    const performanceMode = useSettingsStore(s => s.performanceMode);
    const autoNext = useSettingsStore(s => s.autoNext);
    const setAutoNext = useSettingsStore(s => s.setAutoNext);
    const playbackGapMs = useSettingsStore(s => s.playbackGapMs);
    const setPlaybackGapMs = useSettingsStore(s => s.setPlaybackGapMs);
    const curveVisible = useSettingsStore(s => s.curveVisible);
    const setCurveVisible = useSettingsStore(s => s.setCurveVisible);
    const curveExpanded = useSettingsStore(s => s.curveExpanded);
    const setCurveExpanded = useSettingsStore(s => s.setCurveExpanded);
    const playbackGapRemainingMs = usePlayerStore(s => s.playbackGapRemainingMs);
    const curve = useBuilderStore(s => s.curve);
    const currentSetMetadata = usePlayerStore(s => s.currentSetMetadata);
    const isMirrorOpen = usePlayerStore(s => s.isMirrorOpen);
    const mirrorMode = usePlayerStore(s => s.mirrorMode);
    const toggleMirror = usePlayerStore(s => s.toggleMirror);
    const setMirrorMode = usePlayerStore(s => s.setMirrorMode);

    // ── UI State ──
    const [flowExpanded, setFlowExpanded] = useState(true);
    const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
    const [profileTrack, setProfileTrack] = useState<Track | null>(null);
    const [viewingSheetTrack, setViewingSheetTrack] = useState<Track | null>(null);
    const [showQueue, setShowQueue] = useState(window.innerWidth > 1200);
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
        isDesktop: window.innerWidth >= 1200
    });

    // Gesture detection
    const touchStart = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart.current - touchEnd;
        if (diff > 70) setShowQueue(true);
        if (diff < -70) setShowQueue(false);
        touchStart.current = null;
    };

    // Auto-load queue
    useEffect(() => {
        if (pQueue.length === 0) {
            const { customTracks } = useLibraryStore.getState();
            setPQueue(customTracks.length > 0 ? customTracks : catalogTracks as Track[]);
        }
    }, [pQueue.length, setPQueue]);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            setScreenSize({ isMobile: w < 768, isTablet: w >= 768 && w < 1200, isDesktop: w >= 1200 });
            if (w > 1200) setShowQueue(true);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const ct = pQueue[ci];
    const isLive = mode === "live";
    const mCol = mcHelper(ct?.mood || "calm");
    const durMs = ct?.duration_ms || 1;
    const rem = Math.max(0, durMs - pos);
    const tPct = Math.min(1, pos / durMs);
    const prog = pos / durMs;
    const qTot = sumTrackDurationMs(pQueue);
    const currentProgressMs = sumTrackDurationMs(pQueue.slice(0, ci)) + pos;
    const curvePlayheadPct = qTot > 0 ? currentProgressMs / qTot : 0;

    const [currentWave, setCurrentWave] = useState<number[]>([]);
    const isLoadingWave = Boolean(ct) && currentWave.length === 0;

    // Track Start Hook
    const lastTrackStarted = useRef<string | null>(null);
    useEffect(() => {
        if (ct && playing && lastTrackStarted.current !== ct.id) {
            usePlayerStore.getState().trackStart(ct.id);
            lastTrackStarted.current = ct.id;
        }
    }, [ct, playing]);

    useEffect(() => {
        if (!ct) return;
        const url = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path || "")}`;
        getWaveformData(url, ct.id).then(wave => setCurrentWave(wave));
        return () => setCurrentWave([]);
    }, [ct]);

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

    const useColumns = screenSize.isDesktop || (screenSize.isTablet && window.innerWidth > window.innerHeight);

    return (
        <div 
            className="player-atmosphere-container"
            onMouseDown={(e) => {
                // Dispatch a custom event for the Tap logic to pick up
                const event = new CustomEvent('suni-tap-border', { detail: { x: e.clientX, y: e.clientY } });
                window.dispatchEvent(event);
            }}
            style={{ 
                height: "100%", 
                width: "100%", 
                display: "flex", 
                backgroundColor: THEME.colors.bg, 
                color: THEME.colors.text.primary, 
                overflow: "hidden", 
                position: "absolute", 
                inset: 0,
                // Dynamic Pulse Variables (to be controlled by Developer in Phase 4)
                boxShadow: `inset 0 0 calc(var(--pulse-intensity, 0) * 40px) var(--pulse-color, ${THEME.colors.brand.cyan}20)`,
                transition: "box-shadow 0.1s ease-out"
            }}
        >
            {/* Visual Flash for Tap Feedback */}
            <div className="tap-flash-overlay" style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9999,
                backgroundColor: "white", opacity: 0, transition: "opacity 0.1s"
            }} />

            {/* Sutil indicador lateral... */}

            {/* Left Column: Stats & Monitor (Solo en pantallas grandes) */}
            {useColumns && (
                <aside style={{ width: "320px", flexShrink: 0, borderRight: `1px solid ${THEME.colors.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: 24, backgroundColor: "rgba(0,0,0,0.12)", overflowY: "auto", height: "100%", scrollbarWidth: "none" }}>
                    <h2 style={{ fontSize: 11, fontWeight: 900, color: THEME.colors.brand.violet, letterSpacing: 2, flexShrink: 0 }}>SHOW MONITOR</h2>
                    
                    {/* El tiempo ELAPSED y REMAINING ahora vive en el Navbar */}
                    
                    <div style={{ flexShrink: 0 }}>
                        <Dashboard 
                            fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} setFadeInMs={setFadeInMs} fadeOutMs={fadeOutMs} setFadeOutMs={setFadeOutMs} fadeExpanded={true} setFadeExpanded={() => {}} 
                            crossfade={crossfade} crossfadeMs={crossfadeMs} setCrossfadeMs={setCrossfadeMs} crossExpanded={true} setCrossExpanded={() => {}} 
                            splMeterEnabled={splMeterEnabled} splMeterTarget={splMeterTarget} splMeterExpanded={true} setSplMeterExpanded={() => {}} 
                            curve={curve} curvePlayheadPct={curvePlayheadPct} curveVisible={curveVisible} curveExpanded={true} setCurveExpanded={() => {}} 
                            autoNext={autoNext} playbackGapMs={playbackGapMs} setPlaybackGapMs={setPlaybackGapMs} playbackGapRemainingMs={playbackGapRemainingMs} flowExpanded={flowExpanded} setFlowExpanded={setFlowExpanded}
                        />
                    </div>
                </aside>
            )}

            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", height: "100%" }}>
                <main style={{ 
                    flex: 1, 
                    display: "flex", 
                    flexDirection: "column", 
                    padding: screenSize.isMobile ? "16px" : "32px", 
                    overflowY: "auto", 
                    gap: screenSize.isMobile ? 16 : 32, 
                    maxWidth: useColumns ? "900px" : "100%", 
                    margin: "0 auto", 
                    width: "100%",
                    WebkitOverflowScrolling: "touch" 
                }}>
                    {isSimulating && playing && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: THEME.radius.md, backgroundColor: `${THEME.colors.status.warning}10`, border: `1px solid ${THEME.colors.status.warning}30` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <span style={{ fontSize: 12, color: THEME.colors.status.warning, fontWeight: 700 }}>MODO SIMULACIÓN</span>
                        </div>
                    )}

                    <PlayerHeader 
                        track={ct} 
                        performanceMode={performanceMode} 
                        playing={playing} 
                        rem={rem} 
                        tPct={tPct} 
                        isMirrorOpen={isMirrorOpen}
                        onMirrorToggle={toggleMirror}
                        onSetlistToggle={() => setShowQueue(!showQueue)}
                        showQueue={showQueue}
                        currentSetMetadata={currentSetMetadata} 
                        onProfileClick={() => setProfileTrack(ct)} 
                        onSheetMusicClick={() => setViewingSheetTrack(ct)} 
                    />

                    <VisualizerSection 
                        track={ct} 
                        performanceMode={performanceMode} 
                        isLive={isLive} 
                        playing={playing} 
                        pos={pos} 
                        rem={rem} 
                        durMs={durMs} 
                        prog={prog} 
                        mCol={mCol} 
                        currentWave={currentWave} 
                        isLoadingWave={isLoadingWave} 
                        fadeEnabled={fadeEnabled} 
                        fadeInMs={fadeInMs} 
                        fadeOutMs={fadeOutMs} 
                        showMarkers={showMarkers}
                        onMarkersChange={(markers) => ct && updateTrackMetadata(ct.id, { markers })} 
                        onSeek={(newPosMs) => { if (ct) setPos(newPosMs); }} 
                    />

                    <PlaybackControls playing={playing} isLive={isLive} ci={ci} queueLen={pQueue.length} pos={pos} performanceMode={performanceMode} mCol={mCol} onPlayPause={togglePlaybackGracefully} onPrev={() => { setCi(ci - 1); setPos(0); }} onNext={skipToNextGracefully} onStop={() => { setPlaying(false); setPos(0); }} />

                    <VolumeControl vol={vol} mCol={mCol} performanceMode={performanceMode} onVolumeChange={setVol} />

                    {/* ⚙️ CONTROLES DE EFECTOS (Debajo de los controles principales) */}
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: THEME.colors.text.muted, letterSpacing: 1.5, marginBottom: 12, paddingLeft: 4 }}>CONTROLES DE EFECTOS </div>
                        <ShowControl 
                            autoNext={autoNext} setAutoNext={setAutoNext}
                            crossfade={crossfade} setCrossfade={setCrossfade} 
                            fadeEnabled={fadeEnabled} setFadeEnabled={setFadeEnabled} 
                            splMeterEnabled={splMeterEnabled} setSplMeterEnabled={setSplMeterEnabled} 
                            curveVisible={curveVisible} setCurveVisible={setCurveVisible} 
                            showMarkers={showMarkers} setShowMarkers={setShowMarkers}
                            hasCurve={Boolean(curve)} 
                            isMirrorOpen={isMirrorOpen}
                            onToggleMirror={toggleMirror}
                            mirrorMode={mirrorMode}
                            onToggleMirrorMode={() => {
                                if (!isMirrorOpen) {
                                    setMirrorMode('floating');
                                    toggleMirror();
                                } else {
                                    setMirrorMode(mirrorMode === 'docked' ? 'floating' : 'docked');
                                }
                            }}
                        />

                        {/* DOCKED STAGE MIRROR */}
                        {isMirrorOpen && mirrorMode === 'docked' && (
                            <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
                                <StageMirror />
                            </div>
                        )}

                        {!useColumns && (
                            <div style={{ marginTop: 12 }}>
                                <Dashboard 
                                    fadeEnabled={fadeEnabled} fadeInMs={fadeInMs} setFadeInMs={setFadeInMs} fadeOutMs={fadeOutMs} setFadeOutMs={setFadeOutMs} fadeExpanded={fadeExpanded} setFadeExpanded={setFadeExpanded} 
                                    crossfade={crossfade} crossfadeMs={crossfadeMs} setCrossfadeMs={setCrossfadeMs} crossExpanded={crossExpanded} setCrossExpanded={setCrossExpanded} 
                                    splMeterEnabled={splMeterEnabled} splMeterTarget={splMeterTarget} splMeterExpanded={splMeterExpanded} setSplMeterExpanded={setSplMeterExpanded} 
                                    curve={curve} curvePlayheadPct={curvePlayheadPct} curveVisible={curveVisible} curveExpanded={curveExpanded} setCurveExpanded={setCurveExpanded} 
                                    autoNext={autoNext} playbackGapMs={playbackGapMs} setPlaybackGapMs={setPlaybackGapMs} playbackGapRemainingMs={playbackGapRemainingMs} flowExpanded={flowExpanded} setFlowExpanded={setFlowExpanded}
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <SetlistSidebar showQueue={showQueue} isMobile={screenSize.isMobile} pQueue={pQueue} ci={ci} playing={playing} isLive={isLive} stackOrder={stackOrder} mCol={mCol} onQueueClick={handleQueueClick} onClose={() => setShowQueue(false)} onDrop={onDrop} />

            {trimmingTrack && <TrackTrimmer track={trimmingTrack} onSave={(s, e) => { setTrackTrim(trimmingTrack.id, s, e); setTrimmingTrack(null); }} onCancel={() => setTrimmingTrack(null)} />}
            {profileTrack && <TrackProfileModal track={profileTrack} onSave={(u) => { updateTrackMetadata(profileTrack.id, u); setProfileTrack(null); }} onCancel={() => setProfileTrack(null)} />}
            {viewingSheetTrack && <SheetMusicViewer items={viewingSheetTrack.sheetMusic || []} onClose={() => setViewingSheetTrack(null)} />}
            {isMirrorOpen && mirrorMode === 'floating' && <StageMirror />}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                .player-atmosphere-container.tap-flash .tap-flash-overlay {
                    opacity: 0.25;
                }
                .player-atmosphere-container.beat-down {
                    --pulse-intensity: 1.2;
                    --pulse-color: ${THEME.colors.brand.cyan}40;
                }
                .player-atmosphere-container.beat-up {
                    --pulse-intensity: 0.6;
                    --pulse-color: ${THEME.colors.brand.violet}20;
                }
            `}</style>
        </div>
    );
};
