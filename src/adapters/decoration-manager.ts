import * as vscode from "vscode";
import {
  CharRange,
  DetectionResult,
  GremlinDetectionResult,
  GremlinLevel,
} from "../core/types";

export interface DecorationManager {
  applyDecorations(
    editor: vscode.TextEditor,
    fullwidthResult: DetectionResult,
    trailingResult: DetectionResult,
    gremlinResult: GremlinDetectionResult
  ): void;
  dispose(): void;
}

function charRangeToVscodeRange(range: CharRange): vscode.Range {
  return new vscode.Range(range.line, range.startChar, range.line, range.endChar);
}

export function createDecorationManager(): DecorationManager {
  const fullwidthDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 128, 128, 0.3)",
    border: "1px solid rgba(255, 128, 128, 0.6)",
  });

  const trailingDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 255, 0, 0.3)",
  });

  const gremlinErrorDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    border: "1px solid rgba(255, 0, 0, 0.6)",
    overviewRulerColor: "red",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  const gremlinWarningDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 165, 0, 0.3)",
    border: "1px solid rgba(255, 165, 0, 0.6)",
    overviewRulerColor: "orange",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  const gremlinInfoDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(0, 100, 255, 0.3)",
    border: "1px solid rgba(0, 100, 255, 0.6)",
    overviewRulerColor: "blue",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  const gremlinGutterDecoration = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    overviewRulerColor: "rgba(255, 0, 0, 0.6)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  return {
    applyDecorations(
      editor: vscode.TextEditor,
      fullwidthResult: DetectionResult,
      trailingResult: DetectionResult,
      gremlinResult: GremlinDetectionResult
    ): void {
      // Fullwidth spaces
      const fullwidthRanges = fullwidthResult.ranges.map(charRangeToVscodeRange);
      editor.setDecorations(fullwidthDecoration, fullwidthRanges);

      // Trailing spaces
      const trailingRanges = trailingResult.ranges.map(charRangeToVscodeRange);
      editor.setDecorations(trailingDecoration, trailingRanges);

      // Gremlins grouped by level
      const gremlinsByLevel: Record<GremlinLevel, vscode.Range[]> = {
        error: [],
        warning: [],
        info: [],
      };

      for (const detection of gremlinResult.detections) {
        const range = charRangeToVscodeRange(detection.range);
        gremlinsByLevel[detection.config.level].push(range);
      }

      editor.setDecorations(gremlinErrorDecoration, gremlinsByLevel.error);
      editor.setDecorations(gremlinWarningDecoration, gremlinsByLevel.warning);
      editor.setDecorations(gremlinInfoDecoration, gremlinsByLevel.info);

      // Gutter decorations for affected lines
      const gutterRanges: vscode.Range[] = [];
      for (const line of gremlinResult.affectedLines) {
        gutterRanges.push(new vscode.Range(line, 0, line, 0));
      }
      editor.setDecorations(gremlinGutterDecoration, gutterRanges);
    },

    dispose(): void {
      fullwidthDecoration.dispose();
      trailingDecoration.dispose();
      gremlinErrorDecoration.dispose();
      gremlinWarningDecoration.dispose();
      gremlinInfoDecoration.dispose();
      gremlinGutterDecoration.dispose();
    },
  };
}
