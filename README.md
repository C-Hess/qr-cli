# qrcl

TypeScript npm workspace for console QR rendering.

## Packages

- `@qrcl/core`: core renderer API that returns terminal string output.
- `@qrcl/cli`: command-line wrapper for writing core output to stdout.
- `@qrcl/ink-react`: React Ink wrapper around the core renderer.

## Quick start

```bash
npm install
npm run build
npx qrcl "https://example.com"
```

## CLI options

- `--margin <n>`
- `--invert`
- `--ec <L|M|Q|H>`
- `--qr-version <n|auto>`
- `--mode <numeric|alphanumeric|byte|kanji>`
- `--color <none|high-contrast>`
- `--output <halfblocks>`
- `--no-newline`
- `--help`
- `--version`

CLI input can come from a positional argument or stdin.

## Notes

Core rendering uses UTF-8 halfblocks for terminal-friendly output.
Use `--color high-contrast` for black-on-white rendering in terminals.
