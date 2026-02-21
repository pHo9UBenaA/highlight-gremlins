import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  detectTrailingSpaces,
  removeTrailingSpaces,
} from "../../src/core/trailing-spaces";

// Custom generators for PBT
const lineWithOptionalTrailing = fc
  .tuple(
    fc.stringOf(
      fc.char().filter((c) => c !== "\n" && c !== " " && c !== "\t")
    ),
    fc.stringOf(fc.oneof(fc.constant(" "), fc.constant("\t")))
  )
  .map(([content, trailing]) => content + trailing);

const multiLineText = fc
  .array(lineWithOptionalTrailing)
  .map((lines) => lines.join("\n"));

describe("detectTrailingSpaces", () => {
  it("returns empty ranges for empty string", () => {
    const result = detectTrailingSpaces("");
    expect(result.ranges).toEqual([]);
  });

  it("returns empty ranges for string without trailing spaces", () => {
    const result = detectTrailingSpaces("hello");
    expect(result.ranges).toEqual([]);
  });

  it("detects single trailing space", () => {
    const result = detectTrailingSpaces("hello ");
    expect(result.ranges).toEqual([{ line: 0, startChar: 5, endChar: 6 }]);
  });

  it("detects multiple trailing spaces as single range", () => {
    const result = detectTrailingSpaces("hello   ");
    expect(result.ranges).toEqual([{ line: 0, startChar: 5, endChar: 8 }]);
  });

  it("detects trailing spaces on multiple lines", () => {
    const result = detectTrailingSpaces("hello \nworld ");
    expect(result.ranges).toEqual([
      { line: 0, startChar: 5, endChar: 6 },
      { line: 1, startChar: 5, endChar: 6 },
    ]);
  });

  it("ignores leading spaces and only detects trailing spaces", () => {
    const result = detectTrailingSpaces("  hello  ");
    expect(result.ranges).toEqual([{ line: 0, startChar: 7, endChar: 9 }]);
  });

  it("detects tab as trailing whitespace", () => {
    const result = detectTrailingSpaces("hello\t ");
    expect(result.ranges).toEqual([{ line: 0, startChar: 5, endChar: 7 }]);
  });

  it("detects whitespace-only line as trailing", () => {
    const result = detectTrailingSpaces("   ");
    expect(result.ranges).toEqual([{ line: 0, startChar: 0, endChar: 3 }]);
  });
});

describe("removeTrailingSpaces", () => {
  it("removes trailing spaces from single line", () => {
    expect(removeTrailingSpaces("hello  ")).toBe("hello");
  });

  it("removes trailing spaces from multiple lines", () => {
    expect(removeTrailingSpaces("hello  \nworld  ")).toBe("hello\nworld");
  });
});

describe("PBT: removeTrailingSpaces", () => {
  it("completeness: no line ends with whitespace after removal", () => {
    fc.assert(
      fc.property(multiLineText, (s) => {
        const result = removeTrailingSpaces(s);
        const lines = result.split("\n");
        for (const line of lines) {
          expect(line).not.toMatch(/[ \t]$/);
        }
      })
    );
  });

  it("idempotency: applying removeTrailingSpaces twice yields same result as once", () => {
    fc.assert(
      fc.property(multiLineText, (s) => {
        const once = removeTrailingSpaces(s);
        const twice = removeTrailingSpaces(once);
        expect(twice).toBe(once);
      })
    );
  });

  it("line count preservation: number of lines is unchanged after removal", () => {
    fc.assert(
      fc.property(multiLineText, (s) => {
        const result = removeTrailingSpaces(s);
        expect(result.split("\n").length).toBe(s.split("\n").length);
      })
    );
  });

  it("non-trailing prefix preservation: each line's non-trailing content is unchanged", () => {
    fc.assert(
      fc.property(multiLineText, (s) => {
        const originalLines = s.split("\n");
        const resultLines = removeTrailingSpaces(s).split("\n");
        for (let i = 0; i < originalLines.length; i++) {
          const originalTrimmed = originalLines[i].replace(/[ \t]+$/, "");
          expect(resultLines[i]).toBe(originalTrimmed);
        }
      })
    );
  });
});
