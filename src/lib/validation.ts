import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const signupSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Admin ────────────────────────────────────────────────────────────────────
const slug = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only");

export const collegeSchema = z.object({
  name: z.string().trim().min(2, "College name is required").max(120),
  slug,
});

export const allowedEmailSchema = z.object({
  email,
  collegeId: z.string().min(1, "Select a college"),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: password,
});

// ── Sub-organizer ────────────────────────────────────────────────────────────
export const qrCreateSchema = z.object({
  label: z.string().trim().max(120).optional().or(z.literal("")),
  // No length cap — riddles can be long (e.g. code snippets).
  riddleText: z.string().trim().min(3, "Riddle text is required"),
  correctAnswer: z.string().trim().min(1, "Correct answer is required").max(200),
});

export const qrEditSchema = qrCreateSchema.extend({
  id: z.string().min(1),
});

export const huntWindowSchema = z.object({
  huntStartAt: z.string().optional().or(z.literal("")),
  huntEndAt: z.string().optional().or(z.literal("")),
});

// ── Public submission ────────────────────────────────────────────────────────
export const submissionSchema = z.object({
  qrId: z.string().trim().min(1, "QR ID is required").max(64),
  name: z.string().trim().min(2, "Your name is required").max(120),
  email,
  rollNumber: z.string().trim().min(1, "Roll / student ID is required").max(60),
  collegeName: z.string().trim().min(2, "College name is required").max(160),
  year: z.string().trim().min(1, "Year is required").max(40),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid contact number")
    .max(20)
    .regex(/^[+()\-\s0-9]+$/, "Enter a valid contact number"),
  answer: z.string().trim().min(1, "Answer is required").max(200),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
