import { NextResponse } from "next/server";
import { createStudent, listStudents, updateStudent } from "@/lib/studentStore";

export async function GET() {
  return NextResponse.json({ students: listStudents() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; birthYear?: number; major?: string };
    const student = createStudent({ name: body.name ?? "", birthYear: Number(body.birthYear), major: body.major });
    return NextResponse.json({ student }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      name?: string;
      birthYear?: number;
      major?: string;
      sharedMemo?: string;
      adminMemo?: string;
    };
    if (!body.id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    const student = updateStudent(body.id, {
      name: body.name,
      birthYear: body.birthYear,
      major: body.major,
      sharedMemo: body.sharedMemo,
      adminMemo: body.adminMemo,
    });
    return NextResponse.json({ student });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

