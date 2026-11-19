import { BrandMark, GoogleRule } from "@/components/brand";

/**
 * Grey shapes in the outline of the page while it loads (UI library item C04),
 * instead of a blank screen or a spinner. Used by the event, riddle and
 * submit pages, so it uses the card shape they all share.
 */
function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md bg-muted ${className}`} />;
}

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the hunt…</span>
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <BrandMark href={null} />
          <Bone className="h-8 w-28 rounded-full" />
        </div>
      </header>
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-xl overflow-hidden rounded-xl border bg-card shadow-sm">
          <GoogleRule />
          <div className="space-y-5 p-6 sm:p-8">
            <Bone className="h-7 w-2/3" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-14 w-full" />
            <div className="space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3.5 w-32" />
              <Bone className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Bone className="h-10 w-full" />
              <Bone className="h-10 w-full" />
            </div>
            <Bone className="h-11 w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
