import * as vscode from "vscode";
import { replaceFullwidthSpaces } from "../core/fullwidth-spaces";
import { removeTrailingSpaces } from "../core/trailing-spaces";
import { removeGremlins } from "../core/gremlins";
import { getGremlinConfig } from "./config-reader";

function getFullDocumentRange(document: vscode.TextDocument): vscode.Range {
  return new vscode.Range(0, 0, document.lineCount - 1, Infinity);
}

export function registerCommands(): vscode.Disposable[] {
  const convertFullwidth = vscode.commands.registerCommand(
    "highlight-unwanted-spaces.convertFullwidthSpaces",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const text = editor.document.getText();
      const newText = replaceFullwidthSpaces(text);
      await editor.edit((editBuilder) => {
        editBuilder.replace(getFullDocumentRange(editor.document), newText);
      });
    }
  );

  const removeTrailing = vscode.commands.registerCommand(
    "highlight-unwanted-spaces.removeTrailingSpaces",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const text = editor.document.getText();
      const newText = removeTrailingSpaces(text);
      await editor.edit((editBuilder) => {
        editBuilder.replace(getFullDocumentRange(editor.document), newText);
      });
    }
  );

  const removeGremlinCmd = vscode.commands.registerCommand(
    "highlight-unwanted-spaces.removeGremlins",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const config = getGremlinConfig();
      const text = editor.document.getText();
      const newText = removeGremlins(text, config);
      await editor.edit((editBuilder) => {
        editBuilder.replace(getFullDocumentRange(editor.document), newText);
      });
    }
  );

  return [convertFullwidth, removeTrailing, removeGremlinCmd];
}
