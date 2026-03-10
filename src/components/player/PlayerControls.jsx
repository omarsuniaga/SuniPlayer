import React from "react";

export const PlayerControls = ({ playing, onToggle, onPrev, onNext, ci, queueLength, mCol, mode }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 18, marginBottom: 20 }}>
            <button
                onClick={onPrev}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, opacity: ci > 0 ? 0.5 : 0.15 }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#F0F4F8">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
            </button>
            <button
                onClick={onToggle}
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    background: `linear-gradient(135deg,${mCol},${mode === "live" ? "#0891B2" : "#7C3AED"})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: playing ? `0 0 24px ${mCol}50` : "0 4px 16px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
                {playing ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>
            <button
                onClick={onNext}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, opacity: ci < queueLength - 1 ? 0.5 : 0.15 }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#F0F4F8">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
            </button>
        </div>
    );
};
