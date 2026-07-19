"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { normalizeStoredAnswer } from "@/lib/answer";
import { qrCreateSchema, qrEditSchema } from "@/lib/validation";
import { generateQrSlug, generateAndUploadQr } from "@/lib/qr";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireOrganizer() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUB_ORGANIZER" || !user.collegeId) {
    throw new Error("Not authorized");
  }
  return user as typeof user & { collegeId: string };
}

/** Create a QR: generate slug + image, upload to R2, persist. */
export async function createQrAction(input: {
  label?: string;
  riddleText: string;
  correctAnswer: string;
}): Promise<ActionResult<{ id: string; qrImageUrl: string; collegeSlug: string }>> {
  const user = await requireOrganizer();
  const parsed = qrCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const college = await prisma.college.findUnique({ where: { id: user.collegeId } });
  if (!college) return { ok: false, error: "College not found." };

  // Generate a unique slug (retry on the astronomically unlikely collision).
  let slug = generateQrSlug();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.qRCode.findUnique({ where: { id: slug } });
    if (!exists) break;
    slug = generateQrSlug();
  }

  let image: { url: string; key: string };
  try {
    image = await generateAndUploadQr(college.slug, slug);
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? `Could not generate the QR image: ${e.message}`
          : "Could not generate the QR image.",
    };
  }

  await prisma.qRCode.create({
    data: {
      id: slug,
      collegeId: college.id,
      createdByUserId: user.id,
      label: parsed.data.label?.trim() || null,
      riddleText: parsed.data.riddleText.trim(),
      correctAnswer: normalizeStoredAnswer(parsed.data.correctAnswer),
      qrImageUrl: image.url,
      qrImageKey: image.key,
      status: "ACTIVE",
    },
  });

  revalidatePath("/dashboard/qrs");
  return {
    ok: true,
    data: { id: slug, qrImageUrl: image.url, collegeSlug: college.slug },
  };
}

/** Edit a QR's riddle/answer — allowed only while ACTIVE. */
export async function updateQrAction(input: {
  id: string;
  label?: string;
  riddleText: string;
  correctAnswer: string;
}): Promise<ActionResult> {
  const user = await requireOrganizer();
  const parsed = qrEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const qr = await prisma.qRCode.findUnique({ where: { id: parsed.data.id } });
  if (!qr || qr.collegeId !== user.collegeId) {
    return { ok: false, error: "QR not found." };
  }
  if (qr.status === "SOLVED") {
    return { ok: false, error: "This QR is already solved and locked from editing." };
  }

  await prisma.qRCode.update({
    where: { id: qr.id },
    data: {
      label: parsed.data.label?.trim() || null,
      riddleText: parsed.data.riddleText.trim(),
      correctAnswer: normalizeStoredAnswer(parsed.data.correctAnswer),
    },
  });
  revalidatePath("/dashboard/qrs");
  revalidatePath(`/dashboard/qrs/${qr.id}`);
  return { ok: true };
}

/** Disable (or re-enable) a QR without requiring a correct answer. Solved QRs are locked. */
export async function setQrStatusAction(
  id: string,
  status: "ACTIVE" | "DISABLED",
): Promise<ActionResult> {
  const user = await requireOrganizer();
  const qr = await prisma.qRCode.findUnique({ where: { id } });
  if (!qr || qr.collegeId !== user.collegeId) {
    return { ok: false, error: "QR not found." };
  }
  if (qr.status === "SOLVED") {
    return { ok: false, error: "A solved QR cannot be changed." };
  }
  await prisma.qRCode.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/qrs");
  revalidatePath(`/dashboard/qrs/${id}`);
  return { ok: true };
}
