import { describe, it, expect } from "vitest";
import type { CharRange, DetectionResult, GremlinCharConfig } from "../src/core/types";

describe("smoke test", () => {
  it("types are importable", () => {
    const range: CharRange = { line: 0, startChar: 0, endChar: 1 };
    const result: DetectionResult = { ranges: [range] };
    expect(result.ranges).toHaveLength(1);
  });
});
