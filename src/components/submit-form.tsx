"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  QrCode,
  Trophy,
} from "lucide-react";
import type { SubmissionOutcome } from "@/lib/submission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleRule, FirstAttemptNotice } from "@/components/brand";
import { FadeIn } from "@/components/motion";
import { ConfettiBurst, SuccessCheck } from "@/components/confetti-success";

const YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
  "Postgraduate",
  "Alumni / Other",
];

type Props = {
  collegeName: string;
  collegeSlug: string;
  defaultQrId: string;
  colleges: { name: string }[];
};

export function SubmitForm({ collegeName, collegeSlug, defaultQrId, colleges }: Props) {
  const [qrId, setQrId] = useState(defaultQrId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reportedCollege, setReportedCollege] = useState(collegeName);
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionOutcome | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!year) {
      setError("Please select your year.");
      return;
    }

    setLoading(true);
    let data: { ok: boolean; result?: SubmissionOutcome; error?: string };
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrId,
          name,
          email,
          collegeName: reportedCollege,
          year,
          phone,
          answer,
        }),
      });
      data = await res.json();
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }
    setLoading(false);

    if (!data.ok || !data.result) {
      setError(data.error || "Please check your details and try again.");
      return;
    }

    const outcome = data.result;
    // These outcomes keep the form so the participant can correct and retry.
    if (outcome.outcome === "INVALID_QR") {
      setError("Invalid QR ID, please check and try again.");
      return;
    }
    if (outcome.outcome === "INCORRECT") {
      setError("Incorrect answer.");
      return;
    }
    // Everything else is terminal — swap to a result screen.
    setResult(outcome);
  }

  if (result) {
    return <SubmitResult result={result} collegeSlug={collegeSlug} />;
  }

  return (
    <Card className="overflow-hidden">
      <GoogleRule />
      <CardContent className="p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Submit your answer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the QR ID from the code you scanned and the numeric answer you solved.
        </p>

        <div className="mt-4">
          <FirstAttemptNotice />
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-google-red/40 bg-google-red/10 px-3 py-2 text-sm text-google-red">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="qrId">QR ID</Label>
            <Input
              id="qrId"
              required
              value={qrId}
              onChange={(e) => setQrId(e.target.value)}
              placeholder="e.g. A1b2C3d4E5"
              className="font-mono tracking-wider"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportedCollege">College name</Label>
            <Input
              id="reportedCollege"
              required
              list="college-options"
              value={reportedCollege}
              onChange={(e) => setReportedCollege(e.target.value)}
              placeholder="Start typing your college"
            />
            <datalist id="college-options">
              {colleges.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Pick from the list or type your own — it&apos;s not locked to this page.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact number</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="e.g. 98765 43210"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Your answer</Label>
            <Input
              id="answer"
              required
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="The numeric answer to the riddle"
              className="text-lg"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Submit answer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResultShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden text-center">
      <GoogleRule />
      <CardContent className="p-8">{children}</CardContent>
    </Card>
  );
}

function SubmitResult({
  result,
  collegeSlug,
}: {
  result: SubmissionOutcome;
  collegeSlug: string;
}) {
  if (result.outcome === "CORRECT_WINNER") {
    return (
      <FadeIn>
        <ConfettiBurst />
        <ResultShell>
          <div className="flex justify-center">
            <SuccessCheck />
          </div>
          <h1 className="mt-5 font-heading text-3xl font-extrabold text-google-green">
            Correct — you solved it!
          </h1>
          <p className="mt-2 text-muted-foreground">
            You were the first to crack this QR. It&apos;s now locked for everyone else.
          </p>
          <div
            className={`mx-auto mt-5 max-w-sm rounded-lg border px-4 py-3 text-sm ${
              result.leaderboardEligible
                ? "border-google-green/40 bg-google-green/10"
                : "border-google-yellow/50 bg-google-yellow/10"
            }`}
          >
            {result.leaderboardEligible ? (
              <span className="inline-flex items-center gap-2 font-medium text-google-green">
                <Trophy className="h-4 w-4" /> You&apos;re on the {result.collegeName}{" "}
                leaderboard!
              </span>
            ) : (
              <span>
                This was locked for everyone, but since it wasn&apos;t your{" "}
                <span className="font-medium">first-ever</span> submission, it doesn&apos;t
                count toward the leaderboard.
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/h/${result.collegeSlug}`}>View leaderboard</Link>
            </Button>
          </div>
        </ResultShell>
      </FadeIn>
    );
  }

  if (result.outcome === "CORRECT_TOO_LATE") {
    return (
      <FadeIn>
        <ResultShell>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-google-yellow/15">
            <Clock className="h-8 w-8 text-[#8a6d00]" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            Someone just solved this right before you
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your answer was correct, but another participant locked this QR moments earlier.
            Keep hunting — there are more codes out there!
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`/h/${collegeSlug}`}>Back to the event</Link>
          </Button>
        </ResultShell>
      </FadeIn>
    );
  }

  if (result.outcome === "ALREADY_SOLVED") {
    return (
      <FadeIn>
        <ResultShell>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-google-green/10">
            <CheckCircle2 className="h-8 w-8 text-google-green" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            This QR has already been solved
          </h1>
          <p className="mt-2 text-muted-foreground">
            Someone got here first. Look for another hidden code!
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`/h/${collegeSlug}`}>Back to the event</Link>
          </Button>
        </ResultShell>
      </FadeIn>
    );
  }

  if (result.outcome === "EVENT_INACTIVE") {
    return (
      <FadeIn>
        <ResultShell>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-google-yellow/15">
            <Clock className="h-8 w-8 text-[#8a6d00]" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            Currently the event is not active
          </h1>
          <p className="mt-2 text-muted-foreground">
            The {result.collegeName} hunt isn&apos;t open right now. Please check back when
            the organizers open it.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`/h/${collegeSlug}`}>Back to the event</Link>
          </Button>
        </ResultShell>
      </FadeIn>
    );
  }

  // Fallback (shouldn't be reached — INVALID_QR / INCORRECT stay on the form).
  return (
    <ResultShell>
      <QrCode className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">Please try again.</p>
    </ResultShell>
  );
}
