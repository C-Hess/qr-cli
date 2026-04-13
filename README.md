# qr-cli

Terminal QR codes, but with style.

This repo is a TypeScript workspace with three packages:

- `@qr-cli/renderer`: core QR rendering (half-block and full-block output)
- `@qr-cli/cli`: command-line wrapper that prints to stdout
- `@qr-cli/ink`: Ink/React wrapper for terminal UIs

## Quick Start (Monorepo)

```bash
npm install
npm run build
node packages/cli/dist/cli.js "https://github.com/C-Hess/qr-cli"
```

You can also pipe input from stdin:

```bash
echo "https://github.com/C-Hess/qr-cli" | node packages/cli/dist/cli.js
```

## Ink First: Render QR In A React TUI

If the Ink component is your main integration point, use `@qr-cli/ink` and drop in `QrCode`.

```tsx
import React from "react";
import { render } from "ink";
import { QrCode } from "@qr-cli/ink";

function App() {
  return (
    <QrCode
      content="https://github.com/C-Hess/qr-cli"
      renderOptions={{
        outputMode: "halfblocks",
        errorCorrectionLevel: "M",
        margin: 2
      }}
      darkModuleColor="black"
      lightModuleColor="white"
    />
  );
}

render(<App />);
```

Useful `QrCode` props:

- `content` (required): value to encode
- `renderOptions`: `margin`, `padding`, `errorCorrectionLevel`, `encodingMode`, `qrVersion`, `outputMode`
- `darkModuleColor`: Ink foreground color for dark modules
- `lightModuleColor`: Ink background/light module color

For Ink, color styling comes from `darkModuleColor` and `lightModuleColor`.

In this monorepo, build the Ink package with:

```bash
npm run build:ink
```

Want a runnable example right now? Use the demo package:

```bash
npm run demo
```

Live controls while running:

- `Up` / `Down`: select setting row
- `Left` / `Right`: change selected setting
- `Enter` on `content`: edit QR content text
- `Enter` or `Esc` while editing: exit content editing mode
- `Backspace`: delete characters while editing
- `r`: reset content to default URL
- `q`: quit

The demo can live-toggle `content`, `outputMode`, `margin`, `padding`,
`errorCorrectionLevel`, `encodingMode`, `qrVersion`, and foreground/background colors.

## Real Sample Output (halfblocks)

Example content:

```text
https://github.com/C-Hess/qr-cli
```

Rendered output:

```text
                                 
  █▀▀▀▀▀█ █▄█ █  ▀█▀▀▄▄ █▀▀▀▀▀█  
  █ ███ █ ▀▀ ██  ▀█▄ █▄ █ ███ █  
  █ ▀▀▀ █ ▀ ▀█  ▀██▀▄ ▄ █ ▀▀▀ █  
  ▀▀▀▀▀▀▀ ▀▄▀ ▀▄▀▄█ ▀▄▀ ▀▀▀▀▀▀▀  
  ▀ ▄███▀▀▀▄▄▄ █  ▄▀ ▄▄█ ▄█ ██▀  
  ▄▀ ▄▀▀▀ ▄  ▀ █ ▀█▄▀▄ ▄▄█▀▄▀ ▄  
  ██▄▀▀▀▀ ██▀▀▄█▄▀█▄██▀ ██▄▄▄▄█  
  ▄ ▄ ██▀▄▄▀▀▄▀▀ ▄▀▀ █▀▀▀▄█ █ █  
  █▀██▀█▀▀▀▀█▀▀▄█ ▄▄ █▀▀  ▄▀▄▄   
  ██ ▄ ▄▀▀█▀▀▄▄ ▄▀ ▀▀█  ▄ ▀█▄ ▀  
  ▀▀  ▀ ▀ █▀▄▀█▀█▄▀▀  █▀▀▀██▀▀   
  █▀▀▀▀▀█ █▀▀ ▀ █▀ ▄███ ▀ █▀  ▄  
  █ ███ █ █▀█ ██▀▄█▄█▀▀█▀▀▀▀ ▀█  
  █ ▀▀▀ █  █▄▀▀  █▄   ▀▀▄█▀▄█▀█  
  ▀▀▀▀▀▀▀ ▀▀▀▀   ▀   ▀▀ ▀ ▀      
```

## CLI Options

- `--margin <n>`: quiet-zone width in modules (default: `2`)
- `--padding <n>`: outer padding width in modules (default: `1`)
- `--error-correction <L|M|Q|H>`: EC level (alias: `--ec`, default: `M`)
- `--qr-version <n|auto>`: QR version (`0` or `auto` = automatic)
- `--encoding <numeric|alphanumeric|byte|kanji>`: encoding mode (alias: `--mode`)
- `--color-scheme <none|high-contrast>`: terminal coloring (alias: `--color`)
- `--output-mode <halfblocks|fullblocks>`: render style (alias: `--output`)
- `--no-newline`: omit trailing newline
- `--help`: usage help
- `--version`: CLI version

Shorthand accepted for output mode:

- `--output half`
- `--output full`

## Development

- `npm test`: run workspace tests (Vitest)
- `npm run build`: build all packages
- `npm run check`: typecheck + test + build

## API Note

The renderer exposes a model-first API via `renderQrHalfBlockModel(content, options)`
and `renderQrFullBlockModel(content, options)`, so adapters (CLI, Ink, others)
can share QR generation logic without duplicating parsing behavior.
