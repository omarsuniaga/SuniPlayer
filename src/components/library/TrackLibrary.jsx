import React from "react";
import { MOODS } from "../../data/mockTracks";

export const TrackLibrary = ({ search, setSearch, fMood, setFMood, filteredCount, filteredTracks, onAdd }) => {
    return (
        <div
            style={{
                width: 320,
                borderLeft: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(0,0,0,0.15)",
            }}
        >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>REPERTORIO</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{filteredCount}</span>
                </div>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 7,
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        color: "#F0F4F8",
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box",
                    }}
                />
                <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                    <button
                        onClick={() => setFMood(null)}
                        style={{
                            padding: "3px 7px",
                            borderRadius: 5,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: !fMood ? "rgba(255,255,255,0.08)" : "transparent",
                            color: !fMood ? "#F0F4F8" : "rgba(255,255,255,0.3)",
                            fontSize: 10,
                        }}
                    >
                        All
                    </button>
                    {MOODS.map((m) => (
                        <button
                            key={m}
                            onClick={() => setFMood(fMood === m ? null : m)}
                            style={{
                                padding: "3px 7px",
                                borderRadius: 5,
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: fMood === m ? "rgba(139,92,246,0.2)" : "transparent",
                                color: fMood === m ? "#8B5CF6" : "rgba(255,255,255,0.3)",
                                fontSize: 10,
                                textTransform: "capitalize",
                            }}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 4 }}>
                {filteredTracks.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => onAdd(t)}
                        style={{
                            padding: "7px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: "#F0F4F8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {t.title}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{t.artist}</div>
                        </div>
                        <span style={{ color: "#06B6D4", fontSize: 14, fontWeight: 700 }}>+</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
