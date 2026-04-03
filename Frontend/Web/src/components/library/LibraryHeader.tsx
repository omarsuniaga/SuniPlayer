import React from "react";
import { THEME } from "../../data/theme";
import { useIsMobile } from "../../utils/useMediaQuery";
import { useLibraryStore } from "../../store/useLibraryStore";

interface LibraryHeaderProps {
    onImport: () => void;
    onClear: () => void;
    search: string;
    onSearchChange: (val: string) => void;
    selectionCount: number;
    onClearSelection: () => void;
    onMassDelete: () => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
    onImport,
    onClear,
    search,
    onSearchChange,
    selectionCount,
    onClearSelection,
    onMassDelete
}) => {
    const isMobile = useIsMobile();

    return (
        <header style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backgroundColor: "rgba(10, 14, 20, 0.8)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${THEME.colors.border}`,
            padding: isMobile ? "16px 16px" : "24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? 20 : 32,
                        fontWeight: 900,
                        margin: 0,
                        color: "white",
                        letterSpacing: "-0.02em"
                    }}>
                        {selectionCount > 0 ? `${selectionCount} Seleccionados` : "Biblioteca"}
                    </h1>
                    {!isMobile && selectionCount === 0 && (
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: THEME.colors.text.muted, fontWeight: 500 }}>
                            Gestiona tu repertorio local y en la nube.
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    {selectionCount > 0 ? (
                        <>
                            <button 
                                onClick={onClearSelection}
                                style={{
                                    padding: "8px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
                                    color: "white", border: `1px solid ${THEME.colors.border}`, cursor: "pointer",
                                    fontSize: 12, fontWeight: 700
                                }}
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={onMassDelete}
                                style={{
                                    padding: "8px 16px", borderRadius: 10, background: THEME.colors.status.error + "20",
                                    color: THEME.colors.status.error, border: `1px solid ${THEME.colors.status.error}40`, 
                                    cursor: "pointer", fontSize: 12, fontWeight: 700
                                }}
                            >
                                ELIMINAR
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onImport}
                                style={{
                                    padding: "10px 20px", borderRadius: 12, background: THEME.colors.brand.cyan,
                                    color: "black", border: "none", cursor: "pointer",
                                    fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8
                                }}
                            >
                                <span style={{ fontSize: 18 }}>+</span> IMPORTAR
                            </button>
                            {!isMobile && (
                                <button
                                    onClick={() => confirm("¿Vaciar biblioteca?") && onClear()}
                                    style={{
                                        padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.03)",
                                        color: THEME.colors.text.muted, border: `1px solid ${THEME.colors.border}`, 
                                        cursor: "pointer", display: "flex", alignItems: "center"
                                    }}
                                    title="Vaciar Biblioteca"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Search Input Integrated */}
            <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: THEME.colors.text.muted }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <input 
                    type="text"
                    placeholder="Busca por título, artista o etiqueta..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                        width: "100%", padding: "12px 12px 12px 44px", borderRadius: 14,
                        backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${THEME.colors.border}`,
                        color: "white", fontSize: 14, fontWeight: 500, outline: "none",
                        transition: "all 0.2s"
                    }}
                />
            </div>
        </header>
    );
};
