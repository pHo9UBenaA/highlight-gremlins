# Phase 2: Full-width Space Detection and Replacement (Pure Core + PBT)

## Context

Phase 1でプロジェクト基盤が整った。ここでは最初の機能である全角スペース(U+3000)の検出と置換のpure core関数を実装する。

## Goal

`detectFullwidthSpaces` と `replaceFullwidthSpaces` をTDDで実装し、PBTで代数的性質を検証する。

## Files to Create/Modify

- `src/core/fullwidth-spaces.ts` — 新規作成
- `test/core/fullwidth-spaces.test.ts` — 新規作成

## Public Interface

```typescript
// src/core/fullwidth-spaces.ts
import { DetectionResult } from "./types";

export function detectFullwidthSpaces(text: string): DetectionResult;
export function replaceFullwidthSpaces(text: string): string;
```

## TDD Slices (RED → GREEN の順)

### Example-Based Tests

1. `detectFullwidthSpaces("")` → 空のranges
2. `detectFullwidthSpaces("hello")` → 空のranges（false positiveなし）
3. `detectFullwidthSpaces("\u3000")` → `[{ line: 0, startChar: 0, endChar: 1 }]`
4. `detectFullwidthSpaces("a\u3000b")` → `[{ line: 0, startChar: 1, endChar: 2 }]`
5. `detectFullwidthSpaces("line1\nline2\u3000")` → `[{ line: 1, startChar: 5, endChar: 6 }]`（複数行対応）
6. `detectFullwidthSpaces("a\u3000\u3000b")` → 2つのrangeを返す（連続する全角スペース）
7. `replaceFullwidthSpaces("a\u3000b")` → `"a b"`
8. `replaceFullwidthSpaces("no fullwidth")` → `"no fullwidth"`（変更なし）

### PBT Tests (fast-check)

以下の代数的性質を検証する:

1. **長さ保存**: 任意の文字列sに対して `replaceFullwidthSpaces(s).length === s.length`
   - U+3000はU+0020に1:1置換されるため長さは変わらない
2. **冪等性**: `replaceFullwidthSpaces(replaceFullwidthSpaces(s)) === replaceFullwidthSpaces(s)`
3. **完全性**: `replaceFullwidthSpaces(s)` にはU+3000が含まれない
4. **検出数の一貫性**: `detectFullwidthSpaces(s).ranges` の合計文字数 === 入力中のU+3000の総数
5. **非全角文字の保存**: U+3000以外の文字は `replaceFullwidthSpaces` で変更されない

### PBT用カスタムGenerator

```typescript
// 通常のASCII文字とU+3000を混在させた文字列を生成
const stringWithFullwidth = fc.stringOf(
  fc.oneof(
    fc.char(),                           // 通常の文字
    fc.constant("\u3000"),               // 全角スペース
    fc.constant("\n")                    // 改行
  )
);
```

## Acceptance Criteria

- [ ] 全てのexample-basedテストがパスする
- [ ] 全てのPBTテストがパスする
- [ ] 空文字列、単一文字、複数行、連続全角スペースを正しく処理する
- [ ] `npm test` で全テストがパスする

## Subagent Instruction

このフェーズはgeneral-purposeサブエージェントで実施する。`/tdd` skillに従い、Example-Based Testsを1つずつRED→GREENで進めた後、PBTテストを追加すること。
