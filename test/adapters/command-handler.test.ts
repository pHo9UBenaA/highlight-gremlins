import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRegisterCommand, mockActiveTextEditor, MockRange, mockGetConfiguration } =
  vi.hoisted(() => {
    class MockRange {
      constructor(
        public startLine: number,
        public startChar: number,
        public endLine: number,
        public endChar: number
      ) {}
    }

    return {
      mockRegisterCommand: vi.fn(
        (command: string, callback: (...args: unknown[]) => unknown) => ({
          dispose: vi.fn(),
          command,
          callback,
        })
      ),
      mockActiveTextEditor: { value: undefined as any },
      MockRange,
      mockGetConfiguration: vi.fn(),
    };
  });

vi.mock("vscode", () => ({
  Range: MockRange,
  commands: {
    registerCommand: mockRegisterCommand,
  },
  window: {
    get activeTextEditor() {
      return mockActiveTextEditor.value;
    },
  },
  workspace: {
    getConfiguration: mockGetConfiguration,
  },
}));

import { registerCommands } from "../../src/adapters/command-handler";

function createMockEditor(text: string) {
  const editBuilder = { replace: vi.fn() };
  return {
    document: {
      getText: vi.fn(() => text),
      lineCount: text.split("\n").length,
    },
    edit: vi.fn(async (callback: (eb: any) => void) => {
      callback(editBuilder);
      return true;
    }),
    _editBuilder: editBuilder,
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

describe("registerCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTextEditor.value = undefined;
  });

  it("registers three commands", () => {
    const disposables = registerCommands();

    expect(mockRegisterCommand).toHaveBeenCalledTimes(3);
    expect(disposables).toHaveLength(3);
  });

  it("registers convertFullwidthSpaces command", () => {
    registerCommands();

    const commandNames = mockRegisterCommand.mock.calls.map((c: any) => c[0]);
    expect(commandNames).toContain(
      "highlight-unwanted-spaces.convertFullwidthSpaces"
    );
  });

  it("registers removeTrailingSpaces command", () => {
    registerCommands();

    const commandNames = mockRegisterCommand.mock.calls.map((c: any) => c[0]);
    expect(commandNames).toContain(
      "highlight-unwanted-spaces.removeTrailingSpaces"
    );
  });

  it("registers removeGremlins command", () => {
    registerCommands();

    const commandNames = mockRegisterCommand.mock.calls.map((c: any) => c[0]);
    expect(commandNames).toContain(
      "highlight-unwanted-spaces.removeGremlins"
    );
  });
});

describe("convertFullwidthSpaces command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTextEditor.value = undefined;
  });

  it("replaces fullwidth spaces with half-width spaces in the active editor", async () => {
    const editor = createMockEditor("hello\u3000world");
    mockActiveTextEditor.value = editor;

    registerCommands();

    const convertCmd = mockRegisterCommand.mock.calls.find(
      (c: any) => c[0] === "highlight-unwanted-spaces.convertFullwidthSpaces"
    );
    await convertCmd![1]();

    expect(editor.edit).toHaveBeenCalled();
    expect(editor._editBuilder.replace).toHaveBeenCalledWith(
      expect.any(MockRange),
      "hello world"
    );
  });

  it("does nothing when there is no active editor", async () => {
    mockActiveTextEditor.value = undefined;

    registerCommands();

    const convertCmd = mockRegisterCommand.mock.calls.find(
      (c: any) => c[0] === "highlight-unwanted-spaces.convertFullwidthSpaces"
    );
    // Should not throw
    await convertCmd![1]();
  });
});

describe("removeTrailingSpaces command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTextEditor.value = undefined;
  });

  it("removes trailing spaces from the active editor", async () => {
    const editor = createMockEditor("hello   \nworld  ");
    mockActiveTextEditor.value = editor;

    registerCommands();

    const removeCmd = mockRegisterCommand.mock.calls.find(
      (c: any) => c[0] === "highlight-unwanted-spaces.removeTrailingSpaces"
    );
    await removeCmd![1]();

    expect(editor.edit).toHaveBeenCalled();
    expect(editor._editBuilder.replace).toHaveBeenCalledWith(
      expect.any(MockRange),
      "hello\nworld"
    );
  });

  it("does nothing when there is no active editor", async () => {
    mockActiveTextEditor.value = undefined;

    registerCommands();

    const removeCmd = mockRegisterCommand.mock.calls.find(
      (c: any) => c[0] === "highlight-unwanted-spaces.removeTrailingSpaces"
    );
    await removeCmd![1]();
  });
});

describe("removeGremlins command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTextEditor.value = undefined;
  });

  it("removes gremlin characters from the active editor using config", async () => {
    const editor = createMockEditor("hello\u2013world");
    mockActiveTextEditor.value = editor;

    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "2013": { description: "en dash", level: "warning" },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    registerCommands();

    const removeCmd = mockRegisterCommand.mock.calls.find(
      (c: any) => c[0] === "highlight-unwanted-spaces.removeGremlins"
    );
    await removeCmd![1]();

    expect(editor.edit).toHaveBeenCalled();
    expect(editor._editBuilder.replace).toHaveBeenCalledWith(
      expect.any(MockRange),
      "helloworld"
    );
  });

  it("does nothing when there is no active editor", async () => {
    mockActiveTextEditor.value = undefined;

    registerCommands();

    const removeCmd = mockRegisterCommand.mock.calls.find(
      (c: any) => c[0] === "highlight-unwanted-spaces.removeGremlins"
    );
    await removeCmd![1]();
  });
});
