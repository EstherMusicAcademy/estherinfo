import { NextResponse } from "next/server";
import { listStudentUsers, createStudentUser } from "@/lib/userStore";

export async function GET() {
  const students = listStudentUsers();
  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, displayName, major, birthYear, phone } = body;

    if (!email || !displayName || !major) {
      return NextResponse.json(
        { error: "email, displayName, major는 필수입니다." },
        { status: 400 }
      );
    }

    const student = createStudentUser({
      email,
      displayName,
      major,
      birthYear: birthYear ? Number(birthYear) : undefined,
      phone,
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "학생 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
