const NOTE_TO_INDEX: Record<string, number> = {
    C: 0,
    "B#": 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    F: 5,
    "E#": 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
    Cb: 11,
};

const INDEX_TO_NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const KEY_OPTIONS = [
    ...INDEX_TO_NOTE.map((note) => `${note} Major`),
    ...INDEX_TO_NOTE.map((note) => `${note} Minor`),
];

type KeyMode = "Major" | "Minor";

interface ParsedKey {
    note: string;
    mode: KeyMode;
    index: number;
}

const normalizeMode = (raw?: string): KeyMode => {
    const value = raw?.toLowerCase() ?? "major";
    return value.startsWith("min") || value === "m" ? "Minor" : "Major";
};

export function parseMusicalKey(key?: string | null): ParsedKey | null {
    if (!key) return null;

    const match = key.trim().replace(/_/g, " ").match(/^([A-G](?:#|b)?)(?:\s*(Major|Minor|Maj|Min|M|m))?$/i);
    if (!match) return null;

    const note = match[1][0].toUpperCase() + (match[1].slice(1) || "");
    const index = NOTE_TO_INDEX[note];
    if (index === undefined) return null;

    return { note, mode: normalizeMode(match[2]), index };
}

export function getTransposeSemitones(sourceKey?: string | null, targetKey?: string | null): number {
    const source = parseMusicalKey(sourceKey);
    const target = parseMusicalKey(targetKey);
    if (!source || !target || source.mode !== target.mode) return 0;

    const upwardDistance = (target.index - source.index + 12) % 12;
    return upwardDistance > 6 ? upwardDistance - 12 : upwardDistance;
}

export function buildTargetKey(sourceKey?: string | null, semitones = 0): string | null {
    const source = parseMusicalKey(sourceKey);
    if (!source) return null;

    const targetIndex = (source.index + semitones + 12) % 12;
    return `${INDEX_TO_NOTE[targetIndex]} ${source.mode}`;
}

export function describeTranspose(semitones = 0): string {
    if (semitones === 0) return "Original";
    return semitones > 0 ? `+${semitones} semitones` : `${semitones} semitones`;
}

export function getTransposePlaybackRate(semitones = 0): number {
    return Math.pow(2, semitones / 12);
}
