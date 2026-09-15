"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (error) throw error;

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setNeedsConfirmation(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
          📧
        </div>
        <h2 className="mt-4 font-semibold text-white">Check your email</h2>
        <p className="mt-1.5 text-sm text-white/50">
          We sent a confirmation link to {email}. Click it to finish setting
          up your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        type="text"
        required
        autoComplete="name"
        label="Display name"
        placeholder="How you'll appear on the ladder"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <Input
        id="email"
        type="email"
        required
        autoComplete="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        id="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Create account
      </Button>

      <p className="text-center text-sm text-white/40">
        Already playing?{" "}
        <Link href="/login" className="font-medium text-white/70 hover:text-white">
          Sign in
        </Link>
      </p>
    </form>
  );
}
