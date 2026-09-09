import type { CityWithClubCount } from "@/lib/types/database";
import { CityCard } from "./CityCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function CityCardGrid({ cities }: { cities: CityWithClubCount[] }) {
  if (cities.length === 0) {
    return (
      <EmptyState
        title="No cities match your search"
        description="Try a different spelling, or add your city to start the first ladder there."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cities.map((city) => (
        <CityCard key={city.id} city={city} />
      ))}
    </div>
  );
}
