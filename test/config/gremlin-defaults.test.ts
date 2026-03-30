import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_GREMLIN_CHARACTERS,
  toGremlinConfig,
} from "../../src/config/gremlin-defaults";

function readPackageJson() {
  return JSON.parse(
    readFileSync(
      resolve(__dirname, "../../package.json"),
      "utf8"
    )
  ) as {
    contributes: {
      configuration: {
        properties: {
          "highlight-unwanted-spaces.gremlins.characters": {
            default: Record<string, unknown>;
          };
        };
      };
    };
  };
}

describe("default gremlin configuration", () => {
  it("stays in sync with the package.json manifest default", () => {
    const packageJson = readPackageJson();
    const manifestDefault =
      packageJson.contributes.configuration.properties[
        "highlight-unwanted-spaces.gremlins.characters"
      ].default;

    expect(manifestDefault).toEqual(DEFAULT_GREMLIN_CHARACTERS);
  });

  it("converts shared defaults into runtime gremlin config entries", () => {
    const runtimeConfig = toGremlinConfig(DEFAULT_GREMLIN_CHARACTERS);

    expect(runtimeConfig).toContainEqual({
      codePoint: "2013",
      description: "en dash",
      level: "warning",
      zeroWidth: undefined,
      replacement: "-",
    });
    expect(runtimeConfig).toContainEqual({
      codePoint: "00a0",
      description: "non breaking space",
      level: "info",
      zeroWidth: undefined,
      replacement: " ",
    });
  });
});
