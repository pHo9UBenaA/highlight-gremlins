import rawDefaultGremlins from "./default-gremlins.json";
import type { GremlinCharConfig, GremlinLevel } from "../core/types";

export interface GremlinCharacterSetting {
  description: string;
  level: GremlinLevel;
  zeroWidth?: boolean;
  replacement?: string;
}

export type GremlinCharacterSettings = Record<string, GremlinCharacterSetting>;
export type GremlinCharacterSettingOverride = Partial<GremlinCharacterSetting>;
export type GremlinCharacterSettingsOverride = Record<
  string,
  GremlinCharacterSettingOverride
>;

export const DEFAULT_GREMLIN_CHARACTERS =
  rawDefaultGremlins as GremlinCharacterSettings;

export function toGremlinConfig(
  characters: GremlinCharacterSettings
): GremlinCharConfig[] {
  return Object.entries(characters).map(([codePoint, value]) => ({
    codePoint,
    description: value.description,
    level: value.level,
    zeroWidth: value.zeroWidth,
    replacement: value.replacement,
  }));
}

export function mergeGremlinCharacterSettings(
  defaults: GremlinCharacterSettings,
  overrides: GremlinCharacterSettingsOverride
): GremlinCharacterSettings {
  const merged: GremlinCharacterSettings = { ...defaults };

  for (const [codePoint, override] of Object.entries(overrides)) {
    merged[codePoint] = {
      ...defaults[codePoint],
      ...override,
    } as GremlinCharacterSetting;
  }

  return merged;
}
