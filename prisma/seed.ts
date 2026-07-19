/**
 * Seed script — self-contained (no `@/` alias imports) so it runs cleanly under tsx.
 *
 * Creates:
 *  - 1 admin account
 *  - 2 colleges: one with a CLAIMED allowlist email + sub-organizer account + rich data,
 *    one with an UNCLAIMED (pending) allowlist email
 *  - QR codes in ACTIVE / SOLVED / DISABLED states
 *  - a realistic attempt log that visibly exercises the first-attempt leaderboard rule
 *    (first-attempt-correct → eligible; first-attempt-wrong-then-correct → locks the QR but
 *    is NOT eligible; cross-college reported name on an attempt).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const nano = customAlphabet(ALPHABET, 10);

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@gdg.example").toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "AdminPass123!";
const ORGANIZER_EMAIL = "aisha.northfield@gdg.example";
const ORGANIZER_PASSWORD = "OrganizerPass123!";
const PENDING_EMAIL = "ravi.westbrook@gdg.example";

function baseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (explicit || "http://localhost:3000").replace(/\/+$/, "");
}

async function uploadPng(png: Buffer, key: string): Promise<string | null> {
  const endpoint = (process.env.R2_UPLOAD_ENDPOINT || "").replace(/\/+$/, "");
  const password = process.env.R2_UPLOAD_PASSWORD || "";
  const base = (process.env.R2_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (!endpoint || !password || !base) return null;
  try {
    const authRes = await fetch(`${endpoint}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!authRes.ok) return null;
    const { token } = (await authRes.json()) as { token?: string };
    if (!token) return null;
    const putRes = await fetch(`${endpoint}/api/upload/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/png" },
      body: new Uint8Array(png),
    });
    if (!putRes.ok) return null;
    return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  } catch {
    return null;
  }
}

/** Generate the QR image and upload to R2; fall back to a self-contained data URI. */
async function makeQrImage(collegeSlug: string, slug: string) {
  const url = `${baseUrl()}/h/${collegeSlug}/riddle/${slug}`;
  const opts = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    width: 640,
    color: { dark: "#000000", light: "#FFFFFF" },
  };
  const png = await QRCode.toBuffer(url, { type: "png", ...opts });
  const prefix = process.env.R2_KEY_PREFIX || "treasure-hunt/";
  const key = `${prefix}qr/${slug}.png`;
  const uploaded = await uploadPng(png, key);
  if (uploaded) return { url: uploaded, key };
  const dataUri = await QRCode.toDataURL(url, opts);
  return { url: dataUri, key: `seed-local/${slug}` };
}

const HOUR = 3600 * 1000;
const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * HOUR);

async function main() {
  console.log("→ Clearing existing data…");
  await prisma.submissionAttempt.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.allowedEmail.deleteMany();
  await prisma.user.deleteMany();
  await prisma.college.deleteMany();

  console.log("→ Creating admin…");
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "ADMIN",
      mustChangePassword: false,
    },
  });

  console.log("→ Creating colleges…");
  const northfield = await prisma.college.create({
    data: {
      name: "Northfield Institute of Technology",
      slug: "northfield-tech",
      huntStartAt: hoursAgo(72),
      huntEndAt: new Date(now + 96 * HOUR),
    },
  });
  const westbrook = await prisma.college.create({
    data: {
      name: "Westbrook University",
      slug: "westbrook-university",
      // Hunt window left unset — its sub-organizer hasn't signed up yet.
    },
  });

  console.log("→ Creating allowlist entries…");
  // Claimed — Northfield's organizer has an account.
  await prisma.allowedEmail.create({
    data: {
      email: ORGANIZER_EMAIL,
      collegeId: northfield.id,
      claimedAt: hoursAgo(80),
    },
  });
  // Unclaimed / pending — Westbrook's invite hasn't been used yet.
  await prisma.allowedEmail.create({
    data: { email: PENDING_EMAIL, collegeId: westbrook.id, claimedAt: null },
  });

  const organizer = await prisma.user.create({
    data: {
      email: ORGANIZER_EMAIL,
      passwordHash: await bcrypt.hash(ORGANIZER_PASSWORD, 12),
      role: "SUB_ORGANIZER",
      collegeId: northfield.id,
      mustChangePassword: false,
    },
  });

  console.log("→ Generating QR codes (uploading to R2, with local fallback)…");
  type QrSpec = {
    key: string;
    label: string;
    riddle: string;
    answer: string;
    status: "ACTIVE" | "SOLVED" | "DISABLED";
    solver?: { name: string; email: string; phone: string; year: string; at: Date };
  };

  const specs: QrSpec[] = [
    {
      key: "A1",
      label: "Library entrance",
      riddle:
        "I have shelves but sell nothing, I have thousands of stories but no voice. Count the pillars at my main door and multiply by six. What number do you get?",
      answer: "42",
      status: "SOLVED",
      solver: {
        name: "Aarav Sharma",
        email: "aarav@student.northfield.edu",
        phone: "+91 90000 00001",
        year: "Second Year",
        at: hoursAgo(30),
      },
    },
    {
      key: "A2",
      label: "Canteen counter",
      riddle:
        "Where hunger meets the lunch bell, look up. The number of ceiling fans spinning above the queue is your answer.",
      answer: "7",
      status: "SOLVED",
      solver: {
        name: "Diya Patel",
        email: "diya@student.northfield.edu",
        phone: "+91 90000 00002",
        year: "Third Year",
        at: hoursAgo(20),
      },
    },
    {
      key: "A3",
      label: "Auditorium stage",
      riddle:
        "A hundred eyes watch every show from the balcony. That round number is exactly what you seek.",
      answer: "100",
      status: "SOLVED",
      solver: {
        name: "Kabir Rao",
        email: "kabir@student.northfield.edu",
        phone: "+91 90000 00003",
        year: "First Year",
        at: hoursAgo(26),
      },
    },
    {
      key: "A4",
      label: "Sports ground gate",
      riddle:
        "On the field of sweat and cheers, count the floodlight poles that ring the track, then add ten. Well? ",
      answer: "15",
      status: "ACTIVE",
    },
    {
      key: "A5",
      label: "Old block corridor (sticker lost)",
      riddle:
        "In the oldest corridor, the room numbers hide a secret. Subtract the smallest from the largest.",
      answer: "9",
      status: "DISABLED",
    },
  ];

  const qrIds: Record<string, string> = {};
  for (const spec of specs) {
    const slug = nano();
    qrIds[spec.key] = slug;
    const image = await makeQrImage(northfield.slug, slug);
    await prisma.qRCode.create({
      data: {
        id: slug,
        collegeId: northfield.id,
        createdByUserId: organizer.id,
        label: spec.label,
        riddleText: spec.riddle,
        correctAnswer: spec.answer,
        qrImageUrl: image.url,
        qrImageKey: image.key,
        status: spec.status,
        solverName: spec.solver?.name ?? null,
        solverEmail: spec.solver?.email.toLowerCase() ?? null,
        solverPhone: spec.solver ? spec.solver.phone.replace(/\D/g, "") : null,
        solverYear: spec.solver?.year ?? null,
        solvedAt: spec.solver?.at ?? null,
        createdAt: hoursAgo(70),
      },
    });
    console.log(`   • ${spec.key} (${spec.status}) → ${slug}`);
  }

  console.log("→ Creating attempt log…");
  type AttemptSpec = {
    qr: string;
    name: string;
    email: string;
    phone: string;
    reported: string;
    year: string;
    answer: string;
    correct: boolean;
    first: boolean;
    at: Date;
  };

  const attempts: AttemptSpec[] = [
    // Aarav: first-ever attempt is CORRECT → leaderboard-eligible (rank 1).
    {
      qr: "A1",
      name: "Aarav Sharma",
      email: "aarav@student.northfield.edu",
      phone: "+91 90000 00001",
      reported: "Northfield Institute of Technology",
      year: "Second Year",
      answer: "42",
      correct: true,
      first: true,
      at: hoursAgo(30),
    },
    // Diya: first-ever attempt is WRONG → permanently excluded from the leaderboard…
    {
      qr: "A2",
      name: "Diya Patel",
      email: "diya@student.northfield.edu",
      phone: "+91 90000 00002",
      reported: "Northfield Institute of Technology",
      year: "Third Year",
      answer: "5",
      correct: false,
      first: true,
      at: hoursAgo(28),
    },
    // Kabir: first-ever attempt is CORRECT → leaderboard-eligible (rank 2).
    {
      qr: "A3",
      name: "Kabir Rao",
      email: "kabir@student.northfield.edu",
      phone: "+91 90000 00003",
      reported: "Northfield Institute of Technology",
      year: "First Year",
      answer: "100",
      correct: true,
      first: true,
      at: hoursAgo(26),
    },
    // Meera: first-ever attempt is WRONG → excluded.
    {
      qr: "A4",
      name: "Meera Nair",
      email: "meera@student.northfield.edu",
      phone: "+91 90000 00004",
      reported: "Northfield Institute of Technology",
      year: "Fourth Year",
      answer: "12",
      correct: false,
      first: true,
      at: hoursAgo(24),
    },
    // …Diya later answers correctly and LOCKS A2 — but she is still NOT eligible,
    // because her first-ever attempt was wrong. (Lock ≠ leaderboard eligibility.)
    {
      qr: "A2",
      name: "Diya Patel",
      email: "diya@student.northfield.edu",
      phone: "+91 90000 00002",
      reported: "Northfield Institute of Technology",
      year: "Third Year",
      answer: "7",
      correct: true,
      first: false,
      at: hoursAgo(20),
    },
    // Cross-college: reports Westbrook but submits a Northfield QR. First attempt, wrong.
    {
      qr: "A4",
      name: "Ishaan Verma",
      email: "ishaan@student.westbrook.edu",
      phone: "+91 90000 00005",
      reported: "Westbrook University",
      year: "Second Year",
      answer: "20",
      correct: false,
      first: true,
      at: hoursAgo(18),
    },
    // Meera tries A4 again (not her first attempt) — still wrong, A4 stays ACTIVE.
    {
      qr: "A4",
      name: "Meera Nair",
      email: "meera@student.northfield.edu",
      phone: "+91 90000 00004",
      reported: "Northfield Institute of Technology",
      year: "Fourth Year",
      answer: "18",
      correct: false,
      first: false,
      at: hoursAgo(10),
    },
  ];

  for (const a of attempts) {
    await prisma.submissionAttempt.create({
      data: {
        qrCodeId: qrIds[a.qr],
        name: a.name,
        email: a.email.toLowerCase(),
        phone: a.phone.replace(/\D/g, ""),
        collegeNameReported: a.reported,
        year: a.year,
        submittedAnswer: a.answer,
        isCorrect: a.correct,
        isFirstAttemptForParticipant: a.first,
        createdAt: a.at,
      },
    });
  }

  console.log("\n✅ Seed complete.\n");
  console.log("┌─ Sign-in credentials ───────────────────────────────────");
  console.log(`│ Admin          : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`│ Sub-organizer  : ${ORGANIZER_EMAIL} / ${ORGANIZER_PASSWORD}`);
  console.log(`│ Pending invite : ${PENDING_EMAIL} (unclaimed — try /signup)`);
  console.log("├─ Public pages ──────────────────────────────────────────");
  console.log(`│ Northfield     : /h/${northfield.slug}`);
  console.log(`│ Westbrook      : /h/${westbrook.slug} (hunt not yet scheduled)`);
  console.log("├─ Leaderboard (Northfield) should show, in order ────────");
  console.log("│ 1. Aarav Sharma   (first attempt correct)");
  console.log("│ 2. Kabir Rao      (first attempt correct)");
  console.log("│ Diya solved A2 but is EXCLUDED (first attempt was wrong).");
  console.log("└──────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
