/**
 * Mock implementations for VSCode API types and functions.
 * Used by adapter tests to avoid depending on the real VSCode runtime.
 */

import { vi } from "vitest";

// --- Basic value objects ---

export class MockPosition {
  constructor(
    public readonly line: number,
    public readonly character: number
  ) {}
}

export class MockRange {
  public readonly start: MockPosition;
  public readonly end: MockPosition;

  constructor(
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
  ) {
    this.start = new MockPosition(startLine, startCharacter);
    this.end = new MockPosition(endLine, endCharacter);
  }
}

// --- Decoration types ---

export interface MockDecorationRenderOptions {
  backgroundColor?: string;
  border?: string;
  overviewRulerColor?: string;
  overviewRulerLane?: number;
  isWholeLine?: boolean;
}

export function createMockDecorationType(options: MockDecorationRenderOptions) {
  return {
    key: `decoration-${Math.random().toString(36).slice(2)}`,
    dispose: vi.fn(),
    _options: options,
  };
}

export type MockTextEditorDecorationType = ReturnType<
  typeof createMockDecorationType
>;

// --- Editor ---

export interface MockTextDocument {
  getText: () => string;
  lineAt: (line: number) => { text: string; range: MockRange };
  lineCount: number;
  uri: { toString: () => string };
}

export interface MockEditBuilder {
  replace: ReturnType<typeof vi.fn>;
}

export interface MockTextEditor {
  document: MockTextDocument;
  setDecorations: ReturnType<typeof vi.fn>;
  edit: ReturnType<typeof vi.fn>;
}

export function createMockEditor(text: string): MockTextEditor {
  const lines = text.split("\n");
  const document: MockTextDocument = {
    getText: () => text,
    lineAt: (line: number) => ({
      text: lines[line] ?? "",
      range: new MockRange(line, 0, line, (lines[line] ?? "").length),
    }),
    lineCount: lines.length,
    uri: { toString: () => "file:///mock/file.txt" },
  };

  return {
    document,
    setDecorations: vi.fn(),
    edit: vi.fn(async (callback: (editBuilder: MockEditBuilder) => void) => {
      const editBuilder: MockEditBuilder = { replace: vi.fn() };
      callback(editBuilder);
      return true;
    }),
  };
}

// --- Configuration ---

export function createMockConfiguration(
  values: Record<string, unknown> = {}
) {
  return {
    get: vi.fn(<T>(key: string, defaultValue?: T): T => {
      if (key in values) {
        return values[key] as T;
      }
      return defaultValue as T;
    }),
  };
}

// --- VSCode module mock factory ---

export function createVscodeMock() {
  const decorationTypes: MockTextEditorDecorationType[] = [];

  return {
    Range: MockRange,
    Position: MockPosition,
    OverviewRulerLane: {
      Left: 1,
      Center: 2,
      Right: 4,
      Full: 7,
    },
    workspace: {
      getConfiguration: vi.fn(),
      onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    },
    window: {
      activeTextEditor: undefined as MockTextEditor | undefined,
      createTextEditorDecorationType: vi.fn(
        (options: MockDecorationRenderOptions) => {
          const dt = createMockDecorationType(options);
          decorationTypes.push(dt);
          return dt;
        }
      ),
      onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
    },
    commands: {
      registerCommand: vi.fn(
        (command: string, callback: (...args: unknown[]) => unknown) => {
          return { dispose: vi.fn(), command, callback };
        }
      ),
    },
    _decorationTypes: decorationTypes,
  };
}
