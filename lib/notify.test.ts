import { describe, expect, it } from "vitest";
import { escapeHtml } from "./notify";

describe("escapeHtml", () => {
  it("escapes characters that could inject HTML into an email", () => {
    expect(escapeHtml(`<a href="x">Bob & 'Al'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Bob &amp; &#39;Al&#39;&lt;/a&gt;"
    );
  });

  it("leaves normal names and scores unchanged", () => {
    expect(escapeHtml("NAWiN")).toBe("NAWiN");
    expect(escapeHtml("11-8, 9-11, 11-6")).toBe("11-8, 9-11, 11-6");
  });
});
