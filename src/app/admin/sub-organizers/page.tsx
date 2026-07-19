import { prisma } from "@/lib/prisma";
import {
  SubOrganizerManager,
  type SubOrganizerRow,
} from "@/components/suborganizer-manager";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function AdminSubOrganizersPage() {
  const users = await prisma.user.findMany({
    where: { role: "SUB_ORGANIZER" },
    orderBy: { createdAt: "desc" },
    include: { college: true },
  });

  const rows: SubOrganizerRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    collegeName: u.college?.name ?? "—",
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <FadeIn>
      <SubOrganizerManager users={rows} />
    </FadeIn>
  );
}
