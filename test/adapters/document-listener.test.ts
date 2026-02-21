import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  mockOnDidChangeTextDocument,
  mockOnDidChangeActiveTextEditor,
  mockActiveTextEditor,
  mockGetConfiguration,
  MockRange,
} = vi.hoisted(() => {
  class MockRange {
    constructor(
      public startLine: number,
      public startChar: number,
      public endLine: number,
      public endChar: number
    ) {}
  }

  return {
    mockOnDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    mockOnDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
    mockActiveTextEditor: { value: undefined as any },
    mockGetConfiguration: vi.fn(),
    MockRange,
  };
});

vi.mock("vscode", () => ({
  Range: MockRange,
  OverviewRulerLane: { Left: 1, Center: 2, Right: 4, Full: 7 },
  workspace: {
    onDidChangeTextDocument: mockOnDidChangeTextDocument,
    getConfiguration: mockGetConfiguration,
  },
  window: {
    get activeTextEditor() {
      return mockActiveTextEditor.value;
    },
    onDidChangeActiveTextEditor: mockOnDidChangeActiveTextEditor,
    createTextEditorDecorationType: vi.fn((options: any) => ({
      dispose: vi.fn(),
      _options: options,
    })),
  },
}));

import {
  createDocumentListener,
  triggerScan,
} from "../../src/adapters/document-listener";
import type { DecorationManager } from "../../src/adapters/decoration-manager";

function createMockEditor(text: string) {
  return {
    document: {
      getText: vi.fn(() => text),
      uri: { toString: () => "file:///mock.txt" },
    },
    setDecorations: vi.fn(),
  };
}

function createMockDecorationManager(): DecorationManager & {
  applyDecorations: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
} {
  return {
    applyDecorations: vi.fn(),
    dispose: vi.fn(),
  };
}

function createMockConfig(values: Record<string, unknown>) {
  return {
    get: vi.fn(<T>(key: string, defaultValue?: T): T => {
      if (key in values) {
        return values[key] as T;
      }
      return defaultValue as T;
    }),
  };
}

describe("createDocumentListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveTextEditor.value = undefined;
    const mockConfig = createMockConfig({ "gremlins.characters": {} });
    mockGetConfiguration.mockReturnValue(mockConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers event listeners and returns disposables", () => {
    const manager = createMockDecorationManager();

    const disposables = createDocumentListener(manager);

    expect(mockOnDidChangeTextDocument).toHaveBeenCalledTimes(1);
    expect(mockOnDidChangeActiveTextEditor).toHaveBeenCalledTimes(1);
    expect(disposables.length).toBeGreaterThanOrEqual(2);
  });

  it("triggers scan on text document change (with debounce)", () => {
    const editor = createMockEditor("hello\u3000world");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();

    createDocumentListener(manager);

    // Get the onDidChangeTextDocument callback
    const changeCallback = mockOnDidChangeTextDocument.mock.calls[0][0];

    // Simulate document change
    changeCallback({ document: editor.document });

    // Before debounce timeout, applyDecorations should not be called
    expect(manager.applyDecorations).not.toHaveBeenCalled();

    // After debounce timeout
    vi.advanceTimersByTime(150);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
  });

  it("triggers scan on active editor change", () => {
    const editor = createMockEditor("hello  ");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();

    createDocumentListener(manager);

    // Get the onDidChangeActiveTextEditor callback
    const editorChangeCallback =
      mockOnDidChangeActiveTextEditor.mock.calls[0][0];

    // Simulate editor change
    editorChangeCallback(editor);

    // After debounce
    vi.advanceTimersByTime(150);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
  });

  it("debounces rapid changes - only last one is applied", () => {
    const editor = createMockEditor("text");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();

    createDocumentListener(manager);

    const changeCallback = mockOnDidChangeTextDocument.mock.calls[0][0];

    // Rapid changes
    changeCallback({ document: editor.document });
    vi.advanceTimersByTime(50);
    changeCallback({ document: editor.document });
    vi.advanceTimersByTime(50);
    changeCallback({ document: editor.document });

    // Not yet past debounce since last call
    expect(manager.applyDecorations).not.toHaveBeenCalled();

    // Now wait for debounce
    vi.advanceTimersByTime(150);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
  });

  it("does not apply decorations when there is no active editor", () => {
    mockActiveTextEditor.value = undefined;
    const manager = createMockDecorationManager();

    createDocumentListener(manager);

    const changeCallback = mockOnDidChangeTextDocument.mock.calls[0][0];
    changeCallback({ document: {} });

    vi.advanceTimersByTime(150);

    expect(manager.applyDecorations).not.toHaveBeenCalled();
  });

  it("passes detection results from all three detectors to applyDecorations", () => {
    // Text with fullwidth space, trailing space, and no gremlins
    const editor = createMockEditor("hello\u3000world  ");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();

    createDocumentListener(manager);

    const changeCallback = mockOnDidChangeTextDocument.mock.calls[0][0];
    changeCallback({ document: editor.document });
    vi.advanceTimersByTime(150);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);

    const callArgs = manager.applyDecorations.mock.calls[0];
    // arg 0: editor
    expect(callArgs[0]).toBe(editor);
    // arg 1: fullwidth result - should have ranges
    expect(callArgs[1].ranges.length).toBeGreaterThan(0);
    // arg 2: trailing result - should have ranges
    expect(callArgs[2].ranges.length).toBeGreaterThan(0);
    // arg 3: gremlin result
    expect(callArgs[3]).toHaveProperty("detections");
    expect(callArgs[3]).toHaveProperty("affectedLines");
  });
});

describe("triggerScan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveTextEditor.value = undefined;
    const mockConfig = createMockConfig({ "gremlins.characters": {} });
    mockGetConfiguration.mockReturnValue(mockConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("immediately scans the active editor when called", () => {
    const editor = createMockEditor("hello\u3000world");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();

    triggerScan(manager);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
    expect(manager.applyDecorations.mock.calls[0][0]).toBe(editor);
  });

  it("does nothing when there is no active editor", () => {
    mockActiveTextEditor.value = undefined;
    const manager = createMockDecorationManager();

    triggerScan(manager);

    expect(manager.applyDecorations).not.toHaveBeenCalled();
  });

  it("passes empty fullwidth result when fullwidthSpaces feature is disabled", () => {
    const editor = createMockEditor("hello\u3000world");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();
    const mockConfig = createMockConfig({
      "gremlins.characters": {},
      "fullwidthSpaces.enabled": false,
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    triggerScan(manager);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
    const callArgs = manager.applyDecorations.mock.calls[0];
    // fullwidth result should have empty ranges
    expect(callArgs[1].ranges).toEqual([]);
  });

  it("passes empty trailing result when trailingSpaces feature is disabled", () => {
    const editor = createMockEditor("hello  ");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();
    const mockConfig = createMockConfig({
      "gremlins.characters": {},
      "trailingSpaces.enabled": false,
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    triggerScan(manager);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
    const callArgs = manager.applyDecorations.mock.calls[0];
    // trailing result should have empty ranges
    expect(callArgs[2].ranges).toEqual([]);
  });

  it("passes empty gremlin result when gremlins feature is disabled", () => {
    const editor = createMockEditor("hello\u200bworld");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "200b": { description: "zero width space", level: "error", zeroWidth: true },
      },
      "gremlins.enabled": false,
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    triggerScan(manager);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
    const callArgs = manager.applyDecorations.mock.calls[0];
    // gremlin result should have empty detections and affectedLines
    expect(callArgs[3].detections).toEqual([]);
    expect(callArgs[3].affectedLines.size).toBe(0);
  });

  it("still detects other features when only one is disabled", () => {
    // Text with both fullwidth space and trailing space
    const editor = createMockEditor("hello\u3000world  ");
    mockActiveTextEditor.value = editor;
    const manager = createMockDecorationManager();
    const mockConfig = createMockConfig({
      "gremlins.characters": {},
      "fullwidthSpaces.enabled": false,
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    triggerScan(manager);

    expect(manager.applyDecorations).toHaveBeenCalledTimes(1);
    const callArgs = manager.applyDecorations.mock.calls[0];
    // fullwidth should be empty (disabled)
    expect(callArgs[1].ranges).toEqual([]);
    // trailing should still detect
    expect(callArgs[2].ranges.length).toBeGreaterThan(0);
  });
});
