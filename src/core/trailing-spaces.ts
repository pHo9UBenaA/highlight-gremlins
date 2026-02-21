import { CharRange, DetectionResult } from "./types";

export function detectTrailingSpaces(text: string): DetectionResult {
  const ranges: CharRange[] = [];
  const lines = text.split("\n");

  for (let line = 0; line < lines.length; line++) {
    const lineText = lines[line];
    const match = lineText.match(/[ \t]+$/);
    if (match) {
      const startChar = match.index!;
      const endChar = startChar + match[0].length;
      ranges.push({ line, startChar, endChar });
    }
  }

  return { ranges };
}

export function removeTrailingSpaces(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");
}
