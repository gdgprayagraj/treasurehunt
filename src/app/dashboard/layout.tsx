import { requireSubOrganizer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSubOrganizer();
  const college = await prisma.college.findUnique({
    where: { id: user.collegeId },
    select: { name: true },
  });

  return (
    <AppShell
      homeHref="/dashboard"
      email={user.email}
      roleLabel={college?.name ?? "Sub-organizer"}
      roleTone="active"
      navItems={[
        { href: "/dashboard", label: "Overview" },
        { href: "/dashboard/qrs", label: "QR Codes" },
        { href: "/dashboard/leaderboard", label: "Leaderboard" },
      ]}
    >
      {children}
    </AppShell>
  );
}
