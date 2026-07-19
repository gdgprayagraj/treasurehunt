import { prisma } from "@/lib/prisma";
import { CollegeManager, type CollegeRow } from "@/components/college-manager";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function AdminCollegesPage() {
  const colleges = await prisma.college.findMany({
    orderBy: { name: "asc" },
    include: { allowedEmail: true, user: true },
  });

  const rows: CollegeRow[] = colleges.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    huntStartAt: c.huntStartAt ? c.huntStartAt.toISOString() : null,
    huntEndAt: c.huntEndAt ? c.huntEndAt.toISOString() : null,
    hasAllowlist: !!c.allowedEmail,
    claimed: !!c.user,
  }));

  return (
    <FadeIn>
      <CollegeManager colleges={rows} />
    </FadeIn>
  );
}
