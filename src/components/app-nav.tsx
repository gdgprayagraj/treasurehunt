"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/** Horizontal, scrollable nav used in the dashboard/admin headers. */
export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active =
          item.href === pathname ||
          (item.href !== "/dashboard" &&
            item.href !== "/admin" &&
            pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-google-blue/10 text-google-blue"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
