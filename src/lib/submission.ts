import { prisma } from "@/lib/prisma";
import { answersMatch, normalizeEmail, normalizePhone } from "@/lib/answer";
import { getHuntStatus } from "@/lib/hunt";
import { submissionSchema, type SubmissionInput } from "@/lib/validation";

export type SubmissionOutcome =
  | { outcome: "INVALID_QR" }
  | { outcome: "EVENT_INACTIVE"; collegeName: string }
  | { outcome: "ALREADY_SOLVED" }
  | { outcome: "INCORRECT" }
  | {
      outcome: "CORRECT_WINNER";
      qrId: string;
      collegeName: string;
      collegeSlug: string;
      leaderboardEligible: boolean;
    }
  | { outcome: "CORRECT_TOO_LATE" };

export type SubmissionResult =
  | { ok: false; error: string }
  | { ok: true; result: SubmissionOutcome };

/**
 * Process a public submission. Implements, in order:
 *  1. validation
 *  2. global QR lookup (NOT scoped to the URL's college)
 *  3. invalid-id / window / already-solved short-circuits
 *  4. first-attempt-ever detection (email OR phone, platform-wide)
 *  5. numeric-safe correctness check
 *  6. always-log the attempt with computed flags
 *  7. atomic conditional lock on a correct answer (winner vs. just-too-late)
 */
export async function processSubmission(input: unknown): Promise<SubmissionResult> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data: SubmissionInput = parsed.data;

  // 2. Global lookup by QR ID (primary key), independent of the form's college.
  const qr = await prisma.qRCode.findUnique({
    where: { id: data.qrId.trim() },
    include: { college: true },
  });

  // 3a. Unknown QR ID.
  if (!qr) {
    return { ok: true, result: { outcome: "INVALID_QR" } };
  }

  // 3b. Hunt window for the QR's ACTUAL college — the window is opened by the admin.
  // Anything other than LIVE (not scheduled, before start, after end) is inactive.
  const now = new Date();
  if (getHuntStatus(qr.college.huntStartAt, qr.college.huntEndAt, now) !== "LIVE") {
    return {
      ok: true,
      result: { outcome: "EVENT_INACTIVE", collegeName: qr.college.name },
    };
  }

  // 3c. Already solved / disabled.
  if (qr.status !== "ACTIVE") {
    return { ok: true, result: { outcome: "ALREADY_SOLVED" } };
  }

  // 4. First-attempt-ever detection across the whole platform (email OR phone).
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const priorCount = await prisma.submissionAttempt.count({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });
  const isFirstAttemptForParticipant = priorCount === 0;

  // 5. Correctness (numeric-safe).
  const isCorrect = answersMatch(data.answer, qr.correctAnswer);

  // 6. Always log the attempt with the computed flags.
  await prisma.submissionAttempt.create({
    data: {
      qrCodeId: qr.id,
      name: data.name.trim(),
      email,
      phone,
      collegeNameReported: data.collegeName.trim(),
      year: data.year.trim(),
      submittedAnswer: data.answer.trim(),
      isCorrect,
      isFirstAttemptForParticipant,
    },
  });

  // 10. Incorrect — no retry messaging, no lock.
  if (!isCorrect) {
    return { ok: true, result: { outcome: "INCORRECT" } };
  }

  // 9. Atomic conditional lock: only one request can flip ACTIVE -> SOLVED.
  const locked = await prisma.qRCode.updateMany({
    where: { id: qr.id, status: "ACTIVE" },
    data: {
      status: "SOLVED",
      solverName: data.name.trim(),
      solverEmail: email,
      solverPhone: phone,
      solverYear: data.year.trim(),
      solvedAt: new Date(),
    },
  });

  if (locked.count === 1) {
    return {
      ok: true,
      result: {
        outcome: "CORRECT_WINNER",
        qrId: qr.id,
        collegeName: qr.college.name,
        collegeSlug: qr.college.slug,
        leaderboardEligible: isFirstAttemptForParticipant,
      },
    };
  }

  // Someone else's correct submission won the race a moment earlier.
  return { ok: true, result: { outcome: "CORRECT_TOO_LATE" } };
}
