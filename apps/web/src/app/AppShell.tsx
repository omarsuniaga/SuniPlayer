import React from "react";

import { AppAtmosphere } from "./AppAtmosphere";
import { ShowRecoveryManager } from "./ShowRecoveryManager";
import { AppViewport } from "./AppViewport";
import { Navbar } from "../components/layout/Navbar";
import { BottomNav } from "../components/layout/BottomNav";
import { SettingsPanel } from "../components/layout/SettingsPanel";

export const AppShell: React.FC = () => {
    return (
        <div className="app-shell">
            <AppAtmosphere />
            <ShowRecoveryManager />
            <Navbar />
            <AppViewport />
            <BottomNav />
            <SettingsPanel />
        </div>
    );
};
