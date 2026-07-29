import Link from "next/link";
import { QrCode, Clock, CheckCircle2, Ban, ScrollText, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getHuntStatus } from "@/lib/hunt";
import { PublicHeader } from "@/components/public-header";
import { MessageScreen } from "@/components/message-screen";
import { GoogleRule, FirstAttemptNotice } from "@/components/brand";
import { CopyButton } from "@/components/copy-button";
import { RiddleContent } from "@/components/riddle-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function RiddlePage({
  params,
}: {
  params: { collegeSlug: string; qrSlug: string };
}) {
  const qr = await prisma.qRCode.findUnique({
    where: { id: params.qrSlug },
    include: { college: true },
  });

  // Invalid QR slug (or a slug that doesn't belong to this college's hunt).
  if (!qr || qr.college.slug !== params.collegeSlug) {
    return (
      <MessageScreen
        icon={QrCode}
        tone="red"
        title="Invalid QR code"
        description="We couldn't find a riddle for this code. Double-check the sticker and try scanning again."
      >
        <Button asChild variant="outline">
          <Link href={`/h/${params.collegeSlug}`}>Go to the event page</Link>
        </Button>
      </MessageScreen>
    );
  }

  const college = qr.college;
  const status = getHuntStatus(college.huntStartAt, college.huntEndAt);

  // The hunt window is opened by the admin. Anything other than LIVE is inactive.
  if (status !== "LIVE") {
    return (
      <MessageScreen
        icon={Clock}
        tone="yellow"
        title="Currently the event is not active"
        description={
          <>
            The <span className="font-medium">{college.name}</span> hunt isn&apos;t open
            right now. Please check back when the organizers open it.
          </>
        }
      >
        <Button asChild variant="outline">
          <Link href={`/h/${college.slug}`}>Back to the event</Link>
        </Button>
      </MessageScreen>
    );
  }

  if (qr.status !== "ACTIVE") {
    const solved = qr.status === "SOLVED";
    return (
      <MessageScreen
        icon={solved ? CheckCircle2 : Ban}
        tone={solved ? "green" : "red"}
        title={solved ? "This QR code has been solved" : "This QR is no longer active"}
        description={
          solved
            ? "Someone got here first. Keep hunting — there are more codes to find!"
            : "This code has been disabled by the organizers."
        }
      >
        <Button asChild variant="outline">
          <Link href={`/h/${college.slug}`}>Back to the event</Link>
        </Button>
      </MessageScreen>
    );
  }

  // ACTIVE — reveal the riddle (no answer input here).
  const submitHref = `/h/${college.slug}/submit?qr=${encodeURIComponent(qr.id)}`;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <PublicHeader collegeName={college.name} collegeSlug={college.slug} showSubmit={false} />
      <main className="container flex-1 py-8">
        <FadeIn className="mx-auto max-w-xl">
          <Card className="overflow-hidden">
            <GoogleRule />
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-medium text-google-blue">
                <ScrollText className="h-4 w-4" />
                Your riddle
              </div>

              <RiddleContent
                text={qr.riddleText}
                className="mt-4 text-xl font-medium"
              />

              <div className="mt-8 rounded-xl border-2 border-dashed border-google-blue/40 bg-google-blue/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your QR ID
                </p>
                <p className="mt-2 select-all break-all font-heading text-3xl font-extrabold tracking-wider text-google-blue">
                  {qr.id}
                </p>
                <div className="mt-3 flex justify-center">
                  <CopyButton value={qr.id} size="sm" label="Copy ID" />
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Solve the riddle to get your answer, then submit your{" "}
                <span className="font-medium text-foreground">QR ID</span> and answer on the{" "}
                {college.name} submission form.
              </p>

              <Button asChild size="lg" className="mt-5 w-full">
                <Link href={submitHref}>
                  Go to the submission form
                  <ArrowRight />
                </Link>
              </Button>

              <div className="mt-6">
                <FirstAttemptNotice />
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </main>
    </div>
  );
}
