import { notFound } from "next/navigation";
import { requireSubOrganizer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QrDetail, type QrDetailData } from "@/components/qr-detail";
import type { AttemptRow } from "@/components/attempt-log";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function QrDetailPage({
  params,
}: {
  params: { qrId: string };
}) {
  const user = await requireSubOrganizer();
  const qr = await prisma.qRCode.findUnique({
    where: { id: params.qrId },
    include: { attempts: { orderBy: { createdAt: "asc" } } },
  });

  // Isolation: guessing another college's QR ID returns 404, not data.
  if (!qr || qr.collegeId !== user.collegeId) notFound();

  const data: QrDetailData = {
    id: qr.id,
    label: qr.label,
    riddleText: qr.riddleText,
    correctAnswer: qr.correctAnswer,
    status: qr.status,
    qrImageUrl: qr.qrImageUrl,
    createdAt: qr.createdAt.toISOString(),
    solvedAt: qr.solvedAt ? qr.solvedAt.toISOString() : null,
    solverName: qr.solverName,
    solverEmail: qr.solverEmail,
    solverPhone: qr.solverPhone,
    solverYear: qr.solverYear,
  };

  const attempts: AttemptRow[] = qr.attempts.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    collegeNameReported: a.collegeNameReported,
    year: a.year,
    submittedAnswer: a.submittedAnswer,
    isCorrect: a.isCorrect,
    isFirstAttemptForParticipant: a.isFirstAttemptForParticipant,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <FadeIn>
      <QrDetail qr={data} attempts={attempts} backHref="/dashboard/qrs" />
    </FadeIn>
  );
}
