import Link from "next/link";
import { ExternalLink, QrCode, Trophy, Info } from "lucide-react";
import { requireSubOrganizer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCollegeStats } from "@/lib/queries";
import { getHuntStatus } from "@/lib/hunt";
import { formatDateTime } from "@/lib/utils";
import { getBaseUrl } from "@/lib/qr";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { CopyButton } from "@/components/copy-button";
import { FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Read-only presentation of the admin-controlled hunt window, so the sub-organizer
// knows when their college's hunt is open (e.g. to announce it on campus).
const timingConfig = {
  LIVE: {
    title: "Live now",
    desc: "Your college's hunt is open — go ahead and announce it!",
    dot: "bg-google-green",
    pulse: true,
    box: "border-google-green/40 bg-google-green/10",
  },
  NOT_STARTED: {
    title: "Scheduled",
    desc: "The admin has scheduled your hunt. It opens automatically at the start time.",
    dot: "bg-google-yellow",
    pulse: false,
    box: "border-google-yellow/50 bg-google-yellow/10",
  },
  ENDED: {
    title: "Ended",
    desc: "Your college's hunt window has closed. Rankings are final.",
    dot: "bg-google-red",
    pulse: false,
    box: "border-google-red/40 bg-google-red/10",
  },
  NOT_CONFIGURED: {
    title: "Not open yet",
    desc: "The event admin hasn't opened your hunt yet. Hang tight.",
    dot: "bg-muted-foreground",
    pulse: false,
    box: "border-border bg-muted/40",
  },
} as const;

export default async function DashboardOverview() {
  const user = await requireSubOrganizer();
  const college = await prisma.college.findUniqueOrThrow({
    where: { id: user.collegeId },
  });
  const stats = await getCollegeStats(college.id);
  const publicUrl = `${getBaseUrl()}/h/${college.slug}`;
  const huntStatus = getHuntStatus(college.huntStartAt, college.huntEndAt);
  const timing = timingConfig[huntStatus];

  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {college.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${timing.box}`}
            >
              <span className="relative flex h-2 w-2">
                {timing.pulse ? (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${timing.dot}`}
                  />
                ) : null}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${timing.dot}`} />
              </span>
              Hunt {timing.title.toLowerCase()}
            </span>
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
            <CardContent className="space-y-3">
              <div
                className={`flex items-center gap-3 rounded-lg border p-3 ${timing.box}`}
              >
                <span className="relative flex h-3 w-3 shrink-0">
                  {timing.pulse ? (
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${timing.dot}`}
                    />
                  ) : null}
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${timing.dot}`}
                  />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{timing.title}</p>
                  <p className="text-sm text-muted-foreground">{timing.desc}</p>
                </div>
              </div>

              {college.huntStartAt || college.huntEndAt ? (
                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Opens</p>
                    <p className="font-medium">{formatDateTime(college.huntStartAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Closes</p>
                    <p className="font-medium">{formatDateTime(college.huntEndAt)}</p>
                  </div>
                </div>
              ) : null}

              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-google-blue" />
                <span>
                  The timing is opened and controlled by the event admin — this is just so you
                  know your current status.
                </span>
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
