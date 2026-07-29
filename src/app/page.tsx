import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, MapPin, Trophy, ArrowRight } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { BrandMark, GoogleRule } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user && !user.mustChangePassword) {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const features = [
    {
      icon: MapPin,
      title: "Hidden across campus",
      body: "Sub-organizers hide physical QR codes around their own college.",
      color: "#4285F4",
    },
    {
      icon: QrCode,
      title: "Scan to reveal a riddle",
      body: "Each QR unlocks a single riddle. Solve it to get the answer.",
      color: "#EA4335",
    },
    {
      icon: Trophy,
      title: "First correct answer wins",
      body: "The first correct submission permanently locks that QR for everyone.",
      color: "#34A853",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <BrandMark href={null} />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <GoogleRule />
          <div className="container py-16 sm:py-24">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-google-green" />
                A GDG Prayagraj event
              </span>
              <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
                The multi-college{" "}
                <span className="text-google-blue">QR treasure hunt</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
                Scan hidden QR codes, solve the riddle behind each one, and race to be the
                first correct answer. One winner locks each code — forever.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">
                    Organizer sign in
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/signup">I have an authorized email</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Participants don&apos;t need an account — just scan a QR at your college to
                begin.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${f.color}1a`, color: f.color }}
                    >
                      <f.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <BrandMark href={null} />
          <p>Built for GDG Prayagraj · Only your first submission ever counts.</p>
        </div>
      </footer>
    </div>
  );
}
