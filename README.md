# qrcl

TypeScript npm workspace for console QR rendering.

## Packages

- `@qrcl/core`: core renderer API with a model-first QR render pipeline.
- `@qrcl/cli`: command-line wrapper for writing core output to stdout.
- `@qrcl/ink-react`: React Ink wrapper around the core renderer.

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
- `--ec <L|M|Q|H>`
- `--qr-version <n|auto>`
- `--mode <numeric|alphanumeric|byte|kanji>`
- `--color <none|high-contrast>`
- `--output <halfblocks|fullblocks>`
- `--no-newline`
- `--help`
- `--version`

CLI input can come from a positional argument or stdin.

## Notes

Core rendering supports UTF-8 halfblocks (compact) and fullblocks (taller).
Use `--color high-contrast` for black-on-white rendering in terminals.

## Core API

`@qrcl/core` exposes a model-first API via `renderQrModel(value, options)`.
Adapters like CLI and Ink can render from this shared model to apply
platform-specific ergonomics without duplicating QR parsing logic.
