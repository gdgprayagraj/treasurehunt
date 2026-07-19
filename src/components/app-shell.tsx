import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { AppNav, type NavItem } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";

/** App chrome for the authenticated dashboard/admin areas. */
export function AppShell({
  navItems,
  roleLabel,
  roleTone = "active",
  email,
  homeHref,
  banner,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  roleTone?: "active" | "warning" | "success";
  email: string;
  homeHref: string;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={homeHref}>
              <BrandMark href={null} />
            </Link>
            <Badge variant={roleTone} className="hidden sm:inline-flex">
              {roleLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[30vw] truncate text-sm text-muted-foreground md:inline">
              {email}
            </span>
            <SignOutButton />
          </div>
        </div>
        <div className="border-t">
          <div className="container flex h-11 items-center">
            <AppNav items={navItems} />
          </div>
        </div>
      </header>

      {banner}

      <main className="container flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
