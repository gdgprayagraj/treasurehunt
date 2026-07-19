"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Small button that copies `value` to the clipboard and shows a check for a moment. */
export function CopyButton({
  value,
  className,
  size = "icon",
  label,
}: {
  value: string;
  className?: string;
  size?: "icon" | "sm" | "default";
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onCopy}
      className={cn(className)}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="text-google-green" />
      ) : (
        <Copy />
      )}
      {label ? <span>{copied ? "Copied" : label}</span> : null}
    </Button>
  );
}
