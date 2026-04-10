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
    genSetLength?: number;
}

export const BuilderConfigSection: React.FC<BuilderConfigSectionProps> = ({
    targetMin, venue, curve, onTargetMinChange, onVenueChange, onCurveChange, onGenerate, genSetLength = 0
}) => {
    const { 
        durationPresets, addDurationPreset, harmonicMixing, setHarmonicMixing,
        energyContinuity, setEnergyContinuity, bpmMin, setBpmMin, bpmMax, setBpmMax,
        djProfiles, saveDJProfile, loadDJProfile, deleteDJProfile
    } = useSettingsStore();
    const repertoire = useLibraryStore(s => s.repertoire);
    const [showAdvanced, setShowAdvanced] = React.useState(false);
    const [newProfileName, setNewProfileName] = React.useState("");
    const [isSavingProfile, setIsSavingProfile] = React.useState(false);

    return (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <style>{`
                .config-row { display: flex; alignItems: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .config-label { font-size: 8px; font-weight: 900; color: #666; text-transform: uppercase; width: 40px; flex-shrink: 0; }
                .btn-pill { padding: 4px 8px; border-radius: 4px; border: 1px solid #333; background: #111; color: #aaa; font-size: 10px; font-weight: 700; cursor: pointer; white-space: nowrap; }
                .btn-pill.active { border-color: ${THEME.colors.brand.cyan}; color: ${THEME.colors.brand.cyan}; background: rgba(6,182,212,0.1); }
                @media (max-width: 640px) {
                    .config-row { gap: 4px; }
                    .btn-pill { padding: 8px 12px; font-size: 11px; }
                }
            `}</style>

            <div className="config-row">
                <label className="config-label">Tiempo</label>
                <div style={{ display: "flex", gap: 4, overflowX: "auto" }} className="no-scrollbar">
                    {durationPresets.map(m => (
                        <button key={m} onClick={() => onTargetMinChange(m)} className={`btn-pill ${targetMin === m ? "active" : ""}`}>{m}m</button>
                    ))}
                </div>
            </div>

            <div className="config-row">
                <label className="config-label">Energía</label>
                <div style={{ display: "flex", gap: 4, overflowX: "auto" }} className="no-scrollbar">
                    {CURVES.map(c => (
                        <button key={c.id} onClick={() => onCurveChange(c.id)} className={`btn-pill ${curve === c.id ? "active" : ""}`}>{c.label}</button>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: 4 }}>
                <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ background: "none", border: "none", color: THEME.colors.brand.violet, fontSize: 9, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    {showAdvanced ? "▼ Ocultar Estrategia" : "▶ Estrategia DJ"}
                </button>

                {showAdvanced && (
                    <div style={{ marginTop: 8, padding: 8, background: "rgba(139, 92, 246, 0.05)", borderRadius: 4, border: "1px solid rgba(139, 92, 246, 0.2)", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700 }}>Mezcla Armónica</span>
                            <button onClick={() => setHarmonicMixing(!harmonicMixing)} style={{ width: 32, height: 16, borderRadius: 8, border: "none", background: harmonicMixing ? THEME.colors.brand.violet : "#333", position: "relative" }}>
                                <span style={{ position: "absolute", top: 2, left: harmonicMixing ? 18 : 2, width: 12, height: 12, borderRadius: "50%", background: "white" }} />
                            </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#888", width: 40 }}>BPM</span>
                            <input type="range" min={60} max={180} value={bpmMax} onChange={e => setBpmMax(Number(e.target.value))} style={{ flex: 1, accentColor: THEME.colors.brand.violet }} />
                            <span style={{ fontSize: 9, fontFamily: THEME.fonts.mono }}>{bpmMax}</span>
                        </div>
                    </div>
                )}
            </div>

            <button onClick={onGenerate} style={{ width: "100%", padding: "10px", borderRadius: 4, border: "none", background: THEME.gradients.brand, color: "white", fontSize: 11, fontWeight: 900, marginTop: 4 }}>
                GENERAR SET
            </button>
        </section>
    );
};
