import { renderQrToString } from "@qrcl/core";

export interface CliRunOptions {
  stderr?: Pick<typeof console, "error">;
  stdout?: Pick<typeof console, "log">;
}

export function runQrCli(argv: string[], options: CliRunOptions = {}): number {
  const stdout = options.stdout ?? console;
  const stderr = options.stderr ?? console;
  const input = argv.join(" ").trim();

  if (!input) {
    stderr.error("Usage: qrcl <text-to-encode>");
    return 1;
  }

  try {
    const output = renderQrToString(input);
    stdout.log(output);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.error(`qrcl: ${message}`);
    return 1;
  }
}
