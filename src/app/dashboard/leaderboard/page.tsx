import { Trophy } from "lucide-react";
import { requireSubOrganizer } from "@/lib/session";
import { getCollegeLeaderboard } from "@/lib/queries";
import { FirstAttemptNotice } from "@/components/brand";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function DashboardLeaderboardPage() {
  const user = await requireSubOrganizer();
  const rows = await getCollegeLeaderboard(user.collegeId);

  return (
    <FadeIn className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-google-yellow" />
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Ranked by each participant&apos;s first-ever correct submission.
          </p>
        </div>
      </div>

      <FirstAttemptNotice />

      <Card>
        <CardHeader>
          <CardTitle>
            {rows.length} eligible winner{rows.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-2 pb-2 sm:px-4">
            <LeaderboardTable rows={rows} />
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
