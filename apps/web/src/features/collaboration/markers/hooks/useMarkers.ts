import {
    useEffect,
    useMemo,
    useSyncExternalStore,
} from "react";

import type {
    CreateMarkerInput,
    Marker,
    MarkerAuthor,
    UpdateMarkerInput,
} from "../../../../types/marker";
import type { MarkerRepository } from "../data/markerRepository";
import { markerRepository } from "../data/markerRepository";
import { filterVisibleMarkers } from "../utils/markerFilters";
import { sortMarkersByTime } from "../utils/markerSorting";

interface PendingCreateMutation {
    kind: "create";
    tempId: string;
    serverId: string | null;
    marker: Marker;
}

interface PendingUpdateMutation {
    kind: "update";
    markerId: string;
    patch: UpdateMarkerInput;
}

interface PendingDeleteMutation {
    kind: "delete";
    markerId: string;
}

type PendingMutation =
    | PendingCreateMutation
    | PendingUpdateMutation
    | PendingDeleteMutation;

export interface UseMarkersOptions {
    trackId: string;
    currentUser: MarkerAuthor;
    repository?: MarkerRepository;
    enabled?: boolean;
    includeDeleted?: boolean;
    now?: () => string;
}

export interface UseMarkersState {
    markers: Marker[];
    isLoading: boolean;
    error: Error | null;
}

export interface UseMarkersResult extends UseMarkersState {
    createMarker: (
        input: Omit<CreateMarkerInput, "trackId" | "author">
    ) => Promise<string | null>;
    updateMarker: (markerId: string, patch: UpdateMarkerInput) => Promise<void>;
    deleteMarker: (markerId: string) => Promise<void>;
    clearError: () => void;
}

type Listener = () => void;

export class MarkersController {
    private readonly currentUser: MarkerAuthor;

    private readonly enabled: boolean;

    private readonly includeDeleted: boolean;

    private readonly now: () => string;

    private readonly repository: MarkerRepository;

    private readonly trackId: string;

    private pendingMutations: PendingMutation[] = [];

    private remoteMarkers: Marker[] = [];

    private readonly listeners = new Set<Listener>();

    private snapshot: UseMarkersState;

    private optimisticCreateCounter = 0;

    private unsubscribeRepository: (() => void) | null = null;

    constructor(options: UseMarkersOptions) {
        this.trackId = options.trackId;
        this.currentUser = options.currentUser;
        this.repository = options.repository ?? markerRepository;
        this.enabled = options.enabled ?? true;
        this.includeDeleted = options.includeDeleted ?? false;
        this.now = options.now ?? defaultNow;
        this.snapshot = {
            markers: [],
            isLoading: this.enabled && this.trackId.trim().length > 0,
            error: null,
        };
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = (): UseMarkersState => {
        return this.snapshot;
    };

    connect = (): (() => void) => {
        this.disconnect();

        if (!this.enabled || this.trackId.trim().length === 0) {
            this.remoteMarkers = [];
            this.pendingMutations = [];
            this.publish({
                markers: [],
                isLoading: false,
                error: null,
            });

            return () => undefined;
        }

        this.publish({
            ...this.snapshot,
            isLoading: true,
            error: null,
        });

        this.unsubscribeRepository = this.repository.subscribeToMarkers(
            this.trackId,
            (markers) => {
                this.remoteMarkers = markers;
                this.pendingMutations = synchronizePendingMutations(this.pendingMutations, markers);
                this.publish({
                    markers: this.buildVisibleMarkers(),
                    isLoading: false,
                    error: null,
                });
            },
            (repositoryError) => {
                this.publish({
                    ...this.snapshot,
                    isLoading: false,
                    error: toError(repositoryError),
                });
            },
            { includeDeleted: this.includeDeleted }
        );

        return () => {
            this.disconnect();
        };
    };

    createMarker = async (
        input: Omit<CreateMarkerInput, "trackId" | "author">
    ): Promise<string | null> => {
        if (!this.enabled || this.trackId.trim().length === 0) {
            return null;
        }

        const optimisticId = this.createOptimisticId();
        const timestamp = this.now();
        const optimisticMarker: Marker = {
            id: optimisticId,
            trackId: this.trackId,
            timeMs: input.timeMs,
            label: input.label,
            note: input.note,
            category: input.category,
            shared: input.shared,
            authorId: this.currentUser.id,
            authorName: this.currentUser.name,
            authorColor: this.currentUser.color,
            createdAt: timestamp,
            updatedAt: timestamp,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
        };

        this.pendingMutations = [
            ...this.pendingMutations,
            {
                kind: "create",
                tempId: optimisticId,
                serverId: null,
                marker: optimisticMarker,
            },
        ];
        this.publish({
            markers: this.buildVisibleMarkers(),
            isLoading: this.snapshot.isLoading,
            error: null,
        });

        try {
            const createdMarkerId = await this.repository.createMarker({
                ...input,
                trackId: this.trackId,
                author: this.currentUser,
            });

            this.pendingMutations = this.pendingMutations.map((mutation) => {
                if (mutation.kind !== "create" || mutation.tempId !== optimisticId) {
                    return mutation;
                }

                return {
                    ...mutation,
                    serverId: createdMarkerId,
                    marker: {
                        ...mutation.marker,
                        id: createdMarkerId,
                    },
                };
            });
            this.publish({
                markers: this.buildVisibleMarkers(),
                isLoading: this.snapshot.isLoading,
                error: null,
            });

            return createdMarkerId;
        } catch (repositoryError) {
            this.pendingMutations = this.pendingMutations.filter((mutation) => {
                return mutation.kind !== "create" || mutation.tempId !== optimisticId;
            });
            this.publish({
                markers: this.buildVisibleMarkers(),
                isLoading: this.snapshot.isLoading,
                error: toError(repositoryError),
            });

            return null;
        }
    };

    updateMarker = async (markerId: string, patch: UpdateMarkerInput): Promise<void> => {
        if (!this.enabled || this.trackId.trim().length === 0) {
            return;
        }

        this.pendingMutations = upsertUpdateMutation(this.pendingMutations, markerId, patch);
        this.publish({
            markers: this.buildVisibleMarkers(),
            isLoading: this.snapshot.isLoading,
            error: null,
        });

        try {
            await this.repository.updateMarker(this.trackId, markerId, patch);
        } catch (repositoryError) {
            this.pendingMutations = this.pendingMutations.filter((mutation) => {
                return mutation.kind !== "update" || mutation.markerId !== markerId;
            });
            this.publish({
                markers: this.buildVisibleMarkers(),
                isLoading: this.snapshot.isLoading,
                error: toError(repositoryError),
            });
        }
    };

    deleteMarker = async (markerId: string): Promise<void> => {
        if (!this.enabled || this.trackId.trim().length === 0) {
            return;
        }

        this.pendingMutations = upsertDeleteMutation(this.pendingMutations, markerId);
        this.publish({
            markers: this.buildVisibleMarkers(),
            isLoading: this.snapshot.isLoading,
            error: null,
        });

        try {
            await this.repository.softDeleteMarker(this.trackId, markerId, this.currentUser.id);
        } catch (repositoryError) {
            this.pendingMutations = this.pendingMutations.filter((mutation) => {
                return mutation.kind !== "delete" || mutation.markerId !== markerId;
            });
            this.publish({
                markers: this.buildVisibleMarkers(),
                isLoading: this.snapshot.isLoading,
                error: toError(repositoryError),
            });
        }
    };

    clearError = (): void => {
        this.publish({
            ...this.snapshot,
            error: null,
        });
    };

    disconnect(): void {
        this.unsubscribeRepository?.();
        this.unsubscribeRepository = null;
    }

    private createOptimisticId(): string {
        this.optimisticCreateCounter += 1;
        return `optimistic-marker-${this.optimisticCreateCounter}`;
    }

    private buildVisibleMarkers(): Marker[] {
        const mergedMarkers = mergeMarkersWithPending(this.remoteMarkers, this.pendingMutations);
        const visibleMarkers = filterVisibleMarkers(mergedMarkers, this.currentUser.id);

        return sortMarkersByTime(visibleMarkers);
    }

    private publish(nextSnapshot: UseMarkersState): void {
        this.snapshot = nextSnapshot;

        for (const listener of this.listeners) {
            listener();
        }
    }
}

export function createMarkersController(options: UseMarkersOptions): MarkersController {
    return new MarkersController(options);
}

export function useMarkers(options: UseMarkersOptions): UseMarkersResult {
    const memoizedOptions = useMemo(() => options, [
        options.trackId,
        options.currentUser.id,
        options.currentUser.name,
        options.currentUser.color,
        options.repository,
        options.enabled,
        options.includeDeleted,
        options.now,
    ]);

    const controller = useMemo(() => createMarkersController(memoizedOptions), [memoizedOptions]);

    const snapshot = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot
    );

    useEffect(() => {
        return controller.connect();
    }, [controller]);

    return {
        ...snapshot,
        createMarker: controller.createMarker,
        updateMarker: controller.updateMarker,
        deleteMarker: controller.deleteMarker,
        clearError: controller.clearError,
    };
}

function mergeMarkersWithPending(
    remoteMarkers: readonly Marker[],
    pendingMutations: readonly PendingMutation[]
): Marker[] {
    let mergedMarkers = [...remoteMarkers];

    for (const mutation of pendingMutations) {
        if (mutation.kind === "update") {
            mergedMarkers = mergedMarkers.map((marker) => {
                if (marker.id !== mutation.markerId) {
                    return marker;
                }

                return applyMarkerPatch(marker, mutation.patch);
            });
        }

        if (mutation.kind === "delete") {
            mergedMarkers = mergedMarkers.filter((marker) => marker.id !== mutation.markerId);
        }
    }

    for (const mutation of pendingMutations) {
        if (mutation.kind !== "create") {
            continue;
        }

        const candidateId = mutation.serverId ?? mutation.tempId;
        const alreadyPresent = mergedMarkers.some((marker) => marker.id === candidateId);

        if (!alreadyPresent) {
            mergedMarkers.push({
                ...mutation.marker,
                id: candidateId,
            });
        }
    }

    return mergedMarkers;
}

function synchronizePendingMutations(
    pendingMutations: readonly PendingMutation[],
    remoteMarkers: readonly Marker[]
): PendingMutation[] {
    const remoteMarkersById = new Map(remoteMarkers.map((marker) => [marker.id, marker]));
    const nextPendingMutations: PendingMutation[] = [];

    for (const mutation of pendingMutations) {
        if (mutation.kind === "create") {
            const matchedRemoteMarker = findMatchingRemoteMarker(mutation.marker, remoteMarkers);
            const resolvedServerId = mutation.serverId ?? matchedRemoteMarker?.id ?? null;

            if (resolvedServerId !== null && remoteMarkersById.has(resolvedServerId)) {
                continue;
            }

            nextPendingMutations.push({
                ...mutation,
                serverId: resolvedServerId,
                marker: resolvedServerId === null
                    ? mutation.marker
                    : {
                        ...mutation.marker,
                        id: resolvedServerId,
                    },
            });
            continue;
        }

        if (mutation.kind === "update") {
            const remoteMarker = remoteMarkersById.get(mutation.markerId);

            if (remoteMarker === undefined) {
                nextPendingMutations.push(mutation);
                continue;
            }

            if (!doesRemoteMarkerSatisfyPatch(remoteMarker, mutation.patch)) {
                nextPendingMutations.push(mutation);
            }

            continue;
        }

        if (remoteMarkersById.has(mutation.markerId)) {
            nextPendingMutations.push(mutation);
        }
    }

    return nextPendingMutations;
}

function upsertUpdateMutation(
    pendingMutations: readonly PendingMutation[],
    markerId: string,
    patch: UpdateMarkerInput
): PendingMutation[] {
    const nextPendingMutations = pendingMutations.map((mutation) => {
        if (mutation.kind !== "update" || mutation.markerId !== markerId) {
            return mutation;
        }

        return {
            ...mutation,
            patch: {
                ...mutation.patch,
                ...patch,
            },
        };
    });

    const hasExistingMutation = nextPendingMutations.some((mutation) => {
        return mutation.kind === "update" && mutation.markerId === markerId;
    });

    if (hasExistingMutation) {
        return nextPendingMutations;
    }

    return [
        ...nextPendingMutations,
        {
            kind: "update",
            markerId,
            patch,
        },
    ];
}

function upsertDeleteMutation(
    pendingMutations: readonly PendingMutation[],
    markerId: string
): PendingMutation[] {
    if (pendingMutations.some((mutation) => mutation.kind === "delete" && mutation.markerId === markerId)) {
        return [...pendingMutations];
    }

    return [
        ...pendingMutations,
        {
            kind: "delete",
            markerId,
        },
    ];
}

function applyMarkerPatch(marker: Marker, patch: UpdateMarkerInput): Marker {
    return {
        ...marker,
        ...(typeof patch.label === "string" ? { label: patch.label } : {}),
        ...(typeof patch.note === "string" ? { note: patch.note } : {}),
        ...(typeof patch.category === "string" ? { category: patch.category } : {}),
        ...(typeof patch.shared === "boolean" ? { shared: patch.shared } : {}),
        ...(typeof patch.updatedAt === "string" ? { updatedAt: patch.updatedAt } : {}),
    };
}

function doesRemoteMarkerSatisfyPatch(marker: Marker, patch: UpdateMarkerInput): boolean {
    if (typeof patch.label === "string" && marker.label !== patch.label) {
        return false;
    }

    if (typeof patch.note === "string" && marker.note !== patch.note) {
        return false;
    }

    if (typeof patch.category === "string" && marker.category !== patch.category) {
        return false;
    }

    if (typeof patch.shared === "boolean" && marker.shared !== patch.shared) {
        return false;
    }

    return true;
}

function findMatchingRemoteMarker(
    optimisticMarker: Marker,
    remoteMarkers: readonly Marker[]
): Marker | undefined {
    return remoteMarkers.find((remoteMarker) => {
        return remoteMarker.trackId === optimisticMarker.trackId
            && remoteMarker.timeMs === optimisticMarker.timeMs
            && remoteMarker.label === optimisticMarker.label
            && remoteMarker.note === optimisticMarker.note
            && remoteMarker.category === optimisticMarker.category
            && remoteMarker.shared === optimisticMarker.shared
            && remoteMarker.authorId === optimisticMarker.authorId;
    });
}

function defaultNow(): string {
    return new Date().toISOString();
}

function toError(value: unknown): Error {
    if (value instanceof Error) {
        return value;
    }

    return new Error("Unknown marker repository error");
}
