"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff, Clock } from "lucide-react";
import {
  setCollegeHuntWindowAction,
  setAllCollegesHuntWindowAction,
} from "@/app/admin/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getHuntStatus } from "@/lib/hunt";
import { toDateTimeLocalValue } from "@/lib/utils";

/** Status badge reflecting a college's admin-set hunt window. */
export function HuntWindowStatusBadge({
  startISO,
  endISO,
}: {
  startISO: string | null;
  endISO: string | null;
}) {
  const status = getHuntStatus(
    startISO ? new Date(startISO) : null,
    endISO ? new Date(endISO) : null,
  );
  if (status === "LIVE") return <Badge variant="success">Active</Badge>;
  if (status === "NOT_STARTED") return <Badge variant="warning">Scheduled</Badge>;
  if (status === "ENDED") return <Badge variant="destructive">Ended</Badge>;
  return <Badge variant="outline">Off</Badge>;
}

/** Bulk control: open or close the hunt window for every college at once. */
export function BulkHuntWindowCard() {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState<"open" | "close" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openAll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("open");
    const res = await setAllCollegesHuntWindowAction({ huntStartAt: start, huntEndAt: end });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    toast({
      variant: "success",
      title: "Hunt opened for all colleges",
      description: `${res.data?.count ?? 0} college(s) updated.`,
    });
    router.refresh();
  }

  async function closeAll() {
    setError(null);
    setBusy("close");
    const res = await setAllCollegesHuntWindowAction({ huntStartAt: "", huntEndAt: "" });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    toast({ variant: "warning", title: "Hunt closed for all colleges" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-google-blue" /> Hunt window — all colleges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Only you can open the hunt. Set one window to run every college together, or manage
          them individually in the table below. Outside the window, scanning any QR shows
          &ldquo;Currently the event is not active.&rdquo;
        </p>
        {error ? (
          <div className="mb-4 rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
            {error}
          </div>
        ) : null}
        <form
          onSubmit={openAll}
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="bulkStart">Starts</Label>
            <Input
              id="bulkStart"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulkEnd">Ends</Label>
            <Input
              id="bulkEnd"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy !== null}>
            {busy === "open" ? <Loader2 className="animate-spin" /> : <Power />}
            Open for all
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={closeAll}
            disabled={busy !== null}
          >
            {busy === "close" ? <Loader2 className="animate-spin" /> : <PowerOff />}
            Close all
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Per-college dialog to open (with timing) or close a single college's hunt window. */
export function CollegeWindowDialog({
  collegeId,
  collegeName,
  startISO,
  endISO,
  open,
  onOpenChange,
}: {
  collegeId: string;
  collegeName: string;
  startISO: string | null;
  endISO: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [start, setStart] = useState(toDateTimeLocalValue(startISO));
  const [end, setEnd] = useState(toDateTimeLocalValue(endISO));
  const [busy, setBusy] = useState<"save" | "close" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("save");
    const res = await setCollegeHuntWindowAction({
      collegeId,
      huntStartAt: start,
      huntEndAt: end,
    });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    toast({ variant: "success", title: `Hunt window set for ${collegeName}` });
    router.refresh();
    onOpenChange(false);
  }

  async function close() {
    setError(null);
    setBusy("close");
    const res = await setCollegeHuntWindowAction({
      collegeId,
      huntStartAt: "",
      huntEndAt: "",
    });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    toast({ variant: "warning", title: `Hunt closed for ${collegeName}` });
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hunt window — {collegeName}</DialogTitle>
          <DialogDescription>
            Set the start and end time to open the hunt for this college. Clearing the window
            closes it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cwStart">Starts</Label>
              <Input
                id="cwStart"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cwEnd">Ends</Label>
              <Input
                id="cwEnd"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={busy !== null}
            >
              {busy === "close" ? <Loader2 className="animate-spin" /> : <PowerOff />}
              Close hunt
            </Button>
            <Button type="submit" disabled={busy !== null}>
              {busy === "save" ? <Loader2 className="animate-spin" /> : <Power />}
              Open hunt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
