import qrcode from "qrcode-generator";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type EncodingMode = "Numeric" | "Alphanumeric" | "Byte" | "Kanji";
export type ColorScheme = "none" | "high-contrast";
export type OutputMode = "halfblocks" | "fullblocks";

export interface QrTerminalColorStyle {
  foreground?: "black";
  background?: "white";
  ansiOpen: string;
  ansiClose: string;
}

export interface QrRenderOptions {
  invert?: boolean;
  margin?: number;
  errorCorrectionLevel?: ErrorCorrectionLevel;
  qrVersion?: number;
  encodingMode?: EncodingMode;
  colorScheme?: ColorScheme;
  outputMode?: OutputMode;
}

export interface NormalizedQrRenderOptions {
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
  isDataColumn: boolean;
}

export interface QrHalfBlockRow {
  raw: string;
  cells: QrHalfBlockCell[];
  topY: number;
  bottomY: number;
  intersectsContentArea: boolean;
  isFullyInsideContentArea: boolean;
  isUpperQuietZoneBoundaryRow: boolean;
  isLowerQuietZoneBoundaryRow: boolean;
}

export interface QrHalfBlockRenderModel {
  margin: number;
  moduleCount: number;
  totalModuleWidth: number;
  colorScheme: ColorScheme;
  rows: QrHalfBlockRow[];
}

export interface QrFullBlockCell {
  char: " " | "█";
  dark: boolean;
  isDataColumn: boolean;
}

export interface QrFullBlockRow {
  raw: string;
  cells: QrFullBlockCell[];
  y: number;
  isDataRow: boolean;
}

export interface QrFullBlockRenderModel {
  margin: number;
  moduleCount: number;
  totalModuleWidth: number;
  colorScheme: ColorScheme;
  rows: QrFullBlockRow[];
}

export function resolveQrTerminalColorStyle(colorScheme: ColorScheme = "none"): QrTerminalColorStyle {
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
  moduleCount: number;
  totalModuleWidth: number;
  colorScheme: ColorScheme;
  isDarkAt: (y: number, x: number) => boolean;
}

export function normalizeRenderQrOptions(options: QrRenderOptions = {}): NormalizedQrRenderOptions {
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

function createQrModuleGrid(content: string, options: QrRenderOptions = {}): QrModuleGrid {
  if (!content.trim()) {
    throw new Error("A non-empty value is required.");
  }

  const normalized = normalizeRenderQrOptions(options);
  const qr = qrcode(
    normalized.qrVersion as Parameters<typeof qrcode>[0],
    normalized.errorCorrectionLevel
  );
  qr.addData(content, normalized.encodingMode);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const totalModuleWidth = moduleCount + normalized.margin * 2;

  const isDarkAt = (y: number, x: number): boolean => {
    const srcX = x - normalized.margin;
    const srcY = y - normalized.margin;
    const inside = srcY >= 0 && srcY < moduleCount && srcX >= 0 && srcX < moduleCount;
    if (!inside) {
      return normalized.invert;
    }

    const dark = qr.isDark(srcY, srcX);
    return normalized.invert ? !dark : dark;
  };

  return {
    margin: normalized.margin,
    moduleCount,
    totalModuleWidth,
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

export function renderQrHalfBlockModel(content: string, options: QrRenderOptions = {}): QrHalfBlockRenderModel {
  const grid = createQrModuleGrid(content, options);
  const maxDataY = grid.margin + grid.moduleCount;
  const rows: QrHalfBlockRow[] = [];

  for (let y = 0; y < grid.totalModuleWidth; y += 2) {
    const topY = y;
    const bottomY = topY + 1;
    const intersectsContentArea =
      (topY >= grid.margin && topY < maxDataY) ||
      (bottomY >= grid.margin && bottomY < maxDataY);
    const isFullyInsideContentArea =
      topY >= grid.margin &&
      topY < maxDataY &&
      bottomY >= grid.margin &&
      bottomY < maxDataY;
    const isUpperQuietZoneBoundaryRow =
      topY < grid.margin && bottomY >= grid.margin && bottomY < maxDataY;
    const isLowerQuietZoneBoundaryRow =
      topY >= grid.margin && topY < maxDataY && bottomY >= maxDataY;

    let raw = "";
    const cells: QrHalfBlockCell[] = [];

    for (let x = 0; x < grid.totalModuleWidth; x += 1) {
      const topDark = grid.isDarkAt(topY, x);
      const bottomDark = grid.isDarkAt(bottomY, x);
      const char = toHalfBlock(topDark, bottomDark);

      raw += char;
      cells.push({
        char,
        topDark,
        bottomDark,
        isDataColumn: x >= grid.margin && x < maxDataY
      });
    }

    rows.push({
      raw,
      cells,
      topY,
      bottomY,
      intersectsContentArea,
      isFullyInsideContentArea,
      isUpperQuietZoneBoundaryRow,
      isLowerQuietZoneBoundaryRow
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
    moduleCount: grid.moduleCount,
    totalModuleWidth: grid.totalModuleWidth,
    colorScheme: grid.colorScheme,
    rows
  };
}

export function renderQrFullBlockModel(content: string, options: QrRenderOptions = {}): QrFullBlockRenderModel {
  const grid = createQrModuleGrid(content, options);
  const maxDataY = grid.margin + grid.moduleCount;
  const rows: QrFullBlockRow[] = [];

  for (let y = 0; y < grid.totalModuleWidth; y += 1) {
    const isDataRow = y >= grid.margin && y < maxDataY;
    let raw = "";
    const cells: QrFullBlockCell[] = [];

    for (let x = 0; x < grid.totalModuleWidth; x += 1) {
      const dark = grid.isDarkAt(y, x);
      const char: " " | "█" = dark ? "█" : " ";
      raw += char;
      cells.push({
        char,
        dark,
        isDataColumn: x >= grid.margin && x < maxDataY
      });
    }

    rows.push({
      raw,
      cells,
      y,
      isDataRow
    });
  }

  return {
    margin: grid.margin,
    moduleCount: grid.moduleCount,
    totalModuleWidth: grid.totalModuleWidth,
    colorScheme: grid.colorScheme,
    rows
  };
}

function applyAnsiColorToQrContent(model: QrHalfBlockRenderModel, colorScheme: ColorScheme): string {
  const colorStyle = resolveQrTerminalColorStyle(colorScheme);
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
      if (!row.intersectsContentArea) {
        return row.raw;
      }

      let coloredLine = "";
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        if (!cell) {
          continue;
        }

        if (!cell.isDataColumn) {
          coloredLine += cell.char;
          continue;
        }

        if (row.isUpperQuietZoneBoundaryRow) {
          const fg = cell.bottomDark ? ansiBlackFgOpen : ansiWhiteFgOpen;
          coloredLine += `${fg}▄${ansiFgClose}`;
          continue;
        }

        if (row.isLowerQuietZoneBoundaryRow) {
          const fg = cell.topDark ? ansiBlackFgOpen : ansiWhiteFgOpen;
          coloredLine += `${fg}▀${ansiFgClose}`;
          continue;
        }

        if (row.isFullyInsideContentArea) {
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
  const colorStyle = resolveQrTerminalColorStyle(colorScheme);
  if (!colorStyle.ansiOpen) {
    return model.rows
      .map((row) => row.cells.map((cell) => (cell.dark ? "██" : "  ")).join(""))
      .join("\n");
  }

  return model.rows
    .map((row) => {
      if (!row.isDataRow) {
        return row.raw;
      }

      let coloredLine = "";
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        if (!cell) {
          continue;
        }

        if (!cell.isDataColumn) {
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

export function renderQrText(content: string, options: QrRenderOptions = {}): string {
  const normalized = normalizeRenderQrOptions(options);
  if (normalized.outputMode === "fullblocks") {
    const model = renderQrFullBlockModel(content, normalized);
    return model.rows
      .map((row) => row.cells.map((cell) => (cell.dark ? "██" : "  ")).join(""))
      .join("\n");
  }

  const model = renderQrHalfBlockModel(content, options);
  return model.rows.map((row) => row.raw).join("\n");
}

export function renderQrAnsi(content: string, options: QrRenderOptions = {}): string {
  const normalized = normalizeRenderQrOptions(options);
  if (normalized.outputMode === "fullblocks") {
    const model = renderQrFullBlockModel(content, normalized);
    return applyAnsiColorToFullBlockContent(model, model.colorScheme);
  }

  const model = renderQrHalfBlockModel(content, options);
  return applyAnsiColorToQrContent(model, model.colorScheme);
}
