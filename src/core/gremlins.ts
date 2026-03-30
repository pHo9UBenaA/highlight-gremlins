import {
  GremlinCharConfig,
  GremlinDetection,
  GremlinDetectionResult,
} from "./types";

function shouldRemoveByDefault(config: GremlinCharConfig, codePoint: number): boolean {
  return (
    config.zeroWidth === true ||
    codePoint < 0x20 ||
    codePoint === 0x00ad
  );
}

export function detectGremlins(
  text: string,
  config: GremlinCharConfig[]
): GremlinDetectionResult {
  const configMap = new Map<number, GremlinCharConfig>();
  for (const c of config) {
    configMap.set(parseInt(c.codePoint, 16), c);
  }

  const detections: GremlinDetection[] = [];
  const affectedLines = new Set<number>();

  let line = 0;
  let charIndex = 0;

  for (const ch of text) {
    if (ch === "\n") {
      line++;
      charIndex = 0;
      continue;
    }

    const codePoint = ch.codePointAt(0)!;
    const matchedConfig = configMap.get(codePoint);
    if (matchedConfig) {
      detections.push({
        range: { line, startChar: charIndex, endChar: charIndex + 1 },
        config: matchedConfig,
      });
      affectedLines.add(line);
    }

    charIndex++;
  }

  return { detections, affectedLines };
}

export function removeGremlins(
  text: string,
  config: GremlinCharConfig[]
): string {
  const configMap = new Map<number, GremlinCharConfig>();
  for (const c of config) {
    configMap.set(parseInt(c.codePoint, 16), c);
  }

  let result = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const matchedConfig = configMap.get(cp);
    if (!matchedConfig) {
      result += ch;
      continue;
    }

    if (matchedConfig.replacement !== undefined) {
      result += matchedConfig.replacement;
      continue;
    }

    if (!shouldRemoveByDefault(matchedConfig, cp)) {
      result += ch;
    }
  }
  return result;
}
