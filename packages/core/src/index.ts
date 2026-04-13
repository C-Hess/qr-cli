import qrcode from "qrcode-generator";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type EncodingMode = "Numeric" | "Alphanumeric" | "Byte" | "Kanji";
export type OutputMode = "halfblocks";
export type ColorScheme = "none" | "high-contrast";

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
  outputMode?: OutputMode;
  colorScheme?: ColorScheme;
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

function applyAnsiColorToQrContent(output: string, margin: number, colorScheme: ColorScheme): string {
  const colorStyle = resolveQrColorStyle(colorScheme);
  if (!colorStyle.ansiOpen) {
    return output;
  }

  const lines = output.split("\n");
  if (lines.length === 0) {
    return output;
  }

  const width = lines[0]?.length ?? 0;
  const size = Math.max(0, width - margin * 2);
  const maxY = margin + size;

  const ansiBlackFgOpen = "\u001b[30m";
  const ansiWhiteFgOpen = "\u001b[37m";
  const ansiFgClose = "\u001b[39m";

  const isTopFilled = (char: string): boolean => char === "▀" || char === "█";
  const isBottomFilled = (char: string): boolean => char === "▄" || char === "█";

  return lines
    .map((line, lineIndex) => {
      const topY = lineIndex * 2;
      const bottomY = topY + 1;
      const rowTouchesContent =
        (topY >= margin && topY < maxY) || (bottomY >= margin && bottomY < maxY);
      const rowFullyInsideContent =
        topY >= margin && topY < maxY && bottomY >= margin && bottomY < maxY;
      const isUpperBoundaryRow = topY < margin && bottomY >= margin && bottomY < maxY;
      const isLowerBoundaryRow = topY >= margin && topY < maxY && bottomY >= maxY;

      if (!rowTouchesContent) {
        return line;
      }

      if (isUpperBoundaryRow || isLowerBoundaryRow) {
        let boundaryLine = "";
        for (let x = 0; x < line.length; x += 1) {
          const char = line[x] ?? " ";
          const inContentColumn = x >= margin && x < maxY;
          if (!inContentColumn) {
            boundaryLine += char;
            continue;
          }

          if (isUpperBoundaryRow) {
            const dark = isBottomFilled(char);
            const fg = dark ? ansiBlackFgOpen : ansiWhiteFgOpen;
            boundaryLine += `${fg}▄${ansiFgClose}`;
          } else {
            const dark = isTopFilled(char);
            const fg = dark ? ansiBlackFgOpen : ansiWhiteFgOpen;
            boundaryLine += `${fg}▀${ansiFgClose}`;
          }
        }
        return boundaryLine;
      }

      let coloredLine = "";
      for (let x = 0; x < line.length; x += 1) {
        const char = line[x] ?? "";
        const inContentColumn = x >= margin && x < maxY;
        if (inContentColumn) {
          if (rowFullyInsideContent) {
            coloredLine += `${colorStyle.ansiOpen}${char}${colorStyle.ansiClose}`;
          } else {
            coloredLine += `${ansiBlackFgOpen}${char}${ansiFgClose}`;
          }
        } else {
          coloredLine += char;
        }
      }
      return coloredLine;
    })
    .join("\n");
}

function renderQrMonochrome(value: string, options: RenderQrOptions = {}): { output: string; margin: number } {
  if (!value.trim()) {
    throw new Error("A non-empty value is required.");
  }

  const margin = options.margin ?? 2;
  if (margin < 0 || !Number.isInteger(margin)) {
    throw new Error("margin must be a non-negative integer.");
  }

  const errorCorrectionLevel = options.errorCorrectionLevel ?? "M";
  const validErrorCorrectionLevels: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
  if (!validErrorCorrectionLevels.includes(errorCorrectionLevel)) {
    throw new Error("errorCorrectionLevel must be one of L, M, Q, H.");
  }

  const qrVersion = options.qrVersion ?? 0;
  if (!Number.isInteger(qrVersion) || qrVersion < 0 || qrVersion > 40) {
    throw new Error("qrVersion must be an integer between 0 and 40.");
  }

  const encodingMode = options.encodingMode ?? "Byte";
  const validEncodingModes: EncodingMode[] = ["Numeric", "Alphanumeric", "Byte", "Kanji"];
  if (!validEncodingModes.includes(encodingMode)) {
    throw new Error("encodingMode must be one of Numeric, Alphanumeric, Byte, Kanji.");
  }

  const outputMode = options.outputMode ?? "halfblocks";
  if (outputMode !== "halfblocks") {
    throw new Error("outputMode currently only supports halfblocks.");
  }

  const colorScheme = options.colorScheme ?? "none";
  if (colorScheme !== "none" && colorScheme !== "high-contrast") {
    throw new Error("colorScheme must be one of none, high-contrast.");
  }

  const qr = qrcode(qrVersion as Parameters<typeof qrcode>[0], errorCorrectionLevel);
  qr.addData(value, encodingMode);
  qr.make();

  const size = qr.getModuleCount();
  const width = size + margin * 2;
  const matrix: boolean[][] = Array.from({ length: width }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const srcX = x - margin;
      const srcY = y - margin;
      if (srcX < 0 || srcY < 0 || srcX >= size || srcY >= size) {
        return false;
      }

      return qr.isDark(srcY, srcX);
    })
  );

  const isDark = (y: number, x: number): boolean => {
    const row = matrix[y];
    if (!row) {
      return false;
    }
    return row[x] ?? false;
  };

  const invert = options.invert ?? false;
  const lines: string[] = [];
  for (let y = 0; y < width; y += 2) {
    let line = "";
    for (let x = 0; x < width; x += 1) {
      const top = invert ? !isDark(y, x) : isDark(y, x);
      const bottom = invert ? !isDark(y + 1, x) : isDark(y + 1, x);

      if (top && bottom) {
        line += "█";
      } else if (top) {
        line += "▀";
      } else if (bottom) {
        line += "▄";
      } else {
        line += " ";
      }
    }
    lines.push(line);
  }

  if (lines.length > 0 && margin > 0) {
    const lastLine = lines[lines.length - 1] ?? "";
    if (/^\s*$/.test(lastLine)) {
      lines.pop();
    }
  }

  return {
    output: lines.join("\n"),
    margin
  };
}

/**
 * Render a QR code to a terminal-safe string.
 */
export function renderQrToString(value: string, options: RenderQrOptions = {}): string {
  return renderQrMonochrome(value, options).output;
}

/**
 * Render a QR code with ANSI styling for terminal adapters.
 */
export function renderQrToAnsiString(value: string, options: RenderQrOptions = {}): string {
  const { output, margin } = renderQrMonochrome(value, options);
  const colorScheme = options.colorScheme ?? "none";
  return applyAnsiColorToQrContent(output, margin, colorScheme);
}
