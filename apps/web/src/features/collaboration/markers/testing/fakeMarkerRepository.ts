import type {
    CreateMarkerInput,
    Marker,
    UpdateMarkerInput,
} from "../../../../types/marker";
import type {
    MarkerRepository,
    MarkerRepositoryUnsubscribe,
    SubscribeToMarkersOptions,
} from "../data/markerRepository";
import { filterActiveMarkers } from "../utils/markerFilters";
import { sortMarkersByTime } from "../utils/markerSorting";

interface MarkerSubscription {
    trackId: string;
    onChange: (markers: Marker[]) => void;
    onError?: (error: Error) => void;
    options?: SubscribeToMarkersOptions;
}

interface DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

export interface FakeMarkerRepositoryOptions {
    autoEmitOnSubscribe?: boolean;
    initialMarkers?: Marker[];
    generatedIds?: string[];
}

export class FakeMarkerRepository implements MarkerRepository {
    private readonly subscriptions = new Set<MarkerSubscription>();

    private readonly generatedIds: string[];

    private nextGeneratedId = 0;

    private nextCreateDeferred: DeferredPromise<string> | null = null;

    private nextUpdateDeferred: DeferredPromise<void> | null = null;

    private nextDeleteDeferred: DeferredPromise<void> | null = null;

    private markers: Marker[];

    readonly createCalls: CreateMarkerInput[] = [];

    readonly updateCalls: Array<{
        trackId: string;
        markerId: string;
        patch: UpdateMarkerInput;
    }> = [];

    readonly deleteCalls: Array<{
        trackId: string;
        markerId: string;
        deletedBy: string;
    }> = [];

    constructor(options: FakeMarkerRepositoryOptions = {}) {
        this.markers = [...(options.initialMarkers ?? [])];
        this.generatedIds = options.generatedIds ?? [];
        this.autoEmitOnSubscribe = options.autoEmitOnSubscribe ?? true;
    }

    private readonly autoEmitOnSubscribe: boolean;

    subscribeToMarkers(
        trackId: string,
        onChange: (markers: Marker[]) => void,
        onError?: (error: Error) => void,
        options?: SubscribeToMarkersOptions
    ): MarkerRepositoryUnsubscribe {
        const subscription: MarkerSubscription = {
            trackId,
            onChange,
            onError,
            options,
        };

        this.subscriptions.add(subscription);

        if (this.autoEmitOnSubscribe) {
            onChange(this.buildMarkersForSubscription(subscription));
        }

        return () => {
            this.subscriptions.delete(subscription);
        };
    }

    async createMarker(input: CreateMarkerInput): Promise<string> {
        this.createCalls.push(input);

        if (this.nextCreateDeferred !== null) {
            const deferred = this.nextCreateDeferred;
            this.nextCreateDeferred = null;
            return deferred.promise;
        }

        return this.generateId();
    }

    async updateMarker(trackId: string, markerId: string, patch: UpdateMarkerInput): Promise<void> {
        this.updateCalls.push({ trackId, markerId, patch });

        if (this.nextUpdateDeferred !== null) {
            const deferred = this.nextUpdateDeferred;
            this.nextUpdateDeferred = null;
            return deferred.promise;
        }
    }

    async softDeleteMarker(trackId: string, markerId: string, deletedBy: string): Promise<void> {
        this.deleteCalls.push({ trackId, markerId, deletedBy });

        if (this.nextDeleteDeferred !== null) {
            const deferred = this.nextDeleteDeferred;
            this.nextDeleteDeferred = null;
            return deferred.promise;
        }
    }

    setMarkers(markers: Marker[]): void {
        this.markers = [...markers];
    }

    emitSnapshot(markers: Marker[] = this.markers): void {
        this.markers = [...markers];

        for (const subscription of this.subscriptions) {
            subscription.onChange(this.buildMarkersForSubscription(subscription));
        }
    }

    emitError(error: Error): void {
        for (const subscription of this.subscriptions) {
            subscription.onError?.(error);
        }
    }

    deferNextCreate(resultId = this.generateId()): DeferredPromise<string> {
        const deferred = createDeferredPromise<string>();
        const defaultResultId = resultId;
        this.nextCreateDeferred = deferred;
        deferred.promise.catch(() => undefined);
        return {
            ...deferred,
            resolve: (value: string) => deferred.resolve(value.length > 0 ? value : defaultResultId),
            reject: deferred.reject,
        };
    }

    deferNextUpdate(): DeferredPromise<void> {
        const deferred = createDeferredPromise<void>();
        this.nextUpdateDeferred = deferred;
        deferred.promise.catch(() => undefined);
        return deferred;
    }

    deferNextDelete(): DeferredPromise<void> {
        const deferred = createDeferredPromise<void>();
        this.nextDeleteDeferred = deferred;
        deferred.promise.catch(() => undefined);
        return deferred;
    }

    private buildMarkersForSubscription(subscription: MarkerSubscription): Marker[] {
        const markersForTrack = this.markers.filter((marker) => marker.trackId === subscription.trackId);
        const includeDeleted = subscription.options?.includeDeleted ?? false;
        const visibleMarkers = includeDeleted ? markersForTrack : filterActiveMarkers(markersForTrack);

        return sortMarkersByTime(visibleMarkers);
    }

    private generateId(): string {
        const queuedId = this.generatedIds[this.nextGeneratedId];

        if (typeof queuedId === "string" && queuedId.length > 0) {
            this.nextGeneratedId += 1;
            return queuedId;
        }

        this.nextGeneratedId += 1;
        return `fake-marker-${this.nextGeneratedId}`;
    }
}

function createDeferredPromise<T>(): DeferredPromise<T> {
    let resolvePromise: ((value: T) => void) | null = null;
    let rejectPromise: ((error: Error) => void) | null = null;

    const promise = new Promise<T>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    return {
        promise,
        resolve(value: T) {
            if (resolvePromise === null) {
                throw new Error("Deferred promise already resolved");
            }

            resolvePromise(value);
            resolvePromise = null;
            rejectPromise = null;
        },
        reject(error: Error) {
            if (rejectPromise === null) {
                throw new Error("Deferred promise already rejected");
            }

            rejectPromise(error);
            resolvePromise = null;
            rejectPromise = null;
        },
    };
}
