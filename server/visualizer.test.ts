import { describe, expect, it } from "vitest";
import { buildWrapPrompt, parseImageDataUrl } from "./routers/visualizer";

describe("visualizer image validation", () => {
  it("accepts a JPEG data URL with matching content signature", () => {
    const result = parseImageDataUrl("data:image/jpeg;base64,/9j/AA==");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.bytes[0]).toBe(0xff);
  });

  it("rejects unsupported and mismatched image data", () => {
    expect(() => parseImageDataUrl("data:image/gif;base64,R0lGODlh" )).toThrow(/valid JPEG, PNG, or WebP/);
    expect(() => parseImageDataUrl("data:image/png;base64,/9j/AA==")).toThrow(/does not match/);
  });
});

describe("wrap prompt builder", () => {
  it("asks the model to preserve the vehicle and apply the selected finish", () => {
    const prompt = buildWrapPrompt("evergreen", "matte", "subtle black roof");
    expect(prompt).toContain("matte deep British racing green");
    expect(prompt).toContain("Preserve the same exact vehicle identity");
    expect(prompt).toContain("subtle black roof");
  });
});
