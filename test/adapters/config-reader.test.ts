import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_GREMLIN_CHARACTERS } from "../../src/config/gremlin-defaults";

const { mockGetConfiguration } = vi.hoisted(() => ({
  mockGetConfiguration: vi.fn(),
}));

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: mockGetConfiguration,
  },
}));

import { getGremlinConfig, isFeatureEnabled } from "../../src/adapters/config-reader";

export type FeatureName = "fullwidthSpaces" | "trailingSpaces" | "gremlins";

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

describe("getGremlinConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when no characters are configured", () => {
    const mockConfig = createMockConfig({ "gremlins.characters": {} });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(mockGetConfiguration).toHaveBeenCalledWith("highlight-unwanted-spaces");
    expect(result).toContainEqual({
      codePoint: "2013",
      description: "en dash",
      level: "warning",
      zeroWidth: undefined,
      replacement: "-",
    });
  });

  it("converts a single character config entry to GremlinCharConfig", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "2013": { description: "en dash", level: "warning", replacement: "-" },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "2013",
      description: "en dash",
      level: "warning",
      zeroWidth: undefined,
      replacement: "-",
    });
  });

  it("converts multiple character config entries", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "2013": { description: "en dash", level: "warning", replacement: "-" },
        "200b": { description: "zero width space", level: "error", zeroWidth: true },
        "00a0": { description: "non breaking space", level: "info", replacement: " " },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "2013",
      description: "en dash",
      level: "warning",
      zeroWidth: undefined,
      replacement: "-",
    });
    expect(result).toContainEqual({
      codePoint: "200b",
      description: "zero width space",
      level: "error",
      zeroWidth: true,
      replacement: undefined,
    });
    expect(result).toContainEqual({
      codePoint: "00a0",
      description: "non breaking space",
      level: "info",
      zeroWidth: undefined,
      replacement: " ",
    });
  });

  it("preserves zeroWidth flag when present", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "200b": { description: "zero width space", level: "error", zeroWidth: true },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "200b",
      description: "zero width space",
      level: "error",
      zeroWidth: true,
      replacement: undefined,
    });
  });

  it("preserves replacement when present", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "2019": {
          description: "right single quotation mark",
          level: "warning",
          replacement: "'",
        },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "2019",
      description: "right single quotation mark",
      level: "warning",
      zeroWidth: undefined,
      replacement: "'",
    });
  });

  it("preserves warning fallbacks for control-like characters", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "000b": {
          description: "line tabulation",
          level: "warning",
          replacement: " ",
        },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "000b",
      description: "line tabulation",
      level: "warning",
      zeroWidth: undefined,
      replacement: " ",
    });
  });

  it("uses empty object as default when config key is missing", () => {
    const mockConfig = createMockConfig({});
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(mockConfig.get).toHaveBeenCalledWith("gremlins.characters", {});
    expect(result).toContainEqual({
      codePoint: "2013",
      description: "en dash",
      level: "warning",
      zeroWidth: undefined,
      replacement: "-",
    });
  });

  it("merges user config with defaults for missing code points", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "2603": {
          description: "snowman",
          level: "warning",
          replacement: "*",
        },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "2603",
      description: "snowman",
      level: "warning",
      zeroWidth: undefined,
      replacement: "*",
    });
    expect(result).toContainEqual({
      codePoint: "2019",
      description: "right single quotation mark",
      level: "warning",
      zeroWidth: undefined,
      replacement: "'",
    });
  });

  it("lets user config override the same code point", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "2013": {
          description: "custom dash",
          level: "info",
          replacement: "--",
        },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "2013",
      description: "custom dash",
      level: "info",
      zeroWidth: undefined,
      replacement: "--",
    });
  });

  it("deep-merges a user override with the default entry", () => {
    const mockConfig = createMockConfig({
      "gremlins.characters": {
        "200c": {
          replacement: " ",
        },
      },
    });
    mockGetConfiguration.mockReturnValue(mockConfig);

    const result = getGremlinConfig();

    expect(result).toContainEqual({
      codePoint: "200c",
      description: "zero width non-joiner",
      level: "warning",
      zeroWidth: true,
      replacement: " ",
    });
  });
});

describe("isFeatureEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true for fullwidthSpaces when config is true", () => {
    const mockConfig = createMockConfig({ "fullwidthSpaces.enabled": true });
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("fullwidthSpaces")).toBe(true);
  });

  it("returns false for fullwidthSpaces when config is false", () => {
    const mockConfig = createMockConfig({ "fullwidthSpaces.enabled": false });
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("fullwidthSpaces")).toBe(false);
  });

  it("returns true for trailingSpaces when config is true", () => {
    const mockConfig = createMockConfig({ "trailingSpaces.enabled": true });
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("trailingSpaces")).toBe(true);
  });

  it("returns false for trailingSpaces when config is false", () => {
    const mockConfig = createMockConfig({ "trailingSpaces.enabled": false });
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("trailingSpaces")).toBe(false);
  });

  it("returns true for gremlins when config is true", () => {
    const mockConfig = createMockConfig({ "gremlins.enabled": true });
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("gremlins")).toBe(true);
  });

  it("returns false for gremlins when config is false", () => {
    const mockConfig = createMockConfig({ "gremlins.enabled": false });
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("gremlins")).toBe(false);
  });

  it("defaults to true when config value is not set", () => {
    const mockConfig = createMockConfig({});
    mockGetConfiguration.mockReturnValue(mockConfig);

    expect(isFeatureEnabled("fullwidthSpaces")).toBe(true);
    expect(isFeatureEnabled("trailingSpaces")).toBe(true);
    expect(isFeatureEnabled("gremlins")).toBe(true);
  });

  it("reads from the correct configuration section", () => {
    const mockConfig = createMockConfig({});
    mockGetConfiguration.mockReturnValue(mockConfig);

    isFeatureEnabled("fullwidthSpaces");

    expect(mockGetConfiguration).toHaveBeenCalledWith("highlight-unwanted-spaces");
  });
});
