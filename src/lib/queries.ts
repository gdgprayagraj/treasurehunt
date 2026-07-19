import { prisma } from "@/lib/prisma";

export type LeaderboardRow = {
  attemptId: string;
  name: string;
  collegeNameReported: string;
  year: string;
  qrCodeId: string;
  qrLabel: string | null;
  solvedAt: Date;
};

/**
 * Leaderboard for a single college.
 *
 * Only a participant's very-first-ever attempt can count (isFirstAttemptForParticipant),
 * and only if it was correct. Ranked purely by the timestamp of that first attempt.
 * Because only the first attempt is ever flagged, each participant appears at most once.
 */
export async function getCollegeLeaderboard(collegeId: string): Promise<LeaderboardRow[]> {
  const rows = await prisma.submissionAttempt.findMany({
    where: {
      isFirstAttemptForParticipant: true,
      isCorrect: true,
      qrCode: { collegeId },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      collegeNameReported: true,
      year: true,
      createdAt: true,
      qrCodeId: true,
      qrCode: { select: { label: true } },
    },
  });
  return rows.map((r) => ({
    attemptId: r.id,
    name: r.name,
    collegeNameReported: r.collegeNameReported,
    year: r.year,
    qrCodeId: r.qrCodeId,
    qrLabel: r.qrCode.label,
    solvedAt: r.createdAt,
  }));
}

export type CollegeStats = {
  totalQr: number;
  activeQr: number;
  solvedQr: number;
  disabledQr: number;
  totalAttempts: number;
  leaderboardEligible: number;
  completionPct: number;
  lastActivityAt: Date | null;
};

/** Aggregate stats for one college. */
export async function getCollegeStats(collegeId: string): Promise<CollegeStats> {
  const [grouped, totalAttempts, leaderboardEligible, lastAttempt] = await Promise.all([
    prisma.qRCode.groupBy({
      by: ["status"],
      where: { collegeId },
      _count: { _all: true },
    }),
    prisma.submissionAttempt.count({ where: { qrCode: { collegeId } } }),
    prisma.submissionAttempt.count({
      where: {
        isFirstAttemptForParticipant: true,
        isCorrect: true,
        qrCode: { collegeId },
      },
    }),
    prisma.submissionAttempt.findFirst({
      where: { qrCode: { collegeId } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const counts = { ACTIVE: 0, SOLVED: 0, DISABLED: 0 } as Record<string, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  const totalQr = counts.ACTIVE + counts.SOLVED + counts.DISABLED;
  // Completion % is solved out of the QRs that are actually in play (exclude disabled).
  const inPlay = counts.ACTIVE + counts.SOLVED;
  const completionPct = inPlay === 0 ? 0 : Math.round((counts.SOLVED / inPlay) * 100);

  return {
    totalQr,
    activeQr: counts.ACTIVE,
    solvedQr: counts.SOLVED,
    disabledQr: counts.DISABLED,
    totalAttempts,
    leaderboardEligible,
    completionPct,
    lastActivityAt: lastAttempt?.createdAt ?? null,
  };
}

/** List all colleges (for the public submission form's college selector). */
export async function listCollegesForSelect() {
  return prisma.college.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export type CollegeWithStats = {
  id: string;
  name: string;
  slug: string;
  huntStartAt: Date | null;
  huntEndAt: Date | null;
  stats: CollegeStats;
};

/** Per-college stats for the cross-college admin analytics view. */
export async function getAllCollegeStats(): Promise<CollegeWithStats[]> {
  const colleges = await prisma.college.findMany({ orderBy: { name: "asc" } });
  const withStats = await Promise.all(
    colleges.map(async (c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      huntStartAt: c.huntStartAt,
      huntEndAt: c.huntEndAt,
      stats: await getCollegeStats(c.id),
    })),
  );
  return withStats;
}
