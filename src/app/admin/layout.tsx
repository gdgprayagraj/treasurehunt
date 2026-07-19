import { requireAdmin } from "@/lib/session";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <AppShell
      homeHref="/admin"
      email={user.email}
      roleLabel="Super Admin"
      roleTone="success"
      navItems={[
        { href: "/admin", label: "Analytics" },
        { href: "/admin/colleges", label: "Colleges" },
        { href: "/admin/allowlist", label: "Allowlist" },
        { href: "/admin/sub-organizers", label: "Sub-organizers" },
      ]}
    >
      {children}
    </AppShell>
  );
}
