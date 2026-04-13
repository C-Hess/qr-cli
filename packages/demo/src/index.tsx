import React, { useDeferredValue, useMemo, useState } from "react";
import { Box, Text, render, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { QrCode, type QrCodeProps } from "@qr-cli/ink";
import type { EncodingMode, ErrorCorrectionLevel, QrRenderOptions } from "@qr-cli/renderer";

const DEFAULT_CONTENT = "https://github.com/C-Hess/qr-cli";
const DEFAULT_CONTENT_BY_MODE: Record<EncodingMode, string> = {
  Numeric: "1234567890",
  Alphanumeric: "HELLO-QR-123",
  Byte: DEFAULT_CONTENT,
  Kanji: "東京"
};

const FIELD_ORDER = [
  "content",
  "outputMode",
  "margin",
  "padding",
  "errorCorrectionLevel",
  "encodingMode",
  "qrVersion",
  "darkModuleColor",
  "lightModuleColor"
] as const;

type FieldKey = (typeof FIELD_ORDER)[number];
type DemoColorOption = "none" | NonNullable<QrCodeProps["darkModuleColor"]>;

const OUTPUT_MODE_OPTIONS: QrRenderOptions["outputMode"][] = ["halfblocks", "fullblocks"];
const ERROR_CORRECTION_OPTIONS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const ENCODING_OPTIONS: EncodingMode[] = ["Numeric", "Alphanumeric", "Byte", "Kanji"];
const COLOR_OPTIONS: DemoColorOption[] = [
  "none",
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white"
];

const QrPreview = React.memo(function QrPreview({
  content,
  renderOptions,
  darkModuleColor,
  lightModuleColor
}: {
  content: string;
  renderOptions: QrRenderOptions;
  darkModuleColor?: QrCodeProps["darkModuleColor"];
  lightModuleColor?: QrCodeProps["lightModuleColor"];
}) {
  return (
    <QrCode
      content={content}
      renderOptions={renderOptions}
      darkModuleColor={darkModuleColor}
      lightModuleColor={lightModuleColor}
    />
  );
});

function rotateValue<T>(values: readonly T[], current: T, direction: -1 | 1, fallback: T): T {
  if (values.length === 0) {
    return fallback;
  }

  const currentIndex = values.indexOf(current);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + values.length) % values.length;
  return values[nextIndex] ?? fallback;
}

function DemoApp(): React.JSX.Element {
  const { exit } = useApp();
  const [selectedField, setSelectedField] = useState<FieldKey>("content");
  const [contentByMode, setContentByMode] = useState<Record<EncodingMode, string>>({
    ...DEFAULT_CONTENT_BY_MODE
  });
  const [editingContent, setEditingContent] = useState<boolean>(false);
  const [contentDraft, setContentDraft] = useState<string>("");
  const [darkModuleColor, setDarkModuleColor] = useState<DemoColorOption>("none");
  const [lightModuleColor, setLightModuleColor] = useState<DemoColorOption>("none");
  const [renderOptions, setRenderOptions] = useState<QrRenderOptions>({
    outputMode: "halfblocks",
    margin: 2,
    padding: 1,
    errorCorrectionLevel: "M",
    encodingMode: "Byte",
    qrVersion: 0
  });
  const activeEncodingMode = renderOptions.encodingMode ?? "Byte";
  const content = contentByMode[activeEncodingMode] ?? "";
  const deferredContentDraft = useDeferredValue(contentDraft);
  const previewContent = editingContent ? deferredContentDraft : content;

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (editingContent) {
      if (key.escape) {
        setEditingContent(false);
        return;
      }
      return;
    }

    if (input === "q") {
      exit();
      return;
    }

    if (input === "r") {
      const nextContent = DEFAULT_CONTENT_BY_MODE[activeEncodingMode];
      setContentByMode((current) => ({
        ...current,
        [activeEncodingMode]: nextContent
      }));
      return;
    }

    if (key.upArrow) {
      setSelectedField((current) => rotateValue(FIELD_ORDER, current, -1, "content"));
      return;
    }

    if (key.downArrow) {
      setSelectedField((current) => rotateValue(FIELD_ORDER, current, 1, "content"));
      return;
    }

    if (selectedField === "content" && key.return) {
      setContentDraft(content);
      setEditingContent(true);
      return;
    }

    if (!key.leftArrow && !key.rightArrow && !key.return) {
      return;
    }

    const direction: -1 | 1 = key.leftArrow ? -1 : 1;

    if (selectedField === "darkModuleColor") {
      setDarkModuleColor((current) => rotateValue(COLOR_OPTIONS, current, direction, "none"));
      return;
    }

    if (selectedField === "lightModuleColor") {
      setLightModuleColor((current) => rotateValue(COLOR_OPTIONS, current, direction, "none"));
      return;
    }

    if (selectedField === "encodingMode") {
      const nextMode = rotateValue(ENCODING_OPTIONS, renderOptions.encodingMode ?? "Byte", direction, "Byte");
      setRenderOptions((current) => ({
        ...current,
        encodingMode: nextMode
      }));
      return;
    }

    setRenderOptions((current) => {
      const next = { ...current };

      if (selectedField === "outputMode") {
        next.outputMode = rotateValue(
          OUTPUT_MODE_OPTIONS,
          current.outputMode ?? "halfblocks",
          direction,
          "halfblocks"
        );
        return next;
      }

      if (selectedField === "margin") {
        const margin = current.margin ?? 2;
        next.margin = Math.min(8, Math.max(0, margin + direction));
        return next;
      }

      if (selectedField === "padding") {
        const padding = current.padding ?? 1;
        next.padding = Math.min(8, Math.max(0, padding + direction));
        return next;
      }

      if (selectedField === "errorCorrectionLevel") {
        next.errorCorrectionLevel = rotateValue(
          ERROR_CORRECTION_OPTIONS,
          current.errorCorrectionLevel ?? "M",
          direction,
          "M"
        );
        return next;
      }

      if (selectedField === "qrVersion") {
        const version = current.qrVersion ?? 0;
        if (direction === -1) {
          next.qrVersion = version === 0 ? 40 : version - 1;
        } else {
          next.qrVersion = version === 40 ? 0 : version + 1;
        }
        return next;
      }

      return next;
    });
  });

  const fieldValues = useMemo(
    () => ({
      content: content || "(empty)",
      outputMode: renderOptions.outputMode ?? "halfblocks",
      margin: String(renderOptions.margin ?? 2),
      padding: String(renderOptions.padding ?? 1),
      errorCorrectionLevel: renderOptions.errorCorrectionLevel ?? "M",
      encodingMode: renderOptions.encodingMode ?? "Byte",
      qrVersion: renderOptions.qrVersion === 0 ? "auto" : String(renderOptions.qrVersion ?? 0),
      darkModuleColor,
      lightModuleColor
    }),
    [content, darkModuleColor, lightModuleColor, renderOptions]
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        qr-cli Ink live demo
      </Text>
      <Text>
        Use Up/Down to select a row. Use Left/Right to change values. Press Enter on content to edit that line.
      </Text>

      <Text color={editingContent ? "yellow" : undefined}>
        {editingContent
          ? "Editing content: Enter/Esc to finish."
          : "Shortcuts: q quit, r reset content."}
      </Text>

      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
        {FIELD_ORDER.map((field) => {
          const isSelected = field === selectedField;
          const isEditingRow = editingContent && field === "content";
          const value = fieldValues[field];
          const displayValue = field === "content" && typeof value === "string" && value.length > 64
            ? `${value.slice(0, 61)}...`
            : value;
          if (field === "content" && isEditingRow) {
            return (
              <Box key={field} flexDirection="row">
                <Text color="yellow">{isSelected ? "▶" : " "} content: </Text>
                <TextInput
                  value={contentDraft}
                  onChange={setContentDraft}
                  onSubmit={() => {
                    setContentByMode((current) => ({
                      ...current,
                      [activeEncodingMode]: contentDraft
                    }));
                    setEditingContent(false);
                  }}
                  focus
                />
              </Box>
            );
          }

          return (
            <Text key={field} color={isSelected ? "green" : undefined}>
              {isSelected ? "▶" : " "} {field}: {displayValue}
            </Text>
          );
        })}
      </Box>

      <QrPreview
        content={previewContent}
        renderOptions={renderOptions}
        darkModuleColor={darkModuleColor === "none" ? undefined : darkModuleColor}
        lightModuleColor={lightModuleColor === "none" ? undefined : lightModuleColor}
      />
    </Box>
  );
}

render(<DemoApp />);
