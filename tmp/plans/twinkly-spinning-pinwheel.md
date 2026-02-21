# highlight-unwanted-spaces: VSCode Extension Implementation Plan

## Context

全角スペース、trailing spaces、gremlins（問題のあるUnicode文字）を検出・強調表示・削除するVSCode拡張機能を新規作成する。3つの既存拡張（zenkaku, trailing-spaces, gremlins）の機能を1つの拡張に統合する。

## Architecture

**pure-core / imperative-shell** パターンを採用:
- `src/core/` — VSCode非依存の純粋関数（検出・置換ロジック）
- `src/adapters/` — VSCode APIとの接続層
- `src/extension.ts` — composition root

```
src/
  extension.ts
  core/
    types.ts
    fullwidth-spaces.ts
    trailing-spaces.ts
    gremlins.ts
  adapters/
    config-reader.ts
    decoration-manager.ts
    command-handler.ts
    document-listener.ts
test/
  smoke.test.ts
  core/
    fullwidth-spaces.test.ts
    trailing-spaces.test.ts
    gremlins.test.ts
```

## Phases

各フェーズはgeneral-purposeサブエージェントで実施する。TDD（RED→GREEN vertical slices）に従う。

| Phase | File | 内容 |
|-------|------|------|
| 1 | [phase1_project_scaffolding.md](./highlight_unwanted_spaces/phase1_project_scaffolding.md) | プロジェクト基盤、型定義、ビルド・テスト環境 |
| 2 | [phase2_fullwidth_space_core.md](./highlight_unwanted_spaces/phase2_fullwidth_space_core.md) | 全角スペース検出・置換 (pure core + PBT) |
| 3 | [phase3_trailing_spaces_core.md](./highlight_unwanted_spaces/phase3_trailing_spaces_core.md) | Trailing spaces検出・削除 (pure core + PBT) |
| 4 | [phase4_gremlins_core.md](./highlight_unwanted_spaces/phase4_gremlins_core.md) | Gremlins検出・削除 (pure core + PBT) |
| 5 | [phase5_vscode_adapters.md](./highlight_unwanted_spaces/phase5_vscode_adapters.md) | VSCode adapter層 (decoration, commands, listener, config) |
| 6 | [phase6_integration_polish.md](./highlight_unwanted_spaces/phase6_integration_polish.md) | スタイリング、設定トグル、E2E手動検証 |

## Commands (3つ)

1. `highlight-unwanted-spaces.convertFullwidthSpaces` — 全角スペース→半角スペース変換
2. `highlight-unwanted-spaces.removeTrailingSpaces` — Trailing spaces削除
3. `highlight-unwanted-spaces.removeGremlins` — Gremlins文字削除

## Tech Stack

- TypeScript, vitest, fast-check (PBT)
- VSCode Extension API (decorations, commands, configuration)

## Verification

各フェーズ終了時に `npm test` で全テストパスを確認。Phase 6でE2E手動検証チェックリストを実施。
