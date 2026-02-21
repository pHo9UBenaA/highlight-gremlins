import * as vscode from "vscode";
import { detectFullwidthSpaces } from "../core/fullwidth-spaces";
import { detectTrailingSpaces } from "../core/trailing-spaces";
import { detectGremlins } from "../core/gremlins";
import { getGremlinConfig, isFeatureEnabled } from "./config-reader";
import { DecorationManager } from "./decoration-manager";
import { DetectionResult, GremlinDetectionResult } from "../core/types";

declare function setTimeout(callback: () => void, ms: number): number;
declare function clearTimeout(id: number): void;

const DEBOUNCE_MS = 100;

const EMPTY_DETECTION_RESULT: DetectionResult = { ranges: [] };
const EMPTY_GREMLIN_RESULT: GremlinDetectionResult = {
  detections: [],
  affectedLines: new Set<number>(),
};

export function triggerScan(decorationManager: DecorationManager): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const text = editor.document.getText();

  const fullwidthResult = isFeatureEnabled("fullwidthSpaces")
    ? detectFullwidthSpaces(text)
    : EMPTY_DETECTION_RESULT;

  const trailingResult = isFeatureEnabled("trailingSpaces")
    ? detectTrailingSpaces(text)
    : EMPTY_DETECTION_RESULT;

  const gremlinResult = isFeatureEnabled("gremlins")
    ? detectGremlins(text, getGremlinConfig())
    : EMPTY_GREMLIN_RESULT;

  decorationManager.applyDecorations(
    editor,
    fullwidthResult,
    trailingResult,
    gremlinResult
  );
}

export function createDocumentListener(
  decorationManager: DecorationManager
): vscode.Disposable[] {
  let debounceTimer: number | undefined;

  function debouncedScan(): void {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      triggerScan(decorationManager);
    }, DEBOUNCE_MS);
  }

  const textChangeDisposable = vscode.workspace.onDidChangeTextDocument(() => {
    debouncedScan();
  });

  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
    debouncedScan();
  });

  return [textChangeDisposable, editorChangeDisposable];
}
