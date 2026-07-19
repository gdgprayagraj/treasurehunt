"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated progress bar. Fills to `value`% on mount. Color is chosen from the
 * Google palette based on completion, so no non-brand hues appear.
 */
export function ProgressBar({
  value,
  className,
  colorClass,
}: {
  value: number;
  className?: string;
  colorClass?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const auto =
    pct >= 100
      ? "bg-google-green"
      : pct >= 50
        ? "bg-google-blue"
        : pct > 0
          ? "bg-google-yellow"
          : "bg-muted-foreground/30";
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        className={cn("h-full rounded-full", colorClass ?? auto)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}
