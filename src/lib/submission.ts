import { prisma } from "@/lib/prisma";
import {
  answersMatch,
  normalizeEmail,
  normalizePhone,
  phoneMatchVariants,
  normalizeRollNumber,
} from "@/lib/answer";
import { getHuntStatus } from "@/lib/hunt";
import { submissionSchema, type SubmissionInput } from "@/lib/validation";

export type SubmissionOutcome =
  | { outcome: "INVALID_QR" }
  | { outcome: "EVENT_INACTIVE"; collegeName: string }
  | { outcome: "ALREADY_SOLVED" }
  | { outcome: "ALREADY_SUBMITTED" }
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
 *  4. one-submission-per-participant guard (roll number OR email OR phone)
 *  5. correctness check (numeric-safe, with a string fallback)
 *  6. log the single attempt
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

  // 4. One submission per participant, platform-wide: matched by roll number,
  //    email, OR phone. If any prior attempt exists, this person is done.
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const rollNumber = normalizeRollNumber(data.rollNumber);
  const priorCount = await prisma.submissionAttempt.count({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        ...(phone ? [{ phone: { in: phoneMatchVariants(phone) } }] : []),
        ...(rollNumber ? [{ rollNumber }] : []),
      ],
    },
  });
  if (priorCount > 0) {
    return { ok: true, result: { outcome: "ALREADY_SUBMITTED" } };
  }

  // 5. Correctness (numeric-safe, with a string fallback for text answers).
  const isCorrect = answersMatch(data.answer, qr.correctAnswer);

  // 6. Log the participant's one and only attempt.
  await prisma.submissionAttempt.create({
    data: {
      qrCodeId: qr.id,
      name: data.name.trim(),
      email,
      phone,
      rollNumber,
      collegeNameReported: data.collegeName.trim(),
      year: data.year.trim(),
      submittedAnswer: data.answer.trim(),
      isCorrect,
      // Every stored attempt is the participant's only one, so it always counts.
      isFirstAttemptForParticipant: true,
    },
  });

  // Incorrect — that was their single submission, so no retry and no lock.
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
        // It's their only submission, so a correct win is always leaderboard-eligible.
        leaderboardEligible: true,
      },
    };
  }

  // Someone else's correct submission won the race a moment earlier.
  return { ok: true, result: { outcome: "CORRECT_TOO_LATE" } };
}
