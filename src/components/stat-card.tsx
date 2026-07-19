import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Compact metric card for dashboard overviews. */
export function StatCard({
  label,
  value,
  hint,
  accent = "blue",
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "blue" | "red" | "yellow" | "green" | "neutral";
  delay?: number;
}) {
  const accentClass = {
    blue: "text-google-blue",
    red: "text-google-red",
    yellow: "text-[#8a6d00]",
    green: "text-google-green",
    neutral: "text-foreground",
  }[accent];

  return (
    <FadeIn delay={delay}>
      <Card className="h-full">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-2 font-heading text-3xl font-bold", accentClass)}>
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
