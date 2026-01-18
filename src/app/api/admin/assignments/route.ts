import { NextResponse } from "next/server";
import { listAssignments, assignStudent, unassignStudent } from "@/lib/studentStore";

export async function GET() {
  return NextResponse.json({ assignments: listAssignments() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { teacherId?: string; studentId?: string };
    assignStudent(body.teacherId ?? "", body.studentId ?? "");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { teacherId?: string; studentId?: string };
    unassignStudent(body.teacherId ?? "", body.studentId ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

