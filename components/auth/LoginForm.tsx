"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        autoComplete="current-password"
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Sign in
      </Button>

      <p className="text-center text-sm text-white/40">
        New here?{" "}
        <Link href="/register" className="font-medium text-white/70 hover:text-white">
          Create an account
        </Link>
      </p>
    </form>
  );
}
