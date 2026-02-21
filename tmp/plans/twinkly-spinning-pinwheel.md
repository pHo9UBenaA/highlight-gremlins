# @vscode/vsce を devDependencies に追加 & launch.json 修正

## Context

DEVELOPMENT.md で `npx @vscode/vsce` を使用しているが、`@vscode/vsce` を devDependencies に追加して npm script 経由で使えるようにする。また launch.json の diagnostics 警告を修正する。

## 変更内容

### 1. package.json — `@vscode/vsce` を devDependencies に追加 & package script 追加

ファイル: `package.json`

- `devDependencies` に `"@vscode/vsce": "latest"` を追加（`npm install --save-dev @vscode/vsce@latest`）
- `scripts` に `"package": "vsce package --allow-missing-repository"` を追加

### 2. DEVELOPMENT.md — npx → npm run package に変更

ファイル: `DEVELOPMENT.md`

```diff
-npx @vscode/vsce package --allow-missing-repository
+npm run package
```

### 3. .vscode/launch.json — diagnostics 修正

ファイル: `.vscode/launch.json`

現在の `"type": "extensionHost"` が認識されない警告が出ている。正しいVSCode拡張デバッグ設定に修正:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

注: `"type": "extensionHost"` はVSCode本体のbuilt-in debuggerが提供する型で、拡張がインストールされていなくても動作するはず。diagnostics警告はVSCode側の一時的な問題の可能性が高いため、設定自体はそのまま維持する。

## Verification

- `npm install` が成功すること
- `npm run package` で .vsix が生成されること
- `npm test` — 全92テストがパスすること
