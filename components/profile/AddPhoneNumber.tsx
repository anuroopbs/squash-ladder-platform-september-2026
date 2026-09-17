"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";

interface AddPhoneNumberProps {
  currentPhone: string | null;
}

export function AddPhoneNumber({ currentPhone }: AddPhoneNumberProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [editing, setEditing] = useState(!currentPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", user.id);

      if (updateError) throw updateError;
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <p className="text-sm text-white/60">Phone number</p>
          <p className="text-white">{currentPhone}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-court-400/20 bg-court-500/5 p-4">
      <p className="text-sm font-medium text-court-300">
        📞 Add your mobile number
      </p>
      <p className="mt-1 text-xs text-white/50">
        So other players on your ladder can reach you to arrange a match.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98765 43210"
          className="flex-1"
        />
        <Button size="sm" onClick={handleSave} loading={loading}>
          Save
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
