import { Skeleton } from "@/components/ui/Skeleton";

export default function CityPageLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </main>
  );
}
