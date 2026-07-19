import Link from "next/link";
import { BrandMark, GoogleRule } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";

/** Centered card layout shared by login / signup / change-password. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center">
          <BrandMark />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <FadeIn className="w-full max-w-md">
          <Card className="overflow-hidden">
            <GoogleRule />
            <CardContent className="p-6 sm:p-8">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
              <div className="mt-6">{children}</div>
              {footer ? <div className="mt-6 text-sm">{footer}</div> : null}
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">
              ← Back to home
            </Link>
          </p>
        </FadeIn>
      </main>
    </div>
  );
}
