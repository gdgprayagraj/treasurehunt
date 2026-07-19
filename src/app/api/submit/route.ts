import { NextResponse } from "next/server";
import { processSubmission } from "@/lib/submission";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const res = await processSubmission(body);
  if (!res.ok) {
    return NextResponse.json(res, { status: 400 });
  }
  return NextResponse.json(res, { status: 200 });
}
