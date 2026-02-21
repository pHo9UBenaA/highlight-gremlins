# Fix All コマンド追加

## Context

既存の3つのコマンド（全角スペース変換、trailing spaces削除、gremlins削除）を一括実行する「Fix All」コマンドを追加する。

## 変更内容

### 1. `package.json` — コマンド追加

`contributes.commands` に追加:
```json
{
  "command": "highlight-unwanted-spaces.fixAll",
  "title": "Fix All Unwanted Spaces and Gremlins"
}
```

### 2. `src/adapters/command-handler.ts` — fixAll コマンド実装

3つの置換関数を順に適用して1回の edit で全置換:
```typescript
const fixAll = vscode.commands.registerCommand(
  "highlight-unwanted-spaces.fixAll",
  async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const config = getGremlinConfig();
    let text = editor.document.getText();
    text = replaceFullwidthSpaces(text);
    text = removeTrailingSpaces(text);
    text = removeGremlins(text, config);
    await editor.edit((editBuilder) => {
      editBuilder.replace(getFullDocumentRange(editor.document), text);
    });
  }
);
```

return配列に `fixAll` を追加。

### 3. `test/adapters/command-handler.test.ts` — テスト追加

- fixAll コマンドが登録されること
- 全3種の問題を含むテキストが1回で全て修正されること
- activeEditorがない場合のno-op

## Verification

- `npm test` — 全テストパス
- `npm run compile` — エラーなし
