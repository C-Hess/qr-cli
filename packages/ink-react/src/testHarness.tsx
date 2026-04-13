import React from "react";
import { render } from "ink-testing-library";

export interface InkRenderResult {
  lastFrame: () => string | undefined;
  cleanup: () => void;
  frames: string[];
}

export function renderInk(ui: React.JSX.Element): InkRenderResult {
  const rendered = render(ui);
  return {
    lastFrame: rendered.lastFrame,
    cleanup: rendered.unmount,
    frames: rendered.frames
  };
}
