import { Loader2 } from "lucide-react";

/** Lightweight centered loading indicator for route-level loading.tsx files. */
export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-google-blue" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
