import React from "react";

import { History } from "../pages/History";
import { Builder } from "../pages/Builder";
import { Player } from "../pages/Player";
import { useProjectStore } from "../store/useProjectStore";
import { useAudio } from "../services/useAudio";

const viewMap = {
    builder: Builder,
    player: Player,
    history: History,
} as const;

export const AppViewport: React.FC = () => {
    const view = useProjectStore((state) => state.view);
    const ActiveView = viewMap[view] ?? Builder;

    useAudio();

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
            <ActiveView />
        </div>
    );
};
