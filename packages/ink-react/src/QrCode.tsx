import React from "react";
import { Text, type TextProps } from "ink";
import { renderQrToString, resolveQrColorStyle, type RenderQrOptions } from "@qrcl/core";

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

  const output = renderQrToString(value, options);
  const colorStyle = resolveQrColorStyle(options?.colorScheme ?? "none");
  const resolvedLightColor = lightColor ?? colorStyle.background;
  const resolvedDarkColor = darkColor ?? colorStyle.foreground ?? (resolvedLightColor ? "black" : undefined);

  if (!resolvedLightColor && !resolvedDarkColor) {
    return <Text>{output}</Text>;
  }

  const margin = options?.margin ?? 2;
  const lines = output.split("\n");
  const width = lines[0]?.length ?? 0;
  const size = Math.max(0, width - margin * 2);
  const maxY = margin + size;

  return (
    <>
      {lines.map((line, index) => {
        const topY = index * 2;
        const bottomY = topY + 1;
        const rowTouchesContent =
          (topY >= margin && topY < maxY) || (bottomY >= margin && bottomY < maxY);
        const rowFullyInsideContent =
          topY >= margin && topY < maxY && bottomY >= margin && bottomY < maxY;
        const isUpperBoundaryRow = topY < margin && bottomY >= margin && bottomY < maxY;
        const isLowerBoundaryRow = topY >= margin && topY < maxY && bottomY >= maxY;

        if (!rowTouchesContent) {
          return <Text key={`line-${index}`}>{line}</Text>;
        }

        const left = line.slice(0, margin);
        const middle = line.slice(margin, margin + size);
        const right = line.slice(margin + size);

        const isTopFilled = (char: string): boolean => char === "▀" || char === "█";
        const isBottomFilled = (char: string): boolean => char === "▄" || char === "█";

        if (isUpperBoundaryRow || isLowerBoundaryRow) {
          return (
            <Text key={`line-${index}`}>
              {left}
              {middle.split("").map((char, charIndex) => {
                if (isUpperBoundaryRow) {
                  const dark = isBottomFilled(char);
                  return (
                    <Text key={`c-${index}-${charIndex}`} color={dark ? resolvedDarkColor : resolvedLightColor}>
                      ▄
                    </Text>
                  );
                }

                const dark = isTopFilled(char);
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
              backgroundColor={rowFullyInsideContent ? resolvedLightColor : undefined}
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
