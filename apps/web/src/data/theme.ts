export const THEME = {
    colors: {
        bg: "#0A0E14",
        surface: "rgba(255,255,255,0.02)",
        surfaceHover: "rgba(255,255,255,0.03)",
        panel: "rgba(0,0,0,0.15)",
        border: "rgba(255,255,255,0.04)",
        borderLight: "rgba(255,255,255,0.08)",
        text: {
            primary: "#F0F4F8",
            secondary: "rgba(255,255,255,0.4)",
            muted: "rgba(255,255,255,0.25)",
            dim: "rgba(255,255,255,0.1)",
        },
        brand: {
            cyan: "#06B6D4",
            violet: "#8B5CF6",
            pink: "#EC4899",
            cyanGlow: "rgba(6,182,212,0.3)",
            violetGlow: "rgba(139,92,246,0.3)",
        },
        status: {
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
        }
    },
    gradients: {
        brand: "linear-gradient(135deg,#06B6D4,#8B5CF6,#EC4899)",
        cyan: "linear-gradient(135deg,#06B6D4,#0891B2)",
        live: "linear-gradient(90deg,#06B6D4,#8B5CF6)",
    },
    fonts: {
        main: "'DM Sans', -apple-system, sans-serif",
        mono: "'JetBrains Mono', monospace",
    },
    radius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        full: "99px",
    },
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
    }
} as const;

export const mq = (bp: keyof typeof THEME.breakpoints) => 
    `@media (min-width: ${THEME.breakpoints[bp]}px)`;

