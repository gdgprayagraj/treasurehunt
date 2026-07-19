import { prisma } from "@/lib/prisma";
import { AllowlistManager, type AllowlistRow } from "@/components/allowlist-manager";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function AdminAllowlistPage() {
  const [entries, colleges] = await Promise.all([
    prisma.allowedEmail.findMany({
      orderBy: { email: "asc" },
      include: { college: true },
    }),
    prisma.college.findMany({
      orderBy: { name: "asc" },
      include: { allowedEmail: true },
    }),
  ]);

  const rows: AllowlistRow[] = entries.map((e) => ({
    id: e.id,
    email: e.email,
    collegeName: e.college.name,
    claimedAt: e.claimedAt ? e.claimedAt.toISOString() : null,
  }));

  // Only colleges without an existing allowlist entry can receive a new one.
  const availableColleges = colleges
    .filter((c) => !c.allowedEmail)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <FadeIn>
      <AllowlistManager entries={rows} availableColleges={availableColleges} />
    </FadeIn>
  );
}
