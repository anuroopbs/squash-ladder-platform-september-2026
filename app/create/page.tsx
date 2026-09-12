import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateLadderWizard } from "@/components/create/CreateLadderWizard";

export const metadata: Metadata = {
  title: "Start a ladder — Ladder",
};

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start a new ladder
        </h1>
        <p className="mt-2 text-white/50">
          Don&apos;t see your city or club yet? Add it and be the first name on the board.
        </p>
      </div>
      <Suspense fallback={null}>
        <CreateLadderWizard />
      </Suspense>
    </main>
  );
}
