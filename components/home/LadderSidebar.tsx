import Link from "next/link";

interface LadderPreview {
  citySlug: string;
  cityName: string;
  clubSlug: string;
  clubName: string;
  ladderName: string;
  players: { rank: number; name: string }[];
}

interface LadderSidebarProps {
  previews: LadderPreview[];
}

export function LadderSidebar({ previews }: LadderSidebarProps) {
  if (previews.length === 0) return null;

  return (
    <aside className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Ladder Rankings</h2>
      <div className="space-y-3">
        {previews.map((preview) => (
          <Link
            key={`${preview.clubSlug}-${preview.ladderName}`}
            href={`/${preview.citySlug}/${preview.clubSlug}`}
            className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">{preview.clubName}</h3>
                <p className="text-xs text-white/40">{preview.cityName}</p>
              </div>
              <span className="text-xs text-white/40">{preview.ladderName}</span>
            </div>
            {preview.players.length > 0 && (
              <div className="mt-3 space-y-1">
                {preview.players.slice(0, 5).map((player) => (
                  <div key={player.rank} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right text-xs font-medium text-white/60">
                      {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : `#${player.rank}`}
                    </span>
                    <span className="text-white/80">{player.name}</span>
                  </div>
                ))}
                {preview.players.length > 5 && (
                  <p className="text-xs text-white/40">+{preview.players.length - 5} more</p>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
}
