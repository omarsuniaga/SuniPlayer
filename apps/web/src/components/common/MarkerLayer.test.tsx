import { describe, expect, it, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MarkerLayer } from "./MarkerLayer";
import type { TrackMarker } from "../../types";

const DURATION_MS = 120000;

const makeMarker = (posMs: number): TrackMarker => ({
    id: "m1",
    posMs,
    comment: "Test comment",
});

async function renderLayer(
    markers: TrackMarker[],
    opts?: { isLive?: boolean; onSeek?: (ms: number) => void; onMarkersChange?: (m: TrackMarker[]) => void }
) {
    const onSeek = opts?.onSeek ?? vi.fn();
    const onMarkersChange = opts?.onMarkersChange ?? vi.fn();
    let result!: ReturnType<typeof render>;
    await act(async () => {
        result = render(
            <MarkerLayer
                markers={markers}
                posMs={0}
                durationMs={DURATION_MS}
                isLive={opts?.isLive ?? false}
                onMarkersChange={onMarkersChange}
                onSeek={onSeek}
            >
                <div data-testid="wave" style={{ width: 800, height: 160 }} />
            </MarkerLayer>
        );
    });
    return { ...result, onSeek, onMarkersChange };
}

describe("MarkerLayer — short click on empty area", () => {
    it("calls onSeek when clicking empty area in edit mode", async () => {
        const { getByTestId, onSeek } = await renderLayer([]);
        const container = getByTestId("wave").parentElement!;
        fireEvent.mouseDown(container, { clientX: 400 });
        await act(async () => { fireEvent.mouseUp(container, { clientX: 400 }); });
        expect(onSeek).toHaveBeenCalled();
    });

    it("does NOT call onSeek in live mode", async () => {
        const { getByTestId, onSeek } = await renderLayer([], { isLive: true });
        const container = getByTestId("wave").parentElement!;
        fireEvent.mouseDown(container, { clientX: 400 });
        await act(async () => { fireEvent.mouseUp(container, { clientX: 400 }); });
        expect(onSeek).not.toHaveBeenCalled();
    });
});

describe("MarkerLayer — short click on existing marker", () => {
    it("opens modal (does not seek) when clicking near a marker", async () => {
        // marker at posMs=60000 = 50% of 120s = x=400px on 800px wide
        const { getByTestId, onSeek } = await renderLayer([makeMarker(60000)]);
        const container = getByTestId("wave").parentElement!;
        // getBoundingClientRect mock returns left=0, width=800
        Object.defineProperty(container, "getBoundingClientRect", {
            value: () => ({ left: 0, width: 800, right: 800, top: 0, bottom: 160, height: 160 }),
        });
        fireEvent.mouseDown(container, { clientX: 401 }); // 1px off center = within 12px tolerance
        await act(async () => { fireEvent.mouseUp(container, { clientX: 401 }); });
        // Modal opens, seek NOT called
        expect(onSeek).not.toHaveBeenCalled();
    });
});
