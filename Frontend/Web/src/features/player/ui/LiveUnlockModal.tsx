// src/features/player/ui/LiveUnlockModal.tsx
import React from "react";
import { THEME } from "../../../data/theme.ts";

interface Props {
    onConfirm: () => void;
    onCancel: () => void;
}

export const LiveUnlockModal: React.FC<Props> = ({ onConfirm, onCancel }) => (
    <>
        {/* Backdrop */}
        <div
            onClick={onCancel}
            style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 900,
                animation: "fadeIn 0.15s ease-out",
            }}
        />
        {/* Dialog */}
        <div
            style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 910,
                backgroundColor: "#14141f",
                border: `1px solid ${THEME.colors.brand.cyan}40`,
                borderRadius: THEME.radius.xl,
                padding: "32px 28px",
                width: "min(420px, 90vw)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxShadow: `0 0 60px ${THEME.colors.brand.cyan}15, 0 30px 60px rgba(0,0,0,0.6)`,
                animation: "slideUp 0.2s ease-out",
            }}
        >
            {/* Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                    width: 48, height: 48,
                    borderRadius: THEME.radius.lg,
                    backgroundColor: `${THEME.colors.status.warning}15`,
                    border: `1px solid ${THEME.colors.status.warning}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={THEME.colors.status.warning} strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Salir del modo Live</h3>
                    <p style={{ fontSize: 13, color: THEME.colors.text.muted, margin: "4px 0 0" }}>El reproductor está actualmente bloqueado</p>
                </div>
            </div>

            {/* Message */}
            <p style={{ fontSize: 14, color: THEME.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>
                Estás a punto de desbloquear el reproductor durante una{" "}
                <strong style={{ color: "white" }}>presentación en vivo</strong>.
                Esto permitirá cambiar tracks, reordenar la cola y alterar la reproducción.
                <br /><br />
                ¿Confirmas que quieres activar el{" "}
                <strong style={{ color: THEME.colors.brand.violet }}>modo Edit</strong>?
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        backgroundColor: "transparent",
                        color: THEME.colors.text.secondary,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = THEME.colors.surfaceHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.status.warning}50`,
                        backgroundColor: `${THEME.colors.status.warning}15`,
                        color: THEME.colors.status.warning,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${THEME.colors.status.warning}25`}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = `${THEME.colors.status.warning}15`}
                >
                    Sí, desbloquear
                </button>
            </div>
        </div>
    </>
);
