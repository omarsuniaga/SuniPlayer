import React from "react";

import { useProjectStore } from "../store/useProjectStore";
import { THEME } from "../data/theme";

export const AppAtmosphere: React.FC = () => {
    const playing = useProjectStore((state) => state.playing);
    const mode = useProjectStore((state) => state.mode);

    return (
        <div
            style={{
                position: "absolute",
                top: "-10%",
                right: "-5%",
                width: "40vw",
                height: "40vw",
                borderRadius: "50%",
                background: playing
                    ? (mode === "live" ? THEME.colors.brand.cyan : THEME.colors.brand.violet)
                    : "transparent",
                filter: "blur(180px)",
                opacity: 0.1,
                pointerEvents: "none",
                transition: "background 1.5s ease, opacity 1s",
            }}
        />
    );
};
