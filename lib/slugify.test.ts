import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Dublin Squash Open")).toBe("dublin-squash-open");
  });

  it("strips special characters", () => {
    expect(slugify("Gamepoint HITEC (95f45bb0)")).toBe("gamepoint-hitec-95f45bb0");
  });

  it("collapses multiple spaces/hyphens into one", () => {
    expect(slugify("Delhi   Gymkhana --- Club")).toBe("delhi-gymkhana-club");
  });

  it("trims leading/trailing whitespace", () => {
    expect(slugify("  Mount Pleasant  ")).toBe("mount-pleasant");
  });

  it("handles already-clean input unchanged", () => {
    expect(slugify("hyderabad")).toBe("hyderabad");
  });

  it("returns empty string for input that is only special characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
