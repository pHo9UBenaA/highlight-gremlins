# Development

## Setup

```sh
npm install
```

## Build

```sh
npm run compile        # production build
npm run watch          # development build (watch mode)
```

## Test

```sh
npm test               # run tests once
npm run test:watch     # run tests in watch mode
```

## Debug

1. Open this folder in VSCode
2. Press F5 (or Cmd+Shift+P -> "Debug: Start Debugging")
3. Extension Development Host opens — test with any file containing full-width spaces, trailing spaces, or gremlin characters

## Package & Install

```sh
npm run package
code --install-extension highlight-unwanted-spaces-0.0.2.vsix --force
```

## Project Structure

```
src/
  extension.ts                # Entry point, event wiring
  core/
    types.ts                  # Pure: shared type definitions (CharRange, DetectionResult, etc.)
    fullwidth-spaces.ts       # Pure: full-width space (U+3000) detection and replacement
    trailing-spaces.ts        # Pure: trailing whitespace detection and removal
    gremlins.ts               # Pure: configurable gremlin character detection and removal
  adapters/
    config-reader.ts          # VSCode: workspace configuration reader
    decoration-manager.ts     # VSCode: decoration type management
    document-listener.ts      # VSCode: document change event listener
    command-handler.ts        # VSCode: command registration and execution
test/
  smoke.test.ts               # Toolchain smoke test
  core/
    fullwidth-spaces.test.ts  # Unit + PBT tests
    trailing-spaces.test.ts   # Unit + PBT tests
    gremlins.test.ts          # Unit + PBT tests
  adapters/
    config-reader.test.ts     # Adapter tests (VSCode API mocked at boundary)
    decoration-manager.test.ts
    document-listener.test.ts
    command-handler.test.ts
  helpers/
    vscode-mock.ts            # Mock VSCode API for testing
```

Architecture: **pure-core / imperative-shell** — all detection and replacement logic lives in `src/core/` as pure functions with zero VSCode dependency. `src/adapters/` provides thin wrappers around VSCode APIs.
