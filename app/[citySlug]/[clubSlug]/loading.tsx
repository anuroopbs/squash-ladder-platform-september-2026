import { Skeleton } from "@/components/ui/Skeleton";

export default function ClubHubLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
        <Skeleton className="mt-4 h-4 w-96" />
      </div>
      <div className="mt-10 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}
