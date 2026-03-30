import * as vscode from "vscode";
import { GremlinCharConfig } from "../core/types";
import {
  DEFAULT_GREMLIN_CHARACTERS,
  GremlinCharacterSettingsOverride,
  mergeGremlinCharacterSettings,
  GremlinCharacterSettings,
  toGremlinConfig,
} from "../config/gremlin-defaults";

export type FeatureName = "fullwidthSpaces" | "trailingSpaces" | "gremlins";

export function isFeatureEnabled(feature: FeatureName): boolean {
  const config = vscode.workspace.getConfiguration("highlight-unwanted-spaces");
  return config.get<boolean>(`${feature}.enabled`, true);
}

export function getGremlinConfig(): GremlinCharConfig[] {
  const config = vscode.workspace.getConfiguration("highlight-unwanted-spaces");
  const overrides = config.get<GremlinCharacterSettingsOverride>(
    "gremlins.characters",
    {}
  );
  const characters: GremlinCharacterSettings = mergeGremlinCharacterSettings(
    DEFAULT_GREMLIN_CHARACTERS,
    overrides
  );

  return toGremlinConfig(characters);
}
