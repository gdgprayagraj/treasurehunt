/**
 * Admin-only seed — creates (or updates) a single Super Admin account and nothing else.
 * Safe to run against a production database: it does NOT wipe any data, it just ensures the
 * admin from your env exists. Idempotent (re-running updates the password).
 *
 * Set these in .env before running:
 *   SEED_ADMIN_EMAIL="you@example.com"
 *   SEED_ADMIN_PASSWORD="a-strong-password"
 *
 * Run with:  npm run db:seed:admin
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@gdg.example").toLowerCase();
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "AdminPass123!";

async function main() {
  if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
    console.warn(
      "⚠  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set in .env — using example defaults.",
    );
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, role: "ADMIN", collegeId: null, mustChangePassword: false },
    create: { email: EMAIL, passwordHash, role: "ADMIN", mustChangePassword: false },
  });

  console.log(`\n✅ Super Admin ready: ${admin.email}`);
  console.log("   Log in at /login with this email and your SEED_ADMIN_PASSWORD.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
