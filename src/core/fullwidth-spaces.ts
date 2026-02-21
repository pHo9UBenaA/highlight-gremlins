import { CharRange, DetectionResult } from "./types";

const FULLWIDTH_SPACE = "\u3000";

export function detectFullwidthSpaces(text: string): DetectionResult {
  const ranges: CharRange[] = [];
  const lines = text.split("\n");

  for (let line = 0; line < lines.length; line++) {
    const lineText = lines[line];
    for (let i = 0; i < lineText.length; i++) {
      if (lineText[i] === FULLWIDTH_SPACE) {
        ranges.push({ line, startChar: i, endChar: i + 1 });
      }
    }
  }

  return { ranges };
}

export function replaceFullwidthSpaces(text: string): string {
  return text.replaceAll(FULLWIDTH_SPACE, " ");
}
