import Link from "next/link";
import { cn } from "@/lib/utils";

/** Four Google-colored dots + wordmark used as the platform mark. */
export function BrandMark({
  className,
  href = "/",
  subtitle,
}: {
  className?: string;
  href?: string | null;
  subtitle?: string;
}) {
  const dots = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex items-center gap-1" aria-hidden>
        {dots.map((c) => (
          <span
            key={c}
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: c }}
          />
        ))}
      </span>
      <span className="font-heading text-base font-bold tracking-tight">
        Treasure Hunt
        {subtitle ? (
          <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}

/** The four-color rule used at the top of hero sections. */
export function GoogleRule({ className }: { className?: string }) {
  return <div className={cn("h-1.5 w-full google-rule", className)} />;
}

/** Repeated notice about the one-submission-per-participant rule. */
export function FirstAttemptNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-lg border border-google-yellow/50 bg-google-yellow/10 px-3 py-2 text-sm text-foreground",
        className,
      )}
    >
      <span className="font-semibold">Heads up:</span> only{" "}
      <span className="font-semibold">one submission per participant</span> is allowed —
      make sure your answer is right before you submit.
    </p>
  );
}
