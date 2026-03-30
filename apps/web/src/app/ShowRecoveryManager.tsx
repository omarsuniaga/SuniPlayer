import React, { useEffect, useMemo, useRef, useState } from "react";

import { THEME } from "../data/theme";
import { useProjectStore } from "../store/useProjectStore";
import {
    applyShowSessionSnapshot,
    clearShowSessionSnapshot,
    hasRecoverableShowSession,
    readShowSessionSnapshot,
    requestPersistentStorage,
    saveShowSessionSnapshot,
    type ShowSessionSnapshot,
} from "../services/showSessionStorage";

const SNAPSHOT_DEBOUNCE_MS = 1200;

export const ShowRecoveryManager: React.FC = () => {
    const view = useProjectStore((state) => state.view);
    const genSetLength = useProjectStore((state) => state.genSet.length);
    const queueLength = useProjectStore((state) => state.pQueue.length);
    const historyLength = useProjectStore((state) => state.history.length);
    const ci = useProjectStore((state) => state.ci);
    const pos = useProjectStore((state) => state.pos);
    const mode = useProjectStore((state) => state.mode);

    const [snapshot, setSnapshot] = useState<ShowSessionSnapshot | null>(null);
    const [storagePersistence, setStoragePersistence] = useState<boolean | null>(null);
    const saveTimerRef = useRef<number | null>(null);

    const sessionFingerprint = useMemo(
        () => JSON.stringify({ view, genSetLength, queueLength, historyLength, ci, pos, mode }),
        [view, genSetLength, queueLength, historyLength, ci, pos, mode]
    );

    useEffect(() => {
        requestPersistentStorage().then(setStoragePersistence);
        readShowSessionSnapshot().then((storedSnapshot) => {
            if (!hasRecoverableShowSession(storedSnapshot)) return;

            const hasCurrentSession = queueLength > 0 || genSetLength > 0;
            if (!hasCurrentSession) {
                setSnapshot(storedSnapshot);
            }
        });
    }, [genSetLength, queueLength]);

    useEffect(() => {
        const flushSnapshot = () => {
            void saveShowSessionSnapshot();
        };

        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = window.setTimeout(flushSnapshot, SNAPSHOT_DEBOUNCE_MS);

        const handlePageHide = () => flushSnapshot();
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                flushSnapshot();
            }
        };

        window.addEventListener("pagehide", handlePageHide);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
            }
            window.removeEventListener("pagehide", handlePageHide);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [sessionFingerprint]);

    if (!snapshot && storagePersistence !== false) {
        return null;
    }

    return (
        <div
            style={{
                position: "relative",
                zIndex: 5,
                display: "flex",
                justifyContent: "center",
                padding: "10px 16px 0",
            }}
        >
            <div
                style={{
                    width: "min(920px, 100%)",
                    borderRadius: THEME.radius.lg,
                    border: `1px solid ${THEME.colors.border}`,
                    backgroundColor: "rgba(10,14,20,0.92)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                {snapshot ? (
                    <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <strong style={{ fontSize: 13 }}>Recovery session available</strong>
                            <span style={{ fontSize: 12, color: THEME.colors.text.muted }}>
                                Last snapshot: {new Date(snapshot.capturedAt).toLocaleString()}
                                {snapshot.warnings.requiresAudioReconnect ? " Â· custom audio will need reconnect on iPad after a reload" : ""}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                                onClick={() => {
                                    applyShowSessionSnapshot(snapshot);
                                    setSnapshot(null);
                                }}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: THEME.radius.md,
                                    border: "none",
                                    backgroundColor: THEME.colors.brand.cyan,
                                    color: "white",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Restore last session
                            </button>
                            <button
                                onClick={() => {
                                    void clearShowSessionSnapshot();
                                    setSnapshot(null);
                                }}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: THEME.radius.md,
                                    border: `1px solid ${THEME.colors.border}`,
                                    backgroundColor: "transparent",
                                    color: THEME.colors.text.secondary,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <strong style={{ fontSize: 13 }}>Storage persistence not guaranteed</strong>
                            <span style={{ fontSize: 12, color: THEME.colors.text.muted }}>
                                iPad Safari may still evict PWA storage or require audio folder reconnection after a reload.
                            </span>
                        </div>
                        <button
                            onClick={() => requestPersistentStorage().then(setStoragePersistence)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: THEME.radius.md,
                                border: `1px solid ${THEME.colors.border}`,
                                backgroundColor: "transparent",
                                color: THEME.colors.text.secondary,
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Retry
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
