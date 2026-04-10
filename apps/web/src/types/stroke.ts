export type StrokeTool = "freehand" | "line" | "text" | "symbol";

export interface NormalizedPoint {
    x: number;
    y: number;
}

export interface Stroke {
    id: string;
    page: number;
    tool: StrokeTool;
    points: NormalizedPoint[];
    text?: string | null;
    symbol?: string | null;
    color: string;
    strokeWidth: number;
    authorId: string;
    authorName: string;
    authorColor: string;
    createdAt: string;
    updatedAt: string;
    deleted: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
}
