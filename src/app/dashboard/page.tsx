import Link from "next/link";
import { ExternalLink, QrCode, Trophy, Info } from "lucide-react";
import { requireSubOrganizer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCollegeStats } from "@/lib/queries";
import { getBaseUrl } from "@/lib/qr";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { CopyButton } from "@/components/copy-button";
import { FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await requireSubOrganizer();
  const college = await prisma.college.findUniqueOrThrow({
    where: { id: user.collegeId },
  });
  const stats = await getCollegeStats(college.id);
  const publicUrl = `${getBaseUrl()}/h/${college.slug}`;

  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {college.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="font-mono">/h/{college.slug}</span>
              <CopyButton value={publicUrl} size="icon" className="h-6 w-6" />
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/h/${college.slug}`} target="_blank">
            View public page <ExternalLink />
          </Link>
        </Button>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total QR codes" value={stats.totalQr} accent="neutral" />
        <StatCard
          label="Active"
          value={stats.activeQr}
          accent="blue"
          hint={`${stats.disabledQr} disabled`}
          delay={0.05}
        />
        <StatCard label="Solved" value={stats.solvedQr} accent="green" delay={0.1} />
        <StatCard
          label="Leaderboard-eligible"
          value={stats.leaderboardEligible}
          accent="yellow"
          hint={`${stats.totalAttempts} total attempts`}
          delay={0.15}
        />
      </div>

      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle>Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-3xl font-bold text-google-green">
                {stats.completionPct}%
              </span>
              <span className="text-sm text-muted-foreground">
                {stats.solvedQr} of {stats.activeQr + stats.solvedQr} in-play codes solved
              </span>
            </div>
            <ProgressBar value={stats.completionPct} />
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/dashboard/qrs">
                  <QrCode /> Manage QR codes
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/dashboard/leaderboard">
                  <Trophy /> View leaderboard
                </Link>
              </Button>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Share the submission form</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">
                    {publicUrl}/submit
                  </code>
                  <CopyButton value={`${publicUrl}/submit`} size="icon" className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Event timing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 rounded-lg border border-google-blue/30 bg-google-blue/5 p-3 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-google-blue" />
                <span>
                  The hunt&apos;s start and end time is opened and controlled by the event
                  admin — you don&apos;t need to manage it here. Just prepare and hide your QR
                  codes; they go live automatically when the admin opens the event.
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
