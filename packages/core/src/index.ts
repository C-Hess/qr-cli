export interface RenderQrOptions {
  invert?: boolean;
  margin?: number;
}

/**
 * Render a QR code to a terminal-safe string.
 *
 * TODO: implement QR encoding and terminal rasterization.
 */
export function renderQrToString(value: string, _options: RenderQrOptions = {}): string {
  if (!value) {
    throw new Error("A non-empty value is required.");
  }

  return `QR renderer not implemented yet for: ${value}`;
}
