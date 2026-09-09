import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Ladder",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to challenge, report scores, and check your rank."
      footer={
        <>
          By continuing you agree this is a place to play fair — report
          honest scores.
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
