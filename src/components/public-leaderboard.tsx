import { Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

/**
 * Public, read-only leaderboard. Shows name + solve status only — never email,
 * phone or other contact details.
 */
export function PublicLeaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
        <Trophy className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium">No winners yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to scan, solve and submit a correct answer.
        </p>
      </div>
    );
  }

  const medal = ["text-google-yellow", "text-muted-foreground", "text-google-red"];

  return (
    <ol className="divide-y rounded-xl border bg-card">
      {rows.map((r, i) => (
        <li key={r.attemptId} className="flex items-center gap-3 p-3 sm:p-4">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              i < 3 ? medal[i] : "text-muted-foreground"
            } bg-muted`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{r.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {r.collegeNameReported} · {r.year}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-google-green">
              <Trophy className="h-3.5 w-3.5" /> Solved
            </span>
            <p className="text-[11px] text-muted-foreground">
              {formatDateTime(r.solvedAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
