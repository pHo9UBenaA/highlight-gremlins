import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  detectFullwidthSpaces,
  replaceFullwidthSpaces,
} from "../../src/core/fullwidth-spaces";

const singleChar = fc.string({ minLength: 1, maxLength: 1 });

const stringWithFullwidth = fc.oneof(
  fc.string(),
  fc.array(
    fc.oneof(
      singleChar,
      fc.constant("\u3000"),
      fc.constant("\n"),
    ),
  ).map((arr) => arr.join("")),
);

describe("detectFullwidthSpaces", () => {
  it("returns empty ranges for empty string", () => {
    const result = detectFullwidthSpaces("");
    expect(result.ranges).toEqual([]);
  });

  it("returns empty ranges for string without fullwidth spaces", () => {
    const result = detectFullwidthSpaces("hello");
    expect(result.ranges).toEqual([]);
  });

  it("detects a single fullwidth space", () => {
    const result = detectFullwidthSpaces("\u3000");
    expect(result.ranges).toEqual([{ line: 0, startChar: 0, endChar: 1 }]);
  });

  it("detects fullwidth space at correct position within text", () => {
    const result = detectFullwidthSpaces("a\u3000b");
    expect(result.ranges).toEqual([{ line: 0, startChar: 1, endChar: 2 }]);
  });

  it("detects fullwidth space on correct line in multi-line text", () => {
    const result = detectFullwidthSpaces("line1\nline2\u3000");
    expect(result.ranges).toEqual([{ line: 1, startChar: 5, endChar: 6 }]);
  });

  it("detects consecutive fullwidth spaces as separate ranges", () => {
    const result = detectFullwidthSpaces("a\u3000\u3000b");
    expect(result.ranges).toEqual([
      { line: 0, startChar: 1, endChar: 2 },
      { line: 0, startChar: 2, endChar: 3 },
    ]);
  });
});

describe("replaceFullwidthSpaces", () => {
  it("replaces fullwidth space with half-width space", () => {
    expect(replaceFullwidthSpaces("a\u3000b")).toBe("a b");
  });

  it("returns string unchanged when no fullwidth spaces present", () => {
    expect(replaceFullwidthSpaces("no fullwidth")).toBe("no fullwidth");
  });
});

describe("PBT: fullwidth space properties", () => {
  it("length preservation: replaceFullwidthSpaces preserves string length", () => {
    fc.assert(
      fc.property(stringWithFullwidth, (s) => {
        expect(replaceFullwidthSpaces(s).length).toBe(s.length);
      }),
    );
  });

  it("idempotency: applying replaceFullwidthSpaces twice yields same result as once", () => {
    fc.assert(
      fc.property(stringWithFullwidth, (s) => {
        const once = replaceFullwidthSpaces(s);
        const twice = replaceFullwidthSpaces(once);
        expect(twice).toBe(once);
      }),
    );
  });

  it("completeness: replaceFullwidthSpaces leaves no U+3000 in the output", () => {
    fc.assert(
      fc.property(stringWithFullwidth, (s) => {
        const result = replaceFullwidthSpaces(s);
        expect(result).not.toContain("\u3000");
      }),
    );
  });

  it("detection count consistency: total detected ranges equals count of U+3000 in input", () => {
    fc.assert(
      fc.property(stringWithFullwidth, (s) => {
        const result = detectFullwidthSpaces(s);
        const totalDetected = result.ranges.length;
        const actualCount = [...s].filter((c) => c === "\u3000").length;
        expect(totalDetected).toBe(actualCount);
      }),
    );
  });

  it("non-fullwidth character preservation: characters other than U+3000 are unchanged", () => {
    fc.assert(
      fc.property(stringWithFullwidth, (s) => {
        const result = replaceFullwidthSpaces(s);
        const originalChars = [...s];
        const resultChars = [...result];
        for (let i = 0; i < originalChars.length; i++) {
          if (originalChars[i] !== "\u3000") {
            expect(resultChars[i]).toBe(originalChars[i]);
          }
        }
      }),
    );
  });
});
