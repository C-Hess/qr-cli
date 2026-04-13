import React from "react";
import { Box, Text, type TextProps } from "ink";
import {
  renderQrFullBlockModel,
  renderQrHalfBlockModel,
  type QrRenderOptions
} from "@qr-cli/renderer";

type InkColor = NonNullable<TextProps["color"]>;

export interface QrCodeProps {
  content: string;
  renderOptions?: QrRenderOptions;
  darkModuleColor?: InkColor;
  lightModuleColor?: InkColor;
}

interface QrRenderErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
}

interface QrRenderErrorBoundaryState {
  errorMessage?: string;
}

class QrRenderErrorBoundary extends React.Component<QrRenderErrorBoundaryProps, QrRenderErrorBoundaryState> {
  public constructor(props: QrRenderErrorBoundaryProps) {
    super(props);
    this.state = {};
  }

  public static getDerivedStateFromError(error: unknown): QrRenderErrorBoundaryState {
    const message = error instanceof Error ? error.message : String(error);
    return { errorMessage: message };
  }

  public componentDidUpdate(prevProps: QrRenderErrorBoundaryProps): void {
    if (this.state.errorMessage && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ errorMessage: undefined });
    }
  }

  public render(): React.JSX.Element {
    if (this.state.errorMessage) {
      return <Text color="red">QR render error: {this.state.errorMessage}</Text>;
    }

    return <>{this.props.children}</>;
  }
}

function QrCodeContent({
  content,
  renderOptions,
  darkModuleColor,
  lightModuleColor
}: QrCodeProps): React.JSX.Element {
  if (!content.trim()) {
    return <Text color="red">QR value is required.</Text>;
  }

  if (renderOptions?.outputMode === "fullblocks") {
    const model = renderQrFullBlockModel(content, renderOptions);
    const resolvedLightColor = lightModuleColor;
    const resolvedDarkColor = darkModuleColor ?? (resolvedLightColor ? "black" : undefined);

    if (!resolvedLightColor && !resolvedDarkColor) {
      return (
        <Text>
          {model.rows
            .map((row) => row.cells.map((cell) => (cell.dark ? "██" : "  ")).join(""))
            .join("\n")}
        </Text>
      );
    }

    return (
      <Box flexDirection="column">
        {model.rows.map((row, index) => {
          const colorableWidth = model.totalModuleWidth - model.margin * 2;
          if (!row.isDataRow) {
            return (
              <Box key={`line-${index}`} flexDirection="row">
                <Text>{row.cells.map((cell) => (cell.dark ? "██" : "  ")).join("")}</Text>
              </Box>
            );
          }

          const left = row.cells
            .slice(0, model.margin)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");
          const middle = row.cells
            .slice(model.margin, model.margin + colorableWidth)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");
          const right = row.cells
            .slice(model.margin + colorableWidth)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");

          return (
            <Box key={`line-${index}`} flexDirection="row">
              <Text>{left}</Text>
              <Text color={resolvedDarkColor} backgroundColor={resolvedLightColor}>
                {middle}
              </Text>
              <Text>{right}</Text>
            </Box>
          );
        })}
      </Box>
    );
  }

  const model = renderQrHalfBlockModel(content, renderOptions);
  const resolvedLightColor = lightModuleColor;
  const resolvedDarkColor = darkModuleColor ?? (resolvedLightColor ? "black" : undefined);

  if (!resolvedLightColor && !resolvedDarkColor) {
    return <Text>{model.rows.map((row) => row.raw).join("\n")}</Text>;
  }

  return (
    <Box flexDirection="column">
      {model.rows.map((row, index) => {
        const colorableWidth = model.totalModuleWidth - model.margin * 2;
        if (!row.intersectsContentArea) {
          return (
            <Box key={`line-${index}`} flexDirection="row">
              <Text>{row.raw}</Text>
            </Box>
          );
        }

        const left = row.cells
          .slice(0, model.margin)
          .map((cell) => cell.char)
          .join("");
        const middle = row.cells
          .slice(model.margin, model.margin + colorableWidth)
          .map((cell) => cell.char)
          .join("");
        const right = row.cells
          .slice(model.margin + colorableWidth)
          .map((cell) => cell.char)
          .join("");

        if (row.isUpperQuietZoneBoundaryRow || row.isLowerQuietZoneBoundaryRow) {
          return (
            <Box key={`line-${index}`} flexDirection="row">
              <Text>{left}</Text>
              {row.cells
                .filter((cell) => cell.isDataColumn)
                .map((cell, charIndex) => {
                  if (row.isUpperQuietZoneBoundaryRow) {
                    const dark = cell.bottomDark;
                    return (
                      <Text key={`c-${index}-${charIndex}`} color={dark ? resolvedDarkColor : resolvedLightColor}>
                        ▄
                      </Text>
                    );
                  }

                  const dark = cell.topDark;
                  return (
                    <Text key={`c-${index}-${charIndex}`} color={dark ? resolvedDarkColor : resolvedLightColor}>
                      ▀
                    </Text>
                  );
                })}
              <Text>{right}</Text>
            </Box>
          );
        }

        return (
          <Box key={`line-${index}`} flexDirection="row">
            <Text>{left}</Text>
            <Text
              color={resolvedDarkColor}
              backgroundColor={row.isFullyInsideContentArea ? resolvedLightColor : undefined}
            >
              {middle}
            </Text>
            <Text>{right}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

export function QrCode(props: QrCodeProps): React.JSX.Element {
  const resetKey = JSON.stringify({
    content: props.content,
    renderOptions: props.renderOptions,
    darkModuleColor: props.darkModuleColor,
    lightModuleColor: props.lightModuleColor
  });

  return (
    <QrRenderErrorBoundary resetKey={resetKey}>
      <QrCodeContent {...props} />
    </QrRenderErrorBoundary>
  );
}
