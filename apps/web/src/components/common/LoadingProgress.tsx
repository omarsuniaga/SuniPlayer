import React from "react";
import { THEME } from "../../data/theme";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingProgressProps {
    label: string;
    progress: number;
    detail?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
    label,
    progress,
    detail,
}) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
        <div
            style={{
                flex: 1,
                minHeight: 260,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 18,
                padding: "32px 24px",
                textAlign: "center",
            }}
        >
            <LoadingSpinner size={28} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 420 }}>
                <strong style={{ color: "white", fontSize: 20, fontWeight: 800 }}>{label}</strong>
                {detail && (
                    <span style={{ color: THEME.colors.text.muted, fontSize: 13, lineHeight: 1.5 }}>
                        {detail}
                    </span>
                )}
                <div
                    style={{
                        height: 10,
                        width: "100%",
                        borderRadius: 999,
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.08)",
                        border: `1px solid ${THEME.colors.border}`,
                        marginTop: 10,
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${clampedProgress}%`,
                            borderRadius: 999,
                            background: THEME.gradients.brand,
                            transition: "width 0.25s ease",
                            boxShadow: `0 0 18px ${THEME.colors.brand.cyan}50`,
                        }}
                    />
                </div>
                <span style={{ color: THEME.colors.brand.cyan, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em" }}>
                    {Math.round(clampedProgress)}%
                </span>
            </div>
        </div>
    );
};
