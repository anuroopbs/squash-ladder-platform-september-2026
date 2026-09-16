import { describe, it, expect } from "vitest";
import { toUserMessage } from "./errors";

describe("toUserMessage", () => {
  it("maps the one-active-challenge constraint to a friendly message", () => {
    const err = {
      message:
        'duplicate key value violates unique constraint "one_active_challenge_per_player"',
    };
    expect(toUserMessage(err)).toBe(
      "You already have an active challenge. Finish or wait for it to expire before sending another."
    );
  });

  it("maps rank uniqueness violations", () => {
    const err = {
      message:
        'duplicate key value violates unique constraint "ladder_players_ladder_id_rank_key"',
    };
    expect(toUserMessage(err)).toBe(
      "That rank is already taken in this ladder. Please refresh and try again."
    );
  });

  it("maps invalid score format errors", () => {
    const err = { message: 'new row violates check constraint "valid_score_format"' };
    expect(toUserMessage(err)).toBe(
      "Invalid score format. Use something like: 11-8, 9-11, 11-6"
    );
  });

  it("maps RLS permission denials", () => {
    const err = { message: "permission denied for table matches" };
    expect(toUserMessage(err)).toBe("You don't have permission to do that.");
  });

  it("maps expired session errors", () => {
    const err = { message: "JWT expired" };
    expect(toUserMessage(err)).toBe("Your session has expired. Please sign in again.");
  });

  it("passes through a clean, already-user-facing Error message", () => {
    const err = new Error("You must be signed in to challenge");
    expect(toUserMessage(err)).toBe("You must be signed in to challenge");
  });

  it("falls back to a generic message for unrecognized raw DB errors", () => {
    const err = { message: "some totally new postgres error we've never seen" };
    expect(toUserMessage(err)).toBe("Something went wrong. Please try again.");
  });

  it("falls back to a generic message for non-Error, non-Postgrest values", () => {
    expect(toUserMessage("a random string")).toBe("Something went wrong. Please try again.");
    expect(toUserMessage(null)).toBe("Something went wrong. Please try again.");
    expect(toUserMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});
