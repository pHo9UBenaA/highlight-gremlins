# Phase 6: Integration Polish and Finalization

## Context

Phase 5でVSCode adapter層が完成し、拡張機能として基本動作する状態になった。ここでは最終的なスタイリング調整、機能トグル設定、.gitignore更新、E2E手動テストを行う。

## Goal

拡張機能を使用可能な品質に仕上げ、全ての要件を満たすことを確認する。

## Files to Modify

### 1. Decoration スタイリング最終調整

`src/adapters/decoration-manager.ts` のdecoration styleを調整:

- **全角スペース**: `backgroundColor: "rgba(255, 128, 128, 0.3)"`, `border: "1px solid rgba(255, 128, 128, 0.6)"`
- **Trailing spaces**: `backgroundColor: "rgba(255, 255, 0, 0.3)"`
- **Gremlin error**: `backgroundColor: "rgba(255, 0, 0, 0.3)"`, `overviewRulerColor: "red"`
- **Gremlin warning**: `backgroundColor: "rgba(255, 165, 0, 0.3)"`, `overviewRulerColor: "orange"`
- **Gremlin info**: `backgroundColor: "rgba(0, 100, 255, 0.3)"`, `overviewRulerColor: "blue"`
- **Gremlin gutter (行番号強調)**: affectedLinesの行番号を `gutterIconPath` または `overviewRulerLane` で強調

### 2. 機能トグル設定

`package.json` の `contributes.configuration.properties` に追加:

```json
"highlight-unwanted-spaces.fullwidthSpaces.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable full-width space highlighting"
},
"highlight-unwanted-spaces.trailingSpaces.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable trailing space highlighting"
},
"highlight-unwanted-spaces.gremlins.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable gremlin character highlighting"
}
```

`config-reader.ts` に `isFeatureEnabled(feature)` を追加し、`document-listener.ts` で機能が無効の場合はスキャンを省略する。

### 3. `.gitignore` 更新

```
node_modules/
out/
.vscode-test/
*.vsix
```

### 4. package.json メタデータ最終化

- `publisher` フィールド追加
- `repository` フィールド追加
- `icon` プレースホルダー追加
- `keywords` 追加

## E2E手動検証チェックリスト

以下を手動で確認する:

### 全角スペース
- [ ] 全角スペースを含むファイルを開くと、全角スペースが赤背景で強調表示される
- [ ] コマンドパレットで "Convert Full-width Spaces to Half-width" を実行すると全角→半角に変換される
- [ ] 変換後、強調表示が消える

### Trailing Spaces
- [ ] trailing spacesを含むファイルを開くと、行末空白が黄色背景で強調表示される
- [ ] コマンドパレットで "Remove Trailing Spaces" を実行するとtrailing spacesが削除される
- [ ] 削除後、強調表示が消える

### Gremlins
- [ ] gremlin文字を含むファイルを開くと、gremlin文字が色付き背景で強調表示される
- [ ] gremlin文字を含む行の行番号/ガターが強調表示される
- [ ] errorレベルは赤、warningは橙、infoは青で表示される
- [ ] コマンドパレットで "Remove Gremlins" を実行するとgremlin文字が削除される

### 設定
- [ ] 設定で各機能を無効にできる
- [ ] gremlins.characters設定を変更すると検出対象が変わる
- [ ] 設定変更後、再読込なしで反映される

### 一般
- [ ] 拡張をロードしてもVSCodeのDevToolsコンソールにエラーがない
- [ ] テキスト編集中にリアルタイムでdecorationが更新される
- [ ] エディタ切替時にdecorationが正しく適用される

## Acceptance Criteria

- [ ] 全テスト（unit + PBT）がパスする
- [ ] 上記E2E手動検証が全てパスする
- [ ] `npm run compile` がエラーなしで完了する

## Subagent Instruction

このフェーズはgeneral-purposeサブエージェントで実施する。設定追加、スタイリング調整、.gitignore更新を行い、テストが通ることを確認すること。
