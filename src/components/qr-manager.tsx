"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Ban,
  RotateCcw,
  Download,
  ExternalLink,
  QrCode as QrIcon,
  Lock,
} from "lucide-react";
import {
  createQrAction,
  updateQrAction,
  setQrStatusAction,
} from "@/app/dashboard/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QrStatusBadge } from "@/components/qr-status-badge";
import { CopyButton } from "@/components/copy-button";
import { HoverCard } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";

export type QrRow = {
  id: string;
  label: string | null;
  riddleText: string;
  correctAnswer: string;
  status: "ACTIVE" | "SOLVED" | "DISABLED";
  qrImageUrl: string;
  createdAt: string;
  solvedAt: string | null;
  attemptCount: number;
};

async function downloadPng(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

export function QrManager({ qrs }: { qrs: QrRow[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<QrRow | null>(null);
  const [created, setCreated] = useState<{
    id: string;
    qrImageUrl: string;
    collegeSlug: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">QR codes</h1>
          <p className="text-sm text-muted-foreground">
            Create codes, print them, and hide them around your campus.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Create QR
        </Button>
      </div>

      {qrs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <QrIcon className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 font-medium">No QR codes yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first QR code. We&apos;ll generate a printable image and a unique
              ID you can hide around campus.
            </p>
            <Button className="mt-5" onClick={() => setCreateOpen(true)}>
              <Plus /> Create your first QR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label / ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Attempts</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Solved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDateTime(qr.createdAt)}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {formatDateTime(qr.solvedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/qrs/${qr.id}`}>View</Link>
                        </Button>
                        {qr.status === "SOLVED" ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground"
                            title="Locked — already solved"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edit"
                              onClick={() => setEditing(qr)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <StatusToggle qr={qr} onDone={() => router.refresh()} />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <QrFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onCreated={(data) => {
          setCreateOpen(false);
          setCreated(data);
          router.refresh();
        }}
      />

      {editing ? (
        <QrFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="edit"
          initial={editing}
          onEdited={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}

      <CreatedQrDialog created={created} onOpenChange={() => setCreated(null)} />
    </div>
  );
}

function StatusToggle({ qr, onDone }: { qr: QrRow; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const disabled = qr.status === "DISABLED";

  async function toggle() {
    setLoading(true);
    const res = await setQrStatusAction(qr.id, disabled ? "ACTIVE" : "DISABLED");
    setLoading(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Couldn't update", description: res.error });
      return;
    }
    toast({
      variant: disabled ? "success" : "warning",
      title: disabled ? "QR re-enabled" : "QR disabled",
    });
    onDone();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={disabled ? "Re-enable" : "Disable"}
      onClick={toggle}
      disabled={loading}
      title={disabled ? "Re-enable" : "Disable (e.g. lost sticker)"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : disabled ? (
        <RotateCcw className="h-4 w-4 text-google-blue" />
      ) : (
        <Ban className="h-4 w-4 text-google-red" />
      )}
    </Button>
  );
}

function QrFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onCreated,
  onEdited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: QrRow;
  onCreated?: (data: { id: string; qrImageUrl: string; collegeSlug: string }) => void;
  onEdited?: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [riddleText, setRiddleText] = useState(initial?.riddleText ?? "");
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === "create") {
      const res = await createQrAction({ label, riddleText, correctAnswer });
      setLoading(false);
      if (!res.ok) return setError(res.error);
      onCreated?.(res.data!);
    } else {
      const res = await updateQrAction({ id: initial!.id, label, riddleText, correctAnswer });
      setLoading(false);
      if (!res.ok) return setError(res.error);
      toast({ variant: "success", title: "QR updated" });
      onEdited?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create a QR code" : "Edit QR code"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "We'll generate a printable image and a unique, non-guessable ID."
              : "You can edit the riddle and answer while the QR is still active."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="label">Label (internal, optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Library entrance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="riddleText">Riddle text</Label>
            <Textarea
              id="riddleText"
              required
              value={riddleText}
              onChange={(e) => setRiddleText(e.target.value)}
              placeholder="Write the riddle participants will see after scanning."
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correctAnswer">Correct answer</Label>
            <Input
              id="correctAnswer"
              required
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="The numeric answer (e.g. 42)"
            />
            <p className="text-xs text-muted-foreground">
              Compared leniently: leading zeros and spacing are ignored.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {mode === "create" ? "Create & generate QR" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreatedQrDialog({
  created,
  onOpenChange,
}: {
  created: { id: string; qrImageUrl: string; collegeSlug: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!created} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR code created</DialogTitle>
          <DialogDescription>
            Print the image and hide it on campus. Keep the ID handy for your records.
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="space-y-4">
            <HoverCard className="mx-auto w-fit rounded-xl border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={created.qrImageUrl}
                alt="Generated QR code"
                className="h-52 w-52"
              />
            </HoverCard>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                QR ID
              </p>
              <p className="mt-1 select-all break-all font-mono text-lg font-bold text-google-blue">
                {created.id}
              </p>
              <div className="mt-2 flex justify-center">
                <CopyButton value={created.id} size="sm" label="Copy ID" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => downloadPng(created.qrImageUrl, `qr-${created.id}.png`)}
              >
                <Download /> Download PNG
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/dashboard/qrs/${created.id}`}>
                  View details <ExternalLink />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
