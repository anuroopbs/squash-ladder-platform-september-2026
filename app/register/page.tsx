import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create your account — Ladder",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Join the ladder"
      subtitle="Create an account to join a club's ladder, challenge players, and track your rank."
      footer={<>Free to join. No credit card, ever.</>}
    >
      <RegisterForm />
    </AuthCard>
  );
}
