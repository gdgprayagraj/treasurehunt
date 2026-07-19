import { Card, CardContent } from "@/components/ui/card";
import { GoogleRule } from "@/components/brand";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "red" | "yellow" | "neutral";

const toneMap: Record<Tone, { icon: string; ring: string }> = {
  blue: { icon: "text-google-blue", ring: "bg-google-blue/10" },
  green: { icon: "text-google-green", ring: "bg-google-green/10" },
  red: { icon: "text-google-red", ring: "bg-google-red/10" },
  yellow: { icon: "text-[#8a6d00]", ring: "bg-google-yellow/15" },
  neutral: { icon: "text-muted-foreground", ring: "bg-muted" },
};

/** Centered full-page message used for invalid QR / hunt-window / solved states. */
export function MessageScreen({
  icon: Icon,
  tone = "neutral",
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = toneMap[tone];
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <FadeIn className="w-full max-w-md">
        <Card className="overflow-hidden text-center">
          <GoogleRule />
          <CardContent className="p-8">
            <span
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
                t.ring,
              )}
            >
              <Icon className={cn("h-8 w-8", t.icon)} />
            </span>
            <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-balance">
              {title}
            </h1>
            {description ? (
              <div className="mt-2 text-balance text-muted-foreground">{description}</div>
            ) : null}
            {children ? <div className="mt-6">{children}</div> : null}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
