import React from "react";
import { THEME } from "../../data/theme";

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
    return (
        <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            paddingBottom: "20px",
            borderBottom: `1px solid ${THEME.colors.border}`,
            marginBottom: "20px"
        }}>
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    onClick={onImport}
                    style={{ 
                        padding: "10px 16px", 
                        borderRadius: "10px", 
                        background: THEME.colors.brand.cyan, 
                        color: "black", 
                        border: "none", 
                        fontWeight: 800, 
                        fontSize: "13px", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        transition: "all 0.2s"
                    }}
                >
                    <span style={{ fontSize: "16px" }}>+</span> IMPORTAR
                </button>
                
                {hasTracks && (
                    <button
                        onClick={() => confirm("¿VACIAR BIBLIOTECA? Esta acción borrará todos los archivos locales.") && onClear()}
                        style={{ 
                            padding: "10px 16px", 
                            borderRadius: "10px", 
                            background: "rgba(239, 68, 68, 0.1)", 
                            color: THEME.colors.status.error, 
                            border: `1px solid ${THEME.colors.status.error}30`, 
                            fontWeight: 700, 
                            fontSize: "13px", 
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
                        padding: "10px 20px", 
                        borderRadius: "10px", 
                        background: THEME.gradients.brand, 
                        color: "white", 
                        border: "none", 
                        fontWeight: 900, 
                        fontSize: "13px", 
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
