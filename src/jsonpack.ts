import { KrunkerError } from "./errors.js";

// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

// jsonpack (npm "jsonpack"), the text format of gapi's /data/* files:
// "strings^integers^floats^structure", each section "|" separated; integers and structure indices are base 36,
// the structure is "$" (object: key, value, ...), "@" (array) and "]" (end) around indices into strings + integers + floats
const SPECIAL: Record<string, unknown> = { "-1": true, "-2": false, "-3": null, "-4": "", "-5": undefined };
const ESCAPES: Record<string, string> = { "+": " ", "%2B": "+", "%7C": "|", "%5E": "^", "%25": "%" };

const decodeString = (raw: string): string => raw.replace(/\+|%2B|%7C|%5E|%25/g, (m) => ESCAPES[m]!);
const section = (raw: string | undefined): string[] => (raw ? raw.split("|") : []);

/** decodes a jsonpack text; throws KrunkerError when it is not one */
export function unpack<T>(packed: unknown): T {
    if (typeof packed !== "string") throw new KrunkerError("Krunker data: expected jsonpack text");
    const parts = packed.split("^");
    if (parts.length !== 4) throw new KrunkerError("Krunker data: not jsonpack text");
    const dictionary: unknown[] = [
        ...section(parts[0]).map(decodeString),
        ...section(parts[1]).map((n) => parseInt(n, 36)),
        ...section(parts[2]).map(parseFloat),
    ];
    const tokens = parts[3]!.match(/[$@\]]|[^|$@\]]+/g) ?? [];
    let at = 0;

    const value = (): unknown => {
        const token = tokens[at++];
        if (token === undefined) throw new KrunkerError("Krunker data: jsonpack structure ends early");
        if (token === "@"){
            const list: unknown[] = [];
            while (tokens[at] !== "]") list.push(value());
            at++;
            return list;
        }
        if (token === "$"){
            const record: Record<string, unknown> = {};
            while (tokens[at] !== "]"){
                const key = value();
                record[String(key)] = value();
            }
            at++;
            return record;
        }
        if (token in SPECIAL) return SPECIAL[token];
        const index = parseInt(token, 36);
        if (!(index >= 0 && index < dictionary.length)) throw new KrunkerError(`Krunker data: jsonpack index ${token} out of range`);
        return dictionary[index];
    };

    return value() as T;
}
