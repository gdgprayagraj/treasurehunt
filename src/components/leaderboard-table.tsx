import { Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/lib/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

/** Internal (organizer/admin) leaderboard table with rank + solved QR + timestamp. */
export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
        <Trophy className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">No eligible winners yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Winners appear here once a participant&apos;s first-ever submission is correct.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Participant</TableHead>
          <TableHead className="hidden sm:table-cell">Reported college</TableHead>
          <TableHead className="hidden md:table-cell">Solved QR</TableHead>
          <TableHead>First correct at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.attemptId}>
            <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
            <TableCell>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.year}</div>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm">
              {r.collegeNameReported}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="font-mono text-xs">{r.qrLabel || r.qrCodeId}</span>
            </TableCell>
            <TableCell className="text-sm">{formatDateTime(r.solvedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
