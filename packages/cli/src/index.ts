import {
  renderQrAnsi,
  type ColorScheme,
  type EncodingMode,
  type ErrorCorrectionLevel,
  type OutputMode,
  type QrRenderOptions
} from "@qrcl/renderer";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface CliRunOptions {
  stderr?: {
    error?: (message: string) => void;
    write?: (message: string) => void;
  };
  stdout?: {
    log?: (message: string) => void;
    write?: (message: string) => void;
  };
  readStdin?: () => Promise<string>;
  isStdinTTY?: boolean;
}

interface ParsedArgs {
  input: string;
  renderOptions: QrRenderOptions;
  noNewline: boolean;
  showHelp: boolean;
  showVersion: boolean;
}

const CLI_VERSION = (() => {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = resolve(currentDir, "../package.json");
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version?: unknown;
    };
    return typeof parsed.version === "string" ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
})();

function writeOut(stdout: NonNullable<CliRunOptions["stdout"]>, message: string): void {
  if (stdout.write) {
    stdout.write(message);
    return;
  }
  if (stdout.log) {
    stdout.log(message.replace(/\n$/, ""));
  }
}

function writeErr(stderr: NonNullable<CliRunOptions["stderr"]>, message: string): void {
  if (stderr.write) {
    stderr.write(message);
    return;
  }
  if (stderr.error) {
    stderr.error(message.replace(/\n$/, ""));
  }
}

function usage(): string {
  return [
    "Usage: qrcl [options] <text-to-encode>",
    "",
    "Options:",
    "  --margin <n>           Quiet-zone width in modules (default: 2)",
    "  --invert               Invert light/dark modules",
    "  --error-correction <L|M|Q|H>",
    "                         Error correction level (default: M)",
    "                         Alias: --ec",
    "  --qr-version <n|auto>  QR version (0/auto means automatic)",
    "  --encoding <mode>      Encoding mode: numeric|alphanumeric|byte|kanji",
    "                         Alias: --mode",
    "  --color-scheme <mode>  Color mode: none|high-contrast",
    "                         Alias: --color",
    "  --output-mode <mode>   Output mode: halfblocks|fullblocks",
    "                         Alias: --output",
    "  --no-newline           Do not print trailing newline",
    "  --help                 Show help",
    "  --version              Show CLI version",
    "",
    "Input can also come from stdin when no positional text is provided."
  ].join("\n");
}

function parseArgs(argv: string[]): ParsedArgs {
  const renderOptions: QrRenderOptions = {};
  const textParts: string[] = [];
  let noNewline = false;
  let showHelp = false;
  let showVersion = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      showHelp = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      showVersion = true;
      continue;
    }
    if (arg === "--invert") {
      renderOptions.invert = true;
      continue;
    }
    if (arg === "--no-newline") {
      noNewline = true;
      continue;
    }

    const nextArg = argv[i + 1];
    if (arg === "--margin") {
      if (!nextArg) {
        throw new Error("Missing value for --margin.");
      }
      i += 1;
      const margin = Number.parseInt(nextArg, 10);
      if (!Number.isInteger(margin)) {
        throw new Error("--margin must be an integer.");
      }
      renderOptions.margin = margin;
      continue;
    }

    if (arg === "--error-correction" || arg === "--ec") {
      if (!nextArg) {
        throw new Error("Missing value for --error-correction.");
      }
      i += 1;
      const level = nextArg.toUpperCase() as ErrorCorrectionLevel;
      renderOptions.errorCorrectionLevel = level;
      continue;
    }

    if (arg === "--qr-version") {
      if (!nextArg) {
        throw new Error("Missing value for --qr-version.");
      }
      i += 1;
      if (nextArg === "auto" || nextArg === "0") {
        renderOptions.qrVersion = 0;
        continue;
      }
      const version = Number.parseInt(nextArg, 10);
      if (!Number.isInteger(version)) {
        throw new Error("--qr-version must be auto or an integer.");
      }
      renderOptions.qrVersion = version;
      continue;
    }

    if (arg === "--encoding" || arg === "--mode") {
      if (!nextArg) {
        throw new Error("Missing value for --encoding.");
      }
      i += 1;
      const normalized = nextArg.toLowerCase();
      const modeMap: Record<string, EncodingMode> = {
        numeric: "Numeric",
        alphanumeric: "Alphanumeric",
        byte: "Byte",
        kanji: "Kanji"
      };
      const mode = modeMap[normalized] ?? (nextArg as EncodingMode);
      renderOptions.encodingMode = mode;
      continue;
    }

    if (arg === "--color-scheme" || arg === "--color") {
      if (!nextArg) {
        throw new Error("Missing value for --color-scheme.");
      }
      i += 1;
      const color = nextArg.toLowerCase() as ColorScheme;
      renderOptions.colorScheme = color;
      continue;
    }

    if (arg === "--output-mode" || arg === "--output") {
      if (!nextArg) {
        throw new Error("Missing value for --output-mode.");
      }
      i += 1;
      const mode = nextArg.toLowerCase();
      const mappedMode: OutputMode | undefined =
        mode === "half" ? "halfblocks" : mode === "full" ? "fullblocks" : (mode as OutputMode);
      renderOptions.outputMode = mappedMode;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    textParts.push(arg);
  }

  return {
    input: textParts.join(" ").trim(),
    renderOptions,
    noNewline,
    showHelp,
    showVersion
  };
}

async function readAllStdin(): Promise<string> {
  const chunks: string[] = [];
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : String(chunk));
  }
  return chunks.join("");
}

export async function runQrCli(argv: string[], options: CliRunOptions = {}): Promise<number> {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeErr(stderr, `qrcl: ${message}\n`);
    writeErr(stderr, "Run 'qrcl --help' for usage.\n");
    return 1;
  }

  if (parsed.showHelp) {
    writeOut(stdout, `${usage()}\n`);
    return 0;
  }

  if (parsed.showVersion) {
    writeOut(stdout, `qrcl ${CLI_VERSION}\n`);
    return 0;
  }

  let input = parsed.input;
  if (!input) {
    const isStdinTTY = options.isStdinTTY ?? process.stdin.isTTY ?? false;
    if (!isStdinTTY) {
      const read = options.readStdin ?? readAllStdin;
      input = (await read()).trim();
    }
  }

  if (!input) {
    writeErr(stderr, "Usage: qrcl [options] <text-to-encode>\n");
    return 1;
  }

  try {
    const coloredOutput = renderQrAnsi(input, parsed.renderOptions);
    if (parsed.noNewline) {
      writeOut(stdout, coloredOutput);
    } else {
      writeOut(stdout, `${coloredOutput}\n`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeErr(stderr, `qrcl: ${message}\n`);
    return 1;
  }
}
