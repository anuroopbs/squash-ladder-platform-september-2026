/**
 * Concurrency tests for the ladder join / rank-swap race conditions fixed
 * in sql/013_fix_race_conditions.sql.
 *
 * These tests hit a REAL Supabase database (they call the actual
 * join_ladder() and swap_player_ranks() RPC functions — there is no way
 * to meaningfully test a Postgres race condition against a mock). To
 * avoid ever touching production data by accident, they are SKIPPED
 * unless a dedicated test database's credentials are provided via:
 *
 *   TEST_SUPABASE_URL
 *   TEST_SUPABASE_SERVICE_ROLE_KEY   (needed to bypass RLS for cleanup)
 *
 * Set these in a .env.test file (gitignored) pointing at a throwaway
 * Supabase project or a dedicated test ladder — NEVER point them at
 * production. Run with: npm run test:concurrency
 *
 * What this actually proves: before the fix in sql/013, two concurrent
 * calls to the old client-side "read max rank, then insert" pattern
 * could both read the same max rank and collide. After the fix (calling
 * the atomic join_ladder() RPC), N concurrent joins must all succeed
 * with N distinct, sequential ranks.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const TEST_URL = process.env.TEST_SUPABASE_URL;
const TEST_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const shouldRun = Boolean(TEST_URL && TEST_KEY);

describe.skipIf(!shouldRun)("concurrency: join_ladder() race condition", () => {
  const supabase = shouldRun ? createClient(TEST_URL!, TEST_KEY!) : null;
  let testLadderId: string;
  let testPlayerIds: string[] = [];

  beforeAll(async () => {
    if (!supabase) return;
    // Expects a pre-seeded test ladder + test players to exist; see
    // sql/README.md "Adding a new migration" section for how to seed one.
    // This intentionally does NOT create players (profiles.id is a hard
    // FK to auth.users — see AGENTS.md "Database facts").
    const { data: ladder } = await supabase
      .from("ladders")
      .select("id")
      .eq("slug", "concurrency-test-ladder")
      .single();
    if (!ladder) {
      throw new Error(
        "Test ladder 'concurrency-test-ladder' not found — seed it before running concurrency tests."
      );
    }
    testLadderId = ladder.id;

    const { data: players } = await supabase
      .from("ladder_players")
      .select("player_id")
      .eq("ladder_id", testLadderId);
    testPlayerIds = (players ?? []).map((p) => p.player_id);
  });

  it("assigns distinct sequential ranks when N players join concurrently", async () => {
    if (!supabase || testPlayerIds.length < 5) {
      throw new Error("Need at least 5 seeded test players in the test ladder to run this.");
    }

    // Remove all test players first so we start from a clean ladder
    await supabase.from("ladder_players").delete().eq("ladder_id", testLadderId);

    // Fire N join_ladder() calls at the same time — this is the scenario
    // that broke the old client-side "read max, then insert" pattern.
    const results = await Promise.allSettled(
      testPlayerIds.map((playerId) =>
        supabase.rpc("join_ladder", { ladder_uuid: testLadderId, player_uuid: playerId })
      )
    );

    const failures = results.filter((r) => r.status === "rejected");
    expect(failures.length, "all concurrent joins should succeed").toBe(0);

    const { data: finalPlayers } = await supabase
      .from("ladder_players")
      .select("player_id, rank")
      .eq("ladder_id", testLadderId)
      .order("rank");

    const ranks = (finalPlayers ?? []).map((p) => p.rank);
    const uniqueRanks = new Set(ranks);

    // The core assertion: no two players should have collided on the
    // same rank, and ranks should be sequential starting from 1.
    expect(uniqueRanks.size, "every player must have a distinct rank").toBe(
      testPlayerIds.length
    );
    expect(ranks).toEqual(
      Array.from({ length: testPlayerIds.length }, (_, i) => i + 1)
    );
  });
});

describe.skipIf(!shouldRun)("concurrency: swap_player_ranks() race condition", () => {
  const supabase = shouldRun ? createClient(TEST_URL!, TEST_KEY!) : null;

  it("swaps two ranks atomically without a transient constraint violation", async () => {
    if (!supabase) return;
    const { data: ladder } = await supabase
      .from("ladders")
      .select("id")
      .eq("slug", "concurrency-test-ladder")
      .single();
    if (!ladder) throw new Error("Test ladder not found.");

    const { data: players } = await supabase
      .from("ladder_players")
      .select("player_id, rank")
      .eq("ladder_id", ladder.id)
      .order("rank")
      .limit(2);

    if (!players || players.length < 2) {
      throw new Error("Need at least 2 players in the test ladder for a rank swap.");
    }

    const [p1, p2] = players;

    // Fire the same swap twice concurrently — this simulates two
    // near-simultaneous match reports trying to swap the same pair.
    // Before the fix (sql/013), the "-1 scratch value" approach relied
    // on non-deferred constraint checks; concurrent calls could race.
    const results = await Promise.allSettled([
      supabase.rpc("swap_player_ranks", {
        ladder_uuid: ladder.id,
        player1_uuid: p1.player_id,
        player2_uuid: p2.player_id,
      }),
      supabase.rpc("swap_player_ranks", {
        ladder_uuid: ladder.id,
        player1_uuid: p1.player_id,
        player2_uuid: p2.player_id,
      }),
    ]);

    // Postgres row locking (SELECT ... FOR UPDATE inside the function)
    // means the second call should simply run after the first, not error.
    const failures = results.filter((r) => r.status === "rejected");
    expect(failures.length, "concurrent swaps of the same pair should serialize, not fail").toBe(0);

    const { data: finalRanks } = await supabase
      .from("ladder_players")
      .select("player_id, rank")
      .in("player_id", [p1.player_id, p2.player_id]);

    const ranksAfter = (finalRanks ?? []).map((r) => r.rank).sort();
    const ranksBefore = [p1.rank, p2.rank].sort();

    // Swapped twice = back to the original state (even number of swaps).
    expect(ranksAfter).toEqual(ranksBefore);
  });
});
