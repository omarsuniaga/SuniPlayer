import React, { useMemo } from "react";
import { useLibraryStore } from "../store/libraryStore";
import { useQueueStore } from "../store/queueStore";
import { TrackLibrary } from "../components/library/TrackLibrary";
import { SetBuilderConfig } from "../components/set-manager/SetBuilderConfig";
import { SetSummary } from "../components/common/SetSummary";
import { TrackRow } from "../components/common/TrackRow";
import { TRACKS } from "../data/mockTracks";

export const LibraryView = () => {
    const lib = useLibraryStore();
    const queue = useQueueStore();

    const filtered = useMemo(() => {
        return TRACKS.filter((t) => {
            if (lib.search && !t.title.toLowerCase().includes(lib.search.toLowerCase()) && !t.artist.toLowerCase().includes(lib.search.toLowerCase())) return false;
            if (lib.fMood && t.mood !== lib.fMood) return false;
            if (lib.genSet.find((gs) => gs.id === t.id)) return false;
            return true;
        });
    }, [lib.search, lib.fMood, lib.genSet]);

    const toPlayer = () => {
        if (!lib.genSet.length) return;
        queue.setPQueue([...lib.genSet]);
        queue.setCi(0);
        lib.setView("player"); // This would eventually be a global nav action
    };

    return (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 22px", overflow: "auto" }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 14px" }}>Configuracion del Set</h2>

                <SetBuilderConfig
                    targetMin={lib.targetMin}
                    setTargetMin={lib.setTargetMin}
                    venue={lib.venue}
                    setVenue={lib.setVenue}
                    curve={lib.curve}
                    setCurve={lib.setCurve}
                    onGen={lib.doGen}
                />

                {lib.genSet.length > 0 && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Set Generado</h2>
                            <button onClick={toPlayer} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#06B6D4,#0891B2)", color: "white", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>
                                Enviar al Player (Stage)
                            </button>
                        </div>
                        <SetSummary tracks={lib.genSet} target={lib.targetMin * 60} />
                        <div style={{ marginTop: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
                            {lib.genSet.map((t, i) => (
                                <TrackRow key={t.id + i} track={t} idx={i} showN onRm={(j) => lib.setGenSet(p => p.filter((_, k) => k !== j))} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <TrackLibrary
                search={lib.search}
                setSearch={lib.setSearch}
                fMood={lib.fMood}
                setFMood={lib.setFMood}
                filteredCount={filtered.length}
                filteredTracks={filtered}
                onAdd={(t) => lib.setGenSet(p => [...p, t])}
            />
        </div>
    );
};
