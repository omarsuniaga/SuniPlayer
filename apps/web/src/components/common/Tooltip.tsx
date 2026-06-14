import React, { useState } from "react";

interface TooltipProps {
    content: string;
    children: React.ReactElement;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
    content, 
    children, 
    position = "top",
    delay = 300 
}) => {
    const [visible, setVisible] = useState(false);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const show = () => {
        const t = setTimeout(() => setVisible(true), delay);
        setTimer(t);
    };

    const hide = () => {
        if (timer) clearTimeout(timer);
        setVisible(false);
    };

    const posStyles: Record<string, React.CSSProperties> = {
        top: { bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-8px)" },
        bottom: { top: "100%", left: "50%", transform: "translateX(-50%) translateY(8px)" },
        left: { right: "100%", top: "50%", transform: "translateY(-50%) translateX(-8px)" },
        right: { left: "100%", top: "50%", transform: "translateY(-50%) translateX(8px)" },
    };

    return (
        <div 
            style={{ position: "relative", display: "inline-flex" }}
            onMouseEnter={show}
            onMouseLeave={hide}
        >
            {children}
            {visible && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 10000,
                        padding: "6px 10px",
                        backgroundColor: "var(--c-bg-modal)",
                        color: "var(--c-text)",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        border: "1px solid var(--c-border)",
                        ...posStyles[position],
                        animation: "tooltipFadeIn 0.15s ease-out",
                    }}
                >
                    {content}
                    {/* Shadow Arrow */}
                    <div style={{
                        position: "absolute",
                        width: 6, height: 6,
                        backgroundColor: "var(--c-bg-modal)",
                        borderRight: "1px solid var(--c-border)",
                        borderBottom: "1px solid var(--c-border)",
                        transform: position === "top" ? "rotate(45deg) translateX(-50%)" : "none",
                        left: position === "top" ? "calc(50% - 3px)" : "none",
                        bottom: position === "top" ? -4 : "none",
                        display: position === "top" ? "block" : "none" // Only top arrow for now to keep it simple
                    }} />
                </div>
            )}
            <style>{`
                @keyframes tooltipFadeIn {
                    from { opacity: 0; transform: scale(0.95) ${posStyles[position].transform}; }
                    to { opacity: 1; transform: scale(1) ${posStyles[position].transform}; }
                }
            `}</style>
        </div>
    );
};
