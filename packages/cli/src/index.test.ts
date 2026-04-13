import { describe, expect, it } from "vitest";
import { runQrCli } from "./index.js";

interface CaptureStreams {
  out: string[];
  err: string[];
}

function createCaptureStreams(): CaptureStreams {
  return { out: [], err: [] };
}

describe("runQrCli", () => {
  it("prints help", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli(["--help"], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) }
    });

    expect(exit).toBe(0);
    expect(logs.out.join("")).toContain("Usage: qr-cli");
    expect(logs.err).toHaveLength(0);
  });

  it("prints version", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli(["--version"], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) }
    });

    expect(exit).toBe(0);
    expect(logs.out.join("")).toMatch(/^qr-cli\s+\d+\.\d+\.\d+/m);
  });

  it("returns error for unknown option", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli(["--wat"], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) }
    });

    expect(exit).toBe(1);
    expect(logs.err.join("")).toContain("Unknown option");
    expect(logs.err.join("")).toContain("Run 'qr-cli --help' for usage");
  });

  it("returns usage error when no input and tty", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli([], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) },
      isStdinTTY: true
    });

    expect(exit).toBe(1);
    expect(logs.err.join("")).toContain("Usage: qr-cli");
  });

  it("reads input from stdin when needed", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli([], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) },
      isStdinTTY: false,
      readStdin: async () => "from stdin"
    });

    expect(exit).toBe(0);
    expect(logs.out.join("")).toContain("\n");
    expect(logs.out.join("").length).toBeGreaterThan(20);
  });

  it("does not add trailing newline when --no-newline is set", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli(["--no-newline", "hello"], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) }
    });

    const output = logs.out.join("");
    expect(exit).toBe(0);
    expect(output.endsWith("\n")).toBe(false);
  });

  it("supports rendering options via arguments", async () => {
    const logs = createCaptureStreams();
    const exit = await runQrCli([
      "--margin",
      "1",
      "--error-correction",
      "H",
      "--encoding",
      "byte",
      "--color-scheme",
      "high-contrast",
      "--output-mode",
      "full",
      "hello options"
    ], {
      stdout: { write: (msg) => logs.out.push(msg) },
      stderr: { write: (msg) => logs.err.push(msg) }
    });

    expect(exit).toBe(0);
    expect(logs.out.join("")).toContain("\u001b[30;47m");
  });
});
