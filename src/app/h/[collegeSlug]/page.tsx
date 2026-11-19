import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode, Send, Clock, CheckCircle2, Trophy } from "lucide-react";
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
import { RollingNumber, Reveal, StatusPill } from "@/components/ui-library";

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
  NOT_CONFIGURED: { label: "Coming soon", tone: "grey" },
  NOT_STARTED: { label: "Starting soon", tone: "yellow" },
  LIVE: { label: "Live now", tone: "green" },
  ENDED: { label: "Ended", tone: "red" },
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
        <section className="relative overflow-hidden border-b bg-background">
          <GoogleRule />
          {/* Soft colour wash behind the title, in the four Google colours. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
            style={{
              background:
                "radial-gradient(40% 60% at 20% 0%, rgba(66,133,244,0.12), transparent 70%), radial-gradient(35% 55% at 80% 0%, rgba(52,168,83,0.10), transparent 70%), radial-gradient(30% 50% at 50% 0%, rgba(251,188,5,0.10), transparent 70%)",
            }}
          />
          <div className="container relative py-12 sm:py-16">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <StatusPill tone={badge.tone} breathing={status === "LIVE"}>
                {badge.label}
              </StatusPill>
              <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                {college.name}
              </h1>
              <p className="mt-2 font-heading text-lg text-google-blue">
                QR Treasure Hunt
              </p>
              <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
                Find the hidden QR codes around campus, scan one to reveal its riddle, solve
                it for the answer, then submit your QR ID and answer here.
              </p>

              {(college.huntStartAt || college.huntEndAt) && (
                <div className="mx-auto mt-6 grid max-w-md grid-cols-2 divide-x overflow-hidden rounded-xl border bg-background/80 text-left text-sm shadow-sm backdrop-blur">
                  <div className="flex items-start gap-2 p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-google-blue" />
                    <div>
                      <p className="text-xs text-muted-foreground">Starts</p>
                      <p className="font-medium">{formatDateTime(college.huntStartAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-google-red" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ends</p>
                      <p className="font-medium">{formatDateTime(college.huntEndAt)}</p>
                    </div>
                  </div>
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
                bg: "bg-google-blue/10",
              },
              {
                icon: CheckCircle2,
                label: "Already solved",
                value: stats.solvedQr,
                color: "text-google-green",
                bg: "bg-google-green/10",
              },
              {
                icon: Send,
                label: "Total attempts",
                value: stats.totalAttempts,
                color: "text-[#b08800]",
                bg: "bg-google-yellow/15",
              },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </span>
                    <div>
                      <p className="font-heading text-2xl font-bold">
                        <RollingNumber value={s.value} />
                      </p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="container pb-16">
          <Reveal className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-heading text-xl font-bold">
                <Trophy className="h-5 w-5 text-[#b08800]" />
                Leaderboard
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {leaderboard.length} winner{leaderboard.length === 1 ? "" : "s"}
              </span>
            </div>
            <PublicLeaderboard rows={leaderboard} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ranked by the time of each winner&apos;s correct submission.
            </p>
          </Reveal>
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
