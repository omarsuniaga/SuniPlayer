import React from "react";

import { CURVES, VENUES } from "@suniplayer/core";
import { THEME } from "../../../data/theme";
import { EnergyCurveChart } from "../../../components/common/EnergyCurveChart";
import type { CurveType } from "../../../components/common/EnergyCurveChart";
import type { Show, Track } from "@suniplayer/core";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useLibraryStore } from "../../../store/useLibraryStore";

interface BuilderConfigSectionProps {
    targetMin: number;
    venue: string;
    curve: string;
    onTargetMinChange: (minutes: number) => void;
    onVenueChange: (venue: string) => void;
    onCurveChange: (curve: string) => void;
    onGenerate: () => void;
    // Show context props
    currentShow?: Show | null;
    genSetLength?: number;
    onNewShow?: () => void;
    onAddSet?: () => void;
}

export const BuilderConfigSection: React.FC<BuilderConfigSectionProps> = ({
    targetMin,
    venue,
    curve,
    onTargetMinChange,
    onVenueChange,
    onCurveChange,
    onGenerate,
    currentShow,
    genSetLength = 0,
    onNewShow,
    onAddSet,
}) => {
    const { durationPresets, addDurationPreset, removeDurationPreset } = useSettingsStore();
    const customTracks = useLibraryStore(s => s.customTracks);
    
    // Calculate total library capacity in minutes
    const totalLibMs = customTracks.reduce((sum: number, t: Track) => sum + t.duration_ms, 0);
    const totalLibMin = Math.floor(totalLibMs / 60000);

    const [isAdding, setIsAdding] = React.useState(false);
    const [customVal, setCustomVal] = React.useState("");

    const handleAdd = () => {
        const val = parseInt(customVal);
        if (!isNaN(val) && val > 0) {
            addDurationPreset(val);
            onTargetMinChange(val);
            setCustomVal("");
            setIsAdding(false);
        }
    };

    // Determine which action button to render
    const hasShow = !!currentShow;
    const hasGeneratedSet = genSetLength > 0;
    const activeSetLabel = currentShow ? currentShow.sets[currentShow.sets.length - 1].label : "Set";
    const nextSetNum = currentShow ? currentShow.sets.length + 1 : 2;

    return (
        <>
            <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Set Configuration</h2>
                    <span style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.text.muted }}>
                        LIB CAPACITY: <span style={{ color: totalLibMin < targetMin ? THEME.colors.status.warning : THEME.colors.brand.cyan }}>{totalLibMin} min</span>
                    </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Duration</label>
                            {totalLibMin < targetMin && (
                                <span style={{ fontSize: 10, color: THEME.colors.status.warning, fontWeight: 700 }}>⚠️ Insufficient music</span>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="duration-grid">
                            {durationPresets.map((minutes) => {
                                const isInsufficient = minutes > totalLibMin;
                                return (
                                <button
                                    key={minutes}
                                    onClick={() => onTargetMinChange(minutes)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (confirm(`Remove ${minutes}m preset?`)) removeDurationPreset(minutes);
                                    }}
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: THEME.radius.md,
                                        cursor: "pointer",
                                        border: `1px solid ${targetMin === minutes ? THEME.colors.brand.cyan : (isInsufficient ? THEME.colors.border + "40" : THEME.colors.border)}`,
                                        backgroundColor: targetMin === minutes ? "rgba(6,182,212,0.1)" : THEME.colors.surface,
                                        color: targetMin === minutes ? THEME.colors.brand.cyan : (isInsufficient ? THEME.colors.text.muted : THEME.colors.text.secondary),
                                        fontWeight: 600,
                                        fontSize: 14,
                                        fontFamily: THEME.fonts.mono,
                                        transition: "all 0.2s",
                                        opacity: isInsufficient ? 0.6 : 1,
                                        textDecoration: isInsufficient ? "line-through" : "none"
                                    }}
                                    title={isInsufficient ? "Not enough music in library" : ""}
                                >
                                    {minutes}m
                                </button>
                            )})}
                            
                            {isAdding ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                    <input 
                                        type="number" 
                                        value={customVal}
                                        autoFocus
                                        onChange={e => setCustomVal(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                                        placeholder="Min"
                                        style={{ width: 60, padding: "8px", borderRadius: THEME.radius.sm, border: `1px solid ${THEME.colors.brand.cyan}`, backgroundColor: THEME.colors.surface, color: "white", textAlign: "center", fontSize: 14 }}
                                    />
                                    <button onClick={handleAdd} style={{ padding: "8px 12px", borderRadius: THEME.radius.sm, border: "none", background: THEME.colors.brand.cyan, color: "black", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>OK</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    style={{ padding: "10px 16px", borderRadius: THEME.radius.md, cursor: "pointer", border: `1px dashed ${THEME.colors.border}`, backgroundColor: "transparent", color: THEME.colors.text.muted, fontSize: 14, fontWeight: 600 }}
                                >
                                    +
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Venue</label>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            {VENUES.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onVenueChange(item.id)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: THEME.radius.md,
                                        cursor: "pointer",
                                        border: `1px solid ${venue === item.id ? item.color + "80" : THEME.colors.border}`,
                                        backgroundColor: venue === item.id ? item.color + "15" : THEME.colors.surface,
                                        color: venue === item.id ? item.color : THEME.colors.text.secondary,
                                        fontWeight: 500,
                                        fontSize: 13,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Energy Curve</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 8 }}>
                            {CURVES.map((item) => {
                                const isActive = curve === item.id;
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => onCurveChange(item.id)}
                                    style={{
                                        padding: "12px 12px 10px",
                                        borderRadius: THEME.radius.md,
                                        cursor: "pointer",
                                        border: `1px solid ${isActive ? THEME.colors.brand.violet + "80" : THEME.colors.border}`,
                                        backgroundColor: isActive ? THEME.colors.brand.violet + "10" : THEME.colors.surface,
                                        color: isActive ? THEME.colors.brand.violet : THEME.colors.text.secondary,
                                        textAlign: "left",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <EnergyCurveChart
                                        type={item.id as CurveType}
                                        size="mini"
                                        active={isActive}
                                    />
                                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{item.label}</div>
                                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{item.desc}</div>
                                </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Action Button ── */}
            {!hasShow ? (
                // No active show — offer "New Show"
                <div
                    style={{
                        position: "relative",
                        padding: "2px",
                        background: THEME.gradients.brand,
                        borderRadius: THEME.radius.xl,
                        boxShadow: `0 8px 32px ${THEME.colors.brand.cyan}20`,
                    }}
                >
                    <button
                        onClick={onNewShow}
                        style={{
                            width: "100%",
                            padding: "18px",
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: THEME.colors.bg,
                            color: "white",
                            fontSize: 16,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = "transparent"; }}
                        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = THEME.colors.bg; }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New Show
                    </button>
                </div>
            ) : !hasGeneratedSet ? (
                // Show exists, set is empty — Generate the active set
                <div
                    style={{
                        position: "relative",
                        padding: "2px",
                        background: THEME.gradients.brand,
                        borderRadius: THEME.radius.xl,
                        boxShadow: `0 8px 32px ${THEME.colors.brand.cyan}20`,
                    }}
                >
                    <button
                        onClick={onGenerate}
                        style={{
                            width: "100%",
                            padding: "18px",
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: THEME.colors.bg,
                            color: "white",
                            fontSize: 16,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = "transparent"; }}
                        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = THEME.colors.bg; }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Generate {activeSetLabel}
                    </button>
                </div>
            ) : (
                // Show exists and set has tracks — offer "+ Add Set N"
                <div
                    style={{
                        position: "relative",
                        padding: "2px",
                        background: `linear-gradient(135deg, ${THEME.colors.brand.violet}, ${THEME.colors.brand.cyan})`,
                        borderRadius: THEME.radius.xl,
                        boxShadow: `0 8px 32px ${THEME.colors.brand.violet}30`,
                    }}
                >
                    <button
                        onClick={onAddSet}
                        style={{
                            width: "100%",
                            padding: "18px",
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: THEME.colors.bg,
                            color: "white",
                            fontSize: 16,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = "transparent"; }}
                        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = THEME.colors.bg; }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        + Add Set {nextSetNum}
                    </button>
                </div>
            )}
        </>
    );
};
