import { requireSubOrganizer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QrManager, type QrRow } from "@/components/qr-manager";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function QrsPage() {
  const user = await requireSubOrganizer();
  const qrs = await prisma.qRCode.findMany({
    where: { collegeId: user.collegeId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } },
  });

  const rows: QrRow[] = qrs.map((qr) => ({
    id: qr.id,
    label: qr.label,
    riddleText: qr.riddleText,
    correctAnswer: qr.correctAnswer,
    status: qr.status,
    qrImageUrl: qr.qrImageUrl,
    createdAt: qr.createdAt.toISOString(),
    solvedAt: qr.solvedAt ? qr.solvedAt.toISOString() : null,
    attemptCount: qr._count.attempts,
  }));

  return (
    <FadeIn>
      <QrManager qrs={rows} />
    </FadeIn>
  );
}
