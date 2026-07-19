import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode, Send, Clock, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getHuntStatus } from "@/lib/hunt";
import { getCollegeLeaderboard, getCollegeStats } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { GoogleRule, FirstAttemptNotice } from "@/components/brand";
import { PublicHeader } from "@/components/public-header";
import { PublicLeaderboard } from "@/components/public-leaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

async function getCollege(slug: string) {
  return prisma.college.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: { collegeSlug: string };
}): Promise<Metadata> {
  const college = await getCollege(params.collegeSlug);
  return { title: college ? `${college.name} · Hunt` : "Hunt" };
}

const huntBadge = {
  NOT_CONFIGURED: { label: "Coming soon", cls: "text-muted-foreground bg-muted" },
  NOT_STARTED: { label: "Starting soon", cls: "text-google-yellow bg-google-yellow/15" },
  LIVE: { label: "Live now", cls: "text-google-green bg-google-green/15" },
  ENDED: { label: "Ended", cls: "text-google-red bg-google-red/15" },
} as const;

export default async function CollegeLandingPage({
  params,
}: {
  params: { collegeSlug: string };
}) {
  const college = await getCollege(params.collegeSlug);
  if (!college) notFound();

  const status = getHuntStatus(college.huntStartAt, college.huntEndAt);
  const [stats, leaderboard] = await Promise.all([
    getCollegeStats(college.id),
    getCollegeLeaderboard(college.id),
  ]);
  const badge = huntBadge[status];

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <PublicHeader collegeName={college.name} collegeSlug={college.slug} />

      <main className="flex-1">
        <section className="border-b bg-background">
          <GoogleRule />
          <div className="container py-12 sm:py-16">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}
              >
                <Clock className="h-3.5 w-3.5" />
                {badge.label}
              </span>
              <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                {college.name}
              </h1>
              <p className="mt-2 font-heading text-lg text-google-blue">
                QR Treasure Hunt
              </p>
              <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
                Find the hidden QR codes around campus, scan one to reveal its riddle, solve
                it for a numeric answer, then submit your QR ID and answer here.
              </p>

              {(college.huntStartAt || college.huntEndAt) && (
                <div className="mx-auto mt-5 flex max-w-md flex-col gap-1 rounded-lg border bg-muted/40 p-3 text-sm sm:flex-row sm:justify-center sm:gap-6">
                  <span>
                    <span className="text-muted-foreground">Starts: </span>
                    {formatDateTime(college.huntStartAt)}
                  </span>
                  <span>
                    <span className="text-muted-foreground">Ends: </span>
                    {formatDateTime(college.huntEndAt)}
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={`/h/${college.slug}/submit`}>
                    <Send /> Submit an answer
                  </Link>
                </Button>
              </div>
              <div className="mx-auto mt-6 max-w-md">
                <FirstAttemptNotice />
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="container py-10">
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              {
                icon: QrCode,
                label: "QR codes hidden",
                value: stats.activeQr + stats.solvedQr,
                color: "text-google-blue",
              },
              {
                icon: CheckCircle2,
                label: "Already solved",
                value: stats.solvedQr,
                color: "text-google-green",
              },
              {
                icon: Send,
                label: "Total attempts",
                value: stats.totalAttempts,
                color: "text-google-yellow",
              },
            ].map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.06}>
                <Card>
                  <CardContent className="flex items-center gap-3 p-5">
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                    <div>
                      <p className="font-heading text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="container pb-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Leaderboard</h2>
              <span className="text-sm text-muted-foreground">
                {leaderboard.length} winner{leaderboard.length === 1 ? "" : "s"}
              </span>
            </div>
            <PublicLeaderboard rows={leaderboard} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ranked by the timestamp of each participant&apos;s first correct submission.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background py-6">
        <div className="container text-center text-xs text-muted-foreground">
          {college.name} · GDG Prayagraj Treasure Hunt
        </div>
      </footer>
    </div>
  );
}
