import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

/** Slim header for the public college surfaces. */
export function PublicHeader({
  collegeName,
  collegeSlug,
  showSubmit = true,
}: {
  collegeName: string;
  collegeSlug: string;
  showSubmit?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-3">
        <Link
          href={`/h/${collegeSlug}`}
          className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <BrandMark href={null} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[40vw] truncate text-sm font-medium text-muted-foreground sm:inline">
            {collegeName}
          </span>
          {showSubmit ? (
            <Button asChild size="sm">
              <Link href={`/h/${collegeSlug}/submit`}>Submit answer</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
