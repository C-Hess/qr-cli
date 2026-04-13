import React from "react";
import { Text } from "ink";
import type { RenderQrOptions } from "@qrcl/core";

export interface QrCodeProps {
  value: string;
  options?: RenderQrOptions;
}

/**
 * Ink component wrapper for the core QR renderer.
 *
 * TODO: wire this to real matrix output from @qrcl/core once implemented.
 */
export function QrCode({ value }: QrCodeProps): React.JSX.Element {
  if (!value.trim()) {
    return <Text color="red">QR value is required.</Text>;
  }

  return <Text color="yellow">QR renderer not implemented yet for: {value}</Text>;
}
