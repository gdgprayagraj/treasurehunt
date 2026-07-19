"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Could not create the account.");
      return;
    }

    // Auto sign-in after successful signup.
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (!signInRes || signInRes.error) {
      // Account was created; just send them to login.
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Only pre-approved sub-organizer emails can sign up."
      footer={
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-google-blue hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-google-blue/30 bg-google-blue/10 px-3 py-2 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-google-blue" />
          <span>
            Use the exact email the event admin added to the allowlist for your college.
          </span>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Authorized email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
