import * as vscode from "vscode";
import { GremlinCharConfig } from "../core/types";

export type FeatureName = "fullwidthSpaces" | "trailingSpaces" | "gremlins";

export function isFeatureEnabled(feature: FeatureName): boolean {
  const config = vscode.workspace.getConfiguration("highlight-unwanted-spaces");
  return config.get<boolean>(`${feature}.enabled`, true);
}

export function getGremlinConfig(): GremlinCharConfig[] {
  const config = vscode.workspace.getConfiguration("highlight-unwanted-spaces");
  const characters = config.get<
    Record<string, { description: string; level: string; zeroWidth?: boolean }>
  >("gremlins.characters", {});

  return Object.entries(characters).map(([codePoint, value]) => ({
    codePoint,
    description: value.description,
    level: value.level as "error" | "warning" | "info",
    zeroWidth: value.zeroWidth,
  }));
}
