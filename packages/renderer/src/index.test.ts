import {
  normalizeRenderQrOptions,
  renderQrHalfBlockModel,
  renderQrFullBlockModel,
  renderQrText,
  renderQrAnsi,
  resolveQrTerminalColorStyle
} from "./index.js";
import { describe, expect, it } from "vitest";

describe("normalizeRenderQrOptions", () => {
  it("returns defaults", () => {
    expect(normalizeRenderQrOptions()).toEqual({
      invert: false,
      margin: 2,
      errorCorrectionLevel: "M",
      qrVersion: 0,
      encodingMode: "Byte",
      colorScheme: "none",
      outputMode: "halfblocks"
    });
  });

  it("throws on invalid margin", () => {
    expect(() => normalizeRenderQrOptions({ margin: -1 })).toThrow(/margin must be a non-negative integer/i);
  });

  it("throws on invalid error correction level", () => {
    expect(() =>
      normalizeRenderQrOptions({ errorCorrectionLevel: "X" as never })
    ).toThrow(/errorCorrectionLevel must be one of/i);
  });

  it("throws on invalid output mode", () => {
    expect(() => normalizeRenderQrOptions({ outputMode: "bad" as never })).toThrow(/outputMode must be one of/i);
  });
});

describe("resolveQrTerminalColorStyle", () => {
  it("returns no ansi colors for none", () => {
    expect(resolveQrTerminalColorStyle("none")).toEqual({ ansiOpen: "", ansiClose: "" });
  });

  it("returns ansi colors for high-contrast", () => {
    expect(resolveQrTerminalColorStyle("high-contrast")).toEqual({
      foreground: "black",
      background: "white",
      ansiOpen: "\u001b[30;47m",
      ansiClose: "\u001b[0m"
    });
  });
});

describe("render models", () => {
  it("builds a halfblock model with valid dimensions", () => {
    const model = renderQrHalfBlockModel("https://example.com", { margin: 2 });
    expect(model.moduleCount).toBeGreaterThan(0);
    expect(model.totalModuleWidth).toBe(model.moduleCount + 4);
    expect(model.rows.length).toBeGreaterThan(0);
    expect(model.rows[0]?.cells.length).toBe(model.totalModuleWidth);
    expect(model.rows.some((row) => row.intersectsContentArea)).toBe(true);
  });

  it("keeps full row count when margin is zero", () => {
    const model = renderQrHalfBlockModel("hello", { margin: 0 });
    expect(model.rows.length).toBe(Math.ceil(model.totalModuleWidth / 2));
  });

  it("builds a fullblock model with valid dimensions", () => {
    const model = renderQrFullBlockModel("hello", { margin: 1 });
    expect(model.totalModuleWidth).toBe(model.moduleCount + 2);
    expect(model.rows.length).toBe(model.totalModuleWidth);
    expect(model.rows[0]?.cells.length).toBe(model.totalModuleWidth);
  });

  it("supports invert rendering", () => {
    const normal = renderQrText("invert-check", { margin: 1 });
    const inverted = renderQrText("invert-check", { margin: 1, invert: true });
    expect(inverted).not.toEqual(normal);
  });

  it("throws on empty values", () => {
    expect(() => renderQrHalfBlockModel("   ")).toThrow(/non-empty value is required/i);
  });
});

describe("render string outputs", () => {
  it("renders halfblocks by default", () => {
    const output = renderQrText("abc123");
    expect(output).toContain("\n");
    expect(output.length).toBeGreaterThan(20);
  });

  it("renders fullblocks in full output mode", () => {
    const output = renderQrText("abc123", { outputMode: "fullblocks" });
    expect(output).toContain("██");
    expect(output).toContain("\n");
  });

  it("adds ansi sequences in high-contrast mode", () => {
    const output = renderQrAnsi("ansi-check", { colorScheme: "high-contrast" });
    expect(output).toContain("\u001b[30m");
    expect(output).toContain("\u001b[39m");
  });

  it("omits ansi sequences when color is none", () => {
    const output = renderQrAnsi("plain", { colorScheme: "none" });
    expect(output).not.toContain("\u001b[");
  });
});
