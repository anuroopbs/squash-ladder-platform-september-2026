import type { ClubWithLadderCount } from "@/lib/types/database";
import { ClubCard } from "./ClubCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function ClubCardGrid({
  clubs,
  citySlug,
}: {
  clubs: ClubWithLadderCount[];
  citySlug: string;
}) {
  if (clubs.length === 0) {
    return (
      <EmptyState
        title="No clubs here yet"
        description="Be the first to add a club in this city and start its ladder."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} citySlug={citySlug} />
      ))}
    </div>
  );
}
