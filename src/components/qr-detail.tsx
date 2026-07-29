import Link from "next/link";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { QrStatusBadge } from "@/components/qr-status-badge";
import { AttemptLog, type AttemptRow } from "@/components/attempt-log";
import { CopyButton } from "@/components/copy-button";
import { RiddleContent } from "@/components/riddle-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export type QrDetailData = {
  id: string;
  label: string | null;
  riddleText: string;
  correctAnswer: string;
  status: "ACTIVE" | "SOLVED" | "DISABLED";
  qrImageUrl: string;
  createdAt: string;
  solvedAt: string | null;
  solverName: string | null;
  solverEmail: string | null;
  solverPhone: string | null;
  solverYear: string | null;
};

/**
 * Shared QR detail view. `backHref` differs between the organizer dashboard and the
 * admin read-only drill-in. `readOnly` hides organizer-only affordances.
 */
export function QrDetail({
  qr,
  attempts,
  backHref,
  readOnly = false,
}: {
  qr: QrDetailData;
  attempts: AttemptRow[];
  backHref: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <QrStatusBadge status={qr.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{qr.label || "Untitled QR"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">QR ID:</span>
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold text-google-blue">
                {qr.id}
              </code>
              <CopyButton value={qr.id} size="icon" className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Riddle
              </p>
              <RiddleContent text={qr.riddleText} className="mt-1 text-sm" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Correct answer
              </p>
              <p className="mt-1 font-mono text-lg font-semibold">{qr.correctAnswer}</p>
            </div>

            {qr.status === "SOLVED" ? (
              <div className="flex items-start gap-2 rounded-lg border border-google-green/30 bg-google-green/10 p-3 text-sm">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-google-green" />
                <span>
                  Locked — this QR was solved on {formatDateTime(qr.solvedAt)} and can no
                  longer be edited, preserving the result&apos;s integrity.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {qr.status === "DISABLED" ? (
                  <EyeOff className="h-4 w-4 text-google-red" />
                ) : (
                  <Eye className="h-4 w-4 text-google-blue" />
                )}
                Created {formatDateTime(qr.createdAt)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Printable QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="rounded-xl border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.qrImageUrl} alt="QR code" className="h-40 w-40" />
            </div>
            {!readOnly ? (
              <a
                href={qr.qrImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-google-blue hover:underline"
              >
                Open full-size image
              </a>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {qr.status === "SOLVED" ? (
        <Card>
          <CardHeader>
            <CardTitle>Winner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Name" value={qr.solverName} />
              <Field label="Email" value={qr.solverEmail} />
              <Field label="Phone" value={qr.solverPhone} />
              <Field label="Year" value={qr.solverYear} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Attempt log</CardTitle>
          <Badge variant="outline">{attempts.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="px-2 pb-2 sm:px-4">
            <AttemptLog attempts={attempts} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
