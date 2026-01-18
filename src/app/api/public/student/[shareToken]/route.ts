import { NextResponse } from "next/server";
import { getPublicStudentByToken } from "@/lib/publicStudentService";

export async function GET(_: Request, { params }: { params: Promise<{ shareToken: string }> }) {
  try {
    const { shareToken } = await params;
    const payload = getPublicStudentByToken(shareToken);
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 404 });
  }
}

