"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Mail } from "lucide-react";
import {
  addAllowedEmailAction,
  deleteAllowedEmailAction,
} from "@/app/admin/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";

export type AllowlistRow = {
  id: string;
  email: string;
  collegeName: string;
  claimedAt: string | null;
};

export function AllowlistManager({
  entries,
  availableColleges,
}: {
  entries: AllowlistRow[];
  availableColleges: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!collegeId) {
      setError("Select a college.");
      return;
    }
    setLoading(true);
    const res = await addAllowedEmailAction({ email, collegeId });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    toast({ variant: "success", title: "Email authorized" });
    setEmail("");
    setCollegeId("");
    router.refresh();
  }

  async function onDelete(id: string) {
    const res = await deleteAllowedEmailAction(id);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Couldn't remove", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Entry removed" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Allowlist</h1>
        <p className="text-sm text-muted-foreground">
          Authorize exactly one sub-organizer email per college. Only allowlisted emails can
          sign up.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authorize an email</CardTitle>
        </CardHeader>
        <CardContent>
          {availableColleges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every college already has an authorized email. Add a new college first to
              authorize another.
            </p>
          ) : (
            <form onSubmit={onAdd} className="space-y-4">
              {error ? (
                <div className="rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
                  {error}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="allowEmail">Email</Label>
                  <Input
                    id="allowEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="organizer@college.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>College</Label>
                  <Select value={collegeId} onValueChange={setCollegeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a college" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColleges.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                  Authorize
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authorized emails</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No authorized emails yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Claimed at</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>{row.collegeName}</TableCell>
                    <TableCell>
                      {row.claimedAt ? (
                        <Badge variant="success">Claimed</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {formatDateTime(row.claimedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!row.claimedAt ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove"
                          onClick={() => onDelete(row.id)}
                        >
                          <Trash2 className="h-4 w-4 text-google-red" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
