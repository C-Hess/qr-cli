import React from "react";
import { Text, type TextProps } from "ink";
import {
  renderQrFullBlockModel,
  renderQrModel,
  resolveQrColorStyle,
  type RenderQrOptions
} from "@qrcl/core";

type InkColor = NonNullable<TextProps["color"]>;

export interface QrCodeProps {
  value: string;
  options?: RenderQrOptions;
  darkColor?: InkColor;
  lightColor?: InkColor;
}

export function QrCode({
  value,
  options,
  darkColor,
  lightColor
}: QrCodeProps): React.JSX.Element {
  if (!value.trim()) {
    return <Text color="red">QR value is required.</Text>;
  }

  if (options?.outputMode === "fullblocks") {
    const model = renderQrFullBlockModel(value, options);
    const colorStyle = resolveQrColorStyle(options?.colorScheme ?? "none");
    const resolvedLightColor = lightColor ?? colorStyle.background;
    const resolvedDarkColor = darkColor ?? colorStyle.foreground ?? (resolvedLightColor ? "black" : undefined);

    if (!resolvedLightColor && !resolvedDarkColor) {
      return <Text>{model.rows.map((row) => row.raw).join("\n")}</Text>;
    }

    return (
      <>
        {model.rows.map((row, index) => {
          if (!row.isContentRow) {
            return <Text key={`line-${index}`}>{row.cells.map((cell) => (cell.dark ? "██" : "  ")).join("")}</Text>;
          }

          const left = row.cells
            .slice(0, model.margin)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");
          const middle = row.cells
            .slice(model.margin, model.margin + model.size)
            .map((cell) => (cell.dark ? "██" : "  "))
            .join("");
          const right = row.cells
            .slice(model.margin + model.size)
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

  const model = renderQrModel(value, options);
  const colorStyle = resolveQrColorStyle(options?.colorScheme ?? "none");
  const resolvedLightColor = lightColor ?? colorStyle.background;
  const resolvedDarkColor = darkColor ?? colorStyle.foreground ?? (resolvedLightColor ? "black" : undefined);

  if (!resolvedLightColor && !resolvedDarkColor) {
    return <Text>{model.rows.map((row) => row.raw).join("\n")}</Text>;
  }

  return (
    <>
      {model.rows.map((row, index) => {
        if (!row.touchesContent) {
          return <Text key={`line-${index}`}>{row.raw}</Text>;
        }

        const left = row.cells
          .slice(0, model.margin)
          .map((cell) => cell.char)
          .join("");
        const middle = row.cells
          .slice(model.margin, model.margin + model.size)
          .map((cell) => cell.char)
          .join("");
        const right = row.cells
          .slice(model.margin + model.size)
          .map((cell) => cell.char)
          .join("");

        if (row.isUpperBoundaryRow || row.isLowerBoundaryRow) {
          return (
            <Text key={`line-${index}`}>
              {left}
              {row.cells
                .filter((cell) => cell.isContentColumn)
                .map((cell, charIndex) => {
                  if (row.isUpperBoundaryRow) {
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
              backgroundColor={row.isFullyInsideContent ? resolvedLightColor : undefined}
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
