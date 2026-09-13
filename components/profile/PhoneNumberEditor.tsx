"use client";

import { useEffect, useState } from "react";
import { getMyPhone, saveMyPhone } from "@/lib/queries/contacts";

export function PhoneNumberEditor({ userId }: { userId: string }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const current = await getMyPhone(userId);
        if (!cancelled) {
          setPhone(current ?? "");
          setEditing(!current);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await saveMyPhone(userId, phone.trim() || null);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your number.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white">Phone number</h2>
      <p className="mt-1 text-xs text-white/40">
        Optional. Visible only to players on ladders you share, so they can
        reach out to arrange a match.
      </p>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +353 87 123 4567"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-court-400/60"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-court-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-court-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-white/80">{phone}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-court-300 hover:text-court-200"
          >
            Edit
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      {saved && <p className="mt-2 text-sm text-court-300">Saved.</p>}
    </div>
  );
}
