# Phase 3: Trailing Spaces Detection and Removal (Pure Core + PBT)

## Context

Phase 2で全角スペースのcore関数が完成。ここではtrailing spaces（行末空白）の検出と削除のpure core関数を実装する。

## Goal

`detectTrailingSpaces` と `removeTrailingSpaces` をTDDで実装し、PBTで代数的性質を検証する。

## Files to Create/Modify

- `src/core/trailing-spaces.ts` — 新規作成
- `test/core/trailing-spaces.test.ts` — 新規作成

## Public Interface

```typescript
// src/core/trailing-spaces.ts
import { DetectionResult } from "./types";

export function detectTrailingSpaces(text: string): DetectionResult;
export function removeTrailingSpaces(text: string): string;
```

## TDD Slices (RED → GREEN の順)

### Example-Based Tests

1. `detectTrailingSpaces("")` → 空のranges
2. `detectTrailingSpaces("hello")` → 空のranges（trailing spaceなし）
3. `detectTrailingSpaces("hello ")` → `[{ line: 0, startChar: 5, endChar: 6 }]`
4. `detectTrailingSpaces("hello   ")` → `[{ line: 0, startChar: 5, endChar: 8 }]`（複数trailing spaces）
5. `detectTrailingSpaces("hello \nworld ")` → 2つのranges（各行）
6. `detectTrailingSpaces("  hello  ")` → leading spacesは無視、trailing spacesのみ検出
7. `detectTrailingSpaces("hello\t ")` → タブもtrailing whitespaceとして検出
8. `detectTrailingSpaces("   ")` → 全体がwhitespaceの行も検出
9. `removeTrailingSpaces("hello  ")` → `"hello"`
10. `removeTrailingSpaces("hello  \nworld  ")` → `"hello\nworld"`

### PBT Tests (fast-check)

以下の代数的性質を検証する:

1. **完全性**: `removeTrailingSpaces(s)` を行分割すると、各行の末尾に空白がない
2. **冪等性**: `removeTrailingSpaces(removeTrailingSpaces(s)) === removeTrailingSpaces(s)`
3. **行数保存**: `removeTrailingSpaces(s)` の行数 === `s` の行数（`\n` で分割）
4. **非trailing部分の保存**: 各行について、trailing whitespaceを除いたprefixは変更されない

### PBT用カスタムGenerator

```typescript
// 各行がオプションでtrailing whitespaceを持つ文字列を生成
const lineWithOptionalTrailing = fc.tuple(
  fc.stringOf(fc.char().filter(c => c !== "\n" && c !== " " && c !== "\t")),
  fc.stringOf(fc.oneof(fc.constant(" "), fc.constant("\t")))
).map(([content, trailing]) => content + trailing);

const multiLineText = fc.array(lineWithOptionalTrailing).map(lines => lines.join("\n"));
```

## 設計メモ

- VSCodeは行末をLF(`\n`)に正規化するため、`\n` 基準で処理する
- タブ(`\t`)とスペース(`\u0020`)の両方をtrailing whitespaceとして扱う
- 全角スペース(U+3000)はtrailing whitespaceとしては扱わない（Phase 2で別途処理）

## Acceptance Criteria

- [ ] 全てのexample-basedテストがパスする
- [ ] 全てのPBTテストがパスする
- [ ] タブ、混合whitespace、空行を正しく処理する
- [ ] `npm test` で全テスト（Phase 1, 2含む）がパスする

## Subagent Instruction

このフェーズはgeneral-purposeサブエージェントで実施する。`/tdd` skillに従い、Example-Based Testsを1つずつRED→GREENで進めた後、PBTテストを追加すること。
