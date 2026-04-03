import React from "react";
import { THEME } from "../../data/theme";
import { useIsMobile } from "../../utils/useMediaQuery";

interface FilterBarProps {
    availableTags: string[];
    activeTags: string[];
    onToggleTag: (tag: string) => void;
    onClear: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    availableTags,
    activeTags,
    onToggleTag,
    onClear
}) => {
    const isMobile = useIsMobile();

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: isMobile ? "8px 16px" : "12px 32px",
            backgroundColor: "#0A0E14",
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none", // Hide scrollbar
            msOverflowStyle: "none",
        }}>
            <style>{`
                div::-webkit-scrollbar { display: none; }
            `}</style>

            <button 
                onClick={onClear}
                style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                    background: activeTags.length === 0 ? THEME.colors.brand.cyan : "rgba(255,255,255,0.05)",
                    color: activeTags.length === 0 ? "black" : THEME.colors.text.muted,
                    border: activeTags.length === 0 ? "none" : `1px solid ${THEME.colors.border}`,
                    cursor: "pointer", transition: "all 0.2s"
                }}
            >
                TODOS
            </button>

            <div style={{ width: 1, height: 20, backgroundColor: THEME.colors.border, flexShrink: 0 }} />

            {availableTags.map(tag => {
                const isActive = activeTags.includes(tag);
                return (
                    <button
                        key={tag}
                        onClick={() => onToggleTag(tag)}
                        style={{
                            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: isActive ? `${THEME.colors.brand.cyan}20` : "transparent",
                            color: isActive ? THEME.colors.brand.cyan : THEME.colors.text.muted,
                            border: `1px solid ${isActive ? THEME.colors.brand.cyan : THEME.colors.border}`,
                            cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        {tag.toUpperCase()}
                    </button>
                );
            })}
        </div>
    );
};
