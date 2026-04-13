import React from "react";
import { describe, expect, it, vi } from "vitest";
import { QrCode } from "./QrCode.js";
import { renderInk } from "./testHarness.js";

vi.mock("@qrcl/core", () => ({
  renderQrModel: vi.fn(() => ({
    margin: 1,
    size: 2,
    width: 4,
    colorScheme: "none",
    rows: [
      {
        raw: "    ",
        cells: [
          { char: " ", topDark: false, bottomDark: false, isContentColumn: false },
          { char: " ", topDark: false, bottomDark: false, isContentColumn: true },
          { char: " ", topDark: false, bottomDark: false, isContentColumn: true },
          { char: " ", topDark: false, bottomDark: false, isContentColumn: false }
        ],
        topY: 0,
        bottomY: 1,
        touchesContent: false,
        isFullyInsideContent: false,
        isUpperBoundaryRow: false,
        isLowerBoundaryRow: false
      },
      {
        raw: " ▀▄ ",
        cells: [
          { char: " ", topDark: false, bottomDark: false, isContentColumn: false },
          { char: "▀", topDark: true, bottomDark: false, isContentColumn: true },
          { char: "▄", topDark: false, bottomDark: true, isContentColumn: true },
          { char: " ", topDark: false, bottomDark: false, isContentColumn: false }
        ],
        topY: 2,
        bottomY: 3,
        touchesContent: true,
        isFullyInsideContent: true,
        isUpperBoundaryRow: false,
        isLowerBoundaryRow: false
      }
    ]
  })),
  renderQrFullBlockModel: vi.fn(() => ({
    margin: 1,
    size: 2,
    width: 4,
    colorScheme: "none",
    rows: [
      {
        raw: "    ",
        cells: [
          { char: " ", dark: false, isContentColumn: false },
          { char: " ", dark: false, isContentColumn: true },
          { char: " ", dark: false, isContentColumn: true },
          { char: " ", dark: false, isContentColumn: false }
        ],
        y: 0,
        isContentRow: false
      },
      {
        raw: " ██ ",
        cells: [
          { char: " ", dark: false, isContentColumn: false },
          { char: "█", dark: true, isContentColumn: true },
          { char: "█", dark: true, isContentColumn: true },
          { char: " ", dark: false, isContentColumn: false }
        ],
        y: 1,
        isContentRow: true
      }
    ]
  })),
  resolveQrColorStyle: vi.fn(() => ({ ansiOpen: "", ansiClose: "" }))
}));

describe("QrCode", () => {
  it("renders validation text for blank values", () => {
    const app = renderInk(<QrCode value="   " />);
    expect(app.lastFrame()).toContain("QR value is required");
    app.cleanup();
  });

  it("renders halfblock output", () => {
    const app = renderInk(<QrCode value="ok" />);
    const frame = app.lastFrame() ?? "";
    expect(frame).toContain("▀");
    expect(frame).toContain("▄");
    app.cleanup();
  });

  it("renders fullblock output", () => {
    const app = renderInk(<QrCode value="ok" options={{ outputMode: "fullblocks" }} />);
    const frame = app.lastFrame() ?? "";
    expect(frame).toContain("██");
    app.cleanup();
  });

  it("accepts custom colors", () => {
    const app = renderInk(
      <QrCode
        value="ok"
        darkColor="green"
        lightColor="white"
        options={{ outputMode: "halfblocks" }}
      />
    );

    expect(app.lastFrame()).toBeTruthy();
    app.cleanup();
  });
});
