import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  CharRange,
  DetectionResult,
  GremlinDetectionResult,
  GremlinCharConfig,
} from "../../src/core/types";

const { mockCreateDecorationType, MockRange } = vi.hoisted(() => {
  let counter = 0;

  class MockRange {
    public readonly start: { line: number; character: number };
    public readonly end: { line: number; character: number };
    constructor(
      startLine: number,
      startChar: number,
      endLine: number,
      endChar: number
    ) {
      this.start = { line: startLine, character: startChar };
      this.end = { line: endLine, character: endChar };
    }
  }

  return {
    mockCreateDecorationType: vi.fn((options: unknown) => ({
      key: `decoration-${counter++}`,
      dispose: vi.fn(),
      _options: options,
    })),
    MockRange,
  };
});

vi.mock("vscode", () => ({
  Range: MockRange,
  OverviewRulerLane: { Left: 1, Center: 2, Right: 4, Full: 7 },
  window: {
    createTextEditorDecorationType: mockCreateDecorationType,
  },
}));

import {
  createDecorationManager,
  DecorationManager,
} from "../../src/adapters/decoration-manager";

function createMockEditor(text: string) {
  const lines = text.split("\n");
  return {
    document: {
      getText: () => text,
      lineAt: (line: number) => ({
        text: lines[line] ?? "",
        range: new MockRange(line, 0, line, (lines[line] ?? "").length),
      }),
      lineCount: lines.length,
    },
    setDecorations: vi.fn(),
  };
}

describe("createDecorationManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates decoration types on construction", () => {
    const manager = createDecorationManager();

    // Should create 6 decoration types:
    // fullwidth, trailing, gremlin-error, gremlin-warning, gremlin-info, gremlin-gutter
    expect(mockCreateDecorationType).toHaveBeenCalledTimes(6);

    manager.dispose();
  });

  it("creates fullwidth space decoration with correct background color", () => {
    const manager = createDecorationManager();

    const calls = mockCreateDecorationType.mock.calls;
    // First call should be fullwidth spaces
    expect(calls[0][0]).toMatchObject({
      backgroundColor: "rgba(255, 128, 128, 0.3)",
    });

    manager.dispose();
  });

  it("creates trailing space decoration with correct background color", () => {
    const manager = createDecorationManager();

    const calls = mockCreateDecorationType.mock.calls;
    // Second call should be trailing spaces
    expect(calls[1][0]).toMatchObject({
      backgroundColor: "rgba(255, 255, 0, 0.3)",
    });

    manager.dispose();
  });

  it("creates gremlin error decoration with correct background color", () => {
    const manager = createDecorationManager();

    const calls = mockCreateDecorationType.mock.calls;
    expect(calls[2][0]).toMatchObject({
      backgroundColor: "rgba(255, 0, 0, 0.3)",
    });

    manager.dispose();
  });

  it("creates gremlin warning decoration with correct background color", () => {
    const manager = createDecorationManager();

    const calls = mockCreateDecorationType.mock.calls;
    expect(calls[3][0]).toMatchObject({
      backgroundColor: "rgba(255, 165, 0, 0.3)",
    });

    manager.dispose();
  });

  it("creates gremlin info decoration with correct background color", () => {
    const manager = createDecorationManager();

    const calls = mockCreateDecorationType.mock.calls;
    expect(calls[4][0]).toMatchObject({
      backgroundColor: "rgba(0, 100, 255, 0.3)",
    });

    manager.dispose();
  });

  it("creates gremlin gutter decoration with isWholeLine", () => {
    const manager = createDecorationManager();

    const calls = mockCreateDecorationType.mock.calls;
    expect(calls[5][0]).toMatchObject({
      isWholeLine: true,
    });

    manager.dispose();
  });
});

describe("DecorationManager.applyDecorations", () => {
  let manager: DecorationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = createDecorationManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  it("applies fullwidth space decorations converting CharRange to vscode.Range", () => {
    const editor = createMockEditor("a\u3000b");
    const fullwidthResult: DetectionResult = {
      ranges: [{ line: 0, startChar: 1, endChar: 2 }],
    };
    const trailingResult: DetectionResult = { ranges: [] };
    const gremlinResult: GremlinDetectionResult = {
      detections: [],
      affectedLines: new Set(),
    };

    manager.applyDecorations(
      editor as any,
      fullwidthResult,
      trailingResult,
      gremlinResult
    );

    // setDecorations should be called for each decoration type
    expect(editor.setDecorations).toHaveBeenCalled();

    // Check fullwidth space decoration call
    const fullwidthCall = editor.setDecorations.mock.calls[0];
    const ranges = fullwidthCall[1];
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toBeInstanceOf(MockRange);
    expect(ranges[0].start.line).toBe(0);
    expect(ranges[0].start.character).toBe(1);
    expect(ranges[0].end.line).toBe(0);
    expect(ranges[0].end.character).toBe(2);
  });

  it("applies trailing space decorations", () => {
    const editor = createMockEditor("hello  ");
    const fullwidthResult: DetectionResult = { ranges: [] };
    const trailingResult: DetectionResult = {
      ranges: [{ line: 0, startChar: 5, endChar: 7 }],
    };
    const gremlinResult: GremlinDetectionResult = {
      detections: [],
      affectedLines: new Set(),
    };

    manager.applyDecorations(
      editor as any,
      fullwidthResult,
      trailingResult,
      gremlinResult
    );

    // Second setDecorations call should be trailing spaces
    const trailingCall = editor.setDecorations.mock.calls[1];
    const ranges = trailingCall[1];
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start.line).toBe(0);
    expect(ranges[0].start.character).toBe(5);
    expect(ranges[0].end.character).toBe(7);
  });

  it("applies gremlin decorations grouped by level", () => {
    const editor = createMockEditor("a\u2013b");
    const fullwidthResult: DetectionResult = { ranges: [] };
    const trailingResult: DetectionResult = { ranges: [] };
    const warningConfig: GremlinCharConfig = {
      codePoint: "2013",
      description: "en dash",
      level: "warning",
    };
    const gremlinResult: GremlinDetectionResult = {
      detections: [
        {
          range: { line: 0, startChar: 1, endChar: 2 },
          config: warningConfig,
        },
      ],
      affectedLines: new Set([0]),
    };

    manager.applyDecorations(
      editor as any,
      fullwidthResult,
      trailingResult,
      gremlinResult
    );

    // calls: [0]=fullwidth, [1]=trailing, [2]=error, [3]=warning, [4]=info, [5]=gutter
    // Warning call should have one range
    const warningCall = editor.setDecorations.mock.calls[3];
    expect(warningCall[1]).toHaveLength(1);
    expect(warningCall[1][0].start.character).toBe(1);
    expect(warningCall[1][0].end.character).toBe(2);

    // Error and info calls should have empty arrays
    expect(editor.setDecorations.mock.calls[2][1]).toHaveLength(0);
    expect(editor.setDecorations.mock.calls[4][1]).toHaveLength(0);
  });

  it("applies gutter decoration for affected lines", () => {
    const editor = createMockEditor("line0\nline1");
    const fullwidthResult: DetectionResult = { ranges: [] };
    const trailingResult: DetectionResult = { ranges: [] };
    const gremlinResult: GremlinDetectionResult = {
      detections: [
        {
          range: { line: 1, startChar: 0, endChar: 1 },
          config: {
            codePoint: "200b",
            description: "zero width space",
            level: "error",
          },
        },
      ],
      affectedLines: new Set([1]),
    };

    manager.applyDecorations(
      editor as any,
      fullwidthResult,
      trailingResult,
      gremlinResult
    );

    // Gutter call (index 5) should have one range covering the whole line
    const gutterCall = editor.setDecorations.mock.calls[5];
    expect(gutterCall[1]).toHaveLength(1);
    expect(gutterCall[1][0].start.line).toBe(1);
  });

  it("clears all decorations when results are empty", () => {
    const editor = createMockEditor("hello");
    const fullwidthResult: DetectionResult = { ranges: [] };
    const trailingResult: DetectionResult = { ranges: [] };
    const gremlinResult: GremlinDetectionResult = {
      detections: [],
      affectedLines: new Set(),
    };

    manager.applyDecorations(
      editor as any,
      fullwidthResult,
      trailingResult,
      gremlinResult
    );

    // All 6 calls should have empty arrays
    expect(editor.setDecorations).toHaveBeenCalledTimes(6);
    for (let i = 0; i < 6; i++) {
      expect(editor.setDecorations.mock.calls[i][1]).toHaveLength(0);
    }
  });
});

describe("DecorationManager.dispose", () => {
  it("disposes all decoration types", () => {
    const manager = createDecorationManager();

    const decorationTypes = mockCreateDecorationType.mock.results.map(
      (r: any) => r.value
    );

    manager.dispose();

    for (const dt of decorationTypes) {
      expect(dt.dispose).toHaveBeenCalled();
    }
  });
});
