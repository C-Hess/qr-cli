import qrcode from "qrcode-generator";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type EncodingMode = "Numeric" | "Alphanumeric" | "Byte" | "Kanji";
export type ColorScheme = "none" | "high-contrast";
export type OutputMode = "halfblocks" | "fullblocks";

export interface QrColorStyle {
  foreground?: "black";
  background?: "white";
  ansiOpen: string;
  ansiClose: string;
}

export interface RenderQrOptions {
  invert?: boolean;
  margin?: number;
  errorCorrectionLevel?: ErrorCorrectionLevel;
  qrVersion?: number;
  encodingMode?: EncodingMode;
  colorScheme?: ColorScheme;
  outputMode?: OutputMode;
}

export interface NormalizedRenderQrOptions {
  invert: boolean;
  margin: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  qrVersion: number;
  encodingMode: EncodingMode;
  colorScheme: ColorScheme;
  outputMode: OutputMode;
}

export interface QrHalfBlockCell {
  char: " " | "▀" | "▄" | "█";
  topDark: boolean;
  bottomDark: boolean;
  isContentColumn: boolean;
}

export interface QrHalfBlockRow {
  raw: string;
  cells: QrHalfBlockCell[];
  topY: number;
  bottomY: number;
  touchesContent: boolean;
  isFullyInsideContent: boolean;
  isUpperBoundaryRow: boolean;
  isLowerBoundaryRow: boolean;
}

export interface QrHalfBlockRenderModel {
  margin: number;
  size: number;
  width: number;
  colorScheme: ColorScheme;
  rows: QrHalfBlockRow[];
}

export interface QrFullBlockCell {
  char: " " | "█";
  dark: boolean;
  isContentColumn: boolean;
}

export interface QrFullBlockRow {
  raw: string;
  cells: QrFullBlockCell[];
  y: number;
  isContentRow: boolean;
}

export interface QrFullBlockRenderModel {
  margin: number;
  size: number;
  width: number;
  colorScheme: ColorScheme;
  rows: QrFullBlockRow[];
}

export function resolveQrColorStyle(colorScheme: ColorScheme = "none"): QrColorStyle {
  if (colorScheme === "high-contrast") {
    return {
      foreground: "black",
      background: "white",
      ansiOpen: "\u001b[30;47m",
      ansiClose: "\u001b[0m"
    };
  }

  return {
    ansiOpen: "",
    ansiClose: ""
  };
}

const VALID_ERROR_CORRECTION_LEVELS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const VALID_ENCODING_MODES: EncodingMode[] = ["Numeric", "Alphanumeric", "Byte", "Kanji"];
const VALID_OUTPUT_MODES: OutputMode[] = ["halfblocks", "fullblocks"];

interface QrModuleGrid {
  margin: number;
  size: number;
  width: number;
  colorScheme: ColorScheme;
  isDarkAt: (y: number, x: number) => boolean;
}

export function normalizeRenderQrOptions(options: RenderQrOptions = {}): NormalizedRenderQrOptions {
  const margin = options.margin ?? 2;
  if (!Number.isInteger(margin) || margin < 0) {
    throw new Error("margin must be a non-negative integer.");
  }

  const errorCorrectionLevel = options.errorCorrectionLevel ?? "M";
  if (!VALID_ERROR_CORRECTION_LEVELS.includes(errorCorrectionLevel)) {
    throw new Error("errorCorrectionLevel must be one of L, M, Q, H.");
  }

  const qrVersion = options.qrVersion ?? 0;
  if (!Number.isInteger(qrVersion) || qrVersion < 0 || qrVersion > 40) {
    throw new Error("qrVersion must be an integer between 0 and 40.");
  }

  const encodingMode = options.encodingMode ?? "Byte";
  if (!VALID_ENCODING_MODES.includes(encodingMode)) {
    throw new Error("encodingMode must be one of Numeric, Alphanumeric, Byte, Kanji.");
  }

  const colorScheme = options.colorScheme ?? "none";
  if (colorScheme !== "none" && colorScheme !== "high-contrast") {
    throw new Error("colorScheme must be one of none, high-contrast.");
  }

  const outputMode = options.outputMode ?? "halfblocks";
  if (!VALID_OUTPUT_MODES.includes(outputMode)) {
    throw new Error("outputMode must be one of halfblocks, fullblocks.");
  }

  return {
    invert: options.invert ?? false,
    margin,
    errorCorrectionLevel,
    qrVersion,
    encodingMode,
    colorScheme,
    outputMode
  };
}

function createQrModuleGrid(value: string, options: RenderQrOptions = {}): QrModuleGrid {
  if (!value.trim()) {
    throw new Error("A non-empty value is required.");
  }

  const normalized = normalizeRenderQrOptions(options);
  const qr = qrcode(
    normalized.qrVersion as Parameters<typeof qrcode>[0],
    normalized.errorCorrectionLevel
  );
  qr.addData(value, normalized.encodingMode);
  qr.make();

  const size = qr.getModuleCount();
  const width = size + normalized.margin * 2;

  const isDarkAt = (y: number, x: number): boolean => {
    const srcX = x - normalized.margin;
    const srcY = y - normalized.margin;
    const inside = srcY >= 0 && srcY < size && srcX >= 0 && srcX < size;
    if (!inside) {
      return normalized.invert;
    }

    const dark = qr.isDark(srcY, srcX);
    return normalized.invert ? !dark : dark;
  };

  return {
    margin: normalized.margin,
    size,
    width,
    colorScheme: normalized.colorScheme,
    isDarkAt
  };
}

function toHalfBlock(topDark: boolean, bottomDark: boolean): " " | "▀" | "▄" | "█" {
  if (topDark && bottomDark) {
    return "█";
  }
  if (topDark) {
    return "▀";
  }
  if (bottomDark) {
    return "▄";
  }
  return " ";
}

export function renderQrModel(value: string, options: RenderQrOptions = {}): QrHalfBlockRenderModel {
  const grid = createQrModuleGrid(value, options);
  const maxY = grid.margin + grid.size;
  const rows: QrHalfBlockRow[] = [];

  for (let y = 0; y < grid.width; y += 2) {
    const topY = y;
    const bottomY = topY + 1;
    const touchesContent =
      (topY >= grid.margin && topY < maxY) ||
      (bottomY >= grid.margin && bottomY < maxY);
    const isFullyInsideContent =
      topY >= grid.margin &&
      topY < maxY &&
      bottomY >= grid.margin &&
      bottomY < maxY;
    const isUpperBoundaryRow =
      topY < grid.margin && bottomY >= grid.margin && bottomY < maxY;
    const isLowerBoundaryRow = topY >= grid.margin && topY < maxY && bottomY >= maxY;

    let raw = "";
    const cells: QrHalfBlockCell[] = [];

    for (let x = 0; x < grid.width; x += 1) {
      const topDark = grid.isDarkAt(topY, x);
      const bottomDark = grid.isDarkAt(bottomY, x);
      const char = toHalfBlock(topDark, bottomDark);

      raw += char;
      cells.push({
        char,
        topDark,
        bottomDark,
        isContentColumn: x >= grid.margin && x < maxY
      });
    }

    rows.push({
      raw,
      cells,
      topY,
      bottomY,
      touchesContent,
      isFullyInsideContent,
      isUpperBoundaryRow,
      isLowerBoundaryRow
    });
  }

  if (rows.length > 0 && grid.margin > 0) {
    const lastRow = rows[rows.length - 1];
    if (lastRow && /^\s*$/.test(lastRow.raw)) {
      rows.pop();
    }
  }

  return {
    margin: grid.margin,
    size: grid.size,
    width: grid.width,
    colorScheme: grid.colorScheme,
    rows
  };
}

export function renderQrFullBlockModel(value: string, options: RenderQrOptions = {}): QrFullBlockRenderModel {
  const grid = createQrModuleGrid(value, options);
  const maxY = grid.margin + grid.size;
  const rows: QrFullBlockRow[] = [];

  for (let y = 0; y < grid.width; y += 1) {
    const isContentRow = y >= grid.margin && y < maxY;
    let raw = "";
    const cells: QrFullBlockCell[] = [];

    for (let x = 0; x < grid.width; x += 1) {
      const dark = grid.isDarkAt(y, x);
      const char: " " | "█" = dark ? "█" : " ";
      raw += char;
      cells.push({
        char,
        dark,
        isContentColumn: x >= grid.margin && x < maxY
      });
    }

    rows.push({
      raw,
      cells,
      y,
      isContentRow
    });
  }

  return {
    margin: grid.margin,
    size: grid.size,
    width: grid.width,
    colorScheme: grid.colorScheme,
    rows
  };
}

function applyAnsiColorToQrContent(model: QrHalfBlockRenderModel, colorScheme: ColorScheme): string {
  const colorStyle = resolveQrColorStyle(colorScheme);
  if (!colorStyle.ansiOpen) {
    return model.rows.map((row) => row.raw).join("\n");
  }

  if (model.rows.length === 0) {
    return "";
  }

  const ansiBlackFgOpen = "\u001b[30m";
  const ansiWhiteFgOpen = "\u001b[37m";
  const ansiFgClose = "\u001b[39m";
  return model.rows
    .map((row) => {
      if (!row.touchesContent) {
        return row.raw;
      }

      let coloredLine = "";
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        if (!cell) {
          continue;
        }

        if (!cell.isContentColumn) {
          coloredLine += cell.char;
          continue;
        }

        if (row.isUpperBoundaryRow) {
          const fg = cell.bottomDark ? ansiBlackFgOpen : ansiWhiteFgOpen;
          coloredLine += `${fg}▄${ansiFgClose}`;
          continue;
        }

        if (row.isLowerBoundaryRow) {
          const fg = cell.topDark ? ansiBlackFgOpen : ansiWhiteFgOpen;
          coloredLine += `${fg}▀${ansiFgClose}`;
          continue;
        }

        if (row.isFullyInsideContent) {
          coloredLine += `${colorStyle.ansiOpen}${cell.char}${colorStyle.ansiClose}`;
          continue;
        }

        coloredLine += `${ansiBlackFgOpen}${cell.char}${ansiFgClose}`;
      }
      return coloredLine;
    })
    .join("\n");
}

function applyAnsiColorToFullBlockContent(model: QrFullBlockRenderModel, colorScheme: ColorScheme): string {
  const colorStyle = resolveQrColorStyle(colorScheme);
  if (!colorStyle.ansiOpen) {
    return model.rows
      .map((row) => row.cells.map((cell) => (cell.dark ? "██" : "  ")).join(""))
      .join("\n");
  }

  return model.rows
    .map((row) => {
      if (!row.isContentRow) {
        return row.raw;
      }

      let coloredLine = "";
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        if (!cell) {
          continue;
        }

        if (!cell.isContentColumn) {
          coloredLine += cell.dark ? "██" : "  ";
          continue;
        }

        const moduleText = cell.dark ? "██" : "  ";
        coloredLine += `${colorStyle.ansiOpen}${moduleText}${colorStyle.ansiClose}`;
      }
      return coloredLine;
    })
    .join("\n");
}

/**
 * Render a QR code to a terminal-safe string.
 */
export function renderQrToString(value: string, options: RenderQrOptions = {}): string {
  const normalized = normalizeRenderQrOptions(options);
  if (normalized.outputMode === "fullblocks") {
    const model = renderQrFullBlockModel(value, normalized);
    return model.rows
      .map((row) => row.cells.map((cell) => (cell.dark ? "██" : "  ")).join(""))
      .join("\n");
  }

  const model = renderQrModel(value, options);
  return model.rows.map((row) => row.raw).join("\n");
}

/**
 * Render a QR code with ANSI styling for terminal adapters.
 */
export function renderQrToAnsiString(value: string, options: RenderQrOptions = {}): string {
  const normalized = normalizeRenderQrOptions(options);
  if (normalized.outputMode === "fullblocks") {
    const model = renderQrFullBlockModel(value, normalized);
    return applyAnsiColorToFullBlockContent(model, model.colorScheme);
  }

  const model = renderQrModel(value, options);
  return applyAnsiColorToQrContent(model, model.colorScheme);
}
