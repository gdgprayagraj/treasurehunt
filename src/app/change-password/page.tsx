"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const mustChange = session?.user?.mustChangePassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Could not change your password.");
      return;
    }
    // Refresh the JWT so mustChangePassword clears, then route by role.
    await update({ mustChangePassword: false });
    setLoading(false);
    const dest = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
    router.push(dest);
    router.refresh();
  }

  return (
    <AuthShell
      title="Change your password"
      subtitle={
        mustChange
          ? "You must set a new password before continuing."
          : "Update the password on your account."
      }
      footer={
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground hover:underline"
        >
          Sign out
        </button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
