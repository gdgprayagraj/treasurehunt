import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, ExternalLink, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCollegeStats, getCollegeLeaderboard } from "@/lib/queries";
import { getHuntStatus } from "@/lib/hunt";
import { formatDateTime } from "@/lib/utils";
import { getBaseUrl } from "@/lib/qr";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { ReadonlyQrTable, type ReadonlyQrRow } from "@/components/readonly-qr-table";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

const statusBadge = {
  NOT_CONFIGURED: { label: "Not scheduled", variant: "warning" as const },
  NOT_STARTED: { label: "Starts soon", variant: "warning" as const },
  LIVE: { label: "Live now", variant: "success" as const },
  ENDED: { label: "Ended", variant: "destructive" as const },
};

export default async function AdminCollegeDrilldownPage({
  params,
}: {
  params: { collegeId: string };
}) {
  const college = await prisma.college.findUnique({ where: { id: params.collegeId } });
  if (!college) notFound();

  const [stats, leaderboard, qrs] = await Promise.all([
    getCollegeStats(college.id),
    getCollegeLeaderboard(college.id),
    prisma.qRCode.findMany({
      where: { collegeId: college.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { attempts: true } } },
    }),
  ]);

  const status = getHuntStatus(college.huntStartAt, college.huntEndAt);
  const badge = statusBadge[status];
  const qrRows: ReadonlyQrRow[] = qrs.map((qr) => ({
    id: qr.id,
    label: qr.label,
    status: qr.status,
    createdAt: qr.createdAt.toISOString(),
    solvedAt: qr.solvedAt ? qr.solvedAt.toISOString() : null,
    attemptCount: qr._count.attempts,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg border border-google-blue/30 bg-google-blue/10 px-4 py-2.5 text-sm">
        <Eye className="h-4 w-4 shrink-0 text-google-blue" />
        <span className="font-medium text-google-blue">Viewing as admin — read-only.</span>
        <span className="text-muted-foreground">
          Changes are managed by this college&apos;s sub-organizer.
        </span>
      </div>

      <FadeIn className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/admin/colleges"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All colleges
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">
            {college.name}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="font-mono">/h/{college.slug}</span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/h/${college.slug}`} target="_blank">
            Public page <ExternalLink />
          </Link>
        </Button>
      </FadeIn>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qrs">QR codes</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total QR codes" value={stats.totalQr} accent="neutral" />
            <StatCard label="Active" value={stats.activeQr} accent="blue" />
            <StatCard label="Solved" value={stats.solvedQr} accent="green" />
            <StatCard
              label="Eligible participants"
              value={stats.leaderboardEligible}
              accent="yellow"
              hint={`${stats.totalAttempts} total attempts`}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
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
                    {stats.solvedQr} of {stats.activeQr + stats.solvedQr} in-play
                  </span>
                </div>
                <ProgressBar value={stats.completionPct} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hunt window</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starts</span>
                  <span className="font-medium">{formatDateTime(college.huntStartAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ends</span>
                  <span className="font-medium">{formatDateTime(college.huntEndAt)}</span>
                </div>
                <p className="pt-2 text-xs italic text-muted-foreground">
                  Opened and controlled by the event admin. Manage it from the{" "}
                  <span className="not-italic font-medium">Colleges</span> page.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qrs">
          <Card>
            <CardContent className="p-0">
              <div className="px-2 py-2 sm:px-4">
                <ReadonlyQrTable
                  qrs={qrRows}
                  detailHrefBase={`/admin/colleges/${college.id}/qrs`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardContent className="p-0">
              <div className="px-2 py-2 sm:px-4">
                <LeaderboardTable rows={leaderboard} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
