import React from "react";
import { VENUES, CURVES } from "../../data/mockTracks";

export const SetBuilderConfig = ({ targetMin, setTargetMin, venue, setVenue, curve, setCurve, onGen }) => {
    return (
        <>
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Duracion
                </label>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {[30, 45, 60, 90, 120].map((m) => (
                        <button
                            key={m}
                            onClick={() => setTargetMin(m)}
                            style={{
                                padding: "7px 14px",
                                borderRadius: 7,
                                cursor: "pointer",
                                border: `1px solid ${targetMin === m ? "#06B6D4" : "rgba(255,255,255,0.08)"}`,
                                backgroundColor: targetMin === m ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.02)",
                                color: targetMin === m ? "#06B6D4" : "rgba(255,255,255,0.5)",
                                fontWeight: 600,
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono',monospace",
                            }}
                        >
                            {m}min
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Venue
                </label>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {VENUES.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setVenue(v.id)}
                            style={{
                                padding: "7px 12px",
                                borderRadius: 7,
                                cursor: "pointer",
                                border: `1px solid ${venue === v.id ? v.color + "60" : "rgba(255,255,255,0.08)"}`,
                                backgroundColor: venue === v.id ? v.color + "18" : "rgba(255,255,255,0.02)",
                                color: venue === v.id ? v.color : "rgba(255,255,255,0.5)",
                                fontWeight: 500,
                                fontSize: 12,
                            }}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Energia
                </label>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {CURVES.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCurve(c.id)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 7,
                                cursor: "pointer",
                                flex: 1,
                                border: `1px solid ${curve === c.id ? "#8B5CF660" : "rgba(255,255,255,0.08)"}`,
                                backgroundColor: curve === c.id ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                                color: curve === c.id ? "#8B5CF6" : "rgba(255,255,255,0.5)",
                                fontWeight: 500,
                                fontSize: 12,
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: 11 }}>{c.label}</div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{c.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div
                style={{
                    position: "relative",
                    borderRadius: 12,
                    padding: 2,
                    background: "linear-gradient(135deg,#06B6D4,#8B5CF6,#EC4899)",
                    marginBottom: 16,
                }}
            >
                <button
                    onClick={onGen}
                    style={{
                        width: "100%",
                        padding: "14px 24px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "#0A0E14",
                        color: "white",
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        transition: "background-color .2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F1520")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0A0E14")}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="url(#grd)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    >
                        <defs>
                            <linearGradient id="grd" x1="0" y1="0" x2="24" y2="24">
                                <stop offset="0%" stopColor="#06B6D4" />
                                <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                        </defs>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Generar Set de {targetMin} minutos
                </button>
            </div>
        </>
    );
};
