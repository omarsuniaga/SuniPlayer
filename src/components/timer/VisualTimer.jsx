import React from "react";
import { fmt } from "../../utils/time";

export const VisualTimer = ({ rem, tPct, tCol, elapsed, tTarget }) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ position: "relative", width: 76, height: 76 }}>
                <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                        cx="38"
                        cy="38"
                        r="32"
                        fill="none"
                        stroke={tCol}
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - tPct)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear, stroke .5s" }}
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: tCol }}>
                        {fmt(rem)}
                    </span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                        left
                    </span>
                </div>
            </div>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace" }}>
                {fmt(elapsed)}/{fmt(tTarget)}
            </span>
        </div>
    );
};
