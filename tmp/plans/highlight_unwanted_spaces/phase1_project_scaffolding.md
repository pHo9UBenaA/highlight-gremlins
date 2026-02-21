# Phase 1: Project Scaffolding and Core Types

## Context

VSCode拡張機能「highlight-unwanted-spaces」の初期セットアップ。TypeScriptプロジェクト構造、テストインフラ(vitest + fast-check)、VSCode拡張マニフェスト、共有型定義を作成する。

## Goal

ビルド・テストパイプラインが動作し、VSCode拡張として最低限ロードできる状態にする。

## Architecture

```
highlight-unwanted-spaces/
  package.json              -- VSCode拡張マニフェスト + npm scripts
  tsconfig.json             -- TypeScript設定
  vitest.config.ts          -- vitest設定
  .vscodeignore             -- パブリッシュ除外設定
  src/
    extension.ts            -- エントリポイント (空のactivate/deactivate)
    core/
      types.ts              -- 共有型定義
  test/
    smoke.test.ts           -- ツールチェーン確認用スモークテスト
```

## Pure Core Architecture (全フェーズ共通)

**pure-core / imperative-shell** パターンを採用する。

- `src/core/` 内の関数はVSCode APIに一切依存しない純粋関数
- `src/adapters/` がVSCode APIとの接続を担当（Phase 5で実装）
- テストはcore関数に対してVSCodeモックなしで実行可能

## Files to Create

### 1. `package.json`

```json
{
  "name": "highlight-unwanted-spaces",
  "displayName": "Highlight Unwanted Spaces",
  "description": "Highlight and remove full-width spaces, trailing spaces, and gremlin characters",
  "version": "0.0.1",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": ["*"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "highlight-unwanted-spaces.convertFullwidthSpaces",
        "title": "Convert Full-width Spaces to Half-width"
      },
      {
        "command": "highlight-unwanted-spaces.removeTrailingSpaces",
        "title": "Remove Trailing Spaces"
      },
      {
        "command": "highlight-unwanted-spaces.removeGremlins",
        "title": "Remove Gremlins"
      }
    ],
    "configuration": {
      "type": "object",
      "title": "Highlight Unwanted Spaces",
      "properties": {
        "highlight-unwanted-spaces.gremlins.characters": {
          "type": "object",
          "description": "List of gremlin characters to detect. Key is hex code point, value has description, level, and optional zeroWidth flag.",
          "scope": "language-overridable",
          "default": {
            "2013": { "description": "en dash", "level": "warning" },
            "2018": { "description": "left single quotation mark", "level": "warning" },
            "2019": { "description": "right single quotation mark", "level": "warning" },
            "2029": { "zeroWidth": true, "description": "paragraph separator", "level": "error" },
            "2066": { "zeroWidth": true, "description": "Left to right", "level": "error" },
            "2069": { "zeroWidth": true, "description": "Pop directional", "level": "error" },
            "0003": { "description": "end of text", "level": "warning" },
            "000b": { "description": "line tabulation", "level": "warning" },
            "00a0": { "description": "non breaking space", "level": "info" },
            "00ad": { "description": "soft hyphen", "level": "info" },
            "200b": { "zeroWidth": true, "description": "zero width space", "level": "error" },
            "200c": { "zeroWidth": true, "description": "zero width non-joiner", "level": "warning" },
            "200e": { "zeroWidth": true, "description": "left-to-right mark", "level": "error" },
            "201c": { "description": "left double quotation mark", "level": "warning" },
            "201d": { "description": "right double quotation mark", "level": "warning" },
            "202c": { "zeroWidth": true, "description": "pop directional formatting", "level": "error" },
            "202d": { "zeroWidth": true, "description": "left-to-right override", "level": "error" },
            "202e": { "zeroWidth": true, "description": "right-to-left override", "level": "error" },
            "fffc": { "zeroWidth": true, "description": "object replacement character", "level": "error" }
          }
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "typescript": "^5.3.0",
    "vitest": "^2.0.0",
    "fast-check": "^3.0.0"
  }
}
```

### 2. `tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules", ".vscode-test", "test"]
}
```

### 3. `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
```

### 4. `src/core/types.ts`

```typescript
export interface CharRange {
  line: number;
  startChar: number;
  endChar: number;
}

export interface DetectionResult {
  ranges: CharRange[];
}

export type GremlinLevel = "error" | "warning" | "info";

export interface GremlinCharConfig {
  codePoint: string;
  description: string;
  level: GremlinLevel;
  zeroWidth?: boolean;
}

export interface GremlinDetection {
  range: CharRange;
  config: GremlinCharConfig;
}

export interface GremlinDetectionResult {
  detections: GremlinDetection[];
  affectedLines: Set<number>;
}
```

### 5. `src/extension.ts`

```typescript
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // Will be wired in Phase 5
}

export function deactivate() {}
```

### 6. `.vscodeignore`

```
.vscode/**
.vscode-test/**
test/**
src/**
**/*.map
**/*.ts
!out/**/*.js
node_modules/**
.gitignore
vitest.config.ts
tsconfig.json
```

### 7. `test/smoke.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import type { CharRange, DetectionResult, GremlinCharConfig } from "../src/core/types";

describe("smoke test", () => {
  it("types are importable", () => {
    const range: CharRange = { line: 0, startChar: 0, endChar: 1 };
    const result: DetectionResult = { ranges: [range] };
    expect(result.ranges).toHaveLength(1);
  });
});
```

## TDD Slices

1. **RED**: `test/smoke.test.ts` を書く → テスト失敗（types.tsが存在しない）
2. **GREEN**: `src/core/types.ts` を作成 → テストパス

## Acceptance Criteria

- [ ] `npm install` が成功する
- [ ] `npm test` が実行され、スモークテストがパスする
- [ ] `npm run compile` がTypeScriptエラーなしで完了する
- [ ] `package.json` に3つのコマンドとgremlins設定スキーマが宣言されている

## Subagent Instruction

このフェーズはgeneral-purposeサブエージェントで実施する。`/tdd` skillに従い、RED→GREENの順で実装すること。
