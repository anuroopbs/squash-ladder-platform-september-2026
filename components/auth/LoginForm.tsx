"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [method, setMethod] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function formatPhone(p: string) {
    const digits = p.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.startsWith("+")) return digits;
    return `+${digits}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (method === "email") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        // Phone OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formatPhone(phone),
        });
        if (otpError) throw otpError;
        setStep("otp");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            📱
          </div>
          <h2 className="mt-4 font-semibold text-white">Enter the code</h2>
          <p className="mt-1.5 text-sm text-white/50">
            We sent a 6-digit code to {phone}
          </p>
        </div>

        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          label="6-digit OTP"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Verify &amp; Sign In
        </Button>

        <button
          type="button"
          onClick={() => setStep("form")}
          className="w-full text-center text-sm text-white/40 hover:text-white"
        >
          ← Go back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Method tabs — Phone first per product decision */}
      <div className="flex rounded-xl bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => setMethod("phone")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            method === "phone"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          📱 Phone
        </button>
        <button
          type="button"
          onClick={() => setMethod("email")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            method === "email"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          📧 Email
        </button>
      </div>

      {method === "email" ? (
        <>
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
        </>
      ) : (
        <Input
          id="phone"
          type="tel"
          required
          autoComplete="tel"
          label="Phone number"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helper="We'll send you a one-time code"
        />
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {method === "email" ? "Sign in" : "Send OTP"}
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
