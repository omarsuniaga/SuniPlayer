import React from "react";
import { THEME } from "../../data/theme";

interface Props {
    children: React.ReactNode;
    /** Label shown in the fallback UI — helps identify which zone crashed */
    zone?: string;
    /** If true, shows a minimal fallback (no buttons). Good for nav components. */
    silent?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — catches React render/lifecycle errors and shows a fallback
 * instead of unmounting the entire tree.
 *
 * Usage:
 *   <ErrorBoundary zone="Player">
 *     <Player />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        const zone = this.props.zone ?? "unknown";
        console.error(`[ErrorBoundary:${zone}] Caught error:`, error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        if (this.props.silent) {
            // Silent mode: render nothing (safe fallback for nav/overlays)
            return null;
        }

        const zone = this.props.zone ?? "Vista";

        return (
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 24px",
                gap: 16,
                color: THEME.colors.text.muted,
            }}>
                <div style={{ fontSize: 40 }}>⚠️</div>
                <p style={{
                    margin: 0,
                    fontWeight: 700,
                    color: THEME.colors.text.primary,
                    fontSize: 16
                }}>
                    {zone} encontró un error
                </p>
                <p style={{
                    margin: 0,
                    fontSize: 12,
                    textAlign: "center",
                    maxWidth: 300,
                    fontFamily: "monospace",
                    color: THEME.colors.text.muted,
                    background: "rgba(255,255,255,0.05)",
                    padding: "8px 12px",
                    borderRadius: 8,
                    wordBreak: "break-word"
                }}>
                    {this.state.error?.message ?? "Error desconocido"}
                </p>
                <button
                    onClick={this.handleReset}
                    style={{
                        marginTop: 8,
                        padding: "10px 24px",
                        borderRadius: 8,
                        border: `1px solid ${THEME.colors.brand.cyan}`,
                        background: "transparent",
                        color: THEME.colors.brand.cyan,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }
}
