import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export type AttemptRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  collegeNameReported: string;
  year: string;
  submittedAnswer: string;
  isCorrect: boolean;
  isFirstAttemptForParticipant: boolean;
  createdAt: string;
};

/** Full attempt log. Each participant gets a single submission. */
export function AttemptLog({ attempts }: { attempts: AttemptRow[] }) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        No submission attempts yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participant</TableHead>
          <TableHead className="hidden md:table-cell">Contact</TableHead>
          <TableHead className="hidden lg:table-cell">Reported college</TableHead>
          <TableHead>Answer</TableHead>
          <TableHead>Result</TableHead>
          <TableHead className="hidden sm:table-cell">When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attempts.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <div className="font-medium">{a.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{a.rollNumber}</div>
              <div className="text-xs text-muted-foreground md:hidden">{a.email}</div>
              <div className="text-xs text-muted-foreground">{a.year}</div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="text-sm">{a.email}</div>
              <div className="text-xs text-muted-foreground">{a.phone}</div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm">
              {a.collegeNameReported}
            </TableCell>
            <TableCell className="font-mono text-sm">{a.submittedAnswer}</TableCell>
            <TableCell>
              {a.isCorrect ? (
                <Badge variant="success">
                  <Check className="mr-1 h-3 w-3" /> Correct
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="mr-1 h-3 w-3" /> Wrong
                </Badge>
              )}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
              {formatDateTime(a.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
