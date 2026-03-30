import React from "react";
import type { TrackMarker } from "@suniplayer/core";
import { blinkDurationSec, BubbleState } from "./markerUtils";

interface MarkerBubbleProps {
    marker: TrackMarker;
    durationMs: number;
    playheadMs: number;
    state: BubbleState;           // "visible" | "fading"
    stackIndex: number;           // 0, 1, 2… for side-by-side layout
}

export const MarkerBubble: React.FC<MarkerBubbleProps> = ({
    marker, durationMs, playheadMs, state, stackIndex,
}) => {
    if (state === "hidden") return null;

    const leftPct = durationMs > 0 ? (marker.posMs / durationMs) * 100 : 0;
    const distanceSec = Math.max(0, (marker.posMs - playheadMs) / 1000);
    const blinkSec = blinkDurationSec(distanceSec);
    // Fading state = 0-10s after playhead passes. Bubble stays fully visible
    // during this window; disappears when getBubbleState returns "hidden".
    const opacity = 1;

    // Horizontal offset for stacked bubbles (same posMs)
    const BUBBLE_WIDTH = 280; // max px — actual width adjusts to text
    const offsetX = stackIndex * (BUBBLE_WIDTH + 8);

    return (
        <div
            style={{
                position: "absolute",
                left: `${leftPct}%`,
                bottom: 14,                         // above the dot
                transform: `translateX(calc(-50% + ${offsetX}px))`,
                zIndex: 20,
                pointerEvents: "none",
                opacity,
            }}
        >
            <div
                style={{
                    backgroundColor: "rgba(10,10,15,0.95)",
                    borderRadius: 8,
                    padding: "12px",
                    maxWidth: BUBBLE_WIDTH,
                    minWidth: 100,
                    boxSizing: "border-box",
                    // Blinking border via box-shadow animation
                    animation: `markerPulse ${blinkSec}s ease-in-out infinite`,
                }}
            >
                <div style={{
                    fontSize: 12,
                    color: "white",
                    lineHeight: 1.4,
                    // Max 3 lines
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                    wordBreak: "break-word",
                }}>
                    {marker.comment}
                </div>
            </div>
        </div>
    );
};
