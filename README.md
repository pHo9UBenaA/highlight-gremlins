# Highlight Unwanted Spaces

Full-width spaces, trailing spaces, and gremlin characters to highlight and remove in VSCode.

## Features

### Full-width Space Highlighting

Full-width spaces (U+3000) are highlighted with a red background. Use the command palette to convert them to half-width spaces.

### Trailing Spaces Highlighting

Trailing whitespace at the end of lines is highlighted with a yellow background. Use the command palette to remove all trailing spaces.

### Gremlins Highlighting

Problematic Unicode characters (gremlins) are highlighted with color-coded backgrounds based on severity level. Lines containing gremlins are marked in the gutter. Use the command palette to clean them up by applying configured replacements and removing only clear control-like gremlins.

Default gremlin characters include zero-width spaces, directional formatting characters, non-breaking spaces, curly quotes, en dashes, and more.

## Commands

| Command | Description |
|---------|-------------|
| `Convert Full-width Spaces to Half-width` | Replace all full-width spaces (U+3000) with half-width spaces |
| `Remove Trailing Spaces` | Delete all trailing whitespace from every line |
| `Clean Up Gremlins` | Replace configured characters when a replacement is defined, and otherwise remove only control-like gremlins |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `highlight-unwanted-spaces.fullwidthSpaces.enabled` | `true` | Enable full-width space highlighting |
| `highlight-unwanted-spaces.trailingSpaces.enabled` | `true` | Enable trailing space highlighting |
| `highlight-unwanted-spaces.gremlins.enabled` | `true` | Enable gremlin character highlighting |
| `highlight-unwanted-spaces.gremlins.characters` | *(see below)* | Configurable list of gremlin characters to detect |

Default gremlin definitions are maintained in `src/config/default-gremlins.json`. Run `npm run sync:gremlin-defaults` after editing that file to synchronize the VSCode manifest in `package.json`.

### Default Gremlin Characters

| Code Point | Description | Level | Default cleanup |
|------------|-------------|-------|-----------------|
| U+0003 | end of text | warning | replace with empty string |
| U+000B | line tabulation | warning | replace with half-width space |
| U+00A0 | non breaking space | info | replace with half-width space |
| U+00AD | soft hyphen | info | remove |
| U+2013 | en dash | warning | replace with `-` |
| U+2018 | left single quotation mark | warning | replace with `'` |
| U+2019 | right single quotation mark | warning | replace with `'` |
| U+201C | left double quotation mark | warning | replace with `"` |
| U+201D | right double quotation mark | warning | replace with `"` |
| U+200B | zero width space | error | remove |
| U+200C | zero width non-joiner | warning | replace with empty string |
| U+200E | left-to-right mark | error | remove |
| U+2029 | paragraph separator | error | remove |
| U+202C | pop directional formatting | error | remove |
| U+202D | left-to-right override | error | remove |
| U+202E | right-to-left override | error | remove |
| U+2066 | left to right isolate | error | remove |
| U+2069 | pop directional isolate | error | remove |
| U+FFFC | object replacement character | error | remove |
