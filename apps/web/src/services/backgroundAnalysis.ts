/**
 * Background Analysis Service
 * 
 * Automatically analyzes tracks that are missing metadata.
 */
import { useLibraryStore } from "../store/useLibraryStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useBuilderStore } from "../store/useBuilderStore";
import { TRACKS } from "../data/constants";
import { analyzeAudio } from "./analysisService";
import { Track } from "../types";
import { audioCache } from "./db";

let isBusy = false;
const failedIds = new Set<string>();
let lastRetryTimestamp = Date.now();

export async function runBackgroundAnalysis() {
    if (isBusy) return;
    
    // Clear failed IDs if it's been more than 60 seconds (allow retries on fresh interval)
    if (Date.now() - lastRetryTimestamp > 60000) {
        failedIds.clear();
        lastRetryTimestamp = Date.now();
    }
    
    const customTracks = useLibraryStore.getState().customTracks;
    const { trackOverrides } = useLibraryStore.getState();
    const pool: Track[] = [...TRACKS, ...customTracks];
    
    // Find first one that needs analysis and hasn't failed in this session
    const target = pool.find(t => {
        if (failedIds.has(t.id)) return false;
        
        const override = trackOverrides[t.id] || {};
        const hasWaveform = t.waveform || override.waveform;
        const isCached = t.analysis_cached || override.analysis_cached;
        return !(hasWaveform && isCached);
    });

    if (!target) return;

    isBusy = true;
    console.log(`[BackgroundAnalysis] Analyzing: ${target.title}`);

    let audioCtx: AudioContext | null = null;
    try {
        let url = target.blob_url;
        if (!url && target.file_path) {
             url = `/audio/${encodeURI(target.file_path)}`;
        }
        
        if (!url) throw new Error("No URL found");

        console.log(`[BackgroundAnalysis] Fetching: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
             throw new Error(`HTTP ${response.status}: ${response.statusText} at ${url}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const analysis = await analyzeAudio(audioBuffer);
        
        // Save to persistent IndexedDB cache
        await audioCache.saveWaveform(target.id, analysis.waveform);
        await audioCache.saveAnalysis(target.id, {
            bpm: analysis.bpm,
            key: analysis.key,
            energy: analysis.energy,
            gainOffset: analysis.gainOffset
        });

        const updates: Partial<Track> = {
            bpm: analysis.bpm,
            key: analysis.key,
            energy: analysis.energy,
            gainOffset: analysis.gainOffset,
            analysis_cached: true
        };

        useLibraryStore.getState().updateTrack(target.id, updates);
        
        // Update UI stores
        usePlayerStore.setState(s => ({
            pQueue: s.pQueue.map(t => t.id === target.id ? { ...t, ...updates } : t)
        }));
        
        useBuilderStore.setState(s => ({
            genSet: s.genSet.map(t => t.id === target.id ? { ...t, ...updates } : t)
        }));

        console.log(`[BackgroundAnalysis] Success: ${target.title}`);
    } catch (e) {
        console.error(`[BackgroundAnalysis] Permanently skipping ${target.title} due to error:`, e);
        failedIds.add(target.id); // Don't try again this session
    } finally {
        if (audioCtx) {
            try { await audioCtx.close(); } catch {}
        }
        isBusy = false;
    }
}
