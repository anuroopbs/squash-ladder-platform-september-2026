import { describe, it, expect } from "vitest";
import { isChunkLoadError } from "./isChunkLoadError";

describe("isChunkLoadError", () => {
  it("detects ChunkLoadError by name", () => {
    const err = new Error("some message");
    err.name = "ChunkLoadError";
    expect(isChunkLoadError(err)).toBe(true);
  });

  it("detects 'Loading chunk N failed' messages", () => {
    expect(isChunkLoadError(new Error("Loading chunk 185 failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Loading chunk 7 failed"))).toBe(true);
  });

  it("detects dynamic import failures", () => {
    expect(
      isChunkLoadError(new Error("Failed to fetch dynamically imported module: /foo.js"))
    ).toBe(true);
  });

  it("does not flag an unrelated error", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });
});
