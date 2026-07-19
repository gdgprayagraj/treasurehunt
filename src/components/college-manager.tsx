"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, ArrowRight, Clock } from "lucide-react";
import { createCollegeAction, updateCollegeAction } from "@/app/admin/actions";
import {
  BulkHuntWindowCard,
  CollegeWindowDialog,
  HuntWindowStatusBadge,
} from "@/components/admin-hunt-window";
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
import { toast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";

export type CollegeRow = {
  id: string;
  name: string;
  slug: string;
  huntStartAt: string | null;
  huntEndAt: string | null;
  claimed: boolean;
  hasAllowlist: boolean;
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CollegeManager({ colleges }: { colleges: CollegeRow[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CollegeRow | null>(null);
  const [windowFor, setWindowFor] = useState<CollegeRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Colleges</h1>
          <p className="text-sm text-muted-foreground">
            Create colleges, set their public URL slugs, and open each college&apos;s hunt
            window.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Add college
        </Button>
      </div>

      {colleges.length > 0 ? <BulkHuntWindowCard /> : null}

      {colleges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <p className="font-medium">No colleges yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first college, then authorize a sub-organizer email for it in the
              Allowlist.
            </p>
            <Button className="mt-5" onClick={() => setCreateOpen(true)}>
              <Plus /> Add your first college
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>College</TableHead>
                  <TableHead className="hidden sm:table-cell">Sub-organizer</TableHead>
                  <TableHead>Hunt window</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        /h/{c.slug}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.claimed ? (
                        <Badge variant="success">Claimed</Badge>
                      ) : c.hasAllowlist ? (
                        <Badge variant="warning">Invited</Badge>
                      ) : (
                        <Badge variant="destructive">No email</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setWindowFor(c)}
                        className="flex flex-col items-start gap-0.5 text-left"
                        title="Manage hunt window"
                      >
                        <HuntWindowStatusBadge
                          startISO={c.huntStartAt}
                          endISO={c.huntEndAt}
                        />
                        {c.huntStartAt || c.huntEndAt ? (
                          <span className="hidden text-[11px] text-muted-foreground md:inline">
                            {formatDateTime(c.huntStartAt)} → {formatDateTime(c.huntEndAt)}
                          </span>
                        ) : null}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Manage hunt window"
                          onClick={() => setWindowFor(c)}
                          title="Manage hunt window"
                        >
                          <Clock className="h-4 w-4 text-google-blue" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => setEditing(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/colleges/${c.id}`}>
                            View <ArrowRight />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CollegeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onDone={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
      {editing ? (
        <CollegeFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="edit"
          initial={editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}

      {windowFor ? (
        <CollegeWindowDialog
          collegeId={windowFor.id}
          collegeName={windowFor.name}
          startISO={windowFor.huntStartAt}
          endISO={windowFor.huntEndAt}
          open={!!windowFor}
          onOpenChange={(o) => !o && setWindowFor(null)}
        />
      ) : null}
    </div>
  );
}

function CollegeFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: CollegeRow;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res =
      mode === "create"
        ? await createCollegeAction({ name, slug })
        : await updateCollegeAction({ id: initial!.id, name, slug });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    toast({
      variant: "success",
      title: mode === "create" ? "College created" : "College updated",
    });
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add a college" : "Edit college"}</DialogTitle>
          <DialogDescription>
            The slug appears in public URLs like <code>/h/&lt;slug&gt;</code>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="collegeName">College name</Label>
            <Input
              id="collegeName"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Springfield Institute of Technology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collegeSlug">URL slug</Label>
            <Input
              id="collegeSlug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="springfield-tech"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {mode === "create" ? "Create college" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
