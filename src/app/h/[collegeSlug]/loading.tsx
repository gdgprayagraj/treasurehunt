import { LoadingScreen } from "@/components/loading-screen";

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/20">
      <LoadingScreen label="Loading the hunt…" />
    </div>
  );
}
