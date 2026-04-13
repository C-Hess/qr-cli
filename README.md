# qrcl

TypeScript npm workspace for console QR rendering.

## Packages

- `@qrcl/renderer`: core renderer API with a model-first QR render pipeline.
- `@qrcl/cli`: command-line wrapper for writing renderer output to stdout.
- `@qrcl/ink`: React Ink wrapper around the renderer.

## Quick start

```bash
npm install
npm test
npm run build
npx qrcl "https://example.com"
```

## Development checks

- `npm test` runs workspace tests with Vitest.
- `npm run build` builds all packages with Vite library mode.
- `npm run check` runs typecheck, tests, and builds.

## CLI options

- `--margin <n>`
- `--invert`
- `--error-correction <L|M|Q|H>` (alias: `--ec`)
- `--qr-version <n|auto>`
- `--encoding <numeric|alphanumeric|byte|kanji>` (alias: `--mode`)
- `--color-scheme <none|high-contrast>` (alias: `--color`)
- `--output-mode <halfblocks|fullblocks>` (alias: `--output`)
- `--no-newline`
- `--help`
- `--version`

CLI input can come from a positional argument or stdin.

## Notes

Core rendering supports UTF-8 halfblocks (compact) and fullblocks (taller).
Use `--color-scheme high-contrast` for black-on-white rendering in terminals.

## Core API

`@qrcl/renderer` exposes a model-first API via `renderQrHalfBlockModel(content, options)`.
Adapters like CLI and Ink can render from this shared model to apply
platform-specific ergonomics without duplicating QR parsing logic.
