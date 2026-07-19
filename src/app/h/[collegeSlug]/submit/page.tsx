import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listCollegesForSelect } from "@/lib/queries";
import { PublicHeader } from "@/components/public-header";
import { SubmitForm } from "@/components/submit-form";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  params,
  searchParams,
}: {
  params: { collegeSlug: string };
  searchParams: { qr?: string };
}) {
  const college = await prisma.college.findUnique({
    where: { slug: params.collegeSlug },
  });
  if (!college) notFound();

  const colleges = await listCollegesForSelect();
  const defaultQrId = typeof searchParams.qr === "string" ? searchParams.qr : "";

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <PublicHeader
        collegeName={college.name}
        collegeSlug={college.slug}
        showSubmit={false}
      />
      <main className="container flex-1 py-8">
        <FadeIn className="mx-auto max-w-xl">
          <SubmitForm
            collegeName={college.name}
            collegeSlug={college.slug}
            defaultQrId={defaultQrId}
            colleges={colleges.map((c) => ({ name: c.name }))}
          />
        </FadeIn>
      </main>
    </div>
  );
}
