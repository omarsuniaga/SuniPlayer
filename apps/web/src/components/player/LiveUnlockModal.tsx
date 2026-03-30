import React from "react";
import { createPortal } from "react-dom";
import { THEME } from "../../data/theme.ts";

interface LiveUnlockModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const LiveUnlockModal: React.FC<LiveUnlockModalProps> = ({ onConfirm, onCancel }) => createPortal(
    <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
        overflowY: "auto",
        boxSizing: "border-box",
    }}>
        {/* Backdrop / Fondo oscuro desenfocado */}
        <div
            onClick={onCancel}
            style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                animation: "fadeIn 0.2s ease-out",
            }}
        />

        {/* Dialog / Ventana de confirmaciÃ³n */}
        <div
            style={{
                position: "relative",
                zIndex: 10001,
                backgroundColor: "#121820",
                border: `1px solid ${THEME.colors.brand.violet}60`,
                borderRadius: "24px",
                padding: "28px",
                width: "100%",
                maxWidth: "420px",
                maxHeight: "calc(100dvh - 40px)",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxShadow: `0 0 80px rgba(139, 92, 246, 0.25), 0 40px 80px rgba(0,0,0,0.8)`,
                animation: "modalZoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                flexShrink: 0,
            }}
        >
            {/* Header: Icon + Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                    width: 52, height: 52,
                    borderRadius: "14px",
                    backgroundColor: "rgba(139, 92, 246, 0.15)",
                    border: `1px solid rgba(139, 92, 246, 0.4)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.brand.violet} strokeWidth="2.5" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "white" }}>Salir del Modo Show</h3>
                    <p style={{ fontSize: 13, color: THEME.colors.text.muted, margin: "4px 0 0" }}>ProtecciÃ³n de escenario activa</p>
                </div>
            </div>

            {/* Content */}
            <p style={{ fontSize: 15, color: THEME.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>
                EstÃ¡s por desactivar el bloqueo durante una <strong style={{ color: "white" }}>presentaciÃ³n en vivo</strong>.
                Esto permitirÃ¡ modificar el repertorio y los controles crÃ­ticos.
                <br /><br />
                Â¿ConfirmÃ¡s que querÃ©s volver al <strong style={{ color: THEME.colors.brand.cyan }}>Modo Edit</strong>?
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "12px",
                        border: `1px solid rgba(255,255,255,0.1)`,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                >
                    Continuar en Show
                </button>
                <button
                    onClick={onConfirm}
                    style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor: THEME.colors.brand.violet,
                        color: "white",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: `0 8px 20px rgba(139, 92, 246, 0.4)`,
                        transition: "all 0.2s",
                    }}
                >
                    SÃ­, Desbloquear
                </button>
            </div>
        </div>

        <style>{`
            @keyframes modalZoom {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `}</style>
    </div>,
    document.body
);
