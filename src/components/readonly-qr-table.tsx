import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QrStatusBadge } from "@/components/qr-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export type ReadonlyQrRow = {
  id: string;
  label: string | null;
  status: "ACTIVE" | "SOLVED" | "DISABLED";
  createdAt: string;
  solvedAt: string | null;
  attemptCount: number;
};

export function ReadonlyQrTable({
  qrs,
  detailHrefBase,
}: {
  qrs: ReadonlyQrRow[];
  detailHrefBase: string;
}) {
  if (qrs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        This college hasn&apos;t created any QR codes yet.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label / ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Attempts</TableHead>
          <TableHead className="hidden md:table-cell">Created</TableHead>
          <TableHead className="hidden lg:table-cell">Solved</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {qrs.map((qr) => (
          <TableRow key={qr.id}>
            <TableCell>
              <div className="font-medium">{qr.label || "Untitled"}</div>
              <div className="font-mono text-xs text-muted-foreground">{qr.id}</div>
            </TableCell>
            <TableCell>
              <QrStatusBadge status={qr.status} />
            </TableCell>
            <TableCell className="hidden sm:table-cell">{qr.attemptCount}</TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
              {formatDateTime(qr.createdAt)}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {formatDateTime(qr.solvedAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="ghost" size="sm">
                <Link href={`${detailHrefBase}/${qr.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
