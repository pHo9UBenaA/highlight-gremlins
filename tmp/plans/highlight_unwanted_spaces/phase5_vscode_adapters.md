# Phase 5: VSCode Adapter Layer

## Context

Phase 2-4でpure core関数（検出・置換ロジック）が全て完成した。ここではVSCode APIと接続するadapter層を実装し、拡張機能として動作させる。

## Goal

decoration表示、コマンド実行、ドキュメント変更監視、設定読み取りのadapter層を実装し、extension.tsで全てを結線する。

## Architecture

```
src/adapters/
  config-reader.ts        -- 設定読み取り
  decoration-manager.ts   -- decoration作成・適用・破棄
  command-handler.ts      -- コマンド登録・実行
  document-listener.ts    -- ドキュメント変更・エディタ切替監視
src/extension.ts          -- composition root
```

## Files to Create/Modify

### 1. `src/adapters/config-reader.ts`

**責務**: `highlight-unwanted-spaces.gremlins.characters` 設定を読み取り、`GremlinCharConfig[]` に変換する。

```typescript
import * as vscode from "vscode";
import { GremlinCharConfig } from "../core/types";

export function getGremlinConfig(): GremlinCharConfig[] {
  const config = vscode.workspace.getConfiguration("highlight-unwanted-spaces");
  const characters = config.get<Record<string, { description: string; level: string; zeroWidth?: boolean }>>(
    "gremlins.characters",
    {}
  );
  return Object.entries(characters).map(([codePoint, value]) => ({
    codePoint,
    description: value.description,
    level: value.level as "error" | "warning" | "info",
    zeroWidth: value.zeroWidth,
  }));
}
```

### 2. `src/adapters/decoration-manager.ts`

**責務**: 各カテゴリの `TextEditorDecorationType` を作成し、検出結果をVSCode Rangeに変換してeditorに適用する。

**Decoration種類**:
- **全角スペース**: 背景色 `rgba(255, 128, 128, 0.3)`（淡い赤）
- **Trailing spaces**: 背景色 `rgba(255, 255, 0, 0.3)`（淡い黄色）
- **Gremlin error**: 背景色 `rgba(255, 0, 0, 0.3)` + border
- **Gremlin warning**: 背景色 `rgba(255, 165, 0, 0.3)` + border
- **Gremlin info**: 背景色 `rgba(0, 100, 255, 0.3)` + border
- **Gremlin gutter**: 行番号の横にアイコン/色表示（`overviewRulerColor` + `gutterIconPath` または `overviewRulerLane`）

**Core → VSCode Range変換**:
```typescript
function charRangeToVscodeRange(range: CharRange): vscode.Range {
  return new vscode.Range(range.line, range.startChar, range.line, range.endChar);
}
```

**applyDecorations メソッド**:
- `DetectionResult` の ranges を VSCode Range[] に変換して `editor.setDecorations()` を呼ぶ
- `GremlinDetectionResult` は level ごとにグループ化し、各decoration typeに適用
- `affectedLines` をgutter decorationに適用（行全体のRangeを作成）

**dispose メソッド**:
- 全ての `TextEditorDecorationType` を `dispose()` する

### 3. `src/adapters/command-handler.ts`

**責務**: 3つのコマンドを登録し、各コマンドの実行時にactive editorのテキストを取得→pure関数で置換→editを適用する。

```typescript
// コマンド: highlight-unwanted-spaces.convertFullwidthSpaces
// 1. activeEditorのdocument.getText()
// 2. replaceFullwidthSpaces(text) を呼ぶ
// 3. editor.edit() でフルドキュメント置換

// コマンド: highlight-unwanted-spaces.removeTrailingSpaces
// 同様に removeTrailingSpaces を使用

// コマンド: highlight-unwanted-spaces.removeGremlins
// getGremlinConfig() で設定取得 → removeGremlins(text, config) を使用
```

**注意**: `editor.edit()` はコールバック内で `editBuilder.replace(fullRange, newText)` を使用。

### 4. `src/adapters/document-listener.ts`

**責務**: ドキュメント変更とエディタ切替を監視し、検出関数を再実行してdecorationを更新する。

**イベント**:
- `vscode.workspace.onDidChangeTextDocument` — テキスト変更時
- `vscode.window.onDidChangeActiveTextEditor` — エディタ切替時

**デバウンス**: 100msのデバウンスでrapid typingによるCPU浪費を防ぐ。

**スキャンフロー**:
1. active editorのテキストを取得
2. `detectFullwidthSpaces(text)` 実行
3. `detectTrailingSpaces(text)` 実行
4. `detectGremlins(text, config)` 実行
5. `decorationManager.applyDecorations(editor, results...)` 呼び出し

### 5. `src/extension.ts` (修正)

**責務**: Composition root。全adapterをインスタンス化し、disposableとして登録する。

```typescript
export function activate(context: vscode.ExtensionContext) {
  const decorationManager = createDecorationManager();
  const commandDisposables = registerCommands();
  const listenerDisposables = createDocumentListener(decorationManager);

  context.subscriptions.push(decorationManager, ...commandDisposables, ...listenerDisposables);

  // 初回: 現在のactive editorに対してスキャン実行
  triggerScan();
}
```

## TDD Slices

Adapter層のテストはVSCode API境界でのモックを使用する。

### テスト対象と方法

1. **config-reader**: `vscode.workspace.getConfiguration` をモックし、返却された `GremlinCharConfig[]` の正しさを検証
2. **decoration-manager**: `editor.setDecorations` をモックし、`CharRange` → `vscode.Range` 変換の正しさを検証
3. **command-handler**: `editor.edit` をモックし、pure関数の結果が正しくeditに渡されることを検証
4. **document-listener**: イベント発火時にスキャンが実行されることを検証

### VSCodeモック戦略

```typescript
// test/helpers/vscode-mock.ts
// vscode モジュールのモックを提供
// Range, Position などの基本クラスをシンプルに実装
// workspace.getConfiguration, window.createTextEditorDecorationType などをスタブ化
```

**注意**: TDD skillの方針に従い、内部協力者ではなくシステム境界（VSCode API）のみをモックする。

## Acceptance Criteria

- [ ] adapter層のテストがパスする
- [ ] `npm run compile` がエラーなしで完了する
- [ ] VSCodeで拡張がロードされる（手動確認）
- [ ] 3つのコマンドがコマンドパレットに表示される
- [ ] ドキュメントを開くとdecorationが適用される
- [ ] テキスト変更時にdecorationが更新される
- [ ] 設定変更が反映される
- [ ] `npm test` で全テスト（Phase 1-4含む）がパスする

## Subagent Instruction

このフェーズはgeneral-purposeサブエージェントで実施する。`/tdd` skillに従い、各adapterを1つずつRED→GREENで実装すること。VSCode APIのモック方法は上記を参考にすること。
