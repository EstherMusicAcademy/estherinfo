import { NextResponse } from "next/server";
import { revokeShareLink } from "@/lib/shareLinkStore";

export async function POST(_: Request, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { linkId } = await params;
    const link = revokeShareLink(linkId);
    return NextResponse.json({ link });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

