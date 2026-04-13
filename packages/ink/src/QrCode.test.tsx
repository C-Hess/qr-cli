import React from "react";
import { describe, expect, it, vi } from "vitest";
import { QrCode } from "./QrCode.js";
import { renderInk } from "./testHarness.js";

vi.mock("@qrcl/renderer", () => ({
  renderQrHalfBlockModel: vi.fn(() => ({
    margin: 1,
    moduleCount: 2,
    totalModuleWidth: 4,
    colorScheme: "none",
    rows: [
      {
        raw: "    ",
        cells: [
          { char: " ", topDark: false, bottomDark: false, isDataColumn: false },
          { char: " ", topDark: false, bottomDark: false, isDataColumn: true },
          { char: " ", topDark: false, bottomDark: false, isDataColumn: true },
          { char: " ", topDark: false, bottomDark: false, isDataColumn: false }
        ],
        topY: 0,
        bottomY: 1,
        intersectsContentArea: false,
        isFullyInsideContentArea: false,
        isUpperQuietZoneBoundaryRow: false,
        isLowerQuietZoneBoundaryRow: false
      },
      {
        raw: " ▀▄ ",
        cells: [
          { char: " ", topDark: false, bottomDark: false, isDataColumn: false },
          { char: "▀", topDark: true, bottomDark: false, isDataColumn: true },
          { char: "▄", topDark: false, bottomDark: true, isDataColumn: true },
          { char: " ", topDark: false, bottomDark: false, isDataColumn: false }
        ],
        topY: 2,
        bottomY: 3,
        intersectsContentArea: true,
        isFullyInsideContentArea: true,
        isUpperQuietZoneBoundaryRow: false,
        isLowerQuietZoneBoundaryRow: false
      }
    ]
  })),
  renderQrFullBlockModel: vi.fn(() => ({
    margin: 1,
    moduleCount: 2,
    totalModuleWidth: 4,
    colorScheme: "none",
    rows: [
      {
        raw: "    ",
        cells: [
          { char: " ", dark: false, isDataColumn: false },
          { char: " ", dark: false, isDataColumn: true },
          { char: " ", dark: false, isDataColumn: true },
          { char: " ", dark: false, isDataColumn: false }
        ],
        y: 0,
        isDataRow: false
      },
      {
        raw: " ██ ",
        cells: [
          { char: " ", dark: false, isDataColumn: false },
          { char: "█", dark: true, isDataColumn: true },
          { char: "█", dark: true, isDataColumn: true },
          { char: " ", dark: false, isDataColumn: false }
        ],
        y: 1,
        isDataRow: true
      }
    ]
  })),
  resolveQrTerminalColorStyle: vi.fn(() => ({ ansiOpen: "", ansiClose: "" }))
}));

describe("QrCode", () => {
  it("renders validation text for blank values", () => {
    const app = renderInk(<QrCode content="   " />);
    expect(app.lastFrame()).toContain("QR value is required");
    app.cleanup();
  });

  it("renders halfblock output", () => {
    const app = renderInk(<QrCode content="ok" />);
    const frame = app.lastFrame() ?? "";
    expect(frame).toContain("▀");
    expect(frame).toContain("▄");
    app.cleanup();
  });

  it("renders fullblock output", () => {
    const app = renderInk(<QrCode content="ok" renderOptions={{ outputMode: "fullblocks" }} />);
    const frame = app.lastFrame() ?? "";
    expect(frame).toContain("██");
    app.cleanup();
  });

  it("accepts custom colors", () => {
    const app = renderInk(
      <QrCode
        content="ok"
        darkModuleColor="green"
        lightModuleColor="white"
        renderOptions={{ outputMode: "halfblocks" }}
      />
    );

    expect(app.lastFrame()).toBeTruthy();
    app.cleanup();
  });
});
