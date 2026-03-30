import React from "react";

import { ImportZone } from "../../../components/common/ImportZone";
import { TrackRow } from "../../../components/common/TrackRow";
import { MOODS } from \"@suniplayer/core\";
import { THEME } from "../../../data/theme";
import { mc } from \"@suniplayer/core\";
import type { Track } from \"@suniplayer/core\";

interface BuilderRepertoirePanelProps {
    filteredTracks: Track[];
    customTracks: Track[];
    isPlaying: boolean;
    importOpen: boolean;
    search: string;
    selectedMood: string | null;
    onToggleImport: () => void;
    onSearchChange: (value: string) => void;
    onMoodChange: (mood: string | null) => void;
    onAddTrack: (track: Track) => void;
    onAppendToQueue: (track: Track) => void;
    onEditTrack: (track: Track) => void;
    onRemoveCustomTrack: (trackId: string) => void;
}

const queueButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: THEME.radius.sm,
    border: `1px solid ${THEME.colors.brand.violet}40`,
    backgroundColor: `${THEME.colors.brand.violet}10`,
    color: THEME.colors.brand.violet,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

export const BuilderRepertoirePanel: React.FC<BuilderRepertoirePanelProps> = ({
    filteredTracks,
    customTracks,
    isPlaying,
    importOpen,
    search,
    selectedMood,
    onToggleImport,
    onSearchChange,
    onMoodChange,
    onAddTrack,
    onAppendToQueue,
    onEditTrack,
    onRemoveCustomTrack,
}) => {
    return (
        <>
            <div style={{ padding: "16px", borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.text.primary }}>REPERTOIRE</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: THEME.colors.text.muted, fontFamily: THEME.fonts.mono }}>{filteredTracks.length + customTracks.length} items</span>
                        <button
                            onClick={onToggleImport}
                            title="Importar mis archivos de audio"
                            style={{
                                padding: "4px 10px",
                                borderRadius: THEME.radius.sm,
                                border: `1px solid ${importOpen ? THEME.colors.brand.violet : THEME.colors.border}`,
                                backgroundColor: importOpen ? `${THEME.colors.brand.violet}15` : "transparent",
                                color: importOpen ? THEME.colors.brand.violet : THEME.colors.text.muted,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                transition: "all 0.2s",
                            }}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Import
                        </button>
                    </div>
                </div>

                {importOpen && (
                    <div style={{ borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}`, overflow: "hidden" }}>
                        <ImportZone onClose={onToggleImport} />
                    </div>
                )}

                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search artist or title..."
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: THEME.radius.md,
                            border: `1px solid ${THEME.colors.border}`,
                            backgroundColor: THEME.colors.surface,
                            color: THEME.colors.text.primary,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                        }}
                        onFocus={(event) => {
                            event.target.style.borderColor = THEME.colors.brand.cyan;
                        }}
                        onBlur={(event) => {
                            event.target.style.borderColor = THEME.colors.border;
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button
                        onClick={() => onMoodChange(null)}
                        style={{
                            padding: "4px 10px",
                            borderRadius: THEME.radius.sm,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: !selectedMood ? "rgba(255,255,255,0.1)" : "transparent",
                            color: !selectedMood ? "white" : THEME.colors.text.muted,
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        All
                    </button>
                    {MOODS.map((mood) => (
                        <button
                            key={mood}
                            onClick={() => onMoodChange(selectedMood === mood ? null : mood)}
                            style={{
                                padding: "4px 10px",
                                borderRadius: THEME.radius.sm,
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: selectedMood === mood ? mc(mood) + "20" : "transparent",
                                color: selectedMood === mood ? mc(mood) : THEME.colors.text.muted,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "capitalize",
                            }}
                        >
                            {mood}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                {filteredTracks.map((track) => (
                    <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <TrackRow track={track} small idx={0} onAdd={onAddTrack} onEdit={onEditTrack} />
                        </div>
                        {isPlaying && (
                            <button
                                onClick={() => onAppendToQueue(track)}
                                title="Agregar a la cola del Player sin interrumpir"
                                style={{ ...queueButtonStyle, fontSize: 14, fontWeight: 700, transition: "all 0.15s", marginRight: 4 }}
                                onMouseEnter={(event) => {
                                    event.currentTarget.style.backgroundColor = `${THEME.colors.brand.violet}25`;
                                    event.currentTarget.style.transform = "scale(1.1)";
                                }}
                                onMouseLeave={(event) => {
                                    event.currentTarget.style.backgroundColor = `${THEME.colors.brand.violet}10`;
                                    event.currentTarget.style.transform = "scale(1)";
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M12 5v14M5 12l7 7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}

                {customTracks.length > 0 && (
                    <>
                        <div style={{ fontSize: 10, color: THEME.colors.brand.violet, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 10px 4px" }}>
                            Mis archivos importados
                        </div>
                        {customTracks
                            .filter(ct => !filteredTracks.some(ft => ft.file_path === ct.file_path))
                            .map((track) => (
                            <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <TrackRow track={track} small idx={0} onAdd={onAddTrack} onEdit={onEditTrack} />
                                </div>
                                {isPlaying && (
                                    <button onClick={() => onAppendToQueue(track)} title="Agregar a la cola" style={queueButtonStyle}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M12 5v14M5 12l7 7 7-7" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    onClick={() => onRemoveCustomTrack(track.id)}
                                    title="Eliminar archivo importado"
                                    style={{
                                        flexShrink: 0,
                                        width: 24,
                                        height: 24,
                                        borderRadius: THEME.radius.sm,
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: THEME.colors.text.muted,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 16,
                                        lineHeight: 1,
                                        marginRight: 4,
                                    }}
                                    onMouseEnter={(event) => {
                                        event.currentTarget.style.color = THEME.colors.status.error;
                                    }}
                                    onMouseLeave={(event) => {
                                        event.currentTarget.style.color = THEME.colors.text.muted;
                                    }}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </>
    );
};
