"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (method === "email") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, phone: phone || null },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          // Auto-logged in
          if (phone) {
            await savePhoneToProfile(supabase, data.session.user.id, phone);
          }
          router.push("/");
          router.refresh();
        } else {
          setStep("done");
        }
      } else {
        // Phone OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formatPhone(phone),
          options: {
            data: { display_name: displayName },
          },
        });
        if (otpError) throw otpError;
        setStep("otp");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp,
        type: "sms",
      });
      if (verifyError) throw verifyError;

      if (data.user) {
        // Update profile with display name
        if (displayName) {
          await supabase
            .from("profiles")
            .update({ display_name: displayName })
            .eq("id", data.user.id);
        }
        if (phone) {
          await savePhoneToProfile(supabase, data.user.id, phone);
        }
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(p: string) {
    const digits = p.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.startsWith("+")) return digits;
    return `+${digits}`;
  }

  async function savePhoneToProfile(supabase: any, userId: string, phoneNum: string) {
    await supabase
      .from("profiles")
      .update({ phone: phoneNum })
      .eq("id", userId);
  }

  if (step === "done") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
          📧
        </div>
        <h2 className="mt-4 font-semibold text-white">Check your email</h2>
        <p className="mt-1.5 text-sm text-white/50">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
      </div>
    );
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
          Verify &amp; Create Account
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
      {/* Method tabs */}
      <div className="flex rounded-xl bg-white/[0.04] p-1">
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
      </div>

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
            minLength={6}
            autoComplete="new-password"
            label="Password"
            placeholder="At least 6 characters"
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

      {/* Always collect phone as secondary for email signups */}
      {method === "email" && (
        <Input
          id="phone-optional"
          type="tel"
          autoComplete="tel"
          label="Phone number (optional)"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helper="For quick login and match notifications"
        />
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {method === "email" ? "Create account" : "Send OTP"}
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
