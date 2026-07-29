import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { QrDetail, type QrDetailData } from "@/components/qr-detail";
import type { AttemptRow } from "@/components/attempt-log";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function AdminQrDetailPage({
  params,
}: {
  params: { collegeId: string; qrId: string };
}) {
  const qr = await prisma.qRCode.findUnique({
    where: { id: params.qrId },
    include: { attempts: { orderBy: { createdAt: "asc" } } },
  });

  // Must exist AND belong to the college in the URL.
  if (!qr || qr.collegeId !== params.collegeId) notFound();

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
    rollNumber: a.rollNumber,
    collegeNameReported: a.collegeNameReported,
    year: a.year,
    submittedAnswer: a.submittedAnswer,
    isCorrect: a.isCorrect,
    isFirstAttemptForParticipant: a.isFirstAttemptForParticipant,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <FadeIn className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg border border-google-blue/30 bg-google-blue/10 px-4 py-2.5 text-sm">
        <Eye className="h-4 w-4 shrink-0 text-google-blue" />
        <span className="font-medium text-google-blue">Viewing as admin — read-only.</span>
      </div>
      <QrDetail
        qr={data}
        attempts={attempts}
        backHref={`/admin/colleges/${params.collegeId}`}
        readOnly
      />
    </FadeIn>
  );
}
