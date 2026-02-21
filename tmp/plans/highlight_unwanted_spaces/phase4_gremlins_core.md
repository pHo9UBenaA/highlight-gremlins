# Phase 4: Gremlins Detection and Removal (Pure Core + PBT)

## Context

Phase 2-3で全角スペースとtrailing spacesのcore関数が完成。ここではgremlins（問題のあるUnicode文字）の設定可能な検出と削除のpure core関数を実装する。

## Goal

`detectGremlins` と `removeGremlins` をTDDで実装し、PBTで代数的性質を検証する。設定ベースの柔軟な文字検出を実現する。

## Files to Create/Modify

- `src/core/gremlins.ts` — 新規作成
- `test/core/gremlins.test.ts` — 新規作成

## Public Interface

```typescript
// src/core/gremlins.ts
import { GremlinCharConfig, GremlinDetectionResult } from "./types";

export function detectGremlins(text: string, config: GremlinCharConfig[]): GremlinDetectionResult;
export function removeGremlins(text: string, config: GremlinCharConfig[]): string;
```

## デフォルト設定（テスト用定数）

テストで使用するconfig定数を用意:

```typescript
const enDashConfig: GremlinCharConfig = {
  codePoint: "2013",
  description: "en dash",
  level: "warning",
};

const zeroWidthSpaceConfig: GremlinCharConfig = {
  codePoint: "200b",
  description: "zero width space",
  level: "error",
  zeroWidth: true,
};

const nonBreakingSpaceConfig: GremlinCharConfig = {
  codePoint: "00a0",
  description: "non breaking space",
  level: "info",
};
```

## TDD Slices (RED → GREEN の順)

### Example-Based Tests

1. `detectGremlins("", [enDashConfig])` → 空のdetections, 空のaffectedLines
2. `detectGremlins("hello", [enDashConfig])` → 空（ASCII文字にgremlinなし）
3. `detectGremlins("hello\u2013world", [enDashConfig])` → 1つのdetection、range: `{ line: 0, startChar: 5, endChar: 6 }`, config: enDashConfig
4. 上記のaffectedLinesに line 0 が含まれることを確認
5. 同じ行に複数のgremlins: `"a\u2013b\u2013c"` → 2つのdetections, affectedLinesにline 0が1回
6. 異なる行のgremlins: `"a\u2013b\nc\u200Bd"` → 2つのdetections, affectedLinesに line 0 と line 1
7. ゼロ幅文字の検出: `"abc\u200Bdef"` → 正しい位置で検出
8. `removeGremlins("hello\u2013world", [enDashConfig])` → `"helloworld"`
9. `removeGremlins("abc\u200Bdef", [zeroWidthSpaceConfig])` → `"abcdef"`
10. 設定の特異性: `detectGremlins("hello\u2013world", [])` → 空（設定なし=検出なし）
11. レベルの伝搬: detectionのconfigに正しいlevelが含まれること
12. 複数設定: `detectGremlins("a\u2013b\u00A0c", [enDashConfig, nonBreakingSpaceConfig])` → 2つのdetection、それぞれ正しいconfigを持つ

### PBT Tests (fast-check)

以下の代数的性質を検証する:

1. **完全性**: `removeGremlins(s, config)` の結果にconfig内のどのcode pointの文字も含まれない
2. **冪等性**: `removeGremlins(removeGremlins(s, config), config) === removeGremlins(s, config)`
3. **特異性**: configに含まれない文字は `removeGremlins` で変更されない
   - ASCII文字のみの文字列に対して `removeGremlins(s, config) === s`
4. **検出数の一貫性**: `detectGremlins(s, config).detections.length` === テキスト中のconfig文字の出現回数

### PBT用カスタムGenerator

```typescript
// gremlinCharConfigのサブセットをランダムに選択
const configSubset = fc.subarray(allDefaultConfigs, { minLength: 1 });

// 通常文字とgremlin文字を混在させた文字列を生成
const stringWithGremlins = (configs: GremlinCharConfig[]) =>
  fc.stringOf(
    fc.oneof(
      fc.char().filter(c => c.charCodeAt(0) > 0x7F === false),  // ASCII
      fc.constantFrom(...configs.map(c => String.fromCodePoint(parseInt(c.codePoint, 16)))),
      fc.constant("\n")
    )
  );
```

## 内部実装の指針

- `GremlinCharConfig[]` を受け取り、内部で `Map<number, GremlinCharConfig>` (code point → config) に変換して効率的に検索
- テキストを1文字ずつ走査し、各文字のcode pointがMapに存在するか確認
- 行番号は `\n` をカウントして追跡

## Acceptance Criteria

- [ ] 全てのexample-basedテストがパスする
- [ ] 全てのPBTテストがパスする
- [ ] 設定ベースの検出が正しく動作する（設定にない文字は無視）
- [ ] affectedLinesが正しく計算される
- [ ] 各detectionに正しいconfig（level, description, zeroWidth）が含まれる
- [ ] `npm test` で全テスト（Phase 1-3含む）がパスする

## Subagent Instruction

このフェーズはgeneral-purposeサブエージェントで実施する。`/tdd` skillに従い、Example-Based Testsを1つずつRED→GREENで進めた後、PBTテストを追加すること。
