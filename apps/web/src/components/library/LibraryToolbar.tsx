import React from "react";
import { THEME } from "../../data/theme";
import { useIsMobile } from "../../utils/useMediaQuery";

interface LibraryToolbarProps {
    onImport: () => void;
    onClear: () => void;
    onAcceptSelected?: () => void;
    showAccept?: boolean;
    hasTracks: boolean;
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
    onImport,
    onClear,
    onAcceptSelected,
    showAccept,
    hasTracks
}) => {
    const isMobile = useIsMobile();

    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            paddingBottom: isMobile ? "12px" : "20px",
            borderBottom: `1px solid ${THEME.colors.border}`,
            marginBottom: isMobile ? "10px" : "20px",
            gap: isMobile ? "12px" : 0,
        }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                    onClick={onImport}
                    style={{
                        width: isMobile ? "24px" : "auto",
                        height: isMobile ? "24px" : "auto",
                        padding: isMobile ? "0" : "10px 16px",
                        borderRadius: isMobile ? "999px" : "10px",
                        background: THEME.colors.brand.cyan,
                        color: "black",
                        border: "none",
                        fontWeight: 600,
                        fontSize: isMobile ? "14px" : "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isMobile ? "0" : "8px",
                        transition: "all 0.2s"
                    }}
                    aria-label="Importar audios"
                >
                    <span style={{ fontSize: isMobile ? "24px" : "16px", lineHeight: 1 }}>+</span>
                    {!isMobile && " IMPORTAR"}
                </button>

                {hasTracks && (
                    <button
                        onClick={() => confirm("?VACIAR BIBLIOTECA? Esta acci?n borrar? todos los archivos locales.") && onClear()}
                        style={{
                            padding: isMobile ? "8px 12px" : "10px 16px",
                            borderRadius: isMobile ? "999px" : "10px",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: THEME.colors.status.error,
                            border: `1px solid ${THEME.colors.status.error}30`,
                            fontWeight: 700,
                            fontSize: isMobile ? "11px" : "13px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        BORRAR TODO
                    </button>
                )}
            </div>

            {showAccept && (
                <button
                    onClick={onAcceptSelected}
                    style={{
                        padding: isMobile ? "10px 14px" : "10px 20px",
                        borderRadius: isMobile ? "999px" : "10px",
                        background: THEME.gradients.brand,
                        color: "white",
                        border: "none",
                        fontWeight: 900,
                        fontSize: isMobile ? "11px" : "13px",
                        cursor: "pointer",
                        boxShadow: `0 8px 20px ${THEME.colors.brand.cyan}30`,
                        transition: "all 0.2s"
                    }}
                >
                    ACEPTAR SELECCIONADOS
                </button>
            )}
        </div>
    );
};
