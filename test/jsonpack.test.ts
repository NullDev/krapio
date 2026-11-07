import { describe, expect, test } from "bun:test";
import { KrunkerError } from "../src/errors.js";
import { unpack } from "../src/jsonpack.js";

// packed with npm jsonpack 1.1.5
const PACKED = "id|name|Arctic+Hunt|tradable|glow|seas|scl|x|d|tags|a%7Cb|c%5Ed|50%25%2B|Autumn+Hunt^0|1|1|1^2.5|-0.5^@$0|E|1|2|3|-1|4|-2|5|F|6|I|7|-3|8|-4|9|@A|B|C]]|$0|G|1|D|3|-2|5|H|6|J|9|@]]]";

describe("jsonpack", () => {
    test("decodes strings, base 36 integers, floats, the specials and nesting", () => {
        expect(unpack(PACKED)).toEqual([
            { id: 0, name: "Arctic Hunt", tradable: true, glow: false, seas: 1, scl: 2.5, x: null, d: "", tags: ["a|b", "c^d", "50%+"] },
            { id: 1, name: "Autumn Hunt", tradable: false, seas: 1, scl: -0.5, tags: [] },
        ]);
    });

    test("refuses what is not jsonpack", () => {
        expect(() => unpack({ data: [] })).toThrow(KrunkerError);
        expect(() => unpack("not packed")).toThrow(/not jsonpack/);
        expect(() => unpack("a^^^@0|5]")).toThrow(/out of range/);
        expect(() => unpack("a^^^@0")).toThrow(/ends early/);
    });
});
