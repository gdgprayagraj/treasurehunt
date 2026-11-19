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
  XCircle,
  ShieldAlert,
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
  // When the participant arrives from a scanned riddle, the QR ID comes from the
  // link and is locked, so it can't be changed by mistake. When they open the
  // submit page directly (no ?qr= in the link), they type it in themselves.
  const qrFromLink = defaultQrId.trim();
  const qrLocked = qrFromLink.length > 0;
  const [qrId, setQrId] = useState(qrFromLink);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [reportedCollege, setReportedCollege] = useState(collegeName);
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [answer, setAnswer] = useState("");
  const [agreed, setAgreed] = useState(false);

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
    if (!agreed) {
      setError("Please tick the box to confirm you have checked your details.");
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
          rollNumber,
          collegeName: reportedCollege,
          year,
          phone,
          answer,
          agreed,
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
    // Only an invalid QR ID keeps the form — it's a likely typo and isn't recorded
    // as the participant's one submission, so they can correct it and try again.
    if (outcome.outcome === "INVALID_QR") {
      setError(
        qrLocked
          ? "This QR code is no longer valid. Please scan it again, or ask an organizer."
          : "Invalid QR ID, please check and try again.",
      );
      return;
    }
    // Everything else is terminal — including an incorrect answer, since each
    // participant gets a single submission.
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
          {qrLocked
            ? "Fill in your details and the answer you solved."
            : "Enter the QR ID from the code you scanned and the answer you solved."}
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
              readOnly={qrLocked}
              aria-readonly={qrLocked}
              onChange={qrLocked ? undefined : (e) => setQrId(e.target.value)}
              placeholder="e.g. A1b2C3d4E5"
              className={`font-mono tracking-wider ${
                qrLocked ? "cursor-not-allowed bg-muted text-muted-foreground focus-visible:ring-0" : ""
              }`}
              autoComplete="off"
            />
            {qrLocked ? (
              <p className="text-xs text-muted-foreground">
                Filled in automatically from the QR code you scanned.
              </p>
            ) : null}
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
            <Label htmlFor="rollNumber">College roll number</Label>
            <Input
              id="rollNumber"
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 2101640100123"
              autoComplete="off"
              aria-describedby="rollNumber-note"
            />
            <div
              id="rollNumber-note"
              className="flex items-start gap-2 rounded-md border border-google-yellow/50 bg-google-yellow/10 px-3 py-2 text-xs leading-relaxed text-foreground"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6d00]" />
              <span>
                Enter <span className="font-semibold">only your college roll number</span>. Do
                not enter an enrollment number or any other ID. Prizes are checked against this
                roll number only. If it doesn&apos;t match your college roll number, you
                can&apos;t claim the prize.
              </span>
            </div>
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
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer to the riddle"
              className="text-lg"
            />
          </div>

          <label
            htmlFor="agreed"
            className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm leading-relaxed transition-colors ${
              agreed ? "border-google-blue/50 bg-google-blue/5" : "border-border bg-muted/30"
            }`}
          >
            <input
              id="agreed"
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-google-blue"
            />
            <span>
              I have checked all my details and my answer. I understand that{" "}
              <span className="font-semibold">
                no requests to change anything will be accepted after I submit
              </span>
              , even if I made a mistake.
            </span>
          </label>

          <Button type="submit" size="lg" className="w-full" disabled={loading || !agreed}>
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

  if (result.outcome === "INCORRECT") {
    return (
      <FadeIn>
        <ResultShell>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-google-red/10">
            <XCircle className="h-8 w-8 text-google-red" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">That wasn&apos;t correct</h1>
          <p className="mt-2 text-muted-foreground">
            Each participant gets a single submission, so this one has been recorded. Thanks
            for playing!
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`/h/${collegeSlug}`}>Back to the event</Link>
          </Button>
        </ResultShell>
      </FadeIn>
    );
  }

  if (result.outcome === "ALREADY_SUBMITTED") {
    return (
      <FadeIn>
        <ResultShell>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-google-yellow/15">
            <ShieldAlert className="h-8 w-8 text-[#8a6d00]" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            You&apos;ve already submitted
          </h1>
          <p className="mt-2 text-muted-foreground">
            Only one submission per participant is allowed, and we already have yours on
            record.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`/h/${collegeSlug}`}>Back to the event</Link>
          </Button>
        </ResultShell>
      </FadeIn>
    );
  }

  // Fallback (shouldn't be reached — INVALID_QR stays on the form).
  return (
    <ResultShell>
      <QrCode className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">Please try again.</p>
    </ResultShell>
  );
}
