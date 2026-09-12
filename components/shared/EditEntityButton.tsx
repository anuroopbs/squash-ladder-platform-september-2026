"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EditableField {
  key: string;
  label: string;
  value: string | null;
  multiline?: boolean;
}

interface EditEntityButtonProps {
  table: "cities" | "clubs" | "ladders";
  id: string;
  createdBy: string | null;
  fields: EditableField[];
}

// Lets the person who created a city/club/ladder fix a typo themselves,
// instead of only an admin being able to edit it. Renders nothing unless
// the signed-in viewer is either that creator or an admin. Matches
// PendingActionsBadge's dropdown pattern (relative wrapper, absolute panel,
// closes on outside click) so it drops in safely inside any header layout.
export function EditEntityButton({ table, id, createdBy, fields }: EditEntityButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value ?? ""]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (active && profile?.is_admin) setIsAdmin(true);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    }
    if (editing) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing]);

  const canEdit = isAdmin || (currentUserId !== null && currentUserId === createdBy);
  if (!canEdit) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);

    if (fields.some((f) => f.key === "name") && !values.name.trim()) {
      setError("Name can't be empty.");
      setSaving(false);
      return;
    }

    const payload: Record<string, string | null> = {};
    for (const f of fields) {
      const v = values[f.key].trim();
      payload[f.key] = v.length > 0 ? v : null;
    }

    const { error: updateError } = await supabase.from(table).update(payload).eq("id", id);
    setSaving(false);
    if (updateError) {
      setError("Couldn't save. Please try again.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setEditing((v) => !v)}
        className="shrink-0 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-court-400/40 hover:text-white"
      >
        Edit
      </button>

      {editing && (
        <div className="absolute right-0 top-full z-10 mt-2 flex w-72 flex-col gap-3 rounded-2xl border border-white/10 bg-[#0b0f0d] p-4 shadow-xl sm:w-80">
          {fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-xs text-white/60">
              {f.label}
              {f.multiline ? (
                <textarea
                  value={values[f.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                  rows={2}
                  className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
                />
              ) : (
                <input
                  value={values[f.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                  className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
                />
              )}
            </label>
          ))}
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div className="mt-1 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-court-500 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-court-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-lg border border-white/15 px-3.5 py-1.5 text-sm font-medium text-white/70 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
