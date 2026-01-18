import { NextResponse } from "next/server";
import { approveTeacher } from "@/lib/userStore";

export async function POST(_: Request, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const { teacherId } = await params;
    const teacher = approveTeacher(teacherId);
    return NextResponse.json({ teacher });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

