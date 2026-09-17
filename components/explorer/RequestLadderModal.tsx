"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";

interface RequestLadderModalProps {
  onClose: () => void;
}

export function RequestLadderModal({ onClose }: RequestLadderModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [cityName, setCityName] = useState("");
  const [clubName, setClubName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("ladder_requests").insert({
        requester_id: user?.id ?? null,
        requester_name: name,
        requester_contact: contact,
        city_name: cityName,
        club_name: clubName,
        notes: notes || null,
      });

      if (insertError) throw insertError;
      setDone(true);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            ✅
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Request sent!</h3>
          <p className="mt-2 text-sm text-white/60">
            We&apos;ll set up your ladder and reach out at {contact} once it&apos;s ready.
          </p>
          <Button onClick={onClose} className="mt-6 w-full">
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6"
      >
        <h3 className="text-lg font-semibold text-white">Request a new ladder</h3>
        <p className="mt-1 text-sm text-white/60">
          Tell us about your city and club — we&apos;ll set it up and let you know.
        </p>

        <div className="mt-4 space-y-3">
          <Input
            label="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
          <Input
            label="Email or phone"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="How should we reach you?"
          />
          <Input
            label="City"
            required
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="e.g. Mumbai"
          />
          <Input
            label="Club name"
            required
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="e.g. Willingdon Sports Club"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else we should know?"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Send Request
          </Button>
        </div>
      </form>
    </div>
  );
}
