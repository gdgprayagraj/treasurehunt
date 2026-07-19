"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

/** Fires a confetti burst (Google colors only) once on mount. */
export function ConfettiBurst() {
  React.useEffect(() => {
    const duration = 1600;
    const end = Date.now() + duration;

    // Initial center pop.
    confetti({
      particleCount: 120,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors: GOOGLE_COLORS,
    });

    // Trailing side bursts.
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: GOOGLE_COLORS,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: GOOGLE_COLORS,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, []);

  return null;
}

/** Animated success checkmark (Google Green). */
export function SuccessCheck({ size = 96 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 16 }}
      aria-hidden
    >
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="#34A853"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M14 27l8 8 16-16"
        fill="none"
        stroke="#34A853"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.35, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
