import { describe, expect, it } from "vitest";

import { buildTargetKey, describeTranspose, getTransposeSemitones, parseMusicalKey } from "./transpose";

describe("transpose helpers", () => {
    it("parses supported key formats", () => {
        expect(parseMusicalKey("C# Major")).toEqual({ note: "C#", mode: "Major", index: 1 });
        expect(parseMusicalKey("Bb min")).toEqual({ note: "Bb", mode: "Minor", index: 10 });
    });

    it("computes semitone shifts between compatible keys", () => {
        expect(getTransposeSemitones("C# Major", "D Major")).toBe(1);
        expect(getTransposeSemitones("D Major", "C# Major")).toBe(-1);
        expect(getTransposeSemitones("A Minor", "C Minor")).toBe(3);
    });

    it("builds target keys from source and semitone offset", () => {
        expect(buildTargetKey("C# Major", 1)).toBe("D Major");
        expect(describeTranspose(0)).toBe("Original");
        expect(describeTranspose(-2)).toBe("-2 semitones");
    });
});
