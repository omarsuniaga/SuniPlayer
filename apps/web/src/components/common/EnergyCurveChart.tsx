// EnergyCurveChart â€” Animated SVG energy curve for Builder buttons and Player dashboard
import React from "react";

export type CurveType = "steady" | "ascending" | "descending" | "wave";

interface Props {
    type: CurveType;
    size: "mini" | "large";
    /** 0â€“1: position of the playhead along the curve. Only shown in large mode. */
    playheadPct?: number;
    active?: boolean;
}

// Curve colors
const COLOR: Record<CurveType, string> = {
    steady:     "#06b6d4",
    ascending:  "#8b5cf6",
    descending: "#ef4444",
    wave:       "#f59e0b",
};

// SVG path definitions (viewBox 0 0 200 60, y=0 top, y=60 bottom)
const PATH: Record<CurveType, string> = {
    steady:     "M10,45 L190,45",
    ascending:  "M10,52 Q100,52 190,8",
    descending: "M10,8  Q100,52 190,52",
    wave:       "M10,30 C55,30 55,8 100,8 C145,8 145,52 190,52",
};

// Length approximations for stroke-dasharray animation
const PATH_LEN: Record<CurveType, number> = {
    steady:     180,
    ascending:  210,
    descending: 210,
    wave:       260,
};

// Area fill paths (closed shapes for the filled region below the curve)
const FILL_PATH: Record<CurveType, string> = {
    steady:     "M10,45 L190,45 L190,56 L10,56 Z",
    ascending:  "M10,52 Q100,52 190,8 L190,56 L10,56 Z",
    descending: "M10,8  Q100,52 190,52 L190,56 L10,56 Z",
    wave:       "M10,30 C55,30 55,8 100,8 C145,8 145,52 190,52 L190,56 L10,56 Z",
};

// Given pct (0â€“1), return the approximate (x, y) point along each curve
function curvePoint(type: CurveType, pct: number): { x: number; y: number } {
    const t = Math.max(0, Math.min(1, pct));
    const x = 10 + t * 180;
    switch (type) {
        case "steady":
            return { x, y: 45 };
        case "ascending":
            // Quadratic BÃ©zier: P0=(10,52) P1=(100,52) P2=(190,8)
            return {
                x: (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190,
                y: (1 - t) * (1 - t) * 52 + 2 * (1 - t) * t * 52 + t * t * 8,
            };
        case "descending":
            // Quadratic BÃ©zier: P0=(10,8) P1=(100,52) P2=(190,52)
            return {
                x: (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190,
                y: (1 - t) * (1 - t) * 8  + 2 * (1 - t) * t * 52 + t * t * 52,
            };
        case "wave": {
            // Cubic BÃ©zier: P0=(10,30) P1=(55,30) P2=(55,8) P3=(100,8)
            // then: P0=(100,8) P1=(145,8) P2=(145,52) P3=(190,52)
            const half = 0.5;
            if (t <= half) {
                const s = t / half;
                return {
                    x:  (1-s)**3*10  + 3*(1-s)**2*s*55  + 3*(1-s)*s**2*55  + s**3*100,
                    y:  (1-s)**3*30  + 3*(1-s)**2*s*30  + 3*(1-s)*s**2*8   + s**3*8,
                };
            } else {
                const s = (t - half) / half;
                return {
                    x:  (1-s)**3*100 + 3*(1-s)**2*s*145 + 3*(1-s)*s**2*145 + s**3*190,
                    y:  (1-s)**3*8   + 3*(1-s)**2*s*8   + 3*(1-s)*s**2*52  + s**3*52,
                };
            }
        }
    }
}

// CSS keyframes injected once per session
const STYLES = `
@keyframes ecSteadyPulse {
  0%,100% { opacity:1; } 50% { opacity:0.45; }
}
@keyframes ecDraw {
  0%     { stroke-dashoffset: var(--ec-len); }
  65%    { stroke-dashoffset: 0; }
  85%    { stroke-dashoffset: 0; }
  100%   { stroke-dashoffset: var(--ec-len); }
}
@keyframes ecWaveDraw {
  0%     { stroke-dashoffset: var(--ec-len); }
  70%    { stroke-dashoffset: 0; }
  88%    { stroke-dashoffset: 0; }
  100%   { stroke-dashoffset: var(--ec-len); }
}
`;

let stylesInjected = false;
function injectStyles() {
    if (stylesInjected || typeof document === "undefined") return;
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    stylesInjected = true;
}

export const EnergyCurveChart: React.FC<Props> = ({ type, size, playheadPct, active }) => {
    injectStyles();

    const color = COLOR[type];
    const path  = PATH[type];
    const fill  = FILL_PATH[type];
    const len   = PATH_LEN[type];
    const h     = size === "large" ? 80 : 52;

    // Animation style per curve type
    const animStyle: React.CSSProperties =
        type === "steady"
            ? { animation: "ecSteadyPulse 2s ease-in-out infinite" }
            : type === "wave"
            ? {
                strokeDasharray: len,
                strokeDashoffset: len,
                // @ts-expect-error CSS custom property
                "--ec-len": len,
                animation: "ecWaveDraw 3s ease-in-out infinite",
            }
            : {
                strokeDasharray: len,
                strokeDashoffset: len,
                "--ec-len": len,
                animation: "ecDraw 2.5s ease-in-out infinite",
            } as React.CSSProperties;

    // Playhead dot (large mode only)
    const dot = playheadPct !== undefined && size === "large"
        ? curvePoint(type, playheadPct)
        : null;

    return (
        <svg
            viewBox="0 0 200 60"
            width="100%"
            height={h}
            style={{ display: "block", overflow: "visible" }}
            aria-hidden
        >
            {/* Filled area */}
            <path
                d={fill}
                fill={color}
                opacity={active ? 0.12 : 0.06}
                style={{ transition: "opacity 0.3s" }}
            />

            {/* Animated curve line */}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={size === "large" ? 2.5 : 2}
                strokeLinecap="round"
                opacity={active ? 1 : 0.55}
                style={{ ...animStyle, transition: "opacity 0.3s" }}
            />

            {/* Endpoint dots */}
            <circle cx="10"  cy={type === "ascending"  ? 52 : type === "descending" ? 8  : type === "wave" ? 30 : 45} r="2.5" fill={color} opacity={active ? 0.8 : 0.4} />
            <circle cx="190" cy={type === "ascending"  ? 8  : type === "descending" ? 52 : type === "wave" ? 52 : 45} r="2.5" fill={color} opacity={active ? 0.8 : 0.4} />

            {/* Playhead (large mode only) */}
            {dot && (
                <>
                    {/* Vertical line */}
                    <line
                        x1={dot.x} y1={0}
                        x2={dot.x} y2={60}
                        stroke={color}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.35"
                    />
                    {/* Glowing dot on curve */}
                    <circle cx={dot.x} cy={dot.y} r="5" fill={color} opacity="0.2" />
                    <circle cx={dot.x} cy={dot.y} r="3" fill={color} opacity="0.9" />
                </>
            )}
        </svg>
    );
};
