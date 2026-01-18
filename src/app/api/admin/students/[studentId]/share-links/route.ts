import { NextResponse } from "next/server";
import { createShareLink, listShareLinksForStudent } from "@/lib/shareLinkStore";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return NextResponse.json({ links: listShareLinksForStudent(studentId) });
}

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const body = (await req.json()) as { expiresAt?: string | null };
    const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;
    const link = createShareLink(studentId, expiresAt);
    return NextResponse.json({ link }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

