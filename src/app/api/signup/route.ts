import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { normalizeEmail } from "@/lib/answer";

/**
 * Allowlist-gated sub-organizer signup.
 *
 * The email MUST already exist (case-insensitive) in AllowedEmail and be unclaimed.
 * There is no other way to create an account here. On success the account is bound
 * to the allowlist's college and the entry is marked claimed.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);

  // Look up the allowlist entry case-insensitively.
  const allowed = await prisma.allowedEmail.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { college: true },
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "This email is not authorized. Contact the event admin." },
      { status: 403 },
    );
  }

  if (allowed.claimedAt) {
    return NextResponse.json(
      { error: "This email has already been used to create an account. Try logging in." },
      { status: 409 },
    );
  }

  // Guard against an existing account for this email.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    // Create the account, bind it to the college, and claim the allowlist entry
    // atomically so a race can't produce two accounts for one college.
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "SUB_ORGANIZER",
          collegeId: allowed.collegeId,
          mustChangePassword: false,
        },
      }),
      prisma.allowedEmail.update({
        where: { id: allowed.id },
        data: { claimedAt: new Date() },
      }),
    ]);
  } catch {
    return NextResponse.json(
      { error: "Could not create the account. It may already exist." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
