import Link from "next/link";
import { Building2, QrCode, CheckCircle2, Users, ArrowRight } from "lucide-react";
import { getAllCollegeStats } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { CompletionChart } from "@/components/analytics-chart";
import { ProgressBar } from "@/components/progress-bar";
import { FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const colleges = await getAllCollegeStats();

  const totals = colleges.reduce(
    (acc, c) => ({
      qr: acc.qr + c.stats.totalQr,
      solved: acc.solved + c.stats.solvedQr,
      active: acc.active + c.stats.activeQr,
      eligible: acc.eligible + c.stats.leaderboardEligible,
      attempts: acc.attempts + c.stats.totalAttempts,
    }),
    { qr: 0, solved: 0, active: 0, eligible: 0, attempts: 0 },
  );

  const chartData = colleges.map((c) => ({
    name: c.name.length > 16 ? c.name.slice(0, 15) + "…" : c.name,
    completion: c.stats.completionPct,
  }));

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Cross-college analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          A platform-wide view across every college running the hunt.
        </p>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Colleges"
          value={colleges.length}
          accent="blue"
        />
        <StatCard label="Total QR codes" value={totals.qr} accent="neutral" delay={0.05} />
        <StatCard label="Solved" value={totals.solved} accent="green" delay={0.1} />
        <StatCard
          label="Eligible participants"
          value={totals.eligible}
          accent="yellow"
          delay={0.15}
        />
        <StatCard
          label="Total attempts"
          value={totals.attempts}
          accent="red"
          delay={0.2}
        />
      </div>

      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle>Completion by college</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionChart data={chartData} />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle>Per-college breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {colleges.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">No colleges yet</p>
                <Button asChild>
                  <Link href="/admin/colleges">Add a college</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>College</TableHead>
                    <TableHead>QRs</TableHead>
                    <TableHead className="hidden sm:table-cell">Solved</TableHead>
                    <TableHead className="hidden sm:table-cell">Active</TableHead>
                    <TableHead className="hidden md:table-cell">Eligible</TableHead>
                    <TableHead className="hidden md:table-cell">Attempts</TableHead>
                    <TableHead className="min-w-[140px]">Completion</TableHead>
                    <TableHead className="hidden lg:table-cell">Last activity</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colleges.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          /h/{c.slug}
                        </div>
                      </TableCell>
                      <TableCell>{c.stats.totalQr}</TableCell>
                      <TableCell className="hidden sm:table-cell text-google-green">
                        {c.stats.solvedQr}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-google-blue">
                        {c.stats.activeQr}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {c.stats.leaderboardEligible}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {c.stats.totalAttempts}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={c.stats.completionPct} className="w-16" />
                          <span className="text-sm font-medium">
                            {c.stats.completionPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDateTime(c.stats.lastActivityAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/colleges/${c.id}`}>
                            View <ArrowRight />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <p className="text-xs text-muted-foreground">
        Icons: <QrCode className="mb-0.5 inline h-3.5 w-3.5" /> QR codes ·{" "}
        <CheckCircle2 className="mb-0.5 inline h-3.5 w-3.5 text-google-green" /> solved ·{" "}
        <Users className="mb-0.5 inline h-3.5 w-3.5" /> leaderboard-eligible participants
        (unique, first-attempt-correct).
      </p>
    </div>
  );
}
