import * as vscode from "vscode";
import { createDecorationManager } from "./adapters/decoration-manager";
import { registerCommands } from "./adapters/command-handler";
import { createDocumentListener, triggerScan } from "./adapters/document-listener";

export function activate(context: vscode.ExtensionContext) {
  const decorationManager = createDecorationManager();
  const commandDisposables = registerCommands();
  const listenerDisposables = createDocumentListener(decorationManager);

  context.subscriptions.push(
    { dispose: () => decorationManager.dispose() },
    ...commandDisposables,
    ...listenerDisposables
  );

  // Initial scan of the currently active editor
  triggerScan(decorationManager);
}

export function deactivate() {}
