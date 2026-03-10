import React from "react";
import { useAudioStore } from "../store/audioStore";
import { useQueueStore } from "../store/queueStore";
import { useLibraryStore } from "../store/libraryStore";
import { VisualTimer } from "../components/timer/VisualTimer";
import { PlayerControls } from "../components/player/PlayerControls";
import { QueueList } from "../components/queue/QueueList";
import { Wave } from "../components/player/Wave";
import { fmt } from "../utils/time";

export const StageView = ({ waves }) => {
    const audio = useAudioStore();
    const queue = useQueueStore();
    const lib = useLibraryStore();

    const ct = queue.pQueue[queue.ci];
    const prog = ct ? audio.pos / (ct.duration * 1000) : 0;
    const mCol = audio.mode === "live" ? "#06B6D4" : "#8B5CF6";
    const rem = Math.max(0, audio.tTarget - audio.elapsed);
    const tPct = audio.tTarget > 0 ? Math.min(1, audio.elapsed / audio.tTarget) : 0;
    const tCol = rem < 120 && rem > 0 ? "#EF4444" : rem < 300 && rem > 0 ? "#F59E0B" : "#06B6D4";

    const seek = (e) => {
        if (!ct) return;
        const r = e.currentTarget.getBoundingClientRect();
        audio.setPos(Math.floor(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * ct.duration * 1000));
    };

    if (!queue.pQueue.length) {
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, opacity: 0.4 }}>
                <div style={{ fontSize: 40 }}>&#9835;</div>
                <p style={{ fontSize: 14 }}>No hay set cargado</p>
                <button onClick={() => lib.setView("builder")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#06B6D4,#8B5CF6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Ir al Library
                </button>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 22px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ct?.title || "--"}
                        </h1>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{ct?.artist}</p>
                    </div>
                    <VisualTimer rem={rem} tPct={tPct} tCol={tCol} elapsed={audio.elapsed} tTarget={audio.tTarget} />
                </div>

                <div onClick={seek} style={{ cursor: "pointer", borderRadius: 8, padding: "6px 4px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", position: "relative", marginBottom: 6 }}>
                    <Wave data={waves[ct?.id] || []} progress={prog} color={mCol} />
                    <div style={{ position: "absolute", top: 3, bottom: 3, left: `${prog * 100}%`, width: 2, backgroundColor: mCol, borderRadius: 1 }} />
                </div>

                <PlayerControls
                    playing={audio.playing}
                    onToggle={() => audio.setPlaying(!audio.playing)}
                    onPrev={() => { if (queue.ci > 0) { queue.setCi(queue.ci - 1); audio.setPos(0); } }}
                    onNext={() => { if (queue.ci < queue.pQueue.length - 1) { queue.setCi(queue.ci + 1); audio.setPos(0); } }}
                    ci={queue.ci}
                    queueLength={queue.pQueue.length}
                    mCol={mCol}
                    mode={audio.mode}
                />
            </div>
            <QueueList
                pQueue={queue.pQueue}
                ci={queue.ci}
                setCi={queue.setCi}
                setPos={audio.setPos}
                mCol={mCol}
                mode={audio.mode}
            />
        </div>
    );
};
