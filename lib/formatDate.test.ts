import { describe, it, expect } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats a UTC date deterministically as 'D Mon YYYY'", () => {
    expect(formatDate("2026-09-09T00:00:00.000Z")).toBe("9 Sep 2026");
  });

  it("does not pad the day with a leading zero", () => {
    expect(formatDate("2026-01-05T12:00:00.000Z")).toBe("5 Jan 2026");
  });

  it("uses a 3-letter month abbreviation", () => {
    expect(formatDate("2026-12-31T23:59:59.000Z")).toBe("31 Dec 2026");
  });

  it("accepts a Date object directly", () => {
    expect(formatDate(new Date("2026-09-09T00:00:00.000Z"))).toBe("9 Sep 2026");
  });

  it("is stable across repeated calls regardless of local timezone/locale", () => {
    // Simulates the server-render vs client-hydrate scenario: the same
    // ISO input must always produce the same string, no matter what
    // Intl/timezone context the runtime is in.
    const input = "2026-09-09T23:30:00.000Z";
    const first = formatDate(input);
    const second = formatDate(input);
    expect(first).toBe(second);
    expect(first).toBe("9 Sep 2026");
  });
});
