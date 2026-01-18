import { NextResponse } from "next/server";
import { listStudentsForTeacher } from "@/lib/studentStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId") ?? "";
  if (!teacherId) return NextResponse.json({ error: "teacherId가 필요합니다." }, { status: 400 });
  return NextResponse.json({ students: listStudentsForTeacher(teacherId) });
}

