import { NextResponse } from "next/server";
import { getStudentById } from "@/lib/studentStore";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const student = getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ student });
}

