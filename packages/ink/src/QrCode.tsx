import React from "react";
import { Text, type TextProps } from "ink";
import {
  renderQrFullBlockModel,
  renderQrHalfBlockModel,
  resolveQrTerminalColorStyle,
  type QrRenderOptions
} from "@qrcl/renderer";

type InkColor = NonNullable<TextProps["color"]>;

export interface QrCodeProps {
  content: string;
  renderOptions?: QrRenderOptions;
  darkModuleColor?: InkColor;
  lightModuleColor?: InkColor;
}

export function QrCode({
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
    const colorStyle = resolveQrTerminalColorStyle(renderOptions?.colorScheme ?? "none");
    const resolvedLightColor = lightModuleColor ?? colorStyle.background;
    const resolvedDarkColor =
      darkModuleColor ?? colorStyle.foreground ?? (resolvedLightColor ? "black" : undefined);

    if (!resolvedLightColor && !resolvedDarkColor) {
      return <Text>{model.rows.map((row) => row.raw).join("\n")}</Text>;
    }

    return (
      <>
        {model.rows.map((row, index) => {
          if (!row.isDataRow) {
            return <Text key={`line-${index}`}>{row.cells.map((cell) => (cell.dark ? "██" : "  ")).join("")}</Text>;
          }

          const left = row.cells
            .slice(0, model.margin)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");
          const middle = row.cells
            .slice(model.margin, model.margin + model.moduleCount)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");
          const right = row.cells
            .slice(model.margin + model.moduleCount)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");

          return (
            <Text key={`line-${index}`}>
              {left}
              <Text color={resolvedDarkColor} backgroundColor={resolvedLightColor}>
                {middle}
              </Text>
              {right}
            </Text>
          );
        })}
      </>
    );
  }

  const model = renderQrHalfBlockModel(content, renderOptions);
  const colorStyle = resolveQrTerminalColorStyle(renderOptions?.colorScheme ?? "none");
  const resolvedLightColor = lightModuleColor ?? colorStyle.background;
  const resolvedDarkColor =
    darkModuleColor ?? colorStyle.foreground ?? (resolvedLightColor ? "black" : undefined);

  if (!resolvedLightColor && !resolvedDarkColor) {
    return <Text>{model.rows.map((row) => row.raw).join("\n")}</Text>;
  }

  return (
    <>
      {model.rows.map((row, index) => {
        if (!row.intersectsContentArea) {
          return <Text key={`line-${index}`}>{row.raw}</Text>;
        }

        const left = row.cells
          .slice(0, model.margin)
          .map((cell) => cell.char)
          .join("");
        const middle = row.cells
          .slice(model.margin, model.margin + model.moduleCount)
          .map((cell) => cell.char)
          .join("");
        const right = row.cells
          .slice(model.margin + model.moduleCount)
          .map((cell) => cell.char)
          .join("");

        if (row.isUpperQuietZoneBoundaryRow || row.isLowerQuietZoneBoundaryRow) {
          return (
            <Text key={`line-${index}`}>
              {left}
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
              {right}
            </Text>
          );
        }

        return (
          <Text key={`line-${index}`}>
            {left}
            <Text
              color={resolvedDarkColor}
              backgroundColor={row.isFullyInsideContentArea ? resolvedLightColor : undefined}
            >
              {middle}
            </Text>
            {right}
          </Text>
        );
      })}
    </>
  );
}
