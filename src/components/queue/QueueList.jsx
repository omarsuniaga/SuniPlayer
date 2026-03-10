import React from "react";
import { TrackRow } from "../common/TrackRow";
import { fmtM } from "../../utils/time";

export const QueueList = ({ pQueue, ci, setCi, setPos, mCol, mode }) => {
    const qTot = pQueue.reduce((acc, t) => acc + t.duration_ms, 0);

    return (
        <div
            style={{
                width: 300,
                borderLeft: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(0,0,0,0.15)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
            >
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                    QUEUE{mode === "live" ? " (locked)" : ""}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: mCol }}>
                    {fmtM(qTot)}
                </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 4 }}>
                {pQueue.map((t, i) => (
                    <TrackRow
                        key={t.id + i}
                        track={t}
                        idx={i}
                        showN
                        active={i === ci}
                        onClick={() => {
                            setCi(i);
                            setPos(0);
                        }}
                    />
                ))}
            </div>
            {ci < pQueue.length - 1 && (
                <div
                    style={{
                        padding: "8px 14px",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        backgroundColor: `${mCol}06`,
                    }}
                >
                    <div
                        style={{
                            fontSize: 9,
                            color: "rgba(255,255,255,0.2)",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginBottom: 2,
                        }}
                    >
                        Next
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>
                        {pQueue[ci + 1]?.title}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                        {pQueue[ci + 1]?.artist} - {fmtM(pQueue[ci + 1]?.duration_ms)}
                    </div>
                </div>
            )}
        </div>
    );
};
