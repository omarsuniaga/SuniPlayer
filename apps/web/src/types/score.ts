export type ScoreAssetType = "pdf" | "image";

export interface ScoreAsset {
    id: string;
    type: ScoreAssetType;
    name: string;
    fileUrl: string;
}

export interface Score {
    id: string;
    title: string;
    ownerId: string;
    pageCount: number;
    rotation: number;
    createdAt: string;
    updatedAt: string;
    assets: ScoreAsset[];
}
