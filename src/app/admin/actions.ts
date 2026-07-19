"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { normalizeEmail } from "@/lib/answer";
import { collegeSchema, allowedEmailSchema, huntWindowSchema } from "@/lib/validation";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");
  return user;
}

// ── Colleges ─────────────────────────────────────────────────────────────────
export async function createCollegeAction(input: {
  name: string;
  slug: string;
}): Promise<ActionResult<{ id: string }>> {
  await requireAdminUser();
  const parsed = collegeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const college = await prisma.college.create({
      data: { name: parsed.data.name, slug: parsed.data.slug.toLowerCase() },
    });
    revalidatePath("/admin/colleges");
    revalidatePath("/admin");
    return { ok: true, data: { id: college.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That slug is already taken. Choose another." };
    }
    return { ok: false, error: "Could not create the college." };
  }
}

export async function updateCollegeAction(input: {
  id: string;
  name: string;
  slug: string;
}): Promise<ActionResult> {
  await requireAdminUser();
  const parsed = collegeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await prisma.college.update({
      where: { id: input.id },
      data: { name: parsed.data.name, slug: parsed.data.slug.toLowerCase() },
    });
    revalidatePath("/admin/colleges");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That slug is already taken. Choose another." };
    }
    return { ok: false, error: "Could not update the college." };
  }
}

// ── Hunt window (admin-controlled) ───────────────────────────────────────────
/** Parse the two datetime-local strings into Date|null, validating ordering. */
function parseWindow(input: { huntStartAt?: string; huntEndAt?: string }):
  | { ok: true; start: Date | null; end: Date | null }
  | { ok: false; error: string } {
  const parsed = huntWindowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid dates." };
  const start = parsed.data.huntStartAt ? new Date(parsed.data.huntStartAt) : null;
  const end = parsed.data.huntEndAt ? new Date(parsed.data.huntEndAt) : null;
  if (start && Number.isNaN(start.getTime()))
    return { ok: false, error: "Invalid start date." };
  if (end && Number.isNaN(end.getTime()))
    return { ok: false, error: "Invalid end date." };
  if (start && end && end <= start)
    return { ok: false, error: "End time must be after the start time." };
  return { ok: true, start, end };
}

/** Open/clear the hunt window for a single college. Empty values close it. */
export async function setCollegeHuntWindowAction(input: {
  collegeId: string;
  huntStartAt?: string;
  huntEndAt?: string;
}): Promise<ActionResult> {
  await requireAdminUser();
  const parsed = parseWindow(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const college = await prisma.college.findUnique({ where: { id: input.collegeId } });
  if (!college) return { ok: false, error: "College not found." };

  await prisma.college.update({
    where: { id: input.collegeId },
    data: { huntStartAt: parsed.start, huntEndAt: parsed.end },
  });
  revalidatePath("/admin/colleges");
  revalidatePath("/admin");
  return { ok: true };
}

/** Open/clear the hunt window for EVERY college at once. Empty values close all. */
export async function setAllCollegesHuntWindowAction(input: {
  huntStartAt?: string;
  huntEndAt?: string;
}): Promise<ActionResult<{ count: number }>> {
  await requireAdminUser();
  const parsed = parseWindow(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const res = await prisma.college.updateMany({
    data: { huntStartAt: parsed.start, huntEndAt: parsed.end },
  });
  revalidatePath("/admin/colleges");
  revalidatePath("/admin");
  return { ok: true, data: { count: res.count } };
}

// ── Allowlist ────────────────────────────────────────────────────────────────
export async function addAllowedEmailAction(input: {
  email: string;
  collegeId: string;
}): Promise<ActionResult> {
  await requireAdminUser();
  const parsed = allowedEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const email = normalizeEmail(parsed.data.email);

  // Guard: one allowlist row per college, and an email can't be reused.
  const [collegeTaken, emailTaken] = await Promise.all([
    prisma.allowedEmail.findUnique({ where: { collegeId: parsed.data.collegeId } }),
    prisma.allowedEmail.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    }),
  ]);
  if (collegeTaken) {
    return { ok: false, error: "This college already has an authorized email." };
  }
  if (emailTaken) {
    return { ok: false, error: "This email is already assigned to a college." };
  }

  try {
    await prisma.allowedEmail.create({
      data: { email, collegeId: parsed.data.collegeId },
    });
    revalidatePath("/admin/allowlist");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That email or college is already in the allowlist." };
    }
    return { ok: false, error: "Could not add the email." };
  }
}

export async function deleteAllowedEmailAction(id: string): Promise<ActionResult> {
  await requireAdminUser();
  const entry = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!entry) return { ok: false, error: "Entry not found." };
  if (entry.claimedAt) {
    return {
      ok: false,
      error: "This email has already been claimed and can't be removed here.",
    };
  }
  await prisma.allowedEmail.delete({ where: { id } });
  revalidatePath("/admin/allowlist");
  return { ok: true };
}

// ── Sub-organizer password reset ─────────────────────────────────────────────
export async function resetSubOrganizerPasswordAction(input: {
  userId: string;
  newPassword: string;
}): Promise<ActionResult> {
  await requireAdminUser();
  if (!input.newPassword || input.newPassword.length < 8) {
    return { ok: false, error: "Temporary password must be at least 8 characters." };
  }
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user || user.role !== "SUB_ORGANIZER") {
    return { ok: false, error: "Sub-organizer not found." };
  }
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: true },
  });
  revalidatePath("/admin/sub-organizers");
  return { ok: true };
}
