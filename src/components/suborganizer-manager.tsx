"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound, RefreshCw, ShieldAlert } from "lucide-react";
import { resetSubOrganizerPasswordAction } from "@/app/admin/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { formatDateTime } from "@/lib/utils";

export type SubOrganizerRow = {
  id: string;
  email: string;
  collegeName: string;
  mustChangePassword: boolean;
  createdAt: string;
};

// Readable temp password: no ambiguous characters.
function genTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";
  let out = "";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) out += chars[arr[i] % chars.length];
  return out;
}

export function SubOrganizerManager({ users }: { users: SubOrganizerRow[] }) {
  const [resetting, setResetting] = useState<SubOrganizerRow | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Sub-organizers</h1>
        <p className="text-sm text-muted-foreground">
          One account per college. Reset a password to hand someone a temporary one — they
          must change it on next login.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No sub-organizer accounts yet. Authorize an email in the Allowlist so a
              sub-organizer can sign up.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.collegeName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {u.mustChangePassword ? (
                        <Badge variant="warning">Must reset</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDateTime(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResetting(u)}
                      >
                        <KeyRound className="h-4 w-4" /> Reset password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {resetting ? (
        <ResetDialog
          user={resetting}
          onOpenChange={(o) => !o && setResetting(null)}
        />
      ) : null}
    </div>
  );
}

function ResetDialog({
  user,
  onOpenChange,
}: {
  user: SubOrganizerRow;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState(genTempPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await resetSubOrganizerPasswordAction({
      userId: user.id,
      newPassword: password,
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setDone(true);
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a temporary password for <span className="font-medium">{user.email}</span> (
            {user.collegeName}). They&apos;ll be required to change it at next login.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border border-google-yellow/50 bg-google-yellow/10 px-3 py-2 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6d00]" />
              <span>
                Shown once — copy it now and share it securely. It won&apos;t be shown again.
              </span>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Temporary password
              </p>
              <p className="mt-1 select-all break-all font-mono text-lg font-bold">
                {password}
              </p>
              <div className="mt-2 flex justify-center">
                <CopyButton value={password} size="sm" label="Copy password" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="tempPassword">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="tempPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                  minLength={8}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generate a new one"
                  onClick={() => setPassword(genTempPassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 8 characters. Edit it or generate a fresh one.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Set temporary password
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
