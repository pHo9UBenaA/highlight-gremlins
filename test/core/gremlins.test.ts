import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { detectGremlins, removeGremlins } from "../../src/core/gremlins";
import type { GremlinCharConfig } from "../../src/core/types";

const enDashConfig: GremlinCharConfig = {
  codePoint: "2013",
  description: "en dash",
  level: "warning",
};

const zeroWidthSpaceConfig: GremlinCharConfig = {
  codePoint: "200b",
  description: "zero width space",
  level: "error",
  zeroWidth: true,
};

const nonBreakingSpaceConfig: GremlinCharConfig = {
  codePoint: "00a0",
  description: "non breaking space",
  level: "info",
};

describe("detectGremlins", () => {
  it("returns empty detections and empty affectedLines for empty string", () => {
    const result = detectGremlins("", [enDashConfig]);
    expect(result.detections).toEqual([]);
    expect(result.affectedLines.size).toBe(0);
  });

  it("returns empty for ASCII-only text", () => {
    const result = detectGremlins("hello", [enDashConfig]);
    expect(result.detections).toEqual([]);
    expect(result.affectedLines.size).toBe(0);
  });

  it("detects en dash with correct range", () => {
    const result = detectGremlins("hello\u2013world", [enDashConfig]);
    expect(result.detections).toHaveLength(1);
    expect(result.detections[0].range).toEqual({
      line: 0,
      startChar: 5,
      endChar: 6,
    });
    expect(result.detections[0].config).toEqual(enDashConfig);
  });

  it("includes affected line in affectedLines", () => {
    const result = detectGremlins("hello\u2013world", [enDashConfig]);
    expect(result.affectedLines.has(0)).toBe(true);
    expect(result.affectedLines.size).toBe(1);
  });

  it("detects multiple gremlins on same line", () => {
    const result = detectGremlins("a\u2013b\u2013c", [enDashConfig]);
    expect(result.detections).toHaveLength(2);
    expect(result.detections[0].range).toEqual({
      line: 0,
      startChar: 1,
      endChar: 2,
    });
    expect(result.detections[1].range).toEqual({
      line: 0,
      startChar: 3,
      endChar: 4,
    });
    expect(result.affectedLines.size).toBe(1);
    expect(result.affectedLines.has(0)).toBe(true);
  });

  it("detects gremlins on different lines", () => {
    const result = detectGremlins("a\u2013b\nc\u200Bd", [
      enDashConfig,
      zeroWidthSpaceConfig,
    ]);
    expect(result.detections).toHaveLength(2);
    expect(result.detections[0].range).toEqual({
      line: 0,
      startChar: 1,
      endChar: 2,
    });
    expect(result.detections[0].config).toEqual(enDashConfig);
    expect(result.detections[1].range).toEqual({
      line: 1,
      startChar: 1,
      endChar: 2,
    });
    expect(result.detections[1].config).toEqual(zeroWidthSpaceConfig);
    expect(result.affectedLines.size).toBe(2);
    expect(result.affectedLines.has(0)).toBe(true);
    expect(result.affectedLines.has(1)).toBe(true);
  });

  it("detects zero width character at correct position", () => {
    const result = detectGremlins("abc\u200Bdef", [zeroWidthSpaceConfig]);
    expect(result.detections).toHaveLength(1);
    expect(result.detections[0].range).toEqual({
      line: 0,
      startChar: 3,
      endChar: 4,
    });
    expect(result.detections[0].config).toEqual(zeroWidthSpaceConfig);
  });
});

describe("removeGremlins", () => {
  it("removes en dash from text", () => {
    const result = removeGremlins("hello\u2013world", [enDashConfig]);
    expect(result).toBe("helloworld");
  });

  it("removes zero width space from text", () => {
    const result = removeGremlins("abc\u200Bdef", [zeroWidthSpaceConfig]);
    expect(result).toBe("abcdef");
  });
});

describe("detectGremlins - config specificity", () => {
  it("returns empty when config is empty", () => {
    const result = detectGremlins("hello\u2013world", []);
    expect(result.detections).toEqual([]);
    expect(result.affectedLines.size).toBe(0);
  });

  it("propagates level from config to detection", () => {
    const result = detectGremlins("a\u2013b\u200Bc", [
      enDashConfig,
      zeroWidthSpaceConfig,
    ]);
    expect(result.detections).toHaveLength(2);
    expect(result.detections[0].config.level).toBe("warning");
    expect(result.detections[0].config.description).toBe("en dash");
    expect(result.detections[1].config.level).toBe("error");
    expect(result.detections[1].config.description).toBe("zero width space");
    expect(result.detections[1].config.zeroWidth).toBe(true);
  });

  it("detects multiple types with correct configs", () => {
    const result = detectGremlins("a\u2013b\u00A0c", [
      enDashConfig,
      nonBreakingSpaceConfig,
    ]);
    expect(result.detections).toHaveLength(2);
    expect(result.detections[0].config).toEqual(enDashConfig);
    expect(result.detections[0].range).toEqual({
      line: 0,
      startChar: 1,
      endChar: 2,
    });
    expect(result.detections[1].config).toEqual(nonBreakingSpaceConfig);
    expect(result.detections[1].range).toEqual({
      line: 0,
      startChar: 3,
      endChar: 4,
    });
  });
});

// --- PBT Tests ---

const allDefaultConfigs: GremlinCharConfig[] = [
  enDashConfig,
  zeroWidthSpaceConfig,
  nonBreakingSpaceConfig,
];

const configSubset = fc.subarray(allDefaultConfigs, { minLength: 1 });

const stringWithGremlins = (configs: GremlinCharConfig[]) =>
  fc.stringOf(
    fc.oneof(
      fc.char().filter((c) => c.charCodeAt(0) <= 0x7f),
      fc.constantFrom(
        ...configs.map((c) => String.fromCodePoint(parseInt(c.codePoint, 16)))
      ),
      fc.constant("\n")
    )
  );

// Generate a tuple of [configs, string-with-those-gremlins]
const configAndString = configSubset.chain((configs) =>
  stringWithGremlins(configs).map((s) => [configs, s] as const)
);

describe("PBT: removeGremlins", () => {
  it("completeness: result contains none of the configured gremlin characters", () => {
    fc.assert(
      fc.property(configAndString, ([configs, s]) => {
        const result = removeGremlins(s, configs);
        const gremlinCodePoints = new Set(
          configs.map((c) => parseInt(c.codePoint, 16))
        );
        for (const ch of result) {
          if (gremlinCodePoints.has(ch.codePointAt(0)!)) {
            return false;
          }
        }
        return true;
      })
    );
  });

  it("idempotency: applying removeGremlins twice yields same result as once", () => {
    fc.assert(
      fc.property(configAndString, ([configs, s]) => {
        const once = removeGremlins(s, configs);
        const twice = removeGremlins(once, configs);
        expect(twice).toBe(once);
      })
    );
  });

  it("specificity: ASCII-only strings are unchanged", () => {
    fc.assert(
      fc.property(
        configSubset,
        fc.stringOf(fc.char().filter((c) => c.charCodeAt(0) <= 0x7f)),
        (configs, s) => {
          expect(removeGremlins(s, configs)).toBe(s);
        }
      )
    );
  });
});

describe("PBT: detectGremlins", () => {
  it("detection count equals number of gremlin character occurrences", () => {
    fc.assert(
      fc.property(configAndString, ([configs, s]) => {
        const result = detectGremlins(s, configs);
        const gremlinCodePoints = new Set(
          configs.map((c) => parseInt(c.codePoint, 16))
        );
        let expectedCount = 0;
        for (const ch of s) {
          if (gremlinCodePoints.has(ch.codePointAt(0)!)) {
            expectedCount++;
          }
        }
        expect(result.detections.length).toBe(expectedCount);
      })
    );
  });
});
