"use client";

/**
 * Pieces rebuilt from the UI library (ui-library.hridx.info). Each keeps the
 * library's shape and motion and takes its colours from this project.
 *
 * - StatusPill    → C01 "Small label with a breathing dot"
 * - RollingNumber → C08 "Rolling numbers"
 * - Reveal        → M06 "Appear while scrolling"
 *
 * All of them stay still for people who turned on "reduce motion".
 */

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── C01 · Small label with a breathing dot ───────────────────────────────── */

const pillTones = {
  green: { pill: "border-google-green/30 bg-google-green/10 text-[#1e7e34]", dot: "#34A853" },
  yellow: { pill: "border-google-yellow/50 bg-google-yellow/15 text-[#8a6d00]", dot: "#FBBC05" },
  red: { pill: "border-google-red/30 bg-google-red/10 text-google-red", dot: "#EA4335" },
  grey: { pill: "border-border bg-muted text-muted-foreground", dot: "#9AA0A6" },
} as const;

export function StatusPill({
  tone,
  breathing = false,
  children,
  className,
}: {
  tone: keyof typeof pillTones;
  /** Only the "live" state should breathe, so it stands out. */
  breathing?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const t = pillTones[tone];
  const animate = breathing && !reduce;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        t.pill,
        className,
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {animate ? (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: t.dot }}
            animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <motion.span
          className="relative h-2 w-2 rounded-full"
          style={{ backgroundColor: t.dot }}
          animate={animate ? { boxShadow: [`0 0 0 0 ${t.dot}00`, `0 0 8px 2px ${t.dot}99`, `0 0 0 0 ${t.dot}00`] } : undefined}
          transition={animate ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      </span>
      {children}
    </span>
  );
}

/* ── C08 · Rolling numbers ────────────────────────────────────────────────── */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A number whose digits roll up like a car's odometer when the page opens.
 *
 * The real number is always the resting position: each digit column is placed
 * on its final digit, and a CSS animation only plays the roll *into* it. So if
 * the animation is paused (background tab, slow phone, "reduce motion"), the
 * correct number still shows, never a stuck 0. Screen readers hear the number.
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const text = Math.max(0, Math.floor(value)).toLocaleString("en-IN");

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {text.split("").map((ch, i) => {
          if (!/\d/.test(ch)) return <span key={`s${i}`}>{ch}</span>;
          const target = Number(ch);
          return (
            <span
              key={`d${i}`}
              className="relative inline-block h-[1em] overflow-hidden leading-none"
              style={{ width: "0.62em" }}
            >
              <span
                className="rolling-digit absolute left-0 top-0 flex flex-col items-center"
                style={{
                  width: "0.62em",
                  transform: `translateY(-${target}em)`,
                  animationDuration: `${900 + i * 120}ms`,
                }}
              >
                {DIGITS.map((d) => (
                  <span key={d} className="block h-[1em] leading-none">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/* ── M06 · Appear while scrolling ─────────────────────────────────────────── */

/** Rises in gently, once, when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children as React.ReactNode}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
