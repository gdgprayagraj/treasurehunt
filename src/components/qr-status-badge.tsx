import { Badge } from "@/components/ui/badge";

type Status = "ACTIVE" | "SOLVED" | "DISABLED";

/** Status badge mapped to the Google palette: blue=active, green=solved, red=disabled. */
export function QrStatusBadge({ status }: { status: Status }) {
  if (status === "SOLVED") return <Badge variant="success">Solved</Badge>;
  if (status === "DISABLED") return <Badge variant="destructive">Disabled</Badge>;
  return <Badge variant="active">Active</Badge>;
}
